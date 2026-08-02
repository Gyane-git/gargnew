import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { deleteOffer, fetchOffers, saveOffer } from "@/utils/offers";
import { getAuthUser } from "@/utils/authUser";
import { recordAuditLog } from "@/utils/auditLogs";
import { getOffersCache, invalidateOffersCache, setOffersCache } from "@/utils/offersCache";

const OFFERS_CACHE_TTL_MS = 15000;

/**
 * @swagger
 * /api/v1/offers:
 *   get:
 *     summary: List offers
 *     description: Reads from the offers table, defaulting to active-only (is_active = 1)
 *       unless include_inactive=1 is passed. Results are cached in-memory for 15 seconds
 *       per (include_inactive, limit) combination.
 *     tags: [Offers]
 *     parameters:
 *       - in: query
 *         name: include_inactive
 *         schema: { type: string, enum: ["0", "1"] }
 *         description: Pass "1" to include inactive offers as well.
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: Maximum number of offers to return.
 *     responses:
 *       200:
 *         description: Offers fetched successfully.
 *       500:
 *         description: Server error.
 */
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
      // `message` added for Laravel parity (OfferController::get_offers) - additive only,
      // app/page.js and app/dashboard/page.js only read success/offers[0].offer_image_full_url.
      return NextResponse.json({
        success: true,
        message: "Offers fetched successfully.",
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
      message: "Offers fetched successfully.",
      offers,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/offers:
 *   post:
 *     summary: Create a new offer
 *     description: Accepts either multipart/form-data (with an optional offer_image file) or a
 *       plain JSON body, and delegates persistence to saveOffer(). Also records an audit log
 *       entry using the bearer token's user info if present, otherwise "System" (not enforced -
 *       requests without a token still succeed).
 *     tags: [Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: Required. }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               is_active: { type: string }
 *               is_offer: { type: string }
 *               offer_image: { type: string, format: binary }
 *             required: [title]
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               is_active: { type: integer }
 *               is_offer: { type: integer }
 *             required: [title]
 *     responses:
 *       201:
 *         description: Offer saved successfully.
 *       400:
 *         description: Save failed (e.g. validation error from saveOffer, such as a missing title).
 *       500:
 *         description: Server error.
 */
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
