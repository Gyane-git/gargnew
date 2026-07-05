import pool from "@/utils/db";
import { NextResponse } from "next/server";

// GET SINGLE ZONE
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query(
      `SELECT
          id,
          city_id,
          zone_name,
          created_at,
          updated_at
       FROM address_zone
       WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      zone: rows[0],
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

// UPDATE ZONE
export async function PUT(req, { params }) {
  try {
    const { id } = params;
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

    // Check if zone exists
    const [existing] = await pool.query("SELECT id FROM address_zone WHERE id = ?", [id]);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone not found",
        },
        { status: 404 },
      );
    }

    // Prevent duplicate zone in same city
    const [duplicate] = await pool.query(
      `SELECT id
       FROM address_zone
       WHERE city_id = ?
         AND LOWER(zone_name) = LOWER(?)
         AND id <> ?`,
      [city_id, zone_name.trim(), id],
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone already exists in this city",
        },
        { status: 409 },
      );
    }

    await pool.query(
      `UPDATE address_zone
       SET city_id = ?, zone_name = ?
       WHERE id = ?`,
      [city_id, zone_name.trim(), id],
    );

    return NextResponse.json({
      success: true,
      message: "Zone updated successfully",
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

// DELETE ZONE
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const [existing] = await pool.query("SELECT id FROM address_zone WHERE id = ?", [id]);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone not found",
        },
        { status: 404 },
      );
    }

    await pool.query("DELETE FROM address_zone WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Zone deleted successfully",
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
