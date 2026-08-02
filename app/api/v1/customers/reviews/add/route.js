import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

const ensureReviewImageColumn = async () => {
  const [rows] = await pool.query("SHOW COLUMNS FROM product_reviews LIKE 'image_path'");
  if (!rows.length) {
    await pool.query("ALTER TABLE product_reviews ADD COLUMN image_path LONGTEXT NULL AFTER rating");
    return;
  }

  const type = String(rows[0].Type || "").toLowerCase();
  if (!type.includes("longtext")) {
    await pool.query("ALTER TABLE product_reviews MODIFY COLUMN image_path LONGTEXT NULL");
  }
};

/**
 * @swagger
 * /api/v1/customers/reviews/add:
 *   post:
 *     summary: Submit a product review (admin/web variant)
 *     description: Distinct from the singular /api/v1/customer/reviews/add mobile-app
 *       endpoint. Requires a valid bearer token (getAuthUser); customer_id, name, and email
 *       default to the authenticated user's values if not supplied in the body. Also
 *       lazily widens product_reviews.image_path to LONGTEXT on first call.
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_code, order_id, review_detail, rating]
 *             properties:
 *               customer_id: { type: integer, description: Defaults to the authenticated user's id }
 *               product_code: { type: string }
 *               order_id: { type: string }
 *               name: { type: string, description: Defaults to the authenticated user's name }
 *               email: { type: string, description: Defaults to the authenticated user's email }
 *               review_detail: { type: string, maxLength: 500 }
 *               rating: { type: number, minimum: 0, maximum: 5 }
 *               image_path:
 *                 description: A string, or an array of strings, describing image path(s)
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items: { type: string }
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 review_id: { type: integer }
 *       400: { description: Missing required fields, invalid rating, or review_detail too long }
 *       401: { description: Unauthorized }
 *       409: { description: Already reviewed this product for this order }
 *       500: { description: Internal server error }
 */
// POST /api/v1/customers/reviews/add
export async function POST(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser?.id) return unauthorizedResponse();
    await ensureReviewImageColumn();

    const {
      customer_id = authUser.id,
      product_code,
      order_id,
      name,
      email,
      review_detail,
      rating,
      image_path = null,
    } = await request.json();

    const resolvedName = String(name || authUser.full_name || authUser.name || "").trim();
    const resolvedEmail = String(email || authUser.email || "").trim();

    if (!product_code || !order_id || !resolvedName || !resolvedEmail || !review_detail || !rating) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      return NextResponse.json({ success: false, message: "Rating must be between 0 and 5" }, { status: 400 });
    }

    if (review_detail.length > 500) {
      return NextResponse.json({ success: false, message: "Review must be 500 characters or fewer" }, { status: 400 });
    }

    const normalizedImagePath = Array.isArray(image_path)
      ? JSON.stringify(image_path)
      : typeof image_path === "string"
        ? image_path
        : image_path
          ? JSON.stringify(image_path)
          : null;

    const [duplicate] = await pool.query("SELECT id FROM product_reviews WHERE order_id = ? AND email = ? AND product_code = ? LIMIT 1", [order_id, resolvedEmail, product_code]);
    if (duplicate.length > 0) {
      return NextResponse.json({ success: false, message: "You have already reviewed this product for this order" }, { status: 409 });
    }

    const [result] = await pool.query(
      "INSERT INTO product_reviews (customer_id, product_code, order_id, name, email, review_detail, rating, image_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [customer_id, product_code, order_id, resolvedName, resolvedEmail, review_detail, ratingNum, normalizedImagePath],
    );

    return NextResponse.json({ success: true, message: "Review submitted successfully", review_id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/customers/reviews/add]", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to submit review" }, { status: 500 });
  }
}
