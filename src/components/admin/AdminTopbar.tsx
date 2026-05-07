"use client";

import { useAuthStore } from "@/app/store/authStore";
import { useUIStore } from "@/app/store/uiStore";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";

export function AdminTopbar() {
  const { logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      style={{
        height: 48,
        borderBottom: "1px solid var(--figma-border, #1F2937)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        background: "var(--figma-bg, #0C0C14)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
      className="px-4 lg:px-6"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--figma-text, #fff)",
            cursor: "pointer",
          }}
          className="lg:hidden"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Home */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "rgba(255,255,255,0.04)",
            color: "var(--figma-text3, #94A3B8)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "var(--figma-text2, #E2E8F0)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "var(--figma-text3, #94A3B8)";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Đăng xuất"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "rgba(239,68,68,0.1)",
            color: loggingOut ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.7)",
            border: "1px solid rgba(239,68,68,0.2)",
            cursor: loggingOut ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              e.currentTarget.style.background = "rgba(239,68,68,0.2)";
              e.currentTarget.style.color = "#EF4444";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "rgba(239,68,68,0.7)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
          }}
        >
          {loggingOut ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <LogOut size={13} />
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
