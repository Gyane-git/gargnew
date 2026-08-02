import pool from "@/utils/db";

/**
 * @swagger
 * /api/v1/compliance/about-company:
 *   get:
 *     summary: Get About Company content
 *     description: >
 *       No API-layer auth enforced. Reads the `about_company` row from the
 *       compliances table. Legacy rows stored as plain HTML string are
 *       returned as content with an empty certifications array.
 *     tags: [CMS - Compliance]
 *     responses:
 *       200:
 *         description: About Company content fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 content: { type: string }
 *                 certifications:
 *                   type: array
 *                   items: { type: object }
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /api/v1/compliance/about-company:
 *   post:
 *     summary: Create or update About Company content
 *     description: >
 *       No API-layer auth enforced. Upserts the `about_company` row in the
 *       compliances table (updates if it already exists, inserts otherwise).
 *     tags: [CMS - Compliance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, description: "Company information HTML/text." }
 *     responses:
 *       200:
 *         description: Company information saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Company information saved successfully." }
 *       400:
 *         description: Company information is required.
 *       500:
 *         description: Internal server error.
 */
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
