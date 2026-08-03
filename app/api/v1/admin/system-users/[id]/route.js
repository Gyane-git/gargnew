import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { recordAuditLog } from "@/utils/auditLogs";
import { deleteAdminUser, fetchAdminUserById, saveAdminUser } from "@/utils/adminUsers";
import { requireAdminAuth } from "@/utils/adminAuth";

export async function GET(_request, context) {
  try {
    const adminAuth = await requireAdminAuth(_request, pool);
    if (adminAuth.error) return adminAuth.error;

    const { id } = await context.params;
    const user = await fetchAdminUserById(pool, id);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const adminAuth = await requireAdminAuth(request, pool);
    if (adminAuth.error) return adminAuth.error;

    const { id } = await context.params;
    const body = await request.json();
    const result = await saveAdminUser(pool, { id, body });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    const authUser = adminAuth.authUser;
    await recordAuditLog(pool, {
      admin_name: authUser?.full_name || authUser?.name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Update",
      module: "admins",
      model: "Admin",
      record_id: id,
      summary: String(body.full_name || body.name || body.email || `Admin #${id}`).slice(0, 255),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: body,
    });

    return NextResponse.json({
      success: true,
      message: "System user updated successfully.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const adminAuth = await requireAdminAuth(request, pool);
    if (adminAuth.error) return adminAuth.error;

    const { id } = await context.params;
    const deleted = await deleteAdminUser(pool, id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const authUser = adminAuth.authUser;
    await recordAuditLog(pool, {
      admin_name: authUser?.full_name || authUser?.name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Delete",
      module: "admins",
      model: "Admin",
      record_id: id,
      summary: `Admin #${id} deleted`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: { user_id: id },
    });

    return NextResponse.json({
      success: true,
      message: "System user deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
