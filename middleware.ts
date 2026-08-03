import { NextRequest, NextResponse } from "next/server";
import { canAccessAdminPath, getAdminLandingPath } from "@/utils/adminAccess";
import { jwtVerify } from "jose";

const jwtSecret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "");

const verifyJwt = async (token: string) => {
  if (!token || !process.env.NEXTAUTH_SECRET) return null;

  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    return payload;
  } catch {
    return null;
  }
};

const redirectToLogin = (req: NextRequest, clearToken = false) => {
  const loginUrl = new URL("/admin/login", req.url);
  const response = NextResponse.redirect(loginUrl);
  if (clearToken) {
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
  }
  return response;
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;

  const customerAuthRoutes = ["/account", "/account/signup"];

  if (token && customerAuthRoutes.includes(pathname)) {
    const payload = await verifyJwt(token);
    if (payload?.id) {
      return NextResponse.redirect(new URL("/myaccount", req.url));
    }

    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (!token) {
    return redirectToLogin(req);
  }

  const payload = await verifyJwt(token);
  const role = String(payload?.role || payload?.accountType || "").trim();
  const accountType = String(payload?.type || "").toLowerCase();

  if (!payload?.id || accountType !== "admin") {
    return redirectToLogin(req, true);
  }

  if (canAccessAdminPath(pathname, role)) {
    return NextResponse.next();
  }

  const landingPath = getAdminLandingPath(role);

  if (landingPath !== pathname && canAccessAdminPath(landingPath, role)) {
    return NextResponse.redirect(new URL(landingPath, req.url));
  }

  return redirectToLogin(req, true);
}

export const config = {
  matcher: ["/admin/:path*", "/account", "/account/:path*"],
};
