import pool from "@/utils/db";

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

export async function DELETE(_req, { params }) {
  try {
    await ensureTable();
    const { id } = await params;

    const [existing] = await pool.execute("SELECT id FROM newsletter_subscribers WHERE id = ? LIMIT 1", [id]);
    if (!existing.length) {
      return Response.json({ success: false, message: "Subscriber not found." }, { status: 404 });
    }

    await pool.execute("DELETE FROM newsletter_subscribers WHERE id = ?", [id]);

    return Response.json({
      success: true,
      message: "Subscriber deleted successfully.",
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
