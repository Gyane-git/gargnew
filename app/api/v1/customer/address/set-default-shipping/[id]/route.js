import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

/**
 * @swagger
 * /api/v1/customer/address/set-default-shipping/{id}:
 *   post:
 *     summary: Set an address as the default shipping address
 *     description: Clears default_shipping on all of the customer's other addresses, then sets default_shipping = Y on the given address. Does not touch default_billing.
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
 *         description: Default shipping address updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Default shipping address updated successfully." }
 *       401: { description: Unauthorized. }
 *       404: { description: Address not found. }
 *       422: { description: Address id is required. }
 *       500: { description: Internal server error. }
 */
export async function POST(req, { params }) {
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

    await pool.query(
      "UPDATE customer_address_book SET default_shipping = 'N', updated_at = NOW() WHERE customer_id = ?",
      [authUser.id],
    );
    await pool.query(
      "UPDATE customer_address_book SET default_shipping = 'Y', updated_at = NOW() WHERE id = ? AND customer_id = ?",
      [addressId, authUser.id],
    );

    return Response.json({ success: true, message: "Default shipping address updated successfully." });
  } catch (error) {
    console.error("ADDRESS DEFAULT SHIPPING ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

