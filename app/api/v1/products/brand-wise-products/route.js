import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

/**
 * @swagger
 * /api/v1/products/brand-wise-products:
 *   get:
 *     summary: List products for a given brand (paginated)
 *     description: >
 *       Same shape as GET /api/v1/products, filtered to a single brand_id. By default
 *       only active products (status = 1) are returned; pass include_inactive=1 to
 *       include all. No API-layer authentication is enforced.
 *     tags: [Products]
 *     parameters:
 *       - { name: brand_id, in: query, required: true, schema: { type: integer } }
 *       - { name: limit, in: query, required: false, schema: { type: integer, default: 10, maximum: 100 } }
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
 *                 limit: { type: integer }
 *                 offset: { type: integer }
 *       400: { description: brand_id is required. }
 *       500: { description: Internal server error. }
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const brand_id = searchParams.get("brand_id");
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const includeInactive = searchParams.get("include_inactive") === "1";

    if (!brand_id) {
      return NextResponse.json({ success: false, message: "brand_id is required" }, { status: 400 });
    }

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
       WHERE p.brand_id = ?
       ${includeInactive ? "" : "AND p.status = 1"}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [brand_id, limit, offset],
    );

    const [[totalRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p WHERE p.brand_id = ? ${includeInactive ? "" : "AND p.status = 1"}`,
      [brand_id],
    );

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    return NextResponse.json({
      success: true,
      products: enrichedRows.map(formatProduct),
      count: rows.length,
      total: totalRow.total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("brand-wise-products error:", err);

    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
