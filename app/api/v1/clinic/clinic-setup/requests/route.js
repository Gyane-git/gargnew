import pool from "@/utils/db";
import { ensureClinicSetupTable, CLINIC_SETUP_TABLE } from "@/utils/clinicSetup";

export async function GET() {
  try {
    await ensureClinicSetupTable();

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, budget, city, remarks, created_at, updated_at
       FROM ${CLINIC_SETUP_TABLE}
       ORDER BY id DESC`,
    );

    return Response.json({
      success: true,
      requests: rows,
    });
  } catch (error) {
    console.error("CLINIC SETUP REQUESTS ERROR:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
