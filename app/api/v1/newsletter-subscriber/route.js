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
