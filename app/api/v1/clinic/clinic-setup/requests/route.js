import pool from "@/utils/db";
import { ensureClinicSetupTable, CLINIC_SETUP_TABLE } from "@/utils/clinicSetup";

/**
 * @swagger
 * /api/v1/clinic/clinic-setup/requests:
 *   get:
 *     summary: List clinic setup requests
 *     description: >
 *       No API-layer auth enforced. Returns all submitted clinic setup
 *       requests, newest first, from the clinic setup requests table
 *       (creating the table if it does not exist).
 *     tags: [Clinic Setup]
 *     responses:
 *       200:
 *         description: Clinic setup requests fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       full_name: { type: string }
 *                       email: { type: string }
 *                       phone: { type: string }
 *                       budget: { type: string, nullable: true }
 *                       city: { type: string, nullable: true }
 *                       remarks: { type: string, nullable: true }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500:
 *         description: Internal server error.
 */
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
