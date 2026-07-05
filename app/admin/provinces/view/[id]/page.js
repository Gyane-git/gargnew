"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProvinceDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  const [province, setProvince] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvince();
  }, []);

  const fetchProvince = async () => {
    try {
      const res = await fetch(`/api/v1/addresses/province/${id}`);
      const data = await res.json();
      console.log("data", data);
      

      if (data.success) {
        setProvince(data.province);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!province) {
    return <div className="p-8">Province not found.</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f9] font-sans text-[#3b4256]">
      <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[480px] rounded-[10px] bg-white p-8 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:p-10">
          <h1 className="mb-6 text-xl text-center font-semibold text-[#232f4b]">Province Details</h1>

          <div className="mb-8 flex items-center gap-16">
            <span className="w-[160px] text-[18px] font-bold text-[#5a6fb0]">Province Name</span>
            <span className="text-[18px] font-mediuum text-[#3b4256]">{province.province_name}</span>
          </div>

          <div className="flex justify-center">
            <button onClick={() => router.back()} className="rounded-md bg-[#6c7480] px-6 py-2 text-sm font-medium text-white hover:bg-[#5c636d]">
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e3e8f2] py-6 text-center text-[13.5px] text-[#8992a3]">
        Copyright © 2026 <strong>Global Tech Nepal Pvt. Ltd.</strong>
      </div>
    </div>
  );
}
