import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

const collectCategoryIds = (rows, categoryId) => {
  const targetId = Number(categoryId);
  const childrenByParent = new Map();

  rows.forEach((row) => {
    const parentId = row.parent_id == null ? null : Number(row.parent_id);
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(Number(row.id));
  });

  const ids = new Set([targetId]);
  const stack = [targetId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    const children = childrenByParent.get(currentId) || [];

    children.forEach((childId) => {
      if (!ids.has(childId)) {
        ids.add(childId);
        stack.push(childId);
      }
    });
  }

  return Array.from(ids);
};

/**
 * @swagger
 * /api/v1/products/category-wise-products:
 *   get:
 *     summary: List products for a category and all its descendant categories (paginated)
 *     description: >
 *       Same shape as GET /api/v1/products, filtered to category_id plus every category
 *       recursively nested under it (via categories.parent_id). By default only active
 *       products (status = 1) are returned; pass include_inactive=1 to include all. No
 *       API-layer authentication is enforced.
 *     tags: [Products]
 *     parameters:
 *       - { name: category_id, in: query, required: true, schema: { type: integer } }
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
 *       400: { description: category_id is required. }
 *       500: { description: Internal error. }
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const includeInactive = searchParams.get("include_inactive") === "1";

    if (!categoryId) {
      return NextResponse.json({ success: false, message: "category_id is required" }, { status: 400 });
    }

    const [categoryRows] = await pool.query("SELECT id, parent_id FROM categories");
    const categoryIds = collectCategoryIds(categoryRows, categoryId);
    const placeholders = categoryIds.map(() => "?").join(", ");

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
       WHERE p.category_id IN (${placeholders})
       ${includeInactive ? "" : "AND p.status = 1"}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...categoryIds, limit, offset],
    );

    const [[totalRow]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM products p
       WHERE p.category_id IN (${placeholders})
       ${includeInactive ? "" : "AND p.status = 1"}`,
      categoryIds,
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
  } catch (error) {
    console.error("category-wise-products error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
