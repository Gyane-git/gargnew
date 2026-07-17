import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import {
  createDeliveryInformation,
  fetchAddressById,
  generateOrderNumber,
  getProductByCode,
  insertOrderItems,
  insertOrderRow,
  reserveInventoryForItem,
} from "@/utils/order";

const toNumber = (value) => Number(value || 0);

export async function POST(req) {
  let connection = null;
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();
    connection = await pool.getConnection();

    const body = await req.json();
    const paymentMethod = String(body.payment_method || "").trim();
    const billingAddressId = Number(body.billing_address);
    const shippingAddressId = Number(body.shipping_address);
    const invoiceEmail = String(body.invoice_email || "").trim();
    const transactionId = String(body.transaction_id || "").trim() || null;
    const buyNowItem = body.buy_now_item || {};
    const productCode = String(buyNowItem.product_code || "").trim();
    const quantity = Number(buyNowItem.quantity || 0);
    if (!paymentMethod || !billingAddressId || !shippingAddressId || !invoiceEmail || !productCode || quantity < 1) {
      return Response.json(
        {
          success: false,
          message: "payment_method, billing_address, shipping_address, invoice_email and buy_now_item are required.",
        },
        { status: 422 },
      );
    }

    await connection.beginTransaction();

    const billingAddress = await fetchAddressById(connection, authUser.id, billingAddressId);
    const shippingAddress = await fetchAddressById(connection, authUser.id, shippingAddressId);
    if (!billingAddress || !shippingAddress) {
      await connection.rollback();
      return Response.json({ success: false, message: "Billing or shipping address not found." }, { status: 404 });
    }

    const product = await getProductByCode(connection, productCode);
    if (!product) {
      await connection.rollback();
      return Response.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    try {
      await reserveInventoryForItem(connection, {
        productCode,
        quantity,
      });
    } catch (inventoryError) {
      await connection.rollback();
      return Response.json(
        { success: false, message: inventoryError.message || "Insufficient stock." },
        { status: 422 },
      );
    }

    const price = Number(product.sell_price || product.actual_price || 0);
    const actualPrice = Number(product.actual_price || 0);
    const subtotal = Number((price * quantity).toFixed(2));
    const shipping = Number(
      body.shipping ?? shippingAddress.shipping_cost ?? billingAddress.shipping_cost ?? 0,
    );
    const grandtotal = Number((subtotal + shipping).toFixed(2));
    const itemSubtotal = Number((price * quantity).toFixed(2));
    const orderItems = [
      {
        product_code: product.product_code,
        quantity,
        price: price.toFixed(2),
        actual_price: actualPrice.toFixed(2),
        subtotal_without_tax: "0.00",
        tax: "0.00",
        subtotal: itemSubtotal.toFixed(2),
        discount: "0.00",
        shipping_cost: shipping.toFixed(2),
      },
    ];

    const orderNumber = generateOrderNumber(authUser.id);
    const orderCode = `#ORD${orderNumber}`;
    const shippingDeliveryInformationId = await createDeliveryInformation(connection, {
      customerId: authUser.id,
      orderCode,
      address: shippingAddress,
      invoiceEmail,
      type: "shipping",
    });
    const billingDeliveryInformationId = await createDeliveryInformation(connection, {
      customerId: authUser.id,
      orderCode,
      address: billingAddress,
      invoiceEmail,
      type: "billing",
    });

    await insertOrderRow(connection, {
      order_id: orderNumber,
      customer_id: authUser.id,
      transaction_id: transactionId,
      shipping_delivery_information_id: shippingDeliveryInformationId,
      billing_delivery_information_id: billingDeliveryInformationId,
      payment_method: paymentMethod,
      shipping_method: null,
      subtotal_without_tax: "0.00",
      subtotal: subtotal.toFixed(2),
      tax: "0.00",
      shipping_cost: shipping.toFixed(2),
      shipping_snapshot: JSON.stringify({
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId,
        shipping_cost: shipping.toFixed(2),
      }),
      coupon_snapshot: null,
      discount: "0.00",
      total_amount: grandtotal.toFixed(2),
      order_status: "processing",
      payment_status: "unpaid",
    });

    await insertOrderItems(connection, orderNumber, orderItems);

    await connection.commit();

    return Response.json({
      success: true,
      message: "Order placed successfully.",
      order_id: orderNumber,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }
    console.error("BUY NOW ORDER ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
