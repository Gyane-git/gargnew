"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowUpDown, FileSpreadsheet, Info, ArrowUp, Gauge } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { dummyOrders } from "@/lib/dummyOrders";

const ITEMS_PER_PAGE = 5;

export default function Page() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const columns = [
    { key: "sn", label: "S.N." },
    { key: "orderId", label: "Order ID" },
    { key: "customer", label: "Customer" },
    { key: "address", label: "Shipping Address" },
    { key: "totalItems", label: "Total Items" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "orderStatus", label: "Order Status" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "created", label: "Created" },
  ];

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredData = useMemo(() => {
    let data = [...dummyOrders];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((row) => Object.values(row).some((val) => String(val).toLowerCase().includes(q)));
    }

    // Date filter
    if (startDate) {
      data = data.filter((row) => new Date(row.created) >= new Date(startDate));
    }

    if (endDate) {
      data = data.filter((row) => new Date(row.created) <= new Date(endDate));
    }

    // Sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;

        return 0;
      });
    }

    return data;
  }, [search, startDate, endDate, sortConfig]);

  const TOTAL_ENTRIES = filteredData.length;
  const TOTAL_PAGES = Math.ceil(TOTAL_ENTRIES / ITEMS_PER_PAGE);

  const startIdx = TOTAL_ENTRIES === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, TOTAL_ENTRIES);

  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilter = () => {
    console.log("Filter clicked:", { startDate, endDate });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleExport = () => {
    // Export currently filtered data
    const exportData = filteredData.map((row) => ({
      "S.N.": row.sn,
      "Order ID": row.orderId,
      Customer: row.customer,
      "Shipping Address": row.address,
      "Total Items": row.totalItems,
      "Total Amount": row.totalAmount,
      "Order Status": row.orderStatus,
      "Payment Status": row.paymentStatus,
      Created: row.created,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipped Orders");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(file, `shipped-orders-${Date.now()}.xlsx`);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top blue-ish header bar */}
      <div className="bg-blue-50 px-8 py-5">
        <h1 className="text-2xl font-semibold text-slate-800">Orders</h1>
        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
          <Gauge size={16} />

          <a href="#" className="text-blue-600 hover:underline">
            Dashboard
          </a>
          <span>/</span>
          <span>Shipped Orders</span>
        </div>
      </div>

      {/* Main content card */}
      <div className="flex-1 px-8 pb-8">
        <div className="bg-white rounded-md shadow-sm">
          {/* Header row: title + date filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Shipped Orders</h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-500">Start Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-500">End Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-1.5 rounded">
                Filter
              </button>
              <button onClick={handleReset} className="bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium px-5 py-1.5 rounded">
                Reset
              </button>
            </div>
          </div>

          {/* Export + Search row */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <button onClick={handleExport} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded">
              <FileSpreadsheet size={16} />
              Export Excel
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Search:</label>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-slate-300 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto px-6 pb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-t border-b border-slate-200">
                  {columns.map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)} className="text-left font-semibold text-slate-700 py-3 pr-4 cursor-pointer select-none whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown size={12} className="text-slate-400" />
                      </span>
                    </th>
                  ))}
                  <th className="text-left font-semibold text-slate-700 py-3 pr-4 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row) => {
                  // orderId is stored like "#17832328305696924" — strip "#" for the URL
                  const cleanId = row.orderId.replace("#", "");

                  return (
                    <tr key={row.orderId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 pr-4 text-slate-700">{row.sn}</td>
                      <td className="py-4 pr-4">
                        <Link href={`/admin/orders/shipped/${cleanId}`} className="text-blue-600 hover:underline">
                          {row.orderId}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">{row.customer}</td>
                      <td className="py-4 pr-4 text-slate-700 max-w-xs">{row.address}</td>
                      <td className="py-4 pr-4 text-slate-700">{row.totalItems}</td>
                      <td className="py-4 pr-4 text-slate-700">{row.totalAmount.toFixed(2)}</td>
                      <td className="py-4 pr-4 text-slate-700">{row.orderStatus}</td>
                      <td className="py-4 pr-4 text-slate-700">{row.paymentStatus}</td>
                      <td className="py-4 pr-4 text-slate-700 whitespace-nowrap">{row.created}</td>
                      <td className="py-4 pr-4">
                        {/* Navigates to that specific shipped details page */}
                        <Link href={`/admin/orders/shipped/${cleanId}`} className="w-6 h-6 flex items-center justify-center rounded-full bg-sky-500 hover:bg-sky-600 text-white">
                          <Info size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer: entries info + pagination */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, TOTAL_ENTRIES)} of {TOTAL_ENTRIES} entries
            </span>

            {TOTAL_PAGES > 1 && (
              <div className="mt-4.5 flex flex-wrap items-center justify-between gap-2.5 text-[13.5px] text-[#6b7285]">
                <div>
                  Showing {startIdx} to {endIdx} of {TOTAL_ENTRIES} entries
                </div>

                <div className="flex gap-1">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="rounded-[5px] border border-[#e1e4eb] bg-[#f4f6fa] px-3 py-1.5 text-[13.5px] text-[#4b5468] disabled:cursor-not-allowed disabled:opacity-50">
                    Previous
                  </button>

                  {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setCurrentPage(n)} className={`rounded-[5px] border px-3 py-1.5 text-[13.5px] ${n === currentPage ? "border-[#2f55d4] bg-[#2f55d4] text-white" : "border-[#e1e4eb] bg-[#f4f6fa] text-[#4b5468]"}`}>
                      {n}
                    </button>
                  ))}

                  <button disabled={currentPage === TOTAL_PAGES} onClick={() => setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))} className="rounded-[5px] border border-[#e1e4eb] bg-[#f4f6fa] px-3 py-1.5 text-[13.5px] text-[#4b5468] disabled:cursor-not-allowed disabled:opacity-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-slate-500 py-4">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>

      {/* Scroll to top button */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 w-10 h-10 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg">
        <ArrowUp size={18} />
      </button>
    </div>
  );
}
