import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { fetchAddressesForCustomer, normalizeFlag } from "@/utils/address";

const cleanValue = (value) => (value === undefined || value === null ? "" : String(value).trim());

/**
 * @swagger
 * /api/v1/customer/address/update/{id}:
 *   post:
 *     summary: Update an address in the authenticated customer's address book
 *     description: >
 *       Only updates an address that belongs to the authenticated customer. Any field omitted
 *       from the request body falls back to the address's current stored value.
 *       province_id/city_id/zone_id may also be sent as bare `province`/`city`/`zone`
 *       (province_id ?? province ?? existing value, etc. - province_id wins if both are
 *       present). city must belong to province, and zone must belong to city, or a 422/404
 *       is returned.
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               phone: { type: string }
 *               province_id: { type: integer, description: "Province id (fallback: province, then existing value)" }
 *               province: { type: integer, description: "Used if province_id is absent" }
 *               city_id: { type: integer, description: "id of a set_shipping row (fallback: city, then existing value)" }
 *               city: { type: integer, description: "Used if city_id is absent" }
 *               zone_id: { type: integer, description: "id of an address_zone row (fallback: zone, then existing value)" }
 *               zone: { type: integer, description: "Used if zone_id is absent" }
 *               address: { type: string }
 *               address_type: { type: string }
 *               landmark: { type: string, nullable: true }
 *               default_shipping: { type: string, enum: [Y, N] }
 *               default_billing: { type: string, enum: [Y, N] }
 *     responses:
 *       200:
 *         description: Address updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Address updated successfully." }
 *                 data: { type: object, description: "The updated address (same shape as an item in addresses)" }
 *                 addresses: { type: array, items: { type: object }, description: "All addresses for this customer" }
 *       401: { description: Unauthorized. }
 *       404: { description: Address, province, city, or zone not found. }
 *       422: { description: "Missing required fields, or city/zone does not belong to the selected province/city." }
 *       500: { description: Internal server error. }
 */
export async function POST(req, { params }) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const addressId = Number(params.id);
    if (!addressId) {
      return Response.json({ success: false, message: "Address id is required." }, { status: 422 });
    }

    const [existingRows] = await pool.query(
      "SELECT * FROM customer_address_book WHERE id = ? AND customer_id = ? LIMIT 1",
      [addressId, authUser.id],
    );
    if (existingRows.length === 0) {
      return Response.json({ success: false, message: "Address not found." }, { status: 404 });
    }

    const body = await req.json();
    const fullName = cleanValue(body.full_name) || existingRows[0].full_name;
    const phone = cleanValue(body.phone) || existingRows[0].phone;
    const provinceId = Number(body.province_id ?? body.province ?? existingRows[0].province_id);
    const cityId = Number(body.city_id ?? body.city ?? existingRows[0].city_id);
    const zoneId = Number(body.zone_id ?? body.zone ?? existingRows[0].zone_id);
    const address = cleanValue(body.address) || existingRows[0].address;
    const addressType = cleanValue(body.address_type) || existingRows[0].address_type || "H";
    const landmark =
      body.landmark === undefined
        ? existingRows[0].landmark
        : cleanValue(body.landmark) || null;

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

    const defaultShipping = normalizeFlag(
      body.default_shipping === undefined ? existingRows[0].default_shipping : body.default_shipping,
      "N",
    );
    const defaultBilling = normalizeFlag(
      body.default_billing === undefined ? existingRows[0].default_billing : body.default_billing,
      "N",
    );

    await pool.query(
      `UPDATE customer_address_book
       SET full_name = ?, phone = ?, province_id = ?, city_id = ?, zone_id = ?, address = ?, landmark = ?, address_type = ?, default_shipping = ?, default_billing = ?, updated_at = NOW()
       WHERE id = ? AND customer_id = ?`,
      [
        fullName,
        phone,
        provinceId,
        cityId,
        zoneId,
        address,
        landmark,
        addressType,
        defaultShipping,
        defaultBilling,
        addressId,
        authUser.id,
      ],
    );

    if (defaultShipping === "Y") {
      await pool.query(
        "UPDATE customer_address_book SET default_shipping = 'N', updated_at = NOW() WHERE customer_id = ? AND id != ?",
        [authUser.id, addressId],
      );
      await pool.query(
        "UPDATE customer_address_book SET default_shipping = 'Y', updated_at = NOW() WHERE id = ?",
        [addressId],
      );
    }

    if (defaultBilling === "Y") {
      await pool.query(
        "UPDATE customer_address_book SET default_billing = 'N', updated_at = NOW() WHERE customer_id = ? AND id != ?",
        [authUser.id, addressId],
      );
      await pool.query(
        "UPDATE customer_address_book SET default_billing = 'Y', updated_at = NOW() WHERE id = ?",
        [addressId],
      );
    }

    const addresses = await fetchAddressesForCustomer(authUser.id);
    const updatedAddress = addresses.find((item) => Number(item.id) === addressId) || null;

    return Response.json({
      success: true,
      message: "Address updated successfully.",
      data: updatedAddress,
      addresses,
    });
  } catch (error) {
    console.error("ADDRESS UPDATE ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
