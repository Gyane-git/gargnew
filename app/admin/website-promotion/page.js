"use client";

import { Edit2, Info, LayoutDashboard, Plus, Trash2 } from "lucide-react";

export default function PromotionPage() {
  return (
    <div className=" bg-[#eef3fb] flex flex-col">
      {/* Content */}
      <div className="px-6 pt-5 pb-10">
        {/* Title */}

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

            <button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white px-5 py-2 rounded-md flex items-center gap-2 font-medium">
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
                  <td className="border px-3 py-4">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Desktop</span>

                    <div className="mt-3">
                      <img src="/no-image.png" alt="" className="w-6 h-6 border" />
                    </div>
                  </td>

                  {/* Mobile */}
                  <td className="border px-3 py-4">
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Mobile</span>

                    <div className="mt-3">
                      <img src="/no-image.png" alt="" className="w-6 h-6 border" />
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

                      <Edit2 className="w-6 h-6 text-blue-600 cursor-pointer" />

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
    </div>
  );
}
