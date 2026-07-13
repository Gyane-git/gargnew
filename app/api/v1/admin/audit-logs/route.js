import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { fetchAuditLogs, recordAuditLog } from "@/utils/auditLogs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 500) || 500, 2000);
    const offset = Math.max(Number(searchParams.get("offset") || 0) || 0, 0);
    const includeMeta = searchParams.get("includeMeta") === "1";

    const filters = {
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
      role: searchParams.get("role") || "",
      admin: searchParams.get("admin") || "",
      module: searchParams.get("module") || "",
      model: searchParams.get("model") || "",
      action: searchParams.get("action") || "",
      search: searchParams.get("search") || "",
    };

    const result = await fetchAuditLogs(pool, { limit, offset, filters, includeMeta });

    return NextResponse.json({
      success: true,
      logs: result.logs || [],
      count: result.count || 0,
      meta: result.meta || null,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await recordAuditLog(pool, body);

    return NextResponse.json(
      {
        success: true,
        message: "Audit log saved successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 },
    );
  }
}
