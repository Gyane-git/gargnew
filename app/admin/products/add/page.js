"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Upload, X, Package, Tag, DollarSign, Boxes, Info, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Icon size={16} />
        </span>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm " + "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent " + "placeholder:text-gray-300 transition";

const toggleCls = (on) => `relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${on ? "bg-blue-600" : "bg-gray-200"}`;

const emptyVariation = () => ({
  name: "",
  actual_price: "",
  sell_price: "",
  available_qty: "",
  stock_qty: "",
  imageFile: null, // File object
  preview: null, // Object URL string
});

export default function AddProductPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const catalogueRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [catalogueFile, setCatalogueFile] = useState(null);

  const [form, setForm] = useState({
    product_code: "",
    product_name: "",
    slug: "",
    product_description: "",
    key_specifications: "",
    packaging: "",
    warranty: "",
    category_id: "",
    brand_id: "",
    delivery_target_days: "",
    discount: "",
    actual_price: "",
    sell_price: "",
    available_quantity: "",
    stock_quantity: "",
    product_location: "",
    has_variations: 0,
    flash_sale: 0,
    weekly_offer: 0,
    special_offer: 0,
    today_deals: 0,
    status: 1,
  });

  const [variations, setVariations] = useState([emptyVariation()]);

  const generateProductCode = () => {
    const random = Math.floor(100000 + Math.random() * 900000); // always 6 digits
    return `P${random}`;
  };

  useEffect(() => {
    setForm((f) => ({
      ...f,
      product_code: generateProductCode(),
    }));
  }, []);

  // auto-generate slug
  useEffect(() => {
    const slug = form.product_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setForm((f) => ({ ...f, slug }));
  }, [form.product_name]);

  useEffect(() => {
    const price = parseFloat(form.actual_price);
    const disc = parseFloat(form.discount);
    if (!isNaN(price) && !isNaN(disc) && price > 0) {
      const sell = (price - (price * disc) / 100).toFixed(2);
      setForm((f) => ({ ...f, sell_price: sell }));
    }
  }, [form.actual_price, form.discount]);

  useEffect(() => {
    fetch("/api/v1/categories")
      .then((r) => r.json())
      .then((d) => {
        const flat = d.categories || [];
        const map = {};
        const tree = [];
        flat.forEach((cat) => (map[cat.id] = { ...cat, children: [] }));
        flat.forEach((cat) => {
          if (cat.parent_id) map[cat.parent_id]?.children.push(map[cat.id]);
          else tree.push(map[cat.id]);
        });
        setCategories(tree);
      })
      .catch(console.error);

    fetch("/api/v1/brands")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || []))
      .catch(console.error);
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (key) => setForm((f) => ({ ...f, [key]: f[key] === 1 ? 0 : 1 }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCatalogue = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatalogueFile(file);
  };

  const renderCategoryOptions = (nodes, level = 0) =>
    nodes.flatMap((cat) => [
      <option key={cat.id} value={cat.id}>
        {"— ".repeat(level) + cat.category_name}
      </option>,
      ...(cat.children?.length ? renderCategoryOptions(cat.children, level + 1) : []),
    ]);

  const handleVariationChange = (index, key, value) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleVariationImage = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setVariations((prev) => {
      const updated = [...prev];
      // revoke old object URL to avoid memory leaks
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated[index] = { ...updated[index], imageFile: file, preview };
      return updated;
    });
  };

  const handleRemoveVariationImage = (index) => {
    setVariations((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated[index] = { ...updated[index], imageFile: null, preview: null };
      return updated;
    });
  };

  const addVariation = () => setVariations((prev) => [...prev, emptyVariation()]);

  const removeVariation = (index) => {
    setVariations((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // revoke object URL being removed
      if (prev[index].preview) URL.revokeObjectURL(prev[index].preview);
      return updated;
    });
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async () => {
    if (!form.product_name.trim()) return showToast("error", "Product name is required.");
    if (!form.product_code.trim()) return showToast("error", "Product code is required.");

    setSubmitting(true);
    try {
      const fd = new FormData();

      // append all scalar form fields
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (imageFile) fd.append("main_image", imageFile);
      if (catalogueFile) fd.append("product_catalogue", catalogueFile);

      if (form.has_variations === 1) {
        const cleanVariations = variations.map(({ imageFile: _f, preview: _p, ...rest }) => rest);
        fd.append("variations", JSON.stringify(cleanVariations));

        variations.forEach((v, i) => {
          if (v.imageFile) fd.append(`variation_image_${i}`, v.imageFile);
        });
      }

      const res = await fetch("/api/v1/products", { method: "POST", body: fd });
      const data = await res.json();

      if (data.success) {
        showToast("success", "Product created successfully!");
        setTimeout(() => router.push("/admin/products"), 1500);
      } else {
        showToast("error", data.message || "Something went wrong.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all
            ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
        >
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Add New Product</h1>
            <p className="text-xs text-gray-400">Fill in the details below</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition">
            Cancel
          </Link>
          <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            {submitting ? "Saving…" : "Save Product"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT column  */}
        <div className="flex flex-col gap-6">
          {/* Basic Info */}
          <Section icon={Package} title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Product Code" required hint="Must be unique">
                <input value={form.product_code} onChange={set("product_code")} placeholder="e.g. P202022" className={inputCls} />
              </Field>
              <Field label="Product Name" required>
                <input value={form.product_name} onChange={set("product_name")} placeholder="e.g. Wireless Noise-Cancelling Headphones" className={inputCls} />
              </Field>
              <Field label="Slug" hint="Auto-generated from name">
                <input value={form.slug} onChange={set("slug")} placeholder="product-slug" className={inputCls} />
              </Field>
              <Field label="Delivery Target Days">
                <input value={form.delivery_target_days} onChange={set("delivery_target_days")} placeholder="e.g. 3-5" className={inputCls} />
              </Field>
              <Field label="Category">
                <select value={form.category_id} onChange={set("category_id")} className={inputCls}>
                  <option value="">— Select category —</option>
                  {renderCategoryOptions(categories)}
                </select>
              </Field>
              <Field label="Brand">
                <select value={form.brand_id} onChange={set("brand_id")} className={inputCls}>
                  <option value="">— Select brand —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brand_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Product Location">
                <input value={form.product_location} onChange={set("product_location")} placeholder="e.g. Warehouse A, Shelf 3" className={inputCls} />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Product Description">
                <textarea value={form.product_description} onChange={set("product_description")} rows={4} placeholder="Write a detailed product description…" className={inputCls + " resize-none"} />
              </Field>
            </div>
          </Section>

          {/* Specs / Packaging / Warranty */}
          <Section icon={Info} title="Details & Specifications">
            <div className="flex flex-col gap-5">
              <Field label="Key Specifications" hint="Technical specs, features, dimensions…">
                <textarea value={form.key_specifications} onChange={set("key_specifications")} rows={3} placeholder="e.g. Battery: 30hr | Driver: 40mm | Weight: 250g" className={inputCls + " resize-none"} />
              </Field>
              <Field label="Packaging">
                <textarea value={form.packaging} onChange={set("packaging")} rows={2} placeholder="e.g. 1x Headphone, 1x USB-C Cable, 1x Carry Pouch" className={inputCls + " resize-none"} />
              </Field>
              <Field label="Warranty">
                <input value={form.warranty} onChange={set("warranty")} placeholder="e.g. 1 Year Manufacturer Warranty" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Main Image */}
          <Section icon={Upload} title="Main Image">
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition
                ${imagePreview ? "border-blue-300" : "border-gray-200 hover:border-blue-300"}`}
            >
              {imagePreview ? (
                <div className="relative w-full aspect-square">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover rounded-xl" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-gray-600 hover:text-red-500 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
                  <Upload size={28} className="text-gray-300" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Click to upload</p>
                    <p className="text-xs">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </Section>

          {/* Product Catalogue */}
          <Section icon={Tag} title="Product Catalogue">
            <div onClick={() => catalogueRef.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 transition p-5 flex flex-col items-center gap-2 text-gray-400">
              <Upload size={22} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500 text-center">{catalogueFile ? catalogueFile.name : "Upload catalogue (PDF)"}</p>
            </div>
            {catalogueFile && (
              <button onClick={() => setCatalogueFile(null)} className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                <X size={12} /> Remove
              </button>
            )}
            <input ref={catalogueRef} type="file" accept=".pdf" className="hidden" onChange={handleCatalogue} />
          </Section>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-6">
          {/* Promotions & Flags */}
          <Section icon={Zap} title="Promotions & Flags">
            <div className="flex flex-col gap-4">
              {[
                { key: "flash_sale", label: "Flash Sale" },
                { key: "weekly_offer", label: "Weekly Offer" },
                { key: "special_offer", label: "Special Offer" },
                { key: "today_deals", label: "Today's Deal" },
                { key: "has_variations", label: "Has Variations" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <button type="button" onClick={() => toggle(key)} className={toggleCls(form[key] === 1)} aria-checked={form[key] === 1} role="switch">
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form[key] === 1 ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Pricing — only shown when there are NO variations */}
          {form.has_variations === 0 && (
            <Section icon={Tag} title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Actual Price" required>
                  <div className="flex">
                    <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-600">₨</span>
                    <input type="number" min="0" value={form.actual_price} onChange={set("actual_price")} placeholder="0.00" className={inputCls + " rounded-l-none"} />
                  </div>
                </Field>

                {/* <Field label="Discount (%)" hint="Auto-calculates sell price">
                  <input type="number" min="0" max="100" value={form.discount} onChange={set("discount")} placeholder="0" className={inputCls} />
                </Field> */}

                <Field label="Sell Price" hint="Auto-calculated; you may override">
                  <div className="flex">
                    <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-600">₨</span>
                    <input type="number" min="0" value={form.sell_price} onChange={set("sell_price")} placeholder="0.00" className={inputCls + " rounded-l-none"} />
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {/* Inventory */}
          <Section icon={Boxes} title="Inventory">
            {/* Normal (no variations) */}
            {form.has_variations === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Available Quantity" required>
                  <input type="number" min="0" value={form.available_quantity} onChange={set("available_quantity")} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Stock Quantity" required>
                  <input type="number" min="0" value={form.stock_quantity} onChange={set("stock_quantity")} placeholder="0" className={inputCls} />
                </Field>
              </div>
            )}

            {/* Variations */}
            {form.has_variations === 1 && (
              <div className="flex flex-col gap-6">
                {variations.map((v, index) => (
                  <div key={index} className="relative border rounded-xl p-5 bg-gray-50">
                    {/* Remove button (not for first row) */}
                    {index > 0 && (
                      <button
                        onClick={() => removeVariation(index)}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center
                          bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm transition"
                      >
                        <X size={14} />
                      </button>
                    )}

                    <p className="text-sm font-medium text-gray-700 mb-4 pr-10">Variation #{index + 1}</p>

                    {/* Per-variation image picker */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Variation Image</label>
                      <label className="flex items-center w-full border border-gray-300 rounded-xl overflow-hidden cursor-pointer bg-white">
                        <span className="px-4 py-2.5 bg-gray-100 border-r border-gray-300 text-sm font-semibold text-gray-600 shrink-0">Choose File</span>
                        <span className="px-3 py-2.5 text-sm text-gray-400 truncate">{v.imageFile ? v.imageFile.name : "No file chosen"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariationImage(index, e)} />
                      </label>

                      {/* Preview + remove */}
                      {v.preview && (
                        <div className="mt-3 relative w-40 h-28">
                          <img src={v.preview} alt={`Variation ${index + 1} preview`} className="w-full h-full object-cover rounded-xl border" />
                          <button type="button" onClick={() => handleRemoveVariationImage(index)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100 text-gray-600 hover:text-red-500 transition">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Variation name */}
                    <Field label="Variation Name (name, size, colour, etc.)">
                      <input value={v.name} onChange={(e) => handleVariationChange(index, "name", e.target.value)} placeholder="e.g. Blue – Large" className={inputCls} />
                    </Field>

                    {/* Prices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                      <Field label="Actual Price">
                        <div className="flex">
                          <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-600">Rs.</span>
                          <input type="number" min="0" value={v.actual_price} onChange={(e) => handleVariationChange(index, "actual_price", e.target.value)} placeholder="0.00" className={inputCls + " rounded-l-none"} />
                        </div>
                      </Field>
                      <Field label="Selling Price">
                        <div className="flex">
                          <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-600">Rs.</span>
                          <input type="number" min="0" value={v.sell_price} onChange={(e) => handleVariationChange(index, "sell_price", e.target.value)} placeholder="0.00" className={inputCls + " rounded-l-none"} />
                        </div>
                      </Field>
                    </div>

                    {/* Quantities */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                      <Field label="Available Qty">
                        <input type="number" min="0" value={v.available_qty} onChange={(e) => handleVariationChange(index, "available_qty", e.target.value)} placeholder="0" className={inputCls} />
                      </Field>
                      <Field label="Stock Qty">
                        <input type="number" min="0" value={v.stock_qty} onChange={(e) => handleVariationChange(index, "stock_qty", e.target.value)} placeholder="0" className={inputCls} />
                      </Field>
                    </div>
                  </div>
                ))}

                <button onClick={addVariation} className="text-blue-600 text-sm font-medium border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition w-fit">
                  + Add Another Variation
                </button>
              </div>
            )}
          </Section>

          {/* Status */}
          <Section icon={CheckCircle} title="Status">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Active</p>
                <p className="text-xs text-gray-400">Product will be visible in store</p>
              </div>
              <button type="button" onClick={() => toggle("status")} className={toggleCls(form.status === 1)} role="switch" aria-checked={form.status === 1}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.status === 1 ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
