import { NextResponse } from "next/server";
import pool from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM system_settings");
    
    // Transform rows into an object key-value pair
    const settingsObj = {};
    rows.forEach(row => {
      // For images, the frontend expects specific keys like header_logo_full_url
      if (row.key === 'company_logo_header') {
        settingsObj[row.key] = { header_logo_full_url: '/assets/logo.png' };
      } else if (row.key === 'company_logo_footer') {
        settingsObj[row.key] = { footer_logo_full_url: '/assets/logo.png' };
      } else {
        settingsObj[row.key] = { value: row.value };
      }
    });

    return NextResponse.json({
      success: true,
      settings: settingsObj,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
