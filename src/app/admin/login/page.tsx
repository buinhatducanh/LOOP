"use client";

/**
 * Admin Login Page — /admin/login
 *
 * Public: shows login form for unauthenticated users.
 * Already-authenticated users are auto-redirected to /admin/overview.
 *
 * Fix (2026-04-09): reads localStorage directly instead of Zustand,
 * so redirect fires immediately without waiting for Zustand rehydration.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { DS } from "@/lib/design-tokens";

function hasStoredToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("loop-staff-token");
}

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Trigger modal open after first render (avoids SSR mismatch)
  // Also redirect if user is already logged in
  useEffect(() => {
    // Always check localStorage — fastest way to know if user has a session
    if (hasStoredToken()) {
      router.replace("/admin/overview");
      return;
    }
    setMounted(true);
  }, []);

  return (
    <div
      style={{
        background: DS.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: DS.body,
      }}
    >
      {/* Ambient background orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(107,61,245,0.08) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)",
        }} />
      </div>

      {/* Modal: auto-open on this login page */}
      {mounted && (
        <AdminLoginModal
          autoOpen
          children={
            <div style={{ display: "none" }} />
          }
        />
      )}
    </div>
  );
}
