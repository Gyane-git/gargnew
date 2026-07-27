"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminHeaderBar from "@/components/admin-HeaderBar";
import SideHeaderBar from "@/components/admin-sidebar";
import { ToastContainer } from "react-toastify";
import { canAccessAdminPath, getAdminLandingPath } from "@/utils/adminAccess";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [checking, setChecking] = useState(!isLoginPage);
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      if (isLoginPage) {
        setChecking(false);
        return;
      }

      setChecking(true);

      try {
        const res = await fetch("/api/v1/admin/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success || !data.admin) {
          throw new Error(data?.message || "Unauthorized");
        }

        const currentAdmin = data.admin;
        if (!cancelled) {
          setAdmin(currentAdmin);

          if (!canAccessAdminPath(pathname, currentAdmin.role)) {
            router.replace(getAdminLandingPath(currentAdmin.role));
            return;
          }
        }
      } catch {
        if (!cancelled) {
          setAdmin(null);
          router.replace("/admin/login");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, pathname, router]);

  // useEffect(() => {
  //   if (isLoginPage) {
  //     setChecking(false);
  //     return;
  //   }

  //   // Skip authentication
  //   setAdmin({
  //     role: "Super Admin",
  //     name: "Developer",
  //   });

  //   setChecking(false);
  // }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <span className="h-6 w-6 rounded-full bg-indigo-600 animate-bounce"></span>
            <span
              className="h-6 w-6 rounded-full bg-orange-600 animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></span>
            <span
              className="h-6 w-6 rounded-full bg-indigo-600 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></span>
          </div>

          <p className="text-gray-600 text-sm font-medium">Checking Access</p>
        </div>
      </div>
    );
  }

  // if (checking) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
  //       <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow-xl px-10 py-8 flex flex-col items-center gap-5">
  //         <div className="h-16 w-16 rounded-full border-[5px] border-indigo-100 border-t-indigo-600 animate-spin"></div>

  //         <div className="text-center">
  //           <h2 className="text-lg font-semibold text-gray-800">
  //             Verifying Access
  //           </h2>
  //           <p className="text-sm text-gray-500 mt-1 animate-pulse">
  //             Please wait a moment...
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col h-screen">
      <AdminHeaderBar onToggleSidebar={undefined} admin={admin} />

      <div className="flex flex-1 overflow-hidden">
        <SideHeaderBar adminRole={admin?.role || ""} />

        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>
  );
}
