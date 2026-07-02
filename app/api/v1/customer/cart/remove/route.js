import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

export async function DELETE(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    await pool.query("DELETE FROM cart_items WHERE cart_id = ?", [authUser.id]);

    return Response.json({
      success: true,
      message: "Cart cleared successfully.",
      cart: {
        id: authUser.id,
        items: [],
        subtotal: 0,
      },
    });
  } catch (error) {
    console.error("CART REMOVE ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
