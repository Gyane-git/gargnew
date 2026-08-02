import pool from "@/utils/db";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/contact-us:
 *   get:
 *     summary: List all contact-us submissions
 *     description: Reads from the same `inquiries` table used by /api/v1/inquiries.
 *       Returns every row, unfiltered, newest first.
 *     tags: [Contact/Inquiries]
 *     responses:
 *       200:
 *         description: '{ success: true, inquiries } - all rows from the inquiries table.'
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
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

/**
 * @swagger
 * /api/v1/contact-us:
 *   post:
 *     summary: Submit a contact-us message
 *     description: Inserts into the shared `inquiries` table. Accepts several field
 *       aliases - name falls back to full_name, and message falls back to description
 *       or inquiry. subject is optional (stored as NULL if omitted).
 *     tags: [Contact/Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string, description: "Alias: full_name" }
 *               full_name: { type: string }
 *               email: { type: string }
 *               subject: { type: string }
 *               message: { type: string, description: "Aliases: description, inquiry" }
 *               description: { type: string }
 *               inquiry: { type: string }
 *     responses:
 *       201:
 *         description: '{ success: true, message: "Inquiry submitted successfully.", inquiryId }'
 *       400: { description: '{ success: false, message: "Name, email, and message are required." }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
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
