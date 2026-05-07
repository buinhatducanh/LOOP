"use client";

/**
 * SiteHeader — LOOP Solutions (v2 — Redsigned)
 *
 * Redesigned for 2026:
 * - Minimal floating top bar with blur
 * - Pill-style nav with animated bottom border
 * - Expandable search icon → overlay
 * - Glassmorphism mega dropdown with staggered items
 * - Notification bell with shimmer ring
 * - Role-aware user menu with LP display
 * - ⌘K / Ctrl+K global search
 * - Mobile slide-in menu
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, LogOut, Zap,
  ChevronDown, Globe, Rocket,
  Search, ArrowRight, Phone, Mail, MapPin, Clock,
  MessageCircle, Bell, User, LayoutDashboard, Sparkles,
  Sun, Moon,
} from "lucide-react";
import { CEO_CONTACT } from "@/lib/constants";
import { DS, GRD } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/app/store/authStore";
import { routing } from "@/i18n/routing";
import { useMounted } from "@/app/hooks/useMounted";

// Lazy-load heavy overlays
const DynamicSearchOverlay = dynamic(() => import("@/components/SearchOverlay"), { ssr: false });
const DynamicNotificationPanel = dynamic(() => import("@/components/NotificationPanel"), { ssr: false });

// ── Helpers ────────────────────────────────────────────────────────────────────

function rgba(color: string, a: number): string {
  if (color.startsWith("var(")) {
    return `color-mix(in srgb, ${color}, transparent ${Math.round((1 - a) * 100)}%)`;
  }
  const h = color.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

// ── Locale Switcher ────────────────────────────────────────────────────────────

const LOCALE_LABELS: Record<string, { short: string; long: string; flag: string }> = {
  vi: { short: "VI", long: "Tiếng Việt", flag: "🇻🇳" },
  en: { short: "EN", long: "English", flag: "🇺🇸" },
  ja: { short: "JA", long: "日本語", flag: "🇯🇵" },
  ko: { short: "KO", long: "한국어", flag: "🇰🇷" },
  zh: { short: "ZH", long: "中文", flag: "🇨🇳" },
};

function LocaleSwitcher({ locale, theme }: { locale: string; theme: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function switchLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
    setOpen(false);
  }

  const current = LOCALE_LABELS[locale] ?? LOCALE_LABELS.vi;
  const isReallyOpen = mounted && open;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        suppressHydrationWarning
        onClick={() => setOpen(!open)}
        title="Change language"
        className="nav-icon-btn"
        data-active={isReallyOpen}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: isReallyOpen ? rgba(DS.pink, 0.12) : "transparent",
          border: `1px solid ${isReallyOpen ? rgba(DS.pink, 0.4) : "transparent"}`,
          borderRadius: 10, padding: "6px 10px",
          cursor: "pointer", color: DS.text3,
          fontSize: 11, fontFamily: DS.mono, fontWeight: 700,
          letterSpacing: "0.05em",
          transition: "all 0.2s",
        }}
      >
        <Globe size={13} style={{ color: DS.pink }} />
        <span style={{ fontSize: 10 }}>{current.short}</span>
        <ChevronDown size={9} style={{ transition: "transform 0.25s", transform: isReallyOpen ? "rotate(180deg)" : "none", opacity: 0.7 }} />
      </button>

      <AnimatePresence>
        {isReallyOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 168,
              background: rgba(DS.bgCosmic, 0.98),
              border: `1px solid ${rgba(DS.pink, 0.2)}`,
              borderRadius: 14,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: theme === "dark" ? `0 20px 60px rgba(0,0,0,0.7), 0 0 20px ${rgba(DS.pink, 0.08)}` : `0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px ${rgba(DS.pink, 0.1)}`,
              zIndex: 110, padding: "6px", overflow: "hidden",
            }}
          >
            <div style={{
              height: 2, borderRadius: "2px 2px 0 0",
              background: `linear-gradient(90deg, transparent, ${DS.pink}, ${DS.cosmicPurple}, transparent)`,
              marginBottom: 4,
            }} />
            {routing.locales.map(loc => {
              const info = LOCALE_LABELS[loc] ?? LOCALE_LABELS.vi;
              const active = loc === locale;
              return (
                <button
                  suppressHydrationWarning
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 12px",
                    borderRadius: 9, background: active ? rgba(DS.pink, 0.10) : "none",
                    border: active ? `1px solid ${rgba(DS.pink, 0.25)}` : "1px solid transparent",
                    cursor: "pointer",
                    color: active ? DS.text : DS.text4,
                    fontSize: 12, fontWeight: active ? 600 : 400, textAlign: "left",
                    transition: "all 0.15s", marginBottom: 1,
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = rgba(DS.text, 0.04); (e.currentTarget as HTMLButtonElement).style.color = DS.text; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = DS.text4; } }}
                >
                  <span style={{ fontSize: "0.9rem" }}>{info.flag}</span>
                  <span style={{ flex: 1 }}>{info.long}</span>
                  {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: DS.pink, boxShadow: `0 0 5px ${DS.pink}` }} />}
                  <span style={{ fontSize: "0.6rem", fontFamily: DS.mono, color: active ? DS.pink : DS.text5 }}>{info.short}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile Accordion Item ─────────────────────────────────────────────────────

function MobileNavItem({
  label, href, onClose, icon,
}: {
  label: string; href: string; onClose: () => void; icon?: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClose}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 16px", borderRadius: 10,
        color: DS.text2, fontSize: 15, textDecoration: "none",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rgba(DS.pink, 0.06); (e.currentTarget as HTMLElement).style.color = DS.text; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = DS.text2; }}
    >
      {icon && <span style={{ color: DS.text4 }}>{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}

// ── Mega Dropdown ─────────────────────────────────────────────────────────────

interface MegaItem { label: string; href: string; icon: string; description: string; color: string; }

function MegaDropdown({
  triggerLabel, items, isOpen, onToggle, onSelect, locale, t, theme,
}: {
  triggerLabel: string; items: MegaItem[];
  isOpen: boolean; onToggle: () => void; onSelect: () => void;
  locale: string; t: ReturnType<typeof useTranslations<"Navigation">>;
  theme: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isReallyOpen = mounted && isOpen;

  useEffect(() => {
    if (!isReallyOpen) return;
    const handler = () => onSelect();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isReallyOpen, onSelect]);

  return (
    <div style={{ position: "relative" }}>
      <button
        suppressHydrationWarning
        onClick={onToggle}
        onMouseEnter={onToggle}
        className="nav-pill-btn"
        data-active={isReallyOpen}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "7px 14px", borderRadius: 10,
          color: isReallyOpen ? DS.text : DS.text2,
          background: isReallyOpen ? rgba(DS.pink, 0.12) : "transparent",
          border: `1px solid ${isReallyOpen ? rgba(DS.pink, 0.35) : "transparent"}`,
          fontSize: 13, fontWeight: isReallyOpen ? 600 : 500,
          cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap",
        }}
      >
        <span>{triggerLabel}</span>
        <ChevronDown size={10} style={{ transition: "transform 0.2s", transform: isReallyOpen ? "rotate(180deg)" : "none" }} />
      </button>

      <AnimatePresence>
        {isReallyOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onMouseLeave={onSelect}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
              width: 680,
              background: rgba(DS.bgCosmic, 0.98),
              border: `1px solid ${rgba(DS.pink, 0.15)}`,
              borderRadius: 20,
              backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
              boxShadow: theme === "dark" ? `0 24px 80px rgba(0,0,0,0.8), 0 0 60px ${rgba(DS.pink, 0.06)}` : `0 20px 50px rgba(0,0,0,0.1), 0 0 0 1px ${rgba(DS.pink, 0.05)}`,
              overflow: "hidden", zIndex: 200,
            }}
          >
            {/* Cosmic gradient top */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, transparent, ${DS.cosmicPurple} 25%, ${DS.pink} 50%, ${DS.cosmicBlue} 75%, transparent)`,
            }} />

            <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                {triggerLabel}
              </span>
              <span style={{ color: DS.text5, fontSize: 11, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4, fontFamily: DS.mono,
              }}>
                {t("viewAll") || "Xem tất cả"}
              </span>
            </div>

            {/* 2-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "0 12px 12px" }}>
              {items.map((item, i) => (
                <Link key={item.label} href={item.href} onClick={onSelect} style={{ textDecoration: "none" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                      border: "1px solid transparent",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${item.color}0C`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${item.color}30`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                      background: `${item.color}15`, border: `1px solid ${item.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>{item.label}</div>
                      <div style={{
                        color: DS.text5, fontSize: 11, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {item.description}
                      </div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: `${item.color}10`, border: `1px solid ${item.color}20`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <ArrowRight size={10} style={{ color: item.color }} />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* CTA strip */}
            <div style={{ padding: "10px 20px 16px", borderTop: `1px solid ${rgba(DS.cosmicPurple, 0.1)}` }}>
              <Link href={`/${locale}/thiet-ke-website`} onClick={onSelect} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${rgba(DS.pink, 0.15)}, ${rgba(DS.cosmicPurple, 0.12)})`,
                  border: `1px solid ${rgba(DS.pink, 0.3)}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${rgba(DS.pink, 0.25)}, ${rgba(DS.cosmicPurple, 0.20)})`;
                    (e.currentTarget as HTMLElement).style.borderColor = rgba(DS.pink, 0.5);
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${rgba(DS.pink, 0.15)}, ${rgba(DS.cosmicPurple, 0.12)})`;
                    (e.currentTarget as HTMLElement).style.borderColor = rgba(DS.pink, 0.3);
                  }}
                >
                  <Rocket size={13} style={{ color: DS.pink }} />
                  <span style={{ color: DS.text, fontSize: 12, fontWeight: 600 }}>{t("getQuote")}</span>
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>—</span>
                  <span style={{ color: DS.text3, fontSize: 11 }}>{t("bookNow")}</span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Role labels ───────────────────────────────────────────────────────────────

function getRoleLabels(t: ReturnType<typeof useTranslations<"Navigation">>) {
  return {
    admin: { label: t("roleAdmin"), color: DS.cosmicPurple },
    project_manager: { label: t("roleManager"), color: DS.amber },
    hr: { label: "HR", color: DS.cyan },
    media: { label: "Media", color: DS.pink },
    qa: { label: "QA", color: "#7CB5A0" },
    member: { label: t("roleStaff"), color: DS.cyan },
    client: { label: t("roleClient"), color: DS.cosmicBlue },
    guest: { label: t("roleGuest") ?? "Khách", color: DS.text4 },
  };
}

// ── Main SiteHeader ───────────────────────────────────────────────────────────

export default function SiteHeader({ locale }: { locale: string }) {
  const pathname = usePathname();
  if (pathname.includes("/onboarding")) return null;

  const router = useRouter();
  const { user, isAuthenticated, logout, accountType } = useAuthStore();
  const t = useTranslations("Navigation");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const roleLabels = getRoleLabels(t);
  const mounted = useMounted();
  const [hasValidToken, setHasValidToken] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Token validity check
  useEffect(() => {
    if (!mounted) return;
    const tokenKey = accountType === "customer" ? "loop-customer-token" : "loop-staff-token";
    const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
    setHasValidToken(!!token);
  }, [mounted, accountType]);

  // Scroll detection — hide top bar after 60px, show header always
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setTopBarVisible(y < 80);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Mac detection
  useEffect(() => {
    setIsMac(/Mac/i.test(navigator.userAgent));
  }, []);

  // ⌘K / Ctrl+K search
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Theme logic
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = localStorage.getItem("loop-theme") as "dark" | "light";
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      // Default is dark (galaxy)
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("loop-theme", next);
  };

  // Outside click to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifPanelOpen(false);
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    if (userMenuOpen || notifPanelOpen || openDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen, notifPanelOpen, openDropdown]);

  // Fetch unread count once on mount (no polling)
  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    const { accountType: at, tokenExpiry } = useAuthStore.getState();
    if (!at || (tokenExpiry && Date.now() > tokenExpiry)) return;
    const tokenKey = at === "customer" ? "loop-customer-token" : "loop-staff-token";
    const token = localStorage.getItem(tokenKey);
    if (!token) return;
    fetch("/api/notifications/unread-count", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setNotifCount(data.data?.count || 0); })
      .catch(() => { /* silent */ });
  }, [mounted, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/dang-nhap`);
  };

  const isActive = (href: string) =>
    href === `/${locale}/` ? pathname === `/${locale}/` : pathname.startsWith(href);

  const navLinks: Array<(
    | { type: "mega"; labelKey: string; triggerLabel: string; items: MegaItem[] }
    | { label: string; href: string }
  )> = [
      {
        type: "mega",
        labelKey: "servicesDropdown",
        triggerLabel: t("servicesDropdown"),
        items: [
          { label: t("serviceWebsite"), href: `/${locale}/thiet-ke-website`, icon: "🌐", description: "Thiết kế & phát triển website chuyên nghiệp, tối ưu SEO, responsive trên mọi thiết bị.", color: DS.cosmicBlue },
          { label: t("serviceApp"), href: `/${locale}/dich-vu`, icon: "📱", description: "Xây dựng ứng dụng di động & phần mềm SaaS với trải nghiệm người dùng hiện đại.", color: DS.cosmicPurple },
          { label: t("serviceDashboard"), href: `/${locale}/dich-vu`, icon: "📊", description: "Hệ thống dashboard quản trị, phân tích dữ liệu trực quan, báo cáo thông minh.", color: DS.cyan },
          { label: t("serviceSeo"), href: `/${locale}/dich-vu`, icon: "🎯", description: "Tối ưu hóa công cụ tìm kiếm, Google & TikTok Ads, tăng trưởng bền vững.", color: DS.amber },
          { label: t("quayChupDropdown"), href: `/${locale}/media`, icon: "🎬", description: "Quay phim, chụp ảnh sản phẩm & quảng cáo thương mại chất lượng cao.", color: DS.rose },
        ],
      },
      { label: t("team"), href: `/${locale}/team` },
      { label: t("academy"), href: `/${locale}/academy` },
      { label: t("blog"), href: `/${locale}/blog` },
      { label: t("contact"), href: `/${locale}/contact` },
      { label: t("about"), href: `/${locale}/about` },
    ];

  // Scroll-aware styles
  const headerBg = scrolled ? rgba(DS.bg, 0.98) : rgba(DS.bg, 0.95);
  const headerBorder = scrolled ? rgba(DS.pink, 0.25) : rgba(DS.border, 0.15);
  const headerBlur = scrolled ? 28 : 20;
  const headerHeight = scrolled ? 56 : 64;
  const logoSize = scrolled ? 34 : 42;
  const topBarHeight = topBarVisible ? 34 : 0;
  const topBarOpacity = topBarVisible ? 1 : 0;

  return (
    <>
      {/* Animated cosmic top line */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 61, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${DS.cosmicPurple} 20%, ${DS.pink} 50%, ${DS.cosmicBlue} 80%, transparent 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Top contact bar — hides on scroll */}
      <div style={{
        position: "fixed", top: 2, left: 0, right: 0, zIndex: 51,
        background: rgba(DS.bg, 0.98),
        borderBottom: `1px solid ${rgba(DS.text, 0.05)}`,
        height: topBarHeight, overflow: "hidden",
        opacity: topBarOpacity,
        transition: "height 0.35s ease, opacity 0.35s ease",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem",
          height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1, overflow: "hidden" }}>
            {[
              { label: "HOTLINE", value: `+84 ${CEO_CONTACT.phone.replace(/^0/, "")}`, href: `tel:${CEO_CONTACT.phone}`, icon: <Phone size={10} /> },
              { label: "EMAIL", value: CEO_CONTACT.email, href: `mailto:${CEO_CONTACT.email}`, icon: <Mail size={10} /> },
              { label: "ĐỊA CHỈ", value: "Cái Răng, Cần Thơ", icon: <MapPin size={10} /> },
              { label: "T2–T6 · 09:00–18:00", icon: <Clock size={10} /> },
            ].map((item) => (
              item.href ? (
                <a key={item.label} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  textDecoration: "none", whiteSpace: "nowrap",
                  color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.04em",
                  transition: "color 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text5; }}
                >
                  <span style={{ color: DS.pink, opacity: 0.7 }}>{item.icon}</span>
                  <span style={{ color: DS.text5, fontWeight: 600 }}>{item.label}:</span>
                  <span style={{ color: DS.text4 }}>{item.value}</span>
                </a>
              ) : (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5, color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  <span style={{ color: DS.pink, opacity: 0.7 }}>{item.icon}</span>
                  <span style={{ color: DS.text5, fontWeight: 600 }}>{item.label}</span>
                </div>
              )
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <a href={`tel:${CEO_CONTACT.phone}`} title="Gọi ngay" style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 8,
              background: rgba(DS.pink, 0.10),
              border: `1px solid ${rgba(DS.pink, 0.25)}`,
              color: DS.pink, fontSize: 10, fontWeight: 700, textDecoration: "none",
              letterSpacing: "0.03em", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = rgba(DS.pink, 0.18); el.style.borderColor = rgba(DS.pink, 0.5); }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = rgba(DS.pink, 0.10); el.style.borderColor = rgba(DS.pink, 0.25); }}
            >
              <Phone size={10} /> Gọi ngay
            </a>
            <a href={CEO_CONTACT.zaloUrl} target="_blank" rel="noopener noreferrer" title="Zalo" style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 8,
              background: "rgba(0,104,255,0.10)",
              border: `1px solid rgba(0,104,255,0.25)`,
              color: "#4D9FFF", fontSize: 10, fontWeight: 700, textDecoration: "none",
              letterSpacing: "0.03em", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(0,104,255,0.18)"; el.style.borderColor = "rgba(0,104,255,0.5)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(0,104,255,0.10)"; el.style.borderColor = "rgba(0,104,255,0.25)"; }}
            >
              <MessageCircle size={10} /> Zalo
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        suppressHydrationWarning
        style={{
          position: "fixed",
          top: topBarHeight + 2,
          left: 0, right: 0, zIndex: 50,
          background: headerBg,
          backdropFilter: `blur(${headerBlur}px)`,
          WebkitBackdropFilter: `blur(${headerBlur}px)`,
          borderBottom: `1px solid ${headerBorder}`,
          boxShadow: scrolled ? `0 8px 40px rgba(0,0,0,0.6), 0 0 30px ${rgba(DS.pink, 0.05)}` : "none",
          overflow: "visible",
          transition: "all 0.35s ease",
        }}
      >
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem",
          height: headerHeight, display: "flex", alignItems: "center", gap: "1rem",
          transition: "height 0.35s ease",
        }}>
          {/* Logo */}
          <Link href={`/${locale}/`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              position: "relative", width: logoSize, height: logoSize,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${rgba(DS.cosmicBlue, 0.2)}, ${rgba(DS.cosmicPurple, 0.2)})`,
              border: `1px solid ${rgba(DS.pink, 0.3)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 20px ${rgba(DS.pink, 0.15)}, 0 0 40px ${rgba(DS.cosmicPurple, 0.08)}`,
              transition: "all 0.35s ease",
              flexShrink: 0,
            }}>
              <img src="/logo.png" alt="LOOP Solutions" style={{ width: logoSize - 8, height: logoSize - 8, objectFit: "contain", borderRadius: 6 }} />
            </div>
            <div>
              <div 
                className="gradient-text"
                style={{
                  fontFamily: DS.heading, fontSize: 13, fontWeight: 900,
                  letterSpacing: "0.06em", lineHeight: 1,
                  backgroundImage: GRD.primary,
                }}
              >
                LOOP
              </div>
              <div style={{ color: DS.text5, fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.18em", marginTop: 2 }}>
                SOLUTIONS
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav ref={navRef} className="hide-mobile"
            style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "0.75rem", flex: 1 }}>
            {navLinks.map((link) => {
              if ((link as { type?: string }).type === "mega") {
                const mega = link as { type: "mega"; labelKey: string; triggerLabel: string; items: MegaItem[] };
                return (
                  <MegaDropdown
                    key={mega.labelKey}
                    triggerLabel={mega.triggerLabel}
                    items={mega.items}
                    isOpen={openDropdown === mega.labelKey}
                    onToggle={() => setOpenDropdown(prev => prev === mega.labelKey ? null : mega.labelKey)}
                    onSelect={() => setOpenDropdown(null)}
                    locale={locale} t={t}
                    theme={theme}
                  />
                );
              }
              const simple = link as { label: string; href: string };
              const active = isActive(simple.href);
              return (
                <Link key={simple.href} href={simple.href}
                  className="nav-pill-link"
                  data-active={active}
                  style={{
                    padding: "6px 14px", borderRadius: 9,
                    color: active ? DS.text : DS.text2,
                    background: active ? rgba(DS.pink, 0.10) : "transparent",
                    border: `1px solid ${active ? rgba(DS.pink, 0.28) : "transparent"}`,
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    textDecoration: "none", transition: "all 0.18s", whiteSpace: "nowrap",
                    position: "relative",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = rgba(DS.pink, 0.05);
                      (e.currentTarget as HTMLElement).style.color = DS.text;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = DS.text2;
                    }
                  }}
                >
                  {simple.label}
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      style={{
                        position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                        width: 16, height: 2,
                        background: `linear-gradient(90deg, ${DS.pink}, ${DS.cosmicPurple})`,
                        borderRadius: 2,
                        boxShadow: `0 0 8px ${DS.pink}`,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: "auto" }}>

            {/* Search icon button */}
            <button
              suppressHydrationWarning
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
              className="nav-icon-btn"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36,
                background: rgba(DS.text, 0.03),
                border: `1px solid ${rgba(DS.text, 0.06)}`,
                borderRadius: 10, cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = rgba(DS.pink, 0.35);
                el.style.background = rgba(DS.pink, 0.06);
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = rgba(DS.text, 0.06);
                el.style.background = rgba(DS.text, 0.03);
              }}
            >
              <Search size={14} style={{ color: DS.text4 }} />
            </button>

            {/* Notification Bell */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                suppressHydrationWarning
                className="hide-mobile nav-icon-btn"
                title="Thông báo"
                onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36,
                  background: notifPanelOpen ? rgba(DS.pink, 0.12) : rgba(DS.text, 0.03),
                  border: `1px solid ${notifPanelOpen ? rgba(DS.pink, 0.4) : rgba(DS.text, 0.06)}`,
                  borderRadius: 10, cursor: "pointer",
                  color: notifPanelOpen ? DS.pink : DS.text4,
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = rgba(DS.pink, 0.35);
                  el.style.background = rgba(DS.pink, 0.06);
                  el.style.color = DS.pink;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  if (!notifPanelOpen) {
                    el.style.borderColor = rgba(DS.text, 0.06);
                    el.style.background = rgba(DS.text, 0.03);
                    el.style.color = DS.text4;
                  }
                }}
              >
                <Bell size={14} />
                {notifCount > 0 && (
                  <div style={{
                    position: "absolute", top: 4, right: 4,
                    width: 16, height: 16, borderRadius: "50%",
                    background: DS.pink,
                    border: "2px solid rgba(8,9,20,0.98)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, fontWeight: 700, color: "#fff",
                    boxShadow: `0 0 6px ${DS.pink}`,
                    animation: "pulse-ring 2s ease-in-out infinite",
                  }}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {notifPanelOpen && (
                  <DynamicNotificationPanel
                    locale={locale}
                    onClose={() => setNotifPanelOpen(false)}
                    initialCount={notifCount}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Locale Switcher */}
            <LocaleSwitcher locale={locale} theme={theme} />

            {/* Theme Toggle */}
            <button
              suppressHydrationWarning
              onClick={toggleTheme}
              title={theme === "dark" ? "Chế độ Trắng" : "Chế độ Galaxy"}
              className="nav-icon-btn"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36,
                background: rgba(DS.text, 0.03),
                border: `1px solid ${rgba(DS.text, 0.06)}`,
                borderRadius: 10, cursor: "pointer",
                transition: "all 0.18s",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = rgba(DS.pink, 0.35);
                el.style.background = rgba(DS.pink, 0.06);
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = rgba(DS.text, 0.06);
                el.style.background = rgba(DS.text, 0.03);
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ y: 10, opacity: 0, rotate: -45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -10, opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? (
                    <Sparkles size={14} style={{ color: DS.pink }} />
                  ) : (
                    <Sun size={14} style={{ color: "#E6C75F" }} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* User menu */}
            {mounted && hasValidToken && user ? (
              <div style={{ position: "relative" }} ref={userMenuRef}>
                <button
                  suppressHydrationWarning
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title={user.name}
                  className="nav-user-btn"
                  data-open={userMenuOpen}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "3px 10px 3px 3px",
                    background: userMenuOpen ? rgba(DS.pink, 0.10) : rgba(DS.text, 0.03),
                    border: `1px solid ${userMenuOpen ? rgba(DS.pink, 0.35) : rgba(DS.text, 0.06)}`,
                    borderRadius: 10, cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = rgba(DS.pink, 0.35);
                    el.style.background = rgba(DS.pink, 0.06);
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    if (!userMenuOpen) {
                      el.style.borderColor = rgba(DS.text, 0.06);
                      el.style.background = rgba(DS.text, 0.03);
                    }
                  }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover", border: `1px solid ${rgba(DS.pink, 0.3)}` }} />
                  ) : (
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: GRD.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{user.name.charAt(0)}</span>
                    </div>
                  )}
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: DS.text, lineHeight: 1.2, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                    <div style={{ fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.04em", color: DS.text5, lineHeight: 1.2, marginTop: 1 }}>
                      {(roleLabels[user.role] ?? { label: user.role }).label}
                    </div>
                  </div>
                  <ChevronDown size={10} style={{ color: DS.text5, flexShrink: 0, transition: "transform 0.2s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        width: 224,
                        background: rgba(DS.bgCosmic, 0.98),
                        border: `1px solid ${rgba(DS.pink, 0.18)}`,
                        borderRadius: 16,
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        boxShadow: theme === "dark" ? `0 20px 60px rgba(0,0,0,0.7), 0 0 20px ${rgba(DS.pink, 0.06)}` : `0 15px 40px rgba(0,0,0,0.08), 0 0 0 1px ${rgba(DS.pink, 0.05)}`,
                        overflow: "hidden", zIndex: 110,
                      }}
                    >
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${DS.border}` }}>
                        <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                        <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{user.email}</div>
                        {user.lpBalance > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, padding: "5px 10px", borderRadius: 8, background: rgba(DS.pink, 0.06), border: `1px solid ${rgba(DS.pink, 0.12)}` }}>
                            <Zap size={10} style={{ color: DS.pink }} />
                            <span style={{ color: DS.pink, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{user.lpBalance.toLocaleString("vi-VN")} LP</span>
                          </div>
                        )}
                      </div>

                      {user.role === "client" && (
                        <>
                          <MobileNavItem label="Trang khách hàng" href={`/${locale}/khach-hang`} onClose={() => setUserMenuOpen(false)} icon={<LayoutDashboard size={14} />} />
                          <MobileNavItem label="Ví LP của tôi" href={`/${locale}/khach-hang`} onClose={() => setUserMenuOpen(false)} icon={<Zap size={14} style={{ color: DS.cosmicPurple }} />} />
                        </>
                      )}

                      {hasValidToken && accountType === "staff" && (
                        <>
                          <MobileNavItem label="Quản trị" href="/admin/overview" onClose={() => setUserMenuOpen(false)} icon={<Sparkles size={14} style={{ color: DS.cosmicPurple }} />} />
                          <MobileNavItem label="Ví LP của tôi" href={`/${locale}/khach-hang`} onClose={() => setUserMenuOpen(false)} icon={<Zap size={14} style={{ color: DS.cosmicPurple }} />} />
                          <MobileNavItem label="Hồ sơ cá nhân" href={`/${locale}/`} onClose={() => setUserMenuOpen(false)} icon={<User size={14} />} />
                        </>
                      )}

                      <button onClick={handleLogout}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 16px",
                          background: "none", border: "none",
                          borderTop: `1px solid ${DS.border}`,
                          cursor: "pointer", color: DS.red, fontSize: 13,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                      >
                        <LogOut size={14} /> {t("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href={`/${locale}/dang-nhap`} className="hide-mobile nav-icon-btn" title={t("login")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36,
                  borderRadius: 10, border: `1px solid ${rgba(DS.text, 0.06)}`,
                  color: DS.text4, textDecoration: "none", transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = rgba(DS.pink, 0.35);
                  el.style.color = DS.text;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = rgba(DS.text, 0.06);
                  el.style.color = DS.text4;
                }}
              >
                <User size={14} />
              </Link>
            )}

            {/* CTA */}
            <Link href={`/${locale}/thiet-ke-website`} className="hide-mobile"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: GRD.primary, color: "#fff",
                fontSize: 12, fontWeight: 600,
                padding: "7px 16px", borderRadius: 10,
                textDecoration: "none",
                boxShadow: `0 0 24px ${rgba(DS.pink, 0.35)}`,
                transition: "opacity 0.15s, box-shadow 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = "0.9"; el.style.boxShadow = `0 0 36px ${rgba(DS.pink, 0.55)}`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.boxShadow = `0 0 24px ${rgba(DS.pink, 0.35)}`; }}
            >
              <Rocket size={12} />
              {t("bookNow")}
            </Link>

            {/* Mobile hamburger */}
            <button className="show-mobile"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36,
                background: rgba(DS.text, 0.03), border: `1px solid ${rgba(DS.text, 0.06)}`,
                borderRadius: 10, cursor: "pointer", color: DS.text,
                transition: "all 0.15s",
              }}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden", background: rgba(DS.bgCosmic, 0.98), borderTop: `1px solid ${rgba(DS.cosmicPurple, 0.12)}` }}
            >
              <nav style={{ padding: "12px 1.5rem 20px", display: "flex", flexDirection: "column", gap: 3 }}>
                {navLinks.map((link, idx) => {
                  if ((link as { type?: string }).type === "mega") {
                    const mega = link as { type: "mega"; labelKey: string; triggerLabel: string; items: MegaItem[] };
                    return (
                      <div key={`m-drop-${mega.labelKey ?? idx}`}>
                        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 16px 4px", marginTop: 4 }}>
                          {mega.triggerLabel}
                        </div>
                        {mega.items.map(item => (
                          <MobileNavItem key={item.href} label={item.label} href={item.href} onClose={() => setMobileOpen(false)} icon={<span style={{ fontSize: 14 }}>{item.icon}</span>} />
                        ))}
                      </div>
                    );
                  }
                  const simple = link as { label: string; href: string };
                  const active = isActive(simple.href);
                  return (
                    <Link key={`m-${simple.href}-${idx}`} href={simple.href} onClick={() => setMobileOpen(false)}
                      style={{
                        padding: "10px 16px", borderRadius: 10,
                        color: active ? DS.pink : DS.text2,
                        background: active ? rgba(DS.pink, 0.06) : "transparent",
                        border: active ? `1px solid ${rgba(DS.pink, 0.2)}` : "1px solid transparent",
                        fontSize: 15, fontWeight: active ? 600 : 400, textDecoration: "none",
                      }}
                    >
                      {simple.label}
                    </Link>
                  );
                })}

                {/* Mobile CTAs */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Link href={`/${locale}/dang-nhap`} onClick={() => setMobileOpen(false)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px", borderRadius: 10, border: `1px solid ${rgba(DS.text, 0.1)}`,
                      color: DS.text2, fontSize: 14, textDecoration: "none",
                    }}
                  >
                    <User size={14} /> {t("login")}
                  </Link>
                  <Link href={`/${locale}/thiet-ke-website`} onClick={() => setMobileOpen(false)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px", borderRadius: 10,
                      background: GRD.primary, color: "#fff",
                      fontSize: 14, fontWeight: 600, textDecoration: "none",
                    }}
                  >
                    <Rocket size={14} /> {t("bookNow")}
                  </Link>
                </div>
                <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                    borderRadius: 10, background: rgba(DS.text, 0.03),
                    border: `1px solid ${rgba(DS.text, 0.06)}`,
                    color: DS.text4, fontSize: 14, cursor: "pointer", marginTop: 4, width: "100%",
                  }}
                >
                  <Search size={14} /> <span style={{ flex: 1, textAlign: "left" }}>Tìm kiếm...</span>
                  <kbd style={{ fontSize: 9, fontFamily: DS.mono, color: DS.text5, background: rgba(DS.text, 0.04), borderRadius: 4, padding: "1px 6px" }}>{isMac ? "⌘" : "Ctrl"}K</kbd>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && <DynamicSearchOverlay locale={locale} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      {/* Global styles */}
      <style>{`
        @media (min-width: 768px) { .hide-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 6px ${DS.pink}; }
          50% { box-shadow: 0 0 12px ${DS.pink}, 0 0 4px ${DS.pink}; }
        }
      `}</style>
    </>

  );
}
