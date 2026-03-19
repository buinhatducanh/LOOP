"use client";

import { usePathname } from "@/i18n/routing";
import { SessionProvider } from "next-auth/react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { type FooterData } from "./Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface PublicShellProps {
  children: React.ReactNode;
  footerData?: FooterData;
}

export function PublicShell({ children, footerData }: PublicShellProps) {
  const pathname = usePathname();
  const [isHomePage, setIsHomePage] = useState(false);

  useEffect(() => {
    setIsHomePage(pathname === "/" || pathname === "/vi" || pathname === "/en");
  }, [pathname]);

  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}
