import pool from "@/utils/db";
// import { buildCategoryTree } from "@/utils/apiFormatters";
import { buildCategoryTree, formatCategoryRows } from "@/utils/apiFormatters";

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
// export async function GET() {
//   try {
//     const [rows] = await pool.query("SELECT * FROM categories WHERE status = 1 ORDER BY id ASC");
//     const categories = buildCategoryTree(rows, { onlyActive: true }).filter((category) => Number(category.top) === 1);

//     return Response.json({
//       success: true,
//       categories,
//     });
//   } catch (error) {
//     return Response.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.*,
        s.id AS storage_id,
        s.data_type,
        s.data_id,
        s.key,
        s.value,
        s.created_at AS storage_created_at,
        s.updated_at AS storage_updated_at
      FROM categories c
      LEFT JOIN storages s
        ON s.data_id = c.id
      
      WHERE c.status = 1
      ORDER BY c.id ASC
    `);

    const formattedCategories = formatCategoryRows(rows);

    const formattedMap = new Map(formattedCategories.map((category) => [category.id, category]));

    const categoryMap = new Map();

    for (const row of rows) {
      if (!categoryMap.has(row.id)) {
        categoryMap.set(row.id, {
          ...formattedMap.get(row.id),
          storage: [],
        });
      }

      if (row.storage_id) {
        categoryMap.get(row.id).storage.push({
          id: row.storage_id,
          data_type: row.data_type,
          data_id: row.data_id,
          key: row.key,
          value: row.value,
          created_at: row.storage_created_at,
          updated_at: row.storage_updated_at,
        });
      }
    }

    const categoryRows = [...categoryMap.values()];

    const categories = buildCategoryTree(categoryRows, {
      onlyActive: true,
    }).filter((category) => Number(category.top) === 1);

    return Response.json({
      success: true,
      message: "Categories fetched successfully.",
      categories,
    });
  } catch (error) {
    console.error("GET TOP CATEGORIES ERROR:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
