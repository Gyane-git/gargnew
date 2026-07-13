import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { getAuthUser } from "@/utils/authUser";
import { recordAuditLog } from "@/utils/auditLogs";
import { deleteAdminRole, fetchAdminRoleById, saveAdminRole } from "@/utils/adminUsers";

export async function GET(_request, context) {
  try {
    const { id } = await context.params;
    const group = await fetchAdminRoleById(pool, id);

    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = await saveAdminRole(pool, { id, body });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    const authUser = getAuthUser(request);
    await recordAuditLog(pool, {
      admin_name: authUser?.full_name || authUser?.name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Update",
      module: "admin_roles",
      model: "AdminRole",
      record_id: id,
      summary: String(body.groupName || body.group_name || body.name || `Role #${id}`).slice(0, 255),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: body,
    });

    const group = await fetchAdminRoleById(pool, id);

    return NextResponse.json({
      success: true,
      message: "Group updated successfully.",
      group,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    const deleted = await deleteAdminRole(pool, id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Group not found." }, { status: 404 });
    }

    const authUser = getAuthUser(request);
    await recordAuditLog(pool, {
      admin_name: authUser?.full_name || authUser?.name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Delete",
      module: "admin_roles",
      model: "AdminRole",
      record_id: id,
      summary: `Role #${id} deleted`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: { role_id: id },
    });

    return NextResponse.json({
      success: true,
      message: "Group deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

