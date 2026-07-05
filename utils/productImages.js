import pool from "@/utils/db";
import { assetUrl } from "@/utils/apiFormatters";

export const fetchProductImagesMap = async (productCodes = []) => {
  const codes = [...new Set(productCodes.filter(Boolean).map((code) => String(code)))];
  const map = new Map();

  if (codes.length === 0) return map;

  const placeholders = codes.map(() => "?").join(", ");
  const [rows] = await pool.query(
    `
      SELECT id, product_code, image_path
      FROM product_images
      WHERE product_code IN (${placeholders})
      ORDER BY product_code ASC, id ASC
    `,
    codes,
  );

  rows.forEach((row) => {
    const key = String(row.product_code);
    if (!map.has(key)) map.set(key, []);

    map.get(key).push({
      id: row.id,
      product_code: row.product_code,
      image_path: row.image_path,
      image_url: assetUrl(row.image_path, "uploads/products"),
      image_full_url: assetUrl(row.image_path, "uploads/products"),
    });
  });

  return map;
};

export const enrichProductsWithImages = (rows = [], imageMap = new Map()) =>
  rows.map((row) => {
    const gallery = imageMap.get(String(row.product_code)) || [];
    const primaryGalleryImage = gallery[0] || null;

    return {
      ...row,
      main_image: row.main_image || primaryGalleryImage?.image_path || null,
      main_image_path: row.main_image || null,
      gallery_image_path: primaryGalleryImage?.image_path || null,
      gallery_image_full_url: primaryGalleryImage?.image_full_url || null,
      gallery_image_url: primaryGalleryImage?.image_url || null,
      product_images: gallery,
      gallery,
      images: gallery,
    };
  });
