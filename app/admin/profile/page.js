"use client";

import { useState } from "react";
import { LayoutDashboard } from "lucide-react";

import ProfileCard from "./components/ProfileCard";
import ProfileOverview from "./components/ProfileOverview";
import EditProfile from "./components/EditProfile";
import ChangePassword from "./components/ChangePassword";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [profile, setProfile] = useState({
    image: "/images/profile.png",
    fullName: "Scilent Knight",
    country: "Nepal",
    address: "Kathmandu, Nepal",
    phone: "9861252006",
    email: "scilentknight512@gmail.com",
    accountType: "Admin",
  });

  return (
    <div className="p-6 bg-[#f6f9ff] min-h-screen">
      {/* Page Title */}
      <h1 className="text-4xl font-semibold text-[#012970]">Profile</h1>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mt-2 mb-6">
        <LayoutDashboard className="w-4 h-4 text-gray-500" />

        <span className="text-[#899bbd] font-semibold">Dashboard</span>

        <span className="text-gray-500">/</span>

        <span className="text-[#51678f]">Profile</span>
      </div>

      {/* Main */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left */}
        <div className="col-span-12 lg:col-span-4">
          <ProfileCard profile={profile} />
        </div>

        {/* Right */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-md shadow-sm p-5">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-5">
              <div className="flex gap-8">
                <button onClick={() => setActiveTab("overview")} className={`pb-3 text-[17px] transition ${activeTab === "overview" ? "text-[#4154f1] border-b-2 border-[#4154f1]" : "text-[#012970]"}`}>
                  Overview
                </button>

                <button onClick={() => setActiveTab("edit")} className={`pb-3 text-[17px] transition ${activeTab === "edit" ? "text-[#4154f1] border-b-2 border-[#4154f1]" : "text-[#012970]"}`}>
                  Edit Profile
                </button>

                <button onClick={() => setActiveTab("password")} className={`pb-3 text-[17px] transition ${activeTab === "password" ? "text-[#4154f1] border-b-2 border-[#4154f1]" : "text-[#012970]"}`}>
                  Change Password
                </button>
              </div>
            </div>

            {/* Tab Content */}

            {activeTab === "overview" && <ProfileOverview profile={profile} />}

            {activeTab === "edit" && <EditProfile profile={profile} setProfile={setProfile} />}

            {activeTab === "password" && <ChangePassword />}
          </div>
        </div>
      </div>

      {/* Footer */}

      <div className="mt-12 border-t pt-6 text-center text-[17px]">
        Copyright © 2026 <span className="font-bold text-[#012970]">Global Tech Nepal Pvt. Ltd.</span>
      </div>
    </div>
  );
}
