import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET ALL PROVINCES ─────────────────────────────────────────────
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id, province_name, created_at, updated_at
       FROM provinces
       ORDER BY id DESC`,
    );

    return NextResponse.json({
      success: true,
      provinces: rows,
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

// ── CREATE PROVINCE ───────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { province } = body;

    if (!province || province.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Province name is required",
        },
        { status: 400 },
      );
    }

    // Check if province already exists
    const [existing] = await pool.query("SELECT id FROM provinces WHERE LOWER(province_name) = LOWER(?)", [province.trim()]);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province already exists",
        },
        { status: 409 },
      );
    }

    const [result] = await pool.query("INSERT INTO provinces (province_name) VALUES (?)", [province.trim()]);

    return NextResponse.json(
      {
        success: true,
        message: "Province created successfully",
        provinceId: result.insertId,
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
