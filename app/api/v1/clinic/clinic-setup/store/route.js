import pool from "@/utils/db";
import { ensureClinicSetupTable, CLINIC_SETUP_TABLE } from "@/utils/clinicSetup";

/**
 * @swagger
 * /api/v1/clinic/clinic-setup/store:
 *   post:
 *     summary: Submit a clinic setup request
 *     description: >
 *       No API-layer auth enforced. Inserts a new clinic setup request row
 *       (creating the underlying table if it does not exist).
 *       full_name, email, and phone are required.
 *     tags: [Clinic Setup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, phone]
 *             properties:
 *               full_name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               budget: { type: string }
 *               city: { type: string }
 *               remarks: { type: string }
 *     responses:
 *       201:
 *         description: Clinic setup request submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Clinic setup request submitted successfully." }
 *                 request_id: { type: integer }
 *       400:
 *         description: Full name, email, and phone are required.
 *       500:
 *         description: Internal server error.
 */
export async function POST(req) {
  try {
    await ensureClinicSetupTable();

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "").trim();
    const budget = String(body.budget || "").trim();
    const city = String(body.city || "").trim();
    const remarks = String(body.remarks || "").trim();

    if (!fullName || !email || !phone) {
      return Response.json({ success: false, message: "Full name, email, and phone are required." }, { status: 400 });
    }

    const [result] = await pool.execute(
      `INSERT INTO ${CLINIC_SETUP_TABLE}
       (full_name, email, phone, budget, city, remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [fullName, email, phone, budget || null, city || null, remarks || null],
    );

    return Response.json(
      {
        success: true,
        message: "Clinic setup request submitted successfully.",
        request_id: result.insertId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CLINIC SETUP STORE ERROR:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
