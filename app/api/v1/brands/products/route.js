import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // Get brand name
    const [brandRows] = await pool.query("SELECT brand_name FROM brands WHERE id = ?", [id]);

    if (brandRows.length === 0) {
      return Response.json({ success: false, message: "Brand not found" }, { status: 404 });
    }

    const [products] = await pool.query("SELECT * FROM products WHERE brand_id = ? AND status = 1", [id]);
    const imageMap = await fetchProductImagesMap(products.map((product) => product.product_code));
    const enrichedProducts = enrichProductsWithImages(products, imageMap);

    return Response.json({
      success: true,
      brand_name: brandRows[0].brand_name,
      products: enrichedProducts.map(formatProduct),
    });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
