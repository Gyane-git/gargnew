import { NextResponse } from "next/server";
import { fetchOrderCancelReasons } from "@/utils/orderCancelReasons";

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
