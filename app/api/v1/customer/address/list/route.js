import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { fetchAddressesForCustomer } from "@/utils/address";

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const addresses = await fetchAddressesForCustomer(authUser.id);

    return Response.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("ADDRESS LIST ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

