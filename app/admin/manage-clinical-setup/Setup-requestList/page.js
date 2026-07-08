"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, ArrowUpDown } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SetupRequestListPage() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/clinic/clinic-setup/requests");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load requests");
      setRequests(data.requests || []);
      setFiltered(data.requests || []);
    } catch (error) {
      toast.error(error.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const result = requests.filter(
      (r) =>
        (r.full_name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.city || "").toLowerCase().includes(q) ||
        String(r.id || "")
          .toLowerCase()
          .includes(q),
    );

    setFiltered(result);
    setCurrentPage(1);
  }, [search, requests]);

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
    <th className="px-3 py-3 font-bold text-gray-800 cursor-pointer select-none" onClick={() => handleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className="text-gray-400" />
      </span>
    </th>
  );

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="bg-[#eef2fb] px-6 py-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#1a3a6b]">Clinic Setup Requests</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
          <LayoutDashboard size={14} className="text-gray-400" />
          <Link href="/admin/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-500">Clinic Setup Requests</span>
        </div>
      </div>

      {/* CARD */}
      <div className="bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#1a3a6b]">Requests</h2>
        </div>

        {/* SHOW ENTRIES + SEARCH */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Show</span>
            <select value={entriesPerPage} onChange={handleEntriesChange} className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Search:</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-48 outline-none focus:border-[#1a3a6b]" />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px] border-t border-gray-200">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <SortableHeader label="S.N." field="id" />
                <SortableHeader label="Full Name" field="full_name" />
                <SortableHeader label="Email" field="email" />
                <SortableHeader label="Phone" field="phone" />
                <SortableHeader label="City" field="city" />
                <SortableHeader label="Budget" field="budget" />
                <SortableHeader label="Remarks" field="remarks" />
                <SortableHeader label="Request Date" field="created_at" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    Loading requests...
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((req, index) => (
                  <tr key={req.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors align-top">
                    <td className="px-3 py-4 text-gray-700">{startIndex + index + 1}</td>
                    <td className="px-3 py-4 text-gray-700">{req.full_name}</td>
                    <td className="px-3 py-4 text-gray-700">{req.email}</td>
                    <td className="px-3 py-4 text-gray-700">{req.phone}</td>
                    <td className="px-3 py-4 text-gray-700">{req.city || ""}</td>
                    <td className="px-3 py-4 text-gray-700">{req.budget || ""}</td>
                    <td className="px-3 py-4 text-gray-700 max-w-[280px]">
                      <div className="line-clamp-3 whitespace-pre-wrap break-words">{req.remarks || ""}</div>
                    </td>
                    <td className="px-3 py-4 text-gray-700">{req.created_at ? new Date(req.created_at).toISOString().slice(0, 10) : ""}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    No setup requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                <span key={page} className="flex items-center">
                  {index > 0 && page - array[index - 1] > 1 && <span className="px-2 text-gray-400">...</span>}
                  <button onClick={() => handlePageChange(page)} className={`w-10 h-10 rounded-lg text-sm font-medium ${currentPage === page ? "bg-[#1a3a6b] text-white" : "border border-gray-300 hover:bg-gray-50"}`}>
                    {page}
                  </button>
                </span>
              ))}

            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-200">
        Copyright &copy; 2026 <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
