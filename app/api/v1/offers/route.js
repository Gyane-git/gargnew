import pool from "@/utils/db";
import { formatBanner } from "@/utils/apiFormatters";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET ALL BANNERS
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("include_inactive") === "1";
    const onlyOffer = searchParams.get("is_offer");

    const conditions = [];
    const params = [];

    if (!includeInactive) {
      conditions.push("status = 1");
    }

    if (onlyOffer !== null) {
      conditions.push("is_offer = ?");
      params.push(onlyOffer);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    // const [rows] = await pool.query(`SELECT * FROM offers ${where} ORDER BY id DESC`, params);
    const [rows] = await pool.query(`SELECT * FROM offers ORDER BY id DESC LIMIT 5`);

    return Response.json({
      success: true,
      offers: rows.map(formatBanner),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
