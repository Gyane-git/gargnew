import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";
import { getAuthUser } from "@/utils/authUser";

// Same recursive descendant-collection approach as products/category-wise-products/route.js
// (kept local/duplicated rather than extracted, to avoid touching that existing working route).
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
 * /api/v1/products/category/{categoryId}:
 *   get:
 *     summary: List active top-level products in a category and its descendant categories
 *     description: Mirrors Laravel ProductController::getByCategory (API\V1) - path-param
 *       variant of the existing query-param /products/category-wise-products endpoint.
 *       limit/offset are optional (no validation), unlike category-wise-products.
 *     tags: [Products]
 *     parameters:
 *       - { name: categoryId, in: path, required: true, schema: { type: integer } }
 *       - { name: limit, in: query, required: false, schema: { type: integer } }
 *       - { name: offset, in: query, required: false, schema: { type: integer } }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully including subcategories
 */
export async function GET(req, { params }) {
  const { categoryId } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const limit = limitParam !== null ? Number(limitParam) : null;
    const offset = offsetParam !== null ? Number(offsetParam) : null;

    // Optional auth: personalizes is_wishlisted, matches Auth::guard('api')->user() being nullable.
    const authUser = getAuthUser(req);
    let wishlistProductCodes = new Set();
    if (authUser?.id) {
      const [wishlistRows] = await pool.query(
        "SELECT product_code FROM wishlist WHERE customer_id = ?",
        [authUser.id],
      );
      wishlistProductCodes = new Set(wishlistRows.map((row) => row.product_code));
    }

    const [categoryRows] = await pool.query("SELECT id, parent_id FROM categories");
    const categoryIds = collectCategoryIds(categoryRows, categoryId);
    const placeholders = categoryIds.map(() => "?").join(", ");

    let query = `SELECT
        p.*,
        c.category_name, c.parent_id AS category_parent_id, c.image AS category_image,
        c.top AS category_top, c.status AS category_status,
        b.brand_name, b.image AS brand_image, b.top AS brand_top, b.status AS brand_status
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.category_id IN (${placeholders})
         AND p.parent_id IS NULL
         AND p.status = 1
       ORDER BY p.id DESC`;
    const queryParams = [...categoryIds];

    if (limit !== null) {
      query += " LIMIT ?";
      queryParams.push(limit);
      if (offset !== null) {
        query += " OFFSET ?";
        queryParams.push(offset);
      }
    }

    const [rows] = await pool.query(query, queryParams);

    // Laravel's starting_price: min sell_price among variation children, else own sell_price.
    const variantProductIds = rows.filter((row) => Number(row.has_variations) === 1).map((row) => row.id);
    const startingPriceById = new Map();
    if (variantProductIds.length) {
      const [variantPriceRows] = await pool.query(
        `SELECT parent_id, MIN(sell_price) AS min_price FROM products WHERE parent_id IN (${variantProductIds.map(() => "?").join(", ")}) GROUP BY parent_id`,
        variantProductIds,
      );
      variantPriceRows.forEach((row) => startingPriceById.set(Number(row.parent_id), row.min_price));
    }

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    const products = enrichedRows.map((row) => {
      const product = formatProduct(row);
      return {
        ...product,
        starting_price:
          Number(row.has_variations) === 1
            ? Number(startingPriceById.get(Number(row.id)) ?? product.sell_price)
            : Number(product.sell_price),
        is_wishlisted: wishlistProductCodes.has(product.product_code),
      };
    });

    return NextResponse.json({
      success: true,
      message: "Products retrieved successfully including subcategories",
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS BY CATEGORY (path) ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
