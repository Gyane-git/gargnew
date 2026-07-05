import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const [provinces] = await pool.query(
      `SELECT id, province_name
       FROM provinces
       ORDER BY province_name ASC`,
    );

    const [cities] = await pool.query(
      `SELECT id, province_id, city, shipping_cost
       FROM set_shipping
       ORDER BY province_id ASC, city ASC`,
    );

    const [zones] = await pool.query(
      `SELECT id, city_id, zone_name
       FROM address_zone
       ORDER BY city_id ASC, zone_name ASC`,
    );

    const provinceMap = new Map();
    for (const province of provinces) {
      provinceMap.set(Number(province.id), {
        id: Number(province.id),
        name: province.province_name,
        cities: [],
      });
    }

    const cityMap = new Map();
    for (const city of cities) {
      const provinceId = Number(city.province_id);
      const cityId = Number(city.id);
      const province = provinceMap.get(provinceId);
      if (!province) continue;

      const cityEntry = {
        id: cityId,
        province_id: provinceId,
        city: city.city,
        shipping_cost: city.shipping_cost,
        zones: [],
      };

      province.cities.push(cityEntry);
      cityMap.set(cityId, cityEntry);
    }

    for (const zone of zones) {
      const cityEntry = cityMap.get(Number(zone.city_id));
      if (!cityEntry) continue;

      cityEntry.zones.push({
        id: Number(zone.id),
        city_id: Number(zone.city_id),
        zone_name: zone.zone_name,
      });
    }

    return Response.json({
      success: true,
      data: Array.from(provinceMap.values()),
    });
  } catch (error) {
    console.error("ADDRESS DROPDOWNS ERROR:", error);
    return Response.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

