import bcrypt from "bcryptjs";
import pool from "@/utils/db";

const USERS_TABLE = "admins";
const ROLES_TABLE = "admin_roles";
let adminSchemaPromise = null;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeString = (value) => String(value || "").trim();
const normalizeStatus = (value) => (Number(value) === 0 || String(value).toLowerCase() === "inactive" ? 0 : 1);

const tableExists = async (db, table) => {
  const [rows] = await db.query("SHOW TABLES LIKE ?", [table]);
  return rows.length > 0;
};

const getColumns = async (db, table) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${table}`);
  return rows.map((row) => row.Field);
};

const selectExisting = (columns, candidates, fallback = "NULL") => {
  for (const candidate of candidates) {
    if (columns.includes(candidate)) return candidate;
  }
  return fallback;
};

const ensureUsersTable = async (db = pool) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${USERS_TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      full_name VARCHAR(191) NULL,
      name VARCHAR(191) NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(50) NULL,
      password VARCHAR(255) NOT NULL,
      address VARCHAR(255) NULL,
      country VARCHAR(100) NULL,
      profile_photo_path VARCHAR(255) NULL,
      role_id BIGINT UNSIGNED NULL,
      account_type VARCHAR(191) NULL,
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY ${USERS_TABLE}_email_unique (email),
      KEY ${USERS_TABLE}_role_id_idx (role_id),
      KEY ${USERS_TABLE}_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const requiredColumns = [
    ["full_name", "VARCHAR(191) NULL AFTER id"],
    ["name", "VARCHAR(191) NULL AFTER full_name"],
    ["email", "VARCHAR(191) NOT NULL AFTER name"],
    ["phone", "VARCHAR(50) NULL AFTER email"],
    ["password", "VARCHAR(255) NOT NULL AFTER phone"],
    ["address", "VARCHAR(255) NULL AFTER password"],
    ["country", "VARCHAR(100) NULL AFTER address"],
    ["profile_photo_path", "VARCHAR(255) NULL AFTER country"],
    ["role_id", "BIGINT UNSIGNED NULL AFTER country"],
    ["account_type", "VARCHAR(191) NULL AFTER role_id"],
    ["status", "TINYINT(1) NOT NULL DEFAULT 1 AFTER account_type"],
    ["created_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER status"],
    ["updated_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"],
  ];

  for (const [column, definition] of requiredColumns) {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${USERS_TABLE} LIKE ?`, [column]);
    if (!rows.length) {
      await db.query(`ALTER TABLE ${USERS_TABLE} ADD COLUMN ${column} ${definition}`);
    }
  }
};

const ensureRolesTable = async (db = pool) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${ROLES_TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      group_name VARCHAR(191) NOT NULL,
      permissions LONGTEXT NULL,
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY ${ROLES_TABLE}_group_name_unique (group_name),
      KEY ${ROLES_TABLE}_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const requiredColumns = [
    ["group_name", "VARCHAR(191) NOT NULL AFTER id"],
    ["permissions", "LONGTEXT NULL AFTER group_name"],
    ["status", "TINYINT(1) NOT NULL DEFAULT 1 AFTER permissions"],
    ["created_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER status"],
    ["updated_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"],
  ];

  for (const [column, definition] of requiredColumns) {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${ROLES_TABLE} LIKE ?`, [column]);
    if (!rows.length) {
      await db.query(`ALTER TABLE ${ROLES_TABLE} ADD COLUMN ${column} ${definition}`);
    }
  }

  const [existingRows] = await db.query(`SELECT COUNT(*) AS total FROM ${ROLES_TABLE}`);
  if (Number(existingRows[0]?.total || 0) === 0) {
    await db.query(
      `INSERT INTO ${ROLES_TABLE} (group_name, permissions, status)
       VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [
        "Super Admin",
        "",
        1,
        "Admin",
        "",
        1,
        "Manager",
        "",
        1,
        "Staff",
        "",
        1,
      ],
    );
  }
};

const roleLabel = (roleRow) => {
  if (!roleRow) return null;
  return roleRow.group_name || roleRow.name || roleRow.role_name || null;
};

export const ensureAdminUsersSchema = async (db = pool) => {
  if (!adminSchemaPromise) {
    adminSchemaPromise = (async () => {
      await ensureUsersTable(db);
      await ensureRolesTable(db);
    })().catch((error) => {
      adminSchemaPromise = null;
      throw error;
    });
  }

  return adminSchemaPromise;
};

export const fetchAdminRoles = async (db = pool) => {
  await ensureRolesTable(db);
  const columns = await getColumns(db, ROLES_TABLE);
  const groupExpr = selectExisting(columns, ["group_name", "name", "role_name"], "'Role'");
  const permissionsExpr = selectExisting(columns, ["permissions"], "NULL");
  const statusExpr = selectExisting(columns, ["status"], "1");
  const createdExpr = selectExisting(columns, ["created_at"], "NULL");
  const updatedExpr = selectExisting(columns, ["updated_at"], "NULL");

  const [rows] = await db.query(
    `SELECT
       id,
       ${groupExpr} AS group_name,
       ${permissionsExpr} AS permissions,
       ${statusExpr} AS status,
       ${createdExpr} AS created_at,
       ${updatedExpr} AS updated_at
     FROM ${ROLES_TABLE}
     ORDER BY id DESC`,
  );

  return rows.map((row) => ({
    id: row.id,
    groupName: row.group_name || "",
    permissions: row.permissions || "",
    status: Number(row.status) === 0 ? 0 : 1,
    createdAt: row.created_at || row.updated_at || null,
    updatedAt: row.updated_at || row.created_at || null,
  }));
};

export const fetchAdminUsers = async (db = pool) => {
  await ensureUsersTable(db);
  await ensureRolesTable(db);

  const roleColumns = await getColumns(db, ROLES_TABLE);
  const userColumns = await getColumns(db, USERS_TABLE);
  const accountTypeExpr = userColumns.includes("account_type")
    ? `COALESCE(a.account_type, ${roleColumns.includes("group_name") ? "r.group_name" : "NULL"})`
    : (roleColumns.includes("group_name") ? "r.group_name" : "'Staff'");

  const [rows] = await db.query(
    `SELECT
       a.id,
       COALESCE(a.full_name, a.name, '') AS full_name,
       a.email,
       a.phone,
       a.address,
       a.country,
       a.profile_photo_path,
       a.role_id,
       ${accountTypeExpr} AS account_type,
       a.status,
       a.created_at,
       a.updated_at
     FROM ${USERS_TABLE} a
     LEFT JOIN ${ROLES_TABLE} r ON r.id = a.role_id
     ORDER BY a.id DESC`,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.full_name || row.name || "",
    fullName: row.full_name || row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    country: row.country || "",
    profilePhotoPath: row.profile_photo_path || null,
    roleId: row.role_id || null,
    accountType: row.account_type || "Staff",
    status: Number(row.status) === 0 ? 0 : 1,
    createdAt: row.created_at || row.updated_at || null,
    updatedAt: row.updated_at || row.created_at || null,
  }));
};

export const fetchAdminUserById = async (db = pool, id) => {
  const users = await fetchAdminUsers(db);
  return users.find((user) => String(user.id) === String(id)) || null;
};

export const fetchAdminRoleById = async (db = pool, id) => {
  const roles = await fetchAdminRoles(db);
  return roles.find((role) => String(role.id) === String(id)) || null;
};

export const saveAdminUser = async (db = pool, { id = null, body = {} } = {}) => {
  await ensureAdminUsersSchema(db);

  const fullName = normalizeString(body.full_name || body.name);
  const email = normalizeEmail(body.email);
  const phone = normalizeString(body.phone);
  const address = normalizeString(body.address);
  const country = normalizeString(body.country);
  const roleId = body.role_id !== undefined && body.role_id !== null && String(body.role_id).trim() !== "" ? Number(body.role_id) : null;
  const accountType = normalizeString(body.accountType || body.account_type || body.role_name);
  const status = normalizeStatus(body.status);
  const profilePhotoPath = normalizeString(body.profile_photo_path);

  if (!fullName) {
    return { success: false, status: 422, message: "Name is required." };
  }

  if (!email) {
    return { success: false, status: 422, message: "Email is required." };
  }

  let passwordHash = null;
  if (body.password) {
    passwordHash = await bcrypt.hash(String(body.password), 10);
  }

  const roleColumns = await getColumns(db, ROLES_TABLE);
  const [roleRows] = await db.query(
    `SELECT id, ${selectExisting(roleColumns, ["group_name", "name", "role_name"], "NULL")} AS group_name
     FROM ${ROLES_TABLE}
     WHERE id = ? LIMIT 1`,
    [roleId],
  );
  const resolvedRoleName = roleRows[0]?.group_name || accountType || null;

  const insertData = {
    full_name: fullName,
    email,
    phone: phone || null,
    address: address || null,
    country: country || null,
    profile_photo_path: profilePhotoPath || null,
    role_id: roleId,
    account_type: resolvedRoleName,
    status,
  };

  if (!id) {
    if (!passwordHash) {
      return { success: false, status: 422, message: "Password is required." };
    }
    insertData.password = passwordHash;
  } else if (passwordHash) {
    insertData.password = passwordHash;
  }

  const columns = await getColumns(db, USERS_TABLE);
  if (columns.includes("name")) {
    insertData.name = fullName;
  }

  const filteredData = Object.fromEntries(
    Object.entries(insertData).filter(([column, value]) => columns.includes(column) && value !== undefined),
  );

  if (id) {
    const updateColumns = Object.keys(filteredData).filter((column) => column !== "password" || filteredData.password);
    if (!updateColumns.length) {
      return { success: false, status: 400, message: "No fields to update." };
    }

    const updateSql = updateColumns.map((column) => `${column} = ?`).join(", ");
    const updateValues = updateColumns.map((column) => filteredData[column]);
    await db.query(`UPDATE ${USERS_TABLE} SET ${updateSql} WHERE id = ?`, [...updateValues, id]);

    return { success: true, id };
  }

  const insertColumns = Object.keys(filteredData);
  const values = insertColumns.map((column) => filteredData[column]);
  const placeholders = insertColumns.map(() => "?").join(", ");

  const [result] = await db.query(
    `INSERT INTO ${USERS_TABLE} (${insertColumns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return { success: true, id: result.insertId };
};

export const deleteAdminUser = async (db = pool, id) => {
  await ensureUsersTable(db);
  const [result] = await db.query(`DELETE FROM ${USERS_TABLE} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

export const saveAdminRole = async (db = pool, { id = null, body = {} } = {}) => {
  await ensureRolesTable(db);

  const groupName = normalizeString(body.groupName || body.group_name || body.name);
  const permissions = Array.isArray(body.permissions)
    ? body.permissions.map((value) => normalizeString(value)).filter(Boolean).join(",")
    : normalizeString(body.permissions);
  const status = normalizeStatus(body.status);

  if (!groupName) {
    return { success: false, status: 422, message: "Group name is required." };
  }

  const columns = await getColumns(db, ROLES_TABLE);
  const insertData = {
    group_name: groupName,
    permissions,
    status,
  };

  if (columns.includes("name")) {
    insertData.name = groupName;
  }
  if (columns.includes("role_name")) {
    insertData.role_name = groupName;
  }

  const filteredData = Object.fromEntries(
    Object.entries(insertData).filter(([column]) => columns.includes(column)),
  );

  if (id) {
    const updateColumns = Object.keys(filteredData);
    const updateSql = updateColumns.map((column) => `${column} = ?`).join(", ");
    const updateValues = updateColumns.map((column) => filteredData[column]);
    await db.query(`UPDATE ${ROLES_TABLE} SET ${updateSql} WHERE id = ?`, [...updateValues, id]);
    return { success: true, id };
  }

  const insertColumns = Object.keys(filteredData);
  const values = insertColumns.map((column) => filteredData[column]);
  const placeholders = insertColumns.map(() => "?").join(", ");

  const [result] = await db.query(
    `INSERT INTO ${ROLES_TABLE} (${insertColumns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return { success: true, id: result.insertId };
};

export const deleteAdminRole = async (db = pool, id) => {
  await ensureRolesTable(db);
  const [result] = await db.query(`DELETE FROM ${ROLES_TABLE} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};
