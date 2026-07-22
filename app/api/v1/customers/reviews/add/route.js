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
