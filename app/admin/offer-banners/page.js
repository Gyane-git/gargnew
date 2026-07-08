"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function OfferBannerPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    is_active: 1,
    is_offer: 1,
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!image) {
      toast.error("Offer image is required.");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("start_date", formData.start_date);
      payload.append("end_date", formData.end_date);
      payload.append("is_active", formData.is_active);
      payload.append("is_offer", formData.is_offer);
      payload.append("offer_image", image);

      const res = await fetch("/api/v1/offers", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Offer saved successfully!");
        router.push("/admin/dashboard");
      } else {
        toast.error(data.message || "Failed to save offer.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full h-14 border rounded-lg px-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter offer title"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Offer Image</label>
            <input
              type="file"
              name="offer_image"
              accept="image/*"
              onChange={handleImage}
              className="w-full border rounded-lg p-2"
            />

            {preview && (
              <img
                src={preview}
                alt="Offer Preview"
                className="mt-4 w-56 h-28 object-cover rounded border"
              />
            )}
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full h-14 border rounded-lg px-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full h-14 border rounded-lg px-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={Number(formData.is_active) === 1}
                onChange={handleChange}
                className="peer sr-only"
              />
              <div className="peer h-7 w-14 rounded-full bg-gray-300 peer-checked:bg-blue-600 transition-all"></div>
              <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-7"></div>
            </label>
            <span className="text-xl">Active</span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-xl font-medium disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Offer"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg text-xl font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
