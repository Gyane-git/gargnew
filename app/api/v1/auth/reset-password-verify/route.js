import pool from "@/utils/db";
import bcrypt from "bcryptjs";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

/**
 * @swagger
 * /api/v1/auth/reset-password-verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify a password reset code and set a new password
 *     description: Validates the reset code issued by /api/v1/auth/forgot-password-code, then updates the user's password and re-activates the account (`status = 1`).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, reset_code, new_password, confirm_new_password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               reset_code:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 format: password
 *               confirm_new_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully.
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
 *                   example: Password has been reset successfully.
 *       400:
 *         description: One or more required fields missing from request body.
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
 *                         example: Email, reset code, and new password are required.
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
 *       422:
 *         description: New password shorter than 6 characters, passwords do not match, or the reset code is invalid/expired.
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
 *                         example: Invalid reset code.
 *       500:
 *         description: Internal server error.
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
 *                         example: Internal server error. Please try again.
 */
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
