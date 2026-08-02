import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";
import { getAuthUser } from "@/utils/authUser";
import { unauthenticatedResponse } from "@/utils/apiResponse";

const productSelect = `
  SELECT p.*, c.category_name, c.parent_id AS category_parent_id, c.image AS category_image,
    c.top AS category_top, c.status AS category_status,
    b.brand_name, b.image AS brand_image, b.top AS brand_top, b.status AS brand_status
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
`;

/**
 * @swagger
 * /api/v1/customer/products/recommended:
 *   get:
 *     summary: Get the authenticated customer's recommended products
 *     description: Mirrors Laravel ProductController::get_recommended (API\V1). Response key
 *       is `recommended_products` (not `products`); backfills with random active products if
 *       fewer than 5 recommendations exist. Each item gets a boolean field literally named
 *       `wishlist` (Laravel's own naming, kept for parity even though other endpoints use
 *       `is_wishlisted`).
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Recommended products fetched successfully }
 *       401: { description: Unauthenticated }
 */
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthenticatedResponse();

    const [wishlistRows] = await pool.query(
      "SELECT product_code FROM wishlist WHERE customer_id = ?",
      [authUser.id],
    );
    const wishlistProductCodes = new Set(wishlistRows.map((row) => row.product_code));

    const [recommendedRows] = await pool.query(
      `${productSelect}
       INNER JOIN recommended_products rp ON rp.product_code = p.product_code
       WHERE rp.customer_id = ?
       ORDER BY rp.created_at DESC
       LIMIT 10`,
      [authUser.id],
    );

    let productRows = recommendedRows;
    const recommendedCount = recommendedRows.length;

    if (recommendedCount === 0) {
      const [randomRows] = await pool.query(
        `${productSelect} WHERE p.status = 1 ORDER BY RAND() LIMIT 10`,
      );
      productRows = randomRows;
    } else if (recommendedCount < 5) {
      const existingCodes = recommendedRows.map((row) => row.product_code);
      const placeholders = existingCodes.map(() => "?").join(", ");
      const [randomRows] = await pool.query(
        `${productSelect}
         WHERE p.status = 1 AND p.product_code NOT IN (${placeholders})
         ORDER BY RAND()
         LIMIT ?`,
        [...existingCodes, 10 - recommendedCount],
      );
      productRows = [...recommendedRows, ...randomRows];
    }

    const imageMap = await fetchProductImagesMap(productRows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(productRows, imageMap);

    const recommended_products = enrichedRows.map((row) => {
      const product = formatProduct(row);
      return {
        ...product,
        wishlist: wishlistProductCodes.has(product.product_code),
      };
    });

    return NextResponse.json({
      success: true,
      message: "Recommended products fetched successfully",
      recommended_products,
    });
  } catch (error) {
    console.error("GET RECOMMENDED PRODUCTS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get recommended products", error: error.message },
      { status: 500 },
    );
  }
}
