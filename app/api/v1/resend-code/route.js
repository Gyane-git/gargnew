import pool from "@/utils/db";
import { sendVerificationCodeEmail } from "@/utils/mailer";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const makeVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);

    if (!email) {
      return Response.json({ success: false, errors: [{ message: "Email is required." }] }, { status: 400 });
    }

    const [users] = await pool.execute("SELECT id, full_name, is_email_verified FROM users WHERE email = ? LIMIT 1", [email]);
    if (users.length === 0) {
      return Response.json({ success: false, errors: [{ message: "Account not found." }] }, { status: 404 });
    }

    if (Number(users[0].is_email_verified) === 1) {
      return Response.json({ success: true, message: "Account already verified." });
    }

    const code = makeVerificationCode();
    await pool.execute("DELETE FROM email_verifications WHERE email = ?", [email]);
    await pool.execute(
      "INSERT INTO email_verifications (email, token, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [email, code],
    );

    try {
      await sendVerificationCodeEmail({
        email,
        code,
        fullName: users[0].full_name,
      });
    } catch (mailError) {
      console.error("RESEND CODE MAIL ERROR:", mailError.message);
      return Response.json(
        { success: false, errors: [{ message: "Verification code could not be sent. Please try again." }] },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: "Verification code resent successfully.",
      code,
    });
  } catch (error) {
    console.error("RESEND CODE ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Internal server error. Please try again." }] }, { status: 500 });
  }
}
