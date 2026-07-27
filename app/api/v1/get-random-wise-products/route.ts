import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

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