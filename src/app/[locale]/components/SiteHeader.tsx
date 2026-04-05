"use client";

/**
 * SiteHeader — LOOP Solutions (BE Production)
 * Figma dark theme navigation header.
 *
 * Features:
 *  - Dark glassmorphism nav with blur
 *  - Animated logo glow
 *  - Gradient top accent line
 *  - Inline search bar (⌘K / Ctrl+K) → AdvancedSearch overlay
 *  - 5-language LocaleSwitcher dropdown
 *  - Role-aware user menu
 *  - Mobile hamburger menu with accordion
 *  - Active route highlighting
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, LogIn, LogOut, Zap,
  ChevronDown, Globe, Rocket, Check,
  Search, ArrowRight, Volume2, VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";
import { useAudioStore } from "@/app/store/audioStore";
import { routing } from "@/i18n/routing";
import { useMounted } from "@/app/hooks/useMounted";

const rgba = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Search overlay ─────────────────────────────────────────────────────────────

const SEARCH_SUGGESTIONS = [
  { label: "Thiết kế Website", href: "/services", color: "#3B82F6" },
  { label: "Phát triển App", href: "/services", color: "#818CF8" },
  { label: "SEO & Marketing", href: "/services", color: "#22C55E" },
  { label: "Dashboard Analytics", href: "/services", color: "#14B8A6" },
  { label: "Khóa học Digital Marketing", href: "/academy", color: "#818CF8" },
  { label: "Portfolio dự án", href: "/portfolio", color: "#F59E0B" },
  { label: "Đội ngũ LOOP", href: "/team", color: "#14B8A6" },
];

const SEARCH_PILLS = [
  { label: "Thiết kế web", color: "#3B82F6" },
  { label: "Nhận tư vấn", color: "#22C55E" },
  { label: "Khóa học", color: "#818CF8" },
  { label: "Web nhà hàng", color: "#F59E0B" },
  { label: "SEO Google", color: "#22C55E" },
  { label: "Web khách sạn", color: "#60A5FA" },
  { label: "Dashboard", color: "#06B6D4" },
  { label: "Portfolio", color: "#818CF8" },
];

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function SearchOverlay({ locale, onClose }: { locale: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const results = query.trim().length > 0
    ? SEARCH_SUGGESTIONS.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(2,6,23,0.96)", backdropFilter: "blur(16px)",
        display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80,
      }}
    >
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        style={{ width: "100%", maxWidth: 640, padding: "0 1rem" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.875rem 1.25rem", borderRadius: 16,
            background: DS.bgCard,
            border: "1px solid rgba(59,130,246,0.4)",
            boxShadow: "0 0 40px rgba(59,130,246,0.15), 0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          <Search size={20} style={{ color: DS.blue, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm dịch vụ, khóa học..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: DS.text, fontSize: 16, caretColor: DS.blue,
            }}
          />
          {query ? (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5, display: "flex" }}>
              <X size={18} />
            </button>
          ) : (
            <div style={{ padding: "2px 8px", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 6 }}>
              <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>ESC</span>
            </div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                marginTop: 8, borderRadius: 16, overflow: "hidden",
                background: DS.bgCard, border: `1px solid ${DS.border}`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/${locale}${r.href}`}
                  onClick={onClose}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.75rem 1.25rem",
                      borderBottom: i < results.length - 1 ? `1px solid ${DS.border}` : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(59,130,246,0.06)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${r.color}15`, border: `1px solid ${r.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: r.color, fontSize: 14,
                    }}>
                      <Search size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                    </div>
                    <ArrowRight size={13} style={{ color: DS.text5 }} />
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pills (no query) */}
        {!query && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginTop: 20 }}>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 14, textAlign: "center" }}>
              ── GỢI Ý TÌM KIẾM
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
              {SEARCH_PILLS.map((pill, i) => (
                <button
                  key={pill.label}
                  onClick={() => setQuery(pill.label)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 9999,
                    backgroundColor: hexRgba(pill.color, 0.063),
                    border: `1px solid ${hexRgba(pill.color, 0.145)}`,
                    color: pill.color, fontSize: 12, fontFamily: DS.mono,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "2rem 0" }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ color: DS.text3, fontSize: 14 }}>Không tìm thấy kết quả cho &quot;{query}&quot;</div>
            <Link href={`/${locale}/contact`} onClick={onClose} style={{ color: DS.blue, fontSize: 13, textDecoration: "none" }}>
              Liên hệ để được tư vấn →
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Locale Switcher ────────────────────────────────────────────────────────────

const LOCALE_LABELS: Record<string, { short: string; long: string; flag: string }> = {
  vi: { short: "VI", long: "Tiếng Việt", flag: "🇻🇳" },
  en: { short: "EN", long: "English", flag: "🇺🇸" },
  ja: { short: "JA", long: "日本語", flag: "🇯🇵" },
  ko: { short: "KO", long: "한국어", flag: "🇰🇷" },
  zh: { short: "ZH", long: "中文", flag: "🇨🇳" },
};

function LocaleSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: rgba(DS.text, 0.03),
          border: `1px solid ${rgba(DS.text, 0.08)}`,
          borderRadius: 10, padding: "5px 10px",
          cursor: "pointer", color: DS.text3,
          fontSize: 12, fontFamily: DS.mono, fontWeight: 600,
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.blue, 0.3);
          (e.currentTarget as HTMLButtonElement).style.color = DS.text;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.text, 0.08);
          (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
        }}
      >
        <Globe size={13} style={{ color: DS.blue }} />
        <span>{current.short}</span>
        <ChevronDown size={10} style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "100%", right: 0, marginTop: 6,
              minWidth: 160, background: rgba(DS.bgCard, 0.98),
              border: `1px solid ${rgba(DS.blue, 0.15)}`, borderRadius: 12,
              backdropFilter: "blur(20px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.55)", overflow: "hidden", zIndex: 100,
            }}
          >
            {routing.locales.map(loc => {
              const info = LOCALE_LABELS[loc] ?? LOCALE_LABELS.vi;
              const active = loc === locale;
              return (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 12px",
                    borderRadius: 8, background: active ? "rgba(59,130,246,0.1)" : "none",
                    border: "none", cursor: "pointer",
                    color: active ? DS.blue : DS.text3,
                    fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left",
                    transition: "background 0.1s, color 0.1s",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLButtonElement).style.color = DS.text;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                      (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
                    }
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{info.flag}</span>
                  <span style={{ flex: 1 }}>{info.long}</span>
                  {active && <Check size={12} style={{ color: DS.blue }} />}
                  <span style={{ fontSize: "0.625rem", fontFamily: DS.mono, color: active ? DS.blue : DS.text4, opacity: active ? 1 : 0.6 }}>
                    {info.short}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Audio toggle ───────────────────────────────────────────────────────────────

function AudioToggle() {
  const { muted, toggleMuted } = useAudioStore();
  return (
    <button
      onClick={toggleMuted}
      title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        background: muted ? rgba(DS.text, 0.04) : rgba(DS.purple, 0.1),
        border: `1px solid ${muted ? rgba(DS.text, 0.08) : rgba(DS.purple, 0.25)}`,
        color: muted ? DS.text5 : DS.purple,
        cursor: "pointer",
        transition: "all 0.15s ease",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = muted
          ? rgba(DS.text, 0.07)
          : rgba(DS.purple, 0.16);
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = muted
          ? rgba(DS.text, 0.04)
          : rgba(DS.purple, 0.1);
      }}
    >
      {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
    </button>
  );
}

// ── Mobile Audio toggle ─────────────────────────────────────────────────────────

function MobileAudioToggle({ onClose }: { onClose?: () => void }) {
  const { muted, toggleMuted } = useAudioStore();
  return (
    <button
      onClick={() => { toggleMuted(); onClose?.(); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 8,
        background: muted ? rgba(DS.text, 0.03) : rgba(DS.purple, 0.08),
        border: `1px solid ${muted ? rgba(DS.text, 0.06) : rgba(DS.purple, 0.2)}`,
        color: muted ? DS.text4 : DS.purple,
        fontSize: 14,
        cursor: "pointer",
        marginTop: 4,
        width: "100%",
      }}
    >
      {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      <span style={{ flex: 1, textAlign: "left" }}>
        {muted ? "Bật âm thanh" : "Tắt âm thanh"}
      </span>
    </button>
  );
}

// ── Nav Dropdown ──────────────────────────────────────────────────────────────

interface NavDropdownItem { label: string; href: string; icon: string }
interface NavDropdownGroup { type: "dropdown"; labelKey: string; triggerLabel: string; items: NavDropdownItem[] }
type NavItem = ({ type?: never; label: string; href: string } | NavDropdownGroup);

function NavDropdown({
  labelKey,
  trigger,
  items,
  isOpen,
  onToggle,
  onSelect,
}: {
  labelKey: string;
  trigger: React.ReactNode;
  items: NavDropdownItem[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  // Always render closed on server — only animate open on client to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isReallyOpen = mounted && isOpen;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        onMouseEnter={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "5px 10px", borderRadius: 7,
          color: isReallyOpen ? DS.text : DS.text3,
          background: isReallyOpen ? rgba(DS.blue, 0.1) : "transparent",
          border: isReallyOpen ? `1px solid ${rgba(DS.blue, 0.2)}` : "1px solid transparent",
          fontSize: 13, fontWeight: isReallyOpen ? 600 : 400,
          cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
        }}
      >
        {trigger}
        <ChevronDown size={10} style={{ transition: "transform 0.15s", transform: isReallyOpen ? "rotate(180deg)" : "none" }} />
      </button>

      <AnimatePresence>
        {isReallyOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onMouseLeave={onToggle}
            style={{
              position: "absolute", top: "100%", left: 0, marginTop: 6,
              minWidth: 220,
              background: "rgba(2,6,23,0.96)",
              border: `1px solid ${rgba(DS.blue, 0.15)}`,
              borderRadius: 14,
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              overflow: "hidden", zIndex: 100, padding: "6px",
            }}
          >
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={onSelect} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                  <span style={{ color: DS.text2, fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Role labels ───────────────────────────────────────────────────────────────

function getRoleLabels(t: ReturnType<typeof useTranslations<"Navigation">>) {
  return {
    admin: { label: t("roleAdmin"), color: "#818CF8" },
    project_manager: { label: t("roleManager"), color: "#F59E0B" },
    media: { label: "Media", color: "#14B8A6" },
    qa: { label: "QA", color: "#14B8A6" },
    member: { label: t("roleStaff"), color: "#14B8A6" },
    client: { label: t("roleClient"), color: DS.blue },
    guest: { label: t("roleGuest") ?? "Khách", color: DS.text4 },
  };
}

// ── Main SiteHeader ────────────────────────────────────────────────────────────

export default function SiteHeader({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const t = useTranslations("Navigation");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Single source of truth for dropdown open state (null = all closed)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const roleLabels = getRoleLabels(t);
  const mounted = useMounted();

  // Sync audio muted state from localStorage after mount to avoid hydration mismatch
  const { setMuted, muted } = useAudioStore();
  useEffect(() => {
    if (mounted) {
      const stored = localStorage.getItem("loop-audio-muted") === "true";
      if (stored !== muted) setMuted(stored);
    }
  }, [mounted]);

  const navLinks: NavItem[] = [
    { label: t("home"), href: `/${locale}/` },

    // Dịch vụ dropdown
    {
      type: "dropdown",
      labelKey: "servicesDropdown",
      triggerLabel: t("servicesDropdown"),
      items: [
        { label: t("serviceWebsite"),    href: `/${locale}/services?cat=web`,       icon: "🌐" },
        { label: t("serviceApp"),        href: `/${locale}/services?cat=app`,        icon: "📱" },
        { label: t("serviceDashboard"), href: `/${locale}/services?cat=dashboard`, icon: "📊" },
        { label: t("serviceSeo"),       href: `/${locale}/services?cat=seo`,         icon: "🎯" },
      ],
    },

    // Marketing dropdown
    {
      type: "dropdown",
      labelKey: "marketingDropdown",
      triggerLabel: t("marketingDropdown"),
      items: [
        { label: t("mediaLabel"), href: `/${locale}/media`, icon: "🎬" },
      ],
    },

    // Gói Web dropdown
    {
      type: "dropdown",
      labelKey: "webDropdown",
      triggerLabel: t("webDropdown"),
      items: [
        { label: t("webCustomDesign"), href: `/${locale}/services?tab=tabCustom`,  icon: "✏️" },
        { label: t("customServices"),  href: `/${locale}/services?tab=tabWebPackage`, icon: "🛠️" },
        { label: t("pricing"),         href: `/${locale}/services?tab=tabPricing`,  icon: "💰" },
        { label: t("webCompleted"),   href: `/${locale}/du-an`,              icon: "✅" },
      ],
    },

    // Standalone
    { label: t("team"),    href: `/${locale}/team` },
    { label: t("academy"), href: `/${locale}/academy` },
    { label: t("blog"),   href: `/${locale}/blog` },
    { label: t("contact"), href: `/${locale}/contact` },
  ];

  const isActive = (href: string) =>
    href === `/${locale}/` ? pathname === `/${locale}/` : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/dang-nhap`);
  };

  // ⌘K / Ctrl+K shortcut
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

  // Close nav dropdowns and user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (userMenuOpen || openDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen, openDropdown]);

  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

  return (
    <>
      {/* Gradient top line */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, height: 2,
        background: "linear-gradient(90deg, transparent, #3B82F6 30%, #818CF8 70%, transparent)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header
        style={{
          position: "fixed", top: 2, left: 0, right: 0, zIndex: 50,
          background: "rgba(2,6,23,0.92)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${rgba(DS.border, 0.6)}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem",
            height: 60, display: "flex", alignItems: "center", gap: "1rem",
          }}
        >
          {/* Logo */}
          <Link href={`/${locale}/`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", flexShrink: 0 }}>
            <img
              src="/logo.png"
              alt="LOOP Solutions"
              style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8 }}
            />
            <div>
              <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 14, fontWeight: 900, letterSpacing: "0.06em", lineHeight: 1 }}>
                LOOP
              </div>
              <div style={{ color: DS.text4, fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em", marginTop: 2 }}>
                SOLUTIONS
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav ref={navRef} className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "1.5rem", flex: 1 }}>
            {navLinks.map(link => {
              if (link.type === "dropdown") {
                // Always render NavDropdown to avoid SSR/hydration mismatch
                return (
                  <NavDropdown
                    key={link.labelKey}
                    labelKey={link.labelKey}
                    trigger={<span>{link.triggerLabel}</span>}
                    items={link.items}
                    isOpen={openDropdown === link.labelKey}
                    onToggle={() => setOpenDropdown(prev => prev === link.labelKey ? null : link.labelKey)}
                    onSelect={() => setOpenDropdown(null)}
                  />
                );
              }
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "5px 10px", borderRadius: 7,
                    color: active ? DS.text : DS.text3,
                    background: active ? rgba(DS.blue, 0.1) : "transparent",
                    border: active ? `1px solid ${rgba(DS.blue, 0.2)}` : "1px solid transparent",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    textDecoration: "none", transition: "all 0.15s", whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = rgba(DS.border, 0.3);
                      (e.currentTarget as HTMLElement).style.color = DS.text2;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = DS.text3;
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hide-mobile"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: rgba(DS.text, 0.03), border: `1px solid ${rgba(DS.text, 0.07)}`,
                borderRadius: 10, padding: "5px 10px", color: DS.text5,
                cursor: "pointer", transition: "border-color 0.2s", minWidth: 160,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.blue, 0.3);
                (e.currentTarget as HTMLButtonElement).style.background = rgba(DS.blue, 0.04);
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.text, 0.07);
                (e.currentTarget as HTMLButtonElement).style.background = rgba(DS.text, 0.03);
              }}
            >
              <Search size={13} style={{ color: DS.text5 }} />
              <span style={{ fontSize: 12, color: DS.text5, flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>Tìm kiếm...</span>
              <kbd style={{
                fontSize: 9, color: DS.text5, background: rgba(DS.text, 0.04),
                border: `1px solid ${rgba(DS.text, 0.08)}`, borderRadius: 4,
                padding: "1px 5px", fontFamily: DS.mono,
              }}>
                {isMac ? "⌘" : "Ctrl+"}K
              </kbd>
            </button>

            {/* Locale Switcher */}
            <LocaleSwitcher locale={locale} />

            {/* Audio toggle */}
            <AudioToggle />

            {/* User menu — guarded by mounted to prevent hydration mismatch */}
            {mounted && isAuthenticated && user ? (
              <div style={{ position: "relative" }} ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: rgba(DS.text, 0.03), border: `1px solid ${rgba(DS.text, 0.08)}`,
                    borderRadius: 10, padding: "4px 10px 4px 4px", cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    const rl = roleLabels[user.role] ?? { color: DS.text4 };
                    (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(rl.color, 0.3);
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.text, 0.08);
                  }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover", border: `1.5px solid ${rgba(DS.purple, 0.5)}` }}
                  />
                  <div className="hide-mobile" style={{ textAlign: "left", lineHeight: 1.2 }}>
                    <div style={{ color: DS.text, fontSize: 11, fontWeight: 600 }}>{user.shortName}</div>
                    <div style={{ color: (roleLabels[user.role] ?? { color: DS.text4 }).color, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.08em" }}>
                      {(roleLabels[user.role] ?? { label: user.role }).label}
                    </div>
                  </div>
                  <ChevronDown size={11} style={{ color: DS.text5, transition: "transform 0.15s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      style={{
                        position: "absolute", top: "100%", right: 0, marginTop: 8,
                        width: 240, background: rgba(DS.bgCard, 0.98),
                        border: `1px solid ${rgba(DS.blue, 0.12)}`, borderRadius: 12,
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.55)", overflow: "hidden", zIndex: 100,
                      }}
                    >
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.border}` }}>
                        <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                        <div style={{ color: DS.text4, fontSize: 11 }}>{user.email}</div>
                        {user.lpBalance > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, padding: "4px 8px", borderRadius: 8, background: rgba(DS.purple, 0.06), border: `1px solid ${rgba(DS.purple, 0.12)}` }}>
                            <Zap size={10} style={{ color: DS.purple }} />
                            <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{user.lpBalance.toLocaleString("vi-VN")} LP</span>
                          </div>
                        )}
                      </div>
                      {[
                        ...(user.role === "client"
                          ? [{ href: `/${locale}/khach-hang`, label: t("customer"), icon: "🏠" }]
                          : [{ href: "/admin/overview", label: t("dashboardAdmin"), icon: "⚙️" }]),
                        { href: `/${locale}/khach-hang`, label: t("myLpWallet"), icon: "💎" },
                      ].map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                            color: DS.text3, fontSize: 13, textDecoration: "none", transition: "background 0.1s",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = rgba(DS.blue, 0.06);
                            (e.currentTarget as HTMLElement).style.color = DS.text;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "none";
                            (e.currentTarget as HTMLElement).style.color = DS.text3;
                          }}
                        >
                          <span>{item.icon}</span> {item.label}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 16px", background: "none", border: "none",
                          borderTop: `1px solid ${DS.border}`, cursor: "pointer",
                          color: DS.red, fontSize: 13,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = rgba(DS.red, 0.06); }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                      >
                        <LogOut size={14} /> {t("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href={`/${locale}/dang-nhap`}
                className="hide-mobile"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  color: DS.text4, fontSize: 12, padding: "5px 12px",
                  borderRadius: 8, border: `1px solid ${rgba(DS.text, 0.08)}`,
                  textDecoration: "none", transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = DS.text;
                  (e.currentTarget as HTMLElement).style.borderColor = rgba(DS.text, 0.18);
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = DS.text4;
                  (e.currentTarget as HTMLElement).style.borderColor = rgba(DS.text, 0.08);
                }}
              >
                <LogIn size={14} />
                <span>{t("login")}</span>
              </Link>
            )}

            {/* CTA */}
            <Link
              href={`/${locale}/booking`}
              className="hide-mobile"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: GRD.primary, color: "#fff",
                fontSize: 13, fontWeight: 600,
                padding: "7px 16px", borderRadius: 8,
                textDecoration: "none", boxShadow: `0 0 20px ${rgba(DS.blue, 0.3)}`,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <Rocket size={14} />
              {t("bookNow")}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="show-mobile"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: rgba(DS.text, 0.04), border: `1px solid ${rgba(DS.text, 0.08)}`,
                borderRadius: 10, padding: "5px", cursor: "pointer", color: DS.text,
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
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
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden", background: "rgba(2,6,23,0.98)", borderTop: `1px solid ${DS.border}` }}
            >
              <nav style={{ padding: "12px 1.5rem 20px", display: "flex", flexDirection: "column", gap: 4 }}>
                {navLinks.map((link, idx) => {
                  if (link.type === "dropdown") {
                    const [subOpen, setSubOpen] = useState(false);
                    return (
                      <div key={`m-drop-${link.labelKey}-${idx}`}>
                        <button
                          onClick={() => setSubOpen(v => !v)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            width: "100%", padding: "10px 14px", borderRadius: 8,
                            color: DS.text3, background: "none", border: "none",
                            cursor: "pointer", fontSize: 15,
                          }}
                        >
                          <span>{link.triggerLabel}</span>
                          <ChevronDown size={14} style={{ transform: subOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        </button>
                        <AnimatePresence>
                          {subOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: "hidden", paddingLeft: 16 }}
                            >
                              {link.items.map(item => (
                                <Link
                                  key={`m-sub-${item.href}`}
                                  href={item.href}
                                  onClick={() => { setMobileOpen(false); setSubOpen(false); }}
                                  style={{ display: "block", padding: "8px 14px", color: DS.text4, fontSize: 14, textDecoration: "none" }}
                                >
                                  <span style={{ marginRight: 8 }}>{item.icon}</span>{item.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={`m-${link.href}-${idx}`}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        padding: "10px 14px", borderRadius: 8,
                        color: active ? DS.blue : DS.text3,
                        background: active ? rgba(DS.blue, 0.08) : "transparent",
                        fontSize: 15, fontWeight: active ? 600 : 400,
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {/* Mobile search */}
                <button
                  onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                    borderRadius: 8, background: rgba(DS.text, 0.03),
                    border: `1px solid ${rgba(DS.text, 0.06)}`,
                    color: DS.text5, fontSize: 14, cursor: "pointer", marginTop: 4,
                  }}
                >
                  <Search size={14} /> <span style={{ flex: 1, textAlign: "left" }}>Tìm kiếm...</span>
                  <kbd style={{ fontSize: 9, fontFamily: DS.mono, color: DS.text5, background: rgba(DS.text, 0.04), borderRadius: 3, padding: "1px 4px" }}>⌘K</kbd>
                </button>
                {/* Mobile audio toggle */}
                <MobileAudioToggle onClose={() => setMobileOpen(false)} />
                <Link
                  href={`/${locale}/booking`}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    marginTop: 8, padding: "12px", borderRadius: 10,
                    background: GRD.primary, color: "#fff",
                    fontSize: 15, fontWeight: 600, textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <Rocket size={16} /> {t("bookNow")}
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed header (height: 60px + 2px gradient line) */}
      <div style={{ height: 62 }} />

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && <SearchOverlay locale={locale} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 768px) { .hide-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } }
      `}</style>
    </>
  );
}
