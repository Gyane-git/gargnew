"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, FileSpreadsheet } from "lucide-react";

const CIPS_API = "/api/report/cips-transactions";

// Sample data — remove when API is connected
const SAMPLE_TRANSACTIONS = [
  { id: 1, transactionId: "Tx9xb2j9eoKVogStfFSD", customerName: "Sushil Sharma", totalAmount: 4.00, statusDescription: "TRANSACTION SUCCESSFUL", status: "SUCCESS", transactionDate: "2026-02-08" },
  { id: 2, transactionId: "TxEOjkzgO6iNT7pShKng", customerName: "Suyen Rai", totalAmount: 70.00, statusDescription: "TRANSACTION SUCCESSFUL", status: "SUCCESS", transactionDate: "2026-02-04" },
  { id: 3, transactionId: "TxGYnEc4ElVer7tf2GSU", customerName: "Prakash Thapa", totalAmount: 70.00, statusDescription: "TRANSACTION SUCCESSFUL", status: "SUCCESS", transactionDate: "2026-02-04" },
];

const statusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
      return "text-green-600 font-bold";
    case "FAILED":
      return "text-red-600 font-bold";
    default:
      return "text-gray-600 font-bold";
  }
};

export default function CIPSTransactionQuery() {
  const [transactions, setTransactions] = useState(SAMPLE_TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [entriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(SAMPLE_TRANSACTIONS.length);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: entriesPerPage,
          search,
        });
        const res = await fetch(`${CIPS_API}?${params}`);
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions || []);
          setTotalEntries(data.total || 0);
        }
      } catch (err) {
        console.error("Failed to fetch CIPS transactions:", err);
      }
    }
    fetchTransactions();
  }, [currentPage, search]);

  const handleExportExcel = () => {
    // TODO: implement excel export
  };

  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const startEntry = totalEntries === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + entriesPerPage, totalEntries);

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) {
      pages.push(i);
    }
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      <div className="flex-1 p-6">

        {/* Page Title + Breadcrumb */}
        <div className="mb-4">
          <h1 className="text-2xl font-normal text-gray-900">CIPS Transaction Query</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>CIPS Transaction Query</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">CIPS Transactions</h2>
          </div>

          <div className="px-6 py-5">
            {/* Export Excel (left) + Search (right) */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
              >
                <FileSpreadsheet size={16} />
                Export Excel
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Search:</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t border-gray-200">
                <thead>
                  <tr className="text-left text-gray-800 font-bold border-b border-gray-200">
                    <th className="px-3 py-3 border-r border-gray-200 w-20">
                      <div className="flex items-center justify-between gap-1">
                        <span>S.N.</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-between gap-1">
                        <span>Transaction ID</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-between gap-1">
                        <span>Customer Name</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-36">
                      <div className="flex items-center justify-between gap-1">
                        <span>Total Amount</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-between gap-1">
                        <span>Status Description</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-28">
                      <div className="flex items-center justify-between gap-1">
                        <span>Status</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 w-36">
                      <div className="flex items-center justify-between gap-1">
                        <span>Transaction Date</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 border-b border-gray-200">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn, index) => (
                      <tr
                        key={txn.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                      >
                        <td className="px-3 py-4 text-gray-600 border-r border-gray-200">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200 font-mono text-xs">
                          {txn.transactionId}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {txn.customerName}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {Number(txn.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          {txn.statusDescription}
                        </td>
                        <td className={`px-3 py-4 border-r border-gray-200 ${statusStyle(txn.status)}`}>
                          {txn.status}
                        </td>
                        <td className="px-3 py-4 text-gray-800">
                          {txn.transactionDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Showing entries + Pagination */}
            <div className="flex items-center justify-between mt-5 text-sm text-gray-600">
              <span>
                Showing {startEntry} to {endEntry} of {totalEntries} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                {getPaginationPages().map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-300">
        Copyright &copy; 2026{" "}
        <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}