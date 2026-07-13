import pool from "@/utils/db";

const TABLE = "audit_logs";

const SOURCE_TABLES = [
  { table: "order_shipped", module: "orders", model: "Order", action: "Shipped", labelFields: ["order_id", "tracking_number"] },
  { table: "order_delivered", module: "orders", model: "Order", action: "Delivered", labelFields: ["order_id", "tracking_number"] },
  { table: "order_cancel", module: "orders", model: "Order", action: "Cancelled", labelFields: ["order_id", "reason", "cancel_reason"] },
  { table: "order_returns", module: "orders", model: "Order", action: "Returned", labelFields: ["order_id", "reason", "return_reason"] },
  { table: "order_retuns", module: "orders", model: "Order", action: "Returned", labelFields: ["order_id", "reason", "return_reason"] },
  { table: "order_payments", module: "orders", model: "Order", action: "Payment", labelFields: ["order_id", "transaction_id", "payment_method"] },
  { table: "offers", module: "offers", model: "Offer", action: null, labelFields: ["title", "name"] },
  { table: "shipping_carriers", module: "shipping_carriers", model: "Shipping Carrier", action: null, labelFields: ["name"] },
  { table: "carousel_images", module: "carousel_images", model: "Carousel Image", action: null, labelFields: ["title", "name", "product_code"] },
  { table: "set_shipping", module: "set_shipping", model: "Set Shipping", action: null, labelFields: ["city_name", "name"] },
  { table: "address_zone", module: "address_zone", model: "Address Zone", action: null, labelFields: ["zone_name", "name"] },
  { table: "our_team", module: "our_team", model: "Our Team", action: null, labelFields: ["team_name", "name"] },
  { table: "grievances", module: "grievances", model: "Grievance", action: null, labelFields: ["full_name", "name", "email"] },
  { table: "inquiries", module: "inquiries", model: "Inquiry", action: null, labelFields: ["full_name", "name", "email"] },
  { table: "newsletter_subscribers", module: "newsletter_subscribers", model: "Newsletter Subscriber", action: null, labelFields: ["email"] },
  { table: "compliances", module: "compliances", model: "Compliance", action: null, labelFields: ["title", "name"] },
  { table: "clinic_setup_requests", module: "clinic_setup_requests", model: "Clinic Setup Request", action: null, labelFields: ["full_name", "name", "email"] },
  { table: "brands", module: "brands", model: "Brand", action: null, labelFields: ["brand_name", "name"] },
  { table: "categories", module: "categories", model: "Category", action: null, labelFields: ["category_name", "name"] },
  { table: "products", module: "products", model: "Product", action: null, labelFields: ["product_name", "name", "product_code"] },
];

const toDateParts = (value) => {
  if (!value) {
    return { rawDate: "", date: "", time: "" };
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { rawDate: "", date: "", time: "" };
  }

  return {
    rawDate: date.toISOString().slice(0, 10),
    date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
};

const pickValue = (row, keys = []) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return null;
};

const tableExists = async (db, table) => {
  const [rows] = await db.query("SHOW TABLES LIKE ?", [table]);
  return rows.length > 0;
};

const getColumns = async (db, table) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${table}`);
  return rows.map((row) => row.Field);
};

const selectColumn = (columns, candidates, fallback = "NULL") => {
  for (const column of candidates) {
    if (columns.includes(column)) {
      return `${column}`;
    }
  }

  return fallback;
};

const ensureAuditLogsTable = async (db = pool) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      admin_name VARCHAR(191) NOT NULL DEFAULT 'System',
      role VARCHAR(100) NOT NULL DEFAULT 'System',
      action VARCHAR(50) NOT NULL,
      module VARCHAR(191) NOT NULL,
      model VARCHAR(191) NULL,
      record_id VARCHAR(191) NULL,
      summary VARCHAR(255) NULL,
      ip_address VARCHAR(100) NULL,
      metadata LONGTEXT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY ${TABLE}_created_at_idx (created_at),
      KEY ${TABLE}_action_idx (action),
      KEY ${TABLE}_module_idx (module),
      KEY ${TABLE}_admin_idx (admin_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const requiredColumns = [
    ["admin_name", "VARCHAR(191) NOT NULL DEFAULT 'System' AFTER id"],
    ["role", "VARCHAR(100) NOT NULL DEFAULT 'System' AFTER admin_name"],
    ["action", "VARCHAR(50) NOT NULL DEFAULT 'Update' AFTER role"],
    ["module", "VARCHAR(191) NOT NULL DEFAULT 'system' AFTER action"],
    ["module_type", "VARCHAR(191) NULL AFTER action"],
    ["model", "VARCHAR(191) NULL AFTER module"],
    ["record_id", "VARCHAR(191) NULL AFTER model"],
    ["summary", "VARCHAR(255) NULL AFTER record_id"],
    ["ip_address", "VARCHAR(100) NULL AFTER summary"],
    ["metadata", "LONGTEXT NULL AFTER ip_address"],
    ["created_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER metadata"],
    ["updated_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"],
  ];

  for (const [column, definition] of requiredColumns) {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${TABLE} LIKE ?`, [column]);
    if (!rows.length) {
      await db.query(`ALTER TABLE ${TABLE} ADD COLUMN ${column} ${definition}`);
    }
  }
};

const normalizeStoredLog = (row) => {
  const parts = toDateParts(row.created_at || row.updated_at);
  let metadata = null;

  if (row.metadata) {
    try {
      metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    } catch {
      metadata = row.metadata;
    }
  }

  return {
    id: row.id,
    admin: row.admin_name || "System",
    role: row.role || "System",
    action: row.action || "Update",
    module: row.module || row.module_type || "",
    model: row.model || "",
    recordId: row.record_id || "",
    ip: row.ip_address || "",
    summary: row.summary || "",
    details: metadata,
    rawDate: parts.rawDate,
    date: parts.date,
    time: parts.time,
    created_at: row.created_at || row.updated_at || null,
    source: "audit_logs",
  };
};

const normalizeDerivedLog = (source, row) => {
  const timestamp = row.updated_at || row.created_at || row.start_date || row.end_date || null;
  const parts = toDateParts(timestamp);
  const label = pickValue(row, source.labelFields) || pickValue(row, ["title", "name", "product_name", "email", "order_id", "id"]);
  const action = source.action || (row.updated_at && row.created_at && new Date(row.updated_at).getTime() > new Date(row.created_at).getTime() ? "Update" : "Create");
  const summaryBits = [label, row.status ? `Status: ${row.status}` : null].filter(Boolean);

  return {
    id: `${source.table}-${row.id || parts.rawDate || Math.random().toString(36).slice(2, 8)}`,
    admin: "System",
    role: "System",
    action,
    module: source.module,
    model: source.model,
    recordId: row.id ? String(row.id) : "",
    ip: "",
    summary: summaryBits.join(" | "),
    details: {
      source_table: source.table,
      label,
      status: row.status ?? row.publish ?? row.order_status ?? null,
    },
    rawDate: parts.rawDate,
    date: parts.date,
    time: parts.time,
    created_at: timestamp,
    source: source.table,
  };
};

const fetchDerivedLogs = async (db, limit = 200) => {
  const collected = [];

  for (const source of SOURCE_TABLES) {
    try {
      if (!(await tableExists(db, source.table))) {
        continue;
      }

      const columns = await getColumns(db, source.table);
      const hasCreated = columns.includes("created_at");
      const hasUpdated = columns.includes("updated_at");
      const timestampOrder = `${hasUpdated ? "updated_at DESC, " : ""}${hasCreated ? "created_at DESC, " : ""}id DESC`;

      const [rows] = await db.query(
        `SELECT * FROM ${source.table} ORDER BY ${timestampOrder} LIMIT 25`,
      );

      rows.forEach((row) => collected.push(normalizeDerivedLog(source, row)));
    } catch (error) {
      console.error(`Failed to read audit source table ${source.table}:`, error.message);
    }
  }

  collected.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  return collected.slice(0, limit).map(({ created_at, ...rest }) => rest);
};

export const recordAuditLog = async (db, payload = {}) => {
  await ensureAuditLogsTable(db);
  const columns = await getColumns(db, TABLE);

  const adminName = String(payload.admin_name || payload.admin || "System").trim() || "System";
  const role = String(payload.role || "System").trim() || "System";
  const action = String(payload.action || "Update").trim() || "Update";
  const module = String(payload.module || "system").trim() || "system";
  const model = payload.model ? String(payload.model).trim() : null;
  const recordId = payload.record_id !== undefined && payload.record_id !== null ? String(payload.record_id) : null;
  const summary = payload.summary ? String(payload.summary).trim().slice(0, 255) : null;
  const ipAddress = payload.ip_address ? String(payload.ip_address).trim().slice(0, 100) : null;
  const metadata = payload.metadata !== undefined && payload.metadata !== null ? JSON.stringify(payload.metadata) : null;

  const insertData = {
    admin_name: adminName,
    role,
    action,
    model,
    record_id: recordId,
    summary,
    ip_address: ipAddress,
    metadata,
  };

  if (columns.includes("module")) {
    insertData.module = module;
  }
  if (columns.includes("module_type")) {
    insertData.module_type = module;
  }

  const insertColumns = Object.keys(insertData).filter((column) => columns.includes(column));
  const insertValues = insertColumns.map((column) => insertData[column]);
  const placeholders = insertColumns.map(() => "?").join(", ");

  await db.query(
    `INSERT INTO ${TABLE} (${insertColumns.join(", ")})
     VALUES (${placeholders})`,
    insertValues,
  );
};

export const fetchAuditLogs = async (db = pool, { limit = 200 } = {}) => {
  await ensureAuditLogsTable(db);

  const columns = await getColumns(db, TABLE);
  const adminExpr = selectColumn(columns, ["admin_name", "admin", "user_name", "name"], "'System'");
  const roleExpr = selectColumn(columns, ["role", "user_role"], "'System'");
  const actionExpr = selectColumn(columns, ["action", "type", "event"], "'Update'");
  const moduleExpr = selectColumn(columns, ["module", "module_type", "model_type", "module_name"], "'system'");
  const modelExpr = selectColumn(columns, ["model"], "NULL");
  const recordIdExpr = selectColumn(columns, ["record_id"], "NULL");
  const summaryExpr = selectColumn(columns, ["summary"], "NULL");
  const ipExpr = selectColumn(columns, ["ip_address", "ip"], "NULL");
  const metadataExpr = selectColumn(columns, ["metadata", "details", "payload"], "NULL");
  const createdExpr = selectColumn(columns, ["created_at"], "NULL");
  const updatedExpr = selectColumn(columns, ["updated_at"], "NULL");

  const [rows] = await db.query(
    `SELECT
       id,
       ${adminExpr} AS admin_name,
       ${roleExpr} AS role,
       ${actionExpr} AS action,
       ${moduleExpr} AS module,
       ${modelExpr} AS model,
       ${recordIdExpr} AS record_id,
       ${summaryExpr} AS summary,
       ${ipExpr} AS ip_address,
       ${metadataExpr} AS metadata,
       ${createdExpr} AS created_at,
       ${updatedExpr} AS updated_at
     FROM ${TABLE}
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [limit],
  );

  if (rows.length > 0) {
    return rows.map(normalizeStoredLog);
  }

  return fetchDerivedLogs(db, limit);
};
