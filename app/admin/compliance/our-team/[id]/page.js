// "use client";
// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { teamMembers } from "@/lib/teamMembers";

// export default function EditTeamMember() {
//   const { id } = useParams();
//   const router = useRouter();

//   const [member, setMember] = useState(null);

//   useEffect(() => {
//     const data = teamMembers.find((item) => item.id === Number(id));

//     if (data) {
//       setMember(data);
//     }
//   }, [id]);

//   if (!member) {
//     return <div className="p-10 text-center">Team member not found.</div>;
//   }

//   const handleChange = (e) => {
//     setMember({
//       ...member,
//       [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     console.log(member);

//     router.push("/our-team");
//   };

//   return (
//     <div className="min-h-screen bg-slate-100">
//       <div className="max-w-3xl mx-auto py-10">
//         <div className="bg-white rounded-lg shadow">
//           <div className="p-6">
//             <h2 className="text-2xl font-semibold text-[#003399] mb-6">Edit Team Member</h2>

//             <form onSubmit={handleSubmit} className="space-y-5">
//               <div>
//                 <label>Name</label>

//                 <input name="name" value={member.name} onChange={handleChange} className="w-full border rounded-md p-3 mt-2" />
//               </div>

//               <div>
//                 <label>Role</label>

//                 <input name="role" value={member.role} onChange={handleChange} className="w-full border rounded-md p-3 mt-2" />
//               </div>

//               <div>
//                 <label>Image</label>

//                 <input type="file" className="w-full border rounded-md mt-2" />

//                 <img src="/team/default.png" className="mt-4 w-24 h-24 object-cover rounded" />
//               </div>

//               <div>
//                 <label>LinkedIn</label>

//                 <input name="linkedin" value={member.linkedin} onChange={handleChange} className="w-full border rounded-md p-3 mt-2" />
//               </div>

//               <div>
//                 <label>Email</label>

//                 <input name="email" value={member.email} onChange={handleChange} className="w-full border rounded-md p-3 mt-2" />
//               </div>

//               <div>
//                 <label>Status</label>

//                 <select
//                   name="status"
//                   value={member.status ? "Active" : "Inactive"}
//                   onChange={(e) =>
//                     setMember({
//                       ...member,
//                       status: e.target.value === "Active",
//                     })
//                   }
//                   className="w-full border rounded-md p-3 mt-2"
//                 >
//                   <option>Active</option>
//                   <option>Inactive</option>
//                 </select>
//               </div>

//               <div className="flex gap-3">
//                 <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
//                   Update Member
//                 </button>

//                 <button type="button" onClick={() => router.back()} className="bg-gray-500 text-white px-6 py-2 rounded">
//                   Back
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { teamMembers } from "@/lib/teamMembers";

export default function EditTeamMember() {
  const { id } = useParams();
  const router = useRouter();

  const [member, setMember] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");

  useEffect(() => {
    const data = teamMembers.find((item) => item.id === Number(id));

    if (data) {
      setMember(data);
    }
  }, [id]);

  if (!member) {
    return <div className="p-10 text-center">Team member not found.</div>;
  }

  const handleChange = (e) => {
    setMember({
      ...member,
      [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    setMember((prev) => ({
      ...prev,
      image: file,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(member);

    router.push("/our-team");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 py-10">
        <div className="max-w-[750px] mx-auto bg-white rounded-md shadow px-9 py-7">
          <h2 className="text-lg font-bold text-[#1b3a6b] mb-5">Edit Team Member</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[15px] text-gray-800 mb-1.5">Name</label>
              <input name="name" value={member.name} onChange={handleChange} className="w-full text-sm border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#8aa5d8]" />
            </div>

            <div className="mb-4">
              <label className="block text-[15px] text-gray-800 mb-1.5">Role</label>
              <input name="role" value={member.role} onChange={handleChange} className="w-full text-sm border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#8aa5d8]" />
            </div>

            <div className="mb-4">
              <label className="block text-[15px] text-gray-800 mb-1.5">Image</label>

              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button type="button" onClick={() => document.getElementById("imageInput").click()} className="bg-[#eef0f3] border-r border-gray-300 px-3.5 py-2 text-sm text-gray-800 whitespace-nowrap">
                  Choose File
                </button>
                <span className="flex-1 px-3 py-2 text-sm text-[#1b3a6b] truncate">{fileName}</span>
                <input id="imageInput" type="file" className="hidden" onChange={handleFileChange} />
              </div>

              <img src="/team/default.png" alt="Current" className="mt-2 w-6 h-6 object-cover rounded" />
            </div>

            <div className="mb-4">
              <label className="block text-[15px] text-gray-800 mb-1.5">LinkedIn</label>
              <input name="linkedin" value={member.linkedin || ""} onChange={handleChange} className="w-full text-sm border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#8aa5d8]" />
            </div>

            <div className="mb-4">
              <label className="block text-[15px] text-gray-800 mb-1.5">Email</label>
              <input name="email" value={member.email} onChange={handleChange} className="w-full text-sm border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#8aa5d8]" />
            </div>

            <div className="mb-6">
              <label className="block text-[15px] text-gray-800 mb-1.5">Status</label>
              <select
                name="status"
                value={member.status ? "Active" : "Inactive"}
                onChange={(e) =>
                  setMember({
                    ...member,
                    status: e.target.value === "Active",
                  })
                }
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#8aa5d8] appearance-none bg-no-repeat bg-[right_0.75rem_center]"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='14' height='14'%3E%3Cpath fill='%23555' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")",
                }}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="flex justify-center gap-3">
              <button type="submit" className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-sm font-medium px-5 py-2 rounded">
                Update Member
              </button>

              <button type="button" onClick={() => router.back()} className="bg-[#6c757d] hover:bg-[#5a6268] text-white text-sm font-medium px-5 py-2 rounded">
                Back
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="border-t border-gray-300 py-4 text-center text-xs text-gray-600">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
