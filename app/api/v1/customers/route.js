import pool from "@/utils/db";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: List all customers
 *     description: No API-layer authentication is enforced on this route.
 *     tags: [Admin - Customers]
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       full_name: { type: string }
 *                       email: { type: string }
 *                       phone: { type: string }
 *                       status: { type: integer }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500: { description: Internal server error }
 */
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

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create a new customer
 *     description: No API-layer authentication is enforced on this route.
 *     tags: [Admin - Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               status: { type: integer, default: 1 }
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 customerId: { type: integer }
 *       400: { description: Name, email, and password are required }
 *       409: { description: Email already in use }
 *       500: { description: Internal server error }
 */
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
