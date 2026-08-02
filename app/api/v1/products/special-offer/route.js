import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

/**
 * @swagger
 * /api/v1/products/special-offer:
 *   get:
 *     summary: List products flagged as special offer
 *     description: Returns all products where special_offer = 1 (no status/active filter
 *       is applied), enriched with gallery images. No query parameters. Public endpoint,
 *       no authentication required.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Special offer products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 products: { type: array, items: { type: object }, description: "Formatted product rows (see formatProduct)" }
 *       404:
 *         description: No special offer product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string, example: "No special offer product found" }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string }
 */
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE special_offer = 1");

    if (rows.length === 0) {
      return Response.json({ success: false, message: "No special offer product found" }, { status: 404 });
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
