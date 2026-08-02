import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { deleteOffer, fetchOfferById, saveOffer } from "@/utils/offers";
import { getAuthUser } from "@/utils/authUser";
import { recordAuditLog } from "@/utils/auditLogs";
import { invalidateOffersCache } from "@/utils/offersCache";

/**
 * @swagger
 * /api/v1/offers/{id}:
 *   get:
 *     summary: Get a single offer by id
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Offer found.
 *       404:
 *         description: Offer not found.
 *       500:
 *         description: Server error.
 */
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

/**
 * @swagger
 * /api/v1/offers/{id}:
 *   put:
 *     summary: Update an offer
 *     description: Accepts either multipart/form-data (with an optional offer_image file) or a
 *       plain JSON body, and delegates persistence to saveOffer(). Also records an audit log
 *       entry using the bearer token's user info if present, otherwise "System" (not enforced -
 *       requests without a token still succeed).
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               is_active: { type: string }
 *               is_offer: { type: string }
 *               offer_image: { type: string, format: binary }
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               is_active: { type: integer }
 *               is_offer: { type: integer }
 *     responses:
 *       200:
 *         description: Offer updated successfully.
 *       400:
 *         description: Save failed (e.g. validation error from saveOffer).
 *       500:
 *         description: Server error.
 */
export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const authUser = getAuthUser(request);
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

    await recordAuditLog(pool, {
      admin_name: authUser?.name || authUser?.full_name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Update",
      module: "offers",
      model: "Offer",
      record_id: id,
      summary: String(body.title || `Offer #${id}`).slice(0, 255),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: {
        offer_id: id,
        title: body.title || null,
        is_active: body.is_active ?? null,
        is_offer: body.is_offer ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Offer updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/offers/{id}:
 *   patch:
 *     summary: Update an offer's active status
 *     description: Accepts a JSON body { is_active } and updates the offer via saveOffer().
 *       Also records an audit log entry.
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active: { type: integer }
 *             required: [is_active]
 *     responses:
 *       200:
 *         description: Status updated.
 *       400:
 *         description: Save failed.
 *       500:
 *         description: Server error.
 */
export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const authUser = getAuthUser(request);
    const { is_active } = await request.json();

    const result = await saveOffer({
      id,
      body: { is_active },
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    await recordAuditLog(pool, {
      admin_name: authUser?.name || authUser?.full_name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Update",
      module: "offers",
      model: "Offer",
      record_id: id,
      summary: `Offer status changed to ${Number(is_active) ? "active" : "inactive"}`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: {
        offer_id: id,
        is_active: Number(is_active) ? 1 : 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status updated",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/offers/{id}:
 *   delete:
 *     summary: Delete an offer
 *     description: Deletes the offer row and records an audit log entry.
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Offer deleted successfully.
 *       404:
 *         description: Offer not found.
 *       500:
 *         description: Server error.
 */
export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const authUser = getAuthUser(_request);
    const result = await deleteOffer(id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Offer not found" }, { status: 404 });
    }

    invalidateOffersCache();

    await recordAuditLog(pool, {
      admin_name: authUser?.name || authUser?.full_name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Delete",
      module: "offers",
      model: "Offer",
      record_id: id,
      summary: `Offer #${id} deleted`,
      ip_address: _request.headers.get("x-forwarded-for") || _request.headers.get("x-real-ip") || "",
      metadata: {
        offer_id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
