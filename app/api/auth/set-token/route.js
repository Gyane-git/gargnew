import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const tokenSecret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "");

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ message: "Token missing" }, { status: 400 });
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ message: "Server secret is not configured." }, { status: 500 });
    }

    try {
      await jwtVerify(token, tokenSecret);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
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
