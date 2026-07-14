"use client";

import { useRef } from "react";
import { Upload, Trash2 } from "lucide-react";

export default function EditProfile({ profile, setProfile, onSubmit, saving = false }) {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setProfile((prev) => ({
      ...prev,
      image: imageUrl,
      profilePhotoFile: file,
    }));
  };

  const removeImage = () => {
    setProfile((prev) => ({
      ...prev,
      image: "/images/profile.png",
      profilePhotoPath: "",
      profilePhotoFile: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit?.(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Profile Image */}
      <div className="grid grid-cols-12 gap-5 items-start">
        <label className="col-span-12 md:col-span-3 font-semibold text-gray-600">Profile Image</label>

        <div className="col-span-12 md:col-span-9">
          {/* profile image preview */}
          <img src={profile.image || "/images/profile.png"} alt="Profile" className="w-32 h-32 rounded-lg object-cover border" />

          <div className="flex gap-3 mt-3">
            <button type="button" onClick={() => fileInputRef.current.click()} className="w-10 h-10 rounded-md bg-[#4154f1] text-white flex items-center justify-center hover:bg-[#2d43ea]">
              <Upload size={18} />
            </button>

            <button type="button" onClick={removeImage} className="w-10 h-10 rounded-md bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
              <Trash2 size={18} />
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </div>
        </div>
      </div>

      {/* Full Name */}
      <div className="grid grid-cols-12 gap-5 items-center">
        <label className="col-span-12 md:col-span-3 font-semibold text-gray-600">Full Name</label>

        <div className="col-span-12 md:col-span-9">
          <input type="text" name="fullName" value={profile.fullName} onChange={handleChange} className="w-full border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Country */}
      <div className="grid grid-cols-12 gap-5 items-center">
        <label className="col-span-12 md:col-span-3 font-semibold text-gray-600">Country</label>

        <div className="col-span-12 md:col-span-9">
          <input type="text" name="country" value={profile.country} onChange={handleChange} className="w-full border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-12 gap-5 items-start">
        <label className="col-span-12 md:col-span-3 font-semibold text-gray-600">Address</label>

        <div className="col-span-12 md:col-span-9">
          <textarea rows={3} name="address" value={profile.address} onChange={handleChange} className="w-full border rounded-md px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Phone */}
      <div className="grid grid-cols-12 gap-5 items-center">
        <label className="col-span-12 md:col-span-3 font-semibold text-gray-600">Phone</label>

        <div className="col-span-12 md:col-span-9">
          <input type="text" name="phone" value={profile.phone} onChange={handleChange} className="w-full border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Email */}
      <div className="grid grid-cols-12 gap-5 items-center">
        <label className="col-span-12 md:col-span-3 font-semibold text-gray-600">Email</label>

        <div className="col-span-12 md:col-span-9">
          <input type="email" name="email" value={profile.email} onChange={handleChange} className="w-full border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Account Type */}
      <div className="grid grid-cols-12 gap-5 items-center">
        <label className="col-span-12 md:col-span-3 font-semibold text-gray-600">Account Type</label>

        <div className="col-span-12 md:col-span-9">
          <select name="accountType" value={profile.accountType} onChange={handleChange} className="w-full border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Admin</option>
            <option>Manager</option>
            <option>Staff</option>
          </select>
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-center pt-3">
        <button type="submit" disabled={saving} className="bg-[#4154f1] hover:bg-[#3347e6] disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-md font-medium transition">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
