import pool from "@/utils/db";
import fs from "fs/promises";
import path from "path";

/**
 * @swagger
 * /api/v1/compliance/medical-certifications/{id}:
 *   delete:
 *     summary: Delete a single medical certification entry
 *     description: >
 *       No API-layer auth enforced. Removes the matching certification
 *       (matched by its own generated id, not the compliances row id) from
 *       the `medical_certifications` JSON value and deletes its uploaded
 *       file from disk (missing files are ignored).
 *     tags: [CMS - Compliance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Certification entry id (as stored in the certifications array).
 *     responses:
 *       200:
 *         description: Certification deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Certification deleted successfully." }
 *       404:
 *         description: Medical certifications not found, or certification not found.
 *       500:
 *         description: Internal server error, or invalid medical certifications data.
 */
export async function DELETE(_request, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query("SELECT `value` FROM compliances WHERE `key` = ?", ["medical_certifications"]);

    if (!rows.length) {
      return Response.json(
        {
          success: false,
          message: "Medical certifications not found.",
        },
        { status: 404 },
      );
    }

    let data;

    try {
      data = JSON.parse(rows[0].value);
    } catch {
      return Response.json(
        {
          success: false,
          message: "Invalid medical certifications data.",
        },
        { status: 500 },
      );
    }

    const certification = data.certifications.find((item) => String(item.id) === String(id));

    if (!certification) {
      return Response.json(
        {
          success: false,
          message: "Certification not found.",
        },
        { status: 404 },
      );
    }

    // Delete image file (ignore error if file doesn't exist)
    try {
      const filePath = path.join(process.cwd(), "public", certification.fileUrl.replace(/^\//, ""));

      await fs.unlink(filePath);
    } catch {}

    // Remove certification from JSON
    data.certifications = data.certifications.filter((item) => String(item.id) !== String(id));

    await pool.query("UPDATE compliances SET `value` = ?, updated_at = NOW() WHERE `key` = ?", [JSON.stringify(data), "medical_certifications"]);

    return Response.json({
      success: true,
      message: "Certification deleted successfully.",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
