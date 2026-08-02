import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

/**
 * @swagger
 * /api/v1/customer/remove-account:
 *   delete:
 *     summary: Deactivate (soft-delete) the authenticated customer's account
 *     description: Sets users.status = 0 and clears remember_token for the authenticated
 *       user. Does not delete the row.
 *     tags: [Customer - Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       401: { description: Unauthorized - missing/invalid token or no rows affected }
 *       500: { description: Internal server error }
 */
export async function DELETE(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const [result] = await pool.execute(
      "UPDATE users SET status = 0, remember_token = NULL, updated_at = NOW() WHERE id = ?",
      [authUser.id],
    );

    if (result.affectedRows === 0) return unauthorizedResponse();

    return Response.json({
      success: true,
      message: "Account removed successfully.",
    });
  } catch (error) {
    console.error("REMOVE ACCOUNT ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Internal server error. Please try again." }] }, { status: 500 });
  }
}
