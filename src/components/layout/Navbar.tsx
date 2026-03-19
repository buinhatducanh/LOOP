"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { signIn, signOut } from "next-auth/react";
import { Menu, X, Zap, ChevronDown, Package, Briefcase, Users, FileText, Settings, LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { NavbarSearch } from "@/components/layout/NavbarSearch";

interface NavbarProps {
  hideOnHome?: boolean;
}

export default function Navbar({ hideOnHome = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

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

  // Global ⌘K / Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(".navbar-search-input");
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === "more") setOpenDropdown(null);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === "user") setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const isHomePage = pathname === "/" || pathname === "/" + locale;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setAtTop(window.scrollY < 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const shouldHide = hideOnHome && isHomePage && atTop;

  return (
    <nav
      style={{
        position: "fixed",
        top: shouldHide ? "-100px" : "0",
        left: 0,
        right: 0,
        zIndex: 9999,
        background: (scrolled || shouldHide)
          ? "rgba(9, 11, 20, 0.96)"
          : "rgba(9, 11, 20, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 28px",
        }}
      >
        {/* Top Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
            gap: "20px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(139,92,246,0.35), 0 0 8px rgba(6,182,212,0.2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Zap style={{ width: "20px", height: "20px", color: "#FFFFFF", position: "relative", zIndex: 1 }} />
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                  animation: "logoShine 3s ease-in-out infinite",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "22px",
                fontWeight: 800,
                background: "linear-gradient(to right, #C4B5FD, #A5F3FC)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
              }}
            >
              LOOP
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div
            className="desktop-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              flexShrink: 0,
            }}
          >
            {mainLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    borderRadius: "10px",
                    color: isActive ? "#FFFFFF" : "rgba(209,213,219,0.85)",
                    background: isActive ? "rgba(139,92,246,0.18)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    position: "relative",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF";
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.color = "rgba(209,213,219,0.85)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }
                  }}
                >
                  {t(link.key as any)}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "18px",
                        height: "2px",
                        borderRadius: "1px",
                        background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                      }}
                    />
                  )}
                </Link>
              );
            })}

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
                  fontWeight: 600,
                  borderRadius: "10px",
                  color: "rgba(209,213,219,0.85)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={(e) => {
                  if (openDropdown !== "more") {
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(209,213,219,0.85)";
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }
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
                    minWidth: "200px",
                    background: "rgba(15,17,23,0.98)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    padding: "8px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)",
                    zIndex: 100,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {dropdownLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        href={link.path}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          fontSize: "14px",
                          fontWeight: 500,
                          borderRadius: "10px",
                          color: isActive ? "#FFFFFF" : "rgba(209,213,219,0.8)",
                          background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
                          textDecoration: "none",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                            (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(209,213,219,0.8)";
                          }
                        }}
                      >
                        <Icon size={16} style={{ opacity: 0.8 }} />
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
                      padding: "10px 14px",
                      fontSize: "14px",
                      fontWeight: 500,
                      borderRadius: "10px",
                      color: pathname === "/contact" ? "#FFFFFF" : "rgba(209,213,219,0.8)",
                      background: pathname === "/contact" ? "rgba(139,92,246,0.15)" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s",
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      marginTop: "4px",
                      paddingTop: "14px",
                    }}
                  >
                    {t("contact")}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="desktop-nav" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <NavbarSearch />
          </div>

          {/* Right Side: Language + Auth */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <LanguageSwitcher />

            {/* Auth buttons - desktop only */}
            <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isAuthenticated && user ? (
                /* User Menu Dropdown */
                <div ref={userDropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "user" ? null : "user")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px 6px 6px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
                    }}
                    onMouseLeave={(e) => {
                      if (openDropdown !== "user") {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        flexShrink: 0,
                      }}
                    >
                      {user.avatar?.slice(0, 2).toUpperCase()}
                    </div>
                    {/* Name */}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "rgba(209,213,219,0.9)",
                        maxWidth: "120px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.name}
                    </span>
                    <ChevronDown
                      size={12}
                      style={{
                        color: "rgba(209,213,219,0.6)",
                        transform: openDropdown === "user" ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {openDropdown === "user" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: "0",
                        minWidth: "220px",
                        background: "rgba(15,17,23,0.98)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        padding: "8px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)",
                        zIndex: 200,
                        backdropFilter: "blur(20px)",
                      }}
                      onClick={() => setOpenDropdown(null)}
                    >
                      {/* User info header */}
                      <div
                        style={{
                          padding: "10px 14px 12px",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                          marginBottom: "4px",
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(209,213,219,0.5)", marginTop: "2px" }}>
                          {user.email}
                        </div>
                        <div
                          style={{
                            display: "inline-block",
                            marginTop: "6px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: user.role === "admin"
                              ? "rgba(139,92,246,0.2)"
                              : "rgba(59,130,246,0.2)",
                            color: user.role === "admin" ? "#A78BFA" : "#60A5FA",
                          }}
                        >
                          {user.role === "admin" ? "Administrator" : "Customer"}
                        </div>
                      </div>

                      {/* Admin Dashboard — only for non-customer roles */}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 14px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#FFFFFF",
                            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))",
                            borderRadius: "10px",
                            textDecoration: "none",
                            transition: "all 0.15s",
                            marginBottom: "2px",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.25))";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))";
                          }}
                        >
                          <LayoutDashboard size={15} style={{ opacity: 0.9 }} />
                          Admin Dashboard
                        </Link>
                      )}

                      {/* Account Settings */}
                      <Link
                        href="/account"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 14px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "rgba(209,213,219,0.8)",
                          textDecoration: "none",
                          transition: "all 0.15s",
                          borderRadius: "10px",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                          (e.currentTarget as HTMLAnchorElement).style.color = "rgba(209,213,219,0.8)";
                        }}
                      >
                        <UserCircle size={15} style={{ opacity: 0.8 }} />
                        Tài khoản
                      </Link>

                      {/* Sign Out */}
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 14px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#F87171",
                          background: "transparent",
                          border: "none",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          borderRadius: "10px",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                      >
                        <LogOut size={15} style={{ opacity: 0.8 }} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "rgba(209,213,219,0.9)",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      letterSpacing: "0.01em",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.25)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      padding: "8px 18px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      letterSpacing: "0.01em",
                      boxShadow: "0 0 20px rgba(139,92,246,0.3)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 24px rgba(139,92,246,0.45)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(139,92,246,0.3)";
                    }}
                  >
                    {t("register")}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="mobile-only"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                padding: "8px",
                color: "rgba(209,213,219,0.8)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                cursor: "pointer",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isOpen ? (
                <X style={{ width: "20px", height: "20px" }} />
              ) : (
                <Menu style={{ width: "20px", height: "20px" }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          style={{
            background: "rgba(9,11,20,0.98)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "16px",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
          className="mobile-menu"
        >
          {/* Mobile search bar */}
          <div style={{ marginBottom: "12px", padding: "0 4px" }}>
            <NavbarSearch />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
            {allNavLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  color: pathname === link.path ? "#FFFFFF" : "rgba(209,213,219,0.8)",
                  background: pathname === link.path ? "rgba(139,92,246,0.15)" : "transparent",
                  textDecoration: "none",
                  marginBottom: "2px",
                  gap: "10px",
                  transition: "all 0.15s",
                }}
              >
                {t(link.key as any)}
              </Link>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "12px", paddingTop: "12px" }}>
            {isAuthenticated && user ? (
              <>
                {/* User info */}
                <div style={{ padding: "12px 16px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF" }}>{user.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(209,213,219,0.5)", marginTop: "2px" }}>{user.email}</div>
                </div>

                {/* Admin Dashboard — only for non-customer */}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#FFFFFF",
                      background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))",
                      borderRadius: "10px",
                      textDecoration: "none",
                      marginBottom: "6px",
                    }}
                  >
                    <LayoutDashboard size={16} />
                    Admin Dashboard
                  </Link>
                )}

                <Link
                  href="/account"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "rgba(209,213,219,0.9)",
                    textDecoration: "none",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    marginBottom: "8px",
                  }}
                >
                  <UserCircle size={16} />
                  Tài khoản
                </Link>

                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#F87171",
                    background: "transparent",
                    border: "1px solid rgba(248,113,113,0.2)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "rgba(209,213,219,0.9)",
                    textDecoration: "none",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    marginBottom: "8px",
                    textAlign: "center",
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
                    fontWeight: 700,
                    color: "#FFFFFF",
                    background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                    borderRadius: "10px",
                    textDecoration: "none",
                    textAlign: "center",
                    boxShadow: "0 0 16px rgba(139,92,246,0.3)",
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
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 901px) {
          .mobile-menu { display: none !important; }
          .mobile-only { display: none !important; }
        }
        @keyframes logoShine {
          0%, 100% { transform: translateX(-100%) rotate(45deg); }
          50% { transform: translateX(200%) rotate(45deg); }
        }
        nav { font-family: 'Inter', system-ui, sans-serif; }
        a:focus-visible, button:focus-visible {
          outline: 2px solid rgba(139,92,246,0.7);
          outline-offset: 2px;
        }
      `}</style>
    </nav>
  );
}
