"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Info, Edit2, Trash2 } from "lucide-react";

// Mock data — replace with API
const MOCK_USERS = [
  { id: 1, name: "Gyanendra Pandey", email: "gyane.globaltech@gmail.com", phone: "9813074888", accountType: "Super Administrator" },
  { id: 2, name: "Sushil Raut", email: "rautsushil331@gmail.com", phone: "9812345678", accountType: "Admin" },
  { id: 3, name: "Dev Manager", email: "dev@globaltech.com", phone: "9800000001", accountType: "Manager" },
  { id: 4, name: "Staff User", email: "staff@globaltech.com", phone: "9800000002", accountType: "Staff" },
  { id: 5, name: "Test Account", email: "test@gmail.com", phone: "9800000003", accountType: "Admin" },
  { id: 6, name: "Gyanendra Pandey", email: "gyane.globaltech@gmail.com", phone: "9813074888", accountType: "Super Administrator" },
  { id: 7, name: "Sushil Raut", email: "rautsushil331@gmail.com", phone: "9812345678", accountType: "Admin" },
  { id: 8, name: "Dev Manager", email: "dev@globaltech.com", phone: "9800000001", accountType: "Manager" },
  { id: 9, name: "Staff User", email: "staff@globaltech.com", phone: "9800000002", accountType: "Staff" },
  { id: 10, name: "Test Account", email: "test@gmail.com", phone: "9800000003", accountType: "Admin" },
  { id: 11, name: "Gyanendra Pandey", email: "gyane.globaltech@gmail.com", phone: "9813074888", accountType: "Super Administrator" },
  { id: 12, name: "Sushil Raut", email: "rautsushil331@gmail.com", phone: "9812345678", accountType: "Admin" },
  { id: 13, name: "Dev Manager", email: "dev@globaltech.com", phone: "9800000001", accountType: "Manager" },
  { id: 14, name: "Staff User", email: "staff@globaltech.com", phone: "9800000002", accountType: "Staff" },
  { id: 15, name: "Test Account", email: "test@gmail.com", phone: "9800000003", accountType: "Admin" },
  { id: 16, name: "Gyanendra Pandey", email: "gyane.globaltech@gmail.com", phone: "9813074888", accountType: "Super Administrator" },
  { id: 17, name: "Sushil Raut", email: "rautsushil331@gmail.com", phone: "9812345678", accountType: "Admin" },
  { id: 18, name: "Dev Manager", email: "dev@globaltech.com", phone: "9800000001", accountType: "Manager" },
  { id: 19, name: "Staff User", email: "staff@globaltech.com", phone: "9800000002", accountType: "Staff" },
  { id: 20, name: "Test Account", email: "test@gmail.com", phone: "9800000003", accountType: "Admin" },
  { id: 21, name: "Gyanendra Pandey", email: "gyane.globaltech@gmail.com", phone: "9813074888", accountType: "Super Administrator" },
  { id: 22, name: "Sushil Raut", email: "rautsushil331@gmail.com", phone: "9812345678", accountType: "Admin" },
  { id: 23, name: "Dev Manager", email: "dev@globaltech.com", phone: "9800000001", accountType: "Manager" },
  { id: 24, name: "Staff User", email: "staff@globaltech.com", phone: "9800000002", accountType: "Staff" },
  { id: 25, name: "Test Account", email: "test@gmail.com", phone: "9800000003", accountType: "Admin" },
  { id: 26, name: "Gyanendra Pandey", email: "gyane.globaltech@gmail.com", phone: "9813074888", accountType: "Super Administrator" },
  { id: 27, name: "Sushil Raut", email: "rautsushil331@gmail.com", phone: "9812345678", accountType: "Admin" },
  { id: 28, name: "Dev Manager", email: "dev@globaltech.com", phone: "9800000001", accountType: "Manager" },
  { id: 29, name: "Staff User", email: "staff@globaltech.com", phone: "9800000002", accountType: "Staff" },
  { id: 30, name: "Test Account", email: "test@gmail.com", phone: "9800000003", accountType: "Admin" },
];

// Pagination helper
const buildPageList = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const delta = 2;
  const pages = [1];
  const left = currentPage - delta;
  const right = currentPage + delta;
  if (left > 2) pages.push("...");
  for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) {
    pages.push(i);
  }
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
};

export default function SystemUsers() {
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter by search
  const filteredUsers = MOCK_USERS.filter((u) => {
    const query = search.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.phone.toLowerCase().includes(query) || u.accountType.toLowerCase().includes(query);
  });

  // Pagination
  const safePerPage = Math.max(1, entriesPerPage);
  const totalEntries = filteredUsers.length;
  const totalPages = Math.ceil(totalEntries / safePerPage);
  const startIndex = (currentPage - 1) * safePerPage;
  const currentItems = filteredUsers.slice(startIndex, startIndex + safePerPage);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-900">Users</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline text-gray-500">
              Dashboard
            </Link>
            <span>/</span>
            <span>Users</span>
          </p>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Users</h2>
            <Link
              href="/admin/system-users/add"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold
                         rounded-lg hover:bg-blue-700 transition"
            >
              Add System User
            </Link>
          </div>

          <div className="px-4 sm:px-6 py-5">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page
                  }}
                  className="border rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>users</span>
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
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700
                             focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t border-gray-200 min-w-[700px]">
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
                        <span>Name</span>
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
                        <span>Phone</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-44">
                      <div className="flex items-center justify-between">
                        <span>Account Type</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 w-28">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((user, index) => (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-3 py-4 text-gray-600 border-r border-gray-200">{startIndex + index + 1}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200 whitespace-nowrap">{user.name}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">{user.email}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200 whitespace-nowrap">{user.phone}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">{user.accountType}</td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <button className="text-blue-500 hover:text-blue-700 transition" title="Info">
                              <Info size={18} />
                            </button>
                            <button className="text-blue-600 hover:text-blue-800 transition" title="Edit">
                              <Edit2 size={18} />
                            </button>
                            <button className="text-red-500 hover:text-red-700 transition" title="Delete">
                              <Trash2 size={18} />
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
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + safePerPage, totalEntries)} of {totalEntries} users
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100
                             disabled:opacity-50 transition"
                >
                  Previous
                </button>
                {buildPageList(currentPage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                      ...
                    </span>
                  ) : (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 border rounded transition ${currentPage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100
                             disabled:opacity-50 transition"
                >
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
    </div>
  );
}
