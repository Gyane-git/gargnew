"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddTeamMember() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    image: null,
    linkedin: "",
    email: "",
    status: "Inactive",
  });
  const fileInputRef = useRef(null);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFileName(file.name);
      setFormData((prev) => ({ ...prev, image: file }));

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setFileName("");
      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form data:", formData);
  };

  const handleBack = () => {
    window.history.back();
  };
  const removeImage = () => {
    setImagePreview(null);
    setFileName("");
    setFormData((prev) => ({ ...prev, image: null }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2fa] flex items-center justify-center p-10">
      <form onSubmit={handleSubmit} className="w-full max-w-[690px] bg-white rounded-md shadow-sm px-10 py-8">
        <h1 className="text-center text-[#1b3a6b] text-xl font-bold mb-6">Add Team Member</h1>

        <label htmlFor="name" className="block text-[15px] text-gray-800 mb-1.5">
          Name
        </label>
        <input id="name" type="text" placeholder="Enter name" value={formData.name} onChange={handleChange("name")} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8] placeholder:text-gray-400" />

        <label htmlFor="role" className="block text-[15px] text-gray-800 mb-1.5 mt-[18px]">
          Role
        </label>
        <input id="role" type="text" placeholder="Enter role" value={formData.role} onChange={handleChange("role")} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8] placeholder:text-gray-400" />

        <label htmlFor="image" className="block text-[15px] text-gray-800 mb-1.5 mt-[18px]">
          Image
        </label>
        <div className="flex border border-gray-300 rounded overflow-hidden">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-[#eef0f3] border-r border-gray-300 px-3.5 py-2 text-sm text-gray-800 whitespace-nowrap">
            Choose File
          </button>
          <span className="flex-1 px-3 py-2 text-sm text-[#1b3a6b] truncate">{fileName}</span>
          <input ref={fileInputRef} id="imageInput" type="file" className="hidden" onChange={handleFileChange} />
        </div>
        {imagePreview && (
          <div className="relative mt-4 w-40">
            <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded border" />

            <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-lg font-bold hover:bg-red-600">
              ×
            </button>
          </div>
        )}

        <label htmlFor="linkedin" className="block text-[15px] text-gray-800 mb-1.5 mt-[18px]">
          LinkedIn
        </label>
        <input id="linkedin" type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedin} onChange={handleChange("linkedin")} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8] placeholder:text-gray-400" />

        <label htmlFor="email" className="block text-[15px] text-gray-800 mb-1.5 mt-[18px]">
          Email
        </label>
        <input id="email" type="email" placeholder="Enter email" value={formData.email} onChange={handleChange("email")} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8] placeholder:text-gray-400" />

        <label htmlFor="status" className="block text-[15px] text-gray-800 mb-1.5 mt-[18px]">
          Status
        </label>
        <select id="status" value={formData.status} onChange={handleChange("status")} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#8aa5d8] text-gray-800 appearance-none bg-no-repeat bg-[right_0.75rem_center]">
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <div className="flex justify-center items-center gap-[110px] mt-7">
          <button type="submit" className="bg-[#2e7d55] hover:bg-[#276b48] text-white text-sm font-medium rounded px-6 py-2.5">
            Add Our Team
          </button>
          <button type="button" onClick={() => router.back()} className="bg-[#6c757d] hover:bg-[#5a6268] text-white text-sm font-medium rounded px-6 py-2.5">
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
