"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const initialState = {
  team_name: "",
  team_role: "",
  team_linkedin: "",
  team_email: "",
  status: "1",
};

export default function AddTeamMember() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(initialState);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setFileName("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.team_name.trim() || !formData.team_role.trim()) {
      toast.error("Name and role are required.");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("team_name", formData.team_name);
      payload.append("team_role", formData.team_role);
      payload.append("team_linkedin", formData.team_linkedin);
      payload.append("team_email", formData.team_email);
      payload.append("status", formData.status);
      if (imageFile) payload.append("image", imageFile);

      const res = await fetch("/api/v1/our-team", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Team member added successfully.");
        router.push("/admin/compliance/our-team");
      } else {
        toast.error(data.message || "Failed to add team member.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2fa] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[720px] bg-white rounded-md shadow-sm px-10 py-8">
        <h1 className="text-center text-[#1b3a6b] text-xl font-bold mb-6">Add Team Member</h1>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">Name</label>
          <input name="team_name" value={formData.team_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" placeholder="Enter name" />
        </div>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">Role</label>
          <input name="team_role" value={formData.team_role} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" placeholder="Enter role" />
        </div>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">Image</label>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-[#eef0f3] border-r border-gray-300 px-3.5 py-2 text-sm text-gray-800 whitespace-nowrap">
              Choose File
            </button>
            <span className="flex-1 px-3 py-2 text-sm text-[#1b3a6b] truncate">{fileName || "No file chosen"}</span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          {preview && (
            <div className="relative mt-3 w-40 h-40">
              <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded border" />
              <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-lg font-bold hover:bg-red-600">
                ×
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">LinkedIn</label>
          <input name="team_linkedin" value={formData.team_linkedin} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" placeholder="https://linkedin.com/in/..." />
        </div>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">Email</label>
          <input name="team_email" value={formData.team_email} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" placeholder="Enter email" />
        </div>

        <div className="mb-6">
          <label className="block text-[15px] text-gray-800 mb-1.5">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]">
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div className="flex justify-center gap-3">
          <button type="submit" disabled={loading} className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-sm font-medium px-5 py-2 rounded disabled:opacity-60">
            {loading ? "Saving..." : "Add Team Member"}
          </button>
          <button type="button" onClick={() => router.push("/admin/compliance/our-team")} className="bg-[#6c757d] hover:bg-[#5a6268] text-white text-sm font-medium px-5 py-2 rounded">
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
