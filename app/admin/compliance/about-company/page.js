"use client";

import dynamic from "next/dynamic";
import { MoveUp } from "lucide-react";
import { toast } from "react-toastify";
import { useCallback, useEffect, useState } from "react";

const RichTextEditor = dynamic(() => import("../RichTextEditor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const INITIAL_CONTENT = `<h1>Company Information</h1>
<p><strong>Garg Dental Pvt. Ltd. (Nepal)</strong> is Nepal&rsquo;s trusted partner in advanced dental solutions. Established in 2002 and headquartered in Kathmandu, we are an <strong>authorized importer and distributor</strong> of high-quality dental equipment, instruments, and consumables.</p>
<p>For over two decades, we have proudly supported dental professionals and institutions across Nepal &mdash; providing them with reliable products that enable exceptional patient care. Our diverse portfolio covers every major area of modern dentistry, ensuring that practitioners have access to the latest innovations and trusted global brands.</p>
<p>With a dedicated team of over 50 skilled professionals, Garg Dental is committed to setting the standard for dental supply and marketing services in Nepal. Our focus is on <strong>authenticity, quality, and service excellence</strong>, and we take pride in delivering products that meet rigorous international standards.</p>
<p>At Garg Dental, we believe in building lasting partnerships with our clients, suppliers, and stakeholders. By consistently bringing world-class dental solutions to Nepal&rsquo;s healthcare sector, we help dental practices grow and thrive in a rapidly evolving industry.</p>`;

export default function AboutCompanyPage() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [loading, setLoading] = useState(false);
const [loadingContent, setLoadingContent] = useState(true);

  const handleContentChange = useCallback((value) => {
    setContent(value);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      try {
        setLoading(true);

        const response = await fetch("/api/v1/compliance/about-company", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        toast.success(data.message || "Company information saved successfully.");
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to save company information.");
      } finally {
        setLoading(false);
      }
    },
    [content],
  );

  useEffect(() => {
  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch("/api/v1/compliance/about-company");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setContent(data.content || INITIAL_CONTENT);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to load company information.");
    } finally {
      setLoadingContent(false);
    }
  };

  fetchCompanyInfo();
}, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f9]">
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <h1 className="text-center text-xl font-bold text-indigo-900">Add Company Information</h1>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
            <label htmlFor="about-company-editor" className="mb-2 block text-sm text-gray-700">
              About Company
            </label>

            <div id="about-company-editor">
              <RichTextEditor value={content} onChange={handleContentChange} />
            </div>

            <div className="mt-6 flex justify-center">
              <button type="submit" disabled={loading} className="rounded-md bg-green-700 px-8 py-2.5 font-medium text-white hover:bg-green-800 disabled:opacity-50">
                {loading ? "Saving..." : "Submit Company Information"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-md border border-gray-300">
      <div className="h-10 border-b border-gray-300 bg-gray-50" />
      <div className="space-y-3 bg-white p-4">
        <div className="h-4 w-1/3 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 py-6">
      <div className="relative mx-auto flex max-w-5xl items-center justify-center">
        <p className="text-sm text-gray-500">
          Copyright © {year} <span className="font-bold text-gray-700">Global Tech Nepal Pvt. Ltd.</span>
        </p>
        {/* <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white transition-colors hover:bg-indigo-700">
          <MoveUp className="h-4 w-4" />
        </button> */}
      </div>
    </footer>
  );
}
