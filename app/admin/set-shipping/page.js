"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* ---------------- Inline icon components (no external deps) ---------------- */

const IconHome = (props) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" {...props}>
    <path d="M8 1.5 1 7.5V15h4.5V10a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 10.5 10v5H15V7.5L8 1.5Z" />
  </svg>
);

const IconSort = (props) => (
  <svg viewBox="0 0 12 16" width="10" height="14" fill="currentColor" {...props}>
    <path d="M6 0 2 4h8L6 0Zm0 16 4-4H2l4 4Z" opacity="0.55" />
  </svg>
);

const IconInfo = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16.5" />
    <circle cx="12" cy="7.7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);

const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" {...props}>
    <path d="M9 3.5h6l.8 1.5H20v1.5H4V5h4.2L9 3.5Z" />
    <path d="M5.5 8h13l-1 12.5a1.5 1.5 0 0 1-1.5 1.4h-8a1.5 1.5 0 0 1-1.5-1.4L5.5 8Zm4 2.2v9m5-9v9" stroke="#fff" strokeWidth="1.1" />
  </svg>
);

const IconArrowUp = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

/* ---------------- Dummy data (replace with API data later) ---------------- */

const AREA_NAMES = [
  "Naxal Area",
  "Lazimpat Area",
  "Maharajgunj Area",
  "Bishalnagar Area",
  "Baluwatar Area",
  "Chabahil Area",
  "Gaushala Area",
  "Sinamangal Area",
  "New Baneshwor Area",
  "Maitighar Area",
  "Thapathali Area",
  "Kalimati Area",
  "Kalanki Area",
  "Balaju Area",
  "Swayambhu Area",
  "Sundhara Area",
  "Ratnapark Area",
  "Putalisadak Area",
  "Dillibazar Area",
  "Baneshwor Area",
  "Koteshwor Area",
  "Tinkune Area",
  "Sinamangal-2 Area",
  "Gongabu Area",
  "Balkhu Area",
  "Kirtipur Area",
  "Sanepa Area",
  "Jawalakhel Area",
  "Pulchowk Area",
  "Kupondole Area",
  "Ekantakuna Area",
  "Satdobato Area",
  "Gwarko Area",
  "Balkumari Area",
  "Thimi Area",
  "Bhaktapur Area",
  "Suryabinayak Area",
  "Madhyapur Area",
  "Sallaghari Area",
  "Jorpati Area",
  "Sundarijal Area",
  "Budhanilkantha Area",
  "Tokha Area",
  "Dhapasi Area",
  "Samakhusi Area",
];

const DUMMY_SHIPPING = AREA_NAMES.map((area, i) => ({
  id: i + 1,
  province: "Bagmati Province",
  city: `Kathmandu Metro ${i + 1} - ${area}`,
  cost: i === 0 ? 3.0 : 70.0,
  applyShipping: true,
  createdAt: i === 0 ? "09 Sep 2024 05:40" : `16 Sep 2024 ${16}:${(27 + i).toString().padStart(2, "0") % 60 || "00"}`,
}));

export default function SetShippingCostPage() {
  const router = useRouter();
  const [rows, setRows] = useState(DUMMY_SHIPPING);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ province: "", city: "", cost: "" });

  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.province.toLowerCase().includes(q) || r.city.toLowerCase().includes(q));
  }, [rows, search]);

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = totalEntries === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, totalEntries);
  const pageRows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // build a small window of page numbers around current page (max 5 shown, like screenshot)
  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [currentPage, totalPages]);

  const toggleShipping = (id) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, applyShipping: !r.applyShipping } : r)));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ province: "", city: "", cost: "" });
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ province: row.province, city: row.city, cost: row.cost });
    setShowModal(true);
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Delete shipping cost for "${row.city}"?`)) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const handleSave = () => {
    if (!form.province.trim() || !form.city.trim() || form.cost === "") return;
    if (editing) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                province: form.province.trim(),
                city: form.city.trim(),
                cost: Number(form.cost),
              }
            : r,
        ),
      );
    } else {
      const nextId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
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
      setRows((prev) => [
        ...prev,
        {
          id: nextId,
          province: form.province.trim(),
          city: form.city.trim(),
          cost: Number(form.cost),
          applyShipping: true,
          createdAt,
        },
      ]);
    }
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] px-4 py-6 sm:px-8 sm:py-6 font-sans text-[#3b4256]">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-[28px] font-semibold text-[#232f4b] leading-tight">Set Shipping Cost</h1>
        <div className="flex items-center gap-1.5 text-[13px] text-[#9aa2b1]">
          <IconHome className="mr-0.5" />
          <span>Dashboard</span>
          <span className="text-[#c4cad6]">/</span>
          <span className="text-[#9aa2b1]">Set Shipping Cost</span>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-[10px] bg-white px-5 py-6 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:px-7">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-[#232f4b]">Set Shipping Cost</h2>
          <button onClick={() => router.push("/admin/set-shipping/add")} className="rounded-md bg-[#2f55d4] px-[18px] py-2 text-sm font-medium text-white hover:bg-[#2645b0]">
            Add Cost
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
                    S.N. <IconSort />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    Province <IconSort />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    City <IconSort />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    Shipping Cost <IconSort />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">Apply Shipping</th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">
                  <span className="inline-flex items-center gap-1">
                    Created At <IconSort />
                  </span>
                </th>
                <th className="whitespace-nowrap border-b-2 border-[#eef0f4] px-2 py-2.5 text-left font-semibold text-[#232f4b]">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9aa2b1]">
                    No matching records found
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 align-top text-[#2f55d4]">{(currentPage - 1) * perPage + i + 1}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 align-top font-medium text-[#232f4b]">{r.province}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 align-top text-[#4b5468]">{r.city}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 align-top text-[#4b5468]">{r.cost.toFixed(2)}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 align-top">
                      <button onClick={() => toggleShipping(r.id)} className={`relative inline-flex h-[22px] w-[42px] items-center rounded-full transition-colors ${r.applyShipping ? "bg-[#2f55d4]" : "bg-[#d5d9e3]"}`}>
                        <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${r.applyShipping ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                      </button>
                    </td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 align-top text-[#4b5468]">{r.createdAt}</td>
                    <td className="border-b border-[#f1f2f6] px-2 py-3 align-top">
                      <div className="flex gap-2">
                        <button title="View" className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#cfeaf7] bg-[#eef8fd] text-[#2f9bd6] hover:brightness-95">
                          <IconInfo />
                        </button>
                        <button title="Edit" onClick={() => openEdit(r)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#d6ddf7] bg-[#eef1fd] text-[#2f55d4] hover:brightness-95">
                          <IconEdit />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(r)} className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#e5534b] bg-[#e5534b] text-white hover:brightness-95">
                          <IconTrash />
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
            {pageNumbers.map((n) => (
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
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#2f55d4] text-white shadow-[0_4px_12px_rgba(47,85,212,0.4)]">
          <IconArrowUp />
        </button>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,26,46,0.45)]">
          <div onClick={(e) => e.stopPropagation()} className="w-[400px] max-w-[90vw] rounded-[10px] bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
            <h3 className="mb-4 text-lg text-[#232f4b]">{editing ? "Edit Shipping Cost" : "Add Shipping Cost"}</h3>

            <label className="mb-1.5 block text-[13px] text-[#6b7285]">Province</label>
            <input type="text" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} placeholder="Enter province name" className="mb-3 w-full rounded-md border border-[#dfe3ea] px-2.5 py-2 text-sm focus:border-[#2f55d4] focus:outline-none" />

            <label className="mb-1.5 block text-[13px] text-[#6b7285]">City</label>
            <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Enter city / area name" className="mb-3 w-full rounded-md border border-[#dfe3ea] px-2.5 py-2 text-sm focus:border-[#2f55d4] focus:outline-none" />

            <label className="mb-1.5 block text-[13px] text-[#6b7285]">Shipping Cost</label>
            <input type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} placeholder="0.00" className="mb-1 w-full rounded-md border border-[#dfe3ea] px-2.5 py-2 text-sm focus:border-[#2f55d4] focus:outline-none" />

            <div className="mt-5 flex justify-end gap-2.5">
              <button onClick={() => setShowModal(false)} className="rounded-md bg-[#f1f2f6] px-4 py-2 text-sm text-[#4b5468]">
                Cancel
              </button>
              <button onClick={handleSave} className="rounded-md bg-[#2f55d4] px-4 py-2 text-sm text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
