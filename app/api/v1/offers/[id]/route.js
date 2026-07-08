import { NextResponse } from "next/server";
import { deleteOffer, fetchOfferById, saveOffer } from "@/utils/offers";
import { invalidateOffersCache } from "../route";

export async function GET(_req, context) {
  try {
    const { id } = await context.params;
    const offer = await fetchOfferById(id);

    if (!offer) {
      return NextResponse.json({ success: false, message: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      offer,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";

    let body = {};
    let file = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        title: formData.get("title"),
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
        is_active: formData.get("is_active"),
        is_offer: formData.get("is_offer"),
      };
      file = formData.get("offer_image");
    } else {
      body = await request.json();
    }

    const result = await saveOffer({ id, body, file });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    invalidateOffersCache();

    return NextResponse.json({
      success: true,
      message: "Offer updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const { is_active } = await request.json();

    const result = await saveOffer({
      id,
      body: { is_active },
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Status updated",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const result = await deleteOffer(id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Offer not found" }, { status: 404 });
    }

    invalidateOffersCache();

    return NextResponse.json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
