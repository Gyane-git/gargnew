"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, LogOut, User, Upload, Settings, Image as ImageIcon, RefreshCw, Folder, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const profileMenuItems = [
  { icon: User, label: "My Profile", href: "/admin/profile" },
  { icon: Upload, label: "Upload Product & Images", href: "/admin/upload-product-images" },
  { icon: Settings, label: "Ecommerce Settings", href: "/admin/website" },
  // { icon: ImageIcon, label: "Carousel", href: "/admin/carousel" },
  { icon: CreditCard, label: "Promotion Image", href: "/admin/website-promotion" },
  { icon: CreditCard, label: "Poster Card", href: "/admin/poster-card" },
  { icon: RefreshCw, label: "Clear System Optimization", href: "/admin/clear-cache" },
  { icon: Folder, label: "Upload Image Folder", href: "/admin/image-folder" },
  { icon: LogOut, label: "Logout", danger: true },
];

export default function AdminHeaderBar({ onToggleSidebar }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminName, setAdminName] = useState("Gyanendra");
  const profileRef = useRef(null);
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("admin");

      router.push("/admin/login");
    }, 350);
  };

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
            <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">{initials}</div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{adminName}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
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
                  <div className="py-1">
                    {profileMenuItems.map(({ icon: Icon, label, href, danger }) => {
                      if (label === "Logout") {
                        return (
                          <button
                            key={label}
                            onClick={() => {
                              setProfileOpen(false);
                              setShowLogoutModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                            {label}
                          </button>
                        );
                      }

                      return (
                        <Link key={label} href={href} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div className="fixed inset-0 z-[9999] flex items-start justify-center pt-7 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
            <motion.div
              initial={{ y: -80, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -80, opacity: 0, scale: 0.98 }}
              transition={{
                duration: 0.35,
                ease: "easeInOut",
              }}
              className="w-[510px] rounded-lg bg-white shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
                <h2 className="text-xl font-normal text-gray-700">Logout</h2>

                <button onClick={() => setShowLogoutModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer">
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <p className="text-lg font-semibold text-gray-700">Are you sure you want to Logout?</p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-300">
                <button onClick={handleLogout} className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  Logout
                </button>

                <button onClick={() => setShowLogoutModal(false)} className="px-5 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
