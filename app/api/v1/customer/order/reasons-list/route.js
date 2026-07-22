import { NextResponse } from "next/server";
import { fetchOrderCancelReasons, normalizeReasonText } from "@/utils/orderCancelReasons";

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
