import { NextResponse } from "next/server";
import db from "@/utils/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
    }

    // Find user
    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const user = rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
