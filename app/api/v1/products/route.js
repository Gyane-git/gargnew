import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 20 });
    const includeInactive = searchParams.get("include_inactive") === "1";
    const where = includeInactive ? "" : "WHERE p.status = 1";

    const [rows] = await pool.query(`
      ${productSelect}
      ${where}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [[totalRow]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM products p
      ${where}
    `);

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    return NextResponse.json({
      success: true,
      products: enrichedRows.map(formatProduct),
      count: rows.length,
      total: totalRow.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const product_name = formData.get("product_name") || formData.get("name");
    const product_code = formData.get("product_code");
    const category_id = formData.get("category_id");
    const actual_price = formData.get("actual_price") || 0;
    const sell_price = formData.get("sell_price") || 0;
    const discount = formData.get("discount") || 0;
    const available_quantity = formData.get("available_quantity") || 0;
    const stock_quantity = formData.get("stock_quantity") || 0;
    const status = formData.get("status") ?? 1;
    const image = formData.get("main_image") || formData.get("image");

    if (!product_name) {
      return NextResponse.json({ success: false, message: "Product name is required" }, { status: 400 });
    }

    // product_code is NOT NULL in schema
    if (!product_code) {
      return NextResponse.json({ success: false, message: "Product code is required" }, { status: 400 });
    }

    let imagePath = "";

    // IMAGE HANDLING
    if (image && typeof image === "object" && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${image.name}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/products");
      const filePath = path.join(uploadDir, fileName);

      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, buffer);

      imagePath = `/uploads/products/${fileName}`;
    }

    const categoryIdValue = !category_id || category_id === "" || category_id === "null" ? null : Number(category_id);

    await pool.query(
      `INSERT INTO products
        (product_code, product_name, category_id, main_image,
         actual_price, sell_price, discount,
         available_quantity, stock_quantity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_code, product_name, categoryIdValue, imagePath, actual_price, sell_price, discount, available_quantity, stock_quantity, status],
    );

    const imageMap = await fetchProductImagesMap([product_code]);
    const [insertedRows] = await pool.query("SELECT * FROM products WHERE product_code = ? LIMIT 1", [product_code]);
    const insertedProduct = insertedRows[0] ? enrichProductsWithImages(insertedRows, imageMap)[0] : null;

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product: insertedProduct ? formatProduct(insertedProduct) : null,
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
