import { NextResponse } from "next/server";
import { deleteTeamMember, fetchTeamMemberById, saveTeamMember } from "@/utils/ourTeam";

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
