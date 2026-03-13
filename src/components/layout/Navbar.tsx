"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { Menu, X, Zap, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

const navLinks = [
  { key: "home", path: "/" },
  { key: "services", path: "/services" },
  { key: "portfolio", path: "/portfolio" },
  { key: "pricing", path: "/pricing" },
  { key: "about", path: "/about" },
  { key: "contact", path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: scrolled
          ? "rgba(17, 24, 39, 0.95)"
          : "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        transition: "all 0.3s ease",
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

            {/* Language Switcher - always visible */}
            <LanguageSwitcher />

            {/* Mobile hamburger */}
            <button
              className="mobile-only"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                padding: "8px",
                color: "#9CA3AF",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "none",
              }}
            >
              {isOpen ? (
                <X style={{ width: "24px", height: "24px" }} />
              ) : (
                <Menu style={{ width: "24px", height: "24px" }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          style={{
            background: "rgba(17, 24, 39, 0.98)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "16px",
          }}
          className="mobile-menu"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              style={{
                display: "block",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "8px",
                color: pathname === link.path ? "#FFFFFF" : "#9CA3AF",
                background: pathname === link.path ? "rgba(255,255,255,0.1)" : "transparent",
                textDecoration: "none",
                marginBottom: "4px",
              }}
            >
              {t(link.key as any)}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "12px", paddingTop: "12px" }}>
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#9CA3AF",
                    textDecoration: "none",
                  }}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                    borderRadius: "8px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-only { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
