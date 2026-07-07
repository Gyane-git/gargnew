import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { fetchComplianceRowByKey, formatComplianceRecord } from "@/utils/compliance";

async function upsertByKey(key, value) {
  const [existing] = await pool.query("SELECT id FROM compliances WHERE `key` = ? LIMIT 1", [key]);
  const payload = typeof value === "string" ? value : JSON.stringify(value);

  if (existing.length) {
    await pool.query("UPDATE compliances SET `value` = ?, updated_at = NOW() WHERE `key` = ?", [payload, key]);
  } else {
    await pool.query("INSERT INTO compliances (`key`, `value`, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", [
      key,
      payload,
    ]);
  }
}

export async function GET(_request, { params }) {
  try {
    const row = await fetchComplianceRowByKey(params.key);

    if (!row) {
      return NextResponse.json({
        success: true,
        compliance: null,
      });
    }

    return NextResponse.json({
      success: true,
      compliance: formatComplianceRecord(row),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();

    if (body.value === undefined || body.value === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Compliance value is required.",
        },
        { status: 400 },
      );
    }

    await upsertByKey(params.key, body.value);

    return NextResponse.json({
      success: true,
      message: "Compliance updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const row = await fetchComplianceRowByKey(params.key);

    if (!row) {
      return NextResponse.json(
        {
          success: true,
          message: "Compliance deleted successfully.",
        },
      );
    }

    await pool.query("DELETE FROM compliances WHERE `key` = ?", [params.key]);

    return NextResponse.json({
      success: true,
      message: "Compliance deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
