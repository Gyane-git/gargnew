"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowUp, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

const RichTextEditor = dynamic(() => import("../RichTextEditor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const INITIAL_CONTENT = `<h1>
  Medical Certifications
</h1>
<p>At <strong>Garg Dental</strong>, we only deal in medical and dental equipment that meet recognized national and international certification standards. We work with manufacturers and importers who follow strict regulatory compliance, ensuring that the products we deliver are safe, reliable, and approved for clinical use.</p>`;

let uid = 0;
const nextId = () => `cert-${Date.now()}-${uid++}`;

const createEmptyRow = () => ({
  id: nextId(),
  title: "",
  file: null,
  preview: "",
});

export default function MedicalCertificationsPage() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [rows, setRows] = useState([]);
  const [uploaded, setUploaded] = useState([]);
  const [loadingUploaded, setLoadingUploaded] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setRows([createEmptyRow()]);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchUploaded = async () => {
      try {
        const response = await fetch("/api/v1/compliance/medical-certifications");
        const data = await response.json();
        console.log(data);

        if (!response.ok) {
          throw new Error(data.message);
        }
        setContent(data.content || INITIAL_CONTENT);
        setUploaded(data.certifications || []);
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to load uploaded certifications.");
      } finally {
        setLoadingUploaded(false);
      }
    };

    fetchUploaded();
  }, []);

  const handleContentChange = useCallback((value) => {
    setContent(value);
  }, []);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);

  const handleRemoveRow = useCallback((id) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  }, []);

  const handleTitleChange = useCallback((id, value) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, title: value } : row)));
  }, []);

  const handleFileChange = useCallback((id, file) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              file,
              preview: file && file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
            }
          : row,
      ),
    );
  }, []);

  const handleSubmitAll = useCallback(
    async (event) => {
      event.preventDefault();

      const validRows = rows.filter((row) => row.title.trim() && row.file);

      if (!validRows.length) {
        toast.error("Please add at least one certification title with a file.");
        return;
      }

      try {
        setSubmitting(true);

        const formData = new FormData();
        formData.append("description", content);
        validRows.forEach((row, index) => {
          formData.append(`certifications[${index}][title]`, row.title);
          formData.append(`certifications[${index}][file]`, row.file);
        });

        const response = await fetch("/api/v1/compliance/medical-certifications", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        toast.success(data.message || "Certifications submitted successfully.");
        setUploaded((prev) => [...prev, ...(data.certifications || [])]);
        setRows([createEmptyRow()]);
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to submit certifications.");
      } finally {
        setSubmitting(false);
      }
    },
    [rows, content],
  );

  const handleDeleteUploaded = useCallback(async (id) => {
    try {
      setDeletingId(id);

      const response = await fetch(`/api/v1/compliance/medical-certifications/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setUploaded((prev) => prev.filter((item) => item.id !== id));
      toast.success(data.message || "Certification deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to delete certification.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f9]">
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl space-y-6">
          {/* Card 1: description + certification form */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
              <h1 className="text-center text-xl font-bold text-indigo-900">Add Medical Certifications</h1>
            </div>

            <form onSubmit={handleSubmitAll} className="px-6 py-6 sm:px-8">
              <label htmlFor="medical-certifications-editor" className="mb-2 block text-sm text-gray-700">
                Medical Certifications Details
              </label>

              <div id="medical-certifications-editor">
                <RichTextEditor value={content} onChange={handleContentChange} />
              </div>

              <h2 className="mt-8 text-center text-lg font-bold text-indigo-900">Certifications</h2>

              <div className="mt-4 space-y-4">
                {rows.map((row, index) => (
                  <div key={row.id} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                    <div>
                      <label htmlFor={`cert-title-${row.id}`} className="mb-1.5 block text-sm text-gray-700">
                        Certification Title
                      </label>
                      <input id={`cert-title-${row.id}`} type="text" value={row.title} onChange={(event) => handleTitleChange(row.id, event.target.value)} placeholder="Enter certification title" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label htmlFor={`cert-file-${row.id}`} className="mb-1.5 block text-sm text-gray-700">
                          Certificate
                        </label>
                        <div className="flex overflow-hidden rounded-md border border-gray-300">
                          <label htmlFor={`cert-file-${row.id}`} className="cursor-pointer whitespace-nowrap bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">
                            Choose File
                          </label>
                          <span className="flex flex-1 items-center truncate px-3 py-2 text-sm text-gray-500">{row.file ? row.file.name : "No file chosen"}</span>
                          <input id={`cert-file-${row.id}`} type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => handleFileChange(row.id, event.target.files?.[0] || null)} />
                        </div>
                      </div>

                      {rows.length > 1 && (
                        <button type="button" onClick={() => handleRemoveRow(row.id)} aria-label="Remove certification" className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button type="button" onClick={handleAddRow} className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  <Plus className="h-4 w-4" />
                  Add Another Certification
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: uploaded certifications */}
          <div className="overflow-hidden rounded-xl bg-white px-6 py-6 shadow-sm sm:px-8">
            {rows.some((row) => row.preview) && (
              <>
                <h2 className="mb-4 text-lg font-bold text-indigo-900">Selected Certifications</h2>

                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {rows
                    .filter((row) => row.preview)
                    .map((row) => (
                      <div key={row.id} className="relative rounded-md border border-gray-200 p-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      file: null,
                                      preview: "",
                                    }
                                  : r,
                              ),
                            )
                          }
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
                          <img src={row.preview} alt={row.title} className="h-full w-full object-contain" />
                        </div>

                        {/* <p className="truncate text-sm font-medium text-indigo-900">{row.title || "Untitled"}</p> */}
                        <p className="truncate text-sm font-medium text-indigo-900">{row.title || row.file?.name || "Untitled"}</p>
                      </div>
                    ))}
                </div>
              </>
            )}
            <h2 className="mb-4 text-lg font-bold text-indigo-900">Uploaded Certifications</h2>

            {loadingUploaded ? (
              <UploadedSkeleton />
            ) : uploaded.length === 0 ? (
              <p className="text-sm text-gray-500">No certifications uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {uploaded.map((item) => (
                  <div key={item.id} className="rounded-md border border-gray-200 p-2 text-center">
                    <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.fileUrl} alt={item.title} className="h-full w-full object-contain" />
                    </div>
                    <p className="mb-2 truncate text-sm font-medium text-indigo-900">{item.title}</p>
                    <button type="button" onClick={() => handleDeleteUploaded(item.id)} disabled={deletingId === item.id} className="w-full rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button type="button" onClick={handleSubmitAll} disabled={submitting} className="rounded-md bg-green-700 px-8 py-2.5 font-medium text-white hover:bg-green-800 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit All Certifications"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <button type="button" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`fixed bottom-8 right-8 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg transition-opacity hover:bg-indigo-700 ${showScrollTop ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-md border border-gray-300">
      <div className="h-10 border-b border-gray-300 bg-gray-50" />
      <div className="space-y-3 bg-white p-4">
        <div className="h-4 w-1/3 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
      </div>
    </div>
  );
}

function UploadedSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse rounded-md border border-gray-200 p-2">
          <div className="mb-2 h-28 rounded-sm bg-gray-100" />
          <div className="mx-auto mb-2 h-3 w-2/3 rounded bg-gray-100" />
          <div className="h-6 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
