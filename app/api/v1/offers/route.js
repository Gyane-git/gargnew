import { NextResponse } from "next/server";
import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM offers ORDER BY id DESC LIMIT 5");

    return NextResponse.json({
      success: true,
      offers: rows.map((offer) => ({
        ...offer,
        offer_image_full_url: offer.offer_image_full_url || offer.image_url || offer.image ? `/uploads/offers/${offer.image}` : null,
      })),
    });
  } catch (error) {
    console.error("GET OFFERS ERROR:", error);
    // If the table doesn't exist, just return an empty array to prevent 404s/crashes
    return NextResponse.json({ success: true, offers: [] });
  }
}
