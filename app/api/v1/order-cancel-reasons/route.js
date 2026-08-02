import { NextResponse } from "next/server";
import { fetchOrderCancelReasons, insertOrderCancelReason } from "@/utils/orderCancelReasons";

/**
 * @swagger
 * /api/v1/order-cancel-reasons:
 *   get:
 *     summary: List all order cancellation reasons
 *     description: Returns every row from order_cancel_reasons, newest first. Each row is
 *       passed through formatOrderCancelReason, which normalizes reason_type and reason_for
 *       to lowercase and fills reason_name from a legacy name/title column if needed.
 *     tags: [Admin - Order Reasons]
 *     responses:
 *       200: { description: '{ success: true, reasons } - array of order_cancel_reasons rows.' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function GET() {
  try {
    const reasons = await fetchOrderCancelReasons();

    return NextResponse.json({
      success: true,
      reasons,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch cancellation reasons.",
      },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/v1/order-cancel-reasons:
 *   post:
 *     summary: Create an order cancellation reason
 *     description: Accepts several field-name aliases (reasonName/reason_name/name,
 *       reasonType/reason_type/type, reasonFor/reason_for/for). reason_type and reason_for
 *       are normalized to lowercase before insert. Only inserts into columns that actually
 *       exist on order_cancel_reasons (checked dynamically via SHOW COLUMNS).
 *     tags: [Admin - Order Reasons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reasonName, reasonType, reasonFor]
 *             properties:
 *               reasonName: { type: string, description: "Aliases: reason_name, name" }
 *               reasonType: { type: string, description: "Aliases: reason_type, type" }
 *               reasonFor: { type: string, description: "Aliases: reason_for, for" }
 *     responses:
 *       201: { description: '{ success: true, message: "Reason added successfully.", reasonId }' }
 *       422: { description: '{ success: false, message: "Reason name, reason type, and reason for are required." }' }
 *       500: { description: '{ success: false, message } - unexpected error, or "No matching columns were found for order_cancel_reasons."' }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const result = await insertOrderCancelReason(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: result.status || 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Reason added successfully.",
        reasonId: result.reasonId,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error.",
      },
      { status: 500 },
    );
  }
}
