"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AddBannerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    product_code: "",
    is_offer: 0,
    status: 1,
  });

  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [previewDesktop, setPreviewDesktop] = useState(null);
  const [previewMobile, setPreviewMobile] = useState(null);
  // const [imageDesktop, setImageDesktop] = useState(null);
  // const [imageMobile, setImageMobile] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/v1/products/all?include_inactive=1");
        const data = await res.json();
        if (data.success) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        } else {
          toast.error(data.message || "Failed to load products");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load products");
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // HANDLE INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "is_offer" || name === "status" ? Number(value) : value,
    }));
  };

  const handleImage = (e, type) => {
    const selected = e.target.files[0];

    if (!selected) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(selected.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;

    if (selected.size > MAX_SIZE) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (type === "desktop") {
      setDesktopFile(selected);
      setPreviewDesktop(URL.createObjectURL(selected));
    } else {
      setMobileFile(selected);
      setPreviewMobile(URL.createObjectURL(selected));
    }
  };

  // const handleRemoveImageDesktop = () => {
  //   setImageDesktop(null);
  //   setPreviewDesktop(null);
  // };

  // const handleRemoveImageMobile = () => {
  //   setImageMobile(null);
  //   setPreviewMobile(null);
  // };

  const handleRemoveImageDesktop = () => {
    setDesktopFile(null);
    setPreviewDesktop(null);
  };

  const handleRemoveImageMobile = () => {
    setMobileFile(null);
    setPreviewMobile(null);
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form.product_code) {
      toast.error("Please select a product.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("product_code", form.product_code);
      formData.append("is_offer", form.is_offer);
      formData.append("status", form.status);

      if (desktopFile) formData.append("file", desktopFile);
      if (mobileFile) formData.append("mobile_file", mobileFile);

      const res = await fetch("/api/v1/banners", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (data.success) {
        toast.success("Banner added successfully!");
        router.push("/admin/banners");
      } else {
        toast.error(data.message || "Failed to add banner");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 max-w-xl mx-auto">
        {/* HEADER */}
        <h1 className="text-2xl font-bold text-[#1a3a6b] mb-1">Add Banner</h1>
        <p className="text-sm text-gray-400 mb-7">Fill in the details to add a new banner</p>

          <form onSubmit={handleSubmit} className="space-y-5">
          {/* PRODUCT CODE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Product</label>
            <select
              name="product_code"
              value={form.product_code}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
              disabled={productsLoading}
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.product_code} value={product.product_code}>
                  {product.product_name} ({product.product_code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Choose the product this carousel banner belongs to.
            </p>
          </div>
          
          {/* DESKTOP IMAGE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Desktop Image</label>
            <label className="flex items-center w-full border border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 transition-colors bg-white">
              <span className="px-4 py-2.5 bg-gray-100 border-r border-gray-300 text-sm font-semibold text-gray-800 whitespace-nowrap hover:bg-gray-200 transition-colors">Choose File</span>
              {/* <span className="px-3 py-2.5 text-sm text-gray-400 truncate">No file chosen</span> */}
              <span className="px-3 py-2.5 text-sm text-gray-400 truncate">{desktopFile?.name || "No file chosen"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, "desktop")} />
            </label>

            {previewDesktop && (
              <div className="relative mt-3 w-40 h-40">
                <p className="text-xs text-gray-400 mb-1.5 font-medium">Preview</p>
                <img src={previewDesktop} alt="Preview" className="h-full w-full object-cover rounded-lg border bg-white" />

                {/* ✕ Remove Button */}
                <button type="button" onClick={handleRemoveImageDesktop} className="absolute top-6 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black">
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
              {/* <span className="px-3 py-2.5 text-sm text-gray-400 truncate">No file chosen</span> */}
              <span className="px-3 py-2.5 text-sm text-gray-400 truncate">{mobileFile?.name || "No file chosen"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, "mobile")} />
            </label>

            {previewMobile && (
              <div className="relative mt-3 w-40 h-40">
                <p className="text-xs text-gray-400 mb-1.5 font-medium">Preview</p>
                <img src={previewMobile} alt="Preview" className="h-full w-full object-cover rounded-lg border bg-white" />

                {/* ✕ Remove Button */}
                <button type="button" onClick={handleRemoveImageMobile} className="absolute top-6 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* IS OFFER + STATUS - 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1.5">Products</label>
              <select name="is_offer" value={form.is_offer} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition">
                <option value={0}>Select Products</option>
                
              </select>
            </div>
            
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-between pt-3">
            <button type="submit" disabled={loading} className={`bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Add Banner"
              )}
            </button>

            <button type="button" onClick={() => router.push("/admin/banners")} className="bg-gray-500 text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-600 transition-colors shadow-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
