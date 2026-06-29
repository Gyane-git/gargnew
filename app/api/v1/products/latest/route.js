import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const includeInactive = searchParams.get("include_inactive") === "1";

    const [rows] = await pool.query(`
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
      ${includeInactive ? "" : "WHERE p.status = 1"}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return NextResponse.json({
      success: true,
      products: rows.map(formatProduct),
      count: rows.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET LATEST PRODUCTS ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
