import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE special_offer = 1");

    if (rows.length === 0) {
      return Response.json({ success: false, message: "No special offer product found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      products: rows,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
