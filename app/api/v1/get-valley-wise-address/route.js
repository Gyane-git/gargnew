import pool from "@/utils/db";

/**
 * @swagger
 * /api/v1/get-valley-wise-address:
 *   get:
 *     summary: List Kathmandu/Lalitpur shipping zones
 *     description: Mirrors Laravel SettingController::get_valley_wise_address (API\V1).
 *       Returns a RAW JSON array with no {success,message} envelope - this matches
 *       Laravel's response()->json($shippings) exactly, unlike almost every other endpoint.
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Array of set_shipping rows for Kathmandu/Lalitpur
 *         content:
 *           application/json:
 *             schema: { type: array, items: { type: object } }
 */
export async function GET() {
  // Laravel scope: where city LIKE 'Kathmandu%' OR city LIKE 'Lalitpur%'
  const [rows] = await pool.query(
    "SELECT * FROM set_shipping WHERE city LIKE 'Kathmandu%' OR city LIKE 'Lalitpur%'",
  );

  // No envelope by design - Laravel returns the bare array here.
  return Response.json(rows);
}
