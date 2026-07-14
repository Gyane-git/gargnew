import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pool from "@/utils/db";

const SETTINGS_TABLE = "system_settings";
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/system-settings");

const SETTINGS_KEYS = [
  "company_name",
  "primary_email",
  "secondary_email",
  "whatsapp",
  "primary_phone",
  "secondary_phone",
  "address",
  "website_link",
  "free_shipping_mode",
  "free_shipping_threshold_inside_of_valley",
  "free_shipping_threshold_out_of_valley",
  "category_display_count",
  "map_url",
  "company_logo_header",
  "company_logo_footer",
];

const normalizeString = (value) => String(value ?? "").trim();

const getColumns = async () => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${SETTINGS_TABLE}`);
  return rows.map((row) => row.Field);
};

const ensureTable = async () => {
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

  const requiredColumns = [
    ["key", "VARCHAR(191) NOT NULL AFTER id"],
    ["value", "LONGTEXT NULL AFTER key"],
    ["created_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER value"],
    ["updated_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"],
  ];

  for (const [column, definition] of requiredColumns) {
    const [rows] = await pool.query(`SHOW COLUMNS FROM ${SETTINGS_TABLE} LIKE ?`, [column]);
    if (!rows.length) {
      await pool.query(`ALTER TABLE ${SETTINGS_TABLE} ADD COLUMN ${column} ${definition}`);
    }
  }
};

const normalizeStoredUrl = (value, folder) => {
  const raw = normalizeString(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/uploads/")) return raw;
  if (raw.startsWith("uploads/")) return `/${raw}`;
  if (raw.startsWith("/public/")) return raw.replace(/^\/public/, "");
  if (raw.startsWith("public/")) return `/${raw.replace(/^public\//, "")}`;
  return raw.startsWith("/") ? raw : `/uploads/${folder}/${raw}`;
};

const readSettings = async () => {
  await ensureTable();
  const [rows] = await pool.query(`SELECT \`key\`, \`value\` FROM ${SETTINGS_TABLE} ORDER BY id ASC`);

  const settings = {};

  for (const row of rows) {
    let value = row.value;
    try {
      value = typeof value === "string" ? JSON.parse(value) : value;
    } catch {
      value = row.value;
    }

    if (row.key === "company_logo_header") {
      settings[row.key] = {
        value: value || "",
        header_logo_full_url: normalizeStoredUrl(value, "system-settings"),
      };
      continue;
    }

    if (row.key === "company_logo_footer") {
      settings[row.key] = {
        value: value || "",
        footer_logo_full_url: normalizeStoredUrl(value, "system-settings"),
      };
      continue;
    }

    settings[row.key] = { value: value ?? "" };
  }

  return settings;
};

const upsertSetting = async (key, value) => {
  const columns = await getColumns();
  if (!columns.includes("key") || !columns.includes("value")) {
    throw new Error("system_settings table is missing required columns.");
  }

  const existing = await pool.query(`SELECT id FROM ${SETTINGS_TABLE} WHERE \`key\` = ? LIMIT 1`, [key]);
  const [rows] = existing;

  if (rows.length > 0) {
    await pool.query(`UPDATE ${SETTINGS_TABLE} SET \`value\` = ?, updated_at = NOW() WHERE \`key\` = ?`, [value, key]);
  } else {
    await pool.query(`INSERT INTO ${SETTINGS_TABLE} (\`key\`, \`value\`, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`, [key, value]);
  }
};

const saveUploadedFile = async (file, folder = "system-settings") => {
  if (!file || typeof file !== "object" || !file.size) return null;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const extension = path.extname(file.name || "");
  const filename = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${folder}/${filename}`;
};

export async function GET() {
  try {
    const settings = await readSettings();
    return Response.json({
      success: true,
      settings,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  return PATCH(req);
}

export async function PATCH(req) {
  try {
    await ensureTable();

    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    const payload = isFormData ? await req.formData() : await req.json();
    const getValue = (key) => (typeof payload?.get === "function" ? payload.get(key) : payload?.[key]);

    const headerLogo = getValue("company_logo_header_file") || getValue("company_logo_header");
    const footerLogo = getValue("company_logo_footer_file") || getValue("company_logo_footer");

    const headerLogoPath = await saveUploadedFile(headerLogo, "system-settings");
    const footerLogoPath = await saveUploadedFile(footerLogo, "system-settings");

    const settingsMap = {
      company_name: normalizeString(getValue("company_name")),
      primary_email: normalizeString(getValue("primary_email")),
      secondary_email: normalizeString(getValue("secondary_email")),
      whatsapp: normalizeString(getValue("whatsapp")),
      primary_phone: normalizeString(getValue("primary_phone")),
      secondary_phone: normalizeString(getValue("secondary_phone")),
      address: normalizeString(getValue("address")),
      website_link: normalizeString(getValue("website_link")),
      free_shipping_mode: normalizeString(getValue("free_shipping_mode")),
      free_shipping_threshold_inside_of_valley: normalizeString(getValue("free_shipping_threshold_inside_of_valley")),
      free_shipping_threshold_out_of_valley: normalizeString(getValue("free_shipping_threshold_out_of_valley")),
      category_display_count: normalizeString(getValue("category_display_count")),
      map_url: normalizeString(getValue("map_url")),
      company_logo_header: headerLogoPath || normalizeString(getValue("company_logo_header_path")) || normalizeString(getValue("company_logo_header")),
      company_logo_footer: footerLogoPath || normalizeString(getValue("company_logo_footer_path")) || normalizeString(getValue("company_logo_footer")),
    };

    for (const key of SETTINGS_KEYS) {
      if (Object.prototype.hasOwnProperty.call(settingsMap, key)) {
        const value = settingsMap[key];
        if (value !== undefined) {
          await upsertSetting(key, value);
        }
      }
    }

    const settings = await readSettings();

    return Response.json({
      success: true,
      message: "Website settings saved successfully.",
      settings,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}
