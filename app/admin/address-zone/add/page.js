"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AddShippingCostPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const router = useRouter();
  const [form, setForm] = useState({
    city_id: "",
    zone_name: "",
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/addresses/shipping", {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        const uniqueCities = Array.isArray(data.shipping)
          ? Array.from(
              new Map(
                data.shipping
                  .filter((item) => item?.city)
                  .map((item) => [
                    String(item.id),
                    {
                      id: item.id,
                      city: item.city,
                      province_name: item.province_name || "",
                    },
                  ]),
              ).values(),
            )
          : [];

        setCities(uniqueCities);
      } else {
        toast.error(data.message || "Failed to load cities");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.city_id || !form.zone_name.trim()) {
      setMessageType("error");
      setMessage("City and zone name are required.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/v1/addresses/address-zone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city_id: Number(form.city_id),
          zone_name: form.zone_name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save zone.");
      }

      setMessageType("success");
      setMessage(data.message || "Zone created successfully.");
      setForm({ city_id: "", zone_name: "" });
      toast.success(data.message || "Zone created successfully.");
      setTimeout(() => {
        router.push("/admin/address-zone");
        router.refresh();
      }, 500);
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Failed to save zone.");
      toast.error(error.message || "Failed to save zone.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ city_id: "", zone_name: "" });
    router.back();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f9] font-sans text-[#3b4256]">
      <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-[500px] rounded-[10px] bg-white p-8 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:p-10">
          <h1 className="mb-8 text-center text-2xl font-semibold text-[#232f4b]">Add Address Zone</h1>

          {message ? (
            <div
              className={`mb-5 rounded-md border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-1">
            <div>
              <label className="mb-2 block text-[15px] text-[#5a4a3a]">City</label>
              <div className="relative">
                <select
                  value={form.city_id}
                  onChange={handleChange("city_id")}
                  disabled={loading}
                  className="w-full appearance-none rounded-md border border-[#e1e4eb] bg-white px-3 py-2.5 text-[15px] text-[#3b4256] focus:border-[#2f55d4] focus:outline-none disabled:bg-[#f6f7fa]"
                >
                  <option value="">{loading ? "Loading..." : "Select City"}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.city}
                      {city.province_name ? ` - ${city.province_name}` : ""}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8992a3]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[15px] text-[#5a4a3a]">Local Area</label>
              <div className="relative">
                <input type="text" value={form.zone_name} onChange={handleChange("zone_name")} placeholder="Enter Zone Name" className="w-full rounded-md border border-[#e1e4eb] bg-white px-3 py-2.5 text-[15px] text-[#3b4256] focus:border-[#2f55d4] focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button type="submit" disabled={saving} className="rounded-md bg-[#1f8a5f] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1a7550] disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Add Zone"}
            </button>
            <button type="button" onClick={handleCancel} className="rounded-md bg-[#6c7480] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#5c636d]">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e3e8f2] py-6 text-center text-[13.5px] text-[#8992a3]">
        Copyright © 2026 <strong>Global Tech Nepal Pvt. Ltd.</strong>
      </div>
    </div>
  );
}
