import pool from "@/utils/db";
import { sendPasswordResetCodeEmail } from "@/utils/mailer";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const makeResetCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * @swagger
 * /api/v1/auth/forgot-password-code:
 *   post:
 *     tags: [Auth]
 *     summary: Send a password reset code to a registered email
 *     description: Generates a 6-digit reset code, stores it in `password_reset_tokens`, and emails it to the account owner.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset code generated and emailed successfully.
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
 *                   example: Password reset code sent successfully.
 *                 email:
 *                   type: string
 *                 code:
 *                   type: string
 *                   description: The generated 6-digit reset code (returned in the response body).
 *       400:
 *         description: Email missing from request body.
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
 *                         example: Email is required.
 *       404:
 *         description: No account found for the given email.
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
 *                         example: Account not found.
 *       500:
 *         description: Reset code could not be generated or emailed.
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
 *                         example: Password reset code could not be sent. Please try again.
 */
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

    // `email` added for Laravel parity (AuthController::forgot_password_code) - additive
    // only, app/account/forgot-password/page.js reads just success/errors[0].message.
    return Response.json({
      success: true,
      message: "Password reset code sent successfully.",
      email,
      code,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD CODE ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Password reset code could not be sent. Please try again." }] }, { status: 500 });
  }
}
