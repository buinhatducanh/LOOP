"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Zap, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function TopMenuTrigger() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  // Link from next-intl automatically adds locale, so use paths WITHOUT locale
  const navLinks = [
    { key: "home", path: "/" },
    { key: "services", path: "/services" },
    { key: "teamList", path: "/team-list" },
    { key: "about", path: "/about" },
    { key: "contact", path: "/contact" },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show menu when mouse is in top 30% of viewport
      const threshold = window.innerHeight * 0.3;
      setShowMenu(e.clientY < threshold);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: showMenu ? "0" : "-100px",
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(17, 24, 39, 0.98)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        transition: "top 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "68px",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap style={{ width: "20px", height: "20px", color: "#FFFFFF" }} />
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                background: "linear-gradient(to right, #A78BFA, #67E8F9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              LOOP
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "8px",
                  color: pathname === link.path ? "#FFFFFF" : "#9CA3AF",
                  background: pathname === link.path ? "rgba(255,255,255,0.1)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                {t(link.key as any)}
              </Link>
            ))}
          </div>

          {/* Right Side: Auth + Language */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Auth buttons - desktop only */}
            <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => { logout(); router.push("/"); }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    color: "#D1D5DB",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      color: "#D1D5DB",
                      textDecoration: "none",
                    }}
                  >
                    <LogIn style={{ width: "16px", height: "16px" }} />
                    <span>{t("login")}</span>
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      padding: "8px 20px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#FFFFFF",
                      background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                      borderRadius: "8px",
                      textDecoration: "none",
                    }}
                  >
                    {t("register")}
                  </Link>
                </>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
