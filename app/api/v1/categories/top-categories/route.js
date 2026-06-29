import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM categories WHERE top = 1");

    if (rows.length === 0) {
      return Response.json({ success: false, message: "No top categories found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      categories: rows,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
