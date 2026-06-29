import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET INQUIRY BY ID ─────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query("SELECT * FROM inquiries WHERE id = ?", [id]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      inquiry: rows[0],
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── DELETE INQUIRY ────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const [existing] = await pool.query("SELECT id FROM inquiries WHERE id = ?", [id]);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Inquiry not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM inquiries WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
