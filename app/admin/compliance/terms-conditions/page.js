"use client";

import React, { useState } from "react";
import { ArrowUp } from "lucide-react";
import RichTextEditor from "../RichTextEditor"; // Ensure this path matches your folder structure

export default function AddTermsAndConditions() {
  // Initial content mirroring the structure seen in your screenshot
  const [termsContent, setTermsContent] = useState(`
    <h3>Terms and Conditions</h3>
    <p><em>These Terms and Conditions ("Terms") govern the use of the website, services, and transactions provided by <strong>Garg Dental Pvt. Ltd.</strong> ("we", "our", or "us") through our e-commerce platform and physical operations in Nepal. By accessing or using our website or purchasing from us, you agree to be bound by these Terms. If you do not agree, please refrain from using our services.</em></p>
    
    <h3>1. General Information</h3>
    <p>Garg Dental Pvt. Ltd. is a legally registered company in Nepal operating under the following details:</p>
    <figure class="table">
      <table>
        <tbody>
          <tr><td><strong>Company Name</strong></td><td><strong>Garg Dental Pvt. Ltd.</strong></td></tr>
          <tr><td><strong>Registration Number</strong></td><td>12656/056/57</td></tr>
          <tr><td><strong>PAN/VAT Number</strong></td><td>300217054</td></tr>
          <tr><td><strong>Registered Office</strong></td><td>B.O.127 Gairidhara, Kathmandu, Nepal</td></tr>
          <tr><td><strong>Date of Incorporation</strong></td><td>March 15 2010</td></tr>
        </tbody>
      </table>
    </figure>

    <h3>2. Eligibility to Use the Site</h3>
    <p>By using this site, you represent and warrant that:</p>
    <ul>
      <li>You are at least 18 years old or are accessing the website under the supervision of a legal guardian.</li>
      <li>You have the legal capacity to enter into a binding agreement.</li>
    </ul>

    <h3>3. Product Information and Medical Use Disclaimer</h3>
    <p>All products listed on our website are intended for professional dental use by licensed practitioners or authorized institutions.</p>
    <p>Information provided is for general educational and product awareness purposes and should not be used as a substitute for professional medical advice.</p>

    <h3>4. Ordering and Payment</h3>
    <p>Orders placed on our website are subject to availability, confirmation, and acceptance.</p>
    <p>We reserve the right to cancel or refuse any order for any reason.</p>
    <p>All payments must be made through authorized channels. We do not store full credit/debit card details.</p>

    <h3>5. Pricing and Taxation</h3>
    <p>All prices listed are inclusive of applicable VAT as per Nepalese law unless stated otherwise.</p>
    <p>Garg Dental reserves the right to change pricing at any time without prior notice.</p>

    <h3>6. Shipping and Delivery</h3>
    <p>Products are delivered within the estimated delivery time as per the shipping policy.</p>
    <p>Delivery timelines are indicative and may vary due to unforeseen circumstances.</p>
    <p>Garg Dental is not liable for delays caused by courier agencies or force majeure.</p>

    <h3>7. Returns and Refunds</h3>
    <p>Returns and refunds are governed by our official <strong>Refund & Return Policy</strong>, which includes but is not limited to:</p>
    <ul>
      <li>Products must be returned within 7 days in unused condition, with all original packaging intact.</li>
      <li>Refunds are issued only after inspection and approval.</li>
      <li>Defective items verified by our team will be replaced or refunded at our cost.</li>
      <li>Some products (e.g., opened consumables, sterilized goods) are non-returnable.</li>
    </ul>

    <h3>8. Warranty Terms</h3>
    <p>Products that come with a manufacturer's warranty are eligible for repair or replacement as per warranty terms.</p>
    <p>Warranty does not cover misuse, damage due to mishandling, or installation errors.</p>

    <h3>9. Intellectual Property</h3>
    <p>All content including images, text, trademarks, logos, product descriptions, and videos on this website are the intellectual property of Garg Dental or its licensors.</p>
    <p>You may not reproduce, copy, distribute, or commercially exploit any content without prior written permission.</p>

    <h3>10. Privacy and Data Protection</h3>
    <p>Our <strong>Privacy Policy</strong> outlines how we collect, store, and protect your data, including:</p>
    <ul>
      <li>Use of cookies and tracking tools.</li>
      <li>Compliance with the Electronic Commerce Act, 2081 and Consumer Protection Act, 2075.</li>
      <li>Confidential handling of personal and medical data.</li>
    </ul>

    <h3>11. Medical Certification & Legal Compliance</h3>
    <p>All medical products meet the import, safety, and quality standards established by the Ministry of Health, Nepal.</p>
    <p>Garg Dental operates in compliance with relevant healthcare, commerce, and e-commerce regulations.</p>

    <h3>12. Limitation of Liability</h3>
    <p>To the fullest extent permitted by law, Garg Dental shall not be liable for:</p>
    <ul>
      <li>Any indirect, incidental, or consequential damages arising from use of our services or products.</li>
      <li>Product misuse, installation errors, or failure to follow manufacturer instructions.</li>
    </ul>

    <h3>13. User Responsibilities</h3>
    <p>...</p>

    <h3>17. Contact Information</h3>
    <p>For questions or concerns related to these Terms and Conditions, please contact:<br>
    +977-1-4536276, 4528239<br>
    📧 Email: support@gargdental.com<br>
    🏢 Registered Office: B.O.127 Gairidhara, Kathmandu, Nepal</p>
  `);

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans text-gray-700">
      {/* Main Content Area */}
      <main className="flex-grow p-6 w-full max-w-6xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden pb-8">
          {/* Form Header */}
          <div className="pt-6 pb-4 mb-2 text-center border-b border-gray-100">
            <h1 className="text-xl font-semibold text-[#003399]">Add Terms & Conditions</h1>
          </div>

          <div className="px-8 pt-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>

            {/* Rich Text Editor Container */}
            <div className="prose max-w-none border border-gray-300 rounded overflow-hidden">
              <RichTextEditor value={termsContent} onChange={setTermsContent} />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button className="bg-[#198754] hover:bg-green-700 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors">Submit Terms & Conditions</button>
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
