import pool from "@/utils/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * @swagger
 * /api/v1/compliance/medical-certifications:
 *   get:
 *     summary: Get medical certifications content
 *     description: >
 *       No API-layer auth enforced. Reads the `medical_certifications` row
 *       from the compliances table. Legacy rows stored as plain HTML string
 *       are returned as content with an empty certifications array.
 *     tags: [CMS - Compliance]
 *     responses:
 *       200:
 *         description: Medical certifications content fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 content: { type: string }
 *                 certifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       fileUrl: { type: string, example: "/uploads/certifications/<uuid>.png" }
 *       500:
 *         description: Internal server error.
 */
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT `value` FROM compliances WHERE `key` = ?", ["medical_certifications"]);

    if (!rows.length) {
      return Response.json({
        success: true,
        content: "",
        certifications: [],
      });
    }

    let data;

    try {
      data = JSON.parse(rows[0].value);
    } catch {
      // Existing HTML only
      data = {
        content: rows[0].value,
        certifications: [],
      };
    }

    return Response.json({
      success: true,
      content: data.content || "",
      certifications: data.certifications || [],
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

/**
 * @swagger
 * /api/v1/compliance/medical-certifications:
 *   post:
 *     summary: Create or update medical certifications content
 *     description: >
 *       No API-layer auth enforced. Accepts multipart/form-data. `description`
 *       replaces the stored content, merging with any existing certifications.
 *       New certification entries are added by including indexed fields
 *       `certifications[<index>][title]` and `certifications[<index>][file]`
 *       (any field whose name contains "[file]" is treated as an uploaded
 *       certification file and saved under /public/uploads/certifications).
 *       Upserts the `medical_certifications` row in the compliances table.
 *     tags: [CMS - Compliance]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description: { type: string }
 *               certifications[0][title]: { type: string }
 *               certifications[0][file]: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Medical certifications saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Medical certifications saved successfully." }
 *                 certifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       fileUrl: { type: string }
 *       400:
 *         description: Description is required.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();

    const description = formData.get("description");

    if (!description?.trim()) {
      return Response.json(
        {
          success: false,
          message: "Description is required.",
        },
        { status: 400 },
      );
    }

    const uploadDir = path.join(process.cwd(), "public/uploads/certifications");

    await fs.mkdir(uploadDir, { recursive: true });

    const [existingRows] = await pool.query("SELECT `value` FROM compliances WHERE `key` = ?", ["medical_certifications"]);

    let existing = {
      content: description,
      certifications: [],
    };

    if (existingRows.length) {
      try {
        existing = JSON.parse(existingRows[0].value);
      } catch {
        existing = {
          content: description,
          certifications: [],
        };
      }
    }

    existing.content = description;

    for (const [key, value] of formData.entries()) {
      if (!key.includes("[file]")) continue;

      const index = key.match(/\d+/)?.[0];
      const title = formData.get(`certifications[${index}][title]`);

      if (!title || !value) continue;

      const extension = path.extname(value.name);
      const fileName = `${randomUUID()}${extension}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await value.arrayBuffer());

      await fs.writeFile(filePath, buffer);

      existing.certifications.push({
        id: randomUUID(),
        title,
        fileUrl: `/uploads/certifications/${fileName}`,
      });
    }

    const json = JSON.stringify(existing);

    if (existingRows.length) {
      await pool.query("UPDATE compliances SET `value`=?, updated_at=NOW() WHERE `key`=?", [json, "medical_certifications"]);
    } else {
      await pool.query("INSERT INTO compliances (`key`,`value`,created_at,updated_at) VALUES (?,?,NOW(),NOW())", ["medical_certifications", json]);
    }

    return Response.json({
      success: true,
      message: "Medical certifications saved successfully.",
      certifications: existing.certifications,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
