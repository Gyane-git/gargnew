import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { fetchAllComplianceRows, fetchComplianceRowByKey, formatComplianceRecord } from "@/utils/compliance";

async function upsertCompliance({ key, value }) {
  const existing = await fetchComplianceRowByKey(key);
  const payload = typeof value === "string" ? value : JSON.stringify(value);

  if (existing?.id) {
    await pool.query("UPDATE compliances SET `value` = ?, updated_at = NOW() WHERE `key` = ?", [payload, key]);
  } else {
    await pool.query("INSERT INTO compliances (`key`, `value`, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", [
      key,
      payload,
    ]);
  }
}

/**
 * @swagger
 * /api/v1/compliances:
 *   get:
 *     summary: Get one compliance record by key, or list all compliance records
 *     description: >
 *       No API-layer auth enforced. If the `key` query parameter is present,
 *       returns a single formatted compliance record (or null if not found).
 *       Otherwise returns every row in the compliances table.
 *     tags: [CMS - Compliance]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: false
 *         schema: { type: string }
 *         description: Compliance key to look up (e.g. about_us, about_company, privacy_policy, medical_certifications).
 *     responses:
 *       200:
 *         description: Compliance record(s) fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 compliance:
 *                   type: object
 *                   nullable: true
 *                   description: Present only when the `key` query parameter is supplied.
 *                   properties:
 *                     id: { type: integer }
 *                     key: { type: string }
 *                     value: { type: string }
 *                     raw_value: { type: string }
 *                     compliancefiles: { type: array, items: { type: object } }
 *                     data: { type: object, nullable: true }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *                 compliances:
 *                   type: array
 *                   description: Present only when the `key` query parameter is omitted.
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       key: { type: string }
 *                       value: { type: string }
 *                       raw_value: { type: string }
 *                       compliancefiles: { type: array, items: { type: object } }
 *                       data: { type: object, nullable: true }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500:
 *         description: Internal server error.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const row = await fetchComplianceRowByKey(key);
      if (!row) {
        return NextResponse.json({
          success: true,
          compliance: null,
        });
      }

      return NextResponse.json({
        success: true,
        compliance: formatComplianceRecord(row),
      });
    }

    const rows = await fetchAllComplianceRows();

    return NextResponse.json({
      success: true,
      compliances: rows.map(formatComplianceRecord),
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
 * /api/v1/compliances:
 *   post:
 *     summary: Create or update a compliance record by key
 *     description: >
 *       No API-layer auth enforced. Upserts a row in the compliances table
 *       keyed by `key`. If `value` is not a string it is JSON.stringified
 *       before being stored.
 *     tags: [CMS - Compliance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key: { type: string, example: "about_us" }
 *               value:
 *                 description: String or JSON-serializable object; stored as-is if a string, otherwise JSON.stringified.
 *                 oneOf:
 *                   - type: string
 *                   - type: object
 *     responses:
 *       200:
 *         description: Compliance saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Compliance saved successfully." }
 *       400:
 *         description: Compliance key is required, or compliance value is required.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const key = String(body.key || "").trim();

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: "Compliance key is required.",
        },
        { status: 400 },
      );
    }

    if (body.value === undefined || body.value === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Compliance value is required.",
        },
        { status: 400 },
      );
    }

    await upsertCompliance({ key, value: body.value });

    return NextResponse.json({
      success: true,
      message: "Compliance saved successfully.",
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
