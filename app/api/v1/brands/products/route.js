import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

/**
 * @swagger
 * /api/v1/brands/products:
 *   get:
 *     summary: List active products for a brand
 *     description: NOTE - this route lives at the static path /api/v1/brands/products
 *       (the folder has no dynamic [id] segment), yet the handler destructures `id`
 *       from `params`, which Next.js will always resolve to undefined here. As
 *       currently routed this endpoint cannot receive a brand id and will always fall
 *       through to the 404 "Brand not found" response; it appears to be a leftover or
 *       misplaced file (likely intended as /api/v1/brands/{id}/products). Documented
 *       as-is, without changing the route. No authentication is enforced.
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Products for the brand retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 brand_name: { type: string }
 *                 products:
 *                   type: array
 *                   description: Active products for the brand, formatted via
 *                     formatProduct and enriched with additional images.
 *                   items: { type: object }
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
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
