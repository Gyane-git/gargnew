"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Info, Trash2, X } from "lucide-react";

// Sample data — replace with API
const sampleSubscribers = [
  { id: 1, email: "sushil@gmail.com",  date: "2026-01-10" },
  { id: 2, email: "suyen@gmail.com",   date: "2026-01-15" },
  { id: 3, email: "prakash@gmail.com", date: "2026-01-18" },
  { id: 4, email: "sushil2@gmail.com", date: "2026-02-01" },
  { id: 5, email: "suyen2@gmail.com",  date: "2026-02-05" },
];

const buildPageList = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const delta = 2;
  const pages = [1];
  const left  = currentPage - delta;
  const right = currentPage + delta;
  if (left > 2) pages.push("...");
  for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
};

// Info Modal
function InfoModal({ subscriber, onClose }) {
  if (!subscriber) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Subscriber Info</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-500">Email:</span>{" "}
            <span className="text-blue-500">{subscriber.email}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Subscribed On:</span>{" "}
            <span className="text-gray-800">{subscriber.date}</span>
          </div>
        </div>
        <div className="flex justify-end px-5 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Modal
function DeleteModal({ subscriber, onConfirm, onCancel }) {
  if (!subscriber) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Delete Subscriber</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-800">{subscriber.email}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={``}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterSubscribers() {
  const [subscribers,    setSubscribers]  = useState(sampleSubscribers);
  const [search,         setSearch]       = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage,    setCurrentPage]  = useState(1);
  const [infoTarget,     setInfoTarget]   = useState(null);
  const [deleteTarget,   setDeleteTarget] = useState(null); 

  // Frontend-only delete
  const handleDelete = () => {
    setSubscribers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // Frontend-only search filter
  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const safePerPage = Math.max(1, entriesPerPage);
  const totalPages  = Math.ceil(filtered.length / safePerPage);
  const startIndex  = (currentPage - 1) * safePerPage;
  const paginated   = filtered.slice(startIndex, startIndex + safePerPage);

  const handleSearch = (value) => { setSearch(value); setCurrentPage(1); };
  const handleEntriesChange = (value) => { setEntriesPerPage(Math.max(1, Number(value))); setCurrentPage(1); };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">

        {/* Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-900">Newsletter Subscribers</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline text-gray-500">
              Dashboard
            </Link>
            <span>/</span>
            <span>Newsletter Subscribers</span>
          </p>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Newsletter Subscribers</h2>
          </div>

          <div className="px-4 sm:px-6 py-5">

            {/* Controls */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <input
                  type="number"
                  value={entriesPerPage}
                  min={1}
                  onChange={(e) => handleEntriesChange(e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center
                             text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Search:</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700
                             focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t border-gray-200 min-w-[500px]">
                <thead>
                  <tr className="text-left text-gray-800 font-bold border-b border-gray-200">
                    <th className="px-3 py-3 border-r border-gray-200 w-16">
                      <div className="flex items-center justify-between">
                        <span>S.N.</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-between">
                        <span>Email</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-36">
                      <div className="flex items-center justify-between">
                        <span>Date</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400">
                        No subscribers found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((subscriber, index) => (
                      <tr
                        key={subscriber.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                      >
                        <td className="px-3 py-3 text-gray-600 border-r border-gray-200">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200">
                          <span className="text-blue-500">{subscriber.email}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {subscriber.date}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setInfoTarget(subscriber)}
                              className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                              title="View Info"
                            >
                              <Info size={14} />
                            </button>
                            <button
                              onClick={``}
                              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                              title="Delete Subscriber"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-5 text-sm text-gray-600 flex-wrap gap-3">
              <span>
                Showing {filtered.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + safePerPage, filtered.length)} of{" "}
                {filtered.length} entries
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                {buildPageList(currentPage, totalPages).map((page, idx) =>
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
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-200">
        Copyright &copy; 2026{" "}
        <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>

      <InfoModal subscriber={infoTarget} onClose={() => setInfoTarget(null)} />
      <DeleteModal
        subscriber={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}