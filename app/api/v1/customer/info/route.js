import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { fetchAddressesForCustomer } from "@/utils/address";
import { resolveAddressShippingCost } from "@/utils/shipping";

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, profile_photo_path, status, is_email_verified, login_medium, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [authUser.id],
    );

    if (rows.length === 0) {
      return Response.json(
        { success: false, message: "Please login to continue.", errors: [{ message: "Please login to continue." }] },
        { status: 401 },
      );
    }

    const user = rows[0];
    const addresses = await fetchAddressesForCustomer(authUser.id);

    // Laravel's CustomerController::get_info flattens the customer fields at the TOP
    // LEVEL via CustomerResource->additional(), plus a `shipping_cost` field derived from
    // whichever address has default_shipping='Y'. The web app (utils/customerApi.js,
    // utils/apiHelper.js) reads everything nested under `data` instead - so these top-level
    // fields are added alongside `data`, not in place of it, to satisfy both consumers.
    const defaultShippingAddress = addresses.find((address) => address.default_shipping === "Y");
    const shippingCost = defaultShippingAddress ? resolveAddressShippingCost(defaultShippingAddress) : 0;

    return Response.json({
      success: true,
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      login_medium: user.login_medium,
      image_full_url: user.profile_photo_path || null,
      created_at: user.created_at,
      shipping_cost: shippingCost,
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
