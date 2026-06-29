"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Trash2, Star, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

const buildPageList = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const delta = 2,
    pages = [1];
  const left = currentPage - delta,
    right = currentPage + delta;
  if (left > 2) pages.push("...");
  for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
};

function StarDisplay({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} className={i < full ? "fill-amber-400 text-amber-400" : i === full && half ? "fill-amber-200 text-amber-400" : "fill-gray-200 text-gray-200"} />
        ))}
      </div>
      <span className="text-xs text-gray-500 font-medium">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

export default function ReviewsAndRatings() {
  const [reviews, setReviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch reviews and ratings list
  const fetchReviews = async (page = currentPage, limit = entriesPerPage, q = search) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/customers/reviews/list`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error(data.message || "Failed to load reviews");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage, entriesPerPage, search);
  }, [currentPage, entriesPerPage, search]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/v1/customers/reviews/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review deleted");
        setDeleteTarget(null);
        fetchReviews();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      <div className="flex-1 p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900">Reviews and Ratings</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Reviews and Ratings</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Reviews and Ratings</h2>
            <button onClick={() => fetchReviews()} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>

          <div className="px-6 py-5">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <input
                  type="number"
                  value={entriesPerPage}
                  min={1}
                  onChange={(e) => {
                    setEntriesPerPage(Math.max(1, Number(e.target.value)));
                    setCurrentPage(1);
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Search:</span>
                <input type="text" value={searchInput} placeholder="Name, email, product..." onChange={(e) => setSearchInput(e.target.value)} className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t border-gray-200">
                <thead>
                  <tr className="text-left text-gray-800 font-bold border-b border-gray-200">
                    {["S.N.", "Name", "Email", "Product", "Rating", "Review", "Action"].map((h, i) => (
                      <th key={h} className={`px-3 py-3 ${i < 6 ? "border-r border-gray-200" : ""}`}>
                        <div className="flex items-center justify-between">
                          <span>{h}</span>
                          {i < 6 && <span className="text-gray-400 text-xs">↑↓</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-3 py-3 border-r border-gray-200 last:border-r-0">
                            <div className="h-3 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <Star size={28} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No reviews found</p>
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review, index) => (
                      <tr key={review.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-3 py-3 text-gray-500 text-xs border-r border-gray-200">{startIndex + index + 1}</td>
                        <td className="px-3 py-3 text-gray-800 font-medium border-r border-gray-200">{review.name || "—"}</td>
                        <td className="px-3 py-3 border-r border-gray-200">
                          <span className="text-blue-500 text-xs">{review.email || "—"}</span>
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200">
                          <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{review.product_code || "—"}</span>
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200">
                          <StarDisplay rating={Number(review.rating)} />
                        </td>
                        <td className="px-3 py-3 border-r border-gray-200">
                          <span className="block max-w-xs truncate text-xs text-gray-700" title={review.review_detail}>
                            {review.review_detail}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => setDeleteTarget(review)} className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition" title="Delete">
                            <Trash2 size={14} />
                          </button>
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
                Showing {totalCount === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalCount)} of {totalCount} entries
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition">
                  Previous
                </button>
                {buildPageList(currentPage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <span key={`e-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                      ...
                    </span>
                  ) : (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 border rounded transition ${currentPage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
                      {page}
                    </button>
                  ),
                )}
                <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-200">
        Copyright &copy; 2026 <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>

      <DeleteModal review={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
    </div>
  );
}

function DeleteModal({ review, onConfirm, onCancel, loading }) {
  if (!review) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Review?</h3>
        <p className="text-sm text-gray-400 mb-6">
          Review by <span className="font-semibold text-gray-700">{review.name}</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
