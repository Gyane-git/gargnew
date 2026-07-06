import pool from "@/utils/db";
import { ensureClinicSetupTable, CLINIC_SETUP_TABLE } from "@/utils/clinicSetup";

export async function POST(req) {
  try {
    await ensureClinicSetupTable();

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const budget = String(body.budget || "").trim();
    const city = String(body.city || "").trim();
    const remarks = String(body.remarks || "").trim();

    if (!fullName || !email || !phone) {
      return Response.json(
        { success: false, message: "Full name, email, and phone are required." },
        { status: 400 },
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO ${CLINIC_SETUP_TABLE}
       (full_name, email, phone, budget, city, remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [fullName, email, phone, budget || null, city || null, remarks || null],
    );

    return Response.json({
      success: true,
      message: "Clinic setup request submitted successfully.",
      request_id: result.insertId,
    }, { status: 201 });
  } catch (error) {
    console.error("CLINIC SETUP STORE ERROR:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
