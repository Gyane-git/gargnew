"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Info, Edit2, Trash2, X } from "lucide-react";

const USERS_API = "/api/v1/admin/system-users";
const ROLES_API = "/api/system-users/groups";

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

const emptyEditForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  accountType: "",
  password: "",
  status: 1,
  role_id: "",
};

export default function SystemUsers() {
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(USERS_API, { cache: "no-store" }),
        fetch(ROLES_API, { cache: "no-store" }),
      ]);

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      if (!usersRes.ok || !usersData.success) {
        throw new Error(usersData.message || "Failed to load system users.");
      }

      if (!rolesRes.ok || !rolesData.success) {
        throw new Error(rolesData.message || "Failed to load roles.");
      }

      setUsers(Array.isArray(usersData.admins) ? usersData.admins : []);
      setRoles(Array.isArray(rolesData.groups) ? rolesData.groups : []);
    } catch (err) {
      setError(err.message || "Failed to load system users.");
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter((u) => {
      const haystack = `${u.name || ""} ${u.email || ""} ${u.phone || ""} ${u.accountType || ""} ${u.address || ""} ${u.country || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [users, search]);

  const safePerPage = Math.max(1, entriesPerPage);
  const totalEntries = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / safePerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * safePerPage;
  const currentItems = filteredUsers.slice(startIndex, startIndex + safePerPage);

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.fullName || user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      country: user.country || "",
      accountType: user.accountType || "",
      password: "",
      status: Number(user.status) === 0 ? 0 : 1,
      role_id: user.roleId || "",
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm(emptyEditForm);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser || saving) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...editForm,
        role_id: editForm.role_id || null,
        accountType: editForm.accountType || "",
      };
      if (!payload.password) delete payload.password;

      const res = await fetch(`${USERS_API}/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update user.");
      }

      closeEdit();
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete ${user.name || user.email}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${USERS_API}/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user.");
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete user.");
    }
  };

  const handleInfo = (user) => {
    window.alert(
      [
        `Name: ${user.name || "-"}`,
        `Email: ${user.email || "-"}`,
        `Phone: ${user.phone || "-"}`,
        `Account Type: ${user.accountType || "-"}`,
        `Address: ${user.address || "-"}`,
        `Country: ${user.country || "-"}`,
        `Status: ${Number(user.status) === 1 ? "Active" : "Inactive"}`,
      ].join("\n"),
    );
  };

  const selectedRole = roles.find((role) => String(role.id) === String(editForm.role_id));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">
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

        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Users</h2>
            <Link
              href="/admin/system-users/add"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Add System User
            </Link>
          </div>

          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
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
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t border-gray-200 min-w-[900px]">
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
                    <th className="px-3 py-3 border-r border-gray-200 w-28">Status</th>
                    <th className="px-3 py-3 w-28">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((user, index) => (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-3 py-4 text-gray-600 border-r border-gray-200">{startIndex + index + 1}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200 whitespace-nowrap">{user.name || "-"}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">{user.email || "-"}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200 whitespace-nowrap">{user.phone || "-"}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">{user.accountType || "-"}</td>
                        <td className="px-3 py-4 text-gray-800 border-r border-gray-200">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${Number(user.status) === 1 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {Number(user.status) === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => handleInfo(user)} className="text-blue-500 hover:text-blue-700 transition" title="Info">
                              <Info size={18} />
                            </button>
                            <button type="button" onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800 transition" title="Edit">
                              <Edit2 size={18} />
                            </button>
                            <button type="button" onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-700 transition" title="Delete">
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

            <div className="flex items-center justify-between mt-5 text-sm text-gray-600 flex-wrap gap-3">
              <span>
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + safePerPage, totalEntries)} of {totalEntries} users
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                {buildPageList(safePage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded transition ${safePage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage === totalPages || totalEntries === 0}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
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

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Edit User - <span className="text-blue-600">{editingUser.name || editingUser.email}</span>
              </h3>
              <button type="button" onClick={closeEdit} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Role</label>
                  <select
                    value={editForm.role_id}
                    onChange={(e) => {
                      const nextRoleId = e.target.value;
                      const nextRole = roles.find((role) => String(role.id) === String(nextRoleId));
                      setEditForm((prev) => ({
                        ...prev,
                        role_id: nextRoleId,
                        accountType: nextRole?.groupName || prev.accountType,
                      }));
                    }}
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.groupName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: Number(e.target.value) }))}
                    className="w-full rounded border border-gray-300 px-4 py-2 text-sm"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Current role: {selectedRole?.groupName || editingUser.accountType || "-"}
                </p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={closeEdit} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

