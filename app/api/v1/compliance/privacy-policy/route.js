import pool from "@/utils/db";

/**
 * @swagger
 * /api/v1/compliance/privacy-policy:
 *   post:
 *     summary: Create or update Privacy Policy content
 *     description: >
 *       No API-layer auth enforced. Upserts the `privacy_policy` row in the
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
 *               content: { type: string, description: "Privacy Policy HTML/text." }
 *     responses:
 *       200:
 *         description: Privacy Policy saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Privacy Policy saved successfully." }
 *       400:
 *         description: Privacy Policy is required.
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
