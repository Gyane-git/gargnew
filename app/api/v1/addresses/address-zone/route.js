import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET ALL ZONES ─────────────────────────────────────────────
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id, city_id, zone_name, created_at, updated_at
       FROM address_zone
       ORDER BY id DESC`,
    );

    return NextResponse.json({
      success: true,
      zones: rows,
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

// ── CREATE ZONE ───────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();

    const { city_id, zone_name } = body;

    if (!city_id) {
      return NextResponse.json(
        {
          success: false,
          message: "City is required",
        },
        { status: 400 },
      );
    }

    if (!zone_name || zone_name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Zone name is required",
        },
        { status: 400 },
      );
    }

    // Check duplicate zone within same city
    const [existing] = await pool.query(
      `SELECT id
       FROM address_zone
       WHERE city_id = ?
       AND LOWER(zone_name) = LOWER(?)`,
      [city_id, zone_name.trim()],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone already exists in this city",
        },
        { status: 409 },
      );
    }

    const [result] = await pool.query(
      `INSERT INTO address_zone (city_id, zone_name)
       VALUES (?, ?)`,
      [city_id, zone_name.trim()],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Zone created successfully",
        zoneId: result.insertId,
      },
      { status: 201 },
    );
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
