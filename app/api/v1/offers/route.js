import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { deleteOffer, fetchOffers, saveOffer } from "@/utils/offers";
import { getAuthUser } from "@/utils/authUser";
import { recordAuditLog } from "@/utils/auditLogs";
import { getOffersCache, invalidateOffersCache, setOffersCache } from "@/utils/offersCache";

const OFFERS_CACHE_TTL_MS = 15000;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("include_inactive") === "1";
    const limit = searchParams.get("limit");
    const cacheKey = includeInactive ? "includeInactive" : "activeOnly";
    const cachedOffers = getOffersCache();

    if (
      cachedOffers[cacheKey] &&
      Date.now() - cachedOffers.at < OFFERS_CACHE_TTL_MS &&
      (limit ? cachedOffers[cacheKey].limit === Number(limit) : true)
    ) {
      return NextResponse.json({
        success: true,
        offers: cachedOffers[cacheKey].data,
      });
    }

    const offers = await fetchOffers({
      activeOnly: !includeInactive,
      limit: limit ? Number(limit) : null,
    });

    setOffersCache({
      ...cachedOffers,
      data: offers,
      limit: limit ? Number(limit) : null,
      at: Date.now(),
    });

    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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

    const result = await saveOffer({ body, file });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 400 },
      );
    }

    invalidateOffersCache();

    const authUser = getAuthUser(request);
    await recordAuditLog(pool, {
      admin_name: authUser?.name || authUser?.full_name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Create",
      module: "offers",
      model: "Offer",
      record_id: result.id,
      summary: String(body.title || "Offer").slice(0, 255),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: {
        offer_id: result.id,
        title: body.title || null,
        is_active: body.is_active ?? null,
        is_offer: body.is_offer ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Offer saved successfully.",
        id: result.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
