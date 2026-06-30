import pool from "@/utils/db";
import bcrypt from "bcryptjs";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

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
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const currentPassword = String(body.current_password || "");
    const newPassword = String(body.new_password || "");
    const confirmPassword = String(body.new_password_confirmation || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return Response.json(
        { success: false, message: "All password fields are required." },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { success: false, message: "New password must be at least 6 characters long." },
        { status: 422 },
      );
    }

    if (newPassword !== confirmPassword) {
      return Response.json(
        { success: false, message: "New password confirmation does not match." },
        { status: 422 },
      );
    }

    const [rows] = await pool.execute("SELECT id, password FROM users WHERE id = ? LIMIT 1", [authUser.id]);
    if (rows.length === 0) return unauthorizedResponse();

    const passwordMatches = await comparePassword(currentPassword, rows[0].password);
    if (!passwordMatches) {
      return Response.json(
        { success: false, message: "Current password is incorrect." },
        { status: 422 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [
      hashedPassword,
      authUser.id,
    ]);

    return Response.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
