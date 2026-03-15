"use client";

import dynamic from "next/dynamic";
import Navbar from "./Navbar";
import { type FooterData } from "./Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const Footer = dynamic(() => import("./Footer"), { ssr: false });

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
