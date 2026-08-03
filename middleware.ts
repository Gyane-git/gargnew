import { NextRequest, NextResponse } from "next/server";
import { canAccessAdminPath, getAdminLandingPath } from "@/utils/adminAccess";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAMES } from "@/utils/authUser";

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

  const customerToken = req.cookies.get(AUTH_COOKIE_NAMES.customer)?.value;
  const adminToken = req.cookies.get(AUTH_COOKIE_NAMES.admin)?.value;

  const customerAuthRoutes = ["/account", "/account/signup"];

  if (customerToken && customerAuthRoutes.includes(pathname)) {
    const payload = await verifyJwt(customerToken);
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

  if (!adminToken) {
    return redirectToLogin(req);
  }

  const payload = await verifyJwt(adminToken);
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
