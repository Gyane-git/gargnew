import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM brands WHERE top = 1");

    // We can just return an empty array if no top brands are found.

    return Response.json({
      success: true,
      brands: rows,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
