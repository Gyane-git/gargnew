import pool from "@/utils/db";
import { NextResponse } from "next/server";

const TABLE = "grievances";

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
