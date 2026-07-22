import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { fetchOrderCancelReasonById, normalizeReasonText } from "@/utils/orderCancelReasons";
import { recordAuditLog } from "@/utils/auditLogs";

const TABLE = "order_cancel";

const getTableColumns = async (connection, tableName) => {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
  return rows.map((row) => row.Field);
};

export async function POST(request) {
  let connection = null;
  try {
    const authUser = getAuthUser(request);
    if (!authUser?.id) return unauthorizedResponse();

    connection = await pool.getConnection();
    const body = await request.json();
    const orderIdInput = String(body.order_id || body.orderId || "").trim();
    const reasonId = Number(body.reason_id || body.reasonId || 0);
    const reasonDescription = String(body.reason_description || body.reasonDescription || "").trim();
    const policyChecked = String(body.policy_checked || body.policyChecked || "Y").trim().toUpperCase();

    if (!orderIdInput || !reasonId) {
      return NextResponse.json(
        { success: false, message: "order_id and reason_id are required." },
        { status: 422 },
      );
    }

    const reason = await fetchOrderCancelReasonById(reasonId);
    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Cancel reason not found." },
        { status: 404 },
      );
    }

    if (
      normalizeReasonText(reason.reason_type) !== "cancel" ||
      normalizeReasonText(reason.reason_for) !== "customer"
    ) {
      return NextResponse.json(
        { success: false, message: "Selected reason is not available for customer cancellation." },
        { status: 422 },
      );
    }

    const cleanId = orderIdInput.replace(/^#/, "");
    const orderCandidates = [...new Set([orderIdInput, cleanId, `#${cleanId}`, `ORD${cleanId}`, `#ORD${cleanId}`].filter(Boolean))];
    const numericIds = [...new Set([Number(orderIdInput), Number(cleanId)].filter((value) => Number.isFinite(value)))];

    const whereParts = [];
    const values = [];
    if (orderCandidates.length) {
      whereParts.push(`order_id IN (${orderCandidates.map(() => "?").join(", ")})`);
      values.push(...orderCandidates);
    }
    if (numericIds.length) {
      whereParts.push(`id IN (${numericIds.map(() => "?").join(", ")})`);
      values.push(...numericIds);
    }

    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE ${whereParts.join(" OR ")} LIMIT 1`,
      values,
    );

    const order = orders[0];
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    await connection.beginTransaction();

    const columns = await getTableColumns(connection, TABLE);
    const reasonLabel = reason.reason_name || "";
    const reasonText = reasonDescription || reasonLabel;
    const customerName =
      authUser?.full_name ||
      authUser?.name ||
      order.shipping_full_name ||
      order.billing_full_name ||
      "Customer";
    const customerEmail =
      authUser?.email ||
      order.shipping_invoice_email ||
      order.invoice_email ||
      "";
    const customerPhone =
      authUser?.phone ||
      order.shipping_phone ||
      order.billing_phone ||
      "";
    const insertData = {};

    if (columns.includes("full_name")) insertData.full_name = customerName;
    if (columns.includes("name")) insertData.name = customerName;
    if (columns.includes("customer_name")) insertData.customer_name = customerName;
    if (columns.includes("email")) insertData.email = customerEmail;
    if (columns.includes("phone")) insertData.phone = customerPhone;
    if (columns.includes("order_id")) insertData.order_id = order.order_id || order.id;
    if (columns.includes("order_number")) insertData.order_number = order.order_id || order.id;
    if (columns.includes("customer_id")) insertData.customer_id = order.customer_id || null;
    if (columns.includes("reason_id")) insertData.reason_id = reason.id;
    if (columns.includes("reason")) insertData.reason = reasonLabel;
    if (columns.includes("cancel_reason")) insertData.cancel_reason = reasonLabel;
    if (columns.includes("reason_name")) insertData.reason_name = reasonLabel;
    if (columns.includes("cancel_reason_name")) insertData.cancel_reason_name = reasonLabel;
    if (columns.includes("reason_description")) insertData.reason_description = reasonText;
    if (columns.includes("description")) insertData.description = reasonText;
    if (columns.includes("cancel_description")) insertData.cancel_description = reasonText;
    if (columns.includes("policy_checked")) insertData.policy_checked = policyChecked;
    if (columns.includes("status")) insertData.status = "cancelled";
    if (columns.includes("order_status")) insertData.order_status = "cancelled";
    if (columns.includes("created_at")) insertData.created_at = new Date();
    if (columns.includes("updated_at")) insertData.updated_at = new Date();

    const insertColumns = Object.keys(insertData);
    if (!insertColumns.length) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "order_cancel table does not have supported columns." },
        { status: 500 },
      );
    }

    const quotedColumns = insertColumns.map((column) => `\`${column}\``).join(", ");
    const placeholders = insertColumns.map(() => "?").join(", ");
    await connection.query(
      `INSERT INTO ${TABLE} (${quotedColumns}) VALUES (${placeholders})`,
      insertColumns.map((column) => insertData[column]),
    );

    const orderColumns = await getTableColumns(connection, "orders");
    const updateFields = [];
    const updateValues = [];

    if (orderColumns.includes("order_status")) {
      updateFields.push("order_status = ?");
      updateValues.push("cancelled");
    }

    if (orderColumns.includes("updated_at")) {
      updateFields.push("updated_at = NOW()");
    }

    if (updateFields.length) {
      await connection.query(
        `UPDATE orders SET ${updateFields.join(", ")} WHERE order_id = ? OR id = ?`,
        [...updateValues, order.order_id, order.id],
      );
    }

    await connection.commit();

    try {
      await recordAuditLog(connection, {
        admin_name: authUser?.name || authUser?.full_name || authUser?.email || "Customer",
        role: authUser?.role || authUser?.user_role || "Customer",
        action: "Cancelled",
        module: "orders",
        model: "Order",
        record_id: order.order_id,
        summary: `Order ${order.order_id} cancelled`,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
        metadata: {
          order_id: order.order_id,
          reason_id: reason.id,
          reason: reasonLabel,
          reason_description: reasonText,
          policy_checked: policyChecked,
        },
      });
    } catch (auditError) {
      console.error("CANCEL AUDIT LOG ERROR:", auditError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully.",
      order_id: order.order_id,
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
        message: error.message || "Internal server error.",
      },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
