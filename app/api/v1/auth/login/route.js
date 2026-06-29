// import pool from "@/utils/db";
// import bcrypt from "bcryptjs";

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const { email, password } = body;

//     // --- Validation ---
//     if (!email || !password) {
//       return Response.json({ success: false, message: "Email and password are required." }, { status: 400 });
//     }

//     // --- Find user by email ---
//     const [rows] = await pool.execute(
//       `SELECT id, full_name, email, phone, password, status, is_email_verified
//        FROM users WHERE email = ? LIMIT 1`,
//       [email.trim().toLowerCase()],
//     );

//     if (rows.length === 0) {
//       return Response.json({ success: false, message: "Invalid email or password." }, { status: 401 });
//     }

//     const user = rows[0];

//     // --- Check account status ---
//     if (user.status === 0) {
//       return Response.json({ success: false, message: "Your account is inactive. Please contact support." }, { status: 403 });
//     }

//     // --- Compare password ---
//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return Response.json({ success: false, message: "Invalid email or password." }, { status: 401 });
//     }

//     // --- Build token payload ---
//     const tokenPayload = {
//       id: user.id,
//       full_name: user.full_name,
//       email: user.email,
//       phone: user.phone,
//       is_email_verified: user.is_email_verified,
//     };

//     // --- Sign JWT ---
//     const jwt = await import("jsonwebtoken");
//     const token = jwt.default.sign(tokenPayload, process.env.NEXTAUTH_SECRET, {
//       expiresIn: "7d",
//     });

//     return Response.json(
//       {
//         success: true,
//         message: "Login successful.",
//         token,
//         user: tokenPayload,
//       },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error("LOGIN ERROR:", error);
//     return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
//   }
// }

// /api/v1/auth/login/route.js

import pool from "@/utils/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // --- Validation ---
    if (!email || !password) {
      return Response.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    // --- Find user by email ---
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, password, status, is_email_verified
       FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()],
    );

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    const user = rows[0];

    // --- Check account status ---
    if (user.status === 0) {
      return Response.json({ success: false, message: "Your account is inactive. Please contact support." }, { status: 403 });
    }

    // --- Compare password ---
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return Response.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    // --- Build token payload ---
    const tokenPayload = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      is_email_verified: user.is_email_verified,
    };

    // --- Sign JWT ---
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(tokenPayload, process.env.NEXTAUTH_SECRET, {
      expiresIn: "7d",
    });

    return Response.json(
      {
        success: true,
        message: "Login successful.",
        token,
        user: tokenPayload,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return Response.json({ success: false, message: "Internal server error. Please try again." }, { status: 500 });
  }
}
