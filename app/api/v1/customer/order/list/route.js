import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

const buildOrderItem = (row, productMap = new Map()) => {
  const product = productMap.get(String(row.product_code)) || null;

  return {
    id: row.id,
    order_id: row.order_id,
    product_code: row.product_code,
    quantity: Number(row.quantity || 0),
    price: Number(row.price || product?.sell_price || product?.actual_price || 0),
    actual_price: Number(row.actual_price || product?.actual_price || 0),
    subtotal_without_tax: Number(row.subtotal_without_tax || 0),
    tax: Number(row.tax || 0),
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    shipping_cost: Number(row.shipping_cost || 0),
    reviewed: Number(row.reviewed || 0),
    product,
  };
};

const buildOrder = (row, itemRows = [], productMap = new Map()) => {
  const orderItems = itemRows.map((item) => buildOrderItem(item, productMap));

  return {
    ...row,
    order_number: row.order_id,
    order_items: orderItems,
  };
};

export async function GET(req) {
  let connection = null;

  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    connection = await pool.getConnection();

    const status = String(req.nextUrl.searchParams.get("status") || "").trim();
    const params = [authUser.id];
    let whereClause = "WHERE o.customer_id = ?";

    if (status) {
      whereClause += " AND o.order_status = ?";
      params.push(status);
    }

    const [rows] = await connection.query(
      `SELECT
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
        bd.full_name AS billing_full_name,
        bd.phone AS billing_phone,
        bd.province_id AS billing_province_id,
        bd.city_id AS billing_city_id,
        bd.zone_id AS billing_zone_id,
        bd.address AS billing_address,
        bd.landmark AS billing_landmark,
        bd.address_type AS billing_address_type
       FROM orders o
       LEFT JOIN delivery_information sd ON sd.id = o.shipping_delivery_information_id
       LEFT JOIN delivery_information bd ON bd.id = o.billing_delivery_information_id
       ${whereClause}
       ORDER BY o.id DESC`,
      params,
    );

    const orderIds = rows.map((row) => row.order_id).filter(Boolean);
    const [items] = orderIds.length
      ? await connection.query(
          `SELECT
             oi.id,
             oi.order_id,
             oi.product_code,
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
             p.actual_price AS product_actual_price
           FROM order_items oi
           LEFT JOIN products p ON p.product_code = oi.product_code
           WHERE oi.order_id IN (${orderIds.map(() => "?").join(",")})
           ORDER BY oi.order_id DESC, oi.id ASC`,
          orderIds,
        )
      : [[]];

    const productMap = new Map();
    for (const item of items) {
      if (item.product_code && !productMap.has(String(item.product_code))) {
        productMap.set(String(item.product_code), {
          product_name: item.product_name,
          sell_price: item.sell_price,
          actual_price: item.product_actual_price,
        });
      }
    }

    const itemsByOrderId = new Map();
    for (const item of items) {
      const key = String(item.order_id);
      if (!itemsByOrderId.has(key)) itemsByOrderId.set(key, []);
      itemsByOrderId.get(key).push(item);
    }

    const orders = rows.map((row) =>
      buildOrder(row, itemsByOrderId.get(String(row.order_id)) || [], productMap),
    );

    return Response.json({
      success: true,
      orders: {
        orders,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error("ORDER LIST ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
