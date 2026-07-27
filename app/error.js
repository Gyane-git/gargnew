"use client";

import { useEffect } from "react";
import { House, RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl border border-gray-100">
        {/* Error Icon */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
          <TriangleAlert className="h-12 w-12 text-red-600" strokeWidth={2} />
        </div>

        {/* Heading */}
        <h1 className="mt-8 text-4xl font-extrabold text-gray-900">Oops! Something went wrong</h1>

        {/* Message */}
        <p className="mt-4 text-gray-700 leading-relaxed">An unexpected error occurred while processing your request. Don't worry—it's temporary. Please try again or return to the home page.</p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-transform duration-300 hover:scale-105 shadow-lg  hover:bg-purple-700 hover:shadow-xl">
            <RotateCcw size={18} />
            <span>Try Again</span>
          </button>

          <a href="/" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-blue-600 px-6 py-3 font-semibold text-white transition-transform duration-300 hover:scale-105 hover:bg-blue-700">
            <House />
            <span>Go Home</span>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t pt-6">
          <p className="text-sm text-gray-600">If this issue continues, please contact our support team.</p>
        </div>
      </div>
    </main>
  );
}
