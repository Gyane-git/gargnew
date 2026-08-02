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
  // Swagger UI (/api-docs) is a standalone API reference page - it shouldn't carry the
  // storefront's header/footer/chat widget, same as admin routes don't.
  const isApiDocsRoute = pathname?.startsWith("/api-docs");
  const hideChrome = isAdminRoute || isApiDocsRoute;

  return (
    <>
      {!hideChrome && <HeaderBarNew />}
      {children}
      {!hideChrome && <FooterBar />}
      {!hideChrome && <TawkToWidget />}
    </>
  );
}
