"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Info, SquarePen, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function OfferBannerList() {
  const [offerBanners, setOfferBanners] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const router = useRouter();

  const fetchOfferBanners = async () => {
    try {
      const res = await fetch("/api/v1/banners");
      const data = await res.json();
      if (data.success) {
        // Filter only offer banners (is_offer === 1)
        setOfferBanners(data.banners.filter((b) => b.is_offer === 1));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const deleteOfferBanner = async () => {
    try {
      const res = await fetch(`/api/v1/banners/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Offer banner deleted successfully");
        fetchOfferBanners();
      } else {
        toast.error("Failed to delete offer banner");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (id) => router.push(`/admin/offer-banners/edit/${id}`);

  const handleInfo = (banner) => {
    toast.success(`ID: ${banner.id} | ${banner.product_code}`);
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/v1/banners/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus ? 1 : 0,
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchOfferBanners();
        toast.success("Status updated successfully");
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const getImage = (banner) => {
    if (banner.file_path) return banner.file_path.startsWith("http") ? banner.file_path : `/uploads/carousel/${banner.file_path}`;
    if (banner.mobile_file_path) return `/uploads/carousel/${banner.mobile_file_path}`;
    return "/no-image.png";
  };

  useEffect(() => {
    fetchOfferBanners();
  }, []);

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a3a6b]">Offer Banner Management</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your offer banner collection</p>
      </div>

      {/* LIST */}
      <div className="px-4 sm:px-6 py-5 overflow-x-auto">
        <table className="w-full text-sm min-w-[650px] border-t">
          <thead>
            <tr className="text-left border-b font-bold">
              <th className="px-3 py-3">S.N.</th>
              <th className="px-3 py-3">Image</th>
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Product Code</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {offerBanners.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400">
                  No offer banners available
                </td>
              </tr>
            ) : (
              offerBanners.map((banner, index) => (
                <tr key={banner.id} className="border-b hover:bg-gray-50">
                  {/* S.N */}
                  <td className="px-3 py-4">{index + 1}</td>

                  {/* IMAGE */}
                  <td className="px-3 py-4">
                    <div className="w-12 h-12 relative">
                      <Image src={getImage(banner)} alt={banner.product_code} width={48} height={48} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    </div>
                  </td>

                  {/* ID */}
                  <td className="px-3 py-4 font-mono text-xs text-gray-500">{banner.id}</td>

                  {/* PRODUCT CODE */}
                  <td className="px-3 py-4 font-semibold text-gray-800">{banner.product_code}</td>

                  {/* STATUS TOGGLE */}
                  <td className="px-3 py-4">
                    <button onClick={() => handleToggleStatus(banner.id, banner.status !== 1)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${banner.status === 1 ? "bg-blue-600" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition ${banner.status === 1 ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-3 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleInfo(banner)} className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl">
                        <Info size={15} />
                      </button>

                      <button onClick={() => handleEdit(banner.id)} className="w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl">
                        <SquarePen size={14} />
                      </button>

                      <button onClick={() => setDeleteId(banner.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 rounded-xl">
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-between mt-5 text-sm">
          <span>Showing {offerBanners.length} entries</span>
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Offer Banner?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteOfferBanner} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
