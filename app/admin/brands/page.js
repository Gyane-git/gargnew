"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, Info, SquarePen, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/v1/brands?include_inactive=1");
      const data = await res.json();
      if (data.success) setBrands(data.brands || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  function getImage(brand) {
    const img = brand?.image_full_url || brand?.image_url || brand?.logo_full_url || brand?.image || brand?.main_image;

    if (!img) return "/no-image.png";

    // full URL
    if (img.startsWith("http")) return img;

    // already correct path
    if (img.startsWith("/uploads")) return img;

    // fallback (old DB data)
    return `/uploads/brands/${img}`;
  }

  useEffect(() => {
    fetchBrands();
  }, []);

  const filteredBrands = brands.filter((brand) => brand.brand_name?.toLowerCase().includes(search.toLowerCase()));

  const totalEntries = filteredBrands.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));

  const paginatedBrands = filteredBrands.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;

  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  const deleteBrand = async () => {
    try {
      const res = await fetch(`/api/v1/brands/${deleteId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Brand deleted successfully");
        fetchBrands();
      } else {
        toast.error("Failed to delete brand");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (id) => router.push(`/admin/brands/edit/${id}`);

  const handleInfo = (brand) => {
    toast.success(`ID: ${brand.id} | ${brand.brand_name}`);
  };

  /* Toggle Top */
  const handleToggleTop = async (id, value) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/v1/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ top: value ? 1 : 0 }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Top brand ${value ? "enabled" : "disabled"}`);
        setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, top: value ? 1 : 0 } : b)));
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  /* Toggle Status */
  const handleToggleStatus = async (id, value) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/v1/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value ? 1 : 0 }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Brand ${value ? "published" : "unpublished"}`);
        setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, status: value ? 1 : 0 } : b)));
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-900">Brands</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Brands</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-blue-900">Brands</h2>
            <Link href="/admin/brands/add" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              + Add Brand
            </Link>
          </div>

          <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>

              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <span>entries</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded px-3 py-1"
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 py-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[650px] border-t">
              <thead>
                <tr className="text-left border-b font-bold">
                  <th className="px-3 py-3">S.N.</th>
                  <th className="px-3 py-3">Image</th>
                  <th className="px-3 py-3">Brand Name</th>
                  <th className="px-3 py-3">Top</th>
                  <th className="px-3 py-3">Publish</th>
                  <th className="px-3 py-3">Order</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedBrands.map((brand, index) => (
                  <tr key={brand.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-4">{(currentPage - 1) * entriesPerPage + index + 1}</td>

                    {/* IMAGE */}
                    <td className="px-6 py-4">
                      <img src={getImage(brand)} alt={brand.brand_name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                    </td>

                    <td className="px-3 py-4">{brand.brand_name || brand.name || `Brand ${brand.id}`}</td>

                    {/* ✅ Top */}
                    <td className="px-3 py-4">
                      <button onClick={() => handleToggleTop(brand.id, brand.top !== 1)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${brand.top === 1 ? "bg-blue-600" : "bg-gray-300"}`}>
                        <span className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition ${brand.top === 1 ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>

                    {/* ✅ Status */}
                    <td className="px-3 py-4">
                      <button onClick={() => handleToggleStatus(brand.id, brand.status !== 1)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${brand.status === 1 ? "bg-blue-600" : "bg-gray-300"}`}>
                        <span className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition ${brand.status === 1 ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>

                    <td className="px-3 py-4">{brand.order_wise}</td>

                    {/* Actions */}
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleInfo(brand)} className="w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl">
                          <Info size={15} />
                        </button>

                        <button onClick={() => handleEdit(brand.id)} className="w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl">
                          <SquarePen size={14} />
                        </button>

                        <button onClick={() => setDeleteId(brand.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 rounded-xl">
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3 border-t">
              <p className="text-sm text-gray-500">
                Showing {startEntry} to {endEntry} of {totalEntries} entries
              </p>

              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border rounded disabled:opacity-40">
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded border text-sm ${currentPage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-100"}`}>
                    {page}
                  </button>
                ))}

                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border rounded disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center text-sm text-gray-500 border-t">
        Copyright © 2026 <span className="font-bold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Barand?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteBrand} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
