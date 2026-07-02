import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import {
  formatCartItem,
  formatCartResponse,
  getCustomerCartId,
  getProductByCode,
} from "@/utils/cart";

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const itemId = Number(body.item_id);
    const quantity = Number(body.quantity);
    const cartId = await getCustomerCartId(pool, authUser.id, false);

    if (!itemId || !Number.isFinite(quantity) || quantity < 1) {
      return Response.json({ success: false, message: "item_id and valid quantity are required" }, { status: 400 });
    }

    if (!cartId) {
      return Response.json({ success: false, message: "Cart not found" }, { status: 404 });
    }

    const [items] = await pool.query(
      "SELECT id, cart_id, product_code, quantity, price, actual_price FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1",
      [itemId, cartId],
    );

    if (items.length === 0) {
      return Response.json({ success: false, message: "Cart item not found" }, { status: 404 });
    }

    const current = items[0];
    const product = await getProductByCode(current.product_code);
    const maxQty = Number(product?.available_quantity || product?.stock_quantity || quantity);

    if (quantity > maxQty) {
      return Response.json(
        {
          success: false,
          message: `Only ${maxQty} items available in stock.`,
        },
        { status: 422 },
      );
    }

    await pool.query("UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND cart_id = ?", [
      quantity,
      itemId,
      cartId,
    ]);

    const [rows] = await pool.query(
      `SELECT id, cart_id, product_code, quantity, price, actual_price, created_at, updated_at
       FROM cart_items
       WHERE cart_id = ?
       ORDER BY id DESC`,
      [cartId],
    );

    const resolved = await Promise.all(
      rows.map(async (row) => ({ ...row, product: await getProductByCode(row.product_code) })),
    );

    return Response.json({
      success: true,
      message: "Cart updated successfully.",
      cart: formatCartResponse(resolved.map(formatCartItem)),
    });
  } catch (error) {
    console.error("CART UPDATE ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
