"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

const emptyForm = {
  team_name: "",
  team_role: "",
  team_linkedin: "",
  team_email: "",
  status: "1",
};

export default function EditTeamMember() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [existingImage, setExistingImage] = useState("");

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/v1/our-team/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.member) {
          setFormData({
            team_name: data.member.team_name || "",
            team_role: data.member.team_role || "",
            team_linkedin: data.member.team_linkedin || "",
            team_email: data.member.team_email || "",
            status: String(data.member.status ?? 1),
          });
          setExistingImage(data.member.team_image_full_url || data.member.team_image || "");
          setPreview(data.member.team_image_full_url || data.member.team_image || null);
        } else {
          toast.error(data.message || "Team member not found.");
        }
      } catch (error) {
        toast.error(error.message || "Failed to load team member.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMember();
  }, [id]);

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
    setPreview(existingImage || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.team_name.trim() || !formData.team_role.trim()) {
      toast.error("Name and role are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("team_name", formData.team_name);
      payload.append("team_role", formData.team_role);
      payload.append("team_linkedin", formData.team_linkedin);
      payload.append("team_email", formData.team_email);
      payload.append("status", formData.status);
      if (imageFile) payload.append("image", imageFile);

      const res = await fetch(`/api/v1/our-team/${id}`, {
        method: "PATCH",
        body: payload,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Team member updated successfully.");
        router.push("/admin/compliance/our-team");
      } else {
        toast.error(data.message || "Failed to update team member.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-600">Loading team member...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[720px] bg-white rounded-md shadow-sm px-10 py-8">
        <h1 className="text-center text-[#1b3a6b] text-xl font-bold mb-6">Edit Team Member</h1>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">Name</label>
          <input name="team_name" value={formData.team_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" />
        </div>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">Role</label>
          <input name="team_role" value={formData.team_role} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" />
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
          <input name="team_linkedin" value={formData.team_linkedin} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" />
        </div>

        <div className="mb-4">
          <label className="block text-[15px] text-gray-800 mb-1.5">Email</label>
          <input name="team_email" value={formData.team_email} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]" />
        </div>

        <div className="mb-6">
          <label className="block text-[15px] text-gray-800 mb-1.5">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8]">
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div className="flex justify-center gap-3">
          <button type="submit" disabled={saving} className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-sm font-medium px-5 py-2 rounded disabled:opacity-60">
            {saving ? "Updating..." : "Update Member"}
          </button>
          <button type="button" onClick={() => router.push("/admin/compliance/our-team")} className="bg-[#6c757d] hover:bg-[#5a6268] text-white text-sm font-medium px-5 py-2 rounded">
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
