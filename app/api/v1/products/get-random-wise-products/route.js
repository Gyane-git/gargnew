import { NextResponse } from "next/server";
import pool from "@/utils/db";

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

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
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

        cs.id AS category_storage_id,
        cs.data_type AS category_storage_data_type,
        cs.data_id AS category_storage_data_id,
        cs.key AS category_storage_key,
        cs.value AS category_storage_value,
        cs.created_at AS category_storage_created_at,
        cs.updated_at AS category_storage_updated_at,

        bs.id AS brand_storage_id,
        bs.data_type AS brand_storage_data_type,
        bs.data_id AS brand_storage_data_id,
        bs.key AS brand_storage_key,
        bs.value AS brand_storage_value,
        bs.created_at AS brand_storage_created_at,
        bs.updated_at AS brand_storage_updated_at

      FROM products p
      LEFT JOIN categories c
        ON p.category_id = c.id
      LEFT JOIN brands b
        ON p.brand_id = b.id
      LEFT JOIN storages cs
        ON cs.data_id = c.id
      LEFT JOIN storages bs
        ON bs.data_id = b.id
      WHERE p.status = 1
      ORDER BY p.id DESC
    `);

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

    const productMap = new Map();

    rows.forEach((row) => {
      const key = row.product_id;

      if (!productMap.has(key)) {
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

          variations: [],

          category: row.category_id_ref
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
                storage: [],
                _storageSeen: new Set(),
              }
            : null,

          brand: row.brand_id_ref
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
                _storageSeen: new Set(),
              }
            : null,
        });
      }

      const product = productMap.get(key);
      if (row.category_storage_id && product.category && !product.category._storageSeen.has(row.category_storage_id)) {
        product.category._storageSeen.add(row.category_storage_id);
        product.category.storage.push({
          id: row.category_storage_id,
          data_type: row.category_storage_data_type,
          data_id: row.category_storage_data_id,
          key: row.category_storage_key,
          value: row.category_storage_value,
          created_at: row.category_storage_created_at,
          updated_at: row.category_storage_updated_at,
        });
      }

      // Append brand storage (dedup by storage id)
      if (row.brand_storage_id && product.brand && !product.brand._storageSeen.has(row.brand_storage_id)) {
        product.brand._storageSeen.add(row.brand_storage_id);
        product.brand.storage.push({
          id: row.brand_storage_id,
          data_type: row.brand_storage_data_type,
          data_id: row.brand_storage_data_id,
          key: row.brand_storage_key,
          value: row.brand_storage_value,
          created_at: row.brand_storage_created_at,
          updated_at: row.brand_storage_updated_at,
        });
      }
    });

    // Strip internal dedup helper before responding
    const response = Array.from(productMap.values()).map((product) => {
      if (product.category) delete product.category._storageSeen;
      if (product.brand) delete product.brand._storageSeen;
      return product;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Products fetched successfully.",
        products: response,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products.",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
