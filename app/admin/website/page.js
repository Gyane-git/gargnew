"use client";

import { useState, useRef } from "react";

function TextField({ required, ...props }) {
  return <input type="text" className="w-full border border-gray-300 rounded px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400" {...props} />;
}

export default function EcommerceWebsiteDataPage() {
  const [companyName, setCompanyName] = useState("Garg Dental");
  const [primaryEmail, setPrimaryEmail] = useState("info@gargdental.com");
  const [secondaryEmail, setSecondaryEmail] = useState("ecommerce@gagrdental.com");
  const [whatsappNumber, setWhatsappNumber] = useState("9762875051");
  const [primaryPhone, setPrimaryPhone] = useState("01-4536276");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("P88H+RFX, Gairidhara Rd, Kathmandu 23690");
  const [websiteLink, setWebsiteLink] = useState("https://dentalnepal.com/");
  const [freeShipping, setFreeShipping] = useState("apply");
  const [minAmountOutside, setMinAmountOutside] = useState("100000000");
  const [minAmountInside, setMinAmountInside] = useState("5000");
  const [categoryDisplayCount, setCategoryDisplayCount] = useState("7");
  const [mapUrl, setMapUrl] = useState('<iframe src="https://www.google.com/maps/embe');

  const [headerLogoName, setHeaderLogoName] = useState("No file chosen");
  const [footerLogoName, setFooterLogoName] = useState("No file chosen");

  const [headerLogo, setHeaderLogo] = useState(null);
  const [footerLogo, setFooterLogo] = useState(null);

  const headerLogoRef = useRef(null);
  const footerLogoRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    if (type === "header") {
      setHeaderLogo(imageUrl);
      setHeaderLogoName(file.name);
    } else {
      setFooterLogo(imageUrl);
      setFooterLogoName(file.name);
    }
  };

  const removeImage = (type) => {
    if (type === "header") {
      setHeaderLogo(null);
      setHeaderLogoName("No file chosen");

      if (headerLogoRef.current) {
        headerLogoRef.current.value = "";
      }
    } else {
      setFooterLogo(null);
      setFooterLogoName("No file chosen");

      if (footerLogoRef.current) {
        footerLogoRef.current.value = "";
      }
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

          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              <div>
                <label>
                  Company Name <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
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
                {footerLogo && (
                  <div className="mt-4 relative inline-block">
                    <img src={footerLogo} alt="Footer Preview" className="w-32 h-32 border rounded-lg object-contain bg-white" />

                    <button type="button" onClick={() => removeImage("footer")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow">
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label>Secondary Email</label>
                <TextField value={secondaryEmail} onChange={(e) => setSecondaryEmail(e.target.value)} />
              </div>

              <div>
                <label>
                  Primary Phone <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} />
              </div>

              <div>
                <label>
                  Company Address <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
              </div>

              <div>
                <label>
                  Free Shipping options <span className="text-red-600 text-lg">*</span>
                </label>
                <div className="flex flex-col gap-2 mt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="radio" name="freeShipping" checked={freeShipping === "dont"} onChange={() => setFreeShipping("dont")} className="accent-blue-600" />
                    Don&apos;t Apply Free Shipping Threshold
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="radio" name="freeShipping" checked={freeShipping === "apply"} onChange={() => setFreeShipping("apply")} className="accent-blue-600" />
                    Apply Free Shipping Threshold
                  </label>
                </div>
              </div>

              <div>
                <label>
                  Free Shipping Minimum Amount (Inside of Valley) <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={minAmountInside} onChange={(e) => setMinAmountInside(e.target.value)} />
              </div>

              <div className="col-span-2">
                <label>
                  Map URL <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
              </div>
            </div>

            {/* Right column */}
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
                {headerLogo && (
                  <div className="mt-4 relative inline-block">
                    <img src={headerLogo} alt="Header Preview" className="w-32 h-32 border rounded-lg object-contain bg-white" />

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
                <TextField required={true} type="email" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
              </div>

              <div>
                <label>
                  Whatsapp Number <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
              </div>

              <div>
                <label>Secondary Phone</label>
                <TextField value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} />
              </div>

              <div>
                <label>
                  Website Link <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} />
              </div>

              <div>
                <label>
                  Free Shipping Minimum Amount (Out of Valley)<span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={minAmountOutside} onChange={(e) => setMinAmountOutside(e.target.value)} />
              </div>

              <div>
                <label>
                  No of Category display <span className="text-red-600 text-lg">*</span>
                </label>
                <TextField required={true} value={categoryDisplayCount} onChange={(e) => setCategoryDisplayCount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between mt-10">
            <button type="button" className="bg-[#1e6b3c] hover:bg-[#175a31] text-white text-sm font-medium px-5 py-2.5 rounded">
              Update Website Details
            </button>
            <button type="button" className="bg-[#6c757d] hover:bg-[#5c636a] text-white text-sm font-medium px-6 py-2.5 rounded">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500 relative">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>

      {/* Scroll to top button */}
      <button type="button" onClick={scrollToTop} aria-label="Scroll to top" className="fixed bottom-5 right-5 bg-[#3b5bfd] hover:bg-[#2f49d1] text-white w-9 h-9 rounded flex items-center justify-center shadow-md">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
