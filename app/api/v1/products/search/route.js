import { NextResponse } from "next/server";
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
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const name = String(searchParams.get("name") || "").trim();
    const includeInactive = searchParams.get("include_inactive") === "1";

    const where = [];
    const params = [];

    if (!includeInactive) {
      where.push("p.status = 1");
    }

    if (name) {
      const like = `%${name}%`;
      where.push(
        `(p.product_name LIKE ? OR p.product_code LIKE ? OR c.category_name LIKE ? OR b.brand_name LIKE ? OR p.product_description LIKE ?)`,
      );
      params.push(like, like, like, like, like);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
        ${productSelect}
        ${whereClause}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [countRows] = await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        ${whereClause}
      `,
      params,
    );

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    return NextResponse.json({
      success: true,
      products: enrichedRows.map(formatProduct),
      count: rows.length,
      total: countRows[0]?.total || 0,
      limit,
      offset,
      name,
    });
  } catch (error) {
    console.error("PRODUCT SEARCH ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
