import { NextResponse } from "next/server";
import pool from "@/utils/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const brand_id = searchParams.get("brand_id");
    const limit = parseInt(searchParams.get("limit")) || 10;
    const offset = parseInt(searchParams.get("offset")) || 0;

    if (!brand_id) {
      return NextResponse.json({ success: false, message: "brand_id is required" }, { status: 400 });
    }

    const [rows] = await pool.query(
      `SELECT * FROM products 
       WHERE brand_id = ? 
       LIMIT ? OFFSET ?`,
      [brand_id, limit, offset],
    );

    return NextResponse.json({
      success: true,
      products: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("brand-wise-products error:", err);

    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
