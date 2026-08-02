import { NextResponse } from "next/server";
import { getAuthUser } from "@/utils/authUser";
import { unauthenticatedResponse } from "@/utils/apiResponse";
import { fetchAddressesForCustomer } from "@/utils/address";

// Mirrors Laravel's Helpers::isInsideValley(): case-insensitive substring match, not exact.
const isInsideValley = (cityName) => {
  if (!cityName) return false;
  const normalized = String(cityName).toLowerCase().trim();
  return normalized.includes("kathmandu") || normalized.includes("lalitpur");
};

/**
 * @swagger
 * /api/v1/customer/check-valley:
 *   post:
 *     summary: Check whether a customer address is inside the Kathmandu/Lalitpur valley
 *     description: Mirrors Laravel OrderController::checkValley (API\V1). Used to decide
 *       free-shipping eligibility. Response intentionally omits a `message` key, matching
 *       Laravel's response()->json(['success'=>true,'inside_valley'=>...]) exactly.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id]
 *             properties:
 *               address_id: { type: integer }
 *     responses:
 *       200: { description: "{success, inside_valley}" }
 *       401: { description: Unauthenticated }
 *       422: { description: Validation error (Laravel default shape, replicated) }
 */
export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthenticatedResponse();

    const body = await req.json().catch(() => ({}));
    const addressId = Number(body?.address_id);

    if (!body?.address_id || !Number.isInteger(addressId)) {
      // Laravel's checkValley calls $request->validate() with no try/catch, so a failure
      // falls through to Laravel's default automatic validation-exception JSON shape.
      return NextResponse.json(
        {
          message: "The address id field is required.",
          errors: { address_id: ["The address id field is required."] },
        },
        { status: 422 },
      );
    }

    const addresses = await fetchAddressesForCustomer(authUser.id);
    const address = addresses.find((item) => Number(item.id) === addressId);

    if (!address) {
      return NextResponse.json(
        {
          message: "The selected address id is invalid.",
          errors: { address_id: ["The selected address id is invalid."] },
        },
        { status: 422 },
      );
    }

    const cityName = address.city?.city ?? null;

    return NextResponse.json({
      success: true,
      inside_valley: isInsideValley(cityName),
    });
  } catch (error) {
    console.error("CHECK VALLEY ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
