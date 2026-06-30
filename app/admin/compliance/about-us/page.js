"use client";

import React, { useState } from "react";
import { ArrowUp, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "../RichTextEditor";

export default function AddAboutUs() {
  // State to hold the rich text editor values
  const [aboutUsContent, setAboutUsContent] = useState(
    `<p><strong>Welcome to Garg Dental Pvt. Ltd. – Nepal’s Trusted Partner in Advanced Dental Solutions.</strong></p><p>Founded in <strong>2002</strong> and headquartered in <strong>Kathmandu</strong>, Garg Dental Pvt. Ltd. has been a pioneer in supplying <strong>premium dental equipment, instruments, and consumables</strong> across Nepal. As an <strong>authorized importer and distributor</strong> of globally recognized dental brands, we are dedicated to empowering dental professionals with reliable, innovative, and high-quality solutions.</p><p>For over <strong>two decades</strong>, we have proudly supported clinics, hospitals, and institutions nationwide — ensuring they have access to the latest advancements in modern dentistry. Our <strong>diverse product portfolio</strong> covers every key area of dental practice, from diagnostic tools to treatment and sterilization systems.</p><p>Backed by a <strong>team of 50+ experienced professionals</strong>, Garg Dental continues to set benchmarks in <strong>authenticity, quality, and service excellence</strong>. We believe that every product we deliver contributes to better oral healthcare outcomes for patients across Nepal.</p><p>At Garg Dental, we don't just supply products — we build <strong>long-term partnerships</strong> based on <strong>trust, integrity, and performance</strong>.</p>`,
  );

  const [storyDescription, setStoryDescription] = useState(
    `<p>Welcome to <strong>Garg Dental Pvt. Ltd.</strong> is Nepal's trusted partner in advanced dental solutions. Established in 2002 and headquartered in Kathmandu, we are an <strong>authorized importer and distributor</strong> of high-quality dental equipment, instruments, and consumables.</p><p>For over two decades, we have proudly supported dental professionals and institutions across Nepal — providing them with reliable products that enable exceptional patient care. Our diverse portfolio covers every major area of modern dentistry, ensuring that practitioners have access to the latest innovations and trusted global brands.</p><p>With a dedicated team of over 50 skilled professionals, Garg Dental is committed to setting the standard for dental supply and marketing services in Nepal. Our focus is on <strong>authenticity, quality, and service excellence</strong>, and we take pride in delivering products that meet rigorous international standards.</p>`,
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans text-gray-700">
      {/* Main Content Area */}
      <main className="flex-grow p-6 w-full max-w-6xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden pb-8">
          {/* Form Header */}
          <div className="pt-6 pb-4 mb-2 text-center">
            <h1 className="text-xl font-semibold text-[#003399]">Add About Us</h1>
          </div>

          <div className="px-8 space-y-8">
            {/* Top Section: Video, Title, YT Link */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Intro Video */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-700">Introduction Video</label>
                <input type="file" className="block w-full text-sm text-gray-500 file:mr-0 file:py-2 file:px-3 file:border-0 file:border-r file:border-gray-300 file:bg-gray-50 file:text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white" />
                {/* Video Placeholder */}
                <div className="w-full bg-[#1c1c1c] aspect-video rounded-sm flex flex-col justify-end p-3 mt-2">
                  <div className="flex items-center text-gray-400 text-xs space-x-4">
                    <span className="cursor-pointer hover:text-white">▶</span>
                    <span>0:00</span>
                    <span className="flex-grow"></span>
                    <span className="cursor-pointer hover:text-white">🔊</span>
                    <span className="cursor-pointer hover:text-white">[ ]</span>
                    <span className="cursor-pointer hover:text-white">⋮</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-700">Title</label>
                <input type="text" defaultValue="About Garg Dental" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </div>

              {/* YT Link */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-700">Youtube Video Link</label>
                <input type="text" defaultValue="https://www.youtube.com/watch?v=l" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* About Us Editor Section */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">About Us</label>
              <div className="prose max-w-none border border-gray-300 rounded overflow-hidden">
                <RichTextEditor value={aboutUsContent} onChange={setAboutUsContent} />
              </div>
            </div>

            {/* Our Story Title */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Our Story Title</label>
              <input type="text" defaultValue="Our Story" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>

            {/* Story Item Box */}
            <div className="border border-gray-200 rounded p-6 bg-white shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm text-gray-700">Story Image</label>
                  <input type="file" className="block w-full text-sm text-gray-500 file:mr-0 file:py-2 file:px-3 file:border-0 file:border-r file:border-gray-300 file:bg-gray-50 file:text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-gray-700">Story Name</label>
                  <input type="text" defaultValue="Umesh Agrawal" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-gray-700">Story Designation</label>
                  <input type="text" defaultValue="Managing Director" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white" />
                </div>
              </div>

              {/* Story Image Preview Placeholder */}
              <div className="flex items-center text-sm text-gray-600">
                <ImageIcon size={18} className="mr-2 text-gray-400" />
                <span>Story Image</span>
              </div>

              {/* Story Description Editor */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-700">Story Description</label>
                <div className="prose max-w-none border border-gray-300 rounded overflow-hidden">
                  <RichTextEditor value={storyDescription} onChange={setStoryDescription} />
                </div>
              </div>

              {/* Delete Button */}
              <div className="flex justify-end pt-2">
                <button className="bg-[#dc3545] hover:bg-red-700 text-white px-5 py-1.5 rounded text-sm transition-colors">Delete</button>
              </div>
            </div>

            {/* Add More Story Button */}
            <div className="flex justify-end">
              <button className="bg-[#0d6efd] hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">+ Add More Story</button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4 pb-4">
              <button className="bg-[#198754] hover:bg-green-700 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors">Submit About Us Details</button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-[#f8f9fc] py-4 px-6 text-center text-sm text-[#003399] relative mt-auto">
        <p>
          Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
        </p>

        {/* Scroll to Top Button */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="absolute right-6 bottom-3 bg-[#4B49F3] hover:bg-blue-700 text-white p-2 rounded shadow-md transition-colors">
          <ArrowUp size={18} />
        </button>
      </footer>
    </div>
  );
}
