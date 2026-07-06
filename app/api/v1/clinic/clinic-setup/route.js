import pool from "@/utils/db";
import { assetUrl } from "@/utils/apiFormatters";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const SETTINGS_TABLE = "clinic_setup_settings";
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/clinic-setup");

const ensureSettingsTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`key\` VARCHAR(191) NOT NULL,
      \`value\` LONGTEXT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY ${SETTINGS_TABLE}_key_unique (\`key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const readSettings = async () => {
  await ensureSettingsTable();
  const [rows] = await pool.query(`SELECT * FROM ${SETTINGS_TABLE} ORDER BY id ASC`);

  return rows.map((row) => {
    if (row.key === "clinic_cover_image") {
      return {
        ...row,
        clinic_cover_image_full_url: assetUrl(row.value, "uploads/clinic-setup"),
      };
    }

    return {
      ...row,
      value: row.value,
    };
  });
};

export async function GET() {
  try {
    const clinic = await readSettings();

    return Response.json({
      success: true,
      clinic,
    });
  } catch (error) {
    console.error("GET CLINIC SETUP ERROR:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await ensureSettingsTable();

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let link = "";
    let description = "";
    let imageValue = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = String(formData.get("clinic_video_title") || "").trim();
      link = String(formData.get("clinic_video_link") || "").trim();
      description = String(formData.get("clinic_video_description") || "").trim();
      const coverImage = formData.get("clinic_cover_image");

      if (coverImage && coverImage.size > 0) {
        const bytes = await coverImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${coverImage.name}`;

        await mkdir(UPLOAD_DIR, { recursive: true });
        await writeFile(path.join(UPLOAD_DIR, filename), buffer);
        imageValue = `/uploads/clinic-setup/${filename}`;
      }
    } else {
      const body = await req.json();
      title = String(body.clinic_video_title || "").trim();
      link = String(body.clinic_video_link || "").trim();
      description = String(body.clinic_video_description || "").trim();
      imageValue = body.clinic_cover_image ? String(body.clinic_cover_image).trim() : null;
    }

    const upserts = [
      ["clinic_video_title", title],
      ["clinic_video_link", link],
      ["clinic_video_description", description],
    ];

    if (imageValue) {
      upserts.push(["clinic_cover_image", imageValue]);
    }

    for (const [key, value] of upserts) {
      await pool.execute(
        `INSERT INTO ${SETTINGS_TABLE} (\`key\`, \`value\`, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW()`,
        [key, value],
      );
    }

    return Response.json({
      success: true,
      message: "Clinic setup saved successfully.",
      clinic: await readSettings(),
    });
  } catch (error) {
    console.error("POST CLINIC SETUP ERROR:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
