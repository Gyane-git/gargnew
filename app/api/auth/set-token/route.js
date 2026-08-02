import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/auth/set-token:
 *   post:
 *     summary: Store an auth token as an httpOnly "token" cookie
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: Token set successfully; "token" cookie is set (httpOnly, 7 day maxAge). }
 *       400: { description: Token missing from request body, or request body was not valid JSON. }
 */
export async function POST(req) {
  try {
    const { token } = await req.json();
    // console.log("Token received in set-token route:", token);

    if (!token) {
      return NextResponse.json({ message: "Token missing" }, { status: 400 });
    }

    const response = NextResponse.json({ message: "Token set successfully" });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
