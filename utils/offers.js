import pool from "@/utils/db";
import { assetUrl } from "@/utils/apiFormatters";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const TABLE = "offers";
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/offers");
let cachedColumnsPromise = null;

const normalizeBoolean = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (value === true || value === 1) return 1;

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "active"].includes(normalized)) return 1;
  if (["0", "false", "no", "n", "inactive"].includes(normalized)) return 0;
  return fallback;
};

const readFilePath = async (file) => {
  if (!file || !file.size) return null;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = `${Date.now()}-${String(file.name || "offer.jpg").replace(/\s+/g, "_")}`;
  const diskPath = path.join(UPLOAD_DIR, safeName);
  await writeFile(diskPath, buffer);

  return safeName;
};

export const formatOffer = (row = {}) => ({
  ...row,
  offer_image_full_url: assetUrl(row.offer_image || row.file_path || row.image, "uploads/offers"),
  offer_image_url: assetUrl(row.offer_image || row.file_path || row.image, "uploads/offers"),
});

export const fetchOffers = async ({ activeOnly = true, limit = null } = {}) => {
  const conditions = [];
  const params = [];

  if (activeOnly) {
    conditions.push("(is_active = 1)");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitSql = Number(limit) > 0 ? "LIMIT ?" : "";
  if (limitSql) params.push(Number(limit));

  const [rows] = await pool.query(`SELECT * FROM ${TABLE} ${where} ORDER BY id DESC ${limitSql}`, params);

  return rows.map(formatOffer);
};

export const fetchOfferById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? formatOffer(rows[0]) : null;
};

export const saveOffer = async ({ id = null, body = {}, file = null } = {}) => {
  if (!cachedColumnsPromise) {
    cachedColumnsPromise = pool
      .query(`SHOW COLUMNS FROM ${TABLE}`)
      .then(([rows]) => rows.map((row) => row.Field))
      .catch((error) => {
        cachedColumnsPromise = null;
        throw error;
      });
  }

  const columns = await cachedColumnsPromise;
  const existing = id ? await fetchOfferById(id) : null;

  const title = String(body.title || existing?.title || "").trim();
  const startDate = String(body.start_date || body.startDate || existing?.start_date || "").trim() || null;
  const endDate = String(body.end_date || body.endDate || existing?.end_date || "").trim() || null;
  const isActive = normalizeBoolean(body.is_active ?? body.active ?? existing?.is_active ?? 1, 1);
  const isOffer = normalizeBoolean(body.is_offer ?? body.isOffer ?? existing?.is_offer ?? 1, 1);

  if (!title) {
    return {
      success: false,
      message: "Title is required.",
      status: 422,
    };
  }

  let image = existing?.offer_image || existing?.file_path || existing?.image || null;
  const uploaded = await readFilePath(file);
  if (uploaded) image = uploaded;

  const payload = {};

  if (columns.includes("title")) payload.title = title;
  if (columns.includes("offer_image")) payload.offer_image = image;
  if (columns.includes("file_path")) payload.file_path = image;
  if (columns.includes("image")) payload.image = image;
  if (columns.includes("start_date")) payload.start_date = startDate;
  if (columns.includes("end_date")) payload.end_date = endDate;
  if (columns.includes("is_active")) payload.is_active = isActive;
  if (columns.includes("is_offer")) payload.is_offer = isOffer;
  if (columns.includes("created_at") && !id) payload.created_at = new Date();
  if (columns.includes("updated_at")) payload.updated_at = new Date();

  const keys = Object.keys(payload);
  if (!keys.length) {
    return {
      success: false,
      message: "No matching columns found for offers.",
      status: 500,
    };
  }

  if (!id) {
    const insertColumns = keys.map((column) => `\`${column}\``).join(", ");
    const values = keys.map((key) => payload[key]);
    const placeholders = keys.map(() => "?").join(", ");

    const [result] = await pool.query(`INSERT INTO ${TABLE} (${insertColumns}) VALUES (${placeholders})`, values);

    return {
      success: true,
      id: result.insertId,
    };
  }

  const setClause = keys.map((key) => `\`${key}\` = ?`).join(", ");
  const values = keys.map((key) => payload[key]);

  const [result] = await pool.query(`UPDATE ${TABLE} SET ${setClause} WHERE id = ?`, [...values, id]);

  return {
    success: true,
    affectedRows: result.affectedRows,
  };
};

export const deleteOffer = async (id) => {
  const [result] = await pool.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  return {
    success: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
};
