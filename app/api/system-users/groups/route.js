import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { getAuthUser } from "@/utils/authUser";
import { recordAuditLog } from "@/utils/auditLogs";
import { fetchAdminRoles, saveAdminRole } from "@/utils/adminUsers";

export async function GET() {
  try {
    const groups = await fetchAdminRoles(pool);

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await saveAdminRole(pool, { body });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    const authUser = getAuthUser(request);
    await recordAuditLog(pool, {
      admin_name: authUser?.full_name || authUser?.name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Create",
      module: "admin_roles",
      model: "AdminRole",
      record_id: result.id,
      summary: String(body.groupName || body.group_name || body.name || "Role").slice(0, 255),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: body,
    });

    const groups = await fetchAdminRoles(pool);
    const group = groups.find((item) => String(item.id) === String(result.id)) || null;

    return NextResponse.json(
      {
        success: true,
        message: "Group created successfully.",
        group,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

