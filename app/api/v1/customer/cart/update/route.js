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
 * /api/v1/customer/cart/update:
 *   post:
 *     summary: Update the quantity of a cart item
 *     description: Updates the quantity of one cart_items row (scoped to the
 *       customer's own cart), validating against the product's/variation's
 *       available stock, then returns the updated cart.
 *     tags: [Customer - Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_id, quantity]
 *             properties:
 *               item_id: { type: integer, description: cart_items row id to update }
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Cart updated successfully. }
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
 *       400: { description: item_id and a valid quantity (>= 1) are required }
 *       404: { description: Cart not found, or cart item not found }
 *       422: { description: Requested quantity exceeds available stock }
 *       500: { description: Internal server error }
 */
export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const itemId = Number(body.item_id);
    const quantity = Number(body.quantity);
    const cartId = await getCustomerCartId(pool, authUser.id, false);

    await ensureCartItemVariationColumn(pool);

    if (!itemId || !Number.isFinite(quantity) || quantity < 1) {
      return Response.json({ success: false, message: "item_id and valid quantity are required" }, { status: 400 });
    }

    if (!cartId) {
      return Response.json({ success: false, message: "Cart not found" }, { status: 404 });
    }

    const [items] = await pool.query(
      "SELECT id, cart_id, product_code, variation_key, quantity, price, actual_price FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1",
      [itemId, cartId],
    );

    if (items.length === 0) {
      return Response.json({ success: false, message: "Cart item not found" }, { status: 404 });
    }

    const current = items[0];
    const product = current.variation_key
      ? (await getProductVariationByKey(current.product_code, current.variation_key)) || (await getProductByCode(current.product_code))
      : await getProductByCode(current.product_code);
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
      message: "Cart updated successfully.",
      cart: formatCartResponse(resolved.map(formatCartItem)),
    });
  } catch (error) {
    console.error("CART UPDATE ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
