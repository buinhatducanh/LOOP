"use client";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Phone, Mail, MapPin, Clock, MessageCircle, Search, Bell, Sun, Moon, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const navLinks = [
  { label: "Dịch vụ", href: "#services" },
  { label: "Dự án", href: "#projects" },
  { label: "Quy trình", href: "#process" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function LP2Navbar({ settings }: { settings: Record<string, string> }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const savedTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark";
    if (savedTheme) setTheme(savedTheme);

    const handler = () => setScrolled(window.scrollY > window.innerHeight - 80);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  if (!mounted) return null;

  const isDarkOverlay = !scrolled;
  const primaryTextColor = isDarkOverlay ? "rgba(255, 255, 255, 0.95)" : "var(--lp2-text-primary)";
  const secondaryTextColor = isDarkOverlay ? "rgba(255, 255, 255, 0.7)" : "var(--lp2-text-secondary)";
  const hoverTextColor = isDarkOverlay ? "#ffffff" : "var(--lp2-text-primary)";
  const lightTextColor = isDarkOverlay ? "rgba(255, 255, 255, 0.5)" : "var(--lp2-text-light)";

  const iconBtnStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: primaryTextColor,
    padding: "var(--lp2-sp-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform var(--lp2-t-fast), opacity var(--lp2-t-fast), color var(--lp2-t-fast)",
    borderRadius: "var(--lp2-r-md)",
  };

  return (
    <>
      {/* Top Bar - Integrated to avoid hydration mismatch */}
      <div style={{ 
        backgroundColor: "#050505", 
        borderTop: "2px solid transparent",
        borderImage: "linear-gradient(90deg, #6366f1, #d946ef, #f43f5e) 1",
        borderBottom: "1px solid rgba(255,255,255,0.08)", 
        padding: "0.5rem 0",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 101,
        height: "var(--lp2-topbar-h, 40px)",
        display: "flex",
        alignItems: "center"
      }} className="lp2-hide-md">
        <div className="lp2-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
              <Phone size={12} color="var(--lp2-accent-blue)" />
              <span>Hotline: <span style={{ color: "white" }}>{settings.contact_hotline}</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
              <Mail size={12} color="var(--lp2-accent-blue)" />
              <span>Email: <span style={{ color: "white" }}>{settings.contact_email}</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
              <MapPin size={12} color="var(--lp2-accent-blue)" />
              <span>Địa chỉ: <span style={{ color: "white" }}>{settings.contact_address}</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
              <Clock size={12} color="var(--lp2-accent-blue)" />
              <span>{settings.contact_hours}</span>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <a href={`tel:${settings.contact_hotline.replace(/\s+/g, '')}`} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", fontWeight: "700", color: "white", backgroundColor: "rgba(255,255,255,0.05)", padding: "0.25rem 0.75rem", borderRadius: "var(--lp2-r-full)", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none" }}>
              <Phone size={10} fill="currentColor" />
              <span>Gọi ngay</span>
            </a>
            <a href={settings.contact_zalo} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", fontWeight: "700", color: "white", backgroundColor: "#0068FF", padding: "0.25rem 0.75rem", borderRadius: "var(--lp2-r-full)", textDecoration: "none" }}>
              <MessageCircle size={10} fill="currentColor" />
              <span>Zalo</span>
            </a>
          </div>
        </div>
      </div>


      <nav style={{ 
        position: "fixed", 
        top: "var(--lp2-nav-top, 0)", 
        left: 0, 
        right: 0, 
        zIndex: 100, 
        height: "var(--lp2-navbar-h)", 
        backgroundColor: scrolled ? "rgba(var(--lp2-bg-primary-rgb, 255,255,255), 0.95)" : "transparent", 
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none", 
        borderBottom: scrolled ? "1px solid var(--lp2-border-light)" : "1px solid transparent", 
        transition: "all var(--lp2-t-slow)",
        textShadow: "none"
      }}>
        <div className="lp2-container" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#hero" style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-2)", textDecoration: "none" }}>
            <span style={{ fontSize: "var(--lp2-fs-xl)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", color: primaryTextColor, fontFamily: "var(--lp2-font-display)", transition: "color var(--lp2-t-fast)" }}>LOOPS</span>
            <span style={{ fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", color: lightTextColor, letterSpacing: "var(--lp2-ls-wide)", fontFamily: "var(--lp2-font-sans)", paddingBottom: "1px", transition: "color var(--lp2-t-fast)" }}>STUDIO</span>
          </a>

          <div className="lp2-nav-desktop" style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-8)" }}>
            {navLinks.map((link) => (
              <a 
                key={link.label} 
                href={link.href} 
                style={{ 
                  fontSize: "var(--lp2-fs-sm)", 
                  fontWeight: "var(--lp2-fw-medium)", 
                  color: secondaryTextColor, 
                  transition: "color var(--lp2-t-fast)", 
                  textDecoration: "none", 
                  fontFamily: "var(--lp2-font-sans)", 
                  letterSpacing: "var(--lp2-ls-snug)" 
                }} 
                onMouseEnter={(e) => (e.currentTarget.style.color = hoverTextColor)} 
                onMouseLeave={(e) => (e.currentTarget.style.color = secondaryTextColor)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-2)" }}>
            {/* Desktop Quick Actions */}
            <div className="lp2-nav-desktop" style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-1)", marginRight: "var(--lp2-sp-2)" }}>
              <button style={iconBtnStyle} aria-label="Search">
                <Search size={18} />
              </button>
              <button style={iconBtnStyle} aria-label="Notifications">
                <Bell size={18} />
              </button>
              <button style={iconBtnStyle} onClick={toggleTheme} aria-label="Toggle Theme">
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button style={{ ...iconBtnStyle, gap: "0.5rem", padding: "var(--lp2-sp-2) var(--lp2-sp-3)" }} aria-label="Login">
                <User size={18} />
                <span style={{ fontSize: "var(--lp2-fs-sm)", fontWeight: "var(--lp2-fw-semibold)" }}>Đăng nhập</span>
              </button>
            </div>

            <div className="lp2-nav-desktop" style={{ display: "flex", alignItems: "center" }}>
              <a href="#contact" className="lp2-btn-primary" style={{ fontSize: "var(--lp2-fs-sm)", padding: "0.625rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <span>Tư vấn miễn phí</span>
                <ArrowRight size={14} />
              </a>
            </div>

            <button className="lp2-nav-toggle" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: primaryTextColor, padding: "var(--lp2-sp-1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "color var(--lp2-t-fast)" }}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ position: "absolute", top: "var(--lp2-navbar-h)", left: 0, right: 0, backgroundColor: "var(--lp2-bg-primary)", backdropFilter: "blur(24px)", borderBottom: "1px solid var(--lp2-border-light)", padding: "var(--lp2-sp-6) var(--lp2-sp-8)", display: "flex", flexDirection: "column", gap: "var(--lp2-sp-5)" }}>
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} style={{ fontSize: "var(--lp2-fs-md)", fontWeight: "var(--lp2-fw-medium)", color: "var(--lp2-text-primary)", textDecoration: "none", fontFamily: "var(--lp2-font-sans)" }}>{link.label}</a>
              ))}
              
              <div style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-4)", padding: "var(--lp2-sp-2) 0", borderTop: "1px solid var(--lp2-border-light)", borderBottom: "1px solid var(--lp2-border-light)" }}>
                <button style={iconBtnStyle} onClick={toggleTheme}>
                  {theme === "light" ? <><Moon size={20} style={{ marginRight: "0.75rem" }} /> Chế độ tối</> : <><Sun size={20} style={{ marginRight: "0.75rem" }} /> Chế độ sáng</>}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--lp2-sp-3)" }}>
                <button style={{ ...lp2BtnOutlineStyle, justifyContent: "center" }}>
                  <User size={18} /> Đăng nhập
                </button>
                <a href="#contact" className="lp2-btn-primary" style={{ justifyContent: "center" }} onClick={() => setMobileOpen(false)}>
                  Tư vấn miễn phí <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}

const lp2BtnOutlineStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.75rem 1.75rem",
  background: "transparent",
  color: "var(--lp2-text-primary)",
  border: "1.5px solid var(--lp2-border-medium)",
  borderRadius: "var(--lp2-r-full)",
  fontSize: "var(--lp2-fs-sm)",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all var(--lp2-t-base)",
  textDecoration: "none",
  fontFamily: "var(--lp2-font-sans)",
  whiteSpace: "nowrap" as const,
};
