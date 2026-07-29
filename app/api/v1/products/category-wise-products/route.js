// import { NextResponse } from "next/server";
// import pool from "@/utils/db";
// import { formatProduct, parsePagination } from "@/utils/apiFormatters";
// import { enrichProductsWithImages, fetchProductImagesMap } from "@/utils/productImages";

// const collectCategoryIds = (rows, categoryId) => {
//   const targetId = Number(categoryId);
//   const childrenByParent = new Map();

//   rows.forEach((row) => {
//     const parentId = row.parent_id == null ? null : Number(row.parent_id);
//     if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
//     childrenByParent.get(parentId).push(Number(row.id));
//   });

//   const ids = new Set([targetId]);
//   const stack = [targetId];

//   while (stack.length > 0) {
//     const currentId = stack.pop();
//     const children = childrenByParent.get(currentId) || [];

//     children.forEach((childId) => {
//       if (!ids.has(childId)) {
//         ids.add(childId);
//         stack.push(childId);
//       }
//     });
//   }

//   return Array.from(ids);
// };

// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const categoryId = searchParams.get("category_id");
//     const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
//     const includeInactive = searchParams.get("include_inactive") === "1";

//     if (!categoryId) {
//       return NextResponse.json({ success: false, message: "category_id is required" }, { status: 400 });
//     }

//     const [categoryRows] = await pool.query("SELECT id, parent_id FROM categories");
//     const categoryIds = collectCategoryIds(categoryRows, categoryId);
//     const placeholders = categoryIds.map(() => "?").join(", ");

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
//        WHERE p.category_id IN (${placeholders})
//        ${includeInactive ? "" : "AND p.status = 1"}
//        ORDER BY p.id DESC
//        LIMIT ? OFFSET ?`,
//       [...categoryIds, limit, offset],
//     );

//     const [[totalRow]] = await pool.query(
//       `SELECT COUNT(*) AS total
//        FROM products p
//        WHERE p.category_id IN (${placeholders})
//        ${includeInactive ? "" : "AND p.status = 1"}`,
//       categoryIds,
//     );

//     const imageMap = await fetchProductImagesMap(rows.map((row) => row.product_code));
//     const enrichedRows = enrichProductsWithImages(rows, imageMap);

//     return NextResponse.json({
//       success: true,
//       products: enrichedRows.map(formatProduct),
//       count: rows.length,
//       total: totalRow.total,
//       limit,
//       offset,
//     });
//   } catch (error) {
//     console.error("category-wise-products error:", error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { parsePagination } from "@/utils/apiFormatters";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const PRODUCT_IMAGE_PATH = "/uploads/products";
const REVIEW_IMAGE_PATH = "/uploads/reviews";
const CATALOGUE_PATH = "/uploads/catalogues";
const CATEGORY_IMAGE_PATH = "/uploads/categories";
const BRAND_IMAGE_PATH = "/uploads/brands";

function buildFullUrl(basePath, fileName) {
  if (!fileName) return null;
  return `${BASE_URL}${basePath}/${encodeURIComponent(fileName)}`;
}

const collectCategoryIds = (rows, categoryId) => {
  const targetId = Number(categoryId);
  const childrenByParent = new Map();

  rows.forEach((row) => {
    const parentId = row.parent_id == null ? null : Number(row.parent_id);
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(Number(row.id));
  });

  const ids = new Set([targetId]);
  const stack = [targetId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    const children = childrenByParent.get(currentId) || [];

    children.forEach((childId) => {
      if (!ids.has(childId)) {
        ids.add(childId);
        stack.push(childId);
      }
    });
  }

  return Array.from(ids);
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const { limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });
    const includeInactive = searchParams.get("include_inactive") === "1";

    if (!categoryId) {
      return NextResponse.json({ success: false, message: "category_id is required" }, { status: 400 });
    }

    const [categoryRows] = await pool.query("SELECT id, parent_id FROM categories");
    const categoryIds = collectCategoryIds(categoryRows, categoryId);
    const placeholders = categoryIds.map(() => "?").join(", ");
    const statusClause = includeInactive ? "" : "AND p.status = 1";

    const [[totalRow]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM products p
       WHERE p.category_id IN (${placeholders})
       ${statusClause}`,
      categoryIds,
    );

    const [idRows] = await pool.query(
      `SELECT p.id
       FROM products p
       WHERE p.category_id IN (${placeholders})
       ${statusClause}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...categoryIds, limit, offset],
    );

    const productIds = idRows.map((r) => r.id);

    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Products fetched successfully.",
        products: [],
        count: 0,
        total: totalRow.total,
        limit,
        offset,
      });
    }

    const idPlaceholders = productIds.map(() => "?").join(", ");
    const [rows] = await pool.query(
      `SELECT
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

        pi.id,
        pi.product_code AS product_image_product_code,
        pi.image_path,
        pi.created_at AS product_image_created_at,
        pi.updated_at AS product_image_updated_at,

        ci.id AS banner_id,
        ci.product_code AS banner_product_code,
        ci.file_path,
        ci.mobile_file_path,
        ci.is_offer,
        ci.status AS banner_status,
        ci.created_at AS banner_created_at,
        ci.updated_at AS banner_updated_at,

        c.id AS category_id_ref,
        c.category_name,
        c.parent_id AS category_parent_id,
        c.image AS category_image,
        c.top AS category_top,
        c.status AS category_status,
        c.created_at AS category_created_at,
        c.updated_at AS category_updated_at,

        b.id AS brand_id_ref,
        b.brand_name,
        b.image AS brand_image,
        b.top AS brand_top,
        b.status AS brand_status,
        b.order_wise AS brand_order_wise,
        b.created_at AS brand_created_at,
        b.updated_at AS brand_updated_at,

        s.id AS storage_id_ref,
        s.data_type,
        s.data_id AS storage_data_id,
        s.key AS storage_key,
        s.value AS storage_value,
        s.created_at AS storage_created_at,
        s.updated_at AS storage_updated_at

     FROM products p

     INNER JOIN categories c
        ON p.category_id = c.id

     LEFT JOIN product_images pi
        ON p.product_code = pi.product_code

     LEFT JOIN carousel_images ci
        ON p.product_code = ci.product_code

     LEFT JOIN brands b
        ON p.brand_id = b.id

     LEFT JOIN storages s
        ON b.id = s.data_id

     WHERE p.id IN (${idPlaceholders})
     ORDER BY p.id DESC
    `,
      productIds,
    );

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

    // ---- Variations ----
    let variationsByProduct = {};

    if (productCodes.length > 0) {
      const [variationRows] = await pool.query(
        `SELECT id, product_code, attributes, price, stock, sku, created_at, updated_at
         FROM product_variations
         WHERE product_code IN (?)`,
        [productCodes],
      );

      variationsByProduct = variationRows.reduce((acc, variation) => {
        const code = variation.product_code;
        if (!acc[code]) acc[code] = [];

        let parsedAttributes = variation.attributes;
        try {
          parsedAttributes = JSON.parse(variation.attributes);
        } catch {
          // leave as raw string if it's not valid JSON
        }

        acc[code].push({
          id: variation.id,
          product_code: variation.product_code,
          attributes: parsedAttributes,
          price: variation.price,
          stock: variation.stock,
          sku: variation.sku,
          created_at: variation.created_at,
          updated_at: variation.updated_at,
        });
        return acc;
      }, {});
    }

    // ---- Group rows by product (storages join can multiply rows) ----
    const productMap = new Map();

    rows.forEach((row) => {
      const key = row.product_id;

      if (!productMap.has(key)) {
        const category = row.category_id_ref
          ? {
              id: row.category_id_ref,
              category_name: row.category_name,
              parent_id: row.category_parent_id,
              image: row.category_image,
              top: row.category_top,
              status: row.category_status,
              created_at: row.category_created_at,
              updated_at: row.category_updated_at,
              image_full_url: buildFullUrl(CATEGORY_IMAGE_PATH, row.category_image),
            }
          : null;

        const brand = row.brand_id_ref
          ? {
              id: row.brand_id_ref,
              brand_name: row.brand_name,
              image: row.brand_image,
              top: row.brand_top,
              status: row.brand_status,
              order_wise: row.brand_order_wise,
              created_at: row.brand_created_at,
              updated_at: row.brand_updated_at,
              image_full_url: buildFullUrl(BRAND_IMAGE_PATH, row.brand_image),
              storage: [],
            }
          : null;

        const productReviews = reviewsByProduct[row.product_code] || [];
        const reviewCount = productReviews.length;
        const averageRating = reviewCount > 0 ? (productReviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviewCount).toFixed(2) : "0.00";

        productMap.set(key, {
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

          starting_price: row.sell_price,
          is_wishlisted: false,

          files_full_url: [],
          main_image_full_url: buildFullUrl(PRODUCT_IMAGE_PATH, row.main_image),
          image_full_url: null,
          catalogue_full_url: buildFullUrl(CATALOGUE_PATH, row.product_catalogue),
          average_rating: averageRating,
          review_count: reviewCount,
          reviews: productReviews,

          variations: variationsByProduct[row.product_code] || [],

          category,
          brand,
        });
      }

      if (row.storage_id_ref) {
        const product = productMap.get(key);
        if (row.image_path) {
          const imageUrl = buildFullUrl(PRODUCT_IMAGE_PATH, row.image_path);
          if (!product.files_full_url.includes(imageUrl)) {
            product.files_full_url.push(imageUrl);
          }
        }
        if (product.brand) {
          product.brand.storage.push({
            id: row.storage_id_ref,
            data_type: row.data_type,
            data_id: row.storage_data_id,
            key: row.storage_key,
            value: row.storage_value,
            created_at: row.storage_created_at,
            updated_at: row.storage_updated_at,
          });
        }
      }
    });

    const response = productIds.map((id) => productMap.get(id)).filter(Boolean);

    return NextResponse.json({
      success: true,
      message: "Products fetched successfully.",
      products: response,
      count: response.length,
      total: totalRow.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("category-wise-products error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
