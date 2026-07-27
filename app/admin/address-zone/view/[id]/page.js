"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, Edit2, House } from "lucide-react";

export default function ViewAddressZonePage() {
  const [zone, setZone] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const zoneId = params?.id;

  useEffect(() => {
    fetchData();
  }, [zoneId]);

  const fetchData = async () => {
    if (!zoneId) return;

    try {
      setLoading(true);

      const [zoneRes, cityRes] = await Promise.all([fetch(`/api/v1/addresses/address-zone/${zoneId}`, { cache: "no-store" }), fetch("/api/v1/addresses/shipping", { cache: "no-store" })]);

      const zoneData = await zoneRes.json();
      const cityData = await cityRes.json();

      let cityMap = new Map();
      if (cityData.success && Array.isArray(cityData.shipping)) {
        cityData.shipping.forEach((item) => {
          if (item?.city) {
            cityMap.set(String(item.id), {
              city: item.city,
              province_name: item.province_name || "",
            });
          }
        });
      }
      setCities(Array.from(cityMap.values()));

      if (zoneData.success && zoneData.zone) {
        const cityInfo = cityMap.get(String(zoneData.zone.city_id));

        setZone({
          id: zoneData.zone.id,
          city: cityInfo?.city || zoneData.zone.city_name || String(zoneData.zone.city_id || "-"),
          province: cityInfo?.province_name || zoneData.zone.province_name || "",
          zone_name: zoneData.zone.zone_name || "-",
          createdAt: formatDate(zoneData.zone.created_at),
          updatedAt: formatDate(zoneData.zone.updated_at),
        });
      } else {
        toast.error(zoneData.message || "Failed to load zone");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load zone");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d
      .toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] px-4 py-6 sm:px-8 sm:py-6 font-sans text-[#3b4256]">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-[28px] font-semibold text-[#232f4b] leading-tight">Address Zone Details</h1>
        <div className="flex items-center gap-1.5 text-[13px] text-[#9aa2b1]">
          <House className="mr-0.5" size={14} />
          <span>Dashboard</span>
          <span className="text-[#c4cad6]">/</span>
          <span className="cursor-pointer hover:text-[#2f55d4]" onClick={() => router.push("/admin/address-zone")}>
            Address Zone
          </span>
          <span className="text-[#c4cad6]">/</span>
          <span className="text-[#9aa2b1]">View</span>
        </div>
      </div>

      {/* Card */}
      <div className="mx-auto max-w-[600px] rounded-[10px] bg-white px-5 py-6 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:px-8 sm:py-8">
        {loading ? (
          <div className="py-10 text-center text-[#9aa2b1]">Loading...</div>
        ) : !zone ? (
          <div className="py-10 text-center text-[#9aa2b1]">Zone not found</div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-center">
              <h2 className="m-0 text-xl font-semibold text-[#232f4b]">Zone Information</h2>
            </div>

            <div className="my-5 border-t border-[#eef0f4]" />

            <dl className="grid grid-cols-1 gap-y-5">
              <div className="grid grid-cols-3 items-start gap-4">
                <dt className="text-[14px] text-[#8992a3]">City</dt>
                <dd className="col-span-2 text-[15px] text-[#3b4256]">
                  {zone.city}
                  {zone.province ? ` - ${zone.province}` : ""}
                </dd>
              </div>

              <div className="grid grid-cols-3 items-start gap-4">
                <dt className="text-[14px] text-[#8992a3]">Local Area</dt>
                <dd className="col-span-2 text-[15px] text-[#3b4256]">{zone.zone_name}</dd>
              </div>

              <div className="grid grid-cols-3 items-start gap-4">
                <dt className="text-[14px] text-[#8992a3]">Created At</dt>
                <dd className="col-span-2 text-[15px] text-[#3b4256]">{zone.createdAt}</dd>
              </div>

              <div className="grid grid-cols-3 items-start gap-4">
                <dt className="text-[14px] text-[#8992a3]">Updated At</dt>
                <dd className="col-span-2 text-[15px] text-[#3b4256]">{zone.updatedAt}</dd>
              </div>
            </dl>

            <div className="mt-8 flex items-center justify-center">
              <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 rounded-md bg-[#6c7480] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#5c636d]">
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[13.5px] text-[#8992a3]">
        Copyright © 2026 <strong>Global Tech Nepal Pvt. Ltd.</strong>
      </div>
    </div>
  );
}
