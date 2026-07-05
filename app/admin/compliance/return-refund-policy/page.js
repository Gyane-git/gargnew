"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { MoveUp } from "lucide-react";
import { toast } from "react-toastify";

const RichTextEditor = dynamic(() => import("../RichTextEditor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const INITIAL_CONTENT = `<h2 style="font-size:52px; margin-bottom:50px;font-weight:bold">Return &amp; Refund Policies</h2>

<p><strong><em>1. Purpose</em></strong></p>
<p><em>This Refund &amp; Return Policy sets forth the clear terms and conditions under which Garg Dental (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) accepts product returns and issues refunds for purchases made through our e-commerce platform. We fully comply with the Consumer Protection Act, 2075 (2018), the Electronic Commerce Act, 2081, and all applicable e-commerce guidelines of Nepal.</em></p>

<p><strong>2. General Statement</strong></p>
<p>Due to the sensitive nature of dental equipment, medical appliances, and health-related products, we maintain strict standards for returns and refunds to ensure the safety, hygiene, and integrity of all items provided to our valued customers.</p>

<p><strong>3. Eligibility for Returns &amp; Refunds</strong></p>
<p>You may request a return or refund if:</p>
<ul>
  <li>The product is defective, damaged during transit, or materially different from what was described in your order.</li>
  <li>You file a valid return request within seven (7) days of delivery.</li>
  <li>You provide valid proof of purchase (e.g., invoice or official order confirmation).</li>
  <li>The product is in the same condition as it was delivered, unused (unless proven defective), and in its original packaging with all seals and protective films intact.</li>
</ul>

<p><strong>4. Defective Products</strong></p>
<p>If a product is proven to have a manufacturing defect:</p>
<ul>
  <li>You are legally entitled under the Consumer Protection Act, 2075 to a repair, replacement, or full refund, depending on the nature of the defect.</li>
  <li>Defects must be reported within seven (7) days of delivery, with clear photo or video evidence.</li>
  <li>We reserve the right to inspect and verify any claimed defect before approving a return, replacement, or refund.</li>
  <li>If the defect is confirmed to be a manufacturer&rsquo;s fault, Garg Dental will cover all related shipping and replacement costs.</li>
  <li>Defects caused by misuse, mishandling, installation errors, or failure to follow product instructions will not qualify for return or refund.</li>
</ul>

<p><strong>5. Equipment Under Warranty</strong></p>
<p>For equipment under a valid warranty:</p>
<ul>
  <li>If a defect arises during the warranty period, the product will be repaired at no extra cost, provided the warranty terms have not been violated.</li>
  <li>A replacement will only be offered if the item is not repairable under valid warranty conditions.</li>
  <li>Warranty claims must comply with the warranty terms provided at the time of purchase.</li>
</ul>

<p><strong>6. Return Conditions</strong></p>
<p>To be eligible for a return or refund:</p>
<ul>
  <li>Items must be returned in the same condition as they were delivered, without any signs of use (unless proven defective).</li>
  <li>Protective films, seals, and sterilized covers must be intact.</li>
  <li>Original packaging, manuals, accessories, warranty cards, and any complimentary items must be included.</li>
  <li>The product must be free of scratches, dents, or other damage (except verified delivery damage).</li>
  <li>All serial numbers, barcodes, and labels must remain unaltered.</li>
  <li>The outer box must be undamaged, with no stains, tears, or markings.</li>
</ul>

<p><strong>7. Non-Returnable Items</strong></p>
<p>Returns will not be accepted if:</p>
<ul>
  <li>The product has been used, installed, or modified, except where a defect is proven.</li>
  <li>Sterilized covers, seals, or protective films have been removed.</li>
  <li>The product is a consumable or a sterilized item that has been opened.</li>
  <li>The defect or damage is caused by misuse, mishandling, or installation errors.</li>
  <li>The return request is made after the seven (7) day window.</li>
</ul>

<p><strong>8. Return &amp; Refund Process</strong></p>
<p>&rarr; Initiate a Request</p>
<p>&rarr; Contact our customer support team within seven (7) days of delivery:</p>
<p>+977-1-4536276, 4528239</p>
<p><strong>info@gargdental.com, support@gargdental.com</strong></p>
<p>&rarr; Provide Evidence</p>
<p>&rarr; Submit clear photos and/or videos showing the defect or damage, along with proof of purchase.</p>
<p>&rarr; Inspection:</p>
<p><em>Our quality assurance team will inspect the product and verify the claim within seven (7) working days.</em></p>
<p>&rarr; Approval or Rejection:</p>
<p><em>You will receive written confirmation of our decision.</em></p>
<p>&rarr; Refund or Replacement</p>
<ul>
  <li>If approved for a refund, it will be issued via your original payment method.</li>
  <li>If approved for a replacement, the new product will be shipped at no extra cost if a defect is verified.</li>
</ul>
<p>&rarr; Return Shipping Costs</p>
<ul>
  <li>For verified defects, Garg Dental covers all return and replacement shipping costs.</li>
  <li>For non-defective returns (if permitted), the customer bears all return shipping costs.</li>
</ul>

<p><strong>9. Legal Compliance</strong></p>
<p>This Refund &amp; Return Policy is governed by the Consumer Protection Act, 2075, the Electronic Commerce Act, 2081, and all other applicable laws and regulations of Nepal. Garg Dental is committed to fair, lawful, and transparent transactions.</p>

<p><strong>10. Contact Us</strong></p>
<p>For any return, exchange, or refund request, please contact:</p>
<p><strong>Customer Support:</strong> +977-1-4536276, 4528239</p>
<p><strong>Email:</strong> info@gargdental.com, support@gargdental.com</p>
<p><strong>Registered Office:</strong> G.P.O 4287, Golchhaa Kunda, Kathmandu, Nepal</p>`;

export default function ReturnRefundPolicyPage() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [loading, setLoading] = useState(false);

  const handleContentChange = useCallback((value) => {
    setContent(value);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      try {
        setLoading(true);

        const response = await fetch("/api/v1/compliance/return-refund-policy", {
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

        toast.success(data.message || "Return & refund policy saved successfully.");
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to save return & refund policy.");
      } finally {
        setLoading(false);
      }
    },
    [content],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f9]">
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <h1 className="text-center text-xl font-bold text-indigo-900">Add Return Refund Policy</h1>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
            <label htmlFor="return-refund-policy-editor" className="mb-2 block text-sm text-gray-700">
              Return &amp; Refund Policy
            </label>

            <div id="return-refund-policy-editor">
              <RichTextEditor value={content} onChange={handleContentChange} />
            </div>

            <div className="mt-6 flex justify-center">
              <button type="submit" disabled={loading} className="rounded-md bg-green-700 px-8 py-2.5 font-medium text-white hover:bg-green-800 disabled:opacity-50">
                {loading ? "Saving..." : "Submit Return & Refund Policy"}
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
