"use client";

import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useAuthStore } from "@/app/store/authStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function AdminTopbar() {
  const { t } = useAdminTranslations();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
    // logout() đã clear localStorage + Zustand → browser về homepage
    router.push("/");
  };

  const avatar = user?.avatar;
  const name = user?.name ?? user?.email ?? "Admin";
  const shortName = (user as { shortName?: string })?.shortName ?? name.slice(0, 2).toUpperCase();

  return (
    <header
      style={{
        height: 48,
        borderBottom: "1px solid var(--figma-border, #1F2937)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 1rem",
        gap: "0.5rem",
        background: "var(--figma-bg, #020617)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* User info */}
      {user && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            marginRight: "auto",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              overflow: "hidden",
              background: "rgba(59,130,246,0.2)",
              border: "1px solid rgba(59,130,246,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "#3B82F6",
              fontFamily: "'JetBrains Mono', monospace",
              flexShrink: 0,
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              shortName
            )}
          </div>
          {/* Name */}
          <span
            style={{
              color: "var(--figma-text3, #94A3B8)",
              fontSize: "0.75rem",
              fontWeight: 500,
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
        </div>
      )}

      {/* Home */}
      <a
        href="/"
        title={t("sidebar.nav.goHome")}
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

      {/* Logout button */}
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

      {/* Language toggle */}
      <button
        onClick={() => {
          const current = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1];
          const next = current === "en" ? "vi" : "en";
          document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
          window.location.href = `/${next}/`;
        }}
        title="Toggle language"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "rgba(255,255,255,0.04)",
          color: "var(--figma-text3, #94A3B8)",
          border: "none",
          cursor: "pointer",
          fontSize: "0.625rem",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.05em",
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
        EN
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
