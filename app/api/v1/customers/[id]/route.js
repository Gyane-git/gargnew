import pool from "@/utils/db";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get a single customer by ID
 *     description: No API-layer authentication is enforced on this route.
 *     tags: [Admin - Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Customer found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     phone: { type: string }
 *                     status: { type: integer }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *       404: { description: Customer not found }
 *       500: { description: Internal server error }
 */
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

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update a customer
 *     description: No API-layer authentication is enforced on this route. Only fields
 *       present (not undefined) in the request body are updated; password, if provided,
 *       is written as-is (not re-hashed by this route).
 *     tags: [Admin - Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               status: { type: integer }
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400: { description: No fields provided to update }
 *       404: { description: Customer not found }
 *       409: { description: Email already in use by another customer }
 *       500: { description: Internal server error }
 */
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

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     description: No API-layer authentication is enforced on this route. Permanently
 *       deletes the row from `users`.
 *     tags: [Admin - Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       404: { description: Customer not found }
 *       500: { description: Internal server error }
 */
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
