import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { fetchAddressesForCustomer } from "@/utils/address";

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, profile_photo_path, status, is_email_verified, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [authUser.id],
    );

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Customer not found." }, { status: 404 });
    }

    const user = rows[0];
    const addresses = await fetchAddressesForCustomer(authUser.id);

    return Response.json({
      success: true,
      data: {
        ...user,
        image_full_url: user.profile_photo_path || null,
      },
      addresses,
    });
  } catch (error) {
    console.error("CUSTOMER INFO ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
