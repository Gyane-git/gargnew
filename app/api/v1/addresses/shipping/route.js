import pool from "@/utils/db";
import { NextResponse } from "next/server";

// GET ALL SHIPPING
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
