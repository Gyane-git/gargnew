import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { assetUrl, formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

const productDetailsSelect = `
  SELECT 
    p.*,
    c.category_name,
    c.parent_id AS category_parent_id,
    c.image AS category_image,
    c.top AS category_top,
    c.status AS category_status,
    b.brand_name,
    b.image AS brand_image,
    b.top AS brand_top,
    b.status AS brand_status
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
`;

const parseVariationAttributes = (attributes) => {
  if (!attributes) return {};
  if (typeof attributes === "object") return attributes;

  try {
    return JSON.parse(attributes);
  } catch {
    return {};
  }
};

const normalizeVariationRow = (row, product) => {
  const attributes = parseVariationAttributes(row.attributes);
  const variationImage = attributes.image || attributes.image_url || row.image_path || row.image || product.main_image || product.main_image_path || null;
  const imageFullUrl = variationImage
    ? assetUrl(variationImage, "uploads/products/variations") || assetUrl(variationImage, "uploads/products") || variationImage
    : product.image_full_url || product.main_image_full_url || null;

  const sellPrice = Number(attributes.sell_price ?? row.sell_price ?? row.price ?? product.sell_price ?? 0);
  const actualPrice = Number(row.price ?? attributes.actual_price ?? product.actual_price ?? 0);
  const availableQty = Number(attributes.available_qty ?? row.available_qty ?? row.stock ?? product.available_quantity ?? 0);
  const stockQty = Number(attributes.stock_qty ?? row.stock_qty ?? row.stock ?? product.stock_quantity ?? 0);

  return {
    id: row.id,
    product_code: row.product_code || product.product_code,
    product_name: attributes.name || row.product_name || product.product_name,
    actual_price: Number.isFinite(actualPrice) ? actualPrice : 0,
    sell_price: Number.isFinite(sellPrice) ? sellPrice : 0,
    discount: Number(attributes.discount ?? row.discount ?? product.discount ?? 0) || 0,
    available_quantity: Number.isFinite(availableQty) ? availableQty : 0,
    stock_quantity: Number.isFinite(stockQty) ? stockQty : 0,
    image_full_url: imageFullUrl,
    main_image_full_url: imageFullUrl,
    image_url: imageFullUrl,
    main_image_url: imageFullUrl,
    attributes,
    sku: row.sku || null,
  };
};

export async function GET(req, { params }) {
  const { product_code } = await params;

  if (!product_code) {
    return NextResponse.json({ success: false, message: "product_code is required" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("include_inactive") === "1";

    const [rows] = await pool.query(
      `${productDetailsSelect}
       WHERE p.product_code = ?
       ${includeInactive ? "" : "AND p.status = 1"}
       LIMIT 1`,
      [product_code],
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const imageMap = await fetchProductImagesMap([product_code]);
    const gallery = imageMap.get(String(product_code)) || [];

    let variations = [];
    try {
      const [variationRows] = await pool.query(
        "SELECT * FROM product_variations WHERE product_code = ? ORDER BY id ASC",
        [product_code],
      );
      const productSnapshot = formatProduct(enrichProductsWithImages(rows, imageMap)[0]);
      variations = variationRows.map((row) => normalizeVariationRow(row, productSnapshot));

      if (Number(productSnapshot.has_variations) === 1 && variations.length === 0) {
        variations = [
          {
            id: `${productSnapshot.product_code}-default`,
            product_code: productSnapshot.product_code,
            product_name: productSnapshot.product_name,
            actual_price: Number(productSnapshot.actual_price || 0),
            sell_price: Number(productSnapshot.sell_price || 0),
            discount: Number(productSnapshot.discount || 0),
            available_quantity: Number(productSnapshot.available_quantity || 0),
            stock_quantity: Number(productSnapshot.stock_quantity || 0),
            image_full_url: productSnapshot.image_full_url || productSnapshot.main_image_full_url || null,
            main_image_full_url: productSnapshot.image_full_url || productSnapshot.main_image_full_url || null,
            image_url: productSnapshot.image_full_url || productSnapshot.main_image_full_url || null,
            main_image_url: productSnapshot.image_full_url || productSnapshot.main_image_full_url || null,
            attributes: { name: productSnapshot.product_name },
            sku: null,
          },
        ];
      }
    } catch {}

    let reviews = [];
    let averageRating = 0;
    try {
      const [reviewRows] = await pool.query(
        "SELECT * FROM product_reviews WHERE product_code = ? ORDER BY id DESC",
        [product_code],
      );
      reviews = reviewRows;
      const ratings = reviewRows
        .map((review) => Number(review.rating || review.rating_value || 0))
        .filter((rating) => rating > 0);
      averageRating = ratings.length
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;
    } catch {}

    const product = formatProduct(enrichProductsWithImages(rows, imageMap)[0]);

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        gallery,
        images: gallery,
        variations,
        reviews,
        review_count: reviews.length,
        average_rating: averageRating,
      },
    });
  } catch (error) {
    console.error("GET PRODUCT DETAILS ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
