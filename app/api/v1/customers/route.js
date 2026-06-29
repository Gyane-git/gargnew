import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET ALL CUSTOMERS ─────────────────────────────────────────────
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT id, full_name, email, phone, status, created_at, updated_at FROM users ORDER BY id DESC");

    return NextResponse.json({
      success: true,
      customers: rows,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── CREATE CUSTOMER ───────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, password, status = 1 } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Name, email, and password are required" }, { status: 400 });
    }

    // Check if email already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Email already in use" }, { status: 409 });
    }

    const [result] = await pool.query("INSERT INTO users (name, email, phone, password, status) VALUES (?, ?, ?, ?, ?)", [name, email, phone || null, password, status]);

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        customerId: result.insertId,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
