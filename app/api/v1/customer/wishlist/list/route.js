import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { formatWishlistItem } from "@/utils/wishlist";

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const [rows] = await pool.query(
      `SELECT id, customer_id, product_code, created_at, updated_at
       FROM wishlist
       WHERE customer_id = ?
       ORDER BY id DESC`,
      [authUser.id],
    );

    const wishlist = await Promise.all(rows.map((row) => formatWishlistItem(row)));

    return Response.json({
      success: true,
      wishlist,
      count: wishlist.length,
    });
  } catch (error) {
    console.error("WISHLIST LIST ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

