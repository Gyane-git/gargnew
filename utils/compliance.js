import pool from "@/utils/db";

export const COMPLIANCES_TABLE = "compliances";

export const parseComplianceValue = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;

  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const formatComplianceRecord = (row) => {
  const parsed = parseComplianceValue(row.value);
  const isObject = parsed && typeof parsed === "object" && !Array.isArray(parsed);

  const value = isObject
    ? parsed.value ||
      parsed.content ||
      parsed.aboutUsContent ||
      parsed.description ||
      parsed.text ||
      JSON.stringify(parsed)
    : parsed || "";

  const compliancefiles = isObject
    ? parsed.compliancefiles ||
      parsed.certifications ||
      parsed.files ||
      []
    : [];

  return {
    id: row.id,
    key: row.key,
    value,
    raw_value: row.value,
    compliancefiles,
    data: parsed,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const fetchComplianceRowByKey = async (key) => {
  const [rows] = await pool.query(
    "SELECT id, `key`, `value`, created_at, updated_at FROM compliances WHERE `key` = ? LIMIT 1",
    [key],
  );

  return rows[0] || null;
};

export const fetchAllComplianceRows = async () => {
  const [rows] = await pool.query(
    "SELECT id, `key`, `value`, created_at, updated_at FROM compliances ORDER BY id DESC",
  );

  return rows;
};
