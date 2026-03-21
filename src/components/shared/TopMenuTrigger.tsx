"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Zap, LogIn, ChevronDown, Package, Briefcase, Users, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "next-auth/react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function TopMenuTrigger() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Main nav links
  const mainLinks = [
    { key: "home", path: "/" },
    { key: "services", path: "/services" },
    { key: "teamList", path: "/team-list" },
  ];

  // Dropdown links
  const dropdownLinks = [
    { key: "portfolio", path: "/portfolio", icon: Package },
    { key: "pricing", path: "/pricing", icon: Briefcase },
    { key: "blog", path: "/blog", icon: FileText },
    { key: "about", path: "/about", icon: Users },
  ];

  // All nav links for mobile
  const allNavLinks = [
    { key: "home", path: "/" },
    { key: "services", path: "/services" },
    { key: "teamList", path: "/team-list" },
    { key: "portfolio", path: "/portfolio" },
    { key: "pricing", path: "/pricing" },
    { key: "blog", path: "/blog" },
    { key: "about", path: "/about" },
    { key: "contact", path: "/contact" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show menu when mouse is in top area, hide when scrolled down
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateMenuVisibility = () => {
      const scrollY = window.scrollY;
      const mouseY = lastMouseY;

      // Show menu if:
      // 1. At top of page (scrollY < 50) AND mouse in top 30% of viewport
      // 2. Scrolling up (scrollY < lastScrollY) and near top
      const isAtTop = scrollY < 50;
      const isScrollingUp = scrollY < lastScrollY;
      const isMouseInTopArea = mouseY < window.innerHeight * 0.3;

      if (isAtTop && isMouseInTopArea) {
        setShowMenu(true);
      } else if (isScrollingUp && scrollY < 100) {
        setShowMenu(true);
      } else if (scrollY > 50) {
        setShowMenu(false);
      }

      lastScrollY = scrollY;
      ticking = false;
    };

    let lastMouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      lastMouseY = e.clientY;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateMenuVisibility);
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
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
            {mainLinks.map((link) => (
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

            {/* More Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === "more" ? null : "more")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "8px",
                  color: "#9CA3AF",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {t("more")}
                <ChevronDown
                  size={14}
                  style={{
                    transform: openDropdown === "more" ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {openDropdown === "more" && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "0",
                    marginTop: "8px",
                    minWidth: "180px",
                    background: "rgba(17, 24, 39, 0.98)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "8px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    zIndex: 100,
                  }}
                >
                  {dropdownLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        href={link.path}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          fontSize: "14px",
                          fontWeight: 500,
                          borderRadius: "8px",
                          color: pathname === link.path ? "#FFFFFF" : "#9CA3AF",
                          background: pathname === link.path ? "rgba(255,255,255,0.1)" : "transparent",
                          textDecoration: "none",
                          transition: "all 0.2s",
                        }}
                      >
                        <Icon size={16} />
                        {t(link.key as any)}
                      </Link>
                    );
                  })}
                  <Link
                    key="contact"
                    href="/contact"
                    onClick={() => setOpenDropdown(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      fontSize: "14px",
                      fontWeight: 500,
                      borderRadius: "8px",
                      color: pathname === "/contact" ? "#FFFFFF" : "#9CA3AF",
                      background: pathname === "/contact" ? "rgba(255,255,255,0.1)" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      marginTop: "4px",
                      paddingTop: "12px",
                    }}
                  >
                    {t("contact")}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Auth + Language */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Auth buttons - desktop only */}
            <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isAuthenticated && user ? (
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); }}
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
