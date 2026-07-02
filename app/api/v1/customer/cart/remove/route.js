import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { getCustomerCartId } from "@/utils/cart";

export async function DELETE(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const cartId = await getCustomerCartId(pool, authUser.id, false);
    if (!cartId) {
      return Response.json({
        success: true,
        message: "Cart cleared successfully.",
        cart: {
          id: null,
          items: [],
          subtotal: 0,
        },
      });
    }

    await pool.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    return Response.json({
      success: true,
      message: "Cart cleared successfully.",
      cart: {
        id: cartId,
        items: [],
        subtotal: 0,
      },
    });
  } catch (error) {
    console.error("CART REMOVE ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
