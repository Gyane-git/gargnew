"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function EditBrandPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    brand_name: "",
    setTopBrand: 0,
    publish: 1,
    order_wise: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [removedImage, setRemovedImage] = useState(false);

  function getBrandImage(brand) {
    const img = brand?.image || brand?.main_image || brand?.logo;

    if (!img) return "/no-image.png";

    if (img.startsWith("http")) return img;

    if (img.startsWith("/uploads")) return img;

    return `/uploads/brands/${img}`;
  }

  const getBrand = async () => {
    try {
      const res = await fetch(`/api/v1/brands/${id}`);
      const data = await res.json();

      console.log("Brand API:", data);

      if (data.success) {
        const brand = data.brand;

        setForm({
          brand_name: brand.brand_name || "",
          setTopBrand: brand.setTopBrand ? 1 : 0,
          publish: brand.publish ? 1 : 0,
          order_wise: brand.order_wise || "",
        });

        // FIXED IMAGE LOAD
        const img = getBrandImage(brand);
        setLogoPreview(img);
        setRemovedImage(false);
      } else {
        toast.error("Brand not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching brand");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) getBrand();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setLogoFile(null);
    setLogoPreview("");
    setRemovedImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("brand_name", form.brand_name);
      formData.append("setTopBrand", form.setTopBrand);
      formData.append("publish", form.publish);
      formData.append("order_wise", form.order_wise);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch(`/api/v1/brands/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Brand updated successfully!");
        router.push("/admin/brands");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading brand...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a3a6b] mb-1">Edit Brand</h1>
        <p className="text-sm text-gray-400 mb-7">Update brand details below</p>

        <form onSubmit={handleSubmit} className="space-y-5 text-black">
          {/* BRAND NAME */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Brand Name</label>
            <input type="text" name="brand_name" value={form.brand_name} onChange={handleChange} placeholder="Enter brand name" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>

          {/* LOGO */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Brand Logo</label>

            <label className="flex items-center w-full border border-gray-300 rounded-xl overflow-hidden cursor-pointer bg-white">
              <span className="px-4 py-2.5 bg-gray-100 border-r text-sm font-semibold">Choose File</span>
              <span className="px-3 py-2.5 text-sm text-gray-400 truncate">{logoFile ? logoFile.name : "No file chosen"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </label>

            {/* IMAGE PREVIEW */}
            {!removedImage && logoPreview && logoPreview !== "/no-image.png" && (
              <div className="mt-3 relative w-40 h-28">
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-xl border" />

                {/* Remove button */}
                <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* TOP + PUBLISH */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Set Top Brand</label>
              <select name="setTopBrand" value={form.setTopBrand} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Publish</label>
              <select name="publish" value={form.publish} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>

          {/* ORDER */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Order Wise</label>
            <input type="number" name="order_wise" value={form.order_wise} onChange={handleChange} placeholder="Enter order" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-between pt-3">
            <button type="submit" disabled={submitting} className={`bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}>
              {submitting ? "Updating..." : "Update Brand"}
            </button>

            <button type="button" onClick={() => router.push("/admin/brands")} className="bg-gray-500 text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
