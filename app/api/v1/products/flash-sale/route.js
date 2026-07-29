// import pool from "@/utils/db";
// import { formatProduct, parsePagination } from "@/utils/apiFormatters";
// import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
//     const includeInactive = searchParams.get("include_inactive") === "1";

//     const [rows] = await pool.query(
//       `SELECT
//         p.*,
//         c.category_name,
//         c.parent_id AS category_parent_id,
//         c.image AS category_image,
//         c.top AS category_top,
//         c.status AS category_status,
//         b.brand_name,
//         b.image AS brand_image,
//         b.top AS brand_top,
//         b.status AS brand_status
//        FROM products p
//        LEFT JOIN categories c ON p.category_id = c.id
//        LEFT JOIN brands b ON p.brand_id = b.id
//        WHERE p.flash_sale = 1
//        ${includeInactive ? "" : "AND p.status = 1"}
//        ORDER BY p.id DESC
//        LIMIT ? OFFSET ?`,
//       [limit, offset],
//     );

//     const [[totalRow]] = await pool.query(
//       `SELECT COUNT(*) AS total FROM products p WHERE p.flash_sale = 1 ${includeInactive ? "" : "AND p.status = 1"}`,
//     );

//     const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
//     const enrichedRows = enrichProductsWithImages(rows, imageMap);

//     return Response.json({
//       success: true,
//       products: enrichedRows.map(formatProduct),
//       count: rows.length,
//       total: totalRow.total,
//       limit,
//       offset,
//     });
//   } catch (error) {
//     return Response.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

import pool from "@/utils/db";
import { formatProduct, parsePagination } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const includeInactive = searchParams.get("include_inactive") === "1";

    const [rows] = await pool.query(
      `SELECT 
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
       WHERE p.flash_sale = 1
       ${includeInactive ? "" : "AND p.status = 1"}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const [[totalRow]] = await pool.query(`SELECT COUNT(*) AS total FROM products p WHERE p.flash_sale = 1 ${includeInactive ? "" : "AND p.status = 1"}`);

    const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
    const enrichedRows = enrichProductsWithImages(rows, imageMap);

    // ---- Reviews ----
    const productCodes = rows.map((row) => row.product_code);
    let reviewsByProduct = {};

    if (productCodes.length > 0) {
      const [reviewRows] = await pool.query(
        `SELECT id, customer_id, product_code, order_id, name, email,
                review_detail, rating, image_path, created_at, updated_at
         FROM product_reviews
         WHERE product_code IN (?)
         ORDER BY created_at DESC`,
        [productCodes],
      );

      reviewsByProduct = reviewRows.reduce((acc, review) => {
        if (!acc[review.product_code]) acc[review.product_code] = [];
        acc[review.product_code].push(review);
        return acc;
      }, {});
    }

    // ---- Variations ----
    let variationsByProduct = {};

    if (productCodes.length > 0) {
      const [variationRows] = await pool.query(`SELECT * FROM product_variations WHERE product_code IN (?)`, [productCodes]);

      variationsByProduct = variationRows.reduce((acc, variation) => {
        if (!acc[variation.product_code]) acc[variation.product_code] = [];
        acc[variation.product_code].push(variation);
        return acc;
      }, {});
    }

    const products = enrichedRows.map((row) => {
      const productReviews = reviewsByProduct[row.product_code] || [];
      const reviewCount = productReviews.length;
      const averageRating = reviewCount > 0 ? (productReviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviewCount).toFixed(2) : "0.00";

      return {
        ...formatProduct(row),
        average_rating: averageRating,
        review_count: reviewCount,
        reviews: productReviews,
        variations: variationsByProduct[row.product_code] || [],
      };
    });

    return Response.json({
      success: true,
      products,
      count: rows.length,
      total: totalRow.total,
      limit,
      offset,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
