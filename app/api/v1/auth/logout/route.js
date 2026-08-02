import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current session
 *     description: >
 *       Clears the `token` cookie by setting it to an empty value with a max age of zero.
 *       No request body or auth token is read.
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully.
 *       500:
 *         description: Logout failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Logout failed. Please try again.
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully." }, { status: 200 });

    // Clear the token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // immediately expire
    });

    return response;
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return NextResponse.json({ success: false, message: "Logout failed. Please try again." }, { status: 500 });
  }
}
