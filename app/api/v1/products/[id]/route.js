import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import pool from "@/utils/db";
import { assetUrl, formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

const productSelect = `
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
  const variationImage =
    attributes.image ||
    attributes.image_url ||
    row.image_path ||
    row.image ||
    product.main_image ||
    product.main_image_path ||
    null;
  const imageFullUrl = variationImage
    ? assetUrl(variationImage, "uploads/products/variations") ||
      assetUrl(variationImage, "uploads/products") ||
      variationImage
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
  const { id } = await params;
  try {
    const [rows] = await pool.query(
      `${productSelect}
       WHERE p.id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const imageMap = await fetchProductImagesMap([rows[0].product_code]);
    const productSnapshot = formatProduct(enrichProductsWithImages(rows, imageMap)[0]);

    let variations = [];
    try {
      const [variationRows] = await pool.query(
        "SELECT * FROM product_variations WHERE product_code = ? ORDER BY id ASC",
        [productSnapshot.product_code],
      );
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
            attributes: {
              name: productSnapshot.product_name,
              image: productSnapshot.main_image || productSnapshot.main_image_path || null,
              sell_price: Number(productSnapshot.sell_price || 0),
              available_qty: Number(productSnapshot.available_quantity || 0),
              actual_price: Number(productSnapshot.actual_price || 0),
              stock_qty: Number(productSnapshot.stock_quantity || 0),
            },
            sku: null,
          },
        ];
      }
    } catch {}

    return NextResponse.json({ success: true, product: { ...productSnapshot, variations } });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = await params;
  try {
    const formData = await req.formData();

    const product_name = formData.get("product_name");
    const product_code = formData.get("product_code");
    const slug = formData.get("slug") || "";
    const product_description = formData.get("product_description") || "";
    const key_specifications = formData.get("key_specifications") || "";
    const packaging = formData.get("packaging") || "";
    const warranty = formData.get("warranty") || "";
    const category_id = formData.get("category_id");
    const brand_id = formData.get("brand_id");
    const delivery_target_days = formData.get("delivery_target_days") || null;
    let actual_price = formData.get("actual_price") || 0;
    let sell_price = formData.get("sell_price") || 0;
    const discount = formData.get("discount") || 0;
    let available_quantity = formData.get("available_quantity") || 0;
    let stock_quantity = formData.get("stock_quantity") || 0;
    const product_location = formData.get("product_location") || "";
    const has_variations = formData.get("has_variations") ?? 0;
    const flash_sale = formData.get("flash_sale") ?? 0;
    const weekly_offer = formData.get("weekly_offer") ?? 0;
    const special_offer = formData.get("special_offer") ?? 0;
    const today_deals = formData.get("today_deals") ?? 0;
    const status = formData.get("status") ?? 1;
    const existing_image = formData.get("existing_image") || "";
    const existing_catalogue = formData.get("existing_catalogue") || "";
    const remove_image = formData.get("remove_image") === "1";
    const imageFile = formData.get("main_image");
    const catalogueFile = formData.get("product_catalogue");
    const galleryImages = formData.getAll("gallery_images").filter((file) => file && typeof file === "object" && file.size > 0);

    if (!product_name) {
      return NextResponse.json({ success: false, message: "Product name is required" }, { status: 400 });
    }

    let imagePath = existing_image;

    if (remove_image) {
      imagePath = "";
      if (existing_image?.startsWith("/uploads/")) {
        try {
          await unlink(path.join(process.cwd(), "public", existing_image));
        } catch {}
      }
    }

    if (imageFile && typeof imageFile === "object" && imageFile.size > 0) {
      if (existing_image?.startsWith("/uploads/")) {
        try {
          await unlink(path.join(process.cwd(), "public", existing_image));
        } catch {}
      }
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${imageFile.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/products");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      imagePath = `/uploads/products/${fileName}`;
    }

    let cataloguePath = existing_catalogue;
    const galleryPaths = [];

    if (catalogueFile && typeof catalogueFile === "object" && catalogueFile.size > 0) {
      const bytes = await catalogueFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${catalogueFile.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/catalogues");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      cataloguePath = `/uploads/catalogues/${fileName}`;
    }

    for (const galleryImage of galleryImages) {
      const bytes = await galleryImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${galleryImage.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/products");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      galleryPaths.push(`/uploads/products/${fileName}`);
    }

    const categoryIdValue = !category_id || category_id === "" || category_id === "null" ? null : Number(category_id);
    const brandIdValue = !brand_id || brand_id === "" || brand_id === "null" ? null : Number(brand_id);

    let variations = [];
    const variationsJson = formData.get("variations");
    if (Number(has_variations) === 1 && variationsJson) {
      try {
        variations = JSON.parse(variationsJson);
        if (!Array.isArray(variations)) throw new Error("not an array");
      } catch {
        return NextResponse.json({ success: false, message: "Invalid variations payload" }, { status: 400 });
      }
    }

    if (Number(has_variations) === 1 && variations.length > 0) {
      const actualPrices = variations.map((v) => Number(v.actual_price || 0)).filter((n) => n > 0);
      const sellPrices = variations.map((v) => Number(v.sell_price || 0)).filter((n) => n > 0);
      const availableQtyTotal = variations.reduce((sum, v) => sum + Number(v.available_qty || 0), 0);
      const stockQtyTotal = variations.reduce((sum, v) => sum + Number(v.stock_qty || 0), 0);

      if (actualPrices.length) {
        actual_price = Math.max(...actualPrices);
      }
      if (sellPrices.length) {
        sell_price = Math.min(...sellPrices);
      }
      available_quantity = availableQtyTotal;
      stock_quantity = stockQtyTotal;
    }

    await pool.query(
      `UPDATE products SET
        product_name = ?, product_code = ?, slug = ?,
        product_description = ?, key_specifications = ?,
        packaging = ?, warranty = ?, category_id = ?, brand_id = ?,
        delivery_target_days = ?, actual_price = ?, sell_price = ?,
        discount = ?, available_quantity = ?, stock_quantity = ?,
        product_location = ?, has_variations = ?, flash_sale = ?,
        weekly_offer = ?, special_offer = ?, today_deals = ?,
        status = ?, main_image = ?, product_catalogue = ?
      WHERE id = ?`,
      [product_name, product_code, slug, product_description, key_specifications, packaging, warranty, categoryIdValue, brandIdValue, delivery_target_days, actual_price, sell_price, discount, available_quantity, stock_quantity, product_location, has_variations, flash_sale, weekly_offer, special_offer, today_deals, status, imagePath, cataloguePath, id],
    );

    if (Number(has_variations) === 1) {
      await pool.query("DELETE FROM product_variations WHERE product_code = ?", [product_code]);

      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i] || {};
        const variationImageFile = formData.get(`variation_image_${i}`);
        let variationImage = variation.imagePath || variation.image || variation.image_path || "";

        if (variationImageFile && typeof variationImageFile === "object" && variationImageFile.size > 0) {
          const bytes = await variationImageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const fileName = `${Date.now()}-${variationImageFile.name}`;
          const uploadDir = path.join(process.cwd(), "public/uploads/products/variations");
          await mkdir(uploadDir, { recursive: true });
          await writeFile(path.join(uploadDir, fileName), buffer);
          variationImage = `/uploads/products/variations/${fileName}`;
        }

        await pool.query(
          `INSERT INTO product_variations (product_code, attributes, price, stock, sku, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            product_code,
            JSON.stringify({
              name: variation.name || "",
              image: variationImage,
              sell_price: Number(variation.sell_price || 0),
              available_qty: Number(variation.available_qty || 0),
              actual_price: Number(variation.actual_price || 0),
              stock_qty: Number(variation.stock_qty || 0),
            }),
            Number(variation.actual_price || 0),
            Number(variation.stock_qty || 0),
            variation.sku || `${product_code}-${i + 1}`,
          ],
        );
      }
    }

    if (galleryPaths.length > 0) {
      for (const galleryPath of galleryPaths) {
        await pool.query(
          `INSERT INTO product_images (product_code, image_path, created_at, updated_at)
           VALUES (?, ?, NOW(), NOW())`,
          [product_code, galleryPath],
        );
      }
    }

    return NextResponse.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("PUT PRODUCT ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;

  try {
    const body = await req.json();
    const status = body?.status === 1 || body?.status === "1" ? 1 : 0;

    const [result] = await pool.query("UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?", [status, id]);

    if (!result.affectedRows) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: status === 1 ? "Product published successfully" : "Product unpublished successfully",
      status,
    });
  } catch (error) {
    console.error("PATCH PRODUCT STATUS ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  let conn;
  try {
    conn = await pool.getConnection();
  } catch (connErr) {
    console.error("DB connection failed:", connErr.message);
    return NextResponse.json({ success: false, message: "DB connection failed" }, { status: 500 });
  }

  try {
    await conn.beginTransaction();

    // 1. Get product_code and main_image — all child tables use product_code
    const [productRows] = await conn.query("SELECT product_code, main_image FROM products WHERE id = ?", [id]);

    if (productRows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const { product_code, main_image } = productRows[0];

    // 2. Collect gallery image paths before deleting
    let galleryImages = [];
    try {
      const [imgRows] = await conn.query("SELECT image_path FROM product_images WHERE product_code = ?", [product_code]);
      galleryImages = imgRows.map((r) => r.image_path);
    } catch {}

    // 3. Delete all child rows using product_code
    //    cart_items has a real FK constraint — must be deleted first
    const childTables = [
      "cart_items", // ← has FK constraint on product_code
      "order_items",
      "product_images",
      "product_reviews",
      "product_variations",
      "recommended_products",
      "wishlist",
    ];

    for (const table of childTables) {
      try {
        await conn.query(`DELETE FROM ${table} WHERE product_code = ?`, [product_code]);
      } catch (err) {
        if (err.code !== "ER_NO_SUCH_TABLE") {
          console.error(`Error deleting from ${table}:`, err.message);
        }
      }
    }

    // 4. Now safe to delete the product itself
    await conn.query("DELETE FROM products WHERE id = ?", [id]);

    await conn.commit();

    // 5. Delete image files from disk after successful DB commit
    const filesToDelete = [...(main_image ? [main_image] : []), ...galleryImages];

    for (const filePath of filesToDelete) {
      if (!filePath) continue;
      // Handle both /uploads/... paths and bare filenames stored in product_images
      const fullPath = filePath.startsWith("/") ? path.join(process.cwd(), "public", filePath) : path.join(process.cwd(), "public/uploads/products", filePath);
      try {
        await unlink(fullPath);
      } catch {
        // File already gone — ignore
      }
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {}
    console.error("DELETE PRODUCT ERROR:", error.message, "| code:", error.code);
    return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: 500 });
  } finally {
    conn.release();
  }
}
