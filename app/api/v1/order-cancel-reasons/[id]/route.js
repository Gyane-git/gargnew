import { NextResponse } from "next/server";
import {
  deleteOrderCancelReason,
  fetchOrderCancelReasonById,
  updateOrderCancelReason,
} from "@/utils/orderCancelReasons";

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
