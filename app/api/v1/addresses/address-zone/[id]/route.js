import pool from "@/utils/db";
import { NextResponse } from "next/server";

// GET SINGLE ZONE
/**
 * @swagger
 * /api/v1/addresses/address-zone/{id}:
 *   get:
 *     summary: Get a single address zone
 *     tags: [Admin - Address Reference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Zone found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 zone:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     city_id: { type: integer }
 *                     zone_name: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *       404: { description: Zone not found }
 *       500: { description: Server error }
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query(
      `SELECT
          id,
          city_id,
          zone_name,
          created_at,
          updated_at
       FROM address_zone
       WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      zone: rows[0],
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

// UPDATE ZONE
/**
 * @swagger
 * /api/v1/addresses/address-zone/{id}:
 *   put:
 *     summary: Update an address zone
 *     description: Rejects duplicate zone names within the same city (case-insensitive), excluding this zone's own id.
 *     tags: [Admin - Address Reference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [city_id, zone_name]
 *             properties:
 *               city_id: { type: integer }
 *               zone_name: { type: string }
 *     responses:
 *       200: { description: Zone updated successfully. }
 *       400: { description: "city_id or zone_name missing" }
 *       404: { description: Zone not found }
 *       409: { description: Zone already exists in this city }
 *       500: { description: Server error }
 */
export async function PUT(req, { params }) {
  try {
    const { id } = params;
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

    // Check if zone exists
    const [existing] = await pool.query("SELECT id FROM address_zone WHERE id = ?", [id]);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone not found",
        },
        { status: 404 },
      );
    }

    // Prevent duplicate zone in same city
    const [duplicate] = await pool.query(
      `SELECT id
       FROM address_zone
       WHERE city_id = ?
         AND LOWER(zone_name) = LOWER(?)
         AND id <> ?`,
      [city_id, zone_name.trim(), id],
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone already exists in this city",
        },
        { status: 409 },
      );
    }

    await pool.query(
      `UPDATE address_zone
       SET city_id = ?, zone_name = ?
       WHERE id = ?`,
      [city_id, zone_name.trim(), id],
    );

    return NextResponse.json({
      success: true,
      message: "Zone updated successfully",
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

// DELETE ZONE
/**
 * @swagger
 * /api/v1/addresses/address-zone/{id}:
 *   delete:
 *     summary: Delete an address zone
 *     tags: [Admin - Address Reference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Zone deleted successfully. }
 *       404: { description: Zone not found }
 *       500: { description: Server error }
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const [existing] = await pool.query("SELECT id FROM address_zone WHERE id = ?", [id]);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Zone not found",
        },
        { status: 404 },
      );
    }

    await pool.query("DELETE FROM address_zone WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Zone deleted successfully",
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
