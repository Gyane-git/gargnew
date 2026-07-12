"use client";

import { Info, LayoutDashboard, PenBox, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

export default function PromotionPage() {
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [product, setProduct] = useState("");

  const [desktopImage, setDesktopImage] = useState(null);
  const [mobileImage, setMobileImage] = useState(null);

  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const handleRemoveDesktopImage = () => {
    if (desktopImage) {
      URL.revokeObjectURL(desktopImage);
    }

    setDesktopImage(null);

    if (desktopInputRef.current) {
      desktopInputRef.current.value = "";
    }
  };

  const handleRemoveMobileImage = () => {
    if (mobileImage) {
      URL.revokeObjectURL(mobileImage);
    }

    setMobileImage(null);

    if (mobileInputRef.current) {
      mobileInputRef.current.value = "";
    }
  };

  const resetPromotionForm = () => {
    setProduct("");
    if (desktopImage) {
      URL.revokeObjectURL(desktopImage);
    }
    setDesktopImage(null);

    if (desktopInputRef.current) {
      desktopInputRef.current.value = "";
    }

    if (mobileImage) {
      URL.revokeObjectURL(mobileImage);
    }
    setMobileImage(null);

    if (mobileInputRef.current) {
      mobileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    resetPromotionForm();
    setShowPromotionModal(false);
  };
  return (
    <div className=" bg-[#eef3fb] flex flex-col">
      {/* Content */}
      <div className="px-6 pt-5 pb-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#18498f]">Promotion</h1>
          <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            <LayoutDashboard className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Dashboard</span>
            <span className="mx-1">/</span>
            <span className="text-gray-400">Promoion</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded shadow-lg mt-6">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-5">
            <h2 className="text-lg font-semibold text-[#18498f]">Promotion Files</h2>

            <button onClick={() => setShowPromotionModal(true)} className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white px-5 py-2 rounded-md flex items-center gap-2 font-medium">
              <Plus className="w-5 h-5" />
              Add Promotion
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto p-5">
            <table className="w-full border-gray-300">
              <thead>
                <tr className="bg-[#f5f5f5]">
                  <th className="border px-3 py-3 text-left">S.N.</th>
                  <th className="border px-3 py-3 text-left">Product Code</th>
                  <th className="border px-3 py-3 text-left">Desktop Media</th>
                  <th className="border px-3 py-3 text-left">Mobile Image</th>
                  <th className="border px-3 py-3 text-left">Offer</th>
                  <th className="border px-3 py-3 text-left">Publish</th>
                  <th className="border px-3 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border px-3 py-6">1</td>

                  <td className="border px-3 py-6 font-semibold">P00268</td>

                  {/* Desktop */}
                  <td className="border px-3 py-4 text-center">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Desktop</span>

                    <div className="mt-3 flex justify-center">
                      <img src="/images/profile.png" alt="" className="w-32 h-32 border" />
                    </div>
                  </td>

                  {/* Mobile */}
                  <td className="border px-3 py-4 text-center">
                    <span className="bg-green-600 text-white text-center text-xs px-2 py-1 rounded">Mobile</span>

                    <div className="mt-3 flex justify-center">
                      <img src="/images/profile.png" alt="" className="w-32 h-32 border" />
                    </div>
                  </td>

                  {/* Offer */}
                  <td className="border px-3 py-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />

                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 after:absolute after:left-[2px] after:top-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </td>

                  {/* Publish */}
                  <td className="border px-3 py-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />

                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 after:absolute after:left-[2px] after:top-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </td>

                  {/* Action */}
                  <td className="border px-3 py-6">
                    <div className="flex items-center gap-4">
                      <Info className="w-6 h-6 text-sky-500 cursor-pointer" />

                      <PenBox className="w-6 h-6 text-blue-600 cursor-pointer" />

                      <Trash2 className="w-6 h-6 text-red-500 cursor-pointer" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-300 bg-[#eef3fb] py-6 text-center text-[18px]">
        Copyright © 2026 <span className="font-bold text-[#18498f]">Global Tech Nepal Pvt. Ltd.</span>
      </div>
      <AnimatePresence>
        {showPromotionModal && (
          <motion.div className="fixed inset-0 z-[9999] flex items-start justify-center pt-5 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.25 }} className="w-[450px] max-h-[90vh] bg-white rounded-md shadow-xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-300">
                <h2 className="text-[18px] font-normal text-gray-700">Add Promotion</h2>

                <button onClick={() => setShowPromotionModal(false)} className="text-gray-600 hover:text-black text-xl">
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Desktop */}
                <div>
                  <label className="block text-[15px] font-semibold text-gray-700">Desktop Image / Video</label>

                  <p className="text-[13px] text-gray-500 mb-2">(Shown on desktop website)</p>

                  <input
                    ref={desktopInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setDesktopImage(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:border file:border-gray-300 file:bg-gray-100 file:text-gray-700 file:cursor-pointer border border-gray-300 rounded"
                  />
                  {desktopImage && (
                    <div className="mt-3 flex justify-center">
                      <div className="relative inline-block">
                        <img src={desktopImage} alt="Desktop Preview" className="w-48 h-28 object-contain border rounded" />

                        <button type="button" onClick={handleRemoveDesktopImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600 shadow">
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[15px] font-semibold text-gray-700">Mobile Image</label>

                  <p className="text-[13px] text-gray-500 mb-2">(Shown on mobile devices)</p>
                  <input
                    ref={mobileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setMobileImage(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:border file:border-gray-300 file:bg-gray-100 file:text-gray-700 file:cursor-pointer border border-gray-300 rounded"
                  />
                  {mobileImage && (
                    <div className="mt-3 flex justify-center">
                      <div className="relative inline-block">
                        <img src={mobileImage} alt="Mobile Preview" className="w-32 h-32 object-contain border rounded" />

                        <button type="button" onClick={handleRemoveMobileImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600 shadow">
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product */}
                <div>
                  <label className="block text-[15px] font-semibold text-gray-700 mb-2">Product</label>

                  <select value={product} onChange={(e) => setProduct(e.target.value)} className="w-full h-[42px] border border-gray-300 rounded px-3 text-gray-600 outline-none focus:border-blue-500">
                    <option value="" disabled>
                      Select Product
                    </option>
                    <option value="product1">Product 1</option>
                    <option value="product2">Product 2</option>
                    <option value="product3">Product 3</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-300 px-4 py-3 flex justify-end gap-2 bg-white">
                <button className="bg-[#198754] hover:bg-[#157347] text-white px-4 py-2 rounded text-[15px] font-medium">Save Promotion</button>

                <button onClick={handleCancel} className="bg-[#6c757d] hover:bg-[#5c636a] text-white px-4 py-2 rounded text-[15px] font-medium">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
