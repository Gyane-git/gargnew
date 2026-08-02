import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

/**
 * @swagger
 * /api/v1/products/flash-sale:
 *   get:
 *     summary: List active flash-sale products
 *     description: Returns products where flash_sale = 1, joined with category and brand
 *       info and enriched with gallery images. By default only active products
 *       (status = 1) are included; pass include_inactive=1 to also include inactive ones.
 *       Public endpoint, no authentication required.
 *     tags: [Products]
 *     parameters:
 *       - { name: limit, in: query, required: false, schema: { type: integer, default: 10 }, description: "Max rows to return (parsePagination default 10, capped at 100)" }
 *       - { name: offset, in: query, required: false, schema: { type: integer, default: 0 } }
 *       - { name: include_inactive, in: query, required: false, schema: { type: string, enum: ["1"] }, description: "Pass \"1\" to also include products with status != 1" }
 *     responses:
 *       200:
 *         description: Flash-sale products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 products: { type: array, items: { type: object }, description: "Formatted product rows (see formatProduct), each including brand/category sub-objects and gallery image fields" }
 *                 count: { type: integer, description: Number of rows in this page }
 *                 total: { type: integer, description: Total matching rows (ignores limit/offset) }
 *                 limit: { type: integer }
 *                 offset: { type: integer }
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
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const includeInactive = searchParams.get("include_inactive") === "1";

    const [rows] = await pool.query(
      `SELECT 
        p.*,
        c.category_name,
        c.parent_id AS category_parent_id,
        c.image AS category_image,
        c.top AS category_top,
        c.status AS category_status,
        b.brand_name,
        b.image AS brand_image,
        b.top AS brand_top,
        b.status AS brand_status
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.flash_sale = 1
       ${includeInactive ? "" : "AND p.status = 1"}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const [[totalRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p WHERE p.flash_sale = 1 ${includeInactive ? "" : "AND p.status = 1"}`,
    );

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    return Response.json({
      success: true,
      products: enrichedRows.map(formatProduct),
      count: rows.length,
      total: totalRow.total,
      limit,
      offset,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
