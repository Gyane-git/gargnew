import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import {
  formatCartItem,
  formatCartResponse,
  ensureCartItemVariationColumn,
  getCustomerCartId,
  getProductByCode,
  getProductVariationByKey,
} from "@/utils/cart";
import pool from "@/utils/db";

const attachProducts = async (rows) =>
  Promise.all(
    rows.map(async (row) => ({
      ...row,
      product: row.variation_key
        ? (await getProductVariationByKey(row.product_code, row.variation_key)) || (await getProductByCode(row.product_code))
        : await getProductByCode(row.product_code),
    })),
  );

/**
 * @swagger
 * /api/v1/customer/cart/list:
 *   get:
 *     summary: Get the authenticated customer's cart
 *     description: Returns an empty cart (id null, no items, subtotal 0) if the
 *       customer has no cart yet. Each cart item is enriched with its full
 *       product (or resolved variation) record.
 *     tags: [Customer - Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
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
 *       500: { description: Internal server error }
 */
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    await ensureCartItemVariationColumn(pool);

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
      `SELECT id, cart_id, product_code, variation_key, quantity, price, actual_price, created_at, updated_at
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
