import pool from "@/utils/db";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/inquiries/{id}:
 *   get:
 *     summary: Get a single inquiry by id
 *     tags: [Contact/Inquiries]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: '{ success: true, inquiry } with the matching row.' }
 *       404: { description: '{ success: false, message: "Inquiry not found" }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
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

/**
 * @swagger
 * /api/v1/inquiries/{id}:
 *   delete:
 *     summary: Delete an inquiry by id
 *     tags: [Contact/Inquiries]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: '{ success: true, message: "Inquiry deleted successfully" }' }
 *       404: { description: '{ success: false, message: "Inquiry not found" }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
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
