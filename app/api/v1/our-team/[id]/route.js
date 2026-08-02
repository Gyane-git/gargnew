import { NextResponse } from "next/server";
import { deleteTeamMember, fetchTeamMemberById, saveTeamMember } from "@/utils/ourTeam";

/**
 * @swagger
 * /api/v1/our-team/{id}:
 *   get:
 *     summary: Get a team member by id
 *     description: No API-layer auth enforced.
 *     tags: [Our Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team member fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 member:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     team_name: { type: string }
 *                     team_role: { type: string }
 *                     team_image: { type: string, nullable: true }
 *                     team_image_full_url: { type: string }
 *                     team_linkedin: { type: string, nullable: true }
 *                     team_email: { type: string, nullable: true }
 *                     status: { type: integer }
 *                     is_active: { type: boolean }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *       404:
 *         description: Team member not found.
 *       500:
 *         description: Internal server error.
 */
export async function GET(_request, context) {
  try {
    const { id } = await context.params;
    const member = await fetchTeamMemberById(id);

    if (!member) {
      return NextResponse.json({ success: false, message: "Team member not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      member,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/our-team/{id}:
 *   patch:
 *     summary: Update a team member
 *     description: >
 *       No API-layer auth enforced. Accepts multipart/form-data. Omitted
 *       fields fall back to the member's existing values. Uploading a new
 *       `image` file replaces the stored image (saved under
 *       /public/backend/our-team); team_name and team_role remain required
 *       overall (existing values are used if not resent).
 *     tags: [Our Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               team_name: { type: string }
 *               team_role: { type: string }
 *               team_linkedin: { type: string }
 *               team_email: { type: string }
 *               status: { type: string, description: "Accepts 1/0, active/inactive, yes/no, true/false." }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Team member updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Team member updated successfully." }
 *       400:
 *         description: Missing columns / save failure.
 *       422:
 *         description: Team name and role are required.
 *       500:
 *         description: Internal server error.
 */
export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("image");

    const body = {
      team_name: formData.get("team_name"),
      team_role: formData.get("team_role"),
      team_linkedin: formData.get("team_linkedin"),
      team_email: formData.get("team_email"),
      status: formData.get("status"),
    };

    const result = await saveTeamMember({ id, body, file });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/v1/our-team/{id}:
 *   delete:
 *     summary: Delete a team member
 *     description: No API-layer auth enforced.
 *     tags: [Our Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team member deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Team member deleted successfully." }
 *       404:
 *         description: Team member not found.
 *       500:
 *         description: Internal server error.
 */
export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const result = await deleteTeamMember(id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Team member not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Team member deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
