import { NextResponse } from "next/server";
import { fetchOrderCancelReasons, insertOrderCancelReason } from "@/utils/orderCancelReasons";

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
