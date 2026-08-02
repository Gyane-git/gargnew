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

  const [rows] = await pool.query(
    `
    SELECT
      css.id,
      css.key,
      css.value,
      css.created_at,
      css.updated_at,

      s.id AS storage_id,
      s.data_type,
      s.data_id,
      s.key AS storage_key,
      s.value AS storage_value,
      s.created_at AS storage_created_at,
      s.updated_at AS storage_updated_at

    FROM ${SETTINGS_TABLE} css

     LEFT JOIN storages s
      ON s.data_id = css.id

    WHERE css.key = 'clinic_cover_image'
    `,
  );

  if (!rows.length) {
    return {};
  }

  const first = rows[0];

  return {
    clinic_cover_image: {
      id: first.id,
      key: first.key,
      value: first.value,
      created_at: first.created_at,
      updated_at: first.updated_at,
      files_full_url: [],
      clinic_cover_image_full_url: assetUrl(first.value, "uploads/clinic-setup"),
      storage: rows
        .filter((row) => row.storage_id)
        .map((row) => ({
          id: row.storage_id,
          data_type: row.data_type,
          data_id: row.data_id,
          key: row.storage_key,
          value: row.storage_value,
          created_at: row.storage_created_at,
          updated_at: row.storage_updated_at,
        })),
    },
  };
};

/**
 * @swagger
 * /api/v1/clinic/clinic-setup:
 *   get:
 *     summary: Get clinic setup settings
 *     description: >
 *       No API-layer auth enforced. Reads all rows from the
 *       clinic_setup_settings key/value table (creating the table if it does
 *       not exist). The row keyed `clinic_cover_image` additionally includes
 *       a resolved `clinic_cover_image_full_url`.
 *     tags: [Clinic Setup]
 *     responses:
 *       200:
 *         description: Clinic setup settings fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 clinic:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       key: { type: string, example: "clinic_video_title" }
 *                       value: { type: string, nullable: true }
 *                       clinic_cover_image_full_url: { type: string, description: "Only present on the clinic_cover_image row." }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500:
 *         description: Internal server error.
 */
export async function GET() {
  try {
    const clinic = await readSettings();

    return Response.json({
      success: true,
      message: "Clinic setup fetched successfully.",
      clinic,
    });
  } catch (error) {
    console.error("GET CLINIC SETUP ERROR:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/clinic/clinic-setup:
 *   post:
 *     summary: Create or update clinic setup settings
 *     description: >
 *       No API-layer auth enforced. Accepts either multipart/form-data
 *       (required to upload clinic_cover_image as a file, saved under
 *       /public/uploads/clinic-setup) or application/json (where
 *       clinic_cover_image is a string path/URL). Upserts
 *       clinic_video_title, clinic_video_link, clinic_video_description, and
 *       (if provided) clinic_cover_image rows in the clinic_setup_settings
 *       table.
 *     tags: [Clinic Setup]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               clinic_video_title: { type: string }
 *               clinic_video_link: { type: string }
 *               clinic_video_description: { type: string }
 *               clinic_cover_image: { type: string, format: binary }
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clinic_video_title: { type: string }
 *               clinic_video_link: { type: string }
 *               clinic_video_description: { type: string }
 *               clinic_cover_image: { type: string }
 *     responses:
 *       200:
 *         description: Clinic setup saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Clinic setup saved successfully." }
 *                 clinic:
 *                   type: array
 *                   items: { type: object }
 *       500:
 *         description: Internal server error.
 */
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
