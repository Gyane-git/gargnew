// "use client";

// import { useState, useRef } from "react";

// export default function UploadProductImagesPage() {
//   const [templateMenuOpen, setTemplateMenuOpen] = useState(true);
//   const [categoryMenuOpen, setCategoryMenuOpen] = useState(true);
//   const [imagesFileName, setImagesFileName] = useState("No file chosen");
//   const [productsFileName, setProductsFileName] = useState("No file chosen");

//   const imagesInputRef = useRef(null);
//   const productsInputRef = useRef(null);

//   const handleFileChange = (e, setter) => {
//     const file = e.target.files && e.target.files[0];
//     setter(file ? file.name : "No file chosen");
//   };

//   return (
//     <div className="min-h-screen bg-[#eef2f9] flex flex-col">
//       <div className="flex-1 px-8 py-6">
//         {/* Page header */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-semibold text-[#1a2b6d]">Upload Product &amp; Images</h1>
//           <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
//             <span>🏠</span>
//             <span className="text-gray-400">Dashboard</span>
//             <span className="mx-1">/</span>
//             <span className="text-gray-400">Upload Product &amp; Images</span>
//           </div>
//         </div>

//         {/* Card */}
//         <div className="bg-white rounded-md shadow-sm max-w-6xl">
//           <div className="flex items-center justify-between px-6 py-5 flex-wrap gap-4">
//             <h2 className="text-lg font-semibold text-[#1a2b6d] whitespace-nowrap">Upload through Excel</h2>

//             <div className="flex items-center gap-3 relative">
//               {/* Image Templates by Category button */}
//               <button type="button" onClick={() => setCategoryMenuOpen((v) => !v)} className="flex items-center gap-2 bg-[#1e6b3c] hover:bg-[#175a31] text-white text-sm font-medium px-4 py-2 rounded">
//                 Image Templates by Category
//                 <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
//                   <path d="M1 1L6 6L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                 </svg>
//               </button>
//               {categoryMenuOpen && (
//                 <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded shadow-lg border border-gray-100 py-2 z-10">
//                   <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
//                     Categories List
//                   </button>
//                   <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
//                     Brands List
//                   </button>
//                   <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
//                     Product Template
//                   </button>
//                 </div>
//               )}

//               {/* Download Templates button + dropdown */}
//               <div className="relative">
//                 <button type="button" onClick={() => setTemplateMenuOpen((v) => !v)} className="flex items-center gap-2 bg-[#1e6b3c] hover:bg-[#175a31] text-white text-sm font-medium px-4 py-2 rounded">
//                   Download Templates
//                   <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M1 1L6 6L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                   </svg>
//                 </button>

//                 {templateMenuOpen && (
//                   <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded shadow-lg border border-gray-100 py-2 z-10">
//                     <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
//                       Categories List
//                     </button>
//                     <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
//                       Brands List
//                     </button>
//                     <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
//                       Product Template
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           <hr className="border-gray-100" />

//           {/* Import Images row */}
//           <div className="px-6 py-6 flex items-center gap-4">
//             <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
//               <button type="button" onClick={() => imagesInputRef.current?.click()} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800">
//                 Choose File
//               </button>
//               <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{imagesFileName}</span>
//               <input ref={imagesInputRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, setImagesFileName)} />
//             </div>
//             <button type="button" className="bg-[#1a73e8] hover:bg-[#1662c4] text-white text-sm font-medium px-5 py-2 rounded">
//               Import Images
//             </button>
//           </div>

//           {/* Import Products row */}
//           <div className="px-6 pb-6 flex items-center gap-4">
//             <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
//               <button type="button" onClick={() => productsInputRef.current?.click()} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800">
//                 Choose File
//               </button>
//               <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{productsFileName}</span>
//               <input ref={productsInputRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, setProductsFileName)} />
//             </div>
//             <button type="button" className="bg-[#1a73e8] hover:bg-[#1662c4] text-white text-sm font-medium px-5 py-2 rounded">
//               Import Products
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
//         Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
//       </footer>
//     </div>
//   );
// }

"use client";

import { LayoutDashboard } from "lucide-react";
import { useState, useRef } from "react";

export default function UploadProductImagesPage() {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [imagesFileName, setImagesFileName] = useState("No file chosen");
  const [productsFileName, setProductsFileName] = useState("No file chosen");

  const imagesInputRef = useRef(null);
  const productsInputRef = useRef(null);

  const handleFileChange = (e, setter) => {
    const file = e.target.files && e.target.files[0];
    setter(file ? file.name : "No file chosen");
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] flex flex-col">
      <div className="flex-1 px-8 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1a2b6d]">Upload Product &amp; Images</h1>
          <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            <LayoutDashboard className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Dashboard</span>
            <span className="mx-1">/</span>
            <span className="text-gray-400">Upload Product &amp; Images</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-md shadow-sm max-w-6xl">
          <div className="flex items-center justify-between px-6 py-5 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-[#1a2b6d] whitespace-nowrap">Upload through Excel</h2>

            <div className="flex items-center gap-10 relative">
              <div className="relative">
                {/* Image Templates by Category button */}
                <button type="button" onClick={() => setCategoryMenuOpen((v) => !v)} className="flex items-center gap-2 bg-gray-500 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded">
                  Image Templates by Category
                  <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {categoryMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-62 bg-white rounded shadow-lg border border-gray-100 py-2 z-10">
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                      Categories 1
                    </button>
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                      Categories 2
                    </button>
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                      Categories 3
                    </button>
                  </div>
                )}
              </div>

              {/* Download Templates button + dropdown */}
              <div className="relative">
                <button type="button" onClick={() => setTemplateMenuOpen((v) => !v)} className="flex items-center gap-2 bg-[#1e6b3c] hover:bg-[#175a31] text-white text-sm font-medium px-4 py-2 rounded">
                  Download Templates
                  <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {templateMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-46 bg-white rounded shadow-lg border border-gray-100 py-2 z-10">
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                      Categories List
                    </button>
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                      Brands List
                    </button>
                    <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                      Product Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Import Images row */}
          <div className="px-6 py-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
              <button type="button" onClick={() => imagesInputRef.current?.click()} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800">
                Choose File
              </button>
              <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{imagesFileName}</span>
              <input ref={imagesInputRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, setImagesFileName)} />
            </div>
            <button type="button" className="bg-[#1a73e8] hover:bg-[#1662c4] text-white text-sm font-medium px-5 py-2 rounded">
              Import Images
            </button>
          </div>

          {/* Import Products row */}
          <div className="px-6 pb-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
              <button type="button" onClick={() => productsInputRef.current?.click()} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 border-r border-gray-300 text-gray-800">
                Choose File
              </button>
              <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{productsFileName}</span>
              <input ref={productsInputRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, setProductsFileName)} />
            </div>
            <button type="button" className="bg-[#1a73e8] hover:bg-[#1662c4] text-white text-sm font-medium px-5 py-2 rounded">
              Import Products
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
