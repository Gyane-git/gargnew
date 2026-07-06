"use client";

import { ArrowUpDown, Edit2, House, Info, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const IconArrowUp = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export default function ProvincesPage() {
  const [deleteId, setDeleteId] = useState(null);
  const [deleteProvince, setDeleteProvince] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);

  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = useMemo(() => {
    let list = [...provinces];
    if (search.trim()) {
      list = list.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));
    }
    list.sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return list;
  }, [provinces, search, sortAsc]);

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = totalEntries === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, totalEntries);
  const pageRows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);

      const res = await fetch(`/api/v1/addresses/province/${deleteId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Province deleted successfully");
        fetchProvinces();
      } else {
        toast.error(data.message || "Failed to delete province");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
      setDeleteProvince(null);
    }
  };
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/v1/addresses/province");
      const data = await res.json();

      if (data.success) {
        setProvinces(
          data.provinces.map((item) => ({
            id: item.id,
            name: item.province_name,
          })),
        );
      }
    } catch (error) {
      console.error("Error loading provinces:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] px-4 py-6 sm:px-8 sm:py-6 font-sans text-[#3b4256]">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-[28px] font-semibold text-[#232f4b] leading-tight">Provinces</h1>
        <div className="flex items-center gap-1.5 text-[13px] text-[#9aa2b1]">
          <House size={16} />
          <span>Dashboard</span>
          <span className="text-[#c4cad6]">/</span>
          <span className="text-[#9aa2b1]">Provinces</span>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-[10px] bg-white px-5 py-6 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:px-7">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-[#232f4b]">Provinces</h2>
          <button onClick={() => router.push("/admin/provinces/add")} className="rounded-md bg-[#2f55d4] px-[18px] py-2 text-sm font-medium text-white hover:bg-[#2645b0]">
            Add Province
          </button>
        </div>

        <div className="my-5 border-t border-[#eef0f4]" />

        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-[5px] border border-[#dfe3ea] px-2 py-1 text-sm focus:border-[#2f55d4] focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-[180px] rounded-[5px] border border-[#dfe3ea] px-2.5 py-1 text-sm focus:border-[#2f55d4] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14.5px]">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    S.N. <ArrowUpDown size={14} />
                  </span>
                </th>
                <th onClick={() => setSortAsc((s) => !s)} className="cursor-pointer whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    Province Name <ArrowUpDown size={14} />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#9aa2b1]">
                    Loading...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#9aa2b1]">
                    No matching records found
                  </td>
                </tr>
              ) : (
                pageRows.map((p, i) => (
                  <tr key={p.id}>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 text-[#4b5468]">{(currentPage - 1) * perPage + i + 1}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3">
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-[#2f55d4] no-underline hover:underline">
                        {p.name}
                      </a>
                    </td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3">
                      <div className="flex gap-2">
                        <button title="View" className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#cfeaf7] bg-[#eef8fd] text-[#2f9bd6] hover:brightness-95">
                          <button title="View" onClick={() => router.push(`/admin/provinces/view/${p.id}`)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#cfeaf7] bg-[#eef8fd] text-[#2f9bd6] hover:brightness-95">
                            <Info size={16} />
                          </button>
                        </button>
                        <button title="Edit" onClick={() => openEdit(p)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#d6ddf7] bg-[#eef1fd] text-[#2f55d4] hover:brightness-95">
                          <button title="View" onClick={() => router.push(`/admin/provinces/edit/${p.id}`)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#cfeaf7] bg-[#eef8fd] text-[#2f9bd6] hover:brightness-95">
                            <Edit2 size={16} />
                          </button>
                        </button>
                        <button
                          title="Delete"
                          onClick={() => {
                            setDeleteId(p.id);
                            setDeleteProvince(p);
                          }}
                          className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#e5534b] bg-[#e5534b] text-white hover:brightness-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4.5 flex flex-wrap items-center justify-between gap-2.5 text-[13.5px] text-[#6b7285]">
          <div>
            Showing {startIdx} to {endIdx} of {totalEntries} entries
          </div>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-[5px] border border-[#e1e4eb] bg-[#f4f6fa] px-3 py-1.5 text-[13.5px] text-[#4b5468] disabled:cursor-not-allowed disabled:opacity-50">
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`rounded-[5px] border px-3 py-1.5 text-[13.5px] ${n === currentPage ? "border-[#2f55d4] bg-[#2f55d4] text-white" : "border-[#e1e4eb] bg-[#f4f6fa] text-[#4b5468]"}`}>
                {n}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-[5px] border border-[#e1e4eb] bg-[#f4f6fa] px-3 py-1.5 text-[13.5px] text-[#4b5468] disabled:cursor-not-allowed disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[13.5px] text-[#8992a3]">
        Copyright © 2026 <strong>Global Tech Nepal Pvt. Ltd.</strong>
      </div>

      {/* Scroll to top */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bg-red-500 bottom-6 right-6 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#2f55d4] text-white shadow-[0_4px_12px_rgba(47,85,212,0.4)]">
          <IconArrowUp />
        </button>
      )}
      {/* Delete Modal */}
      <DeleteModal
        province={deleteProvince}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteId(null);
          setDeleteProvince(null);
        }}
      />
    </div>
  );
}
function DeleteModal({ province, onConfirm, onCancel, loading }) {
  if (!province) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="mt-4 text-center text-xl font-semibold text-gray-800">Delete Province?</h2>

          <p className="mt-3 text-center text-gray-600">Are you sure you want to delete</p>

          <p className="mt-1 text-center font-semibold text-gray-800">"{province.name}"</p>

          <p className="mt-2 text-center text-sm text-red-500">This action cannot be undone.</p>

          <div className="mt-6 flex justify-between">
            <button onClick={onCancel} disabled={loading} className="rounded-md border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-100">
              Cancel
            </button>

            <button onClick={onConfirm} disabled={loading} className="rounded-md bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:opacity-60">
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
