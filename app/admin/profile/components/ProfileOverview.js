"use client";

export default function ProfileOverview({ profile }) {
  return (
    <div>
      {/* About */}
      <div className="mb-8">
        <h5 className="text-lg font-semibold text-[#012970] mb-3">
          About
        </h5>

        <p className="text-[15px] leading-7 text-gray-600">
          {profile.fullName || "Admin"} is managing the dashboard account for {profile.accountType || "the system"}.
        </p>
      </div>

      {/* Profile Details */}
      <div>
        <h5 className="text-lg font-semibold text-[#012970] mb-5">
          Profile Details
        </h5>

        <div className="space-y-5">
          {/* Full Name */}
          <div className="grid grid-cols-12">
            <div className="col-span-4 font-semibold text-gray-600">
              Full Name
            </div>

            <div className="col-span-8 text-gray-500">
              {profile.fullName}
            </div>
          </div>

          {/* Country */}
          <div className="grid grid-cols-12">
            <div className="col-span-4 font-semibold text-gray-600">
              Country
            </div>

            <div className="col-span-8 text-gray-500">
              {profile.country}
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-12">
            <div className="col-span-4 font-semibold text-gray-600">
              Address
            </div>

            <div className="col-span-8 text-gray-500">
              {profile.address}
            </div>
          </div>

          {/* Phone */}
          <div className="grid grid-cols-12">
            <div className="col-span-4 font-semibold text-gray-600">
              Phone
            </div>

            <div className="col-span-8 text-gray-500">
              {profile.phone}
            </div>
          </div>

          {/* Email */}
          <div className="grid grid-cols-12">
            <div className="col-span-4 font-semibold text-gray-600">
              Email
            </div>

            <div className="col-span-8 text-gray-500 break-all">
              {profile.email}
            </div>
          </div>

          {/* Account Type */}
          <div className="grid grid-cols-12">
            <div className="col-span-4 font-semibold text-gray-600">
              Account Type
            </div>

            <div className="col-span-8 text-gray-500">
              {profile.accountType}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
