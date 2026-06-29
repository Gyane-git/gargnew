import pool from "@/utils/db";
import { formatBrand } from "@/utils/apiFormatters";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM brands WHERE top = 1 AND status = 1 ORDER BY COALESCE(order_wise, 999999), id DESC");

    // We can just return an empty array if no top brands are found.

    return Response.json({
      success: true,
      brands: rows.map(formatBrand),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
