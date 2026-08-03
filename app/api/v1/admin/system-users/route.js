import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { recordAuditLog } from "@/utils/auditLogs";
import { fetchAdminUsers, saveAdminUser } from "@/utils/adminUsers";
import { requireAdminAuth } from "@/utils/adminAuth";

export async function GET(request) {
  try {
    const adminAuth = await requireAdminAuth(request, pool);
    if (adminAuth.error) return adminAuth.error;

    const admins = await fetchAdminUsers(pool);

    return NextResponse.json({
      success: true,
      admins,
      count: admins.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminAuth = await requireAdminAuth(request, pool);
    if (adminAuth.error) return adminAuth.error;

    const body = await request.json();
    const result = await saveAdminUser(pool, { body });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status || 400 });
    }

    const authUser = adminAuth.authUser;
    await recordAuditLog(pool, {
      admin_name: authUser?.full_name || authUser?.name || authUser?.email || "System",
      role: authUser?.role || authUser?.user_role || "System",
      action: "Create",
      module: "admins",
      model: "Admin",
      record_id: result.id,
      summary: String(body.full_name || body.name || body.email || "Admin").slice(0, 255),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      metadata: body,
    });

    return NextResponse.json(
      {
        success: true,
        message: "System user created successfully.",
        userId: result.id,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Internal server error." }, { status: 500 });
  }
}
