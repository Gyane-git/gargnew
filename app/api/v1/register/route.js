import pool from "@/utils/db";
import bcrypt from "bcryptjs";
import { sendVerificationCodeEmail } from "@/utils/mailer";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const makeVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer account
 *     description: >
 *       Creates a user (login_medium "manual", status active, is_email_verified 0), generates a
 *       6-digit email verification code stored in `email_verifications`, and emails it via
 *       sendVerificationCodeEmail. Validation and duplicate-account errors return HTTP 403 with a
 *       `{ success: false, message: "Validation errors", errors: [{ code, message }] }` shape.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name, email, phone, password]
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully and verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 userId:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 code:
 *                   type: string
 *                   description: The generated 6-digit email verification code.
 *       403:
 *         description: Missing required fields, or an account with this email/phone already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation errors
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: required
 *                         description: "\"required\" for missing fields, \"email\" for duplicate email/phone."
 *                       message:
 *                         type: string
 *       500:
 *         description: >
 *           Either the user row was created but the verification email failed to send
 *           (response includes `email`), or an unexpected internal/database error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         example: Account created, but verification email could not be sent. Please resend code.
 *                 email:
 *                   type: string
 *                   description: Only present on the mail-send-failure branch.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, phone, password } = body;
    const normalizedEmail = normalizeEmail(email);

    // Build full_name from first + last
    const full_name = first_name && last_name ? `${first_name.trim()} ${last_name.trim()}` : null;

    // Validate all required fields. Status aligned to Laravel's 403 (RegistrationController's
    // validation-failure convention) - safe additive change since app/account/signup/page.js
    // only checks response.ok truthiness, not the exact status code.
    if (!full_name || !normalizedEmail || !password || !phone) {
      return Response.json(
        {
          success: false,
          message: "Validation errors",
          errors: [
            {
              code: "required",
              message: "Missing required fields: first_name, last_name, email, phone, password",
            },
          ],
        },
        { status: 403 },
      );
    }

    // Check for duplicate email or phone
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? OR phone = ?", [normalizedEmail, phone]);

    if (existing.length > 0) {
      return Response.json(
        {
          success: false,
          message: "Validation errors",
          errors: [
            {
              code: "email",
              message: "An account with this email or phone already exists.",
            },
          ],
        },
        { status: 403 },
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
