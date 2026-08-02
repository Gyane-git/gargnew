import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { fetchComplianceRowByKey, formatComplianceRecord } from "@/utils/compliance";

async function upsertByKey(key, value) {
  const [existing] = await pool.query("SELECT id FROM compliances WHERE `key` = ? LIMIT 1", [key]);
  const payload = typeof value === "string" ? value : JSON.stringify(value);

  if (existing.length) {
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
 * /api/v1/compliances/{key}:
 *   get:
 *     summary: Get a compliance record by key
 *     description: No API-layer auth enforced. Reads a single row from the compliances table by its `key`.
 *     tags: [CMS - Compliance]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: Compliance key (e.g. about_us, about_company, privacy_policy, medical_certifications).
 *     responses:
 *       200:
 *         description: Compliance record fetched successfully (compliance is null if not found).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 compliance:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id: { type: integer }
 *                     key: { type: string }
 *                     value: { type: string }
 *                     raw_value: { type: string }
 *                     compliancefiles: { type: array, items: { type: object } }
 *                     data: { type: object, nullable: true }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *       500:
 *         description: Internal server error.
 */
export async function GET(_request, { params }) {
  try {
    const row = await fetchComplianceRowByKey(params.key);

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
 * /api/v1/compliances/{key}:
 *   put:
 *     summary: Update (or create) a compliance record by key
 *     description: >
 *       No API-layer auth enforced. Upserts a row in the compliances table
 *       keyed by the `key` path parameter. If `value` is not a string it is
 *       JSON.stringified before being stored.
 *     tags: [CMS - Compliance]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: Compliance key (e.g. about_us, about_company, privacy_policy, medical_certifications).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 description: String or JSON-serializable object; stored as-is if a string, otherwise JSON.stringified.
 *                 oneOf:
 *                   - type: string
 *                   - type: object
 *     responses:
 *       200:
 *         description: Compliance updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Compliance updated successfully." }
 *       400:
 *         description: Compliance value is required.
 *       500:
 *         description: Internal server error.
 */
export async function PUT(request, { params }) {
  try {
    const body = await request.json();

    if (body.value === undefined || body.value === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Compliance value is required.",
        },
        { status: 400 },
      );
    }

    await upsertByKey(params.key, body.value);

    return NextResponse.json({
      success: true,
      message: "Compliance updated successfully.",
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
 * /api/v1/compliances/{key}:
 *   delete:
 *     summary: Delete a compliance record by key
 *     description: >
 *       No API-layer auth enforced. Deletes the row from the compliances
 *       table matching `key`. Returns success even if no row existed.
 *     tags: [CMS - Compliance]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: Compliance key (e.g. about_us, about_company, privacy_policy, medical_certifications).
 *     responses:
 *       200:
 *         description: Compliance deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Compliance deleted successfully." }
 *       500:
 *         description: Internal server error.
 */
export async function DELETE(_request, { params }) {
  try {
    const row = await fetchComplianceRowByKey(params.key);

    if (!row) {
      return NextResponse.json(
        {
          success: true,
          message: "Compliance deleted successfully.",
        },
      );
    }

    await pool.query("DELETE FROM compliances WHERE `key` = ?", [params.key]);

    return NextResponse.json({
      success: true,
      message: "Compliance deleted successfully.",
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
