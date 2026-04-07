"use client";

/**
 * Admin Login Page — /admin/login
 *
 * Renders the AdminLoginModal directly so the user can log in
 * when redirected here by AuthGuard or middleware.
 *
 * Layout: dark background + auto-opened modal.
 */
import { useEffect, useState } from "react";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { DS } from "@/lib/design-tokens";

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false);

  // Trigger modal open after first render (avoids SSR mismatch)
  useEffect(() => {
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
