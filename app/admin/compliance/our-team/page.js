"use client";
import React, { useState } from "react";
import { ChevronUp, ChevronDown, Image as ImageIcon, ArrowUp } from "lucide-react";

// Sample data - expanded slightly to properly demonstrate pagination
const teamMembers = [
  { sn: 1, name: "Aarju Adhikari", role: "Sr. Officer-Marketing & Education", linkedin: "", email: "aarju.adhikari@gargdental.com", status: true },
  { sn: 2, name: "Anil Kumar Shah", role: "Sr. Officer-Sales & Marketing", linkedin: "", email: "anil.shah@gargdental.com", status: true },
  { sn: 3, name: "Balkrishna Shrestha", role: "Deputy Manager-", linkedin: "", email: "balkrishna.shrestha@gargdental.com", status: true },
  { sn: 4, name: "Bikash Tamang", role: "Officer - Sales", linkedin: "", email: "bikash@gargdental.com", status: false },
  { sn: 5, name: "Dipendra Thapa", role: "Marketing Executive", linkedin: "", email: "dipendra@gargdental.com", status: true },
  { sn: 6, name: "Hari Bahadur", role: "Support Staff", linkedin: "", email: "hari@gargdental.com", status: true },
  { sn: 7, name: "Santosh Kuikel", role: "Sr. Manager - Sales & Support", linkedin: "", email: "santosh.kuikel@gargdental.com", status: true },
  { sn: 8, name: "Shital Gautam", role: "Coordinator-Sales & Marketing", linkedin: "https://linkedin.com/in/shital", email: "shital.gautam@gargdental.com", status: true },
  { sn: 9, name: "Sunil Kumar Pandit Chhetri", role: "Sr. Officer-Sales & Marketing", linkedin: "", email: "sunil.pandit@gargdental.com", status: true },
  { sn: 10, name: "Tika Hang Limbu", role: "Manager-Marketing", linkedin: "", email: "tika.limbu@gargdental.com", status: true },
];

export default function OurTeam() {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5); // Defaulted to 5 as requested

  // Pagination Logic Calculations
  const totalEntries = teamMembers.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  // Get current entries slice
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const currentData = teamMembers.slice(startIndex, endIndex);

  // Handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing entries count
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Add New</button>
          </div>

          <div className="p-5">
            {/* Filters and Controls */}
            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-600">Filter by Status</label>
              <select className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 outline-none focus:border-blue-500 bg-white">
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span>Show</span>
                <input type="number" value={entriesPerPage} onChange={handleEntriesChange} min="1" max={totalEntries} className="border border-gray-300 rounded px-2 py-1 mx-2 w-16 text-center outline-none focus:border-blue-500" />
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
                  </tr>
                </thead>
                <tbody>
                  {/* Render currentData instead of the whole array */}
                  {currentData.map((member, index) => (
                    <tr key={member.sn} className="border-b border-gray-100 hover:bg-slate-50 transition-colors align-top">
                      <td className="p-3 py-4">{member.sn}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info & Controls */}
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <div>
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
              </div>

              {/* Dynamic Pagination Buttons */}
              <div className="flex border border-gray-200 rounded overflow-hidden">
                <button onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className={`px-3 py-1.5 transition-colors ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 text-gray-600"}`}>
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${currentPage === page ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50 text-gray-600"}`}>
                    {page}
                  </button>
                ))}

                <button onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${currentPage === totalPages || totalPages === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50 text-gray-600"}`}>
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
