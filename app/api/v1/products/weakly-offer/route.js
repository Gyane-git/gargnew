import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE weakly_offer = 1");

    if (rows.length === 0) {
      return Response.json({ success: false, message: "No weakly offer product found" }, { status: 404 });
    }

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    return Response.json({
      success: true,
      products: enrichedRows.map(formatProduct),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
