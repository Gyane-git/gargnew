import pool from "@/utils/db";
import bcrypt from "bcryptjs";
import { sendVerificationCodeEmail } from "@/utils/mailer";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const makeVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function POST(req) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, phone, password } = body;
    const normalizedEmail = normalizeEmail(email);

    // Build full_name from first + last
    const full_name = first_name && last_name ? `${first_name.trim()} ${last_name.trim()}` : null;

    // Validate all required fields
    if (!full_name || !normalizedEmail || !password || !phone) {
      return Response.json(
        {
          success: false,
          errors: [
            {
              message: "Missing required fields: first_name, last_name, email, phone, password",
            },
          ],
        },
        { status: 400 },
      );
    }

    // Check for duplicate email or phone
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? OR phone = ?", [normalizedEmail, phone]);

    if (existing.length > 0) {
      return Response.json(
        {
          success: false,
          errors: [
            {
              message: "An account with this email or phone already exists.",
            },
          ],
        },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date();

    // Insert
    const [result] = await pool.execute(
      `INSERT INTO users
         (full_name, email, phone, gender, password, login_medium,
          status, is_email_verified, is_phone_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, normalizedEmail, phone, null, hashedPassword, "manual", 1, 0, 0, now, now],
    );

    const verificationCode = makeVerificationCode();
    await pool.execute("DELETE FROM email_verifications WHERE email = ?", [normalizedEmail]);
    await pool.execute(
      "INSERT INTO email_verifications (email, token, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [normalizedEmail, verificationCode, now, now],
    );

    try {
      await sendVerificationCodeEmail({
        email: normalizedEmail,
        code: verificationCode,
        fullName: full_name,
      });
    } catch (mailError) {
      console.error("REGISTER MAIL ERROR:", mailError.message);
      return Response.json(
        {
          success: false,
          errors: [{ message: "Account created, but verification email could not be sent. Please resend code." }],
          email: normalizedEmail,
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        message: "User registered successfully",
        userId: result.insertId,
        email: normalizedEmail,
        code: verificationCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Internal server error. Please try again." }] }, { status: 500 });
  }
}
