// import { NextResponse } from "next/server";
// import pool from "@/utils/db";

// export async function GET(req, { params }) {
//   const { product_code } = params;

//   if (!product_code) {
//     return NextResponse.json({ success: false, message: "product_code is required" }, { status: 400 });
//   }

//   try {
//     // Main product row
//     const [rows] = await pool.query(
//       `SELECT
//          p.*,
//          c.category_name,
//          b.brand_name
//        FROM products p
//        LEFT JOIN categories c ON p.category_id = c.id
//        LEFT JOIN brands b     ON p.brand_id    = b.id
//        WHERE p.product_code = ?
//          AND p.status = 1
//        LIMIT 1`,
//       [product_code],
//     );

//     if (rows.length === 0) {
//       return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
//     }

//     const product = rows[0];

//     let gallery = [];
//     try {
//       const [imgRows] = await pool.query(
//         `SELECT id, image_path FROM product_images
//          WHERE product_code = ?
//          ORDER BY id ASC`,
//         [product_code],
//       );
//       gallery = imgRows.map((r) => ({
//         id: r.id,
//         image_url: r.image_path?.startsWith("/") ? r.image_path : `/uploads/products/${r.image_path}`,
//       }));
//     } catch {}

//     // Variations (optional table)
//     let variations = [];
//     try {
//       const [varRows] = await pool.query(
//         `SELECT * FROM product_variations
//          WHERE product_code = ?
//          ORDER BY id ASC`,
//         [product_code],
//       );
//       variations = varRows;
//     } catch {}

//     // Build the image URL for the main image
//     const main_image_url = product.main_image?.startsWith("/") ? product.main_image : product.main_image ? `/uploads/products/${product.main_image}` : null;

//     // Build catalogue URL
//     const catalogue_url = product.product_catalogue?.startsWith("/") ? product.product_catalogue : product.product_catalogue ? `/uploads/catalogues/${product.product_catalogue}` : null;

//     return NextResponse.json({
//       success: true,
//       product: {
//         ...product,
//         main_image_url,
//         catalogue_url,
//         gallery,
//         variations,
//       },
//     });
//   } catch (error) {
//     console.error("GET PRODUCT BY CODE ERROR:", error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { formatProduct } from "@/utils/apiFormatters";
import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

export async function GET(req, { params }) {
  const { code } = await params;
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.category_name, b.brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.product_code = ?
       LIMIT 1`,
      [code],
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const imageMap = await fetchProductImagesMap([code]);
    const product = formatProduct(enrichProductsWithImages(rows, imageMap)[0]);

    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
