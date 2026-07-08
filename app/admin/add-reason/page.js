"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function AddReasonPage() {
  const [formData, setFormData] = useState({
    reasonName: "",
    reasonType: "",
    reasonFor: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const reasonName = String(formData.reasonName || "").trim();
    const reasonType = String(formData.reasonType || "").trim();
    const reasonFor = String(formData.reasonFor || "").trim();

    if (!reasonName || !reasonType || !reasonFor) {
      toast.error("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/order-cancel-reasons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          reasonName,
          reasonType,
          reasonFor,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Reason added successfully.");
        setFormData({
          reasonName: "",
          reasonType: "",
          reasonFor: "",
        });
      } else {
        toast.error(data.message || "Failed to add reason.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      reasonName: "",
      reasonType: "",
      reasonFor: "",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-4xl font-bold text-center text-blue-900 mb-10">
          Add Reason
        </h3>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Reason Name */}
          <div>
            <label className="block text-xl font-medium text-gray-800 mb-3">
              Reason Name
            </label>

            <input
              type="text"
              name="reasonName"
              value={formData.reasonName}
              onChange={handleChange}
              placeholder="Enter Reason "
              className="w-full h-14 rounded-lg border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reason Type */}
          <div>
            <label className="block text-xl font-medium text-gray-800 mb-3">
              Reason Type
            </label>

            <select
              name="reasonType"
              value={formData.reasonType}
              onChange={handleChange}
              className="w-full h-14 rounded-lg border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Return">Return</option>
              <option value="Cancel">Cancel</option>
            </select>
          </div>

          {/* Reason For */}
          <div>
            <label className="block text-xl font-medium text-gray-800 mb-3">
              Reason For
            </label>

            <select
              name="reasonFor"
              value={formData.reasonFor}
              onChange={handleChange}
              className="w-full h-14 rounded-lg border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Supplier">Supplier</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-8 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white text-xl font-semibold px-10 py-3 rounded-lg transition"
            >
              {loading ? "Saving..." : "Add Reason Detail"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-semibold px-10 py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
