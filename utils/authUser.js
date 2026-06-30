import jwt from "jsonwebtoken";

export const getBearerToken = (req) => {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.get("token")?.value || null;
};

export const getAuthUser = (req) => {
  const token = getBearerToken(req);
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
