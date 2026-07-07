"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Info, X, ShieldCheck, ShieldOff, LayoutDashboard, ArrowUpDown } from "lucide-react";
import { toast } from "react-toastify";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/v1/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setFiltered(data.customers);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const result = customers.filter((c) => (c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q));

    setFiltered(result);
    setCurrentPage(1);
  }, [search, customers]);

  const deleteCustomer = async () => {
    try {
      const res = await fetch(`/api/v1/customers/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer deleted");
        fetchCustomers();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (ts) =>
    ts
      ? new Date(ts).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedData = [...filtered].sort((a, b) => {
    if (!sortField) return 0;

    let valA = a[sortField] ?? "";
    let valB = b[sortField] ?? "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalEntries = sortedData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);

  const currentData = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const SortableHeader = ({ label, field }) => (
    <th className="px-5 py-3.5 font-bold text-gray-800 text-sm cursor-pointer select-none" onClick={() => handleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className="text-gray-400" />
      </span>
    </th>
  );

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="bg-[#eef2fb] px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a6b]">Customers</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
            <LayoutDashboard size={14} className="text-gray-400" />
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-500">Customers</span>
          </div>
        </div>
      </div>

      {/* CARD */}
      <div className="bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#1a3a6b]">Customers</h2>
        </div>

        {/* SHOW ENTRIES + SEARCH */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Show</span>
            <select value={entriesPerPage} onChange={handleEntriesChange} className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>customers</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Search:</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-48 outline-none focus:border-[#1a3a6b]" />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px] border-t border-gray-200">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <SortableHeader label="S.N." field="id" />
                <SortableHeader label="Name" field="full_name" />
                <SortableHeader label="Email" field="email" />
                <SortableHeader label="Phone" field="phone" />
                <th className="px-5 py-3.5 font-bold text-gray-800 text-sm">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? "2rem" : "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-gray-400">
                    <p className="text-sm font-medium">No customers found</p>
                  </td>
                </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-gray-700">{startIndex + index + 1}</td>
                    <td className="px-5 py-4 text-gray-700">{item.full_name || "NA"}</td>
                    <td className="px-5 py-4 text-gray-700">{item.email}</td>
                    <td className="px-5 py-4 text-gray-700">{item.phone || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewItem(item)} className="w-8 h-8 flex items-center justify-center text-white bg-sky-500 rounded-full hover:bg-sky-600 transition-colors" title="View">
                          <Info size={15} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="w-8 h-8 flex items-center justify-center text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{totalEntries === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalEntries}</span> entries
          </p>

          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50">
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 5) return true;
                if (page === 1 || page === totalPages) return true;
                return page >= currentPage - 1 && page <= currentPage + 1;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && page - array[index - 1] > 1 && <span className="px-2 text-gray-400">...</span>}
                  <button onClick={() => handlePageChange(page)} className={`w-10 h-10 rounded-lg text-sm font-medium ${currentPage === page ? "bg-[#1a3a6b] text-white" : "border border-gray-300 hover:bg-gray-50"}`}>
                    {page}
                  </button>
                </React.Fragment>
              ))}

            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1a3a6b] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{(viewItem.full_name || "?").charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a3a6b] text-sm">{viewItem.full_name || "—"}</p>
                  <p className="text-xs text-gray-400">{viewItem.email}</p>
                </div>
              </div>
              <button onClick={() => setViewItem(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-red-200 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                {viewItem.is_active !== false ? (
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-100 text-xs font-bold rounded-full px-2.5 py-1">
                    <ShieldCheck size={12} />
                    Active Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-500 border border-red-100 text-xs font-bold rounded-full px-2.5 py-1">
                    <ShieldOff size={12} />
                    Inactive Account
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-800">{viewItem.phone || <span className="text-gray-400 font-normal italic">Not provided</span>}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Gender</p>
                  <p className="text-sm text-center font-semibold text-gray-800">{viewItem.gender || <span className="text-gray-400 font-normal italic">N/A</span>}</p>
                </div>
              </div>
              {viewItem.address && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Address</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-gray-100">{viewItem.address}</p>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-400">
                <span>ID: #{viewItem.id}</span>
                <span>Joined: {formatDate(viewItem.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Customer?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteCustomer} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
