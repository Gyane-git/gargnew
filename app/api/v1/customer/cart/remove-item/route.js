import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import {
  formatCartItem,
  formatCartResponse,
  ensureCartItemVariationColumn,
  getCustomerCartId,
  getProductByCode,
  getProductVariationByKey,
} from "@/utils/cart";

/**
 * @swagger
 * /api/v1/customer/cart/remove-item:
 *   delete:
 *     summary: Remove a single item from the authenticated customer's cart
 *     description: Deletes one cart_items row (scoped to the customer's own cart)
 *       identified by item_id, then returns the updated cart.
 *     tags: [Customer - Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_id]
 *             properties:
 *               item_id: { type: integer, description: cart_items row id to remove }
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Cart item removed successfully. }
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, nullable: true }
 *                     subtotal: { type: number }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           cart_id: { type: integer }
 *                           product_code: { type: string }
 *                           variation_key: { type: string, nullable: true }
 *                           quantity: { type: integer }
 *                           price: { type: number }
 *                           actual_price: { type: number }
 *                           created_at: { type: string, format: date-time }
 *                           updated_at: { type: string, format: date-time }
 *                           product: { type: object, nullable: true, description: Full product (or resolved variation) record }
 *       400: { description: item_id is required }
 *       404: { description: Cart not found, or cart item not found }
 *       500: { description: Internal server error }
 */
export async function DELETE(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const itemId = Number(body.item_id);
    const cartId = await getCustomerCartId(pool, authUser.id, false);

    await ensureCartItemVariationColumn(pool);

    if (!itemId) {
      return Response.json({ success: false, message: "item_id is required" }, { status: 400 });
    }

    if (!cartId) {
      return Response.json({ success: false, message: "Cart not found" }, { status: 404 });
    }

    const [existing] = await pool.query(
      "SELECT id FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1",
      [itemId, cartId],
    );

    if (existing.length === 0) {
      return Response.json({ success: false, message: "Cart item not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", [itemId, cartId]);

    const [rows] = await pool.query(
      `SELECT id, cart_id, product_code, variation_key, quantity, price, actual_price, created_at, updated_at
       FROM cart_items
       WHERE cart_id = ?
       ORDER BY id DESC`,
      [cartId],
    );

    const resolved = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        product: row.variation_key
          ? (await getProductVariationByKey(row.product_code, row.variation_key)) || (await getProductByCode(row.product_code))
          : await getProductByCode(row.product_code),
      })),
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
