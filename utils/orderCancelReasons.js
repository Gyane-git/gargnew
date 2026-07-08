import pool from "@/utils/db";

const TABLE = "order_cancel_reasons";

export const normalizeReasonText = (value) => String(value || "").trim().toLowerCase();

export const formatOrderCancelReason = (row = {}) => {
  const reasonName = row.reason_name ?? row.name ?? row.title ?? "";
  const reasonType = normalizeReasonText(row.reason_type ?? row.type ?? "");
  const reasonFor = normalizeReasonText(row.reason_for ?? row.for ?? "");

  return {
    ...row,
    reason_name: reasonName,
    reason_type: reasonType,
    reason_for: reasonFor,
  };
};

export const getOrderCancelReasonColumns = async () => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${TABLE}`);
  return rows.map((row) => row.Field);
};

export const fetchOrderCancelReasons = async () => {
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} ORDER BY id DESC`);
  return rows.map(formatOrderCancelReason);
};

export const fetchOrderCancelReasonById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? formatOrderCancelReason(rows[0]) : null;
};

export const insertOrderCancelReason = async (body = {}) => {
  const columns = await getOrderCancelReasonColumns();
  const reasonName = String(body.reasonName || body.reason_name || body.name || "").trim();
  const reasonType = normalizeReasonText(body.reasonType || body.reason_type || body.type || "");
  const reasonFor = normalizeReasonText(body.reasonFor || body.reason_for || body.for || "");

  if (!reasonName || !reasonType || !reasonFor) {
    return {
      success: false,
      message: "Reason name, reason type, and reason for are required.",
      status: 422,
    };
  }

  const insertData = {};

  if (columns.includes("reason_name")) insertData.reason_name = reasonName;
  if (columns.includes("name")) insertData.name = reasonName;
  if (columns.includes("reason_type")) insertData.reason_type = reasonType;
  if (columns.includes("type")) insertData.type = reasonType;
  if (columns.includes("reason_for")) insertData.reason_for = reasonFor;
  if (columns.includes("for")) insertData.for = reasonFor;
  if (columns.includes("created_at")) insertData.created_at = new Date();
  if (columns.includes("updated_at")) insertData.updated_at = new Date();

  const insertColumns = Object.keys(insertData);
  if (!insertColumns.length) {
    return {
      success: false,
      message: "No matching columns were found for order_cancel_reasons.",
      status: 500,
    };
  }

  const insertValues = insertColumns.map((key) => insertData[key]);
  const placeholders = insertColumns.map(() => "?").join(", ");
  const quotedColumns = insertColumns.map((column) => `\`${column}\``).join(", ");

  const [result] = await pool.query(
    `INSERT INTO ${TABLE} (${quotedColumns}) VALUES (${placeholders})`,
    insertValues,
  );

  return {
    success: true,
    reasonId: result.insertId,
  };
};

export const updateOrderCancelReason = async (id, body = {}) => {
  const columns = await getOrderCancelReasonColumns();
  const existing = await fetchOrderCancelReasonById(id);

  if (!existing) {
    return {
      success: false,
      message: "Reason not found.",
      status: 404,
    };
  }

  const reasonName = String(body.reasonName || body.reason_name || body.name || existing.reason_name || "").trim();
  const reasonType = normalizeReasonText(body.reasonType || body.reason_type || body.type || existing.reason_type || "");
  const reasonFor = normalizeReasonText(body.reasonFor || body.reason_for || body.for || existing.reason_for || "");

  if (!reasonName || !reasonType || !reasonFor) {
    return {
      success: false,
      message: "Reason name, reason type, and reason for are required.",
      status: 422,
    };
  }

  const updateData = {};

  if (columns.includes("reason_name")) updateData.reason_name = reasonName;
  if (columns.includes("name")) updateData.name = reasonName;
  if (columns.includes("reason_type")) updateData.reason_type = reasonType;
  if (columns.includes("type")) updateData.type = reasonType;
  if (columns.includes("reason_for")) updateData.reason_for = reasonFor;
  if (columns.includes("for")) updateData.for = reasonFor;
  if (columns.includes("updated_at")) updateData.updated_at = new Date();

  const updateColumns = Object.keys(updateData);
  if (!updateColumns.length) {
    return {
      success: false,
      message: "No matching columns were found for order_cancel_reasons.",
      status: 500,
    };
  }

  const updateValues = updateColumns.map((key) => updateData[key]);
  const setClause = updateColumns.map((column) => `\`${column}\` = ?`).join(", ");

  const [result] = await pool.query(
    `UPDATE ${TABLE} SET ${setClause} WHERE id = ?`,
    [...updateValues, id],
  );

  return {
    success: true,
    affectedRows: result.affectedRows,
  };
};

export const deleteOrderCancelReason = async (id) => {
  const [result] = await pool.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  return {
    success: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
};
