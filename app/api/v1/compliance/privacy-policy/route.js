import pool from "@/utils/db";

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content?.trim()) {
      return Response.json(
        {
          success: false,
          message: "Privacy Policy is required.",
        },
        { status: 400 },
      );
    }

    const [rows] = await pool.query("SELECT id FROM compliances WHERE `key` = ?", ["privacy_policy"]);

    if (rows.length > 0) {
      await pool.query("UPDATE compliances SET `value` = ?, updated_at = NOW() WHERE `key` = ?", [content, "privacy_policy"]);
    } else {
      await pool.query("INSERT INTO compliances (`key`, `value`, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", ["privacy_policy", content]);
    }

    return Response.json({
      success: true,
      message: "Privacy Policy saved successfully.",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
