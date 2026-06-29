import { NextResponse } from "next/server";
import pool from "@/utils/db";

// GET /api/v1/customers/reviews/list?page=1&limit=10&search=
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = (searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    let where = "";
    const args = [];

    if (search) {
      where = "WHERE name LIKE ? OR email LIKE ? OR product_code LIKE ? OR review_detail LIKE ?";
      const like = `%${search}%`;
      args.push(like, like, like, like);
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM product_reviews ${where}`, args);

    const [reviews] = await pool.query(
      `SELECT id, customer_id, product_code, order_id, name, email, review_detail, rating, image_path, created_at
       FROM product_reviews ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...args, limit, offset],
    );

    return NextResponse.json({ success: true, reviews, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[GET /api/v1/customers/reviews/list]", error);
    return NextResponse.json({ success: false, message: "Failed to fetch reviews" }, { status: 500 });
  }
}
