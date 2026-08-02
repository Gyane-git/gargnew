import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { assetUrl, formatProduct } from "@/utils/apiFormatters";

/**
 * @swagger
 * /api/v1/promotions:
 *   get:
 *     summary: List active promotions
 *     description: Mirrors Laravel BannerController::get_promotions (API\V1) - the plain
 *       variant (no mobile_file_path filter), distinct from the existing /promotions/mobile
 *       route used by the admin dashboard. Confirmed unused by web or admin frontends today,
 *       so this is a brand new route rather than a change to any live endpoint.
 *     tags: [Promotions]
 *     responses:
 *       200: { description: Promotions fetched successfully }
 */
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
        pi.id, pi.product_code, pi.file_path, pi.mobile_file_path, pi.is_offer, pi.status,
        pi.created_at, pi.updated_at,
        p.id AS product_id, p.parent_id, p.product_name, p.slug, p.product_description,
        p.key_specifications, p.packaging, p.warranty, p.category_id, p.delivery_target_days,
        p.discount, p.actual_price, p.sell_price, p.available_quantity, p.stock_quantity,
        p.brand_id, p.product_location, p.has_variations, p.flash_sale, p.weekly_offer,
        p.special_offer, p.today_deals, p.main_image, p.product_catalogue, p.status AS product_status
       FROM promotion_images pi
       INNER JOIN products p ON p.product_code = pi.product_code
       WHERE pi.status = 1
       ORDER BY pi.id DESC`,
    );

    const promotions = rows.map((row) => ({
      id: row.id,
      product_code: row.product_code,
      file_path: row.file_path,
      mobile_file_path: row.mobile_file_path,
      is_offer: row.is_offer,
      status: row.status,
      image_full_url: assetUrl(row.file_path, "uploads/promotion"),
      mobile_image_full_url: assetUrl(row.mobile_file_path, "uploads/promotion"),
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: formatProduct({
        id: row.product_id,
        parent_id: row.parent_id,
        product_code: row.product_code,
        product_name: row.product_name,
        slug: row.slug,
        product_description: row.product_description,
        key_specifications: row.key_specifications,
        packaging: row.packaging,
        warranty: row.warranty,
        category_id: row.category_id,
        delivery_target_days: row.delivery_target_days,
        discount: row.discount,
        actual_price: row.actual_price,
        sell_price: row.sell_price,
        available_quantity: row.available_quantity,
        stock_quantity: row.stock_quantity,
        brand_id: row.brand_id,
        product_location: row.product_location,
        has_variations: row.has_variations,
        flash_sale: row.flash_sale,
        weekly_offer: row.weekly_offer,
        special_offer: row.special_offer,
        today_deals: row.today_deals,
        main_image: row.main_image,
        product_catalogue: row.product_catalogue,
        status: row.product_status,
      }),
    }));

    return NextResponse.json({
      success: true,
      message: "Promotions fetched successfully.",
      promotions,
    });
  } catch (error) {
    console.error("GET PROMOTIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get promotions", error: error.message },
      { status: 500 },
    );
  }
}
