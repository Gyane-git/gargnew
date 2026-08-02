import { NextResponse } from "next/server";
import { fetchTeamMembers, saveTeamMember } from "@/utils/ourTeam";

/**
 * @swagger
 * /api/v1/our-team:
 *   get:
 *     summary: List team members
 *     description: >
 *       No API-layer auth enforced. Returns all team members ordered by id
 *       descending, or only active ones (status = 1) if `active=1` or
 *       `activeOnly=1` is passed.
 *     tags: [Our Team]
 *     parameters:
 *       - in: query
 *         name: active
 *         required: false
 *         schema: { type: string, enum: ["1"] }
 *         description: Pass "1" to return only active team members.
 *       - in: query
 *         name: activeOnly
 *         required: false
 *         schema: { type: string, enum: ["1"] }
 *         description: Alias for `active=1`.
 *     responses:
 *       200:
 *         description: Team members fetched successfully.
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
 *                       is_active: { type: boolean }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       500:
 *         description: Internal server error.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "1" || searchParams.get("activeOnly") === "1";
    const teams = await fetchTeamMembers({ activeOnly });

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/our-team:
 *   post:
 *     summary: Add a team member
 *     description: >
 *       No API-layer auth enforced. Accepts multipart/form-data. team_name
 *       and team_role are required. The uploaded `image` file (if any) is
 *       saved under /public/backend/our-team.
 *     tags: [Our Team]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [team_name, team_role]
 *             properties:
 *               team_name: { type: string }
 *               team_role: { type: string }
 *               team_linkedin: { type: string }
 *               team_email: { type: string }
 *               status: { type: string, description: "Accepts 1/0, active/inactive, yes/no, true/false." }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Team member added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Team member added successfully." }
 *                 id: { type: integer }
 *       400:
 *         description: Missing columns / save failure (also used for the 422 validation case below).
 *       422:
 *         description: Team name and role are required.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    const body = {
      team_name: formData.get("team_name"),
      team_role: formData.get("team_role"),
      team_linkedin: formData.get("team_linkedin"),
      team_email: formData.get("team_email"),
      status: formData.get("status"),
    };

    const result = await saveTeamMember({ body, file });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Team member added successfully.",
      id: result.id,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
