"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

//  Build Tree (same logic as categories/page.js)
const buildTree = (data) => {
  const map = {};
  const tree = [];

  data.forEach((cat) => (map[cat.id] = { ...cat, children: [] }));

  data.forEach((cat) => {
    if (cat.parent_id) {
      map[cat.parent_id]?.children.push(map[cat.id]);
    } else {
      tree.push(map[cat.id]);
    }
  });

  return tree;
};

//  Recursive Options Renderer
const renderCategoryOptions = (categories, level = 0) => {
  return categories.flatMap((cat) => [
    <option key={cat.id} value={cat.id}>
      {"— ".repeat(level) + cat.category_name}
    </option>,
    ...(cat.children?.length ? renderCategoryOptions(cat.children, level + 1) : []),
  ]);
};

export default function AddCategoryPage() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/v1/categories");
        const data = await res.json();

        if (data.success) {
          setCategories(buildTree(data.categories || []));
        } else {
          toast.error("Failed to load categories");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading categories");
      }
    };

    fetchCategories();
  }, []);

  // Image Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setImage(null);
      setPreview(null);
    }
  };

  // To remove preview image
  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      toast.error("Category name is required!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("parentCategory", parentCategory);
      if (image) formData.append("image", image);

      const res = await fetch("/api/v1/categories", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Category added successfully!");
        setTimeout(() => router.push("/admin/categories"), 1500);
      } else {
        toast.error(data.message || "Error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }

    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#1a3a6b] text-center mb-8">Add Category</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name + Parent */}
            <div className="grid grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Parent Category</label>

                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">None (Main Category)</option>

                  {renderCategoryOptions(categories)}
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Image</label>

              <label className="flex items-center w-1/2 border border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-teal-500 transition-colors bg-white">
                <span className="px-4 py-2 bg-gray-100 border-r border-gray-300 text-sm font-semibold text-gray-800 whitespace-nowrap">Choose File</span>

                <span className="px-3 py-2 text-sm text-gray-400 truncate">{image ? image.name : "No file chosen"}</span>

                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              {preview && (
                <div className="relative mt-3 w-40 h-40">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg border bg-white" />

                  {/* ✕ Remove Button */}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`bg-teal-600 text-white py-2 px-8 rounded-lg font-medium hover:bg-teal-700 transition-colors ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {loading ? "Adding..." : "Add Category"}
              </button>

              <button type="button" onClick={() => router.back()} className="bg-gray-500 text-white py-2 px-8 rounded-lg font-medium hover:bg-gray-600 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
