import pool from "@/utils/db";
import { formatBrand } from "@/utils/apiFormatters";

/**
 * @swagger
 * /api/v1/brands/top-brands:
 *   get:
 *     summary: List top/featured active brands
 *     description: Returns brands where top=1 and status=1, ordered by order_wise
 *       then id descending. No authentication is enforced.
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Top brands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 brands:
 *                   type: array
 *                   description: Brand rows with image_full_url/image_url/logo_full_url
 *                     derived from the stored image path.
 *                   items: { type: object }
 *       500:
 *         description: Server error
 */
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM brands WHERE top = 1 AND status = 1 ORDER BY COALESCE(order_wise, 999999), id DESC");

    return Response.json({
      success: true,
      brands: rows.map(formatBrand),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
