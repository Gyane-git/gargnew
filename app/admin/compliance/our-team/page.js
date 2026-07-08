"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowUp, Pencil, Search, Trash2, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function OurTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/v1/our-team?include_inactive=1", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setMembers(Array.isArray(data.teams) ? data.teams : []);
        } else {
          toast.error(data.message || "Failed to fetch team members.");
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch team members.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        String(member.team_name || "").toLowerCase().includes(q) ||
        String(member.team_role || "").toLowerCase().includes(q) ||
        String(member.team_email || "").toLowerCase().includes(q);

      const statusValue = Number(member.status ?? 0);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && statusValue === 1) ||
        (statusFilter === "Inactive" && statusValue === 0);

      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const totalEntries = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentData = filteredMembers.slice(startIndex, startIndex + entriesPerPage);
  const endIndex = totalEntries === 0 ? 0 : Math.min(startIndex + entriesPerPage, totalEntries);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/v1/our-team/${deleteId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Team member deleted successfully.");
        setMembers((prev) => prev.filter((member) => member.id !== deleteId));
      } else {
        toast.error(data.message || "Failed to delete team member.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete team member.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-700">
      <main className="flex-grow p-6 w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#003399]">Our Team</h1>
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <span>Dashboard</span>
            <span className="mx-1">/</span>
            <span>Our Team</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-100 gap-3">
            <h2 className="text-lg font-semibold text-[#003399]">Our Team Members</h2>
            <button onClick={() => router.push("/admin/compliance/our-team/create")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
              Add New
            </button>
          </div>

          <div className="p-5">
            <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Filter by Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-40 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto border-t border-gray-200 min-h-[400px]">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-700 font-semibold">
                    <th className="p-3">S.N.</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Image</th>
                    <th className="p-3">LinkedIn</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        Loading team members...
                      </td>
                    </tr>
                  ) : currentData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        No team members found
                      </td>
                    </tr>
                  ) : (
                    currentData.map((member, index) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors align-top">
                        <td className="p-3 py-4">{startIndex + index + 1}</td>
                        <td className="p-3 py-4 max-w-[150px] whitespace-normal">{member.team_name}</td>
                        <td className="p-3 py-4 max-w-[200px] whitespace-normal">{member.team_role}</td>
                        <td className="p-3 py-4">
                          {member.team_image_full_url ? (
                            <img src={member.team_image_full_url} alt={member.team_name} className="w-10 h-10 object-cover rounded-full border" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </td>
                        <td className="p-3 py-4 text-gray-600 max-w-[250px] whitespace-normal">
                          {member.team_linkedin ? (
                            <a href={member.team_linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-600 break-all">
                              {member.team_linkedin}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 py-4">{member.team_email || "—"}</td>
                        <td className="p-3 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${Number(member.status) === 1 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            {Number(member.status) === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => router.push(`/admin/compliance/our-team/${member.id}`)} className="w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100" title="Edit">
                              <Pencil size={15} />
                            </button>

                            <button onClick={() => setDeleteId(member.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 rounded-xl hover:bg-red-100" title="Delete">
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{totalEntries === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalEntries}</span> entries
              </p>

              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-lg text-sm font-medium transition ${currentPage === page ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-slate-50 py-4 px-6 text-center text-sm text-[#003399] relative">
        <p>
          Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
        </p>
        <button className="absolute right-6 bottom-4 bg-[#4B49F3] hover:bg-blue-700 text-white p-2 rounded shadow-md transition-colors">
          <ArrowUp size={20} />
        </button>
      </footer>

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Team Member?</h3>
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
