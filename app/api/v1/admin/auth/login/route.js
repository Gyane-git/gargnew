import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { ensureAdminUsersSchema } from "@/utils/adminUsers";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const comparePassword = async (plainPassword, hashedPassword) => {
  if (!hashedPassword) return false;

  const normalizedHash = hashedPassword.startsWith("$2y$")
    ? `$2b$${hashedPassword.slice(4)}`
    : hashedPassword;

  try {
    return await bcrypt.compare(plainPassword, normalizedHash);
  } catch {
    return false;
  }
};

export async function POST(req) {
  try {
    await ensureAdminUsersSchema(pool);

    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    const [rows] = await pool.query(
      `SELECT
         a.id,
         COALESCE(a.full_name, a.name, '') AS full_name,
         a.email,
         a.phone,
         a.password,
         a.status,
         a.role_id,
         COALESCE(a.account_type, r.group_name, 'Staff') AS role,
         COALESCE(r.permissions, '') AS permissions
       FROM admins a
       LEFT JOIN admin_roles r ON r.id = a.role_id
       WHERE a.email = ?
       LIMIT 1`,
      [email],
    );

    if (!rows.length) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    const admin = rows[0];

    if (Number(admin.status) === 0) {
      return NextResponse.json({ success: false, message: "Your account is inactive." }, { status: 403 });
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    const tokenPayload = {
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      role_id: admin.role_id,
      permissions: admin.permissions,
      type: "admin",
    };

    const token = jwt.sign(tokenPayload, process.env.NEXTAUTH_SECRET, {
      expiresIn: "7d",
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      token,
      admin: tokenPayload,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
