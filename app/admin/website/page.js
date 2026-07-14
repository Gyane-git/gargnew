"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

function TextField(props) {
  return <input type="text" className="w-full border border-gray-300 rounded px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400" {...props} />;
}

const EMPTY_FORM = {
  company_name: "",
  primary_email: "",
  secondary_email: "",
  whatsapp: "",
  primary_phone: "",
  secondary_phone: "",
  address: "",
  website_link: "",
  free_shipping_mode: "apply",
  free_shipping_threshold_inside_of_valley: "",
  free_shipping_threshold_out_of_valley: "",
  category_display_count: "",
  map_url: "",
  company_logo_header: "",
  company_logo_footer: "",
};

const getSettingValue = (settings, key) => settings?.[key]?.value || "";

const getSettingImage = (settings, key, fallback) =>
  settings?.[key]?.header_logo_full_url || settings?.[key]?.footer_logo_full_url || settings?.[key]?.image_full_url || settings?.[key]?.value || fallback || "";

export default function EcommerceWebsiteDataPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [headerPreview, setHeaderPreview] = useState("");
  const [footerPreview, setFooterPreview] = useState("");
  const [headerLogoName, setHeaderLogoName] = useState("No file chosen");
  const [footerLogoName, setFooterLogoName] = useState("No file chosen");
  const [headerLogoFile, setHeaderLogoFile] = useState(null);
  const [footerLogoFile, setFooterLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const headerLogoRef = useRef(null);
  const footerLogoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/v1/admin/website", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load website settings.");
        }

        if (cancelled) {
          return;
        }

        const settings = data.settings || {};
        setForm({
          company_name: getSettingValue(settings, "company_name"),
          primary_email: getSettingValue(settings, "primary_email"),
          secondary_email: getSettingValue(settings, "secondary_email"),
          whatsapp: getSettingValue(settings, "whatsapp"),
          primary_phone: getSettingValue(settings, "primary_phone"),
          secondary_phone: getSettingValue(settings, "secondary_phone"),
          address: getSettingValue(settings, "address"),
          website_link: getSettingValue(settings, "website_link"),
          free_shipping_mode: getSettingValue(settings, "free_shipping_mode") || "apply",
          free_shipping_threshold_inside_of_valley: getSettingValue(settings, "free_shipping_threshold_inside_of_valley"),
          free_shipping_threshold_out_of_valley: getSettingValue(settings, "free_shipping_threshold_out_of_valley"),
          category_display_count: getSettingValue(settings, "category_display_count"),
          map_url: getSettingValue(settings, "map_url"),
          company_logo_header: getSettingValue(settings, "company_logo_header"),
          company_logo_footer: getSettingValue(settings, "company_logo_footer"),
        });
        setHeaderPreview(getSettingImage(settings, "company_logo_header", ""));
        setFooterPreview(getSettingImage(settings, "company_logo_footer", ""));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load website settings.");
          toast.error(err.message || "Failed to load website settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    if (type === "header") {
      setHeaderPreview(imageUrl);
      setHeaderLogoName(file.name);
      setHeaderLogoFile(file);
    } else {
      setFooterPreview(imageUrl);
      setFooterLogoName(file.name);
      setFooterLogoFile(file);
    }
  };

  const removeImage = (type) => {
    if (type === "header") {
      setHeaderPreview("");
      setHeaderLogoName("No file chosen");
      setHeaderLogoFile(null);
      setForm((prev) => ({ ...prev, company_logo_header: "" }));
      if (headerLogoRef.current) headerLogoRef.current.value = "";
    } else {
      setFooterPreview("");
      setFooterLogoName("No file chosen");
      setFooterLogoFile(null);
      setForm((prev) => ({ ...prev, company_logo_footer: "" }));
      if (footerLogoRef.current) footerLogoRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        payload.set(key, value ?? "");
      });

      if (headerLogoFile) {
        payload.set("company_logo_header_file", headerLogoFile);
      } else if (form.company_logo_header) {
        payload.set("company_logo_header_path", form.company_logo_header);
      }

      if (footerLogoFile) {
        payload.set("company_logo_footer_file", footerLogoFile);
      } else if (form.company_logo_footer) {
        payload.set("company_logo_footer_path", form.company_logo_footer);
      }

      const res = await fetch("/api/v1/admin/website", {
        method: "PATCH",
        body: payload,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save website settings.");
      }

      const settings = data.settings || {};
      const successMessage = data.message || "Website settings saved successfully.";
      setMessage(successMessage);
      toast.success(successMessage);
      setForm({
        company_name: getSettingValue(settings, "company_name"),
        primary_email: getSettingValue(settings, "primary_email"),
        secondary_email: getSettingValue(settings, "secondary_email"),
        whatsapp: getSettingValue(settings, "whatsapp"),
        primary_phone: getSettingValue(settings, "primary_phone"),
        secondary_phone: getSettingValue(settings, "secondary_phone"),
        address: getSettingValue(settings, "address"),
        website_link: getSettingValue(settings, "website_link"),
        free_shipping_mode: getSettingValue(settings, "free_shipping_mode") || "apply",
        free_shipping_threshold_inside_of_valley: getSettingValue(settings, "free_shipping_threshold_inside_of_valley"),
        free_shipping_threshold_out_of_valley: getSettingValue(settings, "free_shipping_threshold_out_of_valley"),
        category_display_count: getSettingValue(settings, "category_display_count"),
        map_url: getSettingValue(settings, "map_url"),
        company_logo_header: getSettingValue(settings, "company_logo_header"),
        company_logo_footer: getSettingValue(settings, "company_logo_footer"),
      });
      setHeaderPreview(getSettingImage(settings, "company_logo_header", ""));
      setFooterPreview(getSettingImage(settings, "company_logo_footer", ""));
      setHeaderLogoFile(null);
      setFooterLogoFile(null);
      setHeaderLogoName("No file chosen");
      setFooterLogoName("No file chosen");
      if (headerLogoRef.current) headerLogoRef.current.value = "";
      if (footerLogoRef.current) footerLogoRef.current.value = "";
    } catch (err) {
      const errorMessage = err.message || "Failed to save website settings.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] flex flex-col relative">
      <div className="flex-1 px-8 py-8 flex justify-center">
        <div className="bg-white rounded-md shadow-sm w-full max-w-4xl px-10 py-8">
          <h1 className="text-center text-lg font-bold text-[#1a2b6d] mb-8">E-commerce Website Data</h1>

          {(message || error) && (
            <div className={`mb-6 rounded-md px-4 py-3 text-sm ${error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
              {error || message}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-gray-500">Loading website settings...</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-10 gap-y-6">
              <div className="flex flex-col gap-6">
                <div>
                  <label>
                    Company Name <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.company_name} name="company_name" onChange={handleChange} />
                </div>

                <div>
                  <label>Company Logo Footer</label>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
                    <button type="button" onClick={() => footerLogoRef.current?.click()} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800">
                      Choose File
                    </button>
                    <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{footerLogoName}</span>
                    <input ref={footerLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "footer")} />
                  </div>
                  {footerPreview && (
                    <div className="mt-4 relative inline-block">
                      <img src={footerPreview} alt="Footer Preview" className="w-32 h-32 border rounded-lg object-contain bg-white" />
                      <button type="button" onClick={() => removeImage("footer")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow">
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label>Secondary Email</label>
                  <TextField value={form.secondary_email} name="secondary_email" onChange={handleChange} />
                </div>

                <div>
                  <label>
                    Primary Phone <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.primary_phone} name="primary_phone" onChange={handleChange} />
                </div>

                <div>
                  <label>
                    Company Address <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.address} name="address" onChange={handleChange} />
                </div>

                <div>
                  <label>
                    Free Shipping options <span className="text-red-600 text-lg">*</span>
                  </label>
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="radio" name="free_shipping_mode" checked={form.free_shipping_mode === "dont"} onChange={() => setForm((prev) => ({ ...prev, free_shipping_mode: "dont" }))} className="accent-blue-600" />
                      Don&apos;t Apply Free Shipping Threshold
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="radio" name="free_shipping_mode" checked={form.free_shipping_mode === "apply"} onChange={() => setForm((prev) => ({ ...prev, free_shipping_mode: "apply" }))} className="accent-blue-600" />
                      Apply Free Shipping Threshold
                    </label>
                  </div>
                </div>

                <div>
                  <label>
                    Free Shipping Minimum Amount (Inside of Valley) <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.free_shipping_threshold_inside_of_valley} name="free_shipping_threshold_inside_of_valley" onChange={handleChange} />
                </div>

                <div className="col-span-2">
                  <label>
                    Map URL <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.map_url} name="map_url" onChange={handleChange} />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label>Company Logo Header</label>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
                    <button type="button" onClick={() => headerLogoRef.current?.click()} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800">
                      Choose File
                    </button>
                    <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{headerLogoName}</span>
                    <input ref={headerLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "header")} />
                  </div>
                  {headerPreview && (
                    <div className="mt-4 relative inline-block">
                      <img src={headerPreview} alt="Header Preview" className="w-32 h-32 border rounded-lg object-contain bg-white" />
                      <button type="button" onClick={() => removeImage("header")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow">
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label>
                    Primary Email <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required type="email" value={form.primary_email} name="primary_email" onChange={handleChange} />
                </div>

                <div>
                  <label>
                    Whatsapp Number <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.whatsapp} name="whatsapp" onChange={handleChange} />
                </div>

                <div>
                  <label>Secondary Phone</label>
                  <TextField value={form.secondary_phone} name="secondary_phone" onChange={handleChange} />
                </div>

                <div>
                  <label>
                    Website Link <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.website_link} name="website_link" onChange={handleChange} />
                </div>

                <div>
                  <label>
                    Free Shipping Minimum Amount (Out of Valley)<span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.free_shipping_threshold_out_of_valley} name="free_shipping_threshold_out_of_valley" onChange={handleChange} />
                </div>

                <div>
                  <label>
                    No of Category display <span className="text-red-600 text-lg">*</span>
                  </label>
                  <TextField required value={form.category_display_count} name="category_display_count" onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-10">
            <button type="button" onClick={handleSubmit} disabled={saving || loading} className="bg-[#1e6b3c] hover:bg-[#175a31] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded">
              {saving ? "Saving..." : "Update Website Details"}
            </button>
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="bg-[#6c757d] hover:bg-[#5c636a] text-white text-sm font-medium px-6 py-2.5 rounded">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500 relative">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>

      <button type="button" onClick={scrollToTop} aria-label="Scroll to top" className="fixed bottom-5 right-5 bg-[#3b5bfd] hover:bg-[#2f49d1] text-white w-9 h-9 rounded flex items-center justify-center shadow-md">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
