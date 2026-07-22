import { NextRequest, NextResponse } from "next/server";
import { canAccessAdminPath, getAdminLandingPath } from "@/utils/adminAccess";

const decodeJwtPayload = (token: string) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return redirectToLogin(req);
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.role || payload?.accountType || "";
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
  matcher: ["/admin/:path*"],
};
