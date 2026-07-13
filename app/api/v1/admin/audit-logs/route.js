import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { fetchAuditLogs, recordAuditLog } from "@/utils/auditLogs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 500) || 500, 2000);

    const logs = await fetchAuditLogs(pool, { limit });

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
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

