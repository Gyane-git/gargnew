import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { getAuthUser } from "@/utils/authUser";
import { unauthenticatedResponse } from "@/utils/apiResponse";

/**
 * @swagger
 * /api/v1/customer/products/add-recommended/{product_code}:
 *   post:
 *     summary: Record a product as viewed/recommended for the authenticated customer
 *     description: Mirrors Laravel ProductController::add_to_recommended (API\V1). Upserts
 *       into recommended_products and trims history to the most recent 10 rows per customer.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: product_code, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Added to recommended }
 *       401: { description: Unauthenticated }
 */
export async function POST(req, { params }) {
  const { product_code } = await params;

  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthenticatedResponse();

    const [productRows] = await pool.query(
      "SELECT product_code FROM products WHERE product_code = ? AND parent_id IS NULL LIMIT 1",
      [product_code],
    );

    if (productRows.length) {
      // insertOrIgnore equivalent - relies on a unique index on (customer_id, product_code)
      // if present; otherwise this is a plain insert, matching Laravel's insertOrIgnore intent.
      await pool.query(
        "INSERT IGNORE INTO recommended_products (customer_id, product_code, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
        [authUser.id, product_code],
      );

      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) AS count FROM recommended_products WHERE customer_id = ?",
        [authUser.id],
      );

      if (count > 10) {
        await pool.query(
          `DELETE FROM recommended_products
           WHERE customer_id = ?
           ORDER BY created_at ASC
           LIMIT ?`,
          [authUser.id, count - 10],
        );
      }
    }

    return NextResponse.json({ success: true, message: "Added to recommended" }, { status: 200 });
  } catch (error) {
    console.error("ADD RECOMMENDED PRODUCT ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
