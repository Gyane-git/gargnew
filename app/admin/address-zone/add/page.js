"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AddShippingCostPage() {
  const [cities, setCities] = useState([]);
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
      const res = await fetch("/api/v1/addresses/address-zone");
      const data = await res.json();
      console.log("data: ", data);
      

      if (data.success) {
        setCities(data.cities);
      } else {
        toast.error("Failed to load cities");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cities");
    }
  };
  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = () => {
    console.log("Add Shipping Cost payload:", form);
  };

  const handleCancel = () => {
    setForm({ province: "", city: "", cost: "", remarks: "" });
    router.back();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f9] font-sans text-[#3b4256]">
      <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[500px] rounded-[10px] bg-white p-8 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:p-10">
          <h1 className="mb-8 text-center text-2xl font-semibold text-[#232f4b]">Add Address Zone</h1>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-1">
            <div>
              <label className="mb-2 block text-[15px] text-[#5a4a3a]">City</label>
              <div className="relative">
                <select value={form.city_id} onChange={handleChange("city_id")} className="w-full appearance-none rounded-md border border-[#e1e4eb] bg-white px-3 py-2.5 text-[15px] text-[#3b4256] focus:border-[#2f55d4] focus:outline-none">
                  <option value="">Select City</option>

                  {/* {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.city_id}
                    </option>
                  ))} */}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8992a3]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[15px] text-[#5a4a3a]">Province Name</label>
              <div className="relative">
                <input type="text" value={form.zone_name} onChange={handleChange("zone_name")} placeholder="Enter Zone Name" className="w-full rounded-md border border-[#e1e4eb] bg-white px-3 py-2.5 text-[15px] text-[#3b4256] focus:border-[#2f55d4] focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={handleSubmit} className="rounded-md bg-[#1f8a5f] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1a7550]">
              Add Shipping Cost
            </button>
            <button onClick={handleCancel} className="rounded-md bg-[#6c7480] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#5c636d]">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e3e8f2] py-6 text-center text-[13.5px] text-[#8992a3]">
        Copyright © 2026 <strong>Global Tech Nepal Pvt. Ltd.</strong>
      </div>
    </div>
  );
}
