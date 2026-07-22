import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { fetchOrderCancelReasonById, normalizeReasonText } from "@/utils/orderCancelReasons";
import { recordAuditLog } from "@/utils/auditLogs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const TABLE = "order_returns";
const FALLBACK_TABLE = "order_retuns";
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/returns");

const getColumns = async (connection, tableName) => {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
  return rows.map((row) => row.Field);
};

const resolveTable = async (connection) => {
  for (const table of [TABLE, FALLBACK_TABLE]) {
    const [rows] = await connection.query("SHOW TABLES LIKE ?", [table]);
    if (rows.length) {
      return table;
    }
  }
  return null;
};

const parseFormFiles = (formData) =>
  formData
    .getAll("images[]")
    .filter((file) => file && typeof file === "object" && file.size > 0);

const normalizeOrderId = (value) => String(value || "").trim().replace(/^#/, "");

export async function POST(request) {
  let connection = null;

  try {
    const authUser = getAuthUser(request);
    if (!authUser?.id) return unauthorizedResponse();

    connection = await pool.getConnection();

    const formData = await request.formData();
    const orderIdInput = normalizeOrderId(formData.get("order_id"));
    const reasonId = Number(formData.get("reason_id") || 0);
    const reasonDescription = String(formData.get("reason_description") || "").trim();
    const images = parseFormFiles(formData);

    if (!orderIdInput || !reasonId) {
      return NextResponse.json(
        { success: false, message: "order_id and reason_id are required." },
        { status: 422 },
      );
    }

    if (!reasonDescription) {
      return NextResponse.json(
        { success: false, message: "reason_description is required." },
        { status: 422 },
      );
    }

    const reason = await fetchOrderCancelReasonById(reasonId);
    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Return reason not found." },
        { status: 404 },
      );
    }

    if (
      normalizeReasonText(reason.reason_type) !== "return" ||
      normalizeReasonText(reason.reason_for) !== "customer"
    ) {
      return NextResponse.json(
        { success: false, message: "Selected reason is not available for customer returns." },
        { status: 422 },
      );
    }

    const numericOrderId = Number(orderIdInput);
    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE order_id = ? OR id = ? LIMIT 1`,
      [orderIdInput, Number.isFinite(numericOrderId) ? numericOrderId : null],
    );

    const order = orders[0];
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 },
      );
    }

    if (String(order.order_status || "").toLowerCase() !== "delivered") {
      return NextResponse.json(
        { success: false, message: "Only delivered orders can be returned." },
        { status: 422 },
      );
    }

    const table = (await resolveTable(connection)) || TABLE;
    const columns = await getColumns(connection, table);
    const returnId = `R${Date.now()}${Math.floor(Math.random() * 1000)}`;
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

    await mkdir(UPLOAD_DIR, { recursive: true });
    const imagePaths = [];

    for (const file of images) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      imagePaths.push(`uploads/returns/${fileName}`);
    }

    const insertData = {};
    if (columns.includes("full_name")) insertData.full_name = customerName;
    if (columns.includes("name")) insertData.name = customerName;
    if (columns.includes("customer_name")) insertData.customer_name = customerName;
    if (columns.includes("email")) insertData.email = customerEmail;
    if (columns.includes("phone")) insertData.phone = customerPhone;
    if (columns.includes("return_id")) insertData.return_id = returnId;
    if (columns.includes("order_id")) insertData.order_id = order.order_id || order.id;
    if (columns.includes("order_number")) insertData.order_number = order.order_id || order.id;
    if (columns.includes("customer_id")) insertData.customer_id = order.customer_id || authUser.id;
    if (columns.includes("reason_id")) insertData.reason_id = reason.id;
    if (columns.includes("reason")) insertData.reason = reason.reason_name || "";
    if (columns.includes("return_reason")) insertData.return_reason = reason.reason_name || "";
    if (columns.includes("reason_name")) insertData.reason_name = reason.reason_name || "";
    if (columns.includes("return_reason_name")) insertData.return_reason_name = reason.reason_name || "";
    if (columns.includes("return_description")) insertData.return_description = reasonDescription;
    if (columns.includes("reason_description")) insertData.reason_description = reasonDescription;
    if (columns.includes("description")) insertData.description = reasonDescription;
    if (columns.includes("return_description_text")) insertData.return_description_text = reasonDescription;
    if (columns.includes("image_path")) insertData.image_path = JSON.stringify(imagePaths);
    if (columns.includes("images")) insertData.images = JSON.stringify(imagePaths);
    if (columns.includes("return_status")) insertData.return_status = 0;
    if (columns.includes("status")) insertData.status = 0;
    if (columns.includes("created_at")) insertData.created_at = new Date();
    if (columns.includes("updated_at")) insertData.updated_at = new Date();

    const insertColumns = Object.keys(insertData);
    if (!insertColumns.length) {
      return NextResponse.json(
        { success: false, message: "order_returns table does not have supported columns." },
        { status: 500 },
      );
    }

    const quotedColumns = insertColumns.map((column) => `\`${column}\``).join(", ");
    const placeholders = insertColumns.map(() => "?").join(", ");
    await connection.query(
      `INSERT INTO ${table} (${quotedColumns}) VALUES (${placeholders})`,
      insertColumns.map((column) => insertData[column]),
    );

    const orderColumns = await getColumns(connection, "orders");
    const updateFields = [];
    const updateValues = [];

    if (orderColumns.includes("order_status")) {
      updateFields.push("order_status = ?");
      updateValues.push("returned");
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

    try {
      await recordAuditLog(connection, {
        admin_name: authUser?.name || authUser?.full_name || authUser?.email || "Customer",
        role: authUser?.role || authUser?.user_role || "Customer",
        action: "Returned",
        module: "orders",
        model: "Order",
        record_id: order.order_id,
        summary: `Order ${order.order_id} return requested`,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
        metadata: {
          order_id: order.order_id,
          reason_id: reason.id,
          reason: reason.reason_name || "",
          reason_description: reasonDescription,
          image_paths: imagePaths,
        },
      });
    } catch (auditError) {
      console.error("RETURN AUDIT LOG ERROR:", auditError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Return request submitted successfully.",
      return_id: returnId,
      image_paths: imagePaths,
    });
  } catch (error) {
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
