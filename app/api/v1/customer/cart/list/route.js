import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import {
  formatCartItem,
  formatCartResponse,
  getCustomerCartId,
  getProductByCode,
} from "@/utils/cart";
import pool from "@/utils/db";

const attachProducts = async (rows) =>
  Promise.all(
    rows.map(async (row) => ({
      ...row,
      product: await getProductByCode(row.product_code),
    })),
  );

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const cartId = await getCustomerCartId(pool, authUser.id, false);
    if (!cartId) {
      return Response.json({
        success: true,
        cart: {
          id: null,
          items: [],
          subtotal: 0,
        },
      });
    }

    const [rows] = await pool.query(
      `SELECT id, cart_id, product_code, quantity, price, actual_price, created_at, updated_at
       FROM cart_items
       WHERE cart_id = ?
       ORDER BY id DESC`,
      [cartId],
    );

    const items = attachProducts(rows).then((resolvedRows) => resolvedRows.map(formatCartItem));
    const formattedItems = await items;

    return Response.json({
      success: true,
      cart: formatCartResponse(formattedItems),
    });
  } catch (error) {
    console.error("CART LIST ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
