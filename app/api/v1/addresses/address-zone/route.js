import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET ALL ZONES ─────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/addresses/address-zone:
 *   get:
 *     summary: List all address zones
 *     description: Returns every row in address_zone, joined with set_shipping for the city name, ordered by id descending.
 *     tags: [Admin - Address Reference]
 *     responses:
 *       200:
 *         description: Zones fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 zones:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       city_id: { type: integer }
 *                       city_name: { type: string, nullable: true }
 *                       zone_name: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500: { description: Server error }
 */
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
         z.id,
         z.city_id,
         s.city AS city_name,
         z.zone_name,
         z.created_at,
         z.updated_at
       FROM address_zone z
       LEFT JOIN set_shipping s ON s.id = z.city_id
       ORDER BY z.id DESC`,
    );

    return NextResponse.json({
      success: true,
      zones: rows,
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

// ── CREATE ZONE ───────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/addresses/address-zone:
 *   post:
 *     summary: Create an address zone
 *     description: Creates a new zone under a city (set_shipping row). Rejects duplicate zone names within the same city (case-insensitive).
 *     tags: [Admin - Address Reference]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [city_id, zone_name]
 *             properties:
 *               city_id: { type: integer, description: "id of a set_shipping row" }
 *               zone_name: { type: string }
 *     responses:
 *       201:
 *         description: Zone created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Zone created successfully" }
 *                 zoneId: { type: integer }
 *       400: { description: "city_id or zone_name missing" }
 *       409: { description: Zone already exists in this city }
 *       500: { description: Server error }
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const { city_id, zone_name } = body;

    if (!city_id) {
      return NextResponse.json(
        {
          success: false,
          message: "City is required",
        },
        { status: 400 },
      );
    }

    if (!zone_name || zone_name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Zone name is required",
        },
        { status: 400 },
      );
    }

    // Check duplicate zone within same city
    const [existing] = await pool.query(
      `SELECT id
       FROM address_zone
       WHERE city_id = ?
       AND LOWER(zone_name) = LOWER(?)`,
      [city_id, zone_name.trim()],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone already exists in this city",
        },
        { status: 409 },
      );
    }

    const [result] = await pool.query(
      `INSERT INTO address_zone (city_id, zone_name)
       VALUES (?, ?)`,
      [city_id, zone_name.trim()],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Zone created successfully",
        zoneId: result.insertId,
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
