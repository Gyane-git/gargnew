import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { formatWishlistItem } from "@/utils/wishlist";

/**
 * @swagger
 * /api/v1/customer/wishlist/list:
 *   get:
 *     summary: Get the authenticated customer's wishlist
 *     description: Returns every wishlist row for the customer, each enriched
 *       with its full product record, plus a count of items.
 *     tags: [Customer - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, description: Number of items in the wishlist }
 *                 wishlist:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       customer_id: { type: integer }
 *                       product_code: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *                       product: { type: object, nullable: true, description: Full product record }
 *       500: { description: Internal server error }
 */
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

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
      wishlist,
      count: wishlist.length,
    });
  } catch (error) {
    console.error("WISHLIST LIST ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

