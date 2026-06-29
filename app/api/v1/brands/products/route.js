import pool from "@/utils/db";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // Get brand name
    const [brandRows] = await pool.query("SELECT brand_name FROM brands WHERE id = ?", [id]);

    if (brandRows.length === 0) {
      return Response.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    // Get products for this brand
    const [products] = await pool.query("SELECT * FROM products WHERE brand_id = ? AND status = 1", [id]);

    if (products.length === 0) {
      return Response.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      brand_name: brandRows[0].brand_name,
      products,
    });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
