import pool from "@/utils/db";
import { ensureAdminUsersSchema } from "@/utils/adminUsers";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const isAdminToken = (payload) => normalizeValue(payload?.type) === "admin";

export const requireAdminAuth = async (req, db = pool) => {
  const authUser = getAuthUser(req);

  if (!authUser?.id || !isAdminToken(authUser)) {
    return { error: unauthorizedResponse() };
  }

  await ensureAdminUsersSchema(db);

  const [rows] = await db.query(
    `SELECT
       a.id,
       COALESCE(a.full_name, a.name, '') AS full_name,
       a.email,
       a.phone,
       a.profile_photo_path,
       a.status,
       a.role_id,
       COALESCE(a.account_type, r.group_name, 'Staff') AS role
     FROM admins a
     LEFT JOIN admin_roles r ON r.id = a.role_id
     WHERE a.id = ?
     LIMIT 1`,
    [authUser.id],
  );

  const admin = rows[0] || null;
  if (!admin || Number(admin.status) === 0) {
    return { error: unauthorizedResponse() };
  }

  return {
    authUser: {
      ...authUser,
      full_name: authUser.full_name || admin.full_name || "",
      email: authUser.email || admin.email || "",
      phone: authUser.phone || admin.phone || "",
      role: admin.role || authUser.role || "Staff",
      accountType: admin.role || authUser.accountType || "Staff",
    },
    admin,
  };
};
