import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { formatWishlistItem } from "@/utils/wishlist";

/**
 * @swagger
 * /api/v1/customer/wishlist/remove-item:
 *   delete:
 *     summary: Remove a single item from the authenticated customer's wishlist
 *     description: Deletes one wishlist row (scoped to the customer's own
 *       wishlist) identified by item_id, then returns the updated wishlist.
 *     tags: [Customer - Wishlist]
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
 *               item_id: { type: integer, description: wishlist row id to remove }
 *     responses:
 *       200:
 *         description: Wishlist item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Wishlist item removed successfully. }
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
 *       400: { description: item_id is required. }
 *       404: { description: Wishlist item not found. }
 *       500: { description: Internal server error }
 */
export async function DELETE(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const itemId = Number(body.item_id);

    if (!itemId) {
      return Response.json({ success: false, message: "item_id is required." }, { status: 400 });
    }

    const [existing] = await pool.query(
      "SELECT id FROM wishlist WHERE id = ? AND customer_id = ? LIMIT 1",
      [itemId, authUser.id],
    );

    if (existing.length === 0) {
      return Response.json({ success: false, message: "Wishlist item not found." }, { status: 404 });
    }

    await pool.query("DELETE FROM wishlist WHERE id = ? AND customer_id = ?", [itemId, authUser.id]);

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
      message: "Wishlist item removed successfully.",
      wishlist,
    });
  } catch (error) {
    console.error("WISHLIST REMOVE ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

