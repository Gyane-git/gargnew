import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET ALL INQUIRIES ─────────────────────────────────────────────
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM inquiries ORDER BY id DESC");

    return NextResponse.json({
      success: true,
      inquiries: rows,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── CREATE INQUIRY ────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: "Name, email, and message are required" }, { status: 400 });
    }
    const created_at = new Date();

    const [result] = await pool.query("INSERT INTO inquiries (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)", [name, email, subject || null, message, created_at]);

    return NextResponse.json(
      {
        success: true,
        message: "Inquiry submitted successfully",
        inquiryId: result.insertId,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
