import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { ensureAddressDefaults, fetchAddressesForCustomer, normalizeFlag } from "@/utils/address";

const cleanValue = (value) => (value === undefined || value === null ? "" : String(value).trim());

/**
 * @swagger
 * /api/v1/customer/address/add:
 *   post:
 *     summary: Add a new address to the authenticated customer's address book
 *     description: >
 *       province_id/city_id/zone_id may also be sent as bare `province`/`city`/`zone`
 *       (province_id ?? province, etc. - province_id wins if both are present). city must
 *       belong to province, and zone must belong to city, or a 422/404 is returned.
 *       Response status is 201 to match the legacy Laravel AddressController::add_address
 *       behaviour, even though this creates a resource (kept for parity with the mobile app).
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, phone, address]
 *             properties:
 *               full_name: { type: string }
 *               phone: { type: string }
 *               province_id: { type: integer, description: "Province id (fallback: province)" }
 *               province: { type: integer, description: "Used if province_id is absent" }
 *               city_id: { type: integer, description: "id of a set_shipping row (fallback: city)" }
 *               city: { type: integer, description: "Used if city_id is absent" }
 *               zone_id: { type: integer, description: "id of an address_zone row (fallback: zone)" }
 *               zone: { type: integer, description: "Used if zone_id is absent" }
 *               address: { type: string }
 *               address_type: { type: string, description: "Defaults to \"H\"" }
 *               landmark: { type: string, nullable: true }
 *               default_shipping: { type: string, enum: [Y, N], description: "Defaults to N" }
 *               default_billing: { type: string, enum: [Y, N], description: "Defaults to N" }
 *     responses:
 *       201:
 *         description: Address added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Address added successfully." }
 *                 data: { type: object, description: "The newly created address (same shape as an item in addresses)" }
 *                 addresses: { type: array, items: { type: object }, description: "All addresses for this customer" }
 *       401: { description: Unauthorized. }
 *       404: { description: Province, city, or zone not found. }
 *       422: { description: "Missing required fields, or city/zone does not belong to the selected province/city." }
 *       500: { description: Internal server error. }
 */
export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const body = await req.json();
    const fullName = cleanValue(body.full_name);
    const phone = cleanValue(body.phone);
    const provinceId = Number(body.province_id ?? body.province);
    const cityId = Number(body.city_id ?? body.city);
    const zoneId = Number(body.zone_id ?? body.zone);
    const address = cleanValue(body.address);
    const addressType = cleanValue(body.address_type) || "H";
    const landmark = cleanValue(body.landmark) || null;

    if (!fullName || !phone || !provinceId || !cityId || !zoneId || !address) {
      return Response.json(
        { success: false, message: "All required address fields must be provided." },
        { status: 422 },
      );
    }

    const [provinceRows] = await pool.query("SELECT id FROM provinces WHERE id = ? LIMIT 1", [provinceId]);
    if (provinceRows.length === 0) {
      return Response.json({ success: false, message: "Province not found." }, { status: 404 });
    }

    const [cityRows] = await pool.query(
      "SELECT id, province_id FROM set_shipping WHERE id = ? LIMIT 1",
      [cityId],
    );
    if (cityRows.length === 0) {
      return Response.json({ success: false, message: "City not found." }, { status: 404 });
    }
    if (Number(cityRows[0].province_id) !== provinceId) {
      return Response.json(
        { success: false, message: "City does not belong to the selected province." },
        { status: 422 },
      );
    }

    const [zoneRows] = await pool.query(
      "SELECT id, city_id FROM address_zone WHERE id = ? LIMIT 1",
      [zoneId],
    );
    if (zoneRows.length === 0) {
      return Response.json({ success: false, message: "Zone not found." }, { status: 404 });
    }
    if (Number(zoneRows[0].city_id) !== cityId) {
      return Response.json(
        { success: false, message: "Zone does not belong to the selected city." },
        { status: 422 },
      );
    }

    const defaultFlags = await ensureAddressDefaults(authUser.id, 0, {
      default_shipping: normalizeFlag(body.default_shipping, "N"),
      default_billing: normalizeFlag(body.default_billing, "N"),
    });

    const [insertResult] = await pool.query(
      `INSERT INTO customer_address_book
       (customer_id, full_name, phone, province_id, city_id, zone_id, address, landmark, address_type, default_shipping, default_billing, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        authUser.id,
        fullName,
        phone,
        provinceId,
        cityId,
        zoneId,
        address,
        landmark,
        addressType || "H",
        defaultFlags.default_shipping,
        defaultFlags.default_billing,
      ],
    );

    if (defaultFlags.default_shipping === "Y") {
      await pool.query(
        "UPDATE customer_address_book SET default_shipping = 'N', updated_at = NOW() WHERE customer_id = ? AND id != ?",
        [authUser.id, insertResult.insertId],
      );
      await pool.query(
        "UPDATE customer_address_book SET default_shipping = 'Y', updated_at = NOW() WHERE id = ?",
        [insertResult.insertId],
      );
    }

    if (defaultFlags.default_billing === "Y") {
      await pool.query(
        "UPDATE customer_address_book SET default_billing = 'N', updated_at = NOW() WHERE customer_id = ? AND id != ?",
        [authUser.id, insertResult.insertId],
      );
      await pool.query(
        "UPDATE customer_address_book SET default_billing = 'Y', updated_at = NOW() WHERE id = ?",
        [insertResult.insertId],
      );
    }

    const addresses = await fetchAddressesForCustomer(authUser.id);
    const createdAddress = addresses.find((item) => Number(item.id) === Number(insertResult.insertId)) || null;

    // Status 201 matches Laravel's AddressController::add_address (which returns 201 even
    // though this is a create - kept for parity). Additive only: response body unchanged.
    return Response.json(
      {
        success: true,
        message: "Address added successfully.",
        data: createdAddress,
        addresses,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("ADDRESS ADD ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
