import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { fetchAdminOrders } from "@/utils/adminOrders";

export async function GET(request) {
  let connection = null;
  try {
    connection = await pool.getConnection();
    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get("status") || "").trim();

    const orders = await fetchAdminOrders(connection, { status });

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
