import { NextResponse } from "next/server";
import { fetchOrderCancelReasons, normalizeReasonText } from "@/utils/orderCancelReasons";

/**
 * @swagger
 * /api/v1/customer/order/reasons-list:
 *   get:
 *     summary: List available order cancellation reasons
 *     description: Returns cancellation reasons filtered to reason_type=cancel and
 *       reason_for=customer. No authentication is required.
 *     tags: [Customer - Orders]
 *     responses:
 *       200:
 *         description: List of cancellation reasons
 *       500: { description: Failed to fetch cancellation reasons }
 */
export async function GET() {
  try {
    const reasons = await fetchOrderCancelReasons();
    const filteredReasons = reasons.filter(
      (reason) =>
        normalizeReasonText(reason.reason_type) === "cancel" &&
        normalizeReasonText(reason.reason_for) === "customer",
    );

    return NextResponse.json({
      success: true,
      reasons: filteredReasons,
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
