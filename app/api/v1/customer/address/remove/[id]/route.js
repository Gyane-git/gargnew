import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

/**
 * @swagger
 * /api/v1/customer/address/remove/{id}:
 *   delete:
 *     summary: Delete an address from the authenticated customer's address book
 *     description: Only deletes if the address belongs to the authenticated customer.
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Address deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Address deleted successfully." }
 *       401: { description: Unauthorized. }
 *       404: { description: Address not found. }
 *       422: { description: Address id is required. }
 *       500: { description: Internal server error. }
 */
export async function DELETE(req, { params }) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const addressId = Number(params.id);
    if (!addressId) {
      return Response.json({ success: false, message: "Address id is required." }, { status: 422 });
    }

    const [existingRows] = await pool.query(
      "SELECT id FROM customer_address_book WHERE id = ? AND customer_id = ? LIMIT 1",
      [addressId, authUser.id],
    );

    if (existingRows.length === 0) {
      return Response.json({ success: false, message: "Address not found." }, { status: 404 });
    }

    await pool.query("DELETE FROM customer_address_book WHERE id = ? AND customer_id = ?", [
      addressId,
      authUser.id,
    ]);

    return Response.json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    console.error("ADDRESS REMOVE ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

