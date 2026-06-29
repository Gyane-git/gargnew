"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

const CARRIER_TYPES = ["Staff", "Company"];

export default function AddCarrier() {

  const [form, setForm] = useState({
    name:    "",
    address: "",
    phone:   "",
    type:    "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  // Validate form — backend dev wires submit to POST /api/shipping-carriers
  const handleSubmit = () => {
    if (!form.name.trim()) return setError("Carrier name is required.");
    if (!form.type)        return setError("Please select a carrier type.");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">

        {/* Breadcrumb */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-900">Add Carrier</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline text-gray-500">
              Dashboard
            </Link>
            <span>/</span>
            <span>Add Carrier</span>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm w-full px-6 sm:px-10 py-10">

          <h2 className="text-xl font-medium text-blue-900 text-center mb-8">
            Add Carrier
          </h2>

          {/* Inline error */}
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          {/* Form fields — 2 columns on sm+, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Carrier Name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                           text-gray-700 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                           text-gray-700 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                           text-gray-700 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                           text-gray-700 bg-white cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="" disabled>Select Carrier Type</option>
                {CARRIER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white
                         text-sm font-semibold rounded-lg transition"
            >
              Add Carrier
            </button>
            <Link
              href="/admin/shipping-carriers/carriers-list"
              className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white
                         text-sm font-semibold rounded-lg transition"
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>

      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-200">
        Copyright &copy; 2026{" "}
        <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}