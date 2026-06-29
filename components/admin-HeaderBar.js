"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Search, Bell, ChevronDown, LogOut, User, Upload, Settings, Image as ImageIcon, RefreshCw, Folder, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const profileMenuItems = [
  { icon: User, label: "My Profile", href: "/admin/profile" },
  { icon: Upload, label: "Upload Product & Images", href: "/admin/upload" },
  { icon: Settings, label: "Ecommerce Settings", href: "/admin/settings" },
  { icon: ImageIcon, label: "Carousel", href: "/admin/carousel" },
  { icon: CreditCard, label: "Promotion Image", href: "/admin/promotion" },
  { icon: CreditCard, label: "Poster Card", href: "/admin/poster" },
  { icon: RefreshCw, label: "Clear System Optimization", href: "/admin/clear-cache" },
  { icon: Folder, label: "Upload Image Folder", href: "/admin/image-folder" },
  { icon: LogOut, label: "Logout", href: "/admin/logout", danger: true },
];

export default function AdminHeaderBar({ onToggleSidebar }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminName, setAdminName] = useState("Gyanendra");
  const profileRef = useRef(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="px-5 h-14 flex items-center justify-between gap-4">

        {/* Left: Hamburger + Brand */}
        

        {/* Center: Search */}
        

        {/* Right: Bell + Profile */}
        <div className="flex items-center gap-2">

          

          {/* Profile Dropdown */}
          <div className="absolute right-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{adminName}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-800">{adminName}</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {profileMenuItems.map(({ icon: Icon, label, href, danger }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setProfileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        danger
                          ? "text-red-600 hover:bg-red-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}