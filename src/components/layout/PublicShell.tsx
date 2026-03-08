"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";
import { AuthProvider } from "@/contexts/AuthContext";

export function PublicShell({ children }: { children: React.ReactNode }) {
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
        <Footer />
      </div>
    </AuthProvider>
  );
}
