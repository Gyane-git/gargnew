import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { getAuthUser } from "@/utils/authUser";
import { unauthenticatedResponse } from "@/utils/apiResponse";
import { assetUrl, formatProduct } from "@/utils/apiFormatters";

const parseImagePaths = (imagePath) => {
  if (!imagePath) return [];
  try {
    const parsed = JSON.parse(imagePath);
    return Array.isArray(parsed) ? parsed : [imagePath];
  } catch {
    return [imagePath];
  }
};

/**
 * @swagger
 * /api/v1/customer/reviews/list:
 *   get:
 *     summary: List the authenticated customer's submitted reviews
 *     description: Mirrors Laravel ReviewController::get_my_reviews (API\V1) - the singular
 *       "customer" path. app/myaccount/components/MyReview.js already calls this exact URL
 *       today and 404s (only the plural /customers/reviews/list route exists) - adding this
 *       route fixes that live web bug as a side effect of mobile-app compatibility work.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Reviews fetched successfully }
 *       401: { description: Unauthenticated }
 */
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthenticatedResponse();

    const [rows] = await pool.query(
      `SELECT r.*,
        p.id AS p_id, p.product_name, p.product_code AS p_product_code, p.main_image, p.product_catalogue,
        p.category_id, p.brand_id
       FROM product_reviews r
       LEFT JOIN products p ON p.product_code = r.product_code
       WHERE r.customer_id = ?
       ORDER BY r.id DESC`,
      [authUser.id],
    );

    const reviews = rows.map((row) => {
      const imagePaths = parseImagePaths(row.image_path);
      const product = row.p_id
        ? formatProduct({
            id: row.p_id,
            product_name: row.product_name,
            product_code: row.p_product_code,
            main_image: row.main_image,
            product_catalogue: row.product_catalogue,
            category_id: row.category_id,
            brand_id: row.brand_id,
          })
        : null;

      return {
        id: row.id,
        customer_id: row.customer_id,
        product_code: row.product_code,
        order_id: row.order_id,
        name: row.name,
        email: row.email,
        review_detail: row.review_detail,
        rating: row.rating,
        image_full_url: imagePaths.map((imagePath) => assetUrl(imagePath, "uploads/reviews")),
        product,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    return NextResponse.json({ success: true, message: "Reviews fetched successfully.", reviews });
  } catch (error) {
    console.error("CUSTOMER REVIEW LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get reviews", error: error.message },
      { status: 500 },
    );
  }
}
