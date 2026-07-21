"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Folder, FolderOpen, LayoutDashboard, Link2 } from "lucide-react";
import toast from "react-hot-toast";

function CategoryNode({ category, organizedFiles, level = 0, onUploaded }) {
  const children = category.children || [];
  const hasChildren = children.length > 0;
  const isLeaf = !hasChildren;
  const files = organizedFiles?.[category.category_name] || [];
  const [open, setOpen] = useState(true);
  const [zipFile, setZipFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const uploadZip = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      toast.error("Please choose a ZIP file.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("zip_file", zipFile);
      formData.append("folder_name", category.category_name);

      const response = await fetch("/api/v1/admin/image-folder", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Upload failed.");
      }

      toast.success(data.message || "Files uploaded and extracted successfully!");
      setZipFile(null);
      onUploaded?.();
    } catch (error) {
      toast.error(error.message || "Failed to upload ZIP.");
    } finally {
      setUploading(false);
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 py-1" style={{ marginLeft: level * 20 }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 text-left text-sm text-slate-700 hover:bg-slate-100 rounded px-2 py-1 w-full"
          >
            {open ? <FolderOpen size={16} className="text-slate-500" /> : <Folder size={16} className="text-slate-500" />}
            <span className="flex-1 font-medium">{category.category_name}</span>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1 text-sm text-slate-700">
            <Folder size={16} className="text-slate-500" />
            <span className="font-medium">{category.category_name}</span>
          </div>
        )}
      </div>

      {open && (
        <div className="border-l border-dashed border-slate-200 pl-4" style={{ marginLeft: level * 20 + 12 }}>
          {isLeaf && (
            <form onSubmit={uploadZip} className="bg-slate-50 rounded p-3 mb-3 space-y-2">
              <label className="block text-sm text-slate-700">Upload ZIP file:</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-200 file:px-3 file:py-1.5"
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          )}

          {files.length > 0 ? (
            <ul className="space-y-1 mb-3">
              {files.map((file) => {
                const url = `/images/uploads/${file.split("/").map(encodeURIComponent).join("/")}`;
                return (
                  <li
                    key={file}
                    className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-blue-50"
                    onMouseEnter={() => setPreviewUrl(url)}
                    onMouseLeave={() => setPreviewUrl("")}
                  >
                    <Link2 size={14} className="text-slate-500 shrink-0" />
                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                      {file.split("/").pop()}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(`${window.location.origin}${url}`)}
                      className="text-blue-600 hover:text-blue-800 shrink-0"
                      title="Copy link"
                    >
                      <Copy size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            isLeaf && <p className="text-sm text-slate-500 italic mb-3">No files available in this folder.</p>
          )}

          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              organizedFiles={organizedFiles}
              level={level + 1}
              onUploaded={onUploaded}
            />
          ))}
        </div>
      )}

      {previewUrl ? (
        <div
          className="fixed top-[30%] right-[80px] z-50 w-[220px] h-[220px] rounded-xl border-4 border-slate-600 bg-white bg-contain bg-center bg-no-repeat shadow-xl"
          style={{ backgroundImage: `url('${previewUrl}')` }}
        />
      ) : null}
    </div>
  );
}

export default function UploadImageFolderPage() {
  const [categories, setCategories] = useState([]);
  const [organizedFiles, setOrganizedFiles] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/image-folder", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load folders.");
      }
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setOrganizedFiles(data.organizedFiles || {});
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to load folders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#eef2f9] flex flex-col">
      <div className="flex-1 px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1a2b6d]">Upload Image Folder</h1>
          <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            <LayoutDashboard className="w-4 h-4 text-gray-500" />
            <span>Dashboard</span>
            <span className="mx-1">/</span>
            <span>Upload Image Folder</span>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm max-w-6xl">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-[#1a2b6d]">Upload Zipped Folder</h2>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <p className="text-slate-500 text-sm">Loading categories...</p>
            ) : categories.length ? (
              <div className="category-tree">
                {categories.map((category) => (
                  <CategoryNode
                    key={category.id}
                    category={category}
                    organizedFiles={organizedFiles}
                    onUploaded={loadData}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No categories found.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
