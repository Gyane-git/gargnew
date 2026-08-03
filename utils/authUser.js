import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAMES = {
  customer: "customer_token",
  admin: "admin_token",
};

export const getBearerToken = (req, cookieName = AUTH_COOKIE_NAMES.customer) => {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.get(cookieName)?.value || null;
};

export const getAuthUser = (req, cookieName = AUTH_COOKIE_NAMES.customer) => {
  const token = getBearerToken(req, cookieName);
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
};

export const unauthorizedResponse = () =>
  Response.json(
    {
      success: false,
      message: "Unauthorized.",
      errors: [{ message: "Unauthorized." }],
    },
    { status: 401 },
  );
