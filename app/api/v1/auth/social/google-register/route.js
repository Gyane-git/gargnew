import pool from "@/utils/db";
import bcrypt from "bcryptjs";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getGoogleProfile = async (token) => {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || "Invalid Google token.");
  }

  return data;
};

const getUserColumns = async () => {
  const [rows] = await pool.query("SHOW COLUMNS FROM users");
  return new Set(rows.map((row) => row.Field));
};

const pickColumn = (columns, candidates) => candidates.find((column) => columns.has(column)) || null;

const buildJwtToken = async (user) => {
  const jwt = await import("jsonwebtoken");
  return jwt.default.sign(
    {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      is_email_verified: user.is_email_verified,
      login_medium: user.login_medium,
    },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: "7d" },
  );
};

export async function POST(req) {
  try {
    const body = await req.json();
    const token = String(body.token || "").trim();
    const providedUniqueId = String(body.unique_id || "").trim();

    if (!token) {
      return Response.json({ success: false, errors: [{ message: "Google token is required." }] }, { status: 400 });
    }

    const googleUser = await getGoogleProfile(token);
    const email = normalizeEmail(googleUser.email);
    const uniqueId = providedUniqueId || String(googleUser.sub || "").trim();
    const fullName = String(googleUser.name || googleUser.given_name || "Google User").trim();
    const phone = null;
    const picture = String(googleUser.picture || "").trim() || null;

    if (!email) {
      return Response.json({ success: false, errors: [{ message: "Google account email not found." }] }, { status: 422 });
    }

    const columns = await getUserColumns();
    const uniqueIdColumn = pickColumn(columns, ["unique_id", "google_id", "social_id", "provider_id"]);
    const photoColumn = pickColumn(columns, ["profile_photo_path", "photo_path", "avatar", "image"]);
    const emailVerifiedAtColumn = columns.has("email_verified_at");
    const loginMediumColumn = columns.has("login_medium");
    const passwordColumn = columns.has("password");
    const phoneColumn = columns.has("phone");
    const genderColumn = columns.has("gender");
    const statusColumn = columns.has("status");
    const phoneVerifiedColumn = columns.has("is_phone_verified");
    const emailVerifiedColumn = columns.has("is_email_verified");
    const updatedAtColumn = columns.has("updated_at");
    const createdAtColumn = columns.has("created_at");

    const [existingRows] = await pool.query(
      `SELECT * FROM users WHERE email = ? ${uniqueIdColumn ? `OR ${uniqueIdColumn} = ?` : ""} LIMIT 1`,
      uniqueIdColumn ? [email, uniqueId || null] : [email],
    );

    const now = new Date();
    const hashedPassword = await bcrypt.hash(`${token}:${email}:${Date.now()}`, 10);

    let userId;

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      userId = existing.id;

      const setParts = [];
      const values = [];

      setParts.push("full_name = ?");
      values.push(existing.full_name || fullName);

      if (loginMediumColumn) {
        setParts.push("login_medium = ?");
        values.push("google");
      }

      if (statusColumn) {
        setParts.push("status = ?");
        values.push(1);
      }

      if (emailVerifiedColumn) {
        setParts.push("is_email_verified = ?");
        values.push(1);
      }

      if (phoneVerifiedColumn) {
        setParts.push("is_phone_verified = ?");
        values.push(existing.is_phone_verified ?? 0);
      }

      if (uniqueIdColumn && uniqueId) {
        setParts.push(`${uniqueIdColumn} = ?`);
        values.push(uniqueId);
      }

      if (photoColumn && picture) {
        setParts.push(`${photoColumn} = ?`);
        values.push(picture);
      }

      if (emailVerifiedAtColumn) {
        setParts.push("email_verified_at = COALESCE(email_verified_at, NOW())");
      }

      if (updatedAtColumn) {
        setParts.push("updated_at = NOW()");
      }

      await pool.query(
        `UPDATE users SET ${setParts.join(", ")} WHERE id = ?`,
        [...values, userId],
      );
    } else {
      const fields = ["full_name", "email"];
      const values = [fullName, email];

      if (phoneColumn) {
        fields.push("phone");
        values.push(phone);
      }

      if (genderColumn) {
        fields.push("gender");
        values.push(null);
      }

      if (passwordColumn) {
        fields.push("password");
        values.push(hashedPassword);
      }

      if (loginMediumColumn) {
        fields.push("login_medium");
        values.push("google");
      }

      if (statusColumn) {
        fields.push("status");
        values.push(1);
      }

      if (emailVerifiedColumn) {
        fields.push("is_email_verified");
        values.push(1);
      }

      if (phoneVerifiedColumn) {
        fields.push("is_phone_verified");
        values.push(0);
      }

      if (uniqueIdColumn && uniqueId) {
        fields.push(uniqueIdColumn);
        values.push(uniqueId);
      }

      if (photoColumn && picture) {
        fields.push(photoColumn);
        values.push(picture);
      }

      if (createdAtColumn) {
        fields.push("created_at");
        values.push(now);
      }

      if (updatedAtColumn) {
        fields.push("updated_at");
        values.push(now);
      }

      const placeholders = fields.map(() => "?").join(", ");
      const [result] = await pool.query(
        `INSERT INTO users (${fields.join(", ")}) VALUES (${placeholders})`,
        values,
      );
      userId = result.insertId;
    }

    const [userRows] = await pool.query(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    const user = userRows[0];
    const jwtToken = await buildJwtToken(user);

    return Response.json({
      success: true,
      message: existingRows.length > 0 ? "Google login successful." : "Google account created successfully.",
      token: jwtToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || null,
        login_medium: user.login_medium || "google",
        is_email_verified: user.is_email_verified,
      },
    });
  } catch (error) {
    console.error("GOOGLE REGISTER ERROR:", error);
    return Response.json(
      {
        success: false,
        errors: [{ message: error.message || "Google registration failed." }],
      },
      { status: 500 },
    );
  }
}
