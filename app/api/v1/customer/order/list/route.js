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

    const orderIds = rows.map((row) => row.order_id);
    let itemRows = [];
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => "?").join(",");
      const [items] = await connection.query(
        `SELECT id, order_id, product_code, quantity, price, actual_price, subtotal_without_tax, tax, subtotal, discount, shipping_cost, reviewed
         FROM order_items
         WHERE order_id IN (${placeholders})
         ORDER BY id ASC`,
        orderIds,
      );
      itemRows = items;
    }

    const productCodes = [...new Set(itemRows.map((item) => String(item.product_code)).filter(Boolean))];
    let productMap = new Map();
    if (productCodes.length > 0) {
      const placeholders = productCodes.map(() => "?").join(",");
      const [products] = await connection.query(
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
         WHERE p.product_code IN (${placeholders})`,
        productCodes,
      );

      productMap = new Map(products.map((product) => [String(product.product_code), product]));
    }

    const itemsByOrderId = new Map();
    for (const item of itemRows) {
      const key = String(item.order_id);
      if (!itemsByOrderId.has(key)) itemsByOrderId.set(key, []);
      itemsByOrderId.get(key).push(item);
    }

    const orders = rows.map((row) => buildOrder(row, itemsByOrderId.get(String(row.order_id)) || [], productMap));

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
