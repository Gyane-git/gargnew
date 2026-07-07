import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
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
      variations = variationRows;
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
