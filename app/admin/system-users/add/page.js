"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AddSystemUserPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [accountType, setAccountType] = useState("SuperAdmin");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("country", country);
      formData.append("accountType", accountType);

      const res = await fetch("/api/v1/syste-users", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (data?.success) {
        toast.success("System user added successfully!");
        setTimeout(() => router.push("/admin/system-users/add-user"), 1500);
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-xl font-semibold text-[#1a3a6b] text-center mb-8">Add System User</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* User Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 text-black rounded-lg px-4 py-2" required />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                <input type="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 text-black rounded-lg px-4 py-2" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Address */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>

              {/* Country */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border border-gray-300 text-black rounded-lg px-4 py-2" />
              </div>
            </div>
            {/* Account Type */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Account Type</label>
                <select value={accountType} onChange={(e) => setAccountType(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value={SuperAdmin}>Super Admin</option>
                  <option value={Admin}>Admin</option>
                  <option value={Staff}>Staff</option>
                  <option value={Manager}>Manager</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between">
              <button type="submit" disabled={loading} className={`bg-teal-600 text-white px-8 py-2 rounded-lg ${loading ? "opacity-60" : ""}`}>
                {loading ? "Adding New System User..." : "Add User Details"}
              </button>

              <button type="button" onClick={() => router.back()} className="bg-gray-500 text-white px-8 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
