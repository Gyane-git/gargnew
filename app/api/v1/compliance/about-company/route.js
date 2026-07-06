import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT `value` FROM compliances WHERE `key` = ?", ["about_company"]);

    if (!rows.length) {
      return Response.json({
        success: true,
        content: "",
        certifications: [],
      });
    }

    let data;

    try {
      data = JSON.parse(rows[0].value);
    } catch {
      // Existing HTML only
      data = {
        content: rows[0].value,
        certifications: [],
      };
    }

    return Response.json({
      success: true,
      content: data.content || "",
      certifications: data.certifications || [],
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

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content?.trim()) {
      return Response.json(
        {
          success: false,
          message: "Company information is required.",
        },
        { status: 400 },
      );
    }

    const [rows] = await pool.query("SELECT id FROM compliances WHERE `key` = ?", ["about_company"]);

    if (rows.length > 0) {
      await pool.query("UPDATE compliances SET `value` = ?, updated_at = NOW() WHERE `key` = ?", [content, "about_company"]);
    } else {
      await pool.query("INSERT INTO compliances (`key`, `value`, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", ["about_company", content]);
    }

    return Response.json({
      success: true,
      message: "Company information saved successfully.",
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
