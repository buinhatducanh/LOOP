"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  Menu, X, ChevronDown, Package, Briefcase, Users, FileText,
  Settings, LayoutDashboard, LogOut, UserCircle, ArrowRight, Sparkles,
} from "lucide-react";
import { useAdminAuth } from "@/app/admin/components/admin-auth-provider";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { NavbarSearch } from "@/components/layout/NavbarSearch";
import { LogoInline } from "@/components/shared/InfinityLogo";

interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  icon: string | null;
  shortDescription: string | null;
  startingPrice: number | null;
}

interface NavbarProps {
  hideOnHome?: boolean;
}

export default function Navbar({ hideOnHome = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveringTop, setHoveringTop] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useAdminAuth();

  // Services dropdown data
  const [servicesData, setServicesData] = useState<{ grouped: Record<string, ServiceItem[]> }>({ grouped: {} });
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    setServicesLoading(true);
    fetch("/api/services")
      .then(r => r.json())
      .then(d => { setServicesData(d); setServicesLoading(false); })
      .catch(() => setServicesLoading(false));
  }, []);

  // Track mouse Y globally — trigger on top of viewport
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setHoveringTop(e.clientY < 80);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        if (openDropdown === "more" || openDropdown === "services") setOpenDropdown(null);
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
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Show navbar when: not at top OR hovering top zone OR scrolled
  const isVisible = hideOnHome && isHomePage ? !scrolled : true;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: (scrolled || hoveringTop)
          ? "rgba(9, 11, 20, 0.96)"
          : "rgba(9, 11, 20, 0.80)",
        backdropFilter: (scrolled || hoveringTop) ? "blur(20px)" : "blur(8px)",
        WebkitBackdropFilter: (scrolled || hoveringTop) ? "blur(20px)" : "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        opacity: isVisible ? 1 : 0.3,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 0.4s ease, background 0.3s ease, backdrop-filter 0.3s ease",
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
          <LogoInline size="md" />

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
            {/* Home */}
            <Link
              key="/" href="/"
              className={`navbar-nav-link${pathname === "/" ? " active" : ""}`}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                color: pathname === "/" ? "#FFFFFF" : "rgba(209,213,219,0.85)",
                background: pathname === "/" ? "rgba(139,92,246,0.18)" : "transparent",
                textDecoration: "none",
                transition: "all 0.2s",
                position: "relative",
                letterSpacing: "0.01em",
              }}
            >
              {t("home")}
              {pathname === "/" && (
                <span style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "18px",
                  height: "2px",
                  borderRadius: "1px",
                  background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                }} />
              )}
            </Link>

            {/* Services Dropdown — shows all DB services grouped by category */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === "services" ? null : "services")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  color: openDropdown === "services" || pathname.startsWith("/services") ? "#FFFFFF"
                    : "rgba(209,213,219,0.85)",
                  background: openDropdown === "services" ? "rgba(139,92,246,0.18)" : "transparent",
                  border: "none",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                {t("services")}
                <ChevronDown size={14}
                  style={{ transform: openDropdown === "services" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
                />
              </button>

              {/* Services Dropdown Panel */}
              {openDropdown === "services" && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    left: "-120px",
                    width: "680px",
                    background: "rgba(15,17,23,0.98)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px",
                    padding: "16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1)",
                    zIndex: 200,
                    backdropFilter: "blur(20px)",
                  }}
                  onClick={() => setOpenDropdown(null)}
                >
                  {servicesLoading ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "rgba(209,213,219,0.4)", fontSize: "13px" }}>
                      Đang tải...
                    </div>
                  ) : Object.keys(servicesData.grouped).length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "rgba(209,213,219,0.4)", fontSize: "13px" }}>
                      Chưa có dịch vụ nào.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {Object.entries(servicesData.grouped).map(([category, items]) => (
                        <div key={category}>
                          {/* Category header */}
                          <div style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                            color: "rgba(139,92,246,0.7)",
                            padding: "0 8px 6px",
                            marginBottom: "2px",
                          }}>
                            {category}
                          </div>
                          {items.map((service) => (
                            <Link
                              key={service.id}
                              href={`/services/${service.slug}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 10px",
                                borderRadius: "10px",
                                textDecoration: "none",
                                transition: "all 0.15s",
                                color: "rgba(209,213,219,0.85)",
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.1)";
                                (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "rgba(209,213,219,0.85)";
                              }}
                            >
                              {service.icon && (
                                <span style={{ fontSize: "16px", lineHeight: 1 }}>{service.icon}</span>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {service.title}
                                </div>
                                {service.shortDescription && (
                                  <div style={{ fontSize: "11px", color: "rgba(209,213,219,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {service.shortDescription}
                                  </div>
                                )}
                              </div>
                              {service.startingPrice != null && service.startingPrice > 0 && (
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#A78BFA", whiteSpace: "nowrap" }}>
                                  Từ {new Intl.NumberFormat("vi-VN").format(service.startingPrice)}₫
                                </span>
                              )}
                              <ArrowRight size={12} style={{ opacity: 0.3, flexShrink: 0 }} />
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Footer CTA */}
                  <div style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <Link
                      href="/services"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px",
                        borderRadius: "10px",
                        background: "rgba(139,92,246,0.12)",
                        color: "#A78BFA",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.22)";
                        (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.12)";
                        (e.currentTarget as HTMLElement).style.color = "#A78BFA";
                      }}
                    >
                      <Sparkles size={14} />
                      Xem tất cả dịch vụ & pricing
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Team List */}
            <Link
              key="/team-list" href="/team-list"
              className={`navbar-nav-link${pathname === "/team-list" ? " active" : ""}`}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                color: pathname === "/team-list" ? "#FFFFFF" : "rgba(209,213,219,0.85)",
                background: pathname === "/team-list" ? "rgba(139,92,246,0.18)" : "transparent",
                textDecoration: "none",
                transition: "all 0.2s",
                position: "relative",
                letterSpacing: "0.01em",
              }}
            >
              {t("teamList")}
              {pathname === "/team-list" && (
                <span style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "18px",
                  height: "2px",
                  borderRadius: "1px",
                  background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                }} />
              )}
            </Link>

            {/* More Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === "more" ? null : "more")}
                className="navbar-more-btn"
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
                  transition: "all 0.2s",
                  letterSpacing: "0.01em",
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
                        className="navbar-dropdown-item"
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
                    className="navbar-dropdown-contact"
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
              {user ? (
                /* User Menu Dropdown */
                <div ref={userDropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "user" ? null : "user")}
                    className="navbar-user-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px 6px 6px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      transition: "all 0.2s",
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
                            background: user.roleLevel <= 1
                              ? "rgba(139,92,246,0.2)"
                              : "rgba(59,130,246,0.2)",
                            color: user.roleLevel <= 1 ? "#A78BFA" : "#60A5FA",
                          }}
                        >
                          {user.roleLevel <= 1 ? "Administrator" : "Staff"}
                        </div>
                      </div>

                      {/* Admin Dashboard — only for non-customer roles */}
                      {user.roleLevel <= 1 && (
                        <a
                          href="/admin"
                          className="navbar-admin-link"
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
                        >
                          <LayoutDashboard size={15} style={{ opacity: 0.9 }} />
                          Admin Dashboard
                        </a>
                      )}

                      {/* Account Settings */}
                      <Link
                        href="/account"
                        className="navbar-account-link"
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
                      >
                        <UserCircle size={15} style={{ opacity: 0.8 }} />
                        Tài khoản
                      </Link>

                      {/* Sign Out */}
                      <button
                        onClick={logout}
                        className="navbar-logout-btn"
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
                          transition: "all 0.15s",
                          borderRadius: "10px",
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
                    className="navbar-login-btn"
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
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    className="navbar-register-btn"
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
            {user ? (
              <>
                {/* User info */}
                <div style={{ padding: "12px 16px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF" }}>{user.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(209,213,219,0.5)", marginTop: "2px" }}>{user.email}</div>
                </div>

                {/* Admin Dashboard — only for non-customer */}
                {user.roleLevel <= 1 && (
                  <a
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
                  </a>
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
                  onClick={logout}
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

        /* === Navbar Hover Effects === */

        /* Main nav links hover */
        .navbar-nav-link:hover {
          color: #FFFFFF !important;
          background: rgba(255,255,255,0.07) !important;
        }
        .navbar-nav-link.active:hover {
          background: rgba(139,92,246,0.18) !important;
        }

        /* More dropdown button hover */
        .navbar-more-btn:hover {
          color: #FFFFFF !important;
          background: rgba(255,255,255,0.07) !important;
        }

        /* Auth buttons hover */
        .navbar-login-btn:hover {
          border-color: rgba(255,255,255,0.25) !important;
          background: rgba(255,255,255,0.05) !important;
          color: #FFFFFF !important;
        }
        .navbar-register-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 24px rgba(139,92,246,0.45);
        }

        /* User avatar button hover */
        .navbar-user-btn:hover {
          border-color: rgba(255,255,255,0.25) !important;
          background: rgba(255,255,255,0.09) !important;
        }

        /* Dropdown item hover */
        .navbar-dropdown-item:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #FFFFFF !important;
        }

        /* Dropdown contact link */
        .navbar-dropdown-contact:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #FFFFFF !important;
        }

        /* Account settings in user dropdown */
        .navbar-account-link:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #FFFFFF !important;
        }

        /* Logout button hover */
        .navbar-logout-btn:hover {
          background: rgba(248,113,113,0.1) !important;
        }

        /* Admin dashboard link hover */
        .navbar-admin-link:hover {
          background: linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.25)) !important;
        }

        /* Ensure cursor is pointer on all interactive elements */
        .navbar-nav-link,
        .navbar-more-btn,
        .navbar-login-btn,
        .navbar-register-btn,
        .navbar-user-btn,
        .navbar-dropdown-item,
        .navbar-dropdown-contact,
        .navbar-account-link,
        .navbar-logout-btn,
        .navbar-admin-link {
          cursor: pointer;
        }
      `}</style>
    </nav>
  );
}
