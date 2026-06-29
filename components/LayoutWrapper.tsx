"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import HeaderBarNew from "@/components/HeaderBarNew"
import FooterBar from "@/components/FooterBar";
import TawkToWidget from "@/components/TawkToWidget";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Check if route starts with `/admin`
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <HeaderBarNew />}
      {children}
      {!isAdminRoute && <FooterBar />}
      {!isAdminRoute && <TawkToWidget />}
    </>
  );
}
