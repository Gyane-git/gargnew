import { NextResponse } from "next/server";
import pool from "@/utils/db";

const normalizeStoredUrl = (value, folder = "system-settings") => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/uploads/")) return raw;
  if (raw.startsWith("uploads/")) return `/${raw}`;
  if (raw.startsWith("/public/")) return raw.replace(/^\/public/, "");
  if (raw.startsWith("public/")) return `/${raw.replace(/^public\//, "")}`;
  return raw.startsWith("/") ? raw : `/uploads/${folder}/${raw}`;
};

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM system_settings");

    const settingsObj = {};
    rows.forEach((row) => {
      if (row.key === "company_logo_header") {
        settingsObj[row.key] = {
          value: row.value || "",
          header_logo_full_url: normalizeStoredUrl(row.value),
        };
      } else if (row.key === "company_logo_footer") {
        settingsObj[row.key] = {
          value: row.value || "",
          footer_logo_full_url: normalizeStoredUrl(row.value),
        };
      } else {
        settingsObj[row.key] = { value: row.value };
      }
    });

    return NextResponse.json({
      success: true,
      settings: settingsObj,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
