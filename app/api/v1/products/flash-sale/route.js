import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE flash_sale = 1");

    if (rows.length === 0) {
      return Response.json({ success: false, message: "No flash sale product found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      products: rows,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
