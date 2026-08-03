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
// export async function GET() {
//   try {
//     const [rows] = await pool.query("SELECT * FROM brands WHERE top = 1 AND status = 1 ORDER BY COALESCE(order_wise, 999999), id DESC");

//     return Response.json({
//       success: true,
//       message: "Brands fetched sucecssfully.",
//       brands: rows.map(formatBrand),
//     });
//   } catch (error) {
//     return Response.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        b.*,
        s.id AS storage_id,
        s.data_type,
        s.data_id,
        s.key,
        s.value,
        s.created_at AS storage_created_at,
        s.updated_at AS storage_updated_at
      FROM brands b
      LEFT JOIN storages s
        ON s.data_id = b.id
      WHERE b.top = 1
        AND b.status = 1
      ORDER BY COALESCE(b.order_wise, 999999), b.id DESC
    `);

    const brandsMap = new Map();

    for (const row of rows) {
      if (!brandsMap.has(row.id)) {
        brandsMap.set(row.id, {
          id: row.id,
          brand_name: row.brand_name,
          image: row.image,
          top: row.top,
          status: row.status,
          order_wise: row.order_wise,
          created_at: row.created_at,
          updated_at: row.updated_at,
          image_full_url: formatBrand(row).image_full_url,
          storage: [],
        });
      }

      if (row.storage_id) {
        brandsMap.get(row.id).storage.push({
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

    return Response.json({
      success: true,
      message: "Brands fetched successfully.",
      brands: [...brandsMap.values()],
    });

    return Response.json({
      success: true,
      message: "Brands fetched successfully.",
      brands: [...brandsMap.values()],
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
