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
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.role || payload?.accountType || payload?.type || "";
  if (!payload?.id || !canAccessAdminPath(pathname, role)) {
    const landingPath = getAdminLandingPath(role);
    return NextResponse.redirect(new URL(landingPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

