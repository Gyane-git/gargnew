import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { formatCartItem, formatCartResponse, getProductByCode } from "@/utils/cart";

export async function DELETE(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const itemId = Number(body.item_id);

    if (!itemId) {
      return Response.json({ success: false, message: "item_id is required" }, { status: 400 });
    }

    const [existing] = await pool.query(
      "SELECT id FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1",
      [itemId, authUser.id],
    );

    if (existing.length === 0) {
      return Response.json({ success: false, message: "Cart item not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", [itemId, authUser.id]);

    const [rows] = await pool.query(
      `SELECT id, cart_id, product_code, quantity, price, actual_price, created_at, updated_at
       FROM cart_items
       WHERE cart_id = ?
       ORDER BY id DESC`,
      [authUser.id],
    );

    const resolved = await Promise.all(
      rows.map(async (row) => ({ ...row, product: await getProductByCode(row.product_code) })),
    );

    return Response.json({
      success: true,
      message: "Cart item removed successfully.",
      cart: formatCartResponse(resolved.map(formatCartItem)),
    });
  } catch (error) {
    console.error("CART REMOVE ITEM ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
