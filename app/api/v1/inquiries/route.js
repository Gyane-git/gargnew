import pool from "@/utils/db";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/inquiries:
 *   get:
 *     summary: List all inquiries
 *     description: Returns every row from the `inquiries` table, newest first. This is
 *       the same underlying table used by /api/v1/contact-us.
 *     tags: [Contact/Inquiries]
 *     responses:
 *       200: { description: '{ success: true, inquiries } - all rows from the inquiries table.' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
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

/**
 * @swagger
 * /api/v1/inquiries:
 *   post:
 *     summary: Create an inquiry
 *     description: Inserts into the shared `inquiries` table. Unlike /api/v1/contact-us,
 *       this endpoint reads name/email/subject/message directly from the body with no
 *       field-name fallbacks.
 *     tags: [Contact/Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: '{ success: true, message: "Inquiry submitted successfully", inquiryId }'
 *       400: { description: '{ success: false, message: "Name, email, and message are required" }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
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
