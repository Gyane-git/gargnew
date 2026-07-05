import pool from "@/utils/db";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const code = String(body.user_verification_code || "").trim();

    if (!email || !code) {
      return Response.json(
        { success: false, errors: [{ message: "Email and verification code are required." }] },
        { status: 400 },
      );
    }

    const [users] = await pool.execute("SELECT id, is_email_verified FROM users WHERE email = ? LIMIT 1", [email]);
    if (users.length === 0) {
      return Response.json({ success: false, errors: [{ message: "Account not found." }] }, { status: 404 });
    }

    if (Number(users[0].is_email_verified) === 1) {
      return Response.json({ success: true, message: "Account already verified." });
    }

    const [tokens] = await pool.execute(
      "SELECT id FROM email_verifications WHERE email = ? AND token = ? LIMIT 1",
      [email, code],
    );

    if (tokens.length === 0) {
      return Response.json({ success: false, errors: [{ message: "Invalid verification code." }] }, { status: 422 });
    }

    await pool.execute(
      "UPDATE users SET is_email_verified = 1, email_verified_at = NOW(), status = 1, updated_at = NOW() WHERE email = ?",
      [email],
    );
    await pool.execute("DELETE FROM email_verifications WHERE email = ?", [email]);

    return Response.json({
      success: true,
      message: "Account verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY ACCOUNT ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Internal server error. Please try again." }] }, { status: 500 });
  }
}
