export const generateOrderNumber = (customerId) => {
  const timestamp = Date.now().toString();
  const customerPart = String(customerId || 0).padStart(2, "0").slice(-2);
  const randomPart = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `${timestamp}${customerPart}${randomPart}`;
};

export const formatAddressSnapshot = (row) => ({
  id: Number(row.id),
  customer_id: Number(row.customer_id),
  full_name: row.full_name,
  phone: row.phone,
  province_id: Number(row.province_id),
  city_id: Number(row.city_id),
  zone_id: Number(row.zone_id),
  address: row.address,
  landmark: row.landmark,
  address_type: row.address_type,
  province_name: row.province_name || null,
  city_name: row.city_name || null,
  shipping_cost: row.shipping_cost || "0.00",
  zone_name: row.zone_name || null,
  default_shipping: row.default_shipping ?? null,
  default_billing: row.default_billing ?? null,
});

export const fetchAddressById = async (connection, customerId, addressId) => {
  const [rows] = await connection.query(
    `SELECT
      a.*,
      p.province_name,
      s.city AS city_name,
      s.shipping_cost,
      z.zone_name
     FROM customer_address_book a
     LEFT JOIN provinces p ON p.id = a.province_id
     LEFT JOIN set_shipping s ON s.id = a.city_id
     LEFT JOIN address_zone z ON z.id = a.zone_id
     WHERE a.id = ? AND a.customer_id = ?
     LIMIT 1`,
    [addressId, customerId],
  );

  return rows[0] ? formatAddressSnapshot(rows[0]) : null;
};

export const createDeliveryInformation = async (connection, {
  customerId,
  orderCode,
  address,
  invoiceEmail,
  type,
}) => {
  const [result] = await connection.query(
    `INSERT INTO delivery_information
     (customer_id, order_id, full_name, phone, invoice_email, province_id, city_id, zone_id, address, landmark, address_type, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      customerId,
      orderCode,
      address.full_name,
      address.phone,
      invoiceEmail || null,
      address.province_id,
      address.city_id,
      address.zone_id,
      address.address,
      address.landmark,
      address.address_type,
      type,
    ],
  );

  return result.insertId;
};

export const insertOrderRow = async (connection, data) => {
  const [result] = await connection.query(
    `INSERT INTO orders
     (order_id, customer_id, transaction_id, shipping_delivery_information_id, billing_delivery_information_id, payment_method, shipping_method, subtotal_without_tax, subtotal, tax, shipping_cost, shipping_snapshot, coupon_snapshot, discount, total_amount, order_status, payment_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      data.order_id,
      data.customer_id,
      data.transaction_id || null,
      data.shipping_delivery_information_id,
      data.billing_delivery_information_id,
      data.payment_method || null,
      data.shipping_method || null,
      data.subtotal_without_tax,
      data.subtotal,
      data.tax,
      data.shipping_cost,
      data.shipping_snapshot || null,
      data.coupon_snapshot || null,
      data.discount,
      data.total_amount,
      data.order_status || "processing",
      data.payment_status || "unpaid",
    ],
  );

  return result.insertId;
};

export const insertOrderItems = async (connection, orderId, items) => {
  for (const item of items) {
    await connection.query(
      `INSERT INTO order_items
       (order_id, product_code, quantity, price, actual_price, subtotal_without_tax, tax, subtotal, discount, shipping_cost, reviewed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [
        orderId,
        item.product_code,
        item.quantity,
        item.price,
        item.actual_price,
        item.subtotal_without_tax,
        item.tax,
        item.subtotal,
        item.discount,
        item.shipping_cost,
      ],
    );
  }
};

export const removeCartItemsByIds = async (connection, cartId, itemIds) => {
  if (!itemIds.length) return;
  const placeholders = itemIds.map(() => "?").join(",");
  await connection.query(
    `DELETE FROM cart_items WHERE cart_id = ? AND id IN (${placeholders})`,
    [cartId, ...itemIds],
  );
};

export const getProductByCode = async (connection, productCode) => {
  const [rows] = await connection.query(
    `SELECT product_code, sell_price, actual_price, available_quantity
     FROM products
     WHERE product_code = ?
     LIMIT 1`,
    [productCode],
  );

  return rows[0] || null;
};

export const reserveInventoryForItem = async (connection, {
  productCode,
  quantity,
  variationKey = null,
}) => {
  const qty = Number(quantity || 0);
  if (!productCode || !Number.isFinite(qty) || qty < 1) {
    throw new Error("Invalid inventory reservation request.");
  }

  if (variationKey) {
    const [variationRows] = await connection.query(
      `SELECT id, product_code, sku, stock, attributes
       FROM product_variations
       WHERE product_code = ? AND sku = ?
       LIMIT 1 FOR UPDATE`,
      [productCode, variationKey],
    );

    const variation = variationRows[0];
    if (!variation) {
      throw new Error("Product variation not found.");
    }

    const currentStock = Number(variation.stock || 0);
    if (currentStock < qty) {
      throw new Error(`Only ${currentStock} items available in stock.`);
    }

    await connection.query(
      `UPDATE product_variations
       SET stock = GREATEST(COALESCE(stock, 0) - ?, 0)
       WHERE id = ?`,
      [qty, variation.id],
    );

    return {
      success: true,
      remaining: Math.max(currentStock - qty, 0),
      variation: true,
    };
  }

  const [productRows] = await connection.query(
    `SELECT product_code, available_quantity, stock_quantity
     FROM products
     WHERE product_code = ?
     LIMIT 1 FOR UPDATE`,
    [productCode],
  );

  const product = productRows[0];
  if (!product) {
    throw new Error("Product not found.");
  }

  const currentStock = Number(product.available_quantity ?? product.stock_quantity ?? 0);
  if (currentStock < qty) {
    throw new Error(`Only ${currentStock} items available in stock.`);
  }

  await connection.query(
    `UPDATE products
     SET available_quantity = GREATEST(COALESCE(available_quantity, 0) - ?, 0),
         stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - ?, 0)
     WHERE product_code = ?`,
    [qty, qty, productCode],
  );

  return {
    success: true,
    remaining: Math.max(currentStock - qty, 0),
    variation: false,
  };
};
