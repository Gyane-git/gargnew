"use client";
import { useEffect, useState } from "react";
import { Mail, Trash, Eye, X, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [search, setSearch] = useState("");

  const fetchInquiries = async () => {
    try {
      const res = await fetch("/api/v1/inquiries");
      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries);
        setFiltered(data.inquiries);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(inquiries.filter((i) => i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.subject || "").toLowerCase().includes(q)));
  }, [search, inquiries]);

  const deleteInquiry = async () => {
    try {
      const res = await fetch(`/api/v1/inquiries/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Inquiry deleted");
        fetchInquiries();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—");

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a6b]">Inquiries</h1>
          <p className="text-gray-500 mt-1 text-sm">All contact form submissions</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition" />
        </div>
      </div>

      {/* STAT PILLS */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold rounded-full px-3 py-1">Total: {inquiries.length}</span>
        <span className="bg-slate-100 text-gray-500 border border-gray-200 text-xs font-bold rounded-full px-3 py-1">Showing: {filtered.length}</span>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">S.N.</th>
                <th className="px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Name</th>
                <th className="px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Email</th>
                <th className="px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Subject</th>
                <th className="px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                <th className="px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? "2rem" : "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-gray-400">
                    <Mail size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No inquiries found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    {/* S.N */}
                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">{index + 1}</td>

                    {/* NAME */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1a3a6b] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{item.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{item.name}</span>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="px-5 py-4 text-gray-500 text-xs">{item.email}</td>

                    {/* SUBJECT */}
                    <td className="px-5 py-4">
                      <span className="truncate block max-w-[160px] text-gray-600">{item.subject || <span className="text-gray-300 italic">No subject</span>}</span>
                    </td>

                    {/* DATE */}
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(item.created_at)}</td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setViewItem(item)} className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Delete">
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t text-xs text-gray-400">
          Showing {filtered.length} of {inquiries.length} entries
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1a3a6b] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{viewItem.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a3a6b] text-sm">{viewItem.name}</p>
                  <p className="text-xs text-gray-400">{viewItem.email}</p>
                </div>
              </div>
              <button onClick={() => setViewItem(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {viewItem.subject && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Subject</p>
                  <p className="text-sm font-semibold text-gray-800">{viewItem.subject}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Message</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-gray-100">{viewItem.message}</p>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>ID: #{viewItem.id}</span>
                <span>Received: {formatDate(viewItem.created_at)}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex justify-end items-center">
              <button onClick={() => setViewItem(null)} className="bg-[#1a3a6b] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#15305a] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Inquiry?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteInquiry} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
