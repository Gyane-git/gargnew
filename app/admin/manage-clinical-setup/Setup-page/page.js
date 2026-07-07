"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutDashboard, Upload, Link as LinkIcon, Video } from "lucide-react";
import { toast } from "react-hot-toast";

const getEmbedUrl = (url) => {
  const match = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^\s&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
};

export default function SetupPage() {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentCoverImage, setCurrentCoverImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [form, setForm] = useState({
    clinic_video_title: "",
    clinic_video_link: "",
    clinic_video_description: "",
  });
  const [coverFile, setCoverFile] = useState(null);

  const embedUrl = useMemo(() => getEmbedUrl(form.clinic_video_link), [form.clinic_video_link]);

  useEffect(() => {
    const fetchSetup = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/clinic/clinic-setup");
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to load setup");

        const clinicMap = Object.fromEntries((data.clinic || []).map((item) => [item.key, item]));

        const cover = clinicMap.clinic_cover_image?.clinic_cover_image_full_url || "";
        setCurrentCoverImage(cover);
        setPreviewImage(cover);
        setForm({
          clinic_video_title: clinicMap.clinic_video_title?.value || "",
          clinic_video_link: clinicMap.clinic_video_link?.value || "",
          clinic_video_description: clinicMap.clinic_video_description?.value || "",
        });
      } catch (error) {
        toast.error(error.message || "Failed to load setup");
      } finally {
        setLoading(false);
      }
    };

    fetchSetup();
  }, []);

  const handleRemoveCover = () => {
    setCoverFile(null);
    setPreviewImage(currentCoverImage || "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("clinic_video_title", form.clinic_video_title);
      fd.append("clinic_video_link", form.clinic_video_link);
      fd.append("clinic_video_description", form.clinic_video_description);
      if (coverFile) fd.append("clinic_cover_image", coverFile);

      const res = await fetch("/api/v1/clinic/clinic-setup", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save setup");

      const clinicMap = Object.fromEntries((data.clinic || []).map((item) => [item.key, item]));
      const cover = clinicMap.clinic_cover_image?.clinic_cover_image_full_url || "";
      setCurrentCoverImage(cover);
      setPreviewImage(cover);
      setCoverFile(null);
      toast.success("Clinic setup saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-900">Setup Page</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <LayoutDashboard size={14} />
            <Link href="/admin/dashboard" className="hover:underline text-gray-500">
              Dashboard
            </Link>
            <span>/</span>
            <span>Setup Page</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-5 py-3 rounded-t-lg bg-blue-600">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Upload size={16} /> Setup Cover Image
              </h2>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Choose Cover Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-gray-300" />
              </div>

              <div className="relative border border-gray-200 rounded-lg overflow-hidden w-full max-w-2xl bg-gray-50">
                {previewImage ? (
                  <>
                    <img src={previewImage} alt="Cover preview" className="w-full object-cover max-h-56" />

                    <button type="button" onClick={handleRemoveCover} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                      ✕
                    </button>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No cover image selected</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-5 py-3 rounded-t-lg bg-green-600">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Video size={16} /> Setup YouTube Video
              </h2>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Video Title</label>
                <input type="text" name="clinic_video_title" value={form.clinic_video_title} onChange={handleChange} placeholder="Enter video title" className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Video Description</label>
                <textarea name="clinic_video_description" value={form.clinic_video_description} onChange={handleChange} placeholder="Enter video description" rows={4} className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 resize-y" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
                  <LinkIcon size={14} /> YouTube Video Link
                </label>
                <input type="url" name="clinic_video_link" value={form.clinic_video_link} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-2">Preview</p>

                <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                  {embedUrl ? (
                    <>
                      <iframe src={embedUrl} title={form.clinic_video_title || "Clinic Setup Video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />

                      {/* Remove Preview Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            clinic_video_link: "",
                          }))
                        }
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Paste a valid YouTube link to preview</div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={saving || loading} className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Video"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Current Setup Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-medium">Cover Image</p>
              <p className="break-all text-gray-500">{currentCoverImage || "No cover image saved yet"}</p>
            </div>
            <div>
              <p className="font-medium">Video Link</p>
              <p className="break-all text-gray-500">{form.clinic_video_link || "No video link saved yet"}</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-200">
        Copyright &copy; 2026 <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
