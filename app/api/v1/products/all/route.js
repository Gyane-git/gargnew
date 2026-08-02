import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

/**
 * @swagger
 * /api/v1/products/all:
 *   get:
 *     summary: List products, unpaginated by default
 *     description: >
 *       Same shape as GET /api/v1/products, except pagination is only applied when a
 *       "limit" or "offset" query param is actually present in the request - if neither
 *       is supplied, ALL matching rows are returned (no implicit default limit) and the
 *       response omits the limit/offset fields. By default only active products
 *       (status = 1) are returned; pass include_inactive=1 to include all. No API-layer
 *       authentication is enforced.
 *     tags: [Products]
 *     parameters:
 *       - { name: limit, in: query, required: false, schema: { type: integer, maximum: 100 }, description: "If provided (together with offset having a default of 0), enables pagination; capped at 100." }
 *       - { name: offset, in: query, required: false, schema: { type: integer, default: 0 } }
 *       - { name: include_inactive, in: query, required: false, schema: { type: string, enum: ["1"] }, description: Pass "1" to include products with status != 1. }
 *     responses:
 *       200:
 *         description: Products retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 products: { type: array, items: { type: object } }
 *                 count: { type: integer }
 *                 total: { type: integer }
 *                 limit: { type: integer, description: Only present when pagination was requested. }
 *                 offset: { type: integer, description: Only present when pagination was requested. }
 *       500: { description: Internal error. }
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shouldPaginate = searchParams.has("limit") || searchParams.has("offset");
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 20 });
    const includeInactive = searchParams.get("include_inactive") === "1";
    const where = includeInactive ? "" : "WHERE p.status = 1";
    const paginationSql = shouldPaginate ? "LIMIT ? OFFSET ?" : "";
    const params = shouldPaginate ? [limit, offset] : [];

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
       ${where}
       ORDER BY p.id DESC
       ${paginationSql}`,
      params,
    );

    const [[totalRow]] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${where}`);

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    return NextResponse.json({
      success: true,
      products: enrichedRows.map(formatProduct),
      count: rows.length,
      total: totalRow.total,
      ...(shouldPaginate ? { limit, offset } : {}),
    });
  } catch (error) {
    console.error("GET ALL PRODUCTS ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
