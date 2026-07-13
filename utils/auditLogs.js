import pool from "@/utils/db";

const TABLE = "audit_logs";
let auditSchemaPromise = null;

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

const normalizeFilterValue = (value) => String(value ?? "").trim();

const buildAuditWhereClause = (filters = {}) => {
  const clauses = [];
  const values = [];

  if (filters.startDate) {
    clauses.push("DATE(COALESCE(created_at, updated_at)) >= ?");
    values.push(filters.startDate);
  }

  if (filters.endDate) {
    clauses.push("DATE(COALESCE(created_at, updated_at)) <= ?");
    values.push(filters.endDate);
  }

  if (filters.role) {
    clauses.push("role = ?");
    values.push(filters.role);
  }

  if (filters.admin) {
    clauses.push("admin_name = ?");
    values.push(filters.admin);
  }

  if (filters.module) {
    clauses.push("module = ?");
    values.push(filters.module);
  }

  if (filters.model) {
    clauses.push("model = ?");
    values.push(filters.model);
  }

  if (filters.action) {
    clauses.push("action = ?");
    values.push(filters.action);
  }

  if (filters.search) {
    clauses.push(
      `LOWER(CONCAT_WS(' ', COALESCE(admin_name, ''), COALESCE(role, ''), COALESCE(action, ''), COALESCE(module, ''), COALESCE(model, ''), COALESCE(record_id, ''), COALESCE(summary, ''), COALESCE(ip_address, ''), COALESCE(metadata, ''))) LIKE ?`,
    );
    values.push(`%${filters.search.toLowerCase()}%`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
};

const normalizeAuditFilters = (filters = {}) => ({
  startDate: normalizeFilterValue(filters.startDate),
  endDate: normalizeFilterValue(filters.endDate),
  role: normalizeFilterValue(filters.role),
  admin: normalizeFilterValue(filters.admin),
  module: normalizeFilterValue(filters.module),
  model: normalizeFilterValue(filters.model),
  action: normalizeFilterValue(filters.action),
  search: normalizeFilterValue(filters.search),
});

const ensureAuditLogsTable = async (db = pool) => {
  if (!auditSchemaPromise) {
    auditSchemaPromise = (async () => {
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
    })().catch((error) => {
      auditSchemaPromise = null;
      throw error;
    });
  }

  return auditSchemaPromise;
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

const matchesDerivedFilters = (log, filters = {}) => {
  if (filters.startDate && log.rawDate && log.rawDate < filters.startDate) {
    return false;
  }

  if (filters.endDate && log.rawDate && log.rawDate > filters.endDate) {
    return false;
  }

  if (filters.role && log.role !== filters.role) {
    return false;
  }

  if (filters.admin && log.admin !== filters.admin) {
    return false;
  }

  if (filters.module && log.module !== filters.module) {
    return false;
  }

  if (filters.model && log.model !== filters.model) {
    return false;
  }

  if (filters.action && log.action !== filters.action) {
    return false;
  }

  if (filters.search) {
    const haystack = `${log.ip} ${log.admin} ${log.role} ${log.module} ${log.model} ${log.action} ${log.summary || ""} ${JSON.stringify(log.details || {})}`.toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) {
      return false;
    }
  }

  return true;
};

const buildAuditMeta = (logs = []) => ({
  admins: Array.from(new Set(logs.map((log) => log.admin).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" })),
  roles: Array.from(new Set(logs.map((log) => log.role).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" })),
  modules: Array.from(new Set(logs.map((log) => log.module).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" })),
  models: Array.from(new Set(logs.map((log) => log.model).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" })),
  actions: Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" })),
});

const fetchDerivedLogs = async (db, limit = 200, filters = {}) => {
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

  const normalizedFilters = normalizeAuditFilters(filters);
  const filtered = collected.filter((log) => matchesDerivedFilters(log, normalizedFilters));
  const paged = filtered.slice(filters.offset || 0, (filters.offset || 0) + limit);

  return {
    logs: paged.map(({ created_at, ...rest }) => rest),
    count: filtered.length,
    meta: buildAuditMeta(filtered),
  };
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

export const fetchAuditLogs = async (db = pool, { limit = 200, offset = 0, filters = {}, includeMeta = false } = {}) => {
  await ensureAuditLogsTable(db);

  const normalizedFilters = normalizeAuditFilters(filters);
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

  const baseQuery = `
    SELECT
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
  `;
  const { whereSql, values } = buildAuditWhereClause(normalizedFilters);
  const limitValue = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 200;
  const offsetValue = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM (${baseQuery}) AS audit_base ${whereSql}`, values);
  const totalCount = Number(countRows?.[0]?.total || 0);

  const [rows] = await db.query(
    `SELECT * FROM (${baseQuery}) AS audit_base
     ${whereSql}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...values, limitValue, offsetValue],
  );

  if (rows.length > 0) {
    const logs = rows.map(normalizeStoredLog);
    let meta;

    if (includeMeta) {
      const [metaRows] = await db.query(
        `SELECT * FROM (${baseQuery}) AS audit_base
         ${whereSql}
         ORDER BY created_at DESC, id DESC`,
        values,
      );

      meta = buildAuditMeta(metaRows.map(normalizeStoredLog));
    }

    return {
      logs,
      count: totalCount,
      meta,
    };
  }

  if (totalCount > 0) {
    return {
      logs: [],
      count: 0,
      meta: includeMeta ? buildAuditMeta([]) : undefined,
    };
  }

  return fetchDerivedLogs(db, limitValue, { ...normalizedFilters, offset: offsetValue });
};
