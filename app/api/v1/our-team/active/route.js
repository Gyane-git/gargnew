import { NextResponse } from "next/server";
import { fetchTeamMembers } from "@/utils/ourTeam";

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
