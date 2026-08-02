import pool from "@/utils/db";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

/**
 * @swagger
 * /api/v1/verify-account:
 *   post:
 *     tags: [Auth]
 *     summary: Verify an account using an emailed verification code
 *     description: Confirms the code stored in `email_verifications` matches, then sets `is_email_verified = 1`, `status = 1`, and stamps `email_verified_at`. Returns success without checking the token if the account is already verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, user_verification_code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               user_verification_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account already verified, or verification succeeded.
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
 *                   example: Account verified successfully.
 *       400:
 *         description: Email or verification code missing from request body.
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
 *                         example: Email and verification code are required.
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
 *         description: Verification code does not match any row in email_verifications for this email.
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
 *                         example: Invalid verification code.
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
