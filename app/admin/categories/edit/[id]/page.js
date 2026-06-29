"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditCategoryPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [form, setForm] = useState({
    category_name: "",
    parent_id: "",
    image: "",
    top: 0,
    status: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/v1/categories/${id}`);
        const data = await res.json();

        const allRes = await fetch("/api/v1/categories");
        const allData = await allRes.json();

        if (!data.success) {
          toast.error("Category not found");
          router.push("/admin/categories");
          return;
        }

        const category = data.category;

        setForm({
          category_name: category.category_name || "",
          parent_id: category.parent_id ?? "",
          image: category.image || "",
          top: category.top ?? 0,
          status: category.status ?? 0,
        });

        setAllCategories(allData.categories || []);

        if (category.image) {
          setPreview(category.image);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "top" || name === "status" ? Number(value) : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // // To remove preview image
  // const handleRemoveImage = () => {
  //   setImage(null);
  //   setPreview(null);
  // };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreview(null);
    setRemoveImage(true); // IMPORTANT
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("category_name", form.category_name);
      formData.append("parent_id", form.parent_id ?? "");
      formData.append("top", form.top);
      formData.append("status", form.status);

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (removeImage) {
        formData.append("remove_image", "1"); // tell backend to delete
      } else {
        formData.append("existing_image", form.image || "");
      }

      const res = await fetch(`/api/v1/categories/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Category updated!");
        router.push("/admin/categories");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-2xl mx-auto text-black">
        <h1 className="text-2xl font-bold text-[#1a3a6b] mb-6">Edit Category</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Category Name</label>
            <input type="text" name="category_name" value={form.category_name} onChange={handleChange} className="w-full border p-2 rounded-lg" required />
          </div>

          {/* Parent */}
          <div>
            <label className="block mb-1 font-medium">Parent Category</label>

            <select name="parent_id" value={form.parent_id} onChange={handleChange} className="w-full border p-2 rounded-lg bg-white">
              <option value="">None (Main Category)</option>

              {allCategories
                .filter((cat) => Number(cat.id) !== Number(id))
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Top + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Top</label>
              <select name="top" value={form.top} onChange={handleChange} className="w-full border p-2 rounded">
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>

            <div>
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Image</label>

            <label className="flex items-center w-1/2 border border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-teal-500 transition-colors bg-white">
              <span className="px-4 py-2 bg-gray-100 border-r border-gray-300 text-sm font-semibold text-gray-800 whitespace-nowrap">Choose File</span>

              <span className="px-3 py-2 text-sm text-gray-400 truncate">{imageFile ? imageFile.name : "No file chosen"}</span>

              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            {/* {preview && <img src={preview} alt="Preview" className="mt-3 h-40 w-40 object-cover rounded-lg border bg-white" />} */}
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
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded">
              {submitting ? "Updating..." : "Update"}
            </button>

            <button type="button" onClick={() => router.push("/admin/categories")} className="bg-gray-500 text-white px-6 py-2 rounded">
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
