"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function EditBannerPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    product_code: "",
    file_path: "",
    mobile_file_path: "",
    is_offer: 0,
    status: 1,
  });

  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState("");
  const [mobilePreview, setMobilePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removeDesktop, setRemoveDesktop] = useState(false);
  const [removeMobile, setRemoveMobile] = useState(false);

  const getBanner = async () => {
    try {
      const res = await fetch(`/api/v1/banners/${id}`);
      const data = await res.json();
      if (data.success) {
        setForm(data.banner);
        // Set existing image previews
        if (data.banner.file_path) {
          setDesktopPreview(data.banner.file_path.startsWith("http") ? data.banner.file_path : `/uploads/carousel/${data.banner.file_path}`);
        }
        if (data.banner.mobile_file_path) {
          setMobilePreview(`/uploads/carousel/${data.banner.mobile_file_path}`);
        }
      } else {
        toast.error("Banner not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching banner");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) getBanner();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDesktopImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDesktopFile(file);
    setDesktopPreview(URL.createObjectURL(file));
  };

  const handleMobileImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMobileFile(file);
    setMobilePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 🔥 IMPORTANT FIX
      if (desktopFile || mobileFile || removeDesktop || removeMobile) {
        const formData = new FormData();

        formData.append("product_code", form.product_code);
        formData.append("is_offer", form.is_offer);
        formData.append("status", form.status);

        if (desktopFile) formData.append("desktop_image", desktopFile);
        if (mobileFile) formData.append("mobile_image", mobileFile);

        // 🔥 SEND REMOVE FLAGS
        formData.append("remove_desktop", removeDesktop);
        formData.append("remove_mobile", removeMobile);

        const res = await fetch(`/api/v1/banners/${id}`, {
          method: "PUT",
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          toast.success("Banner updated!");
          router.push("/admin/banners");
        } else {
          toast.error(data.message || "Update failed");
        }
      } else {
        const res = await fetch(`/api/v1/banners/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();

        if (data.success) {
          toast.success("Banner updated!");
          router.push("/admin/banners");
        } else {
          toast.error(data.message || "Update failed");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // remove desktop image
  const handleRemoveDesktop = () => {
    setDesktopFile(null);
    setDesktopPreview("");
    setRemoveDesktop(true);
  };

  // remove mobile image
  const handleRemoveMobile = () => {
    setMobileFile(null);
    setMobilePreview("");
    setRemoveMobile(true);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading banner...
        </div>
      </div>
    );

  return (
    <div className="p-6">
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 max-w-xl mx-auto">
        {/* HEADER */}
        <h1 className="text-2xl font-bold text-[#1a3a6b] mb-1">Edit Banner</h1>
        <p className="text-sm text-gray-400 mb-7">Update banner details below</p>

        <form onSubmit={handleSubmit} className="space-y-5 text-black">
          {/* BANNER NAME / PRODUCT CODE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Banner Name</label>
            <input
              type="text"
              name="product_code"
              value={form.product_code || ""}
              onChange={handleChange}
              placeholder="Enter banner name"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
              required
            />
          </div>

          {/* DESKTOP IMAGE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Desktop Image</label>
            <label className="flex items-center w-full border border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 transition-colors bg-white">
              <span className="px-4 py-2.5 bg-gray-100 border-r border-gray-300 text-sm font-semibold text-gray-800 whitespace-nowrap hover:bg-gray-200 transition-colors">Choose File</span>
              <span className="px-3 py-2.5 text-sm text-gray-400 truncate">{desktopFile ? desktopFile.name : "No file chosen"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleDesktopImage} />
            </label>
            {desktopPreview && (
              <div className="relative mt-3 w-40 h-40">
                <img src={desktopPreview} alt="Preview" className="h-full w-full object-cover rounded-lg border bg-white" />

                {/* ✕ Remove Button */}
                <button
                  type="button"
                  onClick={handleRemoveDesktop}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* MOBILE IMAGE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Mobile Image</label>
            <label className="flex items-center w-full border border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 transition-colors bg-white">
              <span className="px-4 py-2.5 bg-gray-100 border-r border-gray-300 text-sm font-semibold text-gray-800 whitespace-nowrap hover:bg-gray-200 transition-colors">Choose File</span>
              <span className="px-3 py-2.5 text-sm text-gray-400 truncate">{mobileFile ? mobileFile.name : "No file chosen"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleMobileImage} />
            </label>
            {mobilePreview && (
              <div className="relative mt-3 w-40 h-40">
                <img src={mobilePreview} alt="Preview" className="h-full w-full object-cover rounded-lg border bg-white" />

                {/* ✕ Remove Button */}
                <button
                  type="button"
                  onClick={handleRemoveMobile}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* IS OFFER + STATUS - 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Is Offer</label>
              <select
                name="is_offer"
                value={form.is_offer}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
              >
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="submit"
              disabled={submitting}
              className={`bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update Banner"
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/banners")}
              className="bg-gray-500 text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-600 transition-colors shadow-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
