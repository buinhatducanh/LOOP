"use client";

import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";

export function AdminTopbar() {
  const { t } = useAdminTranslations();

  return (
    <header
      style={{
        height: 48,
        borderBottom: "1px solid var(--figma-border, #1F2937)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 1rem",
        gap: "0.375rem",
        background: "var(--figma-bg, #020617)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
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
    </header>
  );
}
