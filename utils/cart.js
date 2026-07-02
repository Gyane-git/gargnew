import pool from "@/utils/db";

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

export const formatCartItem = (row) => ({
  id: row.id,
  cart_id: row.cart_id,
  product_code: row.product_code,
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
