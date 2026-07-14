import bcrypt from "bcryptjs";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import pool from "@/utils/db";
import { ensureAdminUsersSchema } from "@/utils/adminUsers";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/admin-profiles");

const normalizeString = (value) => String(value || "").trim();

const normalizePhotoPath = (value) => {
  const raw = normalizeString(value);
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/uploads/")) return raw;
  if (raw.startsWith("/public/")) return raw.replace(/^\/public/, "");
  if (raw.startsWith("public/")) return `/${raw.replace(/^public\//, "")}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const getRoleColumns = async () => {
  const [rows] = await pool.query("SHOW COLUMNS FROM admin_roles");
  return rows.map((row) => row.Field);
};

const resolveRoleId = async (roleName, currentRoleId = null) => {
  const normalized = normalizeString(roleName).toLowerCase();
  if (!normalized) return currentRoleId;

  const columns = await getRoleColumns();
  const labelColumn = columns.includes("group_name")
    ? "group_name"
    : columns.includes("name")
      ? "name"
      : columns.includes("role_name")
        ? "role_name"
        : null;

  if (!labelColumn) {
    return currentRoleId;
  }

  const [rows] = await pool.query(
    `SELECT id, ${labelColumn} AS label
     FROM admin_roles
     ORDER BY id ASC`,
  );

  const matched = rows.find((row) => normalizeString(row.label).toLowerCase() === normalized);
  return matched?.id || currentRoleId;
};

const buildPhotoUrl = (value) => {
  const normalized = normalizePhotoPath(value);
  return normalized || null;
};

const readCurrentAdmin = async (adminId) => {
  const [rows] = await pool.query(
    `SELECT
       a.id,
       COALESCE(a.full_name, a.name, '') AS full_name,
       a.name,
       a.email,
       a.phone,
       a.address,
       a.country,
       a.profile_photo_path,
       a.password,
       a.role_id,
       COALESCE(a.account_type, r.group_name, 'Staff') AS account_type,
       a.status,
       COALESCE(r.group_name, 'Staff') AS role
     FROM admins a
     LEFT JOIN admin_roles r ON r.id = a.role_id
     WHERE a.id = ?
     LIMIT 1`,
    [adminId],
  );

  return rows[0] || null;
};

const buildResponse = (admin) => ({
  id: admin.id,
  full_name: admin.full_name || admin.name || "",
  name: admin.full_name || admin.name || "",
  email: admin.email || "",
  phone: admin.phone || "",
  address: admin.address || "",
  country: admin.country || "",
  profile_photo_path: buildPhotoUrl(admin.profile_photo_path),
  image_full_url: buildPhotoUrl(admin.profile_photo_path),
  role_id: admin.role_id || null,
  accountType: admin.account_type || admin.role || "Staff",
  role: admin.role || admin.account_type || "Staff",
  status: Number(admin.status) === 0 ? 0 : 1,
});

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) {
      return unauthorizedResponse();
    }

    await ensureAdminUsersSchema(pool);
    const admin = await readCurrentAdmin(authUser.id);

    if (!admin || Number(admin.status) === 0) {
      return unauthorizedResponse();
    }

    return Response.json({
      success: true,
      admin: buildResponse(admin),
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}

export async function PATCH(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) {
      return unauthorizedResponse();
    }

    await ensureAdminUsersSchema(pool);
    const current = await readCurrentAdmin(authUser.id);

    if (!current || Number(current.status) === 0) {
      return unauthorizedResponse();
    }

    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded");
    const payload = isFormData ? await req.formData() : await req.json();
    const getValue = (key) => (typeof payload?.get === "function" ? payload.get(key) : payload?.[key]);
    const action = normalizeString(getValue("action") || "profile").toLowerCase();

    if (action === "password") {
      const currentPassword = normalizeString(getValue("current_password") || getValue("currentPassword"));
      const newPassword = normalizeString(getValue("new_password") || getValue("newPassword"));
      const confirmPassword = normalizeString(getValue("confirm_password") || getValue("renewPassword") || getValue("confirmPassword"));

      if (!currentPassword || !newPassword || !confirmPassword) {
        return Response.json(
          { success: false, message: "Current password, new password and confirmation are required." },
          { status: 400 },
        );
      }

      if (newPassword !== confirmPassword) {
        return Response.json({ success: false, message: "Passwords do not match." }, { status: 400 });
      }

      const hashedPassword = current.password?.startsWith("$2y$")
        ? `$2b$${current.password.slice(4)}`
        : current.password;

      const isMatch = await bcrypt.compare(currentPassword, hashedPassword || "");
      if (!isMatch) {
        return Response.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE admins SET password = ?, updated_at = NOW() WHERE id = ?", [newHash, authUser.id]);

      return Response.json({
        success: true,
        message: "Password changed successfully.",
      });
    }

    const fullName = normalizeString(getValue("full_name") || getValue("fullName"));
    const email = normalizeString(getValue("email"));
    const phone = normalizeString(getValue("phone"));
    const address = normalizeString(getValue("address"));
    const country = normalizeString(getValue("country"));
    const accountType = normalizeString(getValue("account_type") || getValue("accountType"));
    const profilePhotoPath = getValue("profile_photo_path") || getValue("profilePhotoPath");
    const profilePhotoFile = getValue("profile_photo") || getValue("profilePhoto");

    if (!fullName || !email || !phone) {
      return Response.json(
        { success: false, message: "Full name, email and phone are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();
    const [duplicateRows] = await pool.query(
      "SELECT id FROM admins WHERE email = ? AND id <> ? LIMIT 1",
      [normalizedEmail, authUser.id],
    );

    if (duplicateRows.length > 0) {
      return Response.json({ success: false, message: "Email is already in use by another admin." }, { status: 409 });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    let nextProfilePhotoPath = normalizePhotoPath(profilePhotoPath) || current.profile_photo_path || null;
    if (profilePhotoFile && typeof profilePhotoFile === "object" && profilePhotoFile.size > 0) {
      const extension = path.extname(profilePhotoFile.name || "");
      const fileName = `${randomUUID()}${extension}`;
      const buffer = Buffer.from(await profilePhotoFile.arrayBuffer());
      await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);
      nextProfilePhotoPath = `/uploads/admin-profiles/${fileName}`;
    }

    const nextRoleId = await resolveRoleId(accountType, current.role_id);

    await pool.query(
      `UPDATE admins
       SET full_name = ?, name = ?, email = ?, phone = ?, address = ?, country = ?, profile_photo_path = ?, role_id = ?, account_type = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        fullName,
        fullName,
        normalizedEmail,
        phone,
        address || null,
        country || null,
        nextProfilePhotoPath,
        nextRoleId,
        accountType || current.account_type || current.role || "Staff",
        authUser.id,
      ],
    );

    const updated = await readCurrentAdmin(authUser.id);

    return Response.json({
      success: true,
      message: "Profile updated successfully.",
      admin: buildResponse(updated),
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}
