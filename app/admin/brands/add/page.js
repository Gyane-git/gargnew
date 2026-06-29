"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const AddBrand = () => {
  const router = useRouter();

  const [brandName, setBrandName] = useState("");
  const [top, setTop] = useState(0);
  const [status, setStatus] = useState(1);
  const [orderWise, setOrderWise] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double submit
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("brand_name", brandName);
      formData.append("top", top);
      formData.append("status", status);
      formData.append("order_wise", orderWise);
      if (image) formData.append("image", image);

      const res = await fetch("/api/v1/brands", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (data?.success) {
        toast.success("Brands added successfully!");
        setTimeout(() => router.push("/admin/brands"), 1500);
      } else {
        toast.error("Error: " + (data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding brand!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#1a3a6b] text-center mb-8">Add Brand</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Brand Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Brand Name</label>
                <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="w-full border border-gray-300 text-black rounded-lg px-4 py-2" required />
              </div>

              {/* Order wise */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Order</label>
                <input type="number" value={orderWise} onChange={(e) => setOrderWise(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>
            </div>

            {/* Top + Status */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Top Brand</label>
                <select value={top} onChange={(e) => setTop(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Image</label>

              <label className="flex items-center w-1/2 border border-gray-300 rounded-lg cursor-pointer bg-white">
                <span className="px-4 py-2 bg-gray-100 border-r text-sm font-semibold">Choose File</span>
                <span className="px-3 py-2 text-sm text-gray-400 truncate">{image ? image.name : "No file chosen"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              {preview && (
                <div className="relative mt-3 w-40 h-40">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg border bg-white" />

                  {/* ✕ Remove Button */}
                  <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black">
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-between">
              <button type="submit" disabled={loading} className={`bg-teal-600 text-white px-8 py-2 rounded-lg ${loading ? "opacity-60" : ""}`}>
                {loading ? "Adding..." : "Add Brand"}
              </button>

              <button type="button" onClick={() => router.back()} className="bg-gray-500 text-white px-8 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBrand;
