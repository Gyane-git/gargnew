"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddShippingCostPage() {
  const router = useRouter();
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [form, setForm] = useState({
    province_id: "",
    city: "",
    shipping_cost: "",
    remarks: "",
    apply_shipping: true,
  });

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await fetch("/api/v1/addresses/province");
        const data = await res.json();
        setProvinces(Array.isArray(data?.provinces) ? data.provinces : []);
      } catch (error) {
        setMessageType("error");
        setMessage(error.message || "Failed to load provinces.");
      } finally {
        setLoading(false);
      }
    };

    loadProvinces();
  }, []);

  const selectedProvinceName = useMemo(() => {
    const match = provinces.find((province) => String(province.id) === String(form.province_id));
    return match?.province_name || "";
  }, [form.province_id, provinces]);

  const handleChange = (field) => (e) => {
    const value = field === "apply_shipping" ? e.target.checked : e.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.province_id || !form.city.trim() || form.shipping_cost === "") {
      setMessageType("error");
      setMessage("Province, city and shipping cost are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/addresses/shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          province_id: Number(form.province_id),
          city: form.city.trim(),
          shipping_cost: Number(form.shipping_cost),
          apply_shipping: form.apply_shipping ? 1 : 0,
          remarks: form.remarks.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save shipping cost.");
      }

      setMessageType("success");
      setMessage(data?.message || "Shipping added successfully.");
      setForm({
        province_id: "",
        city: "",
        shipping_cost: "",
        remarks: "",
        apply_shipping: true,
      });

      setTimeout(() => {
        router.push("/admin/set-shipping");
        router.refresh();
      }, 500);
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Failed to save shipping cost.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      province_id: "",
      city: "",
      shipping_cost: "",
      remarks: "",
      apply_shipping: true,
    });
    router.back();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f9] font-sans text-[#3b4256]">
      <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-[650px] rounded-[10px] bg-white p-8 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:p-10">
          <h1 className="mb-8 text-center text-2xl font-semibold text-[#232f4b]">Add Shipping Cost</h1>

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

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[15px] text-[#5a4a3a]">Province</label>
              <div className="relative">
                <select
                  value={form.province_id}
                  onChange={handleChange("province_id")}
                  disabled={loading}
                  className="w-full appearance-none rounded-md border border-[#e1e4eb] bg-white px-3 py-2.5 text-[15px] text-[#3b4256] focus:border-[#2f55d4] focus:outline-none disabled:bg-[#f6f7fa]"
                >
                  <option value="">{loading ? "Loading..." : "Select"}</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.province_name}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8992a3]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {selectedProvinceName ? <p className="mt-1 text-xs text-[#7b8497]">Selected: {selectedProvinceName}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-[15px] text-[#3b4256]">City</label>
              <input
                type="text"
                value={form.city}
                onChange={handleChange("city")}
                placeholder="Enter city / area"
                className="w-full rounded-md border border-[#e1e4eb] px-3 py-2.5 text-[15px] focus:border-[#2f55d4] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[15px] text-[#5a4a3a]">Shipping Cost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.shipping_cost}
                onChange={handleChange("shipping_cost")}
                placeholder="0.00"
                className="w-full rounded-md border border-[#e1e4eb] px-3 py-2.5 text-[15px] focus:border-[#2f55d4] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[15px] text-[#3b4256]">Remarks</label>
              <input
                type="text"
                value={form.remarks}
                onChange={handleChange("remarks")}
                placeholder="Optional note"
                className="w-full rounded-md border border-[#e1e4eb] px-3 py-2.5 text-[15px] focus:border-[#2f55d4] focus:outline-none"
              />
            </div>
          </div>

          <label className="mt-5 inline-flex items-center gap-2 text-sm text-[#4b5468]">
            <input type="checkbox" checked={form.apply_shipping} onChange={handleChange("apply_shipping")} className="h-4 w-4 accent-[#2f55d4]" />
            Apply shipping
          </label>

          <div className="mt-8 flex items-center justify-between">
            <button type="submit" disabled={saving} className="rounded-md bg-[#1f8a5f] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1a7550] disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Add Shipping Cost"}
            </button>
            <button type="button" onClick={handleCancel} className="rounded-md bg-[#6c7480] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#5c636d]">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="border-t border-[#e3e8f2] py-6 text-center text-[13.5px] text-[#8992a3]">
        Copyright © 2026 <strong>Global Tech Nepal Pvt. Ltd.</strong>
      </div>
    </div>
  );
}
