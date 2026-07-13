"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const USERS_API = "/api/v1/admin/system-users";
const ROLES_API = "/api/system-users/groups";

export default function AddSystemUserPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRoles = async () => {
      try {
        const res = await fetch(ROLES_API, { cache: "no-store" });
        const data = await res.json();

        if (res.ok && data.success) {
          if (!cancelled) {
            setRoles(Array.isArray(data.groups) ? data.groups : []);
          }
        } else {
          throw new Error(data.message || "Failed to load roles.");
        }
      } catch (error) {
        if (!cancelled) {
          setRoles([]);
          toast.error(error.message || "Failed to load roles.");
        }
      } finally {
        if (!cancelled) {
          setLoadingRoles(false);
        }
      }
    };

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRole = useMemo(() => roles.find((role) => String(role.id) === String(roleId)), [roles, roleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const payload = {
        full_name: name,
        email,
        password,
        phone,
        address,
        country,
        role_id: roleId || null,
        accountType: selectedRole?.groupName || "",
        status,
      };

      const res = await fetch(USERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        toast.success("System user added successfully!");
        setTimeout(() => router.push("/admin/system-users"), 1200);
      } else {
        toast.error("Error: " + (data?.message || "Unknown error"));
      }
    } catch (err) {
      toast.error("Error adding system user!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-xl font-semibold text-[#1a3a6b] text-center mb-8">Add System User</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 text-black rounded-lg px-4 py-2" required />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 text-black rounded-lg px-4 py-2" />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border border-gray-300 text-black rounded-lg px-4 py-2" />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Account Type</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" disabled={loadingRoles}>
                  <option value="">{loadingRoles ? "Loading roles..." : "Select role"}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.groupName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button type="submit" disabled={loading} className={`bg-teal-600 text-white px-8 py-2 rounded-lg ${loading ? "opacity-60" : ""}`}>
                {loading ? "Adding New System User..." : "Add User Details"}
              </button>

              <button type="button" onClick={() => router.push("/admin/system-users")} className="bg-gray-500 text-white px-8 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

