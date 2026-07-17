"use client";

import { useEffect, useState } from "react";
import { Info, Plus, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProductListPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [busyIds, setBusyIds] = useState({});
  const [publishStates, setPublishStates] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  // ── Recursive <option> renderer ──────────────────────────────────────────
  const renderCategoryOptions = (nodes, level = 0) =>
    nodes.flatMap((cat) => [
      <option key={cat.id} value={String(cat.id)}>
        {"— ".repeat(level) + (cat.category_name || cat.name)}
      </option>,
      ...(cat.children?.length ? renderCategoryOptions(cat.children, level + 1) : []),
    ]);

  // ── Fetch products ────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/v1/products?include_inactive=1");
      const data = await res.json();
      const prods = data.products || [];
      setProducts(prods);
      const states = {};
      prods.forEach((p) => {
        states[p.id] = p.status === 1 || p.status === "1";
      });
      setPublishStates(states);
    } catch (err) {
      console.error("Products fetch error:", err);
    }
  };

  // ── Fetch categories as a tree ────────────────────────────────────────────
  useEffect(() => {
    fetchProducts();

    fetch("/api/v1/categories")
      .then((r) => r.json())
      .then((d) => {
        const flat = d.categories || [];
        const map = {};
        const tree = [];
        flat.forEach((cat) => (map[cat.id] = { ...cat, children: [] }));
        flat.forEach((cat) => {
          if (cat.parent_id && map[cat.parent_id]) {
            map[cat.parent_id].children.push(map[cat.id]);
          } else {
            tree.push(map[cat.id]);
          }
        });
        setCategories(tree);
      })
      .catch(console.error);
  }, []);

  // ── Delete product ────────────────────────────────────────────────────────
  const deleteProduct = async () => {
    try {
      const res = await fetch(`/api/v1/products/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  const saveProductStatus = async (product, nextStatus, options = {}) => {
    const { silent = false } = options;
    setBusyIds((prev) => ({ ...prev, [product.id]: true }));
    try {
      const res = await fetch(`/api/v1/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus ? 1 : 0 }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update product status");
      }
      setPublishStates((prev) => ({ ...prev, [product.id]: nextStatus }));
      if (!silent) {
        toast.success(nextStatus ? "Product published" : "Product unpublished");
      }
    } catch (err) {
      if (!silent) {
        toast.error(err.message || "Failed to update product status");
      }
      throw err;
    } finally {
      setBusyIds((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const handlePublishToggle = (product, value) => {
    saveProductStatus(product, value);
  };

  const handleBulkPublish = async (checked) => {
    if (currentItems.length === 0) return;

    const targetItems = currentItems.filter((product) => publishStates[product.id] !== checked);
    if (targetItems.length === 0) {
      toast.success(checked ? "Current page already published" : "Current page already unpublished");
      return;
    }

    try {
      await Promise.all(targetItems.map((product) => saveProductStatus(product, checked, { silent: true })));
      toast.success(checked ? "Current page published" : "Current page unpublished");
    } catch (err) {
      toast.error(err.message || "Bulk update failed");
    }
  };

  // ── Filtering & pagination ────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const name = p.product_name || "";
    const code = p.product_code || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "" || String(p.category_id) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentItems = filteredProducts.slice(startIndex, startIndex + entriesPerPage);
  const bulkPublishState = currentItems.length > 0 && currentItems.every((product) => publishStates[product.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().split("T")[0];
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleInfo = (product) => {
    toast.success(`ID: ${product.id} | ${product.product_name}`);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-6">
      {/* Breadcrumb */}
      <div className="mb-2">
        <p className="text-sm text-gray-500">
          <span className="text-blue-600 cursor-pointer hover:underline">Dashboard</span> / <span className="text-gray-700 font-medium">Products</span>
        </p>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-5">Products</h1>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <span className="text-base font-semibold text-[#1a3c6e]">Products</span>

          {/* Bulk Publish Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => handleBulkPublish(!bulkPublishState)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${bulkPublishState ? "bg-blue-500" : "bg-gray-300"}`}
              title={bulkPublishState ? "Bulk unpublish this page" : "Bulk publish this page"}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  bulkPublishState ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-blue-700 font-semibold text-sm">Bulk Publish Page</span>
          </label>

          {/* Category filter + Add button */}
          <div className="flex items-center gap-3">
            {/* ✅ Nested category select with full tree */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">All Categories</option>
              {renderCategoryOptions(categories)}
            </select>

            <Link href="/admin/products/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition">
              <Plus size={16} />
              Add Product
            </Link>
          </div>
        </div>

        {/* Show entries + Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
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
              className="pl-3 pr-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["S.N.", "Product Code", "Product Name", "Category", "has Variations", "Created", "Publish", "Action"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                    {col}
                    {["Product Code", "Product Name", "Category", "has Variations", "Created"].includes(col) && <span className="ml-1 text-gray-400 text-xs">⇅</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((product, idx) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                  <td className="px-4 py-3 text-gray-600">{startIndex + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{product.product_code}</td>
                  <td className="px-4 py-3 text-gray-800">{product.product_name}</td>
                  <td className="px-4 py-3 text-gray-700">{product.category_name || "Uncategorized"}</td>
                  <td className="px-4 py-3 text-gray-700">{product.has_variations ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(product.created_at)}</td>

                  {/* Publish Toggle */}
                  <td className="px-4 py-3">
                    <div
                      onClick={() => !busyIds[product.id] && handlePublishToggle(product, !publishStates[product.id])}
                      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ${busyIds[product.id] ? "opacity-60 pointer-events-none" : ""} ${publishStates[product.id] ? "bg-blue-500" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${publishStates[product.id] ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Info icon */}
                      <button onClick={() => handleInfo(product)} className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl">
                        <Info size={16} />
                      </button>

                      {/* Edit icon */}
                      <Link href={`/admin/products/edit/${product.id}`} className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                        <SquarePen size={16} />
                      </Link>

                      {/* Delete icon */}
                      {/* <button onClick={() => setDeleteId(product.id)} className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 rounded-xl" title="Delete">
                        <Trash2 size={16} />
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentItems.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No products found</div>}
        </div>

        {/* Footer: Showing info + Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 text-sm text-gray-600">
          <span>
            Showing {filteredProducts.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredProducts.length)} of {filteredProducts.length} entries
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Previous
              </button>

              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded border transition ${currentPage === page ? "bg-blue-600 border-blue-600 text-white font-semibold" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"}`}>
                    {page}
                  </button>
                ),
              )}

              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Copyright */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Copyright © 2026 <span className="font-semibold text-blue-700">Global Tech Nepal Pvt. Ltd.</span>
      </p>

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Product?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteProduct} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
