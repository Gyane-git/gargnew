import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";
import { ensureAddressDefaults, fetchAddressesForCustomer, normalizeFlag } from "@/utils/address";

const cleanValue = (value) => (value === undefined || value === null ? "" : String(value).trim());

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

    return Response.json({
      success: true,
      message: "Address added successfully.",
      data: createdAddress,
      addresses,
    });
  } catch (error) {
    console.error("ADDRESS ADD ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
