import { NextResponse } from "next/server";
import { fetchTeamMembers, saveTeamMember } from "@/utils/ourTeam";

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
