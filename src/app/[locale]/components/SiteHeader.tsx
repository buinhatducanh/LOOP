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
  Search, ArrowRight, Phone, Mail, MapPin, Clock, MessageCircle,
} from "lucide-react";
import { CEO_CONTACT } from "@/lib/constants";
import { DS, GRD } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/app/store/authStore";
import { routing } from "@/i18n/routing";
import { useMounted } from "@/app/hooks/useMounted";

const rgba = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Search overlay ─────────────────────────────────────────────────────────────

const SEARCH_SUGGESTIONS = [
  { label: "Thiết kế Website", href: "/services", color: DS.blue },
  { label: "Phát triển App", href: "/services", color: DS.purple },
  { label: "SEO & Marketing", href: "/services", color: DS.green },
  { label: "Phần mềm hỗ trợ kỹ thuật", href: "/services", color: DS.cyan },
  { label: "Khóa học Digital Marketing", href: "/academy", color: DS.purple },
  { label: "Portfolio dự án", href: "/portfolio", color: DS.amber },
  { label: "Đội ngũ LOOP", href: "/team", color: DS.cyan },
];

const SEARCH_PILLS = [
  { label: "Thiết kế web", color: DS.blue },
  { label: "Nhận tư vấn", color: DS.green },
  { label: "Khóa học", color: DS.purple },
  { label: "Web nhà hàng", color: DS.amber },
  { label: "SEO Google", color: DS.green },
  { label: "Web khách sạn", color: DS.blue },
  { label: "Dashboard", color: DS.cyan },
  { label: "Portfolio", color: DS.purple },
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
              {SEARCH_PILLS.map((pill, _i) => (
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

const LOCALE_LABELS: Record<string, { short: string; long: string; flag: string; accent: string }> = {
  vi: { short: "VI", long: "Tiếng Việt", flag: "🇻🇳", accent: DS.pink },
  en: { short: "EN", long: "English", flag: "🇺🇸", accent: DS.cosmicBlue },
  ja: { short: "JA", long: "日本語", flag: "🇯🇵", accent: "#E74C3C" },
  ko: { short: "KO", long: "한국어", flag: "🇰🇷", accent: "#2ECC71" },
  zh: { short: "ZH", long: "中文", flag: "🇨🇳", accent: DS.amber },
};

function LocaleSwitcher({ locale }: { locale: string }) {
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
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: isReallyOpen ? "rgba(107,61,245,0.15)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isReallyOpen ? "rgba(107,61,245,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 9, padding: "5px 10px",
          cursor: "pointer", color: DS.text3,
          fontSize: 12, fontFamily: DS.mono, fontWeight: 700,
          letterSpacing: "0.05em",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(107,61,245,0.4)";
          (e.currentTarget as HTMLButtonElement).style.color = DS.text;
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(107,61,245,0.12)";
        }}
        onMouseLeave={e => {
          if (!isReallyOpen) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
          }
        }}
      >
        <Globe size={13} style={{ color: DS.pink, transition: "color 0.2s" }} />
        <span>{current.short}</span>
        <ChevronDown size={9} style={{ transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)", transform: isReallyOpen ? "rotate(180deg)" : "none", opacity: 0.7 }} />
      </button>

      <AnimatePresence>
        {isReallyOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 180,
              background: "rgba(10,10,18,0.98)",
              border: "1px solid rgba(107,61,245,0.30)",
              borderRadius: 14,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(107,61,245,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
              zIndex: 110,
              padding: "6px",
              overflow: "hidden",
            }}
          >
            {/* Top accent line */}
            <div style={{
              height: 2, borderRadius: "2px 2px 0 0",
              background: `linear-gradient(90deg, ${DS.pink} 0%, ${DS.blue} 100%)`,
              marginBottom: 6,
            }} />
            {routing.locales.map(loc => {
              const info = LOCALE_LABELS[loc] ?? LOCALE_LABELS.vi;
              const active = loc === locale;
              return (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "9px 12px",
                    borderRadius: 10, background: active ? `rgba(107,61,245,0.15)` : "none",
                    border: active ? `1px solid rgba(107,61,245,0.3)` : "1px solid transparent",
                    cursor: "pointer",
                    color: active ? DS.text : DS.text4,
                    fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left",
                    transition: "all 0.18s",
                    marginBottom: 2,
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
                      (e.currentTarget as HTMLButtonElement).style.color = DS.text4;
                    }
                  }}
                >
                  <span style={{ fontSize: "1rem", filter: active ? "none" : "grayscale(30%)" }}>{info.flag}</span>
                  <span style={{ flex: 1 }}>{info.long}</span>
                  {active && (
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: DS.pink,
                      boxShadow: `0 0 6px ${DS.pink}`,
                    }} />
                  )}
                  <span style={{ fontSize: "0.625rem", fontFamily: DS.mono, color: active ? DS.pink : DS.text5, opacity: active ? 1 : 0.5 }}>
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

// ── Mega Dropdown ─────────────────────────────────────────────────────────────
// Wide 2-column panel with icon + label + description for rich nav experience.

interface MegaItem {
  label: string;
  href: string;
  icon: string;
  description: string;
  color: string;
}

interface MegaDropdownGroup {
  type: "mega";
  labelKey: string;
  triggerLabel: string;
  items: MegaItem[];
  badge?: string;
}

function MegaDropdown({
  triggerLabel,
  trigger,
  items,
  isOpen,
  onToggle,
  onSelect,
  locale,
  t,
}: {
  triggerLabel: string;
  trigger: React.ReactNode;
  items: MegaItem[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: () => void;
  locale: string;
  t: ReturnType<typeof useTranslations<"Navigation">>;
}) {
  const [mounted, setMounted] = useState(false);
  const [panelLeft, setPanelLeft] = useState(0);
  useEffect(() => { setMounted(true); }, []);
  const isReallyOpen = mounted && isOpen;

  useEffect(() => {
    if (isReallyOpen) {
      // Find the "Dịch vụ" button inside the desktop nav
      const nav = document.querySelector(".site-nav-desktop");
      const btn = nav?.querySelector("button");
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const panelWidth = 600;
        const viewportWidth = window.innerWidth;
        // Panel left edge aligns with button right edge + gap
        let left = rect.right - 120;
        left = Math.max(16, Math.min(left, viewportWidth - panelWidth - 16));
        setPanelLeft(left);
      }
    }
  }, [isReallyOpen]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        onMouseEnter={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "8px 14px", borderRadius: 8,
          color: isReallyOpen ? DS.text : DS.text2,
          background: isReallyOpen ? "rgba(107,61,245,0.15)" : "transparent",
          border: isReallyOpen ? "1px solid rgba(107,61,245,0.35)" : "1px solid transparent",
          fontSize: 14, fontWeight: isReallyOpen ? 600 : 500,
          cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap",
        }}
      >
        {trigger}
        <ChevronDown size={10} style={{ transition: "transform 0.15s", transform: isReallyOpen ? "rotate(180deg)" : "none" }} />
      </button>

      <AnimatePresence>
        {isReallyOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onMouseLeave={onSelect}
            style={{
              position: "fixed",
              top: 70,
              left: panelLeft,
              width: 600,
              background: "rgba(11,14,23,0.97)",
              border: "1px solid rgba(107,61,245,0.30)",
              borderRadius: 16,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(107,61,245,0.10)",
              overflow: "hidden", zIndex: 100,
            }}
          >
            {/* Top gradient accent */}
            <div style={{
              height: 2,
              background: `linear-gradient(90deg, transparent, ${DS.pink} 40%, ${DS.blue} 70%, transparent)`,
            }} />

            {/* Header label */}
            <div style={{
              padding: "14px 20px 8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                color: DS.text4, fontSize: 10,
                fontFamily: DS.mono, letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}>
                {triggerLabel}
              </span>
              <Link href={`/${locale}/services`} onClick={onSelect} style={{
                color: DS.text4, fontSize: 11, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4,
                fontFamily: DS.mono, transition: "color 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.pink; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
              >
                {t("viewAll")} <ArrowRight size={10} />
              </Link>
            </div>

            {/* 2-column grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              padding: "4px 12px 16px",
            }}>
              {items.map((item, i) => (
                <Link key={item.href} href={item.href} onClick={onSelect} style={{ textDecoration: "none" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 14px", borderRadius: 12,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${item.color}10`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${item.color}25`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, flexShrink: 0,
                      borderRadius: 10,
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                    }}>
                      {item.icon}
                    </div>
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: DS.text, fontSize: 13, fontWeight: 600,
                        marginBottom: 3, lineHeight: 1.3,
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        color: DS.text4, fontSize: 11, lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {item.description}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* CTA strip */}
            <div style={{
              padding: "10px 20px 16px",
              borderTop: "1px solid rgba(107,61,245,0.12)",
            }}>
              <Link href={`/${locale}/dat-lich`} onClick={onSelect} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "9px 16px", borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(107,61,245,0.20), rgba(236,72,153,0.15))",
                  border: "1px solid rgba(107,61,245,0.35)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(107,61,245,0.30), rgba(236,72,153,0.25))";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(236,72,153,0.55)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(107,61,245,0.20), rgba(236,72,153,0.15))";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(107,61,245,0.35)";
                  }}
                >
                  <Rocket size={13} style={{ color: DS.pink }} />
                  <span style={{ color: DS.text, fontSize: 12, fontWeight: 600 }}>
                    {t("getQuote")}
                  </span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Nav Dropdown (simple, single-column) ────────────────────────────────────────

interface NavDropdownItem { label: string; href: string; icon: string; description?: string; color?: string }
interface NavDropdownGroup { type: "dropdown"; labelKey: string; triggerLabel: string; items: NavDropdownItem[] }
type NavItem = ({ type?: never; label: string; href: string } | { type: "linkIcon"; label: string; href: string } | NavDropdownGroup | MegaDropdownGroup);

function NavDropdown({
  labelKey: _labelKey,
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
          padding: "8px 14px", borderRadius: 8,
          color: isReallyOpen ? DS.text : DS.text2,
          background: isReallyOpen ? "rgba(107,61,245,0.15)" : "transparent",
          border: isReallyOpen ? "1px solid rgba(107,61,245,0.35)" : "1px solid transparent",
          fontSize: 14, fontWeight: isReallyOpen ? 600 : 500,
          cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap",
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
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onMouseLeave={onToggle}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 6,
              minWidth: 240,
              background: "rgba(12,12,20,0.97)",
              border: "1px solid rgba(107,61,245,0.25)",
              borderRadius: 14,
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(107,61,245,0.08)",
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
    hr: { label: "HR", color: "#14B8A6" },
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
  if (pathname.includes('/onboarding')) return null;
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

  const navLinks: NavItem[] = [
    // Home icon link
    {
      type: "linkIcon",
      label: t("home"),
      href: `/${locale}/`,
    },

    // Mega dropdown — Dịch vụ (gộp cả Quay chụp Media)
    {
      type: "mega",
      labelKey: "servicesDropdown",
      triggerLabel: t("servicesDropdown"),
      items: [
        {
          label: t("serviceWebsite"),
          href: `/${locale}/services?cat=web`,
          icon: "🌐",
          description: "Thiết kế & phát triển website chuyên nghiệp, tối ưu SEO, responsive trên mọi thiết bị.",
          color: DS.blue,
        },
        {
          label: t("serviceApp"),
          href: `/${locale}/services?cat=app`,
          icon: "📱",
          description: "Xây dựng ứng dụng di động & phần mềm SaaS với trải nghiệm người dùng hiện đại.",
          color: DS.purple,
        },
        {
          label: t("serviceDashboard"),
          href: `/${locale}/services?cat=dashboard`,
          icon: "📊",
          description: "Hệ thống dashboard quản trị, phân tích dữ liệu trực quan, báo cáo thông minh.",
          color: DS.cyan,
        },
        {
          label: t("serviceSeo"),
          href: `/${locale}/services?cat=seo`,
          icon: "🎯",
          description: "Tối ưu hóa công cụ tìm kiếm, quảng cáo Google & TikTok, tăng trưởng doanh thu bền vững.",
          color: DS.gold,
        },
        {
          label: t("quayChupDropdown"),
          href: `/${locale}/media`,
          icon: "🎬",
          description: "Quay phim, chụp ảnh sản phẩm & quảng cáo thương mại chất lượng cao cho doanh nghiệp.",
          color: DS.rose,
        },
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
        background: `linear-gradient(90deg, transparent, ${DS.blue} 30%, ${DS.pink} 70%, transparent)`,
        pointerEvents: "none",
      }} />

      {/* ── Top contact bar ───────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 2, left: 0, right: 0, zIndex: 51,
        background: "rgba(12,12,20,0.97)",
        borderBottom: `1px solid rgba(107,61,245,0.12)`,
        overflow: "hidden",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem",
          height: 36, display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem",
        }}>
          {/* Info chips */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flex: 1, overflow: "hidden" }}>
            {[
              { label: "HOTLINE", value: `+84 ${CEO_CONTACT.phone.replace(/^0/, "")}`, href: `tel:${CEO_CONTACT.phone}`, icon: <Phone size={11} /> },
              { label: "EMAIL", value: CEO_CONTACT.email, href: `mailto:${CEO_CONTACT.email}`, icon: <Mail size={11} /> },
              { label: "ĐỊA CHỈ", value: "Cái Răng, Cần Thơ", href: null, icon: <MapPin size={11} /> },
              { label: "GIỜ LÀM VIỆC", value: "T2–T6 · 09:00–18:00", href: null, icon: <Clock size={11} /> },
            ].map((item) => (
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    textDecoration: "none", whiteSpace: "nowrap",
                    color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.04em",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.text2; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
                >
                  <span style={{ color: DS.pink }}>{item.icon}</span>
                  <span style={{ color: DS.text5, fontWeight: 600 }}>{item.label}</span>
                  <span>{item.value}</span>
                </a>
              ) : (
                <div
                  key={item.label}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: DS.text5 }}>{item.icon}</span>
                  <span style={{ color: DS.text5, fontWeight: 600 }}>{item.label}</span>
                  <span>{item.value}</span>
                </div>
              )
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <a
              href={`tel:${CEO_CONTACT.phone}`}
              title="Gọi ngay"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 6,
                background: "rgba(236,72,153,0.12)",
                border: "1px solid rgba(236,72,153,0.30)",
                color: DS.pink, fontSize: 11, fontWeight: 700,
                textDecoration: "none", letterSpacing: "0.03em",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(236,72,153,0.22)";
                el.style.borderColor = "rgba(236,72,153,0.55)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(236,72,153,0.12)";
                el.style.borderColor = "rgba(236,72,153,0.30)";
              }}
            >
              <Phone size={11} />
              Gọi ngay
            </a>
            <a
              href={CEO_CONTACT.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Liên hệ Zalo"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 6,
                background: "rgba(0,104,255,0.12)",
                border: "1px solid rgba(0,104,255,0.30)",
                color: "#4D9FFF", fontSize: 11, fontWeight: 700,
                textDecoration: "none", letterSpacing: "0.03em",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(0,104,255,0.22)";
                el.style.borderColor = "rgba(0,104,255,0.55)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(0,104,255,0.12)";
                el.style.borderColor = "rgba(0,104,255,0.30)";
              }}
            >
              <MessageCircle size={11} />
              Zalo
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header
        suppressHydrationWarning
        style={{
          position: "fixed", top: 38, left: 0, right: 0, zIndex: 50,
          background: "rgba(12,12,20,0.94)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid rgba(107,61,245,0.20)`,
          overflow: "visible",
        }}
      >
        <div
          style={{
            maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem",
            height: 68, display: "flex", alignItems: "center", gap: "1.25rem",
          }}
        >
          {/* Logo */}
          <Link href={`/${locale}/`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", flexShrink: 0 }}>
            {/* Cosmic glow ring */}
            <div style={{
              position: "relative",
              width: 48, height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(139,92,246,0.15)",
            }}>
              <img
                src="/logo.png"
                alt="LOOP Solutions"
                style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6 }}
              />
            </div>
            <div>
              <div style={{
                fontFamily: DS.heading, fontSize: 15, fontWeight: 900,
                letterSpacing: "0.06em", lineHeight: 1,
                background: GRD.primary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 8px rgba(59,130,246,0.4))",
              }}>
                LOOP
              </div>
              <div style={{ color: DS.text4, fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em", marginTop: 2 }}>
                SOLUTIONS
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav ref={navRef} className="hide-mobile site-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "1rem", flex: 1 }}>
            {navLinks.map(link => {
              if (link.type === "mega") {
                return (
                  <MegaDropdown
                    key={link.labelKey}
                    triggerLabel={link.triggerLabel}
                    trigger={<span>{link.triggerLabel}</span>}
                    items={link.items}
                    isOpen={openDropdown === link.labelKey}
                    onToggle={() => setOpenDropdown(prev => prev === link.labelKey ? null : link.labelKey)}
                    onSelect={() => setOpenDropdown(null)}
                    locale={locale}
                    t={t}
                  />
                );
              }
              if (link.type === "dropdown") {
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
              if (link.type === "linkIcon") {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.label}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34,
                      borderRadius: 8,
                      color: active ? DS.text : DS.text3,
                      background: active ? "rgba(107,61,245,0.15)" : "transparent",
                      border: active ? "1px solid rgba(107,61,245,0.35)" : "1px solid transparent",
                      textDecoration: "none", transition: "all 0.18s",
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(107,61,245,0.08)";
                        (e.currentTarget as HTMLElement).style.color = DS.text;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = DS.text3;
                      }
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </Link>
                );
              }
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    color: active ? DS.text : DS.text2,
                    background: active ? "rgba(107,61,245,0.15)" : "transparent",
                    border: active ? "1px solid rgba(107,61,245,0.35)" : "1px solid transparent",
                    fontSize: 14, fontWeight: active ? 600 : 500,
                    textDecoration: "none", transition: "all 0.18s", whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(107,61,245,0.08)";
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
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto", minWidth: 0 }}>
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

            {/* User menu — icon only */}
            {mounted && isAuthenticated && user ? (
              <div style={{ position: "relative" }} ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title={user.name}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 34, height: 34,
                    background: rgba(DS.text, 0.03), border: `1px solid ${rgba(DS.text, 0.08)}`,
                    borderRadius: 9, cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => {
                    const rl = roleLabels[user.role] ?? { color: DS.text4 };
                    (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(rl.color, 0.3);
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.text, 0.08);
                  }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={DS.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        width: 220,
                        background: "rgba(10,10,18,0.98)",
                        border: "1px solid rgba(107,61,245,0.25)",
                        borderRadius: 14,
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(107,61,245,0.10)",
                        overflow: "hidden", zIndex: 110,
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
                      {/* ── Menu items ── */}
                      {/* Client-only items */}
                      {user.role === "client" && (
                        <>
                          <Link
                            href={`/${locale}/khach-hang`}
                            onClick={() => setUserMenuOpen(false)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none", transition: "background 0.1s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rgba(DS.blue, 0.06); (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <span>🏠</span> Trang khách hàng
                          </Link>
                          <Link
                            href={`/${locale}/khach-hang`}
                            onClick={() => setUserMenuOpen(false)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none", transition: "background 0.1s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rgba(DS.blue, 0.06); (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <span>💎</span> Ví LP của tôi
                          </Link>
                        </>
                      )}
                      {/* Staff/admin items */}
                      {user.role !== "client" && (
                        <>
                          <Link
                            href="/admin/overview"
                            onClick={() => setUserMenuOpen(false)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none", transition: "background 0.1s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rgba(DS.blue, 0.06); (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <span>⚙️</span> Quản trị
                          </Link>
                          <Link
                            href={`/${locale}/khach-hang`}
                            onClick={() => setUserMenuOpen(false)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none", transition: "background 0.1s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rgba(DS.blue, 0.06); (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <span>💎</span> Ví LP của tôi
                          </Link>
                          <Link
                            href={`/${locale}`}
                            onClick={() => setUserMenuOpen(false)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none", transition: "background 0.1s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rgba(DS.blue, 0.06); (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <span>👤</span> Hồ sơ cá nhân
                          </Link>
                        </>
                      )}
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
                title={t("login")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 34, height: 34,
                  borderRadius: 9, border: `1px solid ${rgba(DS.text, 0.08)}`,
                  color: DS.text4, textDecoration: "none", transition: "all 0.15s",
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
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

            {/* Call Now Button */}
            <a
              href={`tel:${CEO_CONTACT.phone}`}
              className="hide-mobile"
              title="Gọi ngay: 037 844 3602"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(236,72,153,0.10)",
                border: "1px solid rgba(236,72,153,0.35)",
                color: DS.pink,
                fontSize: 13, fontWeight: 700,
                padding: "7px 14px", borderRadius: 8,
                textDecoration: "none",
                boxShadow: "0 0 16px rgba(236,72,153,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(236,72,153,0.18)";
                el.style.borderColor = "rgba(236,72,153,0.65)";
                el.style.boxShadow = "0 0 28px rgba(236,72,153,0.35), inset 0 1px 0 rgba(255,255,255,0.08)";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(236,72,153,0.10)";
                el.style.borderColor = "rgba(236,72,153,0.35)";
                el.style.boxShadow = "0 0 16px rgba(236,72,153,0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
                el.style.transform = "translateY(0)";
              }}
            >
              <Phone size={13} style={{ animation: "pulse-ring 2s ease-in-out infinite" }} />
              <span>037 844 3602</span>
            </a>

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
                  // Mega dropdown on mobile — treat same as simple dropdown (accordion)
                  if (link.type === "mega" || link.type === "dropdown") {
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
                {/* Mobile Call button */}
                <a
                  href={`tel:${CEO_CONTACT.phone}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "12px",
                    borderRadius: 10, background: "rgba(236,72,153,0.10)",
                    border: "1px solid rgba(236,72,153,0.30)",
                    color: DS.pink, fontSize: 15, fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 0 16px rgba(236,72,153,0.12)",
                  }}
                >
                  <Phone size={16} /> Gọi ngay: 037 844 3602
                </a>
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

      {/* Spacer for fixed header (2px gradient + 36px top bar + 70px nav) */}
      <div style={{ height: 108 }} />

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && <SearchOverlay locale={locale} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 768px) { .hide-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } }

        /* Call button pulse animation */
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </>
  );
}
