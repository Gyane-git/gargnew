"use client";

import { ChevronDown, LayoutDashboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function UploadProductImagesPage() {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagesFile, setImagesFile] = useState(null);
  const [productsFile, setProductsFile] = useState(null);
  const [imagesFileName, setImagesFileName] = useState("No file chosen");
  const [productsFileName, setProductsFileName] = useState("No file chosen");
  const [importingImages, setImportingImages] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);

  const imagesInputRef = useRef(null);
  const productsInputRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/v1/admin/excel-upload/templates/category-list", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load categories.");
        }
        setCategories(Array.isArray(data.flat) ? data.flat : []);
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to load categories.");
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const closeMenus = (event) => {
      if (!event.target.closest("[data-dropdown]")) {
        setTemplateMenuOpen(false);
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  const handleFileChange = (e, setFile, setName) => {
    const file = e.target.files?.[0] || null;
    setFile(file);
    setName(file ? file.name : "No file chosen");
  };

  const downloadTemplate = (type, categoryId = null) => {
    const qs = categoryId ? `?category_id=${categoryId}` : "";
    window.location.href = `/api/v1/admin/excel-upload/templates/${type}${qs}`;
    setTemplateMenuOpen(false);
    setCategoryMenuOpen(false);
  };

  const uploadExcel = async ({ file, endpoint, setLoading, successFallback }) => {
    if (!file) {
      toast.error("Please choose an Excel file first.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Upload failed.");
      }

      toast.success(data.message || successFallback);

      if (Array.isArray(data.errors) && data.errors.length) {
        console.warn("Import warnings:", data.errors);
        toast.error(data.errors.slice(0, 2).join(" | "), { duration: 8000 });
        if (data.errors.length > 2) {
          toast.error(`+${data.errors.length - 2} more row warning(s). Check console.`, { duration: 6000 });
        }
      }
    } catch (error) {
      toast.error(error.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] flex flex-col">
      <div className="flex-1 px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1a2b6d]">Upload Product &amp; Images</h1>
          <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            <LayoutDashboard className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Dashboard</span>
            <span className="mx-1">/</span>
            <span className="text-gray-400">Upload Product &amp; Images</span>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm max-w-6xl">
          <div className="flex items-center justify-between px-6 py-5 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-[#1a2b6d] whitespace-nowrap">Upload through Excel</h2>

            <div className="flex items-center gap-4 relative flex-wrap">
              <div className="relative" data-dropdown>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryMenuOpen((v) => !v);
                    setTemplateMenuOpen(false);
                  }}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded"
                >
                  Image Templates by Category
                  <ChevronDown size={16} />
                </button>
                {categoryMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-auto bg-white rounded shadow-lg border border-gray-100 py-2 z-10">
                    {categories.length ? (
                      categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => downloadTemplate("images", category.id)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          style={{ paddingLeft: `${16 + category.level * 14}px` }}
                        >
                          {category.category_name}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-2 text-sm text-gray-500">No categories found.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" data-dropdown>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateMenuOpen((v) => !v);
                    setCategoryMenuOpen(false);
                  }}
                  className="flex items-center gap-2 bg-[#1e6b3c] hover:bg-[#175a31] text-white text-sm font-medium px-4 py-2 rounded"
                >
                  Download Templates
                  <ChevronDown size={16} />
                </button>

                {templateMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded shadow-lg border border-gray-100 py-2 z-10">
                    <button
                      type="button"
                      onClick={() => downloadTemplate("categories")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Categories List
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadTemplate("brands")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Brands List
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadTemplate("products")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Product Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="px-6 py-6 flex items-center gap-4 flex-wrap">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => imagesInputRef.current?.click()}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800"
              >
                Choose File
              </button>
              <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{imagesFileName}</span>
              <input
                ref={imagesInputRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                className="hidden"
                onChange={(e) => handleFileChange(e, setImagesFile, setImagesFileName)}
              />
            </div>
            <button
              type="button"
              disabled={importingImages}
              onClick={() =>
                uploadExcel({
                  file: imagesFile,
                  endpoint: "/api/v1/admin/excel-upload/import-images",
                  setLoading: setImportingImages,
                  successFallback: "Import successful!",
                })
              }
              className="bg-[#1a73e8] hover:bg-[#1662c4] disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded"
            >
              {importingImages ? "Importing..." : "Import Images"}
            </button>
          </div>

          <div className="px-6 pb-6 flex items-center gap-4 flex-wrap">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => productsInputRef.current?.click()}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800"
              >
                Choose File
              </button>
              <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{productsFileName}</span>
              <input
                ref={productsInputRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                className="hidden"
                onChange={(e) => handleFileChange(e, setProductsFile, setProductsFileName)}
              />
            </div>
            <button
              type="button"
              disabled={importingProducts}
              onClick={() =>
                uploadExcel({
                  file: productsFile,
                  endpoint: "/api/v1/admin/excel-upload/import-products",
                  setLoading: setImportingProducts,
                  successFallback: "Products upload successful!",
                })
              }
              className="bg-[#1a73e8] hover:bg-[#1662c4] disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded"
            >
              {importingProducts ? "Importing..." : "Import Products"}
            </button>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
