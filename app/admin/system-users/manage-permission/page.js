"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Edit2, X, Check, Trash2 } from "lucide-react";

const GROUPS_API = "/api/system-users/groups";
const PERMISSIONS_API = "/api/system-users/permissions";

// Module cards with their permissions
const MODULES = [
  {
    key: "products",
    label: "Products",
    icon: "📦",
    color: "bg-blue-600",
    permissions: [
      { label: "Add Product", key: "product-add" },
      { label: "Edit Product", key: "product-edit" },
      { label: "View Products", key: "product-view" },
      { label: "Change Status", key: "product-status" },
    ],
  },
  {
    key: "manage_orders",
    label: "Manage Orders",
    icon: "🖥️",
    color: "bg-green-700",
    permissions: [
      { label: "Order View", key: "order-view" },
    ],
  },
  {
    key: "categories",
    label: "Categories",
    icon: "📁",
    color: "bg-cyan-400",
    permissions: [
      { label: "Add Category", key: "categories-add" },
      { label: "Edit Category", key: "categories-edit" },
      { label: "View Categories", key: "categories-view" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: "👤",
    color: "bg-yellow-400",
    permissions: [
      { label: "View Customers", key: "customer-view" },
    ],
  },
  {
    key: "brands",
    label: "Brands",
    icon: "🏷️",
    color: "bg-red-500",
    permissions: [
      { label: "Add Brand", key: "brands-add" },
      { label: "Edit Brand", key: "brands-edit" },
      { label: "View Brands", key: "brands-view" },
      { label: "Status Brand", key: "brands-status" },
      { label: "Status Top", key: "brands-top" },
    ],
  },
  {
    key: "manage_clinic",
    label: "Manage Clinic Setup",
    icon: "🏥",
    color: "bg-gray-500",
    permissions: [
      { label: "View Setup Page", key: "view-setup-page" },
      { label: "View Setup Request List", key: "view-setup-request-list" },
    ],
  },
  {
    key: "coupons",
    label: "Coupons",
    icon: "🎟️",
    color: "bg-gray-900",
    permissions: [
      { label: "Add Coupon", key: "coupons-add" },
      { label: "Edit Coupon", key: "coupons-edit" },
      { label: "View Coupons", key: "coupons-view" },
      { label: "Status Coupon", key: "coupons-status" },
    ],
  },
  {
    key: "system_users",
    label: "System Users",
    icon: "👥",
    color: "bg-green-600",
    permissions: [
      { label: "Users Add", key: "users-add" },
      { label: "Manage Permissions", key: "manage-permissions" },
    ],
  },
  {
    key: "audit_management",
    label: "Audit Management",
    icon: "📋",
    color: "bg-green-600",
    permissions: [
      { label: "Audit Logs View", key: "system-audit" },
    ],
  },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

// Toggle switch component used inside each module card
function PermissionToggle({ label, permKey, checked, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(permKey)}
        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-300
          ${checked ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
            transition-transform duration-200
            ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

// Colored module card with permission toggles
function ModuleCard({ module, selectedPerms, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className={`${module.color} px-4 py-3 flex items-center gap-2`}>
        <span className="text-base">{module.icon}</span>
        <span className="text-white font-semibold text-sm">{module.label}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3 min-h-[80px]">
        {module.permissions.map(({ label, key }) => (
          <PermissionToggle
            key={key}
            label={label}
            permKey={key}
            checked={selectedPerms.includes(key)}
            onChange={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

export default function ManagePermissions() {
  // Create form
  const [groupName, setGroupName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState([]);

  // Edit modal
  const [editGroup, setEditGroup] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPerms, setEditPerms] = useState([]);

  // Table
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch(GROUPS_API);
        const data = await res.json();
        if (data.success) {
          setGroups(data.groups || []);
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    }
    fetchGroups();
  }, []);

  const togglePerm = (setter) => (key) => {
    setter((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedPerms.length === 0) return;
    try {
      const res = await fetch(PERMISSIONS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, permissions: selectedPerms }),
      });
      const data = await res.json();
      if (data.success) {
        setGroups((prev) => [data.group, ...prev]);
        setGroupName("");
        setSelectedPerms([]);
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  const handleReset = () => {
    setGroupName("");
    setSelectedPerms([]);
  };

  const openEdit = (group) => {
    setEditGroup(group);
    setEditName(group.groupName);
    setEditPerms(group.permissions ? group.permissions.split(",").map((p) => p.trim()) : []);
  };

  const handleEditSubmit = async () => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`${PERMISSIONS_API}/${editGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: editName, permissions: editPerms }),
      });
      const data = await res.json();
      if (data.success) {
        setGroups((prev) =>
          prev.map((g) => (g.id === editGroup.id ? data.group : g))
        );
        setEditGroup(null);
      }
    } catch (err) {
      console.error("Failed to update group:", err);
    }
  };

  const handleDeleteGroup = async (group) => {
    const confirmed = window.confirm(`Delete permission group "${group.groupName}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${PERMISSIONS_API}/${group.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setGroups((prev) => prev.filter((g) => g.id !== group.id));
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  // Table filtering and pagination
  const filteredGroups = groups.filter(
    (g) =>
      g.groupName.toLowerCase().includes(search.toLowerCase()) ||
      String(g.permissions || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalEntries = filteredGroups.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentItems = filteredGroups.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      <div className="flex-1 p-6">

        {/* Page Title + Breadcrumb */}
        <div className="mb-4">
          <h1 className="text-2xl font-normal text-gray-900">👥 User Groups</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Manage Permissions</span>
          </p>
        </div>

        {/* Create Group Form Card */}
        <div className="bg-white rounded-lg shadow-sm px-6 py-6 mb-6">

          {/* Group Name */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Role Name Example"
              className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded text-sm
                         text-gray-700 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Module Permissions */}
          <h2 className="text-base font-normal text-gray-800 mb-4">
            Manage Module Permissions
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {MODULES.map((module) => (
              <ModuleCard
                key={module.key}
                module={module}
                selectedPerms={selectedPerms}
                onToggle={togglePerm(setSelectedPerms)}
              />
            ))}
          </div>

          {/* Form Buttons */}
          <div className="flex items-center justify-end gap-6">
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-800 transition"
            >
              Reset
            </button>
            <button
              onClick={handleSubmit}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              Submit
            </button>
          </div>
        </div>

        {/* User Group Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-blue-900">User Group Table</h2>
          </div>

          <div className="px-6 py-5">
            {/* Show Entries + Search */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <input
                  type="number"
                  value={entriesPerPage}
                  min={1}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center
                             text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span>entries</span>
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
              <table className="w-full text-sm border-t border-gray-200">
                <thead>
                  <tr className="text-left text-gray-800 font-bold border-b border-gray-200">
                    <th className="px-3 py-3 border-r border-gray-200 w-16">
                      <div className="flex items-center justify-between">
                        <span>S.N.</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-36">
                      <div className="flex items-center justify-between">
                        <span>Group Name</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200">
                      Modules Permission
                    </th>
                    <th className="px-3 py-3 border-r border-gray-200 w-36">
                      <div className="flex items-center justify-between">
                        <span>Created At</span>
                        <span className="text-gray-400 text-xs">↑↓</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 border-b border-gray-200">
                        No groups found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((group, index) => (
                      <tr
                        key={group.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition align-top"
                      >
                        <td className="px-3 py-4 text-gray-600 border-r border-gray-200">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200 whitespace-nowrap">
                          {group.groupName}
                        </td>
                        <td className="px-3 py-4 text-gray-700 border-r border-gray-200 leading-relaxed">
                          {group.permissions}
                        </td>
                        <td className="px-3 py-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {formatDate(group.createdAt)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(group)}
                              className="p-1.5 rounded border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group)}
                              className="p-1.5 rounded border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition"
                              title="Delete"
                            >
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-5 text-sm text-gray-600">
              <span>
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, totalEntries)} of{" "}
                {totalEntries} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                {buildPageList(currentPage, totalPages).map((page, idx) =>
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

      {/* Edit Modal */}
      {editGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Edit Group —{" "}
                <span className="text-blue-600">{editGroup.groupName}</span>
              </h3>
              <button
                onClick={() => setEditGroup(null)}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <div className="mb-5">
                <label className="block text-sm text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded text-sm
                             text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
              <div className="grid grid-cols-3 gap-4">
                {MODULES.map((module) => (
                  <ModuleCard
                    key={module.key}
                    module={module}
                    selectedPerms={editPerms}
                    onToggle={togglePerm(setEditPerms)}
                  />
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setEditGroup(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                           text-white bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                <Check size={15} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
