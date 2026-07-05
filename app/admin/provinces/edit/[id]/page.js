// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";

// export default function ProvinceDetailsPage() {
//   const router = useRouter();
//   const { id } = useParams();

//   const [province, setProvince] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchProvince();
//   }, []);

//   const fetchProvince = async () => {
//     try {
//       const res = await fetch(`/api/v1/addresses/province/${id}`);
//       const data = await res.json();
//       console.log("data", data);

//       if (data.success) {
//         setProvince(data.province);
//       }
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <div className="p-8">Loading...</div>;
//   }

//   if (!province) {
//     return <div className="p-8">Province not found.</div>;
//   }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditProvincePage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [province, setProvince] = useState(null);

  useEffect(() => {
    fetchProvince();
  }, []);

  const fetchProvince = async () => {
    try {
      const res = await fetch(`/api/v1/addresses/province/${id}`);
      const data = await res.json();

      if (data.success) {
        setProvince(data.province);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load province.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProvince((prev) => ({
      ...prev,
      province_name: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/v1/addresses/province/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          province: province.province_name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);

        setTimeout(() => {
          router.push("/admin/provinces");
        }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }
  };
  const handleCancel = () => {
    router.back();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f9] font-sans text-[#3b4256]">
      <div className="flex flex-1 items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-[500px] rounded-[10px] bg-white p-8 shadow-[0_2px_10px_rgba(30,42,80,0.06)] sm:p-10">
          <h1 className="mb-8 text-center text-2xl font-semibold text-[#232f4b]">Update Province Details</h1>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-1">
            <div>
              <label className="mb-2 block text-[15px] text-[#5a4a3a]">Province Name</label>
              <div className="relative">
                <input type="text" name="province" value={province?.province_name || ""} onChange={handleChange} placeholder="Enter province" className="w-full rounded-md border border-[#e1e4eb] bg-white px-3 py-2.5 text-[15px] text-[#3b4256] transition-all duration-200 focus:border-[#2f55d4] focus:outline-none focus:ring-4 focus:ring-[#2f55d4]/20" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={handleSubmit} className="rounded-md bg-[#1f8a5f] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#1a7550]">
              Update Province
            </button>
            <button onClick={handleCancel} className="rounded-md bg-[#6c7480] px-6 py-2.5 text-[15px] font-medium text-white hover:bg-[#5c636d]">
              Cancel
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
