"use client";

import AdminHeaderBar from "@/components/admin-HeaderBar";
import SideHeaderBar from "@/components/admin-sidebar";

import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      {/* HEADER */}
      <AdminHeaderBar onToggleSidebar={undefined} />

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        <SideHeaderBar />

        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>

      {/* TOAST CONTAINER (GLOBAL) */}
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="light" />
    </div>
  );
}
