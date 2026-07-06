"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SetupRequestListPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/clinic/clinic-setup/requests");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load requests");
      setRequests(data.requests || []);
    } catch (error) {
      toast.error(error.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-normal text-gray-900">Setup Request List</h1>
            <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <LayoutDashboard size={14} />
              <Link href="/admin/dashboard" className="hover:underline text-gray-500">
                Dashboard
              </Link>
              <span>/</span>
              <span>Setup Request List</span>
            </p>
          </div>

          <button
            onClick={fetchRequests}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-blue-900">Clinic Setup Requests</h2>
          </div>

          <div className="px-4 sm:px-6 py-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px] border-t">
              <thead>
                <tr className="text-left border-b font-bold text-gray-700">
                  <th className="px-3 py-3">S.N.</th>
                  <th className="px-3 py-3">Request ID</th>
                  <th className="px-3 py-3">Full Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Budget</th>
                  <th className="px-3 py-3">City</th>
                  <th className="px-3 py-3">Remarks</th>
                  <th className="px-3 py-3">Requested Date</th>
                  
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      Loading requests...
                    </td>
                  </tr>
                ) : requests.length > 0 ? (
                  requests.map((req, index) => (
                    <tr key={req.id} className="border-b hover:bg-gray-50 align-top">
                      <td className="px-3 py-4">{index + 1}</td>
                      <td className="px-3 py-4 font-mono text-gray-500">{req.id}</td>
                      <td className="px-3 py-4 font-medium text-gray-800">{req.full_name}</td>
                      <td className="px-3 py-4 text-gray-700">{req.email}</td>
                      <td className="px-3 py-4 text-gray-700">{req.phone}</td>
                      <td className="px-3 py-4 text-gray-700">{req.budget || "-"}</td>
                      <td className="px-3 py-4 text-gray-700">{req.city || "-"}</td>
                      <td className="px-3 py-4 text-gray-700 max-w-[320px]">
                        <div className="line-clamp-3 whitespace-pre-wrap break-words">{req.remarks || "-"}</div>
                      </td>
                      <td className="px-3 py-4 text-gray-500">
                        {req.created_at ? new Date(req.created_at).toLocaleString() : "-"}
                      </td>
                      {/* <td className="px-3 py-4 text-gray-500">
                        {req.updated_at ? new Date(req.updated_at).toLocaleString() : "-"}
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      No setup requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-200">
        Copyright &copy; 2026 <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
