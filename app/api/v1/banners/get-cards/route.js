import pool from "@/utils/db";
import { formatBanner } from "@/utils/apiFormatters";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM carousel_images WHERE is_offer = 1 AND status = 1 ORDER BY id DESC",
    );

    return Response.json({
      success: true,
      cards: rows.map(formatBanner),
      banners: rows.map(formatBanner),
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
