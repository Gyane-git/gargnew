import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { fetchAdminOrderById, upsertOrderPaymentHistory, upsertOrderStatusHistory } from "@/utils/adminOrders";

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
    const order = await fetchAdminOrderById(connection, id);

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const body = await request.json();
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
