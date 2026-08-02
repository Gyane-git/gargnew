import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { getCustomerCartId } from "@/utils/cart";

/**
 * @swagger
 * /api/v1/customer/cart/remove:
 *   delete:
 *     summary: Clear the authenticated customer's entire cart
 *     description: Deletes all cart_items rows for the customer's cart. If the
 *       customer has no cart yet, responds as if it was already cleared.
 *     tags: [Customer - Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Cart cleared successfully. }
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, nullable: true }
 *                     items: { type: array, items: {}, example: [] }
 *                     subtotal: { type: number, example: 0 }
 *       500: { description: Internal server error }
 */
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
