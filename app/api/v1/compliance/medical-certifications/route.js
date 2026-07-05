import pool from "@/utils/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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
