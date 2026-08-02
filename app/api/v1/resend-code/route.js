import pool from "@/utils/db";
import { sendVerificationCodeEmail } from "@/utils/mailer";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const makeVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * @swagger
 * /api/v1/resend-code:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification code
 *     description: Regenerates a 6-digit verification code, replaces any existing `email_verifications` row, and emails it. Returns success without a new code if the account is already verified.
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
 *         description: >
 *           Either the account is already verified (no `code` field returned), or a new
 *           verification code was generated and emailed (response includes `code`).
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
 *                   example: Verification code resent successfully.
 *                 code:
 *                   type: string
 *                   description: Only present when a new code was generated (not returned on the already-verified branch).
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
 *         description: Verification code could not be emailed, or an internal/database error occurred.
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
 *                         example: Verification code could not be sent. Please try again.
 */
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
