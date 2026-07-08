"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Pencil, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

const emptyForm = {
  reasonName: "",
  reasonType: "",
  reasonFor: "",
};

export default function OrderCancelReasons() {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingReason, setEditingReason] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const res = await fetch("/api/v1/order-cancel-reasons", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setReasons(Array.isArray(data.reasons) ? data.reasons : []);
        } else {
          toast.error(data.message || "Failed to load reasons.");
        }
      } catch (error) {
        console.error("Failed to fetch cancel reasons:", error);
        toast.error("Failed to load reasons.");
      } finally {
        setLoading(false);
      }
    };

    fetchReasons();
  }, []);

  const filteredReasons = useMemo(() => {
    const q = search.toLowerCase();
    return reasons.filter((reason) => {
      const reasonName = String(reason.reason_name || "").toLowerCase();
      const reasonType = String(reason.reason_type || "").toLowerCase();
      const reasonFor = String(reason.reason_for || "").toLowerCase();
      return reasonName.includes(q) || reasonType.includes(q) || reasonFor.includes(q);
    });
  }, [reasons, search]);

  const totalEntries = filteredReasons.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentItems = filteredReasons.slice(startIndex, startIndex + entriesPerPage);

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) {
      pages.push(i);
    }
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const openEditModal = (reason) => {
    setEditingReason(reason);
    setFormData({
      reasonName: reason.reason_name || "",
      reasonType: reason.reason_type || "",
      reasonFor: reason.reason_for || "",
    });
  };

  const closeEditModal = () => {
    setEditingReason(null);
    setFormData(emptyForm);
    setSaving(false);
  };

  const handleEditChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingReason?.id) return;

    const reasonName = String(formData.reasonName || "").trim();
    const reasonType = String(formData.reasonType || "").trim();
    const reasonFor = String(formData.reasonFor || "").trim();

    if (!reasonName || !reasonType || !reasonFor) {
      toast.error("Please fill all fields.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/v1/order-cancel-reasons/${editingReason.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          reasonName,
          reasonType,
          reasonFor,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Reason updated successfully.");
        setReasons((prev) =>
          prev.map((reason) =>
            reason.id === editingReason.id
              ? {
                  ...reason,
                  reason_name: reasonName,
                  reason_type: reasonType.toLowerCase(),
                  reason_for: reasonFor.toLowerCase(),
                }
              : reason,
          ),
        );
        closeEditModal();
      } else {
        toast.error(data.message || "Failed to update reason.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reason) => {
    if (!confirm(`Delete "${reason.reason_name}"?`)) return;

    setDeletingId(reason.id);
    try {
      const res = await fetch(`/api/v1/order-cancel-reasons/${reason.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Reason deleted successfully.");
        setReasons((prev) => prev.filter((item) => item.id !== reason.id));
      } else {
        toast.error(data.message || "Failed to delete reason.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      <div className="flex-1 p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-normal text-gray-900">Order Cancel Reasons</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Cancel Reasons</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Order Cancel Reasons</h2>
            <Link
              href="/admin/add-reason"
              className="px-4 py-2 bg-blue-600 text-white font-normal rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Add Reason
            </Link>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <input
                  type="number"
                  value={entriesPerPage}
                  min={1}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Search:</span>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 pr-3 py-1 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t border-gray-200">
                <thead>
                  <tr className="text-left text-gray-800 font-bold border-b border-gray-200">
                    <th className="px-3 py-3 border-r border-gray-200 w-20">
                      <div className="flex items-center justify-between gap-1">
                        <span>S.N.</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-between gap-1">
                        <span>Reason</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-32">
                      <div className="flex items-center justify-between gap-1">
                        <span>Type</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-32">
                      <div className="flex items-center justify-between gap-1">
                        <span>For</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-40">Created</th>
                    <th className="px-3 py-3 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 border-b border-gray-200">
                        Loading reasons...
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 border-b border-gray-200">
                        No cancel reasons found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-3 py-4 text-gray-600 border-r border-gray-200">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {item.reason_name || "—"}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {item.reason_type || "—"}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {item.reason_for || "—"}
                        </td>
                        <td className="px-3 py-4 text-gray-500 border-r border-gray-200">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="text-red-600 hover:text-red-800 transition disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-5 text-sm text-gray-600 gap-4 flex-wrap">
              <span>
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Previous
                </button>

                {getPaginationPages().map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Reason</h3>
              <button type="button" onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 px-5 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Reason Name</label>
                <input
                  type="text"
                  name="reasonName"
                  value={formData.reasonName}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Reason Type</label>
                <select
                  name="reasonType"
                  value={formData.reasonType}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="return">Return</option>
                  <option value="cancel">Cancel</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Reason For</label>
                <select
                  name="reasonFor"
                  value={formData.reasonFor}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="supplier">Supplier</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Update Reason"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-300">
        Copyright &copy; 2026{" "}
        <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
