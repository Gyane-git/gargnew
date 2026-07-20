import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { getCustomerCartId } from "@/utils/cart";
import { buildOrderReceivedEmail } from "@/lib/orderEmail";
import { buildInvoicePdfBuffer } from "@/lib/invoicePdf";
import { sendMail } from "@/utils/mailer";
import {
  createDeliveryInformation,
  fetchAddressById,
  generateOrderNumber,
  insertOrderItems,
  insertOrderRow,
  removeCartItemsByIds,
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
    const subtotal = toNumber(body.subtotal);
    const grandtotal = toNumber(body.grandtotal);
    const shipping = toNumber(body.shipping);
    const selectedItems = Array.isArray(body.selected_items) ? body.selected_items.map((id) => Number(id)).filter(Boolean) : [];
    const transactionId = String(body.transaction_id || "").trim() || null;

    if (!paymentMethod || !billingAddressId || !shippingAddressId || !invoiceEmail) {
      return Response.json(
        { success: false, message: "payment_method, billing_address, shipping_address and invoice_email are required." },
        { status: 422 },
      );
    }

    if (!selectedItems.length) {
      return Response.json({ success: false, message: "selected_items is required." }, { status: 422 });
    }

    await connection.beginTransaction();

    const cartId = await getCustomerCartId(connection, authUser.id, false);
    if (!cartId) {
      await connection.rollback();
      return Response.json({ success: false, message: "Cart not found." }, { status: 404 });
    }

    const billingAddress = await fetchAddressById(connection, authUser.id, billingAddressId);
    const shippingAddress = await fetchAddressById(connection, authUser.id, shippingAddressId);
    if (!billingAddress || !shippingAddress) {
      await connection.rollback();
      return Response.json({ success: false, message: "Billing or shipping address not found." }, { status: 404 });
    }

    const [cartRows] = await connection.query(
      `SELECT
        ci.id,
        ci.product_code,
        ci.variation_key,
        ci.quantity,
        ci.price,
        ci.actual_price,
        p.available_quantity
       FROM cart_items ci
       LEFT JOIN products p ON p.product_code = ci.product_code
       WHERE ci.cart_id = ? AND ci.id IN (${selectedItems.map(() => "?").join(",")})`,
      [cartId, ...selectedItems],
    );

    if (cartRows.length === 0 || cartRows.length !== selectedItems.length) {
      await connection.rollback();
      return Response.json(
        { success: false, message: "One or more selected cart items were not found." },
        { status: 404 },
      );
    }

    for (const row of cartRows) {
      try {
        await reserveInventoryForItem(connection, {
          productCode: row.product_code,
          quantity: Number(row.quantity || 0),
          variationKey: row.variation_key || null,
        });
      } catch (inventoryError) {
        await connection.rollback();
        return Response.json(
          { success: false, message: inventoryError.message || "Insufficient stock." },
          { status: 422 },
        );
      }
    }

    const orderItems = cartRows.map((row) => {
      const quantity = Number(row.quantity || 0);
      const price = Number(row.price || 0);
      const actualPrice = Number(row.actual_price || 0);
      const subtotalValue = Number((price * quantity).toFixed(2));
      return {
        product_code: row.product_code,
        variation_key: row.variation_key || null,
        quantity,
        price: price.toFixed(2),
        actual_price: actualPrice.toFixed(2),
        subtotal_without_tax: "0.00",
        tax: "0.00",
        subtotal: subtotalValue.toFixed(2),
        discount: "0.00",
        shipping_cost: shipping.toFixed(2),
      };
    });

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
    await removeCartItemsByIds(connection, cartId, selectedItems);

    await connection.commit();

    try {
      const customerName = billingAddress.full_name || shippingAddress.full_name || authUser.full_name || "Customer";
      const invoicePdf = buildInvoicePdfBuffer(
        {
          order_id: orderNumber,
          orderId: orderNumber,
          customer: customerName,
          customerInfo: {
            email: invoiceEmail,
            phone: billingAddress.phone || shippingAddress.phone || authUser.phone || "",
          },
          shippingInfo: {
            method: "Standard Shipping",
            province: shippingAddress.province_name || "",
            city: shippingAddress.city_name || "",
            zone: shippingAddress.zone_name || "",
            streetAddress: shippingAddress.address || "",
          },
          items: orderItems.map((item) => ({
            product: item.product_code,
            product_name: item.product_code,
            quantity: item.quantity,
            unitPrice: Number(item.price || 0),
            final_price: Number(item.subtotal || 0),
            subtotal: Number(item.subtotal || 0),
          })),
          summary: {
            subtotal: subtotal,
            tax: 0,
            shippingCost: shipping,
            totalAmount: grandtotal,
          },
          orderStatus: "processing",
          paymentStatus: "unpaid",
        },
        {
          company_name: "Garg Dental Pvt. Ltd.",
          address_line: "Putalisadak, Kathmandu, Nepal",
          city_line: "Kathmandu, Nepal",
          phone: "+977-1-4536276",
          email: "info@gargdental.com",
          vat_no: "123456789",
          pan_no: "987654321",
        },
      );

      await sendMail({
        to: invoiceEmail,
        subject: `Your Garg Dental order #${orderNumber} has been received`,
        text: `Hello ${customerName},\n\nYour order #${orderNumber} has been received successfully.\n\nThank you for choosing Garg Dental.`,
        html: buildOrderReceivedEmail({
          customerName,
          includeInvoiceNote: true,
        }),
        attachments: [
          {
            filename: `invoice-${orderNumber}.pdf`,
            content: invoicePdf,
            contentType: "application/pdf",
          },
        ],
      });
    } catch (mailError) {
      console.error("ORDER RECEIVED MAIL ERROR:", mailError.message);
    }

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
    console.error("ORDER ADD ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
