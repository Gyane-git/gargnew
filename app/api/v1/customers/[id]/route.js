import pool from "@/utils/db";
import { NextResponse } from "next/server";

// ── GET CUSTOMER BY ID ────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query("SELECT id, name, email, phone, status, created_at, updated_at FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: rows[0],
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── UPDATE CUSTOMER ───────────────────────────────────────────────
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, email, phone, password, status } = body;

    // Check customer exists
    const [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    // Check email conflict with another user
    if (email) {
      const [emailCheck] = await pool.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
      if (emailCheck.length > 0) {
        return NextResponse.json({ success: false, message: "Email already in use by another customer" }, { status: 409 });
      }
    }

    // Build dynamic query — only update provided fields
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }
    if (phone !== undefined) {
      fields.push("phone = ?");
      values.push(phone);
    }
    if (password !== undefined) {
      fields.push("password = ?");
      values.push(password);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: "No fields provided to update" }, { status: 400 });
    }

    values.push(id);

    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── DELETE CUSTOMER ───────────────────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
