"use client";

export default function ProfileCard({ profile }) {
  return (
    <div className="bg-white rounded-md shadow-sm p-6 text-center">
      {/* Profile Image */}
      <div className="flex justify-center">
        <img src={profile.image || "/images/profile.png"} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-gray-100" />
      </div>

      {/* Name */}
      <h2 className="mt-4 text-[22px] font-semibold text-[#012970]">
        {profile.fullName}
      </h2>

      {/* Account Type */}
      <p className="mt-1 text-[15px] text-gray-500">
        {profile.accountType}
      </p>
    </div>
  );
}
