import { NextResponse } from "next/server";
import pool from "@/utils/db";

// DELETE /api/v1/customers/reviews/[id]
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    const [[row]] = await pool.query("SELECT id FROM product_reviews WHERE id = ?", [id]);
    if (!row) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM product_reviews WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("[DELETE /api/v1/customers/reviews/[id]]", error);
    return NextResponse.json({ success: false, message: "Failed to delete review" }, { status: 500 });
  }
}

// GET /api/v1/customers/reviews/[id]
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    const [[review]] = await pool.query("SELECT * FROM product_reviews WHERE id = ?", [id]);
    if (!review) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[GET /api/v1/customers/reviews/[id]]", error);
    return NextResponse.json({ success: false, message: "Failed to fetch review" }, { status: 500 });
  }
}
