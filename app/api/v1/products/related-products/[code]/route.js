import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

/**
 * @swagger
 * /api/v1/products/related-products/{code}:
 *   get:
 *     summary: Get a product plus related products sharing its category or brand
 *     description: Looks up the product by product_code, then finds other products that
 *       share its category_id and/or brand_id (ordered so category+brand matches rank
 *       first, then category-only, then brand-only), excluding the product itself. By
 *       default only active related products (status = 1) are included; pass
 *       include_inactive=1 to include inactive ones too. Public endpoint, no
 *       authentication required.
 *     tags: [Products]
 *     parameters:
 *       - { name: code, in: path, required: true, schema: { type: string }, description: product_code to look up }
 *       - { name: limit, in: query, required: false, schema: { type: integer, default: 10 }, description: "parsePagination default 10, capped at 100" }
 *       - { name: offset, in: query, required: false, schema: { type: integer, default: 0 } }
 *       - { name: include_inactive, in: query, required: false, schema: { type: string, enum: ["1"] }, description: "Pass \"1\" to also include inactive related products" }
 *     responses:
 *       200:
 *         description: Product and related products retrieved successfully. If the product
 *           has neither a category_id nor a brand_id, related_products is an empty array
 *           and count/total are 0.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 product: { type: object, description: Formatted target product (see formatProduct) }
 *                 related_products: { type: array, items: { type: object } }
 *                 count: { type: integer, description: Number of related rows in this page }
 *                 total: { type: integer, description: Total matching related rows (ignores limit/offset) }
 *                 limit: { type: integer }
 *                 offset: { type: integer }
 *       400:
 *         description: product code is required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
export async function GET(req, { params }) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(req.url);
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const includeInactive = searchParams.get("include_inactive") === "1";

    if (!code) {
      return NextResponse.json({ success: false, message: "product code is required" }, { status: 400 });
    }

    const [productRows] = await pool.query(
      `SELECT p.*,
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
       WHERE p.product_code = ?
       LIMIT 1`,
      [code],
    );

    if (productRows.length === 0) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const product = productRows[0];
    const filters = [];
    const paramsList = [];

    if (product.category_id) {
      filters.push("p.category_id = ?");
      paramsList.push(product.category_id);
    }

    if (product.brand_id) {
      filters.push("p.brand_id = ?");
      paramsList.push(product.brand_id);
    }

    if (!filters.length) {
      return NextResponse.json({
        success: true,
        product: formatProduct(product),
        related_products: [],
        count: 0,
        total: 0,
        limit,
        offset,
      });
    }

    const whereClause = filters.map((item) => `(${item})`).join(" OR ");

    const [rows] = await pool.query(
      `SELECT p.*,
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
       WHERE (${whereClause})
         AND p.product_code <> ?
         ${includeInactive ? "" : "AND p.status = 1"}
       ORDER BY
         CASE
           WHEN p.category_id = ? AND p.brand_id = ? THEN 1
           WHEN p.category_id = ? THEN 2
           WHEN p.brand_id = ? THEN 3
           ELSE 4
         END,
         p.id DESC
       LIMIT ? OFFSET ?`,
      [
        ...paramsList,
        code,
        product.category_id,
        product.brand_id,
        product.category_id,
        product.brand_id,
        limit,
        offset,
      ],
    );

    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM products p
       WHERE (${whereClause})
         AND p.product_code <> ?
         ${includeInactive ? "" : "AND p.status = 1"}`,
      [...paramsList, code],
    );

    const imageMap = await fetchProductImagesMap([product.product_code, ...rows.map((row) => row.product_code)]);
    const enrichedProduct = enrichProductsWithImages([product], imageMap)[0];
    const enrichedRelated = enrichProductsWithImages(rows, imageMap);

    return NextResponse.json({
      success: true,
      product: formatProduct(enrichedProduct),
      related_products: enrichedRelated.map(formatProduct),
      count: rows.length,
      total: totalRows[0]?.total || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("related-products error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
