import pool from "@/utils/db";
import bcrypt from "bcryptjs";

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const comparePassword = async (plainPassword, hashedPassword) => {
  if (!hashedPassword) return false;

  const normalizedHash = hashedPassword.startsWith("$2y$") ? `$2b$${hashedPassword.slice(4)}` : hashedPassword;

  try {
    return await bcrypt.compare(plainPassword, normalizedHash);
  } catch {
    return false;
  }
};

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: >
 *       Validates credentials, checks account status/email-verification (when
 *       REQUIRE_EMAIL_VERIFICATION=true), and returns a signed JWT on success.
 *       Also returns `requires_address` (true when the customer has no rows in
 *       `customer_address_book`) and `user.name` (alias of `full_name`).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful.
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
 *                   example: Login successful.
 *                 requires_address:
 *                   type: boolean
 *                   description: True when the customer has no saved address book entries.
 *                 token:
 *                   type: string
 *                   description: Signed JWT (7d expiry).
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     full_name:
 *                       type: string
 *                     name:
 *                       type: string
 *                       description: Alias of full_name.
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     is_email_verified:
 *                       type: integer
 *       400:
 *         description: Email or password missing from request body.
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
 *                   example: Email and password are required.
 *       401:
 *         description: No user found for the email, or password does not match.
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
 *                   example: Invalid email or password.
 *       403:
 *         description: >
 *           Account is inactive (`status === 0`), or (when
 *           REQUIRE_EMAIL_VERIFICATION=true) the account's email is not yet verified.
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
 *                   example: Please verify your account before login.
 *                 email:
 *                   type: string
 *                   description: Only present on the email-not-verified branch.
 *                 is_email_verified:
 *                   type: integer
 *                   description: Only present on the email-not-verified branch.
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
 *                 message:
 *                   type: string
 *                   example: Internal server error. Please try again.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // --- Validation ---
    if (!email || !password) {
      return Response.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    // --- Find user by email ---
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, password, status, is_email_verified
       FROM users WHERE email = ? LIMIT 1`,
      [normalizeEmail(email)],
    );

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    const user = rows[0];

    // --- Check account status ---
    if (user.status === 0) {
      return Response.json({ success: false, message: "Your account is inactive. Please contact support." }, { status: 403 });
    }

    if (String(process.env.REQUIRE_EMAIL_VERIFICATION || "").toLowerCase() === "true" && Number(user.is_email_verified) !== 1) {
      return Response.json(
        {
          success: false,
          message: "Please verify your account before login.",
          email: user.email,
          is_email_verified: user.is_email_verified,
        },
        { status: 403 },
      );
    }

    // --- Compare password ---
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return Response.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    // --- Build token payload ---
    const tokenPayload = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      is_email_verified: user.is_email_verified,
    };

    // --- Sign JWT ---
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(tokenPayload, process.env.NEXTAUTH_SECRET, {
      expiresIn: "7d",
    });

    // Mirrors Laravel AuthController::login's `requires_address` (customer has no saved
    // address) and `user.name` field - additive only, existing `full_name`/etc. untouched
    // since the web app (app/account/page.js) only reads success/token/message.
    const [addressCountRows] = await pool.execute(
      "SELECT COUNT(*) AS count FROM customer_address_book WHERE customer_id = ?",
      [user.id],
    );
    const requiresAddress = Number(addressCountRows[0]?.count || 0) === 0;

    return Response.json(
      {
        success: true,
        message: "Login successful.",
        requires_address: requiresAddress,
        token,
        user: { ...tokenPayload, name: user.full_name },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
