"use client";
import React, { useState } from "react";
import { ChevronUp, ChevronDown, Image as ImageIcon, ArrowUp, Edit2, Edit, SquarePen, Trash, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { teamMembers } from "@/lib/teamMembers";

export default function OurTeam() {
  const [members, setMembers] = useState(teamMembers);
  const [deleteId, setDeleteId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const filteredMembers = members.filter((member) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Active") return member.status;
    if (statusFilter === "Inactive") return !member.status;
    return true;
  });

  const deleteMember = () => {
    setMembers((prevMembers) => prevMembers.filter((member) => member.id !== deleteId));

    setDeleteId(null);
  };

  // Pagination Logic Calculations
  const totalEntries = filteredMembers.length;
  10;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  // Get current entries slice
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const currentData = filteredMembers.slice(startIndex, endIndex);

  // Handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-700">
      <main className="flex-grow p-6 w-full max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#003399]">Our Team</h1>
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <span className="text-gray-400">🎨</span>
            <span>Dashboard</span>
            <span className="mx-1">/</span>
            <span>Our Team</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#003399]">Our Team Members</h2>
            <button onClick={() => router.push(`/admin/compliance/our-team/create`)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
              Add New
            </button>
          </div>

          <div className="p-5">
            {/* Filters and Controls */}
            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-600">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 outline-none focus:border-blue-500 bg-white"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>

                <select value={entriesPerPage} onChange={handleEntriesChange} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <span>entries</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <label className="mr-2">Search:</label>
                <input type="text" className="border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-blue-500 w-48" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border-t border-gray-200 min-h-[400px]">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-700 font-semibold">
                    <th className="p-3">S.N.</th>
                    <th className="p-3 cursor-pointer select-none">
                      <div className="flex items-center gap-1">
                        Name <SortIcons />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none">
                      <div className="flex items-center gap-1">
                        Role <SortIcons />
                      </div>
                    </th>
                    <th className="p-3">Image</th>
                    <th className="p-3 cursor-pointer select-none">
                      <div className="flex items-center gap-1">
                        LinkedIn <SortIcons />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none">
                      <div className="flex items-center gap-1">
                        Email <SortIcons />
                      </div>
                    </th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Render currentData instead of the whole array */}
                  {currentData.map((member, index) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors align-top">
                      <td className="p-3 py-4">{startIndex + index + 1}</td>
                      <td className="p-3 py-4 max-w-[150px] whitespace-normal">{member.name}</td>
                      <td className="p-3 py-4 max-w-[200px] whitespace-normal">{member.role}</td>
                      <td className="p-3 py-4">
                        <div className="w-6 h-6 text-gray-300">
                          <ImageIcon size={20} />
                        </div>
                      </td>
                      <td className="p-3 py-4 text-gray-600">
                        {member.linkedin ? (
                          <a href={member.linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-600 max-w-[250px] block truncate">
                            {member.linkedin}
                          </a>
                        ) : null}
                      </td>
                      <td className="p-3 py-4">{member.email}</td>
                      <td className="p-3 py-4">
                        <ToggleSwitch isActive={member.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => router.push(`/admin/compliance/our-team/${member.id}`)} className="w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100">
                            <SquarePen size={15} />
                          </button>

                          <button onClick={() => setDeleteId(member.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 rounded-xl">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{totalEntries === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalEntries}</span> entries
              </p>

              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
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

                      <button onClick={() => handlePageChange(page)} className={`w-10 h-10 rounded-lg text-sm font-medium transition ${currentPage === page ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}>
                        {page}
                      </button>
                    </React.Fragment>
                  ))}

                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-slate-50 py-4 px-6 text-center text-sm text-[#003399] relative">
        <p>
          Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
        </p>
        <button className="absolute right-6 bottom-4 bg-[#4B49F3] hover:bg-blue-700 text-white p-2 rounded shadow-md transition-colors">
          <ArrowUp size={20} />
        </button>
      </footer>

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Barand?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteMember} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
const SortIcons = () => (
  <div className="flex flex-col text-gray-300">
    <ChevronUp size={10} className="mb-[-2px]" />
    <ChevronDown size={10} className="mt-[-2px]" />
  </div>
);

const ToggleSwitch = ({ isActive }) => (
  <div className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isActive ? "bg-blue-600" : "bg-gray-300"}`}>
    <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${isActive ? "translate-x-5" : ""}`}></div>
  </div>
);
