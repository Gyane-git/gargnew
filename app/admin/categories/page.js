"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Info, SquarePen, Trash, Trash2 } from "lucide-react";
import { ChevronRight } from "lucide-react";

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
        ${checked ? "bg-blue-500" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

//  Category Row Component (recursive for tree) - this is to expand parent category
function CategoryRow({ category, sn, level = 0, onToggleTop, onToggleStatus, onDelete, loadingId }) {
  const [open, setOpen] = useState(false);

  const hasChildren = category.children && category.children.length > 0;
  const isLoading = loadingId === category.id;

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        {/* S.N. */}
        <td className="px-4 py-3 text-sm text-gray-700">{sn}</td>

        {/* Category Image */}
        <td className="px-4 py-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
            {category.image_full_url ? (
              <img src={category.image_full_url} alt={category.category_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No image</div>
            )}
          </div>
        </td>

        {/* Category Name with tree indent */}
        <td className="px-4 py-3 text-sm font-medium text-gray-800">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren && (
              <button onClick={() => setOpen(!open)} className="text-gray-500 hover:text-blue-600 transition-colors">
                <ChevronRight size={22} strokeWidth={4} className={`transition-transform ${open ? "rotate-45" : ""}`} />
              </button>
            )}
            <span className="uppercase tracking-wide">{category.category_name}</span>
          </div>
        </td>

        {/* Set Top Category Toggle → top: 1 or 0 */}
        <td className="px-4 py-3">
          <Toggle checked={category.top === 1} onChange={(val) => onToggleTop(category.id, val)} disabled={isLoading} />
        </td>

        {/* Publish Toggle → status: 1 or 0 */}
        <td className="px-4 py-3">
          <Toggle checked={category.status === 1} onChange={(val) => onToggleStatus(category.id, val)} disabled={isLoading} />
        </td>

        {/* Actions — centered */}
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-3">
            {/* Info */}
            <button onClick={() => toast.success(`ID: ${category.id} | ${category.category_name}`)} className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
              <Info size={16} />
            </button>

            {/* Edit */}
            <Link href={`/admin/categories/edit/${category.id}`} className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-blue-700 text-blue-700 hover:bg-blue-50 transition-colors">
              <SquarePen size={15} />
            </Link>

            {/* Delete */}
            <button onClick={() => onDelete(category.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>

      {/* Recursive children */}
      {open && hasChildren && category.children.map((child, i) => <CategoryRow key={child.id} category={child} sn={`${sn}.${i + 1}`} level={level + 1} onToggleTop={onToggleTop} onToggleStatus={onToggleStatus} onDelete={onDelete} loadingId={loadingId} />)}
    </>
  );
}

//  Main Categories Page
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Build tree for from flat DB rows to child hierarchy
  const buildTree = (data) => {
    const map = {};
    const tree = [];
    data.forEach((cat) => (map[cat.id] = { ...cat, children: [] }));
    data.forEach((cat) => {
      if (cat.parent_id) map[cat.parent_id]?.children.push(map[cat.id]);
      else tree.push(map[cat.id]);
    });
    return tree;
  };

  /* ── Fetch all categories ── */
  const getCategories = async () => {
    try {
      const res = await fetch("/api/v1/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(buildTree(data.categories));
      } else {
        toast.error(data.message || "Failed to fetch categories");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  // Toggle Top Category (top = 1 or 0)
  const handleToggleTop = async (id, value) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/v1/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ top: value ? 1 : 0 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Top category ${value ? "enabled" : "disabled"}`);
        setCategories((prev) => updateNodeInTree(prev, id, { top: value ? 1 : 0 }));
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  // Toggle Publish Status (status = 1 or 0)
  const handleToggleStatus = async (id, value) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/v1/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value ? 1 : 0 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Category ${value ? "published" : "unpublished"}`);
        setCategories((prev) => updateNodeInTree(prev, id, { status: value ? 1 : 0 }));
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  // Delete Category
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/v1/categories/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category deleted successfully");
        getCategories();
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  // Recursively patch one node in the tree (optimistic update)
  const updateNodeInTree = (nodes, targetId, patch) => nodes.map((node) => (node.id === targetId ? { ...node, ...patch } : { ...node, children: updateNodeInTree(node.children || [], targetId, patch) }));

  //  Pagination & Search
  const filtered = categories.filter((cat) => (search ? cat.category_name.toLowerCase().includes(search.toLowerCase()) : true));

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const paginated = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          <span className="text-blue-500 cursor-pointer">Dashboard</span>
          <span className="mx-1">/</span>
          Categories
        </p>
      </div>

      <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
        </div>

        {/* Show Entries + Search Controls */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
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
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-16">
                  <div className="flex items-center gap-1">
                    S.N.
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Image</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                  <div className="flex items-center gap-1">
                    Category Name
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Top Category</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Publish</th>
                {/* Action header — centered */}
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                paginated.map((cat, i) => <CategoryRow key={cat.id} category={cat} sn={(currentPage - 1) * entriesPerPage + i + 1} onToggleTop={handleToggleTop} onToggleStatus={handleToggleStatus} onDelete={setDeleteId} loadingId={loadingId} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Info + Pagination */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {startEntry} to {endEntry} of {totalEntries} entries
          </p>

          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 text-sm rounded border transition-colors ${page === currentPage ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}>
                {page}
              </button>
            ))}

            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Category?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
