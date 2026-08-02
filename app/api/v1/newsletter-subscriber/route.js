import pool from "@/utils/db";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const ensureTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY newsletter_subscribers_email_unique (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

/**
 * @swagger
 * /api/v1/newsletter-subscriber:
 *   get:
 *     summary: List all newsletter subscribers
 *     description: Lazily creates the `newsletter_subscribers` table on first call, then
 *       returns every row (all statuses), newest first.
 *     tags: [Newsletter]
 *     responses:
 *       200: { description: '{ success: true, newsletter_subscribers } - array of { id, email, status, created_at, updated_at }.' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function GET() {
  try {
    await ensureTable();

    const [rows] = await pool.execute(
      `SELECT id, email, status, created_at, updated_at
       FROM newsletter_subscribers
       ORDER BY id DESC`,
    );

    return Response.json({
      success: true,
      newsletter_subscribers: rows,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/v1/newsletter-subscriber:
 *   post:
 *     summary: Subscribe an email to the newsletter
 *     description: Email is normalized (trimmed + lowercased). If the email already exists,
 *       its status is reset to 1 (active) and updated_at is bumped, returning 200 with
 *       "Subscriber already exists." rather than an error. Otherwise a new row is inserted
 *       with status 1.
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: '{ success: true, message: "Subscriber already exists." } - returned when the email is already in the table (status is reactivated).' }
 *       201: { description: '{ success: true, message: "Subscribed successfully." } - returned when a new subscriber row is created.' }
 *       400: { description: '{ success: false, message: "Email is required." }' }
 *       500: { description: '{ success: false, message } returned on an unexpected error.' }
 */
export async function POST(req) {
  try {
    await ensureTable();

    const body = await req.json();
    const email = normalizeEmail(body.email);

    if (!email) {
      return Response.json({ success: false, message: "Email is required." }, { status: 400 });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM newsletter_subscribers WHERE email = ? LIMIT 1",
      [email],
    );

    if (existing.length > 0) {
      await pool.execute(
        "UPDATE newsletter_subscribers SET status = 1, updated_at = NOW() WHERE email = ?",
        [email],
      );

      return Response.json({
        success: true,
        message: "Subscriber already exists.",
      });
    }

    await pool.execute(
      "INSERT INTO newsletter_subscribers (email, status, created_at, updated_at) VALUES (?, 1, NOW(), NOW())",
      [email],
    );

    return Response.json({
      success: true,
      message: "Subscribed successfully.",
    }, { status: 201 });
  } catch (error) {
    console.error("NEWSLETTER SUBSCRIBER ERROR:", error);
    return Response.json(
      { success: false, message: error.message || "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
