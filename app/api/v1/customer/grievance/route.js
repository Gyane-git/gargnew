import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

const TABLE = "grievances";

const ensureTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      customer_id BIGINT UNSIGNED NULL,
      full_name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(50) NULL,
      city VARCHAR(191) NULL,
      remarks TEXT NOT NULL,
      documents LONGTEXT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY ${TABLE}_customer_id_idx (customer_id),
      KEY ${TABLE}_email_idx (email),
      KEY ${TABLE}_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const requiredColumns = [
    ["customer_id", "BIGINT UNSIGNED NULL AFTER id"],
    ["full_name", "VARCHAR(191) NOT NULL AFTER customer_id"],
    ["email", "VARCHAR(191) NOT NULL AFTER full_name"],
    ["phone", "VARCHAR(50) NULL AFTER email"],
    ["city", "VARCHAR(191) NULL AFTER phone"],
    ["remarks", "TEXT NOT NULL AFTER city"],
    ["documents", "LONGTEXT NULL AFTER remarks"],
    ["status", "VARCHAR(50) NOT NULL DEFAULT 'new' AFTER documents"],
    ["created_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER status"],
    ["updated_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"],
  ];

  for (const [column, definition] of requiredColumns) {
    const [rows] = await pool.query(`SHOW COLUMNS FROM ${TABLE} LIKE ?`, [column]);
    if (!rows.length) {
      await pool.query(`ALTER TABLE ${TABLE} ADD COLUMN ${column} ${definition}`);
    }
  }
};

const getColumns = async () => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${TABLE}`);
  return rows.map((row) => row.Field);
};

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);

    await ensureTable();
    const columns = await getColumns();

    const body = await req.json();
    const fullName = String(body.full_name || body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const city = String(body.city || "").trim();
    const remarks = String(body.remarks || "").trim();
    const documents = Array.isArray(body.document) ? body.document : Array.isArray(body.documents) ? body.documents : [];

    if (!fullName || !email || !phone || !city || !remarks) {
      return NextResponse.json(
        { success: false, message: "All required grievance fields must be provided." },
        { status: 422 },
      );
    }

    const insertData = {};

    if (columns.includes("customer_id") && authUser?.id) {
      insertData.customer_id = authUser.id;
    }
    if (columns.includes("full_name")) {
      insertData.full_name = fullName;
    }
    if (columns.includes("name")) {
      insertData.name = fullName;
    }
    if (columns.includes("email")) insertData.email = email;
    if (columns.includes("phone")) insertData.phone = phone;
    if (columns.includes("city")) insertData.city = city;
    if (columns.includes("remarks")) insertData.remarks = remarks;
    if (columns.includes("documents")) insertData.documents = JSON.stringify(documents);
    if (columns.includes("status")) insertData.status = "new";

    const insertColumns = Object.keys(insertData);
    const insertValues = insertColumns.map((key) => insertData[key]);
    const placeholders = insertColumns.map(() => "?").join(", ");

    const [result] = await pool.query(
      `INSERT INTO ${TABLE} (${insertColumns.join(", ")}) VALUES (${placeholders})`,
      insertValues,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Grievance submitted successfully.",
        grievanceId: result.insertId,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
