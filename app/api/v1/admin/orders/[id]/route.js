import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { fetchAdminOrderById, upsertOrderPaymentHistory, upsertOrderStatusHistory } from "@/utils/adminOrders";
import { getAuthUser } from "@/utils/authUser";
import { recordAuditLog } from "@/utils/auditLogs";
import { buildOrderStatusEmail } from "@/lib/orderEmail";
import { sendMail } from "@/utils/mailer";

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const getTableColumns = async (connection, tableName) => {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
  return rows.map((row) => row.Field);
};

export async function GET(_request, context) {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = await context.params;
    const order = await fetchAdminOrderById(connection, id);

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PATCH(request, context) {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { id } = await context.params;
    const authUser = getAuthUser(request);
    const order = await fetchAdminOrderById(connection, id);

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const body = await request.json();
    const previousOrderStatus = normalizeStatus(order.orderStatus);
    const nextOrderStatus = normalizeStatus(body.order_status || body.orderStatus || order.orderStatus);
    const nextPaymentStatus = normalizeStatus(body.payment_status || body.paymentStatus || order.paymentStatus);
    const nextPaymentMethod = String(body.payment_mode || body.paymentMethod || order.paymentMethod || order.raw?.payment_method || "").trim() || null;
    const orderColumns = await getTableColumns(connection, "orders");
    const updateFields = [];
    const updateValues = [];

    if (orderColumns.includes("order_status")) {
      updateFields.push("order_status = ?");
      updateValues.push(nextOrderStatus);
    }

    if (orderColumns.includes("payment_status")) {
      updateFields.push("payment_status = ?");
      updateValues.push(nextPaymentStatus);
    }

    if (nextPaymentMethod !== null && orderColumns.includes("payment_method")) {
      updateFields.push("payment_method = ?");
      updateValues.push(nextPaymentMethod);
    } else if (nextPaymentMethod !== null && orderColumns.includes("payment_mode")) {
      updateFields.push("payment_mode = ?");
      updateValues.push(nextPaymentMethod);
    }

    if (orderColumns.includes("updated_at")) {
      updateFields.push("updated_at = NOW()");
    }

    await connection.beginTransaction();

    if (updateFields.length) {
      await connection.query(
        `UPDATE orders
         SET ${updateFields.join(", ")}
         WHERE order_id = ? OR id = ?`,
        [...updateValues, order.order_id, order.id],
      );
    }

    await connection.commit();

    const historyPayload = {
      ...body,
      order_id: order.order_id,
      customer_id: order.customerId,
      order_status: nextOrderStatus,
      payment_status: nextPaymentStatus,
      payment_mode: nextPaymentMethod,
      payment_method: nextPaymentMethod,
      transaction_id: order.raw?.transaction_id || body.transaction_id || null,
      shipping_delivery_information_id: order.raw?.shipping_delivery_information_id || null,
      billing_delivery_information_id: order.raw?.billing_delivery_information_id || null,
      shipping_method: order.raw?.shipping_method || null,
      shipping_carrier: body.shipping_carrier || body.carrier_name || null,
      estimated_delivery_date: body.estimated_delivery_date || body.estimatedDelivery || null,
      delivery_date: body.delivery_date || body.deliveryDate || null,
      received_by: body.received_by || body.receivedBy || null,
      cancellation_reason: body.cancel_reason || body.cancellation_reason || null,
      cancellation_notes: body.cancel_notes || body.cancellation_notes || null,
      paid_amount: body.paid_amount || null,
      reference_id: body.reference_id || body.referenceId || null,
    };

    try {
      await upsertOrderStatusHistory(connection, nextOrderStatus, historyPayload);

      if (
        nextPaymentStatus === "paid" ||
        historyPayload.paid_amount !== null ||
        historyPayload.payment_mode !== null ||
        historyPayload.transaction_id !== null
      ) {
        await upsertOrderPaymentHistory(connection, {
          ...historyPayload,
          payment_amount: historyPayload.paid_amount || order.raw?.total_amount || order.totalAmount || null,
        });
      }
    } catch (historyError) {
      console.error("Order history insert failed:", historyError);
    }

    if (nextOrderStatus !== previousOrderStatus || nextPaymentStatus !== normalizeStatus(order.paymentStatus)) {
      try {
        const customerEmail = order.customerInfo?.email || order.raw?.invoice_email || "";
        if (customerEmail) {
          const orderItems = Array.isArray(order.items)
            ? order.items.map((item) => ({
                product_name: item.product || item.product_name || item.product_code || "Product",
                quantity: item.qty || item.quantity || 0,
                unit_price: item.unitPrice || item.price || item.actual_price || 0,
                final_price: item.subtotal || item.total || 0,
              }))
            : [];

          await sendMail({
            to: customerEmail,
            subject: `Order update for #${order.order_id}`,
            text: `Hello ${order.customer || "Customer"},\n\nYour order #${order.order_id} status has been updated to ${nextOrderStatus || "processing"}.\n\nThank you for choosing Garg Dental.`,
            html: buildOrderStatusEmail({
              landingData: {
                company_name: "Garg Dental Pvt. Ltd.",
                company_logo_header: "",
                website_link: "https://gargdental.com/",
                primary_phone: "+977-1-4536276",
              },
              status: nextOrderStatus || "processing",
              customerName: order.customer || "Customer",
              orderNumber: order.order_id,
              shippingCarrier: body.shipping_carrier || body.carrier_name || order.shippingCarrier || "",
              shippingCharge: Number(order.summary?.shippingCost || order.raw?.shipping_cost || 0),
              remarks: body.cancel_notes || body.cancel_reason || "",
              orderItems,
            }),
          });
        }
      } catch (mailError) {
        console.error("ORDER STATUS MAIL ERROR:", mailError.message);
      }
    }

    await recordAuditLog(connection, {
      admin_name: authUser?.name || authUser?.full_name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Update",
      module: "orders",
      model: "Order",
      record_id: order.order_id,
      summary: `Order ${order.order_id} updated to ${nextOrderStatus || "processing"}`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: {
        order_id: order.order_id,
        order_status: nextOrderStatus,
        payment_status: nextPaymentStatus,
        payment_method: nextPaymentMethod,
        body,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
