import pool from "@/utils/db";
import { sendPasswordResetCodeEmail } from "@/utils/mailer";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const makeResetCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);

    if (!email) {
      return Response.json({ success: false, errors: [{ message: "Email is required." }] }, { status: 400 });
    }

    const [users] = await pool.execute("SELECT id, full_name FROM users WHERE email = ? LIMIT 1", [email]);
    if (users.length === 0) {
      return Response.json({ success: false, errors: [{ message: "Account not found." }] }, { status: 404 });
    }

    const code = makeResetCode();
    await pool.execute("DELETE FROM password_reset_tokens WHERE email = ?", [email]);
    await pool.execute(
      "INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, NOW())",
      [email, code],
    );

    await sendPasswordResetCodeEmail({
      email,
      code,
      fullName: users[0].full_name,
    });

    return Response.json({
      success: true,
      message: "Password reset code sent successfully.",
      code,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD CODE ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Password reset code could not be sent. Please try again." }] }, { status: 500 });
  }
}
