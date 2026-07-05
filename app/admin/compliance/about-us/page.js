"use client";

import React, { useEffect, useState, useRef } from "react";
import { ArrowUp, Image as ImageIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

const RichTextEditor = dynamic(() => import("../RichTextEditor"), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});

export default function AddAboutUs() {
  const [storyImage, setStoryImage] = useState(null);
  const [storyPreview, setStoryPreview] = useState("");
  const [title, setTitle] = useState("About Garg Dental");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [storyTitle, setStoryTitle] = useState("Our Story");
  const [storyName, setStoryName] = useState("Umesh Agrawal");
  const [storyDesignation, setStoryDesignation] = useState("Managing Director");
  const [introVideo, setIntroVideo] = useState(null);
  const fileInputRef = useRef(null);

  // State to hold the rich text editor values
  const DEFAULT_ABOUT_US = `<p><strong>Welcome to Garg Dental Pvt. Ltd. – Nepal’s Trusted Partner in Advanced Dental Solutions.</strong></p><p>Founded in <strong>2002</strong> and headquartered in <strong>Kathmandu</strong>, Garg Dental Pvt. Ltd. has been a pioneer in supplying <strong>premium dental equipment, instruments, and consumables</strong> across Nepal...</p>`;

  const DEFAULT_STORY_DESCRIPTION = `<p>Welcome to <strong>Garg Dental Pvt. Ltd.</strong> is Nepal's trusted partner in advanced dental solutions...</p>`;

  const [aboutUsContent, setAboutUsContent] = useState(DEFAULT_ABOUT_US);
  const [storyDescription, setStoryDescription] = useState(DEFAULT_STORY_DESCRIPTION);

  const handleVideoChange = (e) => {
    setIntroVideo(e.target.files?.[0] || null);
  };

  const handleStoryImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (storyPreview) {
      URL.revokeObjectURL(storyPreview);
    }

    setStoryImage(file);
    setStoryPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("youtubeLink", youtubeLink);
      formData.append("aboutUsContent", aboutUsContent);

      formData.append("storyTitle", storyTitle);
      formData.append("storyName", storyName);
      formData.append("storyDesignation", storyDesignation);
      formData.append("storyDescription", storyDescription);

      if (storyImage) {
        formData.append("storyImage", storyImage);
      }

      if (introVideo) {
        formData.append("introVideo", introVideo);
      }

      const response = await fetch("/api/v1/compliance/about-us", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast.success(data.message || "About Us saved successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save About Us.");
    }
  };

  const handleAddStory = () => {
    setStoryTitle("Our Story");
    setStoryName("");
    setStoryDesignation("");
    setStoryDescription(DEFAULT_STORY_DESCRIPTION);

    setStoryImage(null);

    if (storyPreview) {
      URL.revokeObjectURL(storyPreview);
    }

    setStoryPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  useEffect(() => {
    return () => {
      if (storyPreview) {
        URL.revokeObjectURL(storyPreview);
      }
    };
  }, [storyPreview]);

  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        const response = await fetch("/api/v1/compliance/about-us");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        if (!data.data) return;

        const about = data.data;

        setTitle(about.title || "About Garg Dental");
        setYoutubeLink(about.youtubeLink || "");

        setAboutUsContent(about.aboutUsContent || DEFAULT_ABOUT_US);

        setStoryTitle(about.story?.title || "Our Story");
        setStoryName(about.story?.name || "Umesh Agrawal");
        setStoryDesignation(about.story?.designation || "Managing Director");

        setStoryDescription(about.story?.description || DEFAULT_STORY_DESCRIPTION);

        if (about.story?.imageUrl) {
          setStoryPreview(about.story.imageUrl);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to load About Us.");
      }
    };

    fetchAboutUs();
  }, []);

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
          <form onSubmit={handleSubmit}>
            <div className="px-8 space-y-8">
              {/* Top Section: Video, Title, YT Link */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Intro Video */}
                <div className="space-y-2">
                  <label className="block text-sm text-gray-700">Introduction Video</label>
                  <input type="file" onChange={handleVideoChange} className="block w-full text-sm text-gray-500 file:mr-0 file:py-2 file:px-3 file:border-0 file:border-r file:border-gray-300 file:bg-gray-50 file:text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white" />
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
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>

                {/* YT Link */}
                <div className="space-y-2">
                  <label className="block text-sm text-gray-700">Youtube Video Link</label>
                  <input type="text" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
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
                <input type="text" value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </div>

              {/* Story Item Box */}
              <div className="border border-gray-200 rounded p-6 bg-white shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-700">Story Image</label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleStoryImageChange} className="block w-full text-sm text-gray-500 file:mr-0 file:py-2 file:px-3 file:border-0 file:border-r file:border-gray-300 file:bg-gray-50 file:text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-700">Story Name</label>
                    <input type="text" value={storyName} onChange={(e) => setStoryName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-700">Story Designation</label>
                    <input type="text" value={storyDesignation} onChange={(e) => setStoryDesignation(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white" />
                  </div>
                </div>

                {/* Story Image Preview Placeholder */}
                {storyPreview ? (
                  <div className="relative w-48">
                    <img src={storyPreview} alt="Story Preview" className="h-48 w-full rounded border object-cover" />

                    <button
                      type="button"
                      onClick={() => {
                        if (storyPreview) {
                          URL.revokeObjectURL(storyPreview);
                        }

                        setStoryImage(null);
                        setStoryPreview("");

                        // Clear the selected file from the input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-2 text-gray-400" size={40} />
                      <p className="text-sm text-gray-500">No image selected</p>
                    </div>
                  </div>
                )}

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
              {/* <div className="flex justify-end">
                <button type="button" onClick={handleAddStory} className="bg-[#0d6efd] hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                  + Add More Story
                </button>
              </div> */}

              {/* Submit Button */}
              <div className="flex justify-center pt-4 pb-4">
                <button type="submit" className="bg-[#198754] hover:bg-green-700 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors">
                  Submit About Us Details
                </button>
              </div>
            </div>
          </form>
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
