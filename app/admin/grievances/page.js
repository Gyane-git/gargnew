"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Eye, LayoutDashboard, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const loadGrievances = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/v1/grievances", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load grievances.");
        }

        setGrievances(Array.isArray(data.grievances) ? data.grievances : []);
      } catch (err) {
        setError(err.message || "Failed to load grievances.");
      } finally {
        setLoading(false);
      }
    };

    loadGrievances();
  }, []);

  const filtered = useMemo(() => {
    let data = [...grievances];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        [
          row.full_name,
          row.name,
          row.email,
          row.phone,
          row.city,
          row.remarks,
          row.status,
        ]
          .map((value) => String(value || "").toLowerCase())
          .some((value) => value.includes(q)),
      );
    }

    if (sortField) {
      data.sort((a, b) => {
        const aVal = a[sortField] ?? "";
        const bVal = b[sortField] ?? "";
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [grievances, search, sortField, sortOrder]);

  const safeEntries = Math.max(1, entriesPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / safeEntries));
  const startIndex = (currentPage - 1) * safeEntries;
  const currentData = filtered.slice(startIndex, startIndex + safeEntries);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/v1/grievances/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to delete grievance.");
      }

      toast.success("Grievance deleted successfully.");
      setGrievances((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (selectedComplaint?.id === deleteTarget.id) {
        setSelectedComplaint(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete grievance.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const SortableHeader = ({ label, field }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className="text-slate-400" />
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-50 px-6 py-5 border-b border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-800">Grievances</h1>
        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
          <LayoutDashboard size={16} />
          <Link
            href="/admin/dashboard"
            className="text-blue-600 hover:underline"
          >
            Dashboard
          </Link>
          <span>/</span>
          <span>Grievances</span>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-md shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              Customer Grievances
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Show</span>
              <input
                type="number"
                min={1}
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Math.max(1, Number(e.target.value)));
                  setCurrentPage(1);
                }}
                className="w-16 border border-slate-300 rounded px-2 py-1 text-center"
              />
              <span>entries</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 px-6 py-4 flex-wrap">
            <div className="text-sm text-slate-600">
              Showing {filtered.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + safeEntries, filtered.length)} of{" "}
              {filtered.length} entries
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Search:</span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded px-3 py-1.5 text-sm w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                  <SortableHeader label="S.N." field="id" />
                  <SortableHeader label="Name" field="full_name" />
                  <SortableHeader label="Email" field="email" />
                  <SortableHeader label="Phone" field="phone" />
                  <SortableHeader label="City" field="city" />
                  <SortableHeader label="Message" field="status" />
                  <SortableHeader label="Date" field="created_at" />
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      No grievances found.
                    </td>
                  </tr>
                ) : (
                  currentData.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-700">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.full_name || row.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.city || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 capitalize">
                        {row.remarks || "new"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedComplaint(row)}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-600 text-white transition-all duration-200 hover:scale-110 shadow-md"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(row)}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:scale-110 shadow-md"
                            title="Delete Grievance"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedComplaint && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setSelectedComplaint(null)}
            >
              <div
                className="w-full max-w-xl rounded-xl bg-white shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-sky-600 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white">
                    Complaint Details
                  </h2>

                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-white hover:text-red-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Name</p>
                      <p className="font-semibold">
                        {selectedComplaint.full_name || selectedComplaint.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Email</p>
                      <p>{selectedComplaint.email || "-"}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Phone</p>
                      <p>{selectedComplaint.phone || "-"}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">City</p>
                      <p>{selectedComplaint.city || "-"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-2">
                      Message
                    </p>

                    <div className="rounded-lg border bg-gray-50 p-4 text-gray-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {selectedComplaint.remarks}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t px-6 py-4">
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="rounded-lg bg-sky-600 px-5 py-2 text-white hover:bg-sky-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {deleteTarget && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => !deleteLoading && setDeleteTarget(null)}
            >
              <div
                className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delete Grievance
                  </h2>
                  <p className="mt-3 text-sm text-gray-600">
                    Are you sure you want to delete this grievance from{" "}
                    <span className="font-semibold text-gray-800">
                      {deleteTarget.full_name || deleteTarget.name}
                    </span>
                    ?
                  </p>
                </div>
                <div className="flex justify-end gap-3 border-t px-6 py-4">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteLoading}
                    className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 text-sm border rounded disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="px-4 py-2 text-sm border rounded disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
