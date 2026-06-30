"use client";

import React from "react";
import { ArrowUp, Trash2 } from "lucide-react";
import RichTextEditor from "../RichTextEditor";

export default function AddBusinessRegistration() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] p-6 font-sans text-gray-800">
      <main className="max-w-5xl mx-auto bg-white border border-gray-200 shadow-sm p-8">
        {/* Header */}
        <h1 className="text-center text-xl font-semibold text-[#003399] mb-6">Add Business Registration Details</h1>

        {/* Legal Information Editor */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Business Registration Details</label>
          <div className="border border-gray-300 rounded">
            <RichTextEditor
              initialContent={`
                <h3>LEGAL INFORMATION</h3>
                <table>
                  <tr><td><strong>Company Name</strong></td><td>Garg Dental Pvt. Ltd.</td></tr>
                  <tr><td><strong>Registration Number</strong></td><td>12656/056/57</td></tr>
                  <tr><td><strong>PAN/VAT Number</strong></td><td>300217054</td></tr>
                  <tr><td><strong>Registered Office</strong></td><td>B.O.127 Gairidhara, Kathmandu, Nepal</td></tr>
                  <tr><td><strong>Date of Incorporation</strong></td><td>March 15 2010</td></tr>
                </table>
              `}
            />
          </div>
        </div>

        {/* Documents Header */}
        <h2 className="text-center text-lg font-semibold text-[#003399] mb-6">Documents</h2>

        {/* Form Inputs */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Document Title</label>
            <input type="text" placeholder="Enter document title" className="w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Document</label>
            <div className="flex items-center gap-2">
              <button className="bg-gray-100 border border-gray-300 px-4 py-2 rounded text-sm">Choose File</button>
              <span className="text-sm text-gray-600">No file chosen</span>
            </div>
          </div>
        </div>

        <button className="bg-[#007bff] text-white px-4 py-2 rounded text-sm font-medium mb-8">+ Add Another Certification</button>

        {/* Uploaded Documents List */}
        <div className="mb-8">
          <h3 className="font-medium text-[#003399] mb-4">Uploaded Documents</h3>
          <div className="border border-gray-200 p-4 w-40 rounded flex flex-col items-center">
            <div className="w-24 h-32 bg-gray-50 border border-gray-200 mb-2"></div>
            <span className="text-sm font-semibold mb-2 text-center">Business Certificate</span>
            <button className="bg-[#dc3545] text-white px-3 py-1 rounded text-xs flex items-center gap-1">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center border-t pt-6">
          <button className="bg-[#198754] text-white px-6 py-2 rounded font-medium">Submit Business Registration Details</button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-[#003399]">
        Copyright © 2026 <strong>Global Tech Nepal Pvt. Ltd.</strong>
        <button className="fixed bottom-6 right-6 bg-[#4B49F3] text-white p-2 rounded shadow-lg">
          <ArrowUp size={20} />
        </button>
      </footer>
    </div>
  );
}
