import { NextResponse } from "next/server";
import {
  deleteOrderCancelReason,
  fetchOrderCancelReasonById,
  updateOrderCancelReason,
} from "@/utils/orderCancelReasons";

/**
 * @swagger
 * /api/v1/order-cancel-reasons/{id}:
 *   get:
 *     summary: Get a single order cancellation reason by id
 *     tags: [Admin - Order Reasons]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: '{ success: true, reason } with the matching, formatted row.' }
 *       404: { description: '{ success: false, message: "Reason not found." }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function GET(_request, context) {
  try {
    const { id } = await context.params;
    const reason = await fetchOrderCancelReasonById(id);

    if (!reason) {
      return NextResponse.json({ success: false, message: "Reason not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reason,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/order-cancel-reasons/{id}:
 *   patch:
 *     summary: Update an order cancellation reason
 *     description: All fields are optional per-request - any field not provided falls back
 *       to the existing row's current value (via the same reasonName/reasonType/reasonFor
 *       alias resolution as POST). reason_type and reason_for are normalized to lowercase.
 *       On success the response does not include the updated record, only a message.
 *     tags: [Admin - Order Reasons]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reasonName: { type: string, description: "Aliases: reason_name, name" }
 *               reasonType: { type: string, description: "Aliases: reason_type, type" }
 *               reasonFor: { type: string, description: "Aliases: reason_for, for" }
 *     responses:
 *       200: { description: '{ success: true, message: "Reason updated successfully." }' }
 *       400: { description: '{ success: false, message } - returned when updateOrderCancelReason reports a failure without a specific status (defaults to 400).' }
 *       404: { description: '{ success: false, message: "Reason not found." }' }
 *       422: { description: '{ success: false, message: "Reason name, reason type, and reason for are required." } - if resolved values (existing + overrides) are still empty.' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = await updateOrderCancelReason(id, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reason updated successfully.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/order-cancel-reasons/{id}:
 *   delete:
 *     summary: Delete an order cancellation reason by id
 *     tags: [Admin - Order Reasons]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: '{ success: true, message: "Reason deleted successfully." }' }
 *       404: { description: '{ success: false, message: "Reason not found." } - returned when no row was affected by the delete.' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const result = await deleteOrderCancelReason(id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Reason not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Reason deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
