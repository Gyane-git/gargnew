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

    const { province_id, city, shipping_cost, apply_shipping, remarks } = body;

    if (!province_id || !city || shipping_cost === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Province, city and shipping cost are required.",
        },
        { status: 400 },
      );
    }

    await pool.query(
      `
      INSERT INTO set_shipping
      (province_id, city, shipping_cost, apply_shipping, remarks)
      VALUES (?, ?, ?, ?, ?)
      `,
      [province_id, city, shipping_cost, apply_shipping ?? 1, remarks ?? ""],
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
