import pool from "@/utils/db";
import { buildCategoryTree } from "@/utils/apiFormatters";

/**
 * @swagger
 * /api/v1/categories/top-categories:
 *   get:
 *     summary: List top-level "featured" categories
 *     description: Builds the active-category tree (status=1) and returns only the
 *       root-level nodes flagged as top (top=1). No authentication is enforced.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Top categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 categories:
 *                   type: array
 *                   description: Root categories with top=1, including nested
 *                     children/active_children and image_full_url/image_url.
 *                   items: { type: object }
 *       500:
 *         description: Server error
 */
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM categories WHERE status = 1 ORDER BY id ASC");
    const categories = buildCategoryTree(rows, { onlyActive: true }).filter((category) => Number(category.top) === 1);

    return Response.json({
      success: true,
      categories,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
