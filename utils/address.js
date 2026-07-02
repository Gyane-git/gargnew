import pool from "@/utils/db";

const toNumber = (value) => (value === null || value === undefined || value === "" ? null : Number(value));

export const normalizeFlag = (value, fallback = "N") => {
  const flag = String(value ?? fallback).trim().toUpperCase();
  return flag === "Y" ? "Y" : "N";
};

export const formatAddressRow = (row) => ({
  id: row.id,
  customer_id: row.customer_id,
  full_name: row.full_name,
  phone: row.phone,
  address: row.address,
  landmark: row.landmark,
  address_type: row.address_type,
  province_id: toNumber(row.province_id),
  city_id: toNumber(row.city_id),
  zone_id: toNumber(row.zone_id),
  province: row.province_name
    ? {
        id: toNumber(row.province_id),
        province_name: row.province_name,
      }
    : null,
  city: row.city_name
    ? {
        id: toNumber(row.city_id),
        province_id: toNumber(row.city_province_id),
        city: row.city_name,
        shipping_cost: row.shipping_cost,
        remarks: row.city_remarks ?? null,
        status: row.city_status ?? null,
        created_at: row.city_created_at ?? null,
        updated_at: row.city_updated_at ?? null,
      }
    : null,
  zone: row.zone_name
    ? {
        id: toNumber(row.zone_id),
        city_id: toNumber(row.zone_city_id),
        zone_name: row.zone_name,
      }
    : null,
  default_shipping: row.default_shipping ?? null,
  default_billing: row.default_billing ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const fetchAddressesForCustomer = async (customerId) => {
  const [rows] = await pool.query(
    `SELECT
      a.*,
      p.province_name,
      s.city AS city_name,
      s.province_id AS city_province_id,
      s.shipping_cost,
      s.remarks AS city_remarks,
      s.apply_shipping AS city_status,
      s.created_at AS city_created_at,
      s.updated_at AS city_updated_at,
      z.zone_name,
      z.city_id AS zone_city_id
     FROM customer_address_book a
     LEFT JOIN provinces p ON p.id = a.province_id
     LEFT JOIN set_shipping s ON s.id = a.city_id
     LEFT JOIN address_zone z ON z.id = a.zone_id
     WHERE a.customer_id = ?
     ORDER BY a.id DESC`,
    [customerId],
  );

  return rows.map(formatAddressRow);
};

export const clearOtherDefaults = async (customerId, addressId, field) => {
  if (field !== "default_shipping" && field !== "default_billing") return;

  await pool.query(
    `UPDATE customer_address_book
     SET ${field} = 'N', updated_at = NOW()
     WHERE customer_id = ? AND id != ?`,
    [customerId, addressId],
  );
};

export const ensureAddressDefaults = async (customerId, addressId, payload) => {
  const defaultShipping = normalizeFlag(payload.default_shipping, "N");
  const defaultBilling = normalizeFlag(payload.default_billing, "N");

  if (defaultShipping === "Y") {
    await clearOtherDefaults(customerId, addressId, "default_shipping");
  }

  if (defaultBilling === "Y") {
    await clearOtherDefaults(customerId, addressId, "default_billing");
  }

  return {
    default_shipping: defaultShipping,
    default_billing: defaultBilling,
  };
};

