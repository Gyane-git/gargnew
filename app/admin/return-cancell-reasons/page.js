"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Edit2, Trash2 } from "lucide-react";

const CANCEL_REASONS_API = "/api/cancel-reasons";

// Sample data — remove when API is connected
const SAMPLE_REASONS = [
  {
    id: 1,
    reason: "Sushil requested cancellation",
    type: "cancel",
    for: "customer",
    publish: true,
  },
  {
    id: 2,
    reason: "Suyen found cheaper alternative",
    type: "cancel",
    for: "customer",
    publish: true,
  },
  {
    id: 3,
    reason: "Prakash item not available",
    type: "return",
    for: "supplier",
    publish: false,
  },
];

export default function OrderCancelReasons() {
  const [reasons, setReasons] = useState(SAMPLE_REASONS);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchReasons() {
      try {
        const res = await fetch(CANCEL_REASONS_API);
        const data = await res.json();
        if (data.success) {
          setReasons(data.reasons || []);
        }
      } catch (err) {
        console.error("Failed to fetch cancel reasons:", err);
      }
    }
    fetchReasons();
  }, []);

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const res = await fetch(`${CANCEL_REASONS_API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReasons((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, publish: !currentStatus } : r,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to update publish status:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this reason?")) return;
    try {
      const res = await fetch(`${CANCEL_REASONS_API}/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setReasons((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete reason:", err);
    }
  };

  const handleEdit = (id) => {
    // TODO: open edit modal or navigate to edit page
  };

  const filteredReasons = reasons.filter(
    (r) =>
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.for.toLowerCase().includes(search.toLowerCase()),
  );

  const totalEntries = filteredReasons.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentItems = filteredReasons.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

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

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      <div className="flex-1 p-6">
        {/* Page Title + Breadcrumb */}
        <div className="mb-4">
          <h1 className="text-2xl font-normal text-gray-900">
            Order Cancel Reasons
          </h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Cancel Reasons</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Order Cancel Reasons
            </h2>
            <Link
              href="/admin/cancel-reasons/add"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Add Reason
            </Link>
          </div>

          <div className="px-6 py-5">
            {/* Show Entries + Search */}
            <div className="flex items-center justify-between mb-4">
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
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Table */}
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
                    {/* <th className="px-3 py-3 border-r border-gray-200 w-28">
                      <span>Publish</span>
                    </th> */}
                    <th className="px-3 py-3 w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-gray-400 border-b border-gray-200"
                      >
                        No cancel reasons found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                      >
                        <td className="px-3 py-4 text-gray-600 border-r border-gray-200">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {item.reason}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {item.type}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {item.for}
                        </td>
                        {/* <td className="px-3 py-4 border-r border-gray-200">
                          <button
                            onClick={() =>
                              handleTogglePublish(item.id, item.publish)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              item.publish ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                item.publish ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td> */}
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(item.id)}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 transition"
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

            {/* Showing entries + Pagination */}
            <div className="flex items-center justify-between mt-5 text-sm text-gray-600">
              <span>
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, totalEntries)} of{" "}
                {totalEntries} entries
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
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-gray-400 select-none"
                    >
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
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

      {/* Copyright Footer */}
      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-300">
        Copyright &copy; 2026{" "}
        <span className="font-bold text-gray-700">
          Global Tech Nepal Pvt. Ltd.
        </span>
      </footer>
    </div>
  );
}