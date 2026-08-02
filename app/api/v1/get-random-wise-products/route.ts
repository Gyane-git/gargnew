import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

/**
 * @swagger
 * /api/v1/get-random-wise-products:
 *   get:
 *     summary: List 10 random active products with variations and reviews
 *     description: >
 *       Top-level legacy/duplicate variant of /api/v1/products/get-random-wise-products.
 *       Unlike that endpoint, this one genuinely randomizes (ORDER BY RAND() LIMIT 10,
 *       products with status = 1), and for each product also fetches its raw
 *       product_variations rows and raw product_reviews rows (plus a computed
 *       average_rating and review_count), rather than the category/brand "storage"
 *       key/value detail returned by the /products/ variant. The success response uses
 *       an unusual envelope - the top-level object has only a "message" key, and
 *       "success" true plus the "products" array are nested INSIDE "message"
 *       (message.response.data.products), not at the top level. Only the error
 *       response uses the conventional success/message shape. No query
 *       parameters are read. Public endpoint, no authentication required.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Random products retrieved successfully (note the nested envelope)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     success: { type: boolean, example: true }
 *                     response:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: object
 *                           properties:
 *                             products:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 description: Formatted product (see formatProduct) plus gallery, images, variations (raw product_variations rows), reviews (raw product_reviews rows), review_count, average_rating
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string }
 */
export async function GET(req) {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.*,
        c.category_name,
        c.parent_id AS category_parent_id,
        c.image AS category_image,
        c.top AS category_top,
        c.status AS category_status,
        b.brand_name,
        b.image AS brand_image,
        b.top AS brand_top,
        b.status AS brand_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 1
      ORDER BY RAND()
      LIMIT 10
    `);
    
   
    
    const productCodes = rows.map((row) => row.product_code);
    const imageMap = await fetchProductImagesMap(productCodes);

    const products = await Promise.all(
      enrichProductsWithImages(rows, imageMap).map(async (row) => {
        const product = formatProduct(row);
        const gallery = imageMap.get(String(product.product_code)) || [];

        // ---------------- Variations ----------------
        let variations = [];

        try {
          const [variationRows] = await pool.query("SELECT * FROM product_variations WHERE product_code = ? ORDER BY id ASC", [product.product_code]);

          variations = variationRows;
        } catch (err) {
          console.error(err);
        }

        // ---------------- Reviews ----------------
        let reviews = [];
        let averageRating = 0;

        try {
          const [reviewRows] = await pool.query("SELECT * FROM product_reviews WHERE product_code = ? ORDER BY id DESC", [product.product_code]);

          reviews = reviewRows;

          const ratings = reviewRows.map((r) => Number(r.rating || r.rating_value || 0)).filter((r) => r > 0);

          averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
        } catch (err) {
          console.error(err);
        }

        return {
          ...product,
          gallery,
          images: gallery,
          variations,
          reviews,
          review_count: reviews.length,
          average_rating: averageRating,
        };
      }),
    );

    return NextResponse.json({
      message: {
        response: {
          data: {
            products,
          },
        },
        success: true,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}