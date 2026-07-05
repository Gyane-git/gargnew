import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { formatWishlistItem } from "@/utils/wishlist";
import { getProductByCode } from "@/utils/cart";

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const productCode = String(body.product_code || "").trim();

    if (!productCode) {
      return Response.json({ success: false, message: "product_code is required." }, { status: 400 });
    }

    const product = await getProductByCode(productCode);
    if (!product) {
      return Response.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    const [existing] = await pool.query(
      "SELECT id FROM wishlist WHERE customer_id = ? AND product_code = ? LIMIT 1",
      [authUser.id, productCode],
    );

    if (existing.length === 0) {
      await pool.query(
        "INSERT INTO wishlist (customer_id, product_code, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
        [authUser.id, productCode],
      );
    }

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
      message: existing.length > 0 ? "Item already in wishlist." : "Added to wishlist successfully.",
      wishlist,
    });
  } catch (error) {
    console.error("WISHLIST ADD ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

