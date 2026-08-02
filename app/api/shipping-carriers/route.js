import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/utils/authUser";
import { recordAuditLog } from "@/utils/auditLogs";

const TABLE = "shipping_carriers";

async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(191) NOT NULL,
      address VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      type VARCHAR(100) NOT NULL,
      publish TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY ${TABLE}_name_idx (name),
      KEY ${TABLE}_type_idx (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [publishColumn] = await pool.query(`SHOW COLUMNS FROM ${TABLE} LIKE 'publish'`);
  if (!publishColumn.length) {
    await pool.query(`ALTER TABLE ${TABLE} ADD COLUMN publish TINYINT(1) NOT NULL DEFAULT 1 AFTER type`);
  }

  const [statusColumn] = await pool.query(`SHOW COLUMNS FROM ${TABLE} LIKE 'status'`);
  if (statusColumn.length) {
    await pool.query(`ALTER TABLE ${TABLE} MODIFY status TINYINT(1) NOT NULL DEFAULT 1`);
  }

  return {
    hasStatus: statusColumn.length > 0,
  };
}

/**
 * @swagger
 * /api/shipping-carriers:
 *   get:
 *     summary: List all shipping carriers (creates the shipping_carriers table if it doesn't exist yet)
 *     tags: [Admin - Shipping]
 *     responses:
 *       200: { description: '{ success: true, carriers: [...] } list of carriers ordered by id descending, each with id, name, address, phone, type, publish, created_at, updated_at.' }
 *       500: { description: '{ success: false, message } returned on a database error.' }
 */
export async function GET() {
  try {
    await ensureTable();

    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        address,
        phone,
        type,
        COALESCE(publish, status, 1) AS publish,
        created_at,
        updated_at
      FROM ${TABLE}
      ORDER BY id DESC
    `);

    return NextResponse.json({
      success: true,
      carriers: rows,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/shipping-carriers:
 *   post:
 *     summary: Create a new shipping carrier and record an audit log entry for the creation
 *     tags: [Admin - Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               type: { type: string }
 *               publish: { type: integer, enum: [0, 1], description: Defaults to 1 (published) when omitted. }
 *     responses:
 *       200: { description: '{ success: true, message: "Carrier created successfully.", carrierId } on success.' }
 *       400: { description: '{ success: false, message } returned when name or type is missing.' }
 *       500: { description: '{ success: false, message } returned on a database error.' }
 */
export async function POST(req) {
  try {
    const { hasStatus } = await ensureTable();
    const authUser = getAuthUser(req);

    const body = await req.json();
    const name = String(body.name || "").trim();
    const address = String(body.address || "").trim();
    const phone = String(body.phone || "").trim();
    const type = String(body.type || "").trim();
    const publish = body.publish === undefined ? 1 : Number(body.publish) ? 1 : 0;

    if (!name) {
      return NextResponse.json({ success: false, message: "Carrier name is required." }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ success: false, message: "Carrier type is required." }, { status: 400 });
    }

    const columns = ["name", "address", "phone", "type", "publish"];
    const values = [name, address || null, phone || null, type, publish];

    if (hasStatus) {
      columns.push("status");
      values.push(publish);
    }

    const placeholders = columns.map(() => "?").join(", ");
    const [result] = await pool.query(
      `INSERT INTO ${TABLE} (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );

    await recordAuditLog(pool, {
      admin_name: authUser?.name || authUser?.full_name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Create",
      module: "shipping_carriers",
      model: "Shipping Carrier",
      record_id: result.insertId,
      summary: name.slice(0, 255),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "",
      metadata: {
        carrier_id: result.insertId,
        name,
        address: address || null,
        phone: phone || null,
        type,
        publish,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Carrier created successfully.",
      carrierId: result.insertId,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
