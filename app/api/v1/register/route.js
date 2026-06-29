import pool from "@/utils/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, phone, password } = body;

    // Build full_name from first + last
    const full_name = first_name && last_name ? `${first_name.trim()} ${last_name.trim()}` : null;

    // Validate all required fields
    if (!full_name || !email || !password || !phone) {
      return Response.json(
        {
          errors: [
            {
              message: "Missing required fields: first_name, last_name, email, phone, password",
            },
          ],
        },
        { status: 400 },
      );
    }

    // Check for duplicate email or phone
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? OR phone = ?", [email, phone]);

    if (existing.length > 0) {
      return Response.json(
        {
          errors: [
            {
              message: "An account with this email or phone already exists.",
            },
          ],
        },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date();

    // Insert
    const [result] = await pool.execute(
      `INSERT INTO users
         (full_name, email, phone, gender, password, login_medium,
          status, is_email_verified, is_phone_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone, null, hashedPassword, "manual", 1, 0, 0, now, now],
    );

    return Response.json(
      {
        message: "User registered successfully",
        userId: result.insertId,
        email,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return Response.json({ errors: [{ message: "Internal server error. Please try again." }] }, { status: 500 });
  }
}
