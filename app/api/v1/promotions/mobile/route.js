import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { assetUrl } from "@/utils/apiFormatters";

const PROMOTION_PATH = "/uploads/promotion";
const PRODUCT_IMAGE_PATH = "/uploads/products";
const REVIEW_IMAGE_PATH = "/uploads/reviews";
const CATALOGUE_PATH = "/uploads/catalogues";

function buildFullUrl(basePath, fileName) {
  return assetUrl(fileName, basePath.replace(/^\/+/, ""), null);
}

/**
 * @swagger
 * /api/v1/promotions/mobile:
 *   get:
 *     summary: Get active promotions with product, review, and storage details
 *     description: Joins promotion_images (status = 1) with products (status = 1), left joins
 *       storages by data_id, and attaches aggregated product_reviews per product_code.
 *     tags: [Promotions]
 *     responses:
 *       200:
 *         description: Mobile promotions fetched successfully.
 *       500:
 *         description: Failed to fetch promotion products.
 */
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        pi.id AS banner_id,
        pi.product_code AS banner_product_code,
        pi.file_path,
        pi.mobile_file_path,
        pi.is_offer,
        pi.status AS banner_status,
        pi.created_at AS banner_created_at,
        pi.updated_at AS banner_updated_at,

        p.id AS product_id,
        p.product_code,
        p.parent_id,
        p.product_name,
        p.slug,
        p.product_description,
        p.key_specifications,
        p.packaging,
        p.warranty,
        p.category_id,
        p.delivery_target_days,
        p.discount,
        p.actual_price,
        p.sell_price,
        p.available_quantity,
        p.stock_quantity,
        p.brand_id,
        p.product_location,
        p.has_variations,
        p.flash_sale,
        p.weekly_offer,
        p.special_offer,
        p.sell_count,
        p.today_deals,
        p.main_image,
        p.product_catalogue,
        p.status AS product_status,
        p.created_at AS product_created_at,
        p.updated_at AS product_updated_at,

        s.id AS storage_id,
        s.data_type AS storage_data_type,
        s.data_id AS storage_data_id,
        s.key AS storage_key,
        s.value AS storage_value,
        s.created_at AS storage_created_at,
        s.updated_at AS storage_updated_at

      FROM promotion_images pi
      INNER JOIN products p
        ON pi.product_code = p.product_code
      LEFT JOIN storages s
        ON s.data_id = pi.id
        AND s.data_type = ?
      WHERE pi.status = 1
        AND p.status = 1
    `, ["App\\Models\\Promotion"]);

    // ---- Reviews ----
    const productCodes = [...new Set(rows.map((r) => r.product_code))];
    let reviewsByProduct = {};

    if (productCodes.length > 0) {
      const [reviewRows] = await pool.query(
        `
        SELECT
          id, customer_id, product_code, order_id, name, email,
          review_detail, rating, image_path, created_at, updated_at
        FROM product_reviews
        WHERE product_code IN (?)
        ORDER BY created_at DESC
        `,
        [productCodes],
      );

      reviewsByProduct = reviewRows.reduce((acc, review) => {
        const code = review.product_code;
        if (!acc[code]) acc[code] = [];
        acc[code].push({
          id: review.id,
          customer_id: review.customer_id,
          order_id: review.order_id,
          name: review.name,
          email: review.email,
          review_detail: review.review_detail,
          rating: review.rating,
          image_path: review.image_path,
          image_full_url: buildFullUrl(REVIEW_IMAGE_PATH, review.image_path),
          created_at: review.created_at,
          updated_at: review.updated_at,
        });
        return acc;
      }, {});
    }

    const bannerMap = new Map();

    rows.forEach((row) => {
      const key = row.banner_id;

      if (!bannerMap.has(key)) {
        const productReviews = reviewsByProduct[row.product_code] || [];
        const reviewCount = productReviews.length;
        const averageRating = reviewCount > 0 ? (productReviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviewCount).toFixed(2) : "0.00";

        bannerMap.set(key, {
          id: row.banner_id,
          product_code: row.banner_product_code,
          file_path: row.file_path,
          mobile_file_path: row.mobile_file_path,
          is_offer: row.is_offer,
          status: row.banner_status,
          created_at: row.banner_created_at,
          updated_at: row.banner_updated_at,
          image_full_url: buildFullUrl(PROMOTION_PATH, row.file_path),
          mobile_image_full_url: buildFullUrl(PROMOTION_PATH, row.mobile_file_path),

          product: {
            id: row.product_id,
            product_code: row.product_code,
            parent_id: row.parent_id,
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
            sell_count: row.sell_count,
            today_deals: row.today_deals,
            main_image: row.main_image,
            product_catalogue: row.product_catalogue,
            status: row.product_status,
            created_at: row.product_created_at,
            updated_at: row.product_updated_at,
            files_full_url: [],
            main_image_full_url: buildFullUrl(PRODUCT_IMAGE_PATH, row.main_image),
            image_full_url: null,
            catalogue_full_url: buildFullUrl(CATALOGUE_PATH, row.product_catalogue),
            average_rating: averageRating,
            review_count: reviewCount,
            reviews: productReviews,
          },

          storage: [],
        });
      }

      if (row.storage_id) {
        const banner = bannerMap.get(key);
        banner.storage.push({
          id: row.storage_id,
          data_type: row.storage_data_type,
          data_id: row.storage_data_id,
          key: row.storage_key,
          value: row.storage_value,
          created_at: row.storage_created_at,
          updated_at: row.storage_updated_at,
        });
      }
    });

    const response = Array.from(bannerMap.values());

    return NextResponse.json(
      {
        success: true,
        message: "Mobile promotions fetched successfully.",
        promotions: response,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching promotion products:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch promotion products.",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
