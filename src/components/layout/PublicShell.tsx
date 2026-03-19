"use client";

import { usePathname } from "@/i18n/routing";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { type FooterData } from "./Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface PublicShellProps {
  children: React.ReactNode;
  footerData?: FooterData;
}

// Routes that belong to the admin dashboard — Navbar + Footer should be hidden
const ADMIN_PATH_PREFIXES = ["/admin", "/vi/admin", "/en/admin"];

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function PublicShell({ children, footerData }: PublicShellProps) {
  const pathname = usePathname();
  const [isHomePage, setIsHomePage] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsHomePage(pathname === "/" || pathname === "/vi" || pathname === "/en");
    setIsAdmin(isAdminRoute(pathname));
  }, [pathname]);

  // Never render Navbar/Footer on admin routes
  if (isAdmin) {
    return (
      <AuthProvider>
        <div style={{ background: "#020617", minHeight: "100vh" }}>
          {children}
        </div>
      </AuthProvider>
    );
  }

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
