"use client";

import { usePathname } from "@/i18n/routing";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { type FooterData } from "./Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState } from "react";

interface PublicShellProps {
  children: React.ReactNode;
  footerData?: FooterData;
}

// Routes that belong to the admin dashboard — Navbar + Footer should be hidden
// usePathname() from next-intl/routing returns the path WITHOUT locale prefix
// (e.g. /admin/team not /vi/admin/team), so we check for /admin prefix only
const ADMIN_PREFIXES = ["/admin"];

function isAdminRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function PublicShell({ children, footerData }: PublicShellProps) {
  const pathname = usePathname();

  // Derive admin route synchronously — no useState/useEffect needed.
  // usePathname() is always available after the first render in a "use client" component.
  // This prevents the Navbar from briefly rendering with z-index:9999 on admin pages
  // during the hydration window, which would block all interactions.
  if (isAdminRoute(pathname)) {
    return (
      <AuthProvider>
        <div style={{ background: "#020617", minHeight: "100vh" }}>
          {children}
        </div>
      </AuthProvider>
    );
  }

  const isHomePage = pathname === "/" || pathname === "/vi" || pathname === "/en";

  return (
    <AuthProvider>
      <div
        style={{
          background: "#020617",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar hideOnHome={isHomePage} />
        <main style={{ flex: 1, paddingTop: isHomePage ? "0px" : "72px" }}>{children}</main>
        <Footer data={footerData} />
      </div>
    </AuthProvider>
  );
}
