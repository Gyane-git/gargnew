import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

const normalizeProfilePhotoPath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^data:/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/public/")) return raw.replace(/^\/public/, "");
  if (raw.startsWith("public/")) return `/${raw.replace(/^public\//, "")}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const phone = String(body.phone || "").trim();
    const profilePhotoPath = normalizeProfilePhotoPath(body.profile_photo_path);

    if (!fullName || !phone) {
      return Response.json(
        { success: false, message: "Full name and phone are required." },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [authUser.id],
    );

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Customer not found." }, { status: 404 });
    }

    await pool.execute(
      `UPDATE users
       SET full_name = ?, phone = ?, profile_photo_path = ?, updated_at = NOW()
       WHERE id = ?`,
      [fullName, phone, profilePhotoPath, authUser.id],
    );

    const [updatedRows] = await pool.execute(
      `SELECT id, full_name, email, phone, profile_photo_path, status, is_email_verified, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [authUser.id],
    );

    const user = updatedRows[0];

    return Response.json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        ...user,
        image_full_url: user.profile_photo_path || null,
      },
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
