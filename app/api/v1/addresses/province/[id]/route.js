import pool from "@/utils/db";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/addresses/province/{id}:
 *   get:
 *     summary: Get a single province
 *     tags: [Admin - Address Reference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Province found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 province:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     province_name: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *       404: { description: Province not found }
 *       500: { description: Server error }
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query(
      `SELECT id, province_name, created_at, updated_at
       FROM provinces
       WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      province: rows[0],
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
 * /api/v1/addresses/province/{id}:
 *   put:
 *     summary: Update a province
 *     description: Rejects duplicate province names (case-insensitive), excluding this province's own id.
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
 *             required: [province]
 *             properties:
 *               province: { type: string, description: "Province name" }
 *     responses:
 *       200: { description: Province updated successfully. }
 *       400: { description: Province name is required }
 *       404: { description: Province not found }
 *       409: { description: Province already exists }
 *       500: { description: Server error }
 */
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const { province } = body;

    if (!province || province.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Province name is required",
        },
        { status: 400 }
      );
    }

    // Check if province exists
    const [existing] = await pool.query(
      "SELECT id FROM provinces WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province not found",
        },
        { status: 404 }
      );
    }

    // Prevent duplicate province names
    const [duplicate] = await pool.query(
      "SELECT id FROM provinces WHERE LOWER(province_name)=LOWER(?) AND id <> ?",
      [province.trim(), id]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province already exists",
        },
        { status: 409 }
      );
    }

    await pool.query(
      "UPDATE provinces SET province_name = ? WHERE id = ?",
      [province.trim(), id]
    );

    return NextResponse.json({
      success: true,
      message: "Province updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE PROVINCE
/**
 * @swagger
 * /api/v1/addresses/province/{id}:
 *   delete:
 *     summary: Delete a province
 *     tags: [Admin - Address Reference]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Province deleted successfully. }
 *       404: { description: Province not found }
 *       500: { description: Server error }
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if province exists
    const [existing] = await pool.query("SELECT id FROM provinces WHERE id = ?", [id]);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Province not found",
        },
        { status: 404 },
      );
    }

    await pool.query("DELETE FROM provinces WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Province deleted successfully",
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
