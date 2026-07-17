"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const DEFAULT_FILTERS = {
  startDate: "",
  endDate: "",
  role: "allRoles",
  admin: "allAdmins",
  module: "allModules",
  model: "allModels",
  action: "allActions",
  search: "",
};

const MODULE_LABELS = {
  admins: "Admin Users",
  admin_roles: "Roles & Permissions",
  audit_logs: "Audit Logs",
  orders: "Orders",
  order_shipped: "Order Shipped",
  order_delivered: "Order Delivered",
  order_cancel: "Order Cancelled",
  order_returns: "Order Returns",
  order_retuns: "Order Returns",
  order_payments: "Order Payments",
  offers: "Offers",
  shipping_carriers: "Shipping Carriers",
  carousel_images: "Carousel Images",
  set_shipping: "Set Shipping",
  address_zone: "Address Zones",
  our_team: "Our Team",
  grievances: "Grievances",
  inquiries: "Inquiries",
  newsletter_subscribers: "Newsletter Subscribers",
  compliances: "Compliances",
  clinic_setup_requests: "Clinic Setup Requests",
  brands: "Brands",
  categories: "Categories",
  products: "Products",
};

const sortAlpha = (a, b) =>
  String(a).localeCompare(String(b), undefined, { sensitivity: "base" });

const isDefaultFilters = (filters) =>
  Object.keys(DEFAULT_FILTERS).every(
    (key) => filters[key] === DEFAULT_FILTERS[key],
  );

const buildQueryString = (filters, limit, offset, includeMeta = false) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (includeMeta) {
    params.set("includeMeta", "1");
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== DEFAULT_FILTERS[key]) {
      params.set(key, value);
    }
  });

  return params.toString();
};

const mergeUnique = (...groups) =>
  Array.from(new Set(groups.flat().filter(Boolean))).sort(sortAlpha);

const normalizeGroupName = (role) =>
  role?.groupName ||
  role?.group_name ||
  role?.name ||
  role?.role_name ||
  role?.title ||
  "";

const emptyCatalog = {
  admins: [],
  roles: [],
  modules: [],
  models: [],
  actions: [],
};

export default function AuditLogsPage() {
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const updateDraft = (key, value) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const offset = (currentPage - 1) * entriesPerPage;
        const shouldLoadMeta =
          currentPage === 1 && isDefaultFilters(appliedFilters);
        const query = buildQueryString(
          appliedFilters,
          entriesPerPage,
          offset,
          shouldLoadMeta,
        );

        const [logsResponse, groupsResponse] = await Promise.all([
          fetch(`/api/v1/admin/audit-logs?${query}`, { cache: "no-store" }),
          shouldLoadMeta
            ? fetch("/api/system-users/groups", { cache: "no-store" })
            : Promise.resolve(null),
        ]);

        const logsData = await logsResponse.json();
        const groupsData = groupsResponse ? await groupsResponse.json() : null;

        if (!logsResponse.ok || !logsData.success) {
          throw new Error(logsData.message || "Failed to load audit logs.");
        }

        if (cancelled) {
          return;
        }

        const rows = Array.isArray(logsData.logs) ? logsData.logs : [];
        setLogs(rows);
        setTotalCount(Number(logsData.count || 0));

        if (shouldLoadMeta) {
          const groupRoles =
            groupsData?.success && Array.isArray(groupsData.groups)
              ? groupsData.groups
              : [];
          const meta = logsData.meta || {};

          setCatalog({
            admins: mergeUnique(
              meta.admins || [],
              rows.map((log) => log.admin),
            ),
            roles: mergeUnique(
              meta.roles || [],
              groupRoles.map(normalizeGroupName),
              rows.map((log) => log.role),
            ),
            modules: mergeUnique(
              meta.modules || [],
              rows.map((log) => log.module),
            ),
            models: mergeUnique(
              meta.models || [],
              rows.map((log) => log.model),
            ),
            actions: mergeUnique(
              meta.actions || [],
              rows.map((log) => log.action),
            ),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load audit logs.");
          setLogs([]);
          setTotalCount(0);
          if (isDefaultFilters(appliedFilters)) {
            setCatalog(emptyCatalog);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters, currentPage, entriesPerPage]);

  const formatDate = (date) => date.toISOString().split("T")[0];

  const setToday = () => {
    const today = new Date();
    setDraft((prev) => ({
      ...prev,
      startDate: formatDate(today),
      endDate: formatDate(today),
    }));
  };

  const setLastNDays = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setDraft((prev) => ({
      ...prev,
      startDate: formatDate(start),
      endDate: formatDate(end),
    }));
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setDraft((prev) => ({
      ...prev,
      startDate: formatDate(start),
      endDate: formatDate(now),
    }));
  };

  const setLastNMonths = (months) => {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - months,
      now.getDate(),
    );
    setDraft((prev) => ({
      ...prev,
      startDate: formatDate(start),
      endDate: formatDate(now),
    }));
  };

  const setThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    setDraft((prev) => ({
      ...prev,
      startDate: formatDate(start),
      endDate: formatDate(now),
    }));
  };

  const clearDates = () =>
    setDraft((prev) => ({ ...prev, startDate: "", endDate: "" }));

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(draft);
    setCurrentPage(1);
  };

  const dateShortcuts = [
    { label: "Today", onClick: setToday },
    { label: "Last 7 Days", onClick: () => setLastNDays(7) },
    { label: "Last 30 Days", onClick: () => setLastNDays(30) },
    { label: "This Month", onClick: setThisMonth },
    { label: "Last 3 Months", onClick: () => setLastNMonths(3) },
    { label: "This Year", onClick: setThisYear },
  ];

  const adminOptions = useMemo(() => catalog.admins, [catalog.admins]);
  const roleOptions = useMemo(() => catalog.roles, [catalog.roles]);
  const moduleOptions = useMemo(() => catalog.modules, [catalog.modules]);
  const modelOptions = useMemo(() => catalog.models, [catalog.models]);
  const actionOptions = useMemo(() => catalog.actions, [catalog.actions]);

  const totalPages = Math.max(1, Math.ceil(totalCount / entriesPerPage));
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * entriesPerPage;
  const startEntry = totalCount === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + logs.length, totalCount);

  const actionBadgeStyles = {
    Update: "bg-cyan-50 text-cyan-600 border border-cyan-200",
    Create: "bg-green-50 text-green-600 border border-green-200",
    Delete: "bg-red-50 text-red-500 border border-red-200",
    Shipped: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    Delivered: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-600 border border-rose-200",
    Returned: "bg-amber-50 text-amber-600 border border-amber-200",
    Payment: "bg-violet-50 text-violet-600 border border-violet-200",
  };

  const handleViewChanges = (log) => {
    console.log("View changes for log", log.id);
  };

  const exportExcel = async () => {
    try {
      const query = buildQueryString(appliedFilters, 2000, 0, false);
      const response = await fetch(`/api/v1/admin/audit-logs?${query}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to export audit logs.");
      }

      const exportRows = Array.isArray(data.logs) ? data.logs : [];
      const exportData = exportRows.map((log, index) => ({
        "S.N.": index + 1,
        Admin: log.admin,
        Role: log.role,
        Action: log.action,
        Module: log.module,
        Model: log.model,
        "IP Address": log.ip,
        Date: log.date,
        Time: log.time,
        Summary: log.summary || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      saveAs(file, `audit-logs-${Date.now()}.xlsx`);
    } catch (err) {
      setError(err.message || "Failed to export audit logs.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">
        <div className="mb-1">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-900">
            Audit Logs
          </h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Audit Logs</span>
          </p>
        </div>

        <div className="mb-6">
          <h1 className="flex items-center gap-1 text-xl text-gray-500 mt-1">
            Track all administrative actions across the system.
          </h1>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Date Range
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) => updateDraft("startDate", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={draft.endDate}
                onChange={(e) => updateDraft("endDate", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {dateShortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={shortcut.onClick}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  {shortcut.label}
                </button>
              ))}
              <button
                onClick={clearDates}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
              >
                Clear Dates
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                value={draft.role}
                onChange={(e) => updateDraft("role", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              >
                <option value="allRoles">All Roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Filter by Admin
              </label>
              <select
                value={draft.admin}
                onChange={(e) => updateDraft("admin", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              >
                <option value="allAdmins">All Admins</option>
                {adminOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Filter by Module
              </label>
              <select
                value={draft.module}
                onChange={(e) => updateDraft("module", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              >
                <option value="allModules">All Modules</option>
                {moduleOptions.map((module) => (
                  <option key={module} value={module}>
                    {MODULE_LABELS[module] || module}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Filter by Model
              </label>
              <select
                value={draft.model}
                onChange={(e) => updateDraft("model", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              >
                <option value="allModels">All Models</option>
                {modelOptions.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Filter by Action
              </label>
              <select
                value={draft.action}
                onChange={(e) => updateDraft("action", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              >
                <option value="allActions">All Actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={draft.search}
                onChange={(e) => updateDraft("search", e.target.value)}
                placeholder="Search IP, details..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={applyFilters}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Reset Filters
            </button>
            <button
              onClick={exportExcel}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mt-6 overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2 px-5 sm:px-6 py-5">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <h2 className="text-lg font-bold text-blue-950">
              Audit Logs ({totalCount} records)
            </h2>
            <p className="text-sm text-gray-500">
              Showing {startEntry} to {endEntry} of {totalCount} entries
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead>
                <tr className="text-left border-y bg-gray-50">
                  <th className="px-5 sm:px-6 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    SL
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    ADMIN
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    ROLE
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    ACTION
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    MODULE
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    IP ADDRESS
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    TIME
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-500 tracking-wide text-xs">
                    CHANGES
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      Loading audit logs...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No audit logs match your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr
                      key={log.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-5 sm:px-6 py-4 text-blue-600 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-5 py-4 text-gray-800">{log.admin}</td>
                      <td className="px-5 py-4 text-gray-800">{log.role}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            actionBadgeStyles[log.action] ||
                            "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-800 font-mono text-[13px]">
                        {MODULE_LABELS[log.module] || log.module}
                      </td>
                      <td className="px-5 py-4 text-pink-500 font-mono text-[13px]">
                        {log.ip}
                      </td>
                      <td className="px-5 py-4 text-gray-800">
                        <div>{log.date}</div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          {log.time}
                        </div>
                        {log.summary ? (
                          <div className="text-gray-500 text-xs mt-1">
                            {log.summary}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleViewChanges(log)}
                          className="px-4 py-1.5 border border-blue-500 text-blue-600 rounded text-sm font-medium hover:bg-blue-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3 border-t">
            <span className="text-sm text-gray-500">
              Showing {startEntry} to {endEntry} of {totalCount} entries
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from(
                { length: Math.min(totalPages, 10) },
                (_, index) => index + 1,
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded border text-sm ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-5 text-center text-sm text-gray-500 border-t">
        Copyright © 2026{" "}
        <span className="font-bold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
