"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";
import { type FooterData } from "./Footer";
import { AuthProvider } from "@/contexts/AuthContext";

interface PublicShellProps {
  children: React.ReactNode;
  footerData?: FooterData;
}

export function PublicShell({ children, footerData }: PublicShellProps) {
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
        <Navbar />
        <main style={{ flex: 1, paddingTop: "68px" }}>{children}</main>
        <Footer data={footerData} />
      </div>
    </AuthProvider>
  );
}
