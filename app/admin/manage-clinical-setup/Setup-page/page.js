"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

// Sample data — backend dev replaces with real API data
const sampleVideo = {
  title: "New Clinic Setup Guide",
  description:
    "Watch our detailed walkthrough of the clinic setup process and see how we can help you create your dream dental practice.",
  link: "https://www.youtube.com/watch?v=yCLfAm807JM",
  embedSrc: "https://www.youtube.com/embed/yCLfAm807JM",
};

const sampleCoverImage = "https://placehold.co/900x300?text=Cover+Image";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-3 sm:p-6">

        {/* Breadcrumb */}
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

        {/* Section 1 — Cover Image */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-5 py-3 rounded-t-lg bg-blue-600">
            <h2 className="text-base font-semibold text-white">Setup Cover Image</h2>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Choose Cover Image</label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-600
                           file:mr-3 file:py-1.5 file:px-4
                           file:rounded file:border file:border-gray-300
                           file:text-sm file:text-gray-700 file:bg-white
                           file:cursor-pointer hover:file:bg-gray-50 transition"
              />
            </div>

            {/* Current cover image */}
            <div className="border border-gray-200 rounded-lg overflow-hidden w-full max-w-2xl">
              <img
                src={sampleCoverImage}
                alt="Cover preview"
                className="w-full object-cover max-h-56"
              />
            </div>

            <button className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition">
              Upload Cover Image
            </button>
          </div>
        </div>

        {/* Section 2 — YouTube Video */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-5 py-3 rounded-t-lg bg-green-600">
            <h2 className="text-base font-semibold text-white">Setup YouTube Video</h2>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Video Title</label>
              <input
                type="text"
                defaultValue={sampleVideo.title}
                placeholder="Enter video title"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded
                           text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Video Description</label>
              <textarea
                defaultValue={sampleVideo.description}
                placeholder="Enter video description"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded
                           text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">YouTube Video Link</label>
              <input
                type="url"
                defaultValue={sampleVideo.link}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded
                           text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Video preview */}
            <div>
              <p className="text-sm text-gray-700 mb-2">Preview</p>
              <div className="w-full rounded-lg overflow-hidden border border-gray-200 aspect-video">
                <iframe
                  src={sampleVideo.embedSrc}
                  title={sampleVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            <button className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition">
              Save Video
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="py-5 text-center text-sm text-gray-500 border-t border-gray-200">
        Copyright &copy; 2026{" "}
        <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}