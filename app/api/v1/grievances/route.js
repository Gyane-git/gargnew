import pool from "@/utils/db";
import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    await ensureTable();
    const columns = await getColumns();
    const nameSelect = columns.includes("full_name")
      ? "full_name"
      : columns.includes("name")
        ? "name"
        : "NULL AS full_name";

    const [rows] = await pool.query(
      `SELECT id, customer_id, ${nameSelect}, email, phone, city, remarks, documents, status, created_at, updated_at
       FROM ${TABLE}
       ORDER BY id DESC`,
    );

    return NextResponse.json({
      success: true,
      grievances: rows,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
