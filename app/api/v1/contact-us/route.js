import pool from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM inquiries ORDER BY id DESC");

    return NextResponse.json({
      success: true,
      inquiries: rows,
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

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name || body.full_name || "").trim();
    const email = String(body.email || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || body.description || body.inquiry || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, and message are required.",
        },
        { status: 400 },
      );
    }

    const created_at = new Date();

    const [result] = await pool.query(
      "INSERT INTO inquiries (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)",
      [name, email, subject || null, message, created_at],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Inquiry submitted successfully.",
        inquiryId: result.insertId,
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
