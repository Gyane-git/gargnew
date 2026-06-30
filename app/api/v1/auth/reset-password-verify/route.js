import pool from "@/utils/db";
import bcrypt from "bcryptjs";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const resetCode = String(body.reset_code || "").trim();
    const newPassword = String(body.new_password || "");
    const confirmPassword = String(body.confirm_new_password || "");

    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return Response.json(
        { success: false, errors: [{ message: "Email, reset code, and new password are required." }] },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return Response.json({ success: false, errors: [{ message: "Password must be at least 6 characters long." }] }, { status: 422 });
    }

    if (newPassword !== confirmPassword) {
      return Response.json({ success: false, errors: [{ message: "Passwords do not match." }] }, { status: 422 });
    }

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (users.length === 0) {
      return Response.json({ success: false, errors: [{ message: "Account not found." }] }, { status: 404 });
    }

    const [tokens] = await pool.execute(
      "SELECT email FROM password_reset_tokens WHERE email = ? AND token = ? LIMIT 1",
      [email, resetCode],
    );

    if (tokens.length === 0) {
      return Response.json({ success: false, errors: [{ message: "Invalid reset code." }] }, { status: 422 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      "UPDATE users SET password = ?, status = 1, updated_at = NOW() WHERE email = ?",
      [hashedPassword, email],
    );
    await pool.execute("DELETE FROM password_reset_tokens WHERE email = ?", [email]);

    return Response.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("RESET PASSWORD VERIFY ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Internal server error. Please try again." }] }, { status: 500 });
  }
}
