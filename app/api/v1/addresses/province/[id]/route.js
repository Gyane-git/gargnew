import pool from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query(
      `SELECT id, province_name, created_at, updated_at
       FROM provinces
       WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      province: rows[0],
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

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const { province } = body;

    if (!province || province.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Province name is required",
        },
        { status: 400 }
      );
    }

    // Check if province exists
    const [existing] = await pool.query(
      "SELECT id FROM provinces WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province not found",
        },
        { status: 404 }
      );
    }

    // Prevent duplicate province names
    const [duplicate] = await pool.query(
      "SELECT id FROM provinces WHERE LOWER(province_name)=LOWER(?) AND id <> ?",
      [province.trim(), id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province already exists",
        },
        { status: 409 }
      );
    }

    await pool.query(
      "UPDATE provinces SET province_name = ? WHERE id = ?",
      [province.trim(), id]
    );

    return NextResponse.json({
      success: true,
      message: "Province updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE PROVINCE
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if province exists
    const [existing] = await pool.query("SELECT id FROM provinces WHERE id = ?", [id]);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province not found",
        },
        { status: 404 },
      );
    }

    await pool.query("DELETE FROM provinces WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Province deleted successfully",
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
