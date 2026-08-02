import { NextResponse } from "next/server";
import { fetchOrderCancelReasons, normalizeReasonText } from "@/utils/orderCancelReasons";

/**
 * @swagger
 * /api/v1/customer/order/return-reasons-list:
 *   get:
 *     summary: List available order return reasons
 *     description: Returns reasons filtered to reason_type=return and reason_for=customer.
 *       No authentication is required.
 *     tags: [Customer - Orders]
 *     responses:
 *       200:
 *         description: List of return reasons
 *       500: { description: Failed to fetch return reasons }
 */
export async function GET() {
  try {
    const reasons = await fetchOrderCancelReasons();
    const filteredReasons = reasons.filter(
      (reason) =>
        normalizeReasonText(reason.reason_type) === "return" &&
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
        message: error.message || "Failed to fetch return reasons.",
      },
      { status: 500 },
    );
  }
}
