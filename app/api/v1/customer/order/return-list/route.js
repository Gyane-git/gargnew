import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

const parseImagePaths = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value].filter(Boolean);
    } catch {
      return [value].filter(Boolean);
    }
  }
  return [];
};

const resolveTable = async (connection) => {
  for (const table of ["order_returns", "order_retuns"]) {
    const [rows] = await connection.query("SHOW TABLES LIKE ?", [table]);
    if (rows.length) return table;
  }
  return null;
};

/**
 * @swagger
 * /api/v1/customer/order/return-list:
 *   get:
 *     summary: List the authenticated customer's return requests
 *     description: Returns all rows from the order_returns (or legacy order_retuns) table
 *       for the authenticated customer, newest first, with each row's stored image path(s)
 *       resolved into an image_full_url array. Returns an empty list if no returns table exists.
 *     tags: [Customer - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of return requests
 *       401: { description: Unauthorized }
 *       500: { description: Failed to fetch return requests }
 */
export async function GET(request) {
  let connection = null;
  try {
    const authUser = getAuthUser(request);
    if (!authUser?.id) return unauthorizedResponse();

    connection = await pool.getConnection();
    const table = await resolveTable(connection);
    if (!table) {
      return NextResponse.json({ success: true, returns: [] });
    }

    const [rows] = await connection.query(
      `SELECT * FROM ${table} WHERE customer_id = ? ORDER BY id DESC`,
      [authUser.id],
    );

    const returns = rows.map((row) => ({
      ...row,
      image_full_url: parseImagePaths(row.image_path || row.images).map((item) =>
        item.startsWith("http") ? item : `/${String(item).replace(/^\/+/, "")}`,
      ),
    }));

    return NextResponse.json({
      success: true,
      returns,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch return requests.",
      },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
