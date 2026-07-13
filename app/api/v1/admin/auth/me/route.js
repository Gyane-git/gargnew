import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { ensureAdminUsersSchema } from "@/utils/adminUsers";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) {
      return unauthorizedResponse();
    }

    await ensureAdminUsersSchema(pool);

    const [rows] = await pool.query(
      `SELECT
         a.id,
         COALESCE(a.full_name, a.name, '') AS full_name,
         a.email,
         a.phone,
         a.profile_photo_path,
         a.status,
         a.role_id,
         COALESCE(a.account_type, r.group_name, 'Staff') AS role,
         COALESCE(r.permissions, '') AS permissions
       FROM admins a
       LEFT JOIN admin_roles r ON r.id = a.role_id
       WHERE a.id = ?
       LIMIT 1`,
      [authUser.id],
    );

    if (!rows.length) {
      return unauthorizedResponse();
    }

    const admin = rows[0];
    if (Number(admin.status) === 0) {
      return unauthorizedResponse();
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        profile_photo_path: admin.profile_photo_path,
        role: admin.role,
        role_id: admin.role_id,
        permissions: admin.permissions,
        status: admin.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}
