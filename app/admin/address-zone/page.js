"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { ArrowUpDown, Edit2, House, Info, Trash2 } from "lucide-react";

const IconArrowUp = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

function getPageNumbers(current, total) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export default function AddressCityZonePage() {
  const [sortAsc, setSortAsc] = useState(true);
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteZone, setDeleteZone] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ city: "", zone: "" });

  const [showTop, setShowTop] = useState(false);

  const fetchZones = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/v1/addresses/address-zone");
      const data = await res.json();
      console.log("data: ", data);

      if (data.success) {
        setZones(
          data.zones.map((item) => ({
            id: item.id,
            city: item.city_id,
            zone: item.zone_name,
            createdAt: item.created_at,
          })),
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load zones");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...zones];

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      list = list.filter((z) => (z.city || "").toLowerCase().includes(q) || (z.zone || "").toLowerCase().includes(q));
    }

    list.sort((a, b) => (sortAsc ? (a.zone || "").localeCompare(b.zone || "") : (b.zone || "").localeCompare(a.zone || "")));

    return list;
  }, [zones, search, sortAsc]);

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 200);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = totalEntries === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, totalEntries);
  const pageRows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);

      const res = await fetch(`/api/v1/addresses/address-zone/${deleteId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      console.log(data);

      if (data.success) {
        toast.success("Zone deleted successfully");
        fetchZones();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
      setDeleteZone(null);
    }
  };

  const handleSave = () => {
    if (!form.city.trim() || !form.zone.trim()) return;
    if (editing) {
      setZones((prev) => prev.map((r) => (r.id === editing.id ? { ...r, city: form.city.trim(), zone: form.zone.trim() } : r)));
    } else {
      const nextId = zones.length > 0 ? Math.max(...zones.map((r) => r.id)) + 1 : 1;
      const now = new Date();
      const createdAt = now
        .toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", "");
      setZones((prev) => [...prev, { id: nextId, city: form.city.trim(), zone: form.zone.trim(), createdAt }]);
    }
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] px-4 py-6 sm:px-8 sm:py-6 font-sans text-[#3b4256]">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-[28px] font-semibold text-[#232f4b] leading-tight">Address City Zone</h1>
        <div className="flex items-center gap-1.5 text-[13px] text-[#9aa2b1]">
          <House className="mr-0.5" />
          <span>Dashboard</span>
          <span className="text-[#c4cad6]">/</span>
          <span className="text-[#9aa2b1]">Address Zone</span>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-[10px] bg-white px-5 py-6 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:px-7">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-[#232f4b]">Address Zone</h2>
          <button onClick={() => router.push("/admin/address-zone/add")} className="rounded-md bg-[#2f55d4] px-[18px] py-2 text-sm font-medium text-white hover:bg-[#2645b0]">
            Add Zone
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
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    City <ArrowUpDown size={14} />
                  </span>
                </th>
                <th onClick={() => setSortAsc((s) => !s)} className="cursor-pointer whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    Zone
                    <ArrowUpDown size={14} />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    Created At <ArrowUpDown size={14} />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9aa2b1]">
                    Loading...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9aa2b1]">
                    No matching records found
                  </td>
                </tr>
              ) : (
                pageRows.map((z, i) => (
                  <tr key={z.id}>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 text-[#2f55d4]">{(currentPage - 1) * perPage + i + 1}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 text-[#4b5468]">{z.city}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 text-[#4b5468]">
                      {z.zone} {console.log(z.zone)}
                    </td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 text-[#4b5468]">{z.createdAt}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3">
                      <div className="flex gap-2">
                        <button title="View" onClick={() => router.push(`/admin/address-zone/view/${z.id}`)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#cfeaf7] bg-[#eef8fd] text-[#2f9bd6]">
                          <Info size={16} />
                        </button>

                        <button title="Edit" onClick={() => router.push(`/admin/address-zone/edit/${z.id}`)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#d6ddf7] bg-[#eef1fd] text-[#2f55d4]">
                          <Edit2 size={16} />
                        </button>

                        <button
                          title="Delete"
                          onClick={() => {
                            setDeleteId(z.id);
                            setDeleteZone(z);
                          }}
                          className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#e5534b] bg-[#e5534b] text-white"
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
            {pageNumbers.map((n, idx) =>
              n === "..." ? (
                <span key={`dots-${idx}`} className="rounded-[5px] border border-[#e1e4eb] bg-[#f4f6fa] px-3 py-1.5 text-[13.5px] text-[#8992a3]">
                  ...
                </span>
              ) : (
                <button key={n} onClick={() => setPage(n)} className={`rounded-[5px] border px-3 py-1.5 text-[13.5px] ${n === currentPage ? "border-[#2f55d4] bg-[#2f55d4] text-white" : "border-[#e1e4eb] bg-[#f4f6fa] text-[#4b5468]"}`}>
                  {n}
                </button>
              ),
            )}
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
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#2f55d4] text-white shadow-[0_4px_12px_rgba(47,85,212,0.4)]">
          <IconArrowUp />
        </button>
      )}
      <DeleteModal
        zone={deleteZone}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteId(null);
          setDeleteZone(null);
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
