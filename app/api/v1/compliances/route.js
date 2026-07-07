import pool from "@/utils/db";
import { NextResponse } from "next/server";
import { fetchAllComplianceRows, fetchComplianceRowByKey, formatComplianceRecord } from "@/utils/compliance";

async function upsertCompliance({ key, value }) {
  const existing = await fetchComplianceRowByKey(key);
  const payload = typeof value === "string" ? value : JSON.stringify(value);

  if (existing?.id) {
    await pool.query("UPDATE compliances SET `value` = ?, updated_at = NOW() WHERE `key` = ?", [payload, key]);
  } else {
    await pool.query("INSERT INTO compliances (`key`, `value`, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", [
      key,
      payload,
    ]);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const row = await fetchComplianceRowByKey(key);
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
    }

    const rows = await fetchAllComplianceRows();

    return NextResponse.json({
      success: true,
      compliances: rows.map(formatComplianceRecord),
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

export async function POST(request) {
  try {
    const body = await request.json();
    const key = String(body.key || "").trim();

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: "Compliance key is required.",
        },
        { status: 400 },
      );
    }

    if (body.value === undefined || body.value === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Compliance value is required.",
        },
        { status: 400 },
      );
    }

    await upsertCompliance({ key, value: body.value });

    return NextResponse.json({
      success: true,
      message: "Compliance saved successfully.",
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
