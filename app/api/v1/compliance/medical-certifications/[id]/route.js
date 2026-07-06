import pool from "@/utils/db";
import fs from "fs/promises";
import path from "path";

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
