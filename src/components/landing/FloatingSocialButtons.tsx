"use client";

/**
 * FloatingSocialButtons — Fixed bottom-right social contact buttons.
 * Call / Zalo / Facebook — CEO contact info from constants.ts
 * Hidden when onboarding is active (localStorage check).
 */

import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { CEO_CONTACT } from "@/lib/constants";

export function FloatingSocialButtons() {
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    // Hide buttons when onboarding hasn't been completed yet
    const done = localStorage.getItem("loop_onboarding_done");
    setIsOnboarding(!done);

    // React when onboarding is skipped/completed (other tabs or direct localStorage changes)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "loop_onboarding_done") {
        setIsOnboarding(false);
      }
    };

    // Listen for localStorage changes in the same tab (e.g. onboarding skip)
    window.addEventListener("storage", handleStorage);

    // Also listen for a custom event fired when onboarding is completed/skip
    const handleOnboardingDone = () => setIsOnboarding(false);
    window.addEventListener("loop_onboarding_done", handleOnboardingDone);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("loop_onboarding_done", handleOnboardingDone);
    };
  }, []);

  if (isOnboarding) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        zIndex: 9999,
      }}
    >
      {/* Call Now */}
      <a
        href={`tel:${CEO_CONTACT.phone}`}
        aria-label={`Gọi ngay: ${CEO_CONTACT.phoneDisplay}`}
        title={`Gọi ngay: ${CEO_CONTACT.phoneDisplay}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(236,72,153,0.95) 0%, rgba(107,61,245,0.95) 100%)",
          boxShadow: "0 4px 20px rgba(236,72,153,0.5), 0 0 0 2px rgba(236,72,153,0.25)",
          color: "#fff",
          textDecoration: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1.1)";
          el.style.boxShadow = "0 6px 32px rgba(236,72,153,0.65), 0 0 0 2px rgba(236,72,153,0.4)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1)";
          el.style.boxShadow = "0 4px 20px rgba(236,72,153,0.5), 0 0 0 2px rgba(236,72,153,0.25)";
        }}
      >
        <Phone size={22} />
      </a>

      {/* Zalo */}
      <a
        href={CEO_CONTACT.zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Liên hệ Zalo"
        title="Liên hệ Zalo"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "linear-gradient(135deg, #0068FF 0%, #0068FF 100%)",
          boxShadow: "0 4px 20px rgba(0,104,255,0.45), 0 0 0 2px rgba(0,104,255,0.20)",
          color: "#fff",
          textDecoration: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: "0.05em",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1.1)";
          el.style.boxShadow = "0 6px 28px rgba(0,104,255,0.65), 0 0 0 2px rgba(0,104,255,0.35)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1)";
          el.style.boxShadow = "0 4px 20px rgba(0,104,255,0.45), 0 0 0 2px rgba(0,104,255,0.20)";
        }}
      >
        ZALO
      </a>

      {/* Facebook */}
      <a
        href={CEO_CONTACT.facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Liên hệ Facebook CEO"
        title="Liên hệ Facebook"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "#1877F2",
          boxShadow: "0 4px 20px rgba(24,119,242,0.45), 0 0 0 2px rgba(24,119,242,0.20)",
          color: "#fff",
          textDecoration: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1.1)";
          el.style.boxShadow = "0 6px 28px rgba(24,119,242,0.6), 0 0 0 2px rgba(24,119,242,0.35)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1)";
          el.style.boxShadow = "0 4px 20px rgba(24,119,242,0.45), 0 0 0 2px rgba(24,119,242,0.20)";
        }}
      >
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </svg>
      </a>
    </div>
  );
}
