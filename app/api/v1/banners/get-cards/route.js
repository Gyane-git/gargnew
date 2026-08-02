import pool from "@/utils/db";
import { assetUrl } from "@/utils/apiFormatters";

// Rewritten to mirror Laravel BannerController::get_cards (API\V1) exactly. Previously
// this route queried the unrelated carousel_images table and returned {cards,banners} -
// confirmed via full frontend search to have zero web/admin consumers, so it was dead
// code and safe to replace wholesale with the correct poster_cards-backed implementation.
/**
 * @swagger
 * /api/v1/banners/get-cards:
 *   get:
 *     summary: Get the homepage poster cards
 *     description: Mirrors Laravel BannerController::get_cards (API\V1). Reads the
 *       poster_cards table (card_1/card_2/card_3 image filenames), not carousel_images.
 *     tags: [Banners]
 *     responses:
 *       200: { description: Poster Cards fetched successfully }
 */
export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM poster_cards ORDER BY id DESC");

    const poster_cards = rows.map((row) => ({
      ...row,
      card1_full_url: assetUrl(row.card_1, "uploads"),
      card2_full_url: assetUrl(row.card_2, "uploads"),
      card3_full_url: assetUrl(row.card_3, "uploads"),
    }));

    return Response.json({
      success: true,
      message: "Poster Cards fetched successfully.",
      poster_cards,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to get poster_cards", error: error.message },
      { status: 500 },
    );
  }
}
