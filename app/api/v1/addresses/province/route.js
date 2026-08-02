import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET ALL PROVINCES ─────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/addresses/province:
 *   get:
 *     summary: List all provinces
 *     tags: [Admin - Address Reference]
 *     responses:
 *       200:
 *         description: Provinces fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 provinces:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       province_name: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500: { description: Server error }
 */
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
/**
 * @swagger
 * /api/v1/addresses/province:
 *   post:
 *     summary: Create a province
 *     description: Rejects duplicate province names (case-insensitive).
 *     tags: [Admin - Address Reference]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [province]
 *             properties:
 *               province: { type: string, description: "Province name" }
 *     responses:
 *       201:
 *         description: Province created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Province created successfully" }
 *                 provinceId: { type: integer }
 *       400: { description: Province name is required }
 *       409: { description: Province already exists }
 *       500: { description: Server error }
 */
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
