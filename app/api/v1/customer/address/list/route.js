import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { fetchAddressesForCustomer } from "@/utils/address";

/**
 * @swagger
 * /api/v1/customer/address/list:
 *   get:
 *     summary: List all addresses in the authenticated customer's address book
 *     description: >
 *       Returns status 201 (unusual for a GET) to match the legacy Laravel
 *       AddressController::get_addresses response exactly - kept for mobile-app parity.
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Addresses fetched successfully!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Addresses fetched successfully!" }
 *                 addresses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       customer_id: { type: integer }
 *                       full_name: { type: string }
 *                       phone: { type: string }
 *                       address: { type: string }
 *                       landmark: { type: string, nullable: true }
 *                       address_type: { type: string }
 *                       province_id: { type: integer, nullable: true }
 *                       city_id: { type: integer, nullable: true }
 *                       zone_id: { type: integer, nullable: true }
 *                       province: { type: object, nullable: true, properties: { id: { type: integer }, province_name: { type: string } } }
 *                       city: { type: object, nullable: true, properties: { id: { type: integer }, province_id: { type: integer }, city: { type: string }, shipping_cost: { type: number } } }
 *                       zone: { type: object, nullable: true, properties: { id: { type: integer }, city_id: { type: integer }, zone_name: { type: string } } }
 *                       default_shipping: { type: string, enum: [Y, N], nullable: true }
 *                       default_billing: { type: string, enum: [Y, N], nullable: true }
 *                       created_at: { type: string, format: date-time }
 *                       updated_at: { type: string, format: date-time }
 *       401: { description: Unauthorized. }
 *       500: { description: Internal server error. }
 */
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const addresses = await fetchAddressesForCustomer(authUser.id);

    // Status 201 (even for a GET list) and `message` match Laravel's
    // AddressController::get_addresses exactly - an odd but intentional quirk. Additive
    // only: `success`/`addresses` fields the web app reads are unchanged.
    return Response.json(
      {
        success: true,
        message: "Addresses fetched successfully!",
        addresses,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("ADDRESS LIST ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

