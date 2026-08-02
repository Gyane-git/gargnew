import { NextResponse } from "next/server";
import { fetchTeamMembers } from "@/utils/ourTeam";

/**
 * @swagger
 * /api/v1/our-team/active:
 *   get:
 *     summary: List active team members
 *     description: No API-layer auth enforced. Equivalent to GET /api/v1/our-team?active=1.
 *     tags: [Our Team]
 *     responses:
 *       200:
 *         description: Active team members fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       team_name: { type: string }
 *                       team_role: { type: string }
 *                       team_image: { type: string, nullable: true }
 *                       team_image_full_url: { type: string }
 *                       team_linkedin: { type: string, nullable: true }
 *                       team_email: { type: string, nullable: true }
 *                       status: { type: integer, example: 1 }
 *                       is_active: { type: boolean, example: true }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500:
 *         description: Internal server error.
 */
export async function GET() {
  try {
    const teams = await fetchTeamMembers({ activeOnly: true });

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
