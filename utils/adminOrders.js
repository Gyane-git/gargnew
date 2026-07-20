import pool from "@/utils/db";
import { ensureOrderItemVariationColumn } from "@/utils/order";

const parseVariationName = (attributes) => {
  if (!attributes) return null;

  try {
    const parsed = typeof attributes === "string" ? JSON.parse(attributes) : attributes;
    return parsed?.name || null;
  } catch {
    return null;
  }
};

const HISTORY_TABLES = {
  shipped: ["order_shipped"],
  delivered: ["order_delivered"],
  cancelled: ["order_cancel"],
  returned: ["order_returns", "order_retuns"],
  payment: ["order_payments"],
};

const HISTORY_VALUE_KEYS = {
  order_id: ["order_id", "orderId", "order_number"],
  customer_id: ["customer_id"],
  order_status: ["order_status", "status"],
  payment_status: ["payment_status"],
  payment_mode: ["payment_mode", "payment_method"],
  payment_type: ["payment_type", "payment_mode", "payment_method"],
  payment_amount: ["payment_amount", "paid_amount", "amount", "total_amount"],
  shipping_delivery_information_id: ["shipping_delivery_information_id"],
  billing_delivery_information_id: ["billing_delivery_information_id"],
  payment_method: ["payment_method"],
  shipping_method: ["shipping_method"],
  shipping_carrier: ["shipping_carrier", "carrier", "carrier_name", "shipping_carrier_name", "shipping_company"],
  shipping_carrier_name: ["shipping_carrier_name", "shipping_carrier", "carrier_name", "carrier"],
  estimated_delivery_date: ["estimated_delivery_date", "estimated_delivery"],
  delivery_date: ["delivery_date"],
  received_by: ["received_by"],
  cancellation_reason: ["cancellation_reason", "cancel_reason", "reason", "return_reason"],
  return_reason: ["return_reason", "cancellation_reason", "cancel_reason", "reason"],
  cancellation_notes: ["cancellation_notes", "cancel_notes", "notes", "return_notes", "description"],
  return_notes: ["return_notes", "cancellation_notes", "cancel_notes", "notes", "description"],
  transaction_id: ["transaction_id"],
  paid_amount: ["paid_amount"],
  reference_id: ["reference_id"],
  created_at: ["created_at"],
  updated_at: ["updated_at"],
};

const ORDER_SELECT = `
  SELECT
    o.*,
    sd.full_name AS shipping_full_name,
    sd.phone AS shipping_phone,
    sd.invoice_email AS invoice_email,
    sd.province_id AS shipping_province_id,
    sd.city_id AS shipping_city_id,
    sd.zone_id AS shipping_zone_id,
    sd.address AS shipping_address,
    sd.landmark AS shipping_landmark,
    sd.address_type AS shipping_address_type,
    sp.province_name AS shipping_province_name,
    sc.city AS shipping_city_name,
    sz.zone_name AS shipping_zone_name,
    bd.full_name AS billing_full_name,
    bd.phone AS billing_phone,
    bd.province_id AS billing_province_id,
    bd.city_id AS billing_city_id,
    bd.zone_id AS billing_zone_id,
    bd.address AS billing_address,
    bd.landmark AS billing_landmark,
    bd.address_type AS billing_address_type,
    bp.province_name AS billing_province_name,
    bc.city AS billing_city_name,
    bz.zone_name AS billing_zone_name
  FROM orders o
  LEFT JOIN delivery_information sd ON sd.id = o.shipping_delivery_information_id
  LEFT JOIN provinces sp ON sp.id = sd.province_id
  LEFT JOIN set_shipping sc ON sc.id = sd.city_id
  LEFT JOIN address_zone sz ON sz.id = sd.zone_id
  LEFT JOIN delivery_information bd ON bd.id = o.billing_delivery_information_id
  LEFT JOIN provinces bp ON bp.id = bd.province_id
  LEFT JOIN set_shipping bc ON bc.id = bd.city_id
  LEFT JOIN address_zone bz ON bz.id = bd.zone_id
`;

const resolveTableName = async (connection, tableCandidates = []) => {
  for (const table of tableCandidates) {
    try {
      const [rows] = await connection.query("SHOW TABLES LIKE ?", [table]);
      if (rows.length) return table;
    } catch {}
  }

  return null;
};

const ensureColumns = async (connection, tableCandidates) => {
  const table = await resolveTableName(connection, tableCandidates);
  if (!table) return { table: null, columns: [] };

  try {
    const [rows] = await connection.query(`SHOW COLUMNS FROM ${table}`);
    return { table, columns: rows.map((row) => row.Field) };
  } catch {
    return { table: null, columns: [] };
  }
};

const pickValue = (source, keys) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

export const formatOrderRow = (row, itemRows = [], productMap = new Map()) => {
  const shippingFullName = row.shipping_full_name || row.full_name || "";
  const shippingAddress = [row.shipping_address, row.shipping_landmark, row.shipping_address_type].filter(Boolean).join(", ");
  const customerLabel = shippingFullName || `Customer #${row.customer_id || ""}`;

  const items = itemRows.map((item, index) => {
    const product = productMap.get(item.product_code) || {};
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.price || product.sell_price || product.actual_price || 0);
    const subtotal = Number(item.subtotal || unitPrice * quantity || 0);
    const variationName = parseVariationName(item.variation_attributes);

    return {
      sn: index + 1,
      product: product.product_name || item.product_code,
      product_code: item.product_code,
      variation_key: item.variation_key || null,
      variation_name: variationName,
      qty: quantity,
      unitPrice,
      subtotal,
      actual_price: Number(item.actual_price || product.actual_price || 0),
    };
  });

  return {
    id: row.id,
    orderId: `#${row.order_id}`,
    order_id: row.order_id,
    customerId: row.customer_id,
    customer: customerLabel,
    address: shippingAddress || row.billing_address || "",
    totalItems: items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    totalAmount: Number(row.total_amount || 0),
    orderStatus: row.order_status || "processing",
    paymentStatus: row.payment_status || "unpaid",
    paymentMethod: row.payment_method || "",
    shippingCarrier: row.shipping_carrier || "",
    created: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : "",
    orderDate: row.created_at ? new Date(row.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    customerInfo: {
      email: row.invoice_email || row.shipping_invoice_email || row.billing_invoice_email || "",
      phone: row.shipping_phone || row.billing_phone || "",
      customerSince: row.customer_created_at || row.created_at ? new Date(row.customer_created_at || row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
      totalOrders: Number(row.customer_total_orders || 0),
    },
    shippingInfo: {
      method: row.shipping_method || "Standard Shipping",
      province: row.shipping_province_name || row.shipping_province || row.shipping_province_id || "",
      city: row.shipping_city_name || row.shipping_city || row.shipping_city_id || "",
      zone: row.shipping_zone_name || row.shipping_zone || row.shipping_zone_id || "",
      streetAddress: row.shipping_address || "",
    },
    summary: {
      subtotal: Number(row.subtotal || 0),
      taxRate: Number(row.tax_rate || 13),
      tax: Number(row.tax || 0),
      shippingCost: Number(row.shipping_cost || 0),
      totalAmount: Number(row.total_amount || 0),
    },
    items,
    raw: row,
  };
};

export const fetchOrderItems = async (connection, orderId) => {
  await ensureOrderItemVariationColumn(connection);

  const [rows] = await connection.query(
    `SELECT
       oi.id,
       oi.order_id,
       oi.product_code,
       oi.variation_key,
       oi.quantity,
       oi.price,
       oi.actual_price,
       oi.subtotal_without_tax,
       oi.tax,
       oi.subtotal,
       oi.discount,
       oi.shipping_cost,
       oi.reviewed,
       p.product_name,
       p.sell_price,
       p.actual_price AS product_actual_price,
       pv.attributes AS variation_attributes
     FROM order_items oi
     LEFT JOIN products p ON p.product_code = oi.product_code
     LEFT JOIN product_variations pv ON pv.product_code = oi.product_code AND pv.sku = oi.variation_key
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId],
  );

  const productMap = new Map();
  for (const row of rows) {
    if (row.product_code) {
      productMap.set(row.product_code, {
        product_name: row.product_name,
        sell_price: row.sell_price,
        actual_price: row.product_actual_price,
      });
    }
  }

  return { rows, productMap };
};

export const fetchAdminOrders = async (connection, { status = "" } = {}) => {
  const params = [];
  let whereClause = "";

  if (status) {
    whereClause = "WHERE o.order_status = ?";
    params.push(status);
  }

  const [rows] = await connection.query(
    `${ORDER_SELECT}
     ${whereClause}
     ORDER BY o.id DESC`,
    params,
  );

  const orders = [];

  for (const row of rows) {
    const { rows: itemRows, productMap } = await fetchOrderItems(connection, row.order_id);
    orders.push(formatOrderRow(row, itemRows, productMap));
  }

  return orders;
};

export const fetchAdminOrderById = async (connection, orderIdentifier) => {
  const cleanId = String(orderIdentifier || "").replace(/^#/, "");
  const [rows] = await connection.query(
    `${ORDER_SELECT}
     WHERE o.order_id = ? OR o.id = ?
     LIMIT 1`,
    [cleanId, cleanId],
  );

  if (!rows.length) return null;

  const row = rows[0];
  if (row.customer_id) {
    const [customerStats] = await connection.query(
      `SELECT COUNT(*) AS total_orders, MIN(created_at) AS customer_created_at
       FROM orders
       WHERE customer_id = ?`,
      [row.customer_id],
    );

    if (customerStats[0]) {
      row.customer_total_orders = customerStats[0].total_orders;
      row.customer_created_at = customerStats[0].customer_created_at;
    }
  }

  const { rows: itemRows, productMap } = await fetchOrderItems(connection, row.order_id);
  return formatOrderRow(row, itemRows, productMap);
};

const insertHistoryRow = async (connection, tableCandidates, payload) => {
  const { table, columns } = await ensureColumns(connection, tableCandidates);
  if (!table || !columns.length) return;

  if (!columns.length) return;

  const insertData = {};
  for (const [column, keys] of Object.entries(HISTORY_VALUE_KEYS)) {
    const value = pickValue(payload, keys);
    if (value !== null && columns.includes(column)) {
      insertData[column] = value;
    }
  }

  if (!insertData.order_id && columns.includes("order_id")) {
    insertData.order_id = payload.order_id || payload.orderId || null;
  }

  if (!insertData.customer_id && columns.includes("customer_id")) {
    insertData.customer_id = payload.customer_id || null;
  }

  if (!Object.keys(insertData).length) return;

  const cols = Object.keys(insertData);
  const vals = cols.map((col) => insertData[col]);
  const placeholders = cols.map(() => "?").join(", ");

  await connection.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`, vals);
};

export const upsertOrderStatusHistory = async (connection, historyType, payload) => {
  const tableCandidates = HISTORY_TABLES[historyType];
  if (!tableCandidates) return;
  await insertHistoryRow(connection, tableCandidates, payload);
};

export const upsertOrderPaymentHistory = async (connection, payload) => {
  await insertHistoryRow(connection, HISTORY_TABLES.payment, payload);
};
