import { NextResponse } from "next/server";
import { deleteOffer, fetchOffers, saveOffer } from "@/utils/offers";

const OFFERS_CACHE_TTL_MS = 15000;
let cachedOffers = {
  activeOnly: null,
  includeInactive: null,
  at: 0,
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("include_inactive") === "1";
    const limit = searchParams.get("limit");
    const cacheKey = includeInactive ? "includeInactive" : "activeOnly";

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

    cachedOffers[cacheKey] = {
      data: offers,
      limit: limit ? Number(limit) : null,
    };
    cachedOffers.at = Date.now();

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

export const invalidateOffersCache = () => {
  cachedOffers = {
    activeOnly: null,
    includeInactive: null,
    at: 0,
  };
};
