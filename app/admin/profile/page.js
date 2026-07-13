"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

import ProfileCard from "./components/ProfileCard";
import ProfileOverview from "./components/ProfileOverview";
import EditProfile from "./components/EditProfile";
import ChangePassword from "./components/ChangePassword";

const EMPTY_PROFILE = {
  image: "/images/profile.png",
  profilePhotoPath: "",
  fullName: "",
  country: "",
  address: "",
  phone: "",
  email: "",
  accountType: "Admin",
  profilePhotoFile: null,
};

const normalizeProfile = (admin) => ({
  image: admin?.image_full_url || admin?.profile_photo_path || "/images/profile.png",
  profilePhotoPath: admin?.profile_photo_path || "",
  fullName: admin?.full_name || admin?.name || "",
  country: admin?.country || "",
  address: admin?.address || "",
  phone: admin?.phone || "",
  email: admin?.email || "",
  accountType: admin?.accountType || admin?.role || "Admin",
  profilePhotoFile: null,
});

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/v1/admin/profile", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success || !data?.admin) {
          throw new Error(data?.message || "Failed to load profile.");
        }

        if (!cancelled) {
          setProfile(normalizeProfile(data.admin));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileSubmit = async (nextProfile) => {
    setSavingProfile(true);
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.set("action", "profile");
      payload.set("full_name", nextProfile.fullName || "");
      payload.set("email", nextProfile.email || "");
      payload.set("phone", nextProfile.phone || "");
      payload.set("country", nextProfile.country || "");
      payload.set("address", nextProfile.address || "");
      payload.set("account_type", nextProfile.accountType || "");

      if (nextProfile.profilePhotoPath) {
        payload.set("profile_photo_path", nextProfile.profilePhotoPath);
      }

      if (nextProfile.profilePhotoFile) {
        payload.set("profile_photo", nextProfile.profilePhotoFile);
      }

      const res = await fetch("/api/v1/admin/profile", {
        method: "PATCH",
        body: payload,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.admin) {
        throw new Error(data?.message || "Failed to update profile.");
      }

      setProfile(normalizeProfile(data.admin));
      setMessage(data.message || "Profile updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (formData) => {
    setSavingPassword(true);
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.set("action", "password");
      payload.set("current_password", formData.currentPassword || "");
      payload.set("new_password", formData.newPassword || "");
      payload.set("confirm_password", formData.renewPassword || "");

      const res = await fetch("/api/v1/admin/profile", {
        method: "PATCH",
        body: payload,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to change password.");
      }

      setMessage(data.message || "Password changed successfully.");
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

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
      {loading ? (
        <div className="rounded-md bg-white p-8 text-gray-500 shadow-sm">Loading profile...</div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <ProfileCard profile={profile} />
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-md shadow-sm p-5">
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

              {(message || error) && (
                <div className={`mb-5 rounded-md px-4 py-3 text-sm ${error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                  {error || message}
                </div>
              )}

              {activeTab === "overview" && <ProfileOverview profile={profile} />}

              {activeTab === "edit" && <EditProfile profile={profile} setProfile={setProfile} onSubmit={handleProfileSubmit} saving={savingProfile} />}

              {activeTab === "password" && <ChangePassword onSubmit={handlePasswordSubmit} saving={savingPassword} />}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}

      <div className="mt-12 border-t pt-6 text-center text-[17px]">
        Copyright © 2026 <span className="font-bold text-[#012970]">Global Tech Nepal Pvt. Ltd.</span>
      </div>
    </div>
  );
}
