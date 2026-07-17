import pool from "@/utils/db";
import { resolveProductImage } from "@/utils/productMedia";

export const ensureCartItemVariationColumn = async (db = pool) => {
  const [rows] = await db.query("SHOW COLUMNS FROM cart_items LIKE 'variation_key'");
  if (!rows.length) {
    await db.query("ALTER TABLE cart_items ADD COLUMN variation_key VARCHAR(191) NULL AFTER product_code");
  }
};

export const getCustomerCartId = async (db, customerId, createIfMissing = false) => {
  const [rows] = await db.query(
    "SELECT id FROM cart WHERE customer_id = ? LIMIT 1",
    [customerId],
  );

  if (rows.length > 0) {
    return Number(rows[0].id);
  }

  if (!createIfMissing) {
    return null;
  }

  const [result] = await db.query(
    `INSERT INTO cart
     (customer_id, tax, shipping_cost, shipping_cost_total, subtotal, status, created_at, updated_at)
     VALUES (?, 0.00, 0.00, 0.00, 0.00, NULL, NOW(), NOW())`,
    [customerId],
  );

  return Number(result.insertId);
};

export const getProductByCode = async (productCode) => {
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
     WHERE p.product_code = ?
     LIMIT 1`,
    [productCode],
  );

  return rows[0] || null;
};

export const getProductVariationByKey = async (productCode, variationKey) => {
  if (!variationKey) return null;

  const [rows] = await pool.query(
    `SELECT id, product_code, attributes, price, stock, sku
     FROM product_variations
     WHERE product_code = ? AND sku = ?
     LIMIT 1`,
    [productCode, variationKey],
  );

  if (!rows.length) return null;

  const row = rows[0];
  let attributes = {};
  try {
    attributes = row.attributes ? JSON.parse(row.attributes) : {};
  } catch {
    attributes = {};
  }

  const imageUrl = resolveProductImage({
    image_full_url: attributes.image_full_url,
    main_image_full_url: attributes.image_full_url,
    image_url: attributes.image_url,
    main_image: attributes.image,
    gallery: attributes.image ? [{ image_path: attributes.image }] : [],
  });

  return {
    variation_key: row.sku,
    variation_id: row.id,
    product_code: row.product_code,
    product_name: attributes.name || null,
    actual_price: Number(row.price || attributes.actual_price || 0),
    sell_price: Number(attributes.sell_price || row.price || 0),
    available_quantity: Number(attributes.available_qty || row.stock || 0),
    stock_quantity: Number(attributes.stock_qty || row.stock || 0),
    image_full_url: imageUrl,
    main_image_full_url: imageUrl,
    image_url: imageUrl,
    main_image_url: imageUrl,
    attributes,
  };
};

export const formatCartItem = (row) => ({
  id: row.id,
  cart_id: row.cart_id,
  product_code: row.product_code,
  variation_key: row.variation_key || null,
  quantity: Number(row.quantity || 0),
  price: Number(row.price || 0),
  actual_price: Number(row.actual_price || 0),
  created_at: row.created_at,
  updated_at: row.updated_at,
  product: row.product || null,
});

export const formatCartResponse = (items) => {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  return {
    id: items[0]?.cart_id || null,
    items,
    subtotal: Number(subtotal.toFixed(2)),
  };
};
