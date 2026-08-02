import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { getAuthUser } from "@/utils/authUser";
import { unauthenticatedResponse } from "@/utils/apiResponse";

// Same self-migrating image_path widening used by the existing plural
// app/api/v1/customers/reviews/add/route.js - kept consistent for the two routes.
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

const saveBase64Images = async (images, productCode) => {
  const fs = await import("fs/promises");
  const path = await import("path");

  const folder = path.join(process.cwd(), "public", "uploads", "reviews", String(productCode));
  await fs.mkdir(folder, { recursive: true });

  const savedPaths = [];
  for (const imageData of images) {
    const match = /^data:image\/(\w+);base64,/.exec(imageData);
    const extension = match ? match[1].toLowerCase() : "png";
    const base64Data = match ? imageData.slice(imageData.indexOf(",") + 1) : imageData;
    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    await fs.writeFile(path.join(folder, fileName), buffer);
    savedPaths.push(`uploads/reviews/${productCode}/${fileName}`);
  }

  return savedPaths;
};

/**
 * @swagger
 * /api/v1/customer/reviews/add:
 *   post:
 *     summary: Submit a review for a delivered order item
 *     description: Mirrors Laravel ReviewController::addReview (API\V1) - the singular
 *       "customer" path used by the mobile app (distinct from the existing plural
 *       /customers/reviews/add used by the web app). NOTE - unlike most Laravel V1
 *       endpoints, validation failures here use status 422 and a `status` key (not
 *       `success`) with raw field-keyed errors - this is an intentional Laravel quirk
 *       being replicated for mobile-app compatibility, not a bug in this route.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, review_detail, product_code, order_id]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               review_detail: { type: string }
 *               product_code: { type: string }
 *               order_id: { type: integer, description: Must belong to a delivered order owned by this customer }
 *               image_path: { type: array, items: { type: string }, description: Base64-encoded image(s) }
 *     responses:
 *       201: { description: Review submitted successfully }
 *       401: { description: Unauthenticated }
 *       422: { description: Validation error (Laravel-deviation shape - `status` key, nested errors) }
 */
export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthenticatedResponse();

    const body = await req.json().catch(() => ({}));
    const { rating, review_detail, product_code, order_id, image_path } = body;

    const errors = {};
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.rating = ["The rating must be an integer between 1 and 5."];
    }
    if (!review_detail || typeof review_detail !== "string") {
      errors.review_detail = ["The review detail field is required."];
    }
    if (!product_code || typeof product_code !== "string") {
      errors.product_code = ["The product code field is required."];
    }

    const orderIdNum = Number(order_id);
    let deliveredOrder = null;
    if (!order_id || !Number.isInteger(orderIdNum)) {
      errors.order_id = ["The order id field is required."];
    } else {
      // Deliberate tightening vs Laravel (which doesn't scope by customer_id here): only
      // this customer's own delivered orders qualify, to avoid reviewing someone else's order.
      const [orderRows] = await pool.query(
        "SELECT order_id FROM orders WHERE order_id = ? AND order_status = 'delivered' AND customer_id = ? LIMIT 1",
        [orderIdNum, authUser.id],
      );
      if (!orderRows.length) {
        errors.order_id = ["The selected order id is invalid."];
      } else {
        deliveredOrder = orderRows[0];
      }
    }

    if (Object.keys(errors).length > 0) {
      // Laravel deviation: key is `status` (not `success`), raw field-keyed errors, 422.
      return NextResponse.json({ status: false, message: "Validation errors", errors }, { status: 422 });
    }

    await ensureReviewImageColumn();

    let storedImagePath = null;
    if (image_path) {
      const images = Array.isArray(image_path) ? image_path : [image_path];
      const savedPaths = await saveBase64Images(images, product_code);
      storedImagePath = JSON.stringify(savedPaths);
    }

    const [result] = await pool.query(
      `INSERT INTO product_reviews (customer_id, product_code, order_id, name, email, review_detail, rating, image_path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        authUser.id,
        product_code,
        String(deliveredOrder.order_id),
        authUser.full_name || "",
        authUser.email || "",
        review_detail,
        ratingNum,
        storedImagePath,
      ],
    );

    await pool.query(
      "UPDATE order_items SET reviewed = 1 WHERE order_id = ? AND product_code = ?",
      [orderIdNum, product_code],
    );

    const [[savedReview]] = await pool.query("SELECT * FROM product_reviews WHERE id = ?", [result.insertId]);

    return NextResponse.json(
      { success: true, message: "Thank you for your review!", data: savedReview },
      { status: 201 },
    );
  } catch (error) {
    console.error("CUSTOMER REVIEW ADD ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to give review.", error: error.message },
      { status: 500 },
    );
  }
}
