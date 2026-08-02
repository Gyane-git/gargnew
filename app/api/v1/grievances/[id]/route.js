import pool from "@/utils/db";
import { NextResponse } from "next/server";

const TABLE = "grievances";

/**
 * @swagger
 * /api/v1/grievances/{id}:
 *   delete:
 *     summary: Delete a grievance by id
 *     tags: [Grievances]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: '{ success: true, message: "Grievance deleted successfully." }' }
 *       400: { description: '{ success: false, message: "Grievance id is required." } - returned when id is missing/not a truthy number.' }
 *       404: { description: '{ success: false, message: "Grievance not found." }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const grievanceId = Number(id);

    if (!grievanceId) {
      return NextResponse.json(
        { success: false, message: "Grievance id is required." },
        { status: 400 },
      );
    }

    const [existing] = await pool.query(`SELECT id FROM ${TABLE} WHERE id = ? LIMIT 1`, [grievanceId]);
    if (!existing.length) {
      return NextResponse.json(
        { success: false, message: "Grievance not found." },
        { status: 404 },
      );
    }

    await pool.query(`DELETE FROM ${TABLE} WHERE id = ?`, [grievanceId]);

    return NextResponse.json({
      success: true,
      message: "Grievance deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}
