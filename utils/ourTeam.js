import pool from "@/utils/db";
import { assetUrl } from "@/utils/apiFormatters";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const TABLE = "our_team";
const UPLOAD_DIR = path.join(process.cwd(), "public/backend/our-team");

const normalizeStatus = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "active", "yes", "y", "true"].includes(normalized)) return 1;
  if (["0", "inactive", "no", "n", "false"].includes(normalized)) return 0;
  if (value === 1 || value === true) return 1;
  return 0;
};

export const formatTeamMember = (row = {}) => ({
  ...row,
  status: Number(row.status ?? 0),
  is_active: Number(row.status ?? 0) === 1,
  team_image_full_url: assetUrl(row.team_image, "backend/our-team"),
});

export const fetchTeamColumns = async () => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${TABLE}`);
  return rows.map((row) => row.Field);
};

export const fetchTeamMembers = async ({ activeOnly = false } = {}) => {
  const where = activeOnly ? "WHERE status = 1" : "";
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} ${where} ORDER BY id DESC`);
  return rows.map(formatTeamMember);
};

export const fetchTeamMemberById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? formatTeamMember(rows[0]) : null;
};

const readFilePath = async (file) => {
  if (!file || !file.size) return null;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = `${Date.now()}-${String(file.name || "team.jpg").replace(/\s+/g, "_")}`;
  const diskPath = path.join(UPLOAD_DIR, safeName);
  await writeFile(diskPath, buffer);

  return `backend/our-team/${safeName}`;
};

export const saveTeamMember = async ({ id = null, body = {}, file = null } = {}) => {
  const columns = await fetchTeamColumns();
  const existing = id ? await fetchTeamMemberById(id) : null;

  const teamName = String(body.team_name || body.teamName || body.name || existing?.team_name || "").trim();
  const teamRole = String(body.team_role || body.teamRole || body.role || existing?.team_role || "").trim();
  const teamLinkedin = String(body.team_linkedin || body.teamLinkedin || body.linkedin || existing?.team_linkedin || "").trim() || null;
  const teamEmail = String(body.team_email || body.teamEmail || body.email || existing?.team_email || "").trim() || null;
  const status = normalizeStatus(body.status ?? body.team_status ?? existing?.status ?? 0);

  let teamImage = existing?.team_image || null;
  const uploadedImage = await readFilePath(file);
  if (uploadedImage) {
    teamImage = uploadedImage;
  }

  if (!teamName || !teamRole) {
    return {
      success: false,
      message: "Team name and role are required.",
      status: 422,
    };
  }

  const payload = {};

  if (columns.includes("team_name")) payload.team_name = teamName;
  if (columns.includes("team_role")) payload.team_role = teamRole;
  if (columns.includes("team_image")) payload.team_image = teamImage;
  if (columns.includes("team_linkedin")) payload.team_linkedin = teamLinkedin;
  if (columns.includes("team_email")) payload.team_email = teamEmail;
  if (columns.includes("status")) payload.status = status;
  if (columns.includes("updated_at")) payload.updated_at = new Date();
  if (!id && columns.includes("created_at")) payload.created_at = new Date();

  const keys = Object.keys(payload);
  if (!keys.length) {
    return {
      success: false,
      message: "No matching columns found for our_team.",
      status: 500,
    };
  }

  if (!id) {
    const insertColumns = keys.map((column) => `\`${column}\``).join(", ");
    const values = keys.map((key) => payload[key]);
    const placeholders = keys.map(() => "?").join(", ");

    const [result] = await pool.query(
      `INSERT INTO ${TABLE} (${insertColumns}) VALUES (${placeholders})`,
      values,
    );

    return {
      success: true,
      id: result.insertId,
    };
  }

  const setClause = keys.map((key) => `\`${key}\` = ?`).join(", ");
  const values = keys.map((key) => payload[key]);

  const [result] = await pool.query(
    `UPDATE ${TABLE} SET ${setClause} WHERE id = ?`,
    [...values, id],
  );

  return {
    success: true,
    affectedRows: result.affectedRows,
  };
};

export const deleteTeamMember = async (id) => {
  const [result] = await pool.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  return {
    success: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
};
