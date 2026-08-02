import pool from "@/utils/db";
import { NextResponse } from "next/server";

// GET ALL SHIPPING
/**
 * @swagger
 * /api/v1/addresses/shipping:
 *   get:
 *     summary: List all shipping/city rows
 *     description: Returns every row in set_shipping, joined with provinces for the province name, ordered by id descending.
 *     tags: [Admin - Address Reference]
 *     responses:
 *       200:
 *         description: Shipping rows fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 shipping:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       province_id: { type: integer }
 *                       province_name: { type: string, nullable: true }
 *                       city: { type: string }
 *                       shipping_cost: { type: number }
 *                       apply_shipping: { type: integer }
 *                       remarks: { type: string, nullable: true }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500: { description: Server error }
 */
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id,
        s.province_id,
        p.province_name,
        s.city,
        s.shipping_cost,
        s.apply_shipping,
        s.remarks,
        s.created_at,
        s.updated_at
      FROM set_shipping s
      LEFT JOIN provinces p
        ON p.id = s.province_id
      ORDER BY s.id DESC
    `);

    return NextResponse.json({
      success: true,
      shipping: rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// CREATE SHIPPING
/**
 * @swagger
 * /api/v1/addresses/shipping:
 *   post:
 *     summary: Create a shipping/city row
 *     description: Accepts either `province_id` (numeric id) or `province` (numeric id, or a province name string which is resolved case-insensitively to an id). `shipping_cost` may also be sent as `cost`.
 *     tags: [Admin - Address Reference]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [city, shipping_cost]
 *             properties:
 *               province_id: { type: integer, description: "Province id (fallback: province)" }
 *               province: { type: string, description: "Province id or province name; used if province_id is absent" }
 *               city: { type: string }
 *               shipping_cost: { type: number, description: "(fallback: cost)" }
 *               cost: { type: number }
 *               apply_shipping: { type: integer, default: 1 }
 *               remarks: { type: string }
 *     responses:
 *       200: { description: Shipping added successfully. }
 *       400: { description: Province, city and shipping cost are required. }
 *       404: { description: Province not found. }
 *       500: { description: Server error }
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const provinceInput = body.province_id ?? body.province;
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const shippingCost = body.shipping_cost ?? body.cost;
    const applyShipping = body.apply_shipping ?? 1;
    const remarks = typeof body.remarks === "string" ? body.remarks.trim() : "";

    if (!provinceInput || !city || shippingCost === "" || shippingCost === null || shippingCost === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Province, city and shipping cost are required.",
        },
        { status: 400 },
      );
    }

    let provinceId = Number(provinceInput);
    if (Number.isNaN(provinceId) || provinceId <= 0) {
      const [provinceRows] = await pool.query("SELECT id FROM provinces WHERE LOWER(province_name) = LOWER(?) LIMIT 1", [String(provinceInput).trim()]);
      if (!provinceRows.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Province not found.",
          },
          { status: 404 },
        );
      }
      provinceId = Number(provinceRows[0].id);
    }

    await pool.query(
      `
      INSERT INTO set_shipping
      (province_id, city, shipping_cost, apply_shipping, remarks)
      VALUES (?, ?, ?, ?, ?)
      `,
      [provinceId, city, shippingCost, applyShipping ?? 1, remarks || ""],
    );

    return NextResponse.json({
      success: true,
      message: "Shipping added successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// UPDATE SHIPPING
/**
 * @swagger
 * /api/v1/addresses/shipping:
 *   put:
 *     summary: Update a shipping/city row
 *     description: Accepts either `province_id` (numeric id) or `province` (numeric id, or a province name string which is resolved case-insensitively to an id). `shipping_cost` may also be sent as `cost`. The row id is passed in the request body (not the URL).
 *     tags: [Admin - Address Reference]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, city, shipping_cost]
 *             properties:
 *               id: { type: integer, description: "id of the set_shipping row to update" }
 *               province_id: { type: integer, description: "Province id (fallback: province)" }
 *               province: { type: string, description: "Province id or province name; used if province_id is absent" }
 *               city: { type: string }
 *               shipping_cost: { type: number, description: "(fallback: cost)" }
 *               cost: { type: number }
 *               apply_shipping: { type: integer, default: 1 }
 *               remarks: { type: string }
 *     responses:
 *       200: { description: Shipping updated successfully. }
 *       400: { description: "Shipping id is required, or province/city/cost missing" }
 *       404: { description: Province not found, or shipping row not found. }
 *       500: { description: Server error }
 */
export async function PUT(req) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    const provinceInput = body.province_id ?? body.province;
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const shippingCost = body.shipping_cost ?? body.cost;
    const applyShipping = body.apply_shipping ?? 1;
    const remarks = typeof body.remarks === "string" ? body.remarks.trim() : "";

    if (!id) {
      return NextResponse.json({ success: false, message: "Shipping id is required." }, { status: 400 });
    }

    if (!provinceInput || !city || shippingCost === "" || shippingCost === null || shippingCost === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Province, city and shipping cost are required.",
        },
        { status: 400 },
      );
    }

    let provinceId = Number(provinceInput);
    if (Number.isNaN(provinceId) || provinceId <= 0) {
      const [provinceRows] = await pool.query(
        "SELECT id FROM provinces WHERE LOWER(province_name) = LOWER(?) LIMIT 1",
        [String(provinceInput).trim()],
      );
      if (!provinceRows.length) {
        return NextResponse.json(
          { success: false, message: "Province not found." },
          { status: 404 },
        );
      }
      provinceId = Number(provinceRows[0].id);
    }

    const [existing] = await pool.query("SELECT id FROM set_shipping WHERE id = ? LIMIT 1", [id]);
    if (!existing.length) {
      return NextResponse.json({ success: false, message: "Shipping row not found." }, { status: 404 });
    }

    await pool.query(
      `
      UPDATE set_shipping
      SET province_id = ?, city = ?, shipping_cost = ?, apply_shipping = ?, remarks = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [provinceId, city, shippingCost, applyShipping ?? 1, remarks || "", id],
    );

    return NextResponse.json({
      success: true,
      message: "Shipping updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE SHIPPING
/**
 * @swagger
 * /api/v1/addresses/shipping:
 *   delete:
 *     summary: Delete a shipping/city row
 *     description: The row id may be supplied either in the JSON request body or as an `id` query-string parameter.
 *     tags: [Admin - Address Reference]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: false
 *         schema: { type: integer }
 *         description: Alternative to passing id in the request body.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: integer }
 *     responses:
 *       200: { description: Shipping deleted successfully. }
 *       400: { description: Shipping id is required. }
 *       404: { description: Shipping row not found. }
 *       500: { description: Server error }
 */
export async function DELETE(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body.id || new URL(req.url).searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ success: false, message: "Shipping id is required." }, { status: 400 });
    }

    const [existing] = await pool.query("SELECT id FROM set_shipping WHERE id = ? LIMIT 1", [id]);
    if (!existing.length) {
      return NextResponse.json({ success: false, message: "Shipping row not found." }, { status: 404 });
    }

    await pool.query("DELETE FROM set_shipping WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Shipping deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
