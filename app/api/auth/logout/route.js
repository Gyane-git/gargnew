import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log the current user out by clearing the "token" auth cookie
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out successfully; the "token" cookie is cleared (maxAge 0). }
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Delete the cookie
    path: "/", // Path should match the one used when setting the cookie
  });

  return response;
}
