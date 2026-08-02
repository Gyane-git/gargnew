import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

const productSelect = `
  SELECT
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
`;

/**
 * @swagger
 * /api/v1/products/search:
 *   get:
 *     summary: Search products by name, code, category, brand, or description
 *     description: >
 *       When name is provided, matches products where product_name,
 *       product_code, category_name, brand_name, or product_description LIKE
 *       "%name%". By default only active products (status = 1) are included; pass
 *       include_inactive=1 to include inactive ones too. The response nests results
 *       under products.products (with products.total_size), matching Laravel's
 *       ProductController::get_searched_products shape - this is NOT a flat
 *       products array at the top level. Public endpoint, no authentication required.
 *     tags: [Products]
 *     parameters:
 *       - { name: name, in: query, required: false, schema: { type: string }, description: "Substring search term; omit or leave blank to match all products" }
 *       - { name: limit, in: query, required: false, schema: { type: integer, default: 10 }, description: "parsePagination default 10, capped at 100" }
 *       - { name: offset, in: query, required: false, schema: { type: integer, default: 0 } }
 *       - { name: include_inactive, in: query, required: false, schema: { type: string, enum: ["1"] }, description: "Pass \"1\" to also include products with status != 1" }
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Products fetched successfully." }
 *                 products:
 *                   type: object
 *                   description: Nested search result wrapper (not a flat array)
 *                   properties:
 *                     total_size: { type: integer, description: Total matching rows (ignores limit/offset) }
 *                     products: { type: array, items: { type: object }, description: "Formatted product rows for this page (see formatProduct)" }
 *                 count: { type: integer, description: Number of rows in this page }
 *                 total: { type: integer, description: Same as products.total_size }
 *                 limit: { type: integer }
 *                 offset: { type: integer }
 *                 name: { type: string, description: Echo of the trimmed `name` query param }
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
    const name = String(searchParams.get("name") || "").trim();
    const includeInactive = searchParams.get("include_inactive") === "1";

    const where = [];
    const params = [];

    if (!includeInactive) {
      where.push("p.status = 1");
    }

    if (name) {
      const like = `%${name}%`;
      where.push(
        `(p.product_name LIKE ? OR p.product_code LIKE ? OR c.category_name LIKE ? OR b.brand_name LIKE ? OR p.product_description LIKE ?)`,
      );
      params.push(like, like, like, like, like);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
        ${productSelect}
        ${whereClause}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [countRows] = await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        ${whereClause}
      `,
      params,
    );

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);
    const total = countRows[0]?.total || 0;

    // Nested under `products.products` to match Laravel's ProductController::get_searched_products
    // (`'products' => ['total_size' => ..., 'products' => [...]]`). Both web call sites
    // (components/SearchBar.js, app/Search-bar/page.js) already read `res.products?.products`
    // expecting this nested shape - the previous flat `products: [...]` here meant search
    // suggestions were silently broken on the live site; this fixes that bug and achieves
    // Laravel parity in the same change.
    return NextResponse.json({
      success: true,
      message: "Products fetched successfully.",
      products: {
        total_size: total,
        products: enrichedRows.map(formatProduct),
      },
      count: rows.length,
      total,
      limit,
      offset,
      name,
    });
  } catch (error) {
    console.error("PRODUCT SEARCH ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
