"use client";

/**
 * SiteHeader — LOOP Solutions
 * Professional modern dark navigation with cosmic design.
 *
 * Features:
 *  - Scroll-aware: header shrinks + increases opacity on scroll
 *  - Animated cosmic gradient top line
 *  - Glassmorphism nav with backdrop blur
 *  - Animated nav underlines (cosmic pink/purple)
 *  - Mega dropdown with cosmic card design
 *  - Notification bell with unread badge
 *  - 5-language LocaleSwitcher
 *  - Role-aware user menu
 *  - ⌘K / Ctrl+K search shortcut
 *  - Mobile accordion menu
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, LogIn, LogOut, Zap,
  ChevronDown, Globe, Rocket,
  Search, ArrowRight, Phone, Mail, MapPin, Clock, MessageCircle, Bell,
  User, LayoutDashboard, Sparkles,
} from "lucide-react";
import { CEO_CONTACT } from "@/lib/constants";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/app/store/authStore";
import { routing } from "@/i18n/routing";
import { useMounted } from "@/app/hooks/useMounted";

// ── Helpers ────────────────────────────────────────────────────────────────────

const rgba = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Search Overlay ────────────────────────────────────────────────────────────

// Entity type config: icon emoji + DS color + label key
const ENTITY_CONFIG: Record<string, { icon: string; color: string; pill: string }> = {
  services: { icon: "🌐", color: DS.cosmicBlue, pill: "Dịch vụ" },
  team: { icon: "👨‍💻", color: DS.cosmicPurple, pill: "Đội ngũ" },
  projects: { icon: "📁", color: DS.amber, pill: "Dự án" },
  blog: { icon: "📝", color: DS.cosmicBlue, pill: "Bài viết" },
  courses: { icon: "🎓", color: DS.cosmicPurple, pill: "Khóa học" },
  faqs: { icon: "❓", color: DS.cyan, pill: "FAQ" },
  testimonials: { icon: "⭐", color: DS.gold, pill: "Đánh giá" },
  instructors: { icon: "🧑‍🏫", color: DS.cosmicPurple, pill: "Giảng viên" },
  expertises: { icon: "🛠️", color: DS.teal, pill: "Chuyên môn" },
  webTemplates: { icon: "🎨", color: DS.cosmicPurple, pill: "Mẫu web" },
  landingPages: { icon: "🚀", color: DS.pink, pill: "Landing" },
  pricingPackages: { icon: "💰", color: DS.gold, pill: "Gói giá" },
  addonServices: { icon: "➕", color: DS.cyan, pill: "Bổ sung" },
};

// Trending pills for empty-query state
const SEARCH_PILLS = [
  { label: "Thiết kế website", color: DS.cosmicBlue },
  { label: "Nhận tư vấn", color: DS.green },
  { label: "Khóa học", color: DS.cosmicPurple },
  { label: "Web nhà hàng", color: DS.amber },
  { label: "SEO Google", color: DS.green },
  { label: "Dashboard", color: DS.cyan },
];

// Fuse.js fuzzy search — client-side typo tolerance
import Fuse from "fuse.js";

// Highlight matched query terms in text — wraps with <mark>
function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{
        background: "rgba(236,72,153,0.18)",
        color: DS.pink,
        borderRadius: "3px",
        padding: "0 2px",
        fontWeight: 600,
      }}>{part}</mark>
    ) : part
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function useRecentSearches() {
  const KEY = "loop-recent-searches";
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  function addSearch(q: string) {
    if (!q.trim()) return;
    const updated = [q, ...recent.filter(r => r !== q)].slice(0, 10);
    setRecent(updated);
    try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }

  function clearSearches() {
    setRecent([]);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  return { recent, addSearch, clearSearches };
}

function SearchOverlay({ locale, onClose }: { locale: string; onClose: () => void }) {
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [flatItems, setFlatItems] = useState<{ href: string; label: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { recent, addSearch, clearSearches } = useRecentSearches();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults(null);
      setLoading(false);
      setError(false);
      setActiveIndex(-1);
      setFlatItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setActiveIndex(-1);
    setFlatItems([]);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&locale=${locale}&mode=full`)
      .then(res => {
        if (!res.ok) throw new Error("search failed");
        return res.json();
      })
      .then(data => {
        if (cancelled) return;

        // Build flat list of all items with searchable fields for fuzzy matching
        type FlatItem = { _entityKey: string; _item: any; href: string; label: string };
        const flat: FlatItem[] = [];
        for (const [key, list] of Object.entries(data.data)) {
          if (!Array.isArray(list) || key === "total" || key === "totalHits") continue;
          for (const item of list as any[]) {
            const label = item.title || item.name || item.question || item.label || "";
            const desc = item.description || item.excerpt || item.answer || item.text || "";
            flat.push({ _entityKey: key, _item: item, href: item.href, label, [key]: { ...item, fuzzyLabel: label + " " + desc } });
          }
        }

        // Apply Fuse.js fuzzy search — re-rank with typo tolerance (threshold 0.4)
        const fuse = new Fuse(flat, {
          keys: [
            { name: "label", weight: 0.7 },
            { name: "_item.description", weight: 0.2 },
            { name: "_item.excerpt", weight: 0.1 },
          ],
          threshold: 0.4,
          includeScore: true,
          minMatchCharLength: 2,
        });
        const fuzzyResults = fuse.search(debouncedQuery);
        const reRankedItems = fuzzyResults.map(r => r.item);

        // Re-build grouped results from fuzzy-ranked items
        const grouped: Record<string, any[]> = {};
        for (const item of reRankedItems) {
          const key = item._entityKey;
          if (!grouped[key]) grouped[key] = [];
          if (grouped[key].length < 5) grouped[key].push(item._item);
        }

        // Fallback: if fuzzy returns nothing, use original results
        const finalResults = Object.keys(grouped).length > 0 ? { ...data.data, ...grouped } : data.data;
        setResults(finalResults);

        // Build flat list for keyboard nav
        const items: { href: string; label: string }[] = [];
        for (const [, list] of Object.entries(finalResults)) {
          if (!Array.isArray(list)) continue;
          for (const item of list as any[]) {
            items.push({ href: item.href, label: item.title || item.name || item.question || "" });
          }
        }
        setFlatItems(items);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, locale]);

  // Keyboard nav
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (!flatItems.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const item = flatItems[activeIndex];
        if (item) { addSearch(query); onClose(); window.location.href = item.href; }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flatItems, activeIndex, query, onClose]);

  // Flatten items for keyboard index lookup
  const entityKeys = results ? Object.keys(results).filter(k => k !== "total" && k !== "totalHits" && Array.isArray((results as any)[k])) : [];
  let itemIndex = 0;

  function isActive(key: string, idx: number) {
    const prevCount = entityKeys.slice(0, entityKeys.indexOf(key)).reduce((sum, k) => sum + ((results as any)?.[k]?.length ?? 0), 0);
    return activeIndex >= prevCount && activeIndex < prevCount + idx;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(2,6,23,0.94)", backdropFilter: "blur(20px)",
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
        {/* Search input */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "1rem 1.5rem", borderRadius: 16,
            background: DS.bgCard2,
            border: `1px solid rgba(236,72,153,0.4)`,
            boxShadow: `0 0 60px rgba(236,72,153,0.12), 0 25px 80px rgba(0,0,0,0.7)`,
          }}
        >
          {loading ? (
            <div className="search-spinner" style={{ width: 20, height: 20, flexShrink: 0 }}>
              <div style={{ width: 20, height: 20, border: `2px solid rgba(236,72,153,0.2)`, borderTopColor: DS.pink, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : (
            <Search size={20} style={{ color: DS.pink, flexShrink: 0 }} />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: DS.text, fontSize: 16, caretColor: DS.pink,
            }}
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="Clear" style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5, display: "flex" }}>
              <X size={18} />
            </button>
          ) : (
            <div style={{ padding: "3px 10px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8 }}>
              <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>ESC</span>
            </div>
          )}
        </div>

        {/* Results panel */}
        <AnimatePresence>
          {(query.length >= 2) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                marginTop: 8, borderRadius: 16, overflow: "hidden",
                background: DS.bgCard2, border: `1px solid rgba(107,61,245,0.2)`,
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)", maxHeight: "70vh", overflowY: "auto",
              }}
            >
              {/* Loading skeletons */}
              {loading && (
                <div style={{ padding: "12px 16px" }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${DS.border}` : "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(255,255,255,0.05)`, animation: "pulse 1.4s ease-in-out infinite" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: "60%", height: 12, borderRadius: 6, background: `rgba(255,255,255,0.05)`, marginBottom: 6, animation: "pulse 1.4s ease-in-out infinite" }} />
                        <div style={{ width: "35%", height: 10, borderRadius: 6, background: `rgba(255,255,255,0.03)`, animation: "pulse 1.4s ease-in-out infinite" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {error && (
                <div style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                  <div style={{ color: DS.text3, fontSize: 14, marginBottom: 12 }}>{t("errorState")}</div>
                  <Link href={`/${locale}/contact`} onClick={onClose} style={{ color: DS.pink, fontSize: 13, textDecoration: "none" }}>
                    {t("emptyResultCta")}
                  </Link>
                </div>
              )}

              {/* Results — grouped by entity type */}
              {!loading && !error && results && results.totalHits === 0 && (
                <div style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                  <div style={{ color: DS.text3, fontSize: 14 }}>{t("noResults", { query })}</div>
                  <Link href={`/${locale}/contact`} onClick={onClose} style={{ color: DS.pink, fontSize: 13, textDecoration: "none", marginTop: 8, display: "inline-block" }}>
                    {t("emptyResultCta")}
                  </Link>
                </div>
              )}

              {!loading && !error && results && results.totalHits > 0 && entityKeys.map(key => {
                const list = (results as any)[key];
                if (!list?.length) return null;
                const config = ENTITY_CONFIG[key] ?? { icon: "📄", color: DS.text4, pill: key };
                return (
                  <div key={key}>
                    {/* Category header */}
                    <div style={{
                      padding: "8px 16px 4px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.8rem" }}>{config.icon}</span>
                        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                          {config.pill}
                        </span>
                        <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                          ({list.length})
                        </span>
                      </div>
                      <Link href={`/${locale}/${key === "services" ? "services" : key === "projects" ? "portfolio" : key}`} onClick={() => { addSearch(query); onClose(); }} style={{ color: DS.pink, fontSize: 10, textDecoration: "none", fontFamily: DS.mono }}>
                        {t("viewAll")} →
                      </Link>
                    </div>
                    {list.map((item: any, idx: number) => {
                      const isItemActive = isActive(key, idx);
                      const currentIndex = itemIndex++;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => { addSearch(query); onClose(); }}
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          <div
                            style={{
                              display: "flex", alignItems: "center", gap: "0.75rem",
                              padding: "9px 16px",
                              cursor: "pointer",
                              background: isItemActive ? "rgba(236,72,153,0.10)" : "transparent",
                              borderLeft: isItemActive ? `2px solid ${DS.pink}` : "2px solid transparent",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={e => { if (!isItemActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                            onMouseLeave={e => { if (!isItemActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: `${config.color}12`, border: `1px solid ${config.color}25`,
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                            }}>
                              {config.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: isItemActive ? DS.text : DS.text2, fontSize: 13, fontWeight: isItemActive ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {highlightText(item.title || item.name || item.question || item.label, query)}
                              </div>
                              {item.description && (
                                <div style={{ color: DS.text4, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                                  {highlightText(item.description, query)}
                                </div>
                              )}
                            </div>
                            {item.category && (
                              <div style={{ padding: "2px 8px", borderRadius: 6, background: `${config.color}12`, border: `1px solid ${config.color}20`, color: config.color, fontSize: 10, fontFamily: DS.mono, flexShrink: 0 }}>
                                {item.category}
                              </div>
                            )}
                            <ArrowRight size={13} style={{ color: DS.text5, flexShrink: 0 }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

              {/* Footer: total results */}
              {!loading && !error && results && results.totalHits > 0 && (
                <div style={{ padding: "10px 16px", borderTop: `1px solid ${DS.border}`, textAlign: "center" }}>
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                    {t("totalResults", { n: results.totalHits })}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent searches (when query is empty) */}
        <AnimatePresence>
          {!query && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.05 }}>
              {recent.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
                    <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      {t("recentSearches")}
                    </span>
                    <button onClick={clearSearches} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                      {t("clearRecent")}
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {recent.map(r => (
                      <button key={r} onClick={() => setQuery(r)} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 12px", borderRadius: 8,
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${DS.border}`,
                        color: DS.text3, fontSize: 12, cursor: "pointer",
                      }}>
                        <span style={{ color: DS.pink, fontSize: "0.7rem" }}>🔍</span>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spin + pulse animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
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
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  // Close on scroll useEffect(() => { if (!open) return; const handler = () => setOpen(false); window.addEventListener("scroll", handler, { passive: true }); return () => window.removeEventListener("scroll", handler); }, [open]);

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
          background: isReallyOpen ? "rgba(236,72,153,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isReallyOpen ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 10, padding: "6px 12px",
          cursor: "pointer", color: DS.text3,
          fontSize: 12, fontFamily: DS.mono, fontWeight: 700,
          letterSpacing: "0.05em",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(236,72,153,0.4)";
          (e.currentTarget as HTMLButtonElement).style.color = DS.text;
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(236,72,153,0.10)";
        }}
        onMouseLeave={e => {
          if (!isReallyOpen) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
          }
        }}
      >
        <Globe size={13} style={{ color: DS.pink }} />
        <span>{current.short}</span>
        <ChevronDown size={9} style={{ transition: "transform 0.25s", transform: isReallyOpen ? "rotate(180deg)" : "none", opacity: 0.7 }} />
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
              border: "1px solid rgba(236,72,153,0.25)",
              borderRadius: 16,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(236,72,153,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              zIndex: 110, padding: "6px", overflow: "hidden",
            }}
          >
            <div style={{
              height: 2, borderRadius: "2px 2px 0 0",
              background: `linear-gradient(90deg, ${DS.pink} 0%, ${DS.cosmicPurple} 100%)`,
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
                    borderRadius: 10, background: active ? "rgba(236,72,153,0.12)" : "none",
                    border: active ? "1px solid rgba(236,72,153,0.3)" : "1px solid transparent",
                    cursor: "pointer",
                    color: active ? DS.text : DS.text4,
                    fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left",
                    transition: "all 0.18s", marginBottom: 2,
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = DS.text; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = DS.text4; } }}
                >
                  <span style={{ fontSize: "1rem", filter: active ? "none" : "grayscale(30%)" }}>{info.flag}</span>
                  <span style={{ flex: 1 }}>{info.long}</span>
                  {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.pink, boxShadow: `0 0 6px ${DS.pink}` }} />}
                  <span style={{ fontSize: "0.625rem", fontFamily: DS.mono, color: active ? DS.pink : DS.text5 }}>{info.short}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile Dropdown (hook-safe) ────────────────────────────────────────────────

function MobileDropdown({
  label, items, onClose,
}: {
  label: string;
  items: MobileNavItem[];
  onClose: () => void;
}) {
  const [subOpen, setSubOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setSubOpen(v => !v)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", padding: "10px 14px", borderRadius: 10,
          color: DS.text3, background: "none", border: "none",
          cursor: "pointer", fontSize: 15,
        }}
      >
        <span>{label}</span>
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
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={onClose}
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

// ── Mega Dropdown ─────────────────────────────────────────────────────────────

interface MegaItem { label: string; href: string; icon: string; description: string; color: string; }
type MobileNavItem = { label: string; href: string; icon: string; description?: string; color?: string };

function MegaDropdown({
  triggerLabel, trigger, items, isOpen, onToggle, onSelect, locale, t,
}: {
  triggerLabel: string; trigger: React.ReactNode; items: MegaItem[];
  isOpen: boolean; onToggle: () => void; onSelect: () => void;
  locale: string; t: ReturnType<typeof useTranslations<"Navigation">>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isReallyOpen = mounted && isOpen;
  useEffect(() => { if (!isReallyOpen) return; const handler = () => onSelect(); window.addEventListener("scroll", handler, { passive: true }); return () => window.removeEventListener("scroll", handler); }, [isReallyOpen, onSelect]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        onMouseEnter={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "8px 14px", borderRadius: 10,
          color: isReallyOpen ? DS.text : DS.text2,
          background: isReallyOpen ? "rgba(236,72,153,0.12)" : "transparent",
          border: isReallyOpen ? "1px solid rgba(236,72,153,0.35)" : "1px solid transparent",
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
              position: "absolute", top: "calc(100% + 8px)", left: 0,
              width: 640,
              background: "rgba(11,14,23,0.98)",
              border: "1px solid rgba(236,72,153,0.2)",
              borderRadius: 20,
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(236,72,153,0.08), 0 0 80px rgba(107,61,245,0.05)`,
              overflow: "hidden", zIndex: 200,
            }}
          >
            {/* Cosmic top bar */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, transparent, ${DS.pink} 30%, ${DS.cosmicPurple} 70%, transparent)`,
            }} />
            <div style={{ padding: "14px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {triggerLabel}
              </span>
              <Link href={`/${locale}/services`} onClick={onSelect} style={{
                color: DS.text4, fontSize: 11, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4, fontFamily: DS.mono,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.pink; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
              >
                {t("viewAll")} <ArrowRight size={10} />
              </Link>
            </div>

            {/* 2-col grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "4px 12px 16px" }}>
              {items.map((item, i) => (
                <Link key={item.href} href={item.href} onClick={onSelect} style={{ textDecoration: "none" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                      transition: "background 0.15s", border: "1px solid transparent",
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
                    <div style={{
                      width: 42, height: 42, flexShrink: 0, borderRadius: 12,
                      background: `${item.color}15`, border: `1px solid ${item.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>{item.label}</div>
                      <div style={{
                        color: DS.text4, fontSize: 11, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {item.description}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* CTA strip */}
            <div style={{ padding: "10px 20px 16px", borderTop: "1px solid rgba(107,61,245,0.12)" }}>
              <Link href={`/${locale}/booking`} onClick={onSelect} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 16px", borderRadius: 12,
                  background: `linear-gradient(135deg, rgba(236,72,153,0.2), rgba(107,61,245,0.15))`,
                  border: "1px solid rgba(236,72,153,0.35)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, rgba(236,72,153,0.30), rgba(107,61,245,0.25))`;
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(236,72,153,0.55)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, rgba(236,72,153,0.2), rgba(107,61,245,0.15))`;
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(236,72,153,0.35)";
                  }}
                >
                  <Rocket size={13} style={{ color: DS.pink }} />
                  <span style={{ color: DS.text, fontSize: 12, fontWeight: 600 }}>{t("getQuote")}</span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Nav Dropdown (simple) ─────────────────────────────────────────────────────

interface NavDropdownItem { label: string; href: string; icon: string; description?: string; color?: string }

function NavDropdown({
  labelKey: _labelKey, trigger, items, isOpen, onToggle, onSelect,
}: {
  labelKey: string; trigger: React.ReactNode; items: NavDropdownItem[];
  isOpen: boolean; onToggle: () => void; onSelect: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isReallyOpen = mounted && isOpen;
  useEffect(() => { if (!isReallyOpen) return; const handler = () => onSelect(); window.addEventListener("scroll", handler, { passive: true }); return () => window.removeEventListener("scroll", handler); }, [isReallyOpen, onSelect]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        onMouseEnter={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "8px 14px", borderRadius: 10,
          color: isReallyOpen ? DS.text : DS.text2,
          background: isReallyOpen ? "rgba(236,72,153,0.12)" : "transparent",
          border: isReallyOpen ? "1px solid rgba(236,72,153,0.35)" : "1px solid transparent",
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
              position: "absolute", top: "calc(100% + 8px)", left: 0,
              marginTop: 0, minWidth: 240,
              background: "rgba(11,14,23,0.98)",
              border: "1px solid rgba(107,61,245,0.2)",
              borderRadius: 16,
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(107,61,245,0.06)",
              overflow: "hidden", zIndex: 200, padding: "6px",
            }}
          >
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={onSelect} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.08)"; }}
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
    admin: { label: t("roleAdmin"), color: DS.cosmicPurple },
    project_manager: { label: t("roleManager"), color: DS.amber },
    hr: { label: "HR", color: DS.cyan },
    media: { label: "Media", color: DS.pink },
    qa: { label: "QA", color: DS.green },
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
  const [notifCount, setNotifCount] = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const roleLabels = getRoleLabels(t);
  const mounted = useMounted();
  const [hasValidToken, setHasValidToken] = useState(false);

  // Check token validity from localStorage on mount and when accountType changes
  useEffect(() => {
    if (!mounted) return;
    const tokenKey = accountType === "customer" ? "loop-customer-token" : "loop-staff-token";
    const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
    setHasValidToken(!!token);
  }, [mounted, accountType]);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  const navLinks: Array<(
    | { type?: never; label: string; href: string }
    | { type: "linkIcon"; label: string; href: string }
    | { type: "dropdown"; labelKey: string; triggerLabel: string; items: NavDropdownItem[] }
    | { type: "mega"; labelKey: string; triggerLabel: string; items: MegaItem[] }
  )> = [
      {
        type: "linkIcon",
        label: t("home"),
        href: `/${locale}/`,
      },
      {
        type: "mega",
        labelKey: "servicesDropdown",
        triggerLabel: t("servicesDropdown"),
        items: [
          { label: t("serviceWebsite"), href: `/${locale}/booking`, icon: "🌐", description: "Thiết kế & phát triển website chuyên nghiệp, tối ưu SEO, responsive trên mọi thiết bị.", color: DS.cosmicBlue },
          { label: t("serviceApp"), href: `/${locale}/services?cat=app`, icon: "📱", description: "Xây dựng ứng dụng di động & phần mềm SaaS với trải nghiệm người dùng hiện đại.", color: DS.cosmicPurple },
          { label: t("serviceDashboard"), href: `/${locale}/services?cat=dashboard`, icon: "📊", description: "Hệ thống dashboard quản trị, phân tích dữ liệu trực quan, báo cáo thông minh.", color: DS.cyan },
          { label: t("serviceSeo"), href: `/${locale}/services?cat=seo`, icon: "🎯", description: "Tối ưu hóa công cụ tìm kiếm, quảng cáo Google & TikTok, tăng trưởng doanh thu bền vững.", color: DS.amber },
          { label: t("quayChupDropdown"), href: `/${locale}/media`, icon: "🎬", description: "Quay phim, chụp ảnh sản phẩm & quảng cáo thương mại chất lượng cao cho doanh nghiệp.", color: DS.rose },
        ],
      },
      { label: t("team"), href: `/${locale}/team` },
      { label: t("academy"), href: `/${locale}/academy` },
      { label: t("blog"), href: `/${locale}/blog` },
      { label: t("contact"), href: `/${locale}/contact` },
      { label: t("about"), href: `/${locale}/about` },
      { label: t("faqLabel"), href: `/${locale}/faq` },
    ];

  const isActive = (href: string) =>
    href === `/${locale}/` ? pathname === `/${locale}/` : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/dang-nhap`);
  };

  // ⌘K / Ctrl+K
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

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifPanelOpen(false);
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    if (userMenuOpen || notifPanelOpen || openDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen, notifPanelOpen, openDropdown]);



  // Auth header helper
  const getAuthHeaders = (): Record<string, string> => {
    const tokenKey = accountType === "customer" ? "loop-customer-token" : "loop-staff-token";
    const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };
  // Load unread count — reads accountType directly from store to avoid stale closure.
  // Empty deps: function is stable, reads fresh state on every call.
  const fetchUnreadCount = useCallback(async () => {
    const authStore = useAuthStore.getState();
    if (!authStore.isAuthenticated) return;
    const { accountType: at, tokenExpiry } = authStore;
    if (!at || (tokenExpiry && Date.now() > tokenExpiry)) return;

    try {
      const tokenKey = at === "customer" ? "loop-customer-token" : "loop-staff-token";
      const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
      if (!token) return;

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/notifications/unread-count", { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifCount(data.data?.count || 0);
      }
    } catch {
      // Silently ignore network errors — next poll will retry
    }
  }, []);

  // Poll every 30s — stable deps, only re-runs when auth state changes
  useEffect(() => {
    fetchUnreadCount();
    if (isAuthenticated) {
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);


  // Load notifications list
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications?limit=10", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleOpenNotifs = () => {
    if (!notifPanelOpen) fetchNotifications();
    setNotifPanelOpen(!notifPanelOpen);
  };

  const markAsRead = async (id: string, link?: string | null) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setNotifCount(prev => Math.max(0, prev - 1));
      if (link) router.push(link);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotifCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  // Detect Mac for keyboard shortcut display — must be client-only to avoid SSR hydration mismatch
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac/i.test(navigator.userAgent));
  }, []);

  // Header style adapts to scroll
  const headerBg = scrolled
    ? "rgba(11,14,22,0.97)"
    : "rgba(12,12,20,0.94)";
  const headerBorder = scrolled
    ? "rgba(236,72,153,0.3)"
    : "rgba(107,61,245,0.20)";
  const headerBlur = scrolled ? 24 : 20;
  const headerHeight = scrolled ? 60 : 68;
  const logoSize = scrolled ? 38 : 48;

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

      {/* Top contact bar */}
      <div style={{
        position: "fixed", top: 2, left: 0, right: 0, zIndex: 51,
        background: "rgba(10,10,18,0.98)",
        borderBottom: `1px solid rgba(107,61,245,0.10)`,
        overflow: "hidden",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem",
          height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flex: 1, overflow: "hidden" }}>
            {[
              { label: "HOTLINE", value: `+84 ${CEO_CONTACT.phone.replace(/^0/, "")}`, href: `tel:${CEO_CONTACT.phone}`, icon: <Phone size={11} /> },
              { label: "EMAIL", value: CEO_CONTACT.email, href: `mailto:${CEO_CONTACT.email}`, icon: <Mail size={11} /> },
              { label: "ĐỊA CHỈ", value: "Cái Răng, Cần Thơ", href: null, icon: <MapPin size={11} /> },
              { label: "GIỜ LÀM VIỆC", value: "T2–T6 · 09:00–18:00", href: null, icon: <Clock size={11} /> },
            ].map((item) => (
              item.href ? (
                <a key={item.label} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  textDecoration: "none", whiteSpace: "nowrap",
                  color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.04em",
                  transition: "color 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.text2; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
                >
                  <span style={{ color: DS.pink }}>{item.icon}</span>
                  <span style={{ color: DS.text5, fontWeight: 600 }}>{item.label}:</span>
                  <span>{item.value}</span>
                </a>
              ) : (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5, color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  <span style={{ color: DS.text5 }}>{item.icon}</span>
                  <span style={{ color: DS.text5, fontWeight: 600 }}>{item.label}:</span>
                  <span>{item.value}</span>
                </div>
              )
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <a href={`tel:${CEO_CONTACT.phone}`} title="Gọi ngay" style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 8,
              background: "rgba(236,72,153,0.12)",
              border: "1px solid rgba(236,72,153,0.30)",
              color: DS.pink, fontSize: 11, fontWeight: 700, textDecoration: "none",
              letterSpacing: "0.03em", transition: "all 0.15s",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(236,72,153,0.22)"; el.style.borderColor = "rgba(236,72,153,0.55)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(236,72,153,0.12)"; el.style.borderColor = "rgba(236,72,153,0.30)";
              }}
            >
              <Phone size={11} /> Gọi ngay
            </a>
            <a href={CEO_CONTACT.zaloUrl} target="_blank" rel="noopener noreferrer" title="Zalo" style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 8,
              background: "rgba(0,104,255,0.12)",
              border: "1px solid rgba(0,104,255,0.30)",
              color: "#4D9FFF", fontSize: 11, fontWeight: 700, textDecoration: "none",
              letterSpacing: "0.03em", transition: "all 0.15s",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(0,104,255,0.22)"; el.style.borderColor = "rgba(0,104,255,0.55)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(0,104,255,0.12)"; el.style.borderColor = "rgba(0,104,255,0.30)";
              }}
            >
              <MessageCircle size={11} /> Zalo
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        suppressHydrationWarning
        style={{
          position: "fixed", top: 38, left: 0, right: 0, zIndex: 50,
          background: headerBg,
          backdropFilter: `blur(${headerBlur}px)`,
          WebkitBackdropFilter: `blur(${headerBlur}px)`,
          borderBottom: `1px solid ${headerBorder}`,
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.5)" : "none",
          overflow: "visible",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: `0 1.5rem`,
          height: headerHeight, display: "flex", alignItems: "center", gap: "1rem",
          transition: "height 0.3s ease",
        }}>
          {/* Logo */}
          <Link href={`/${locale}/`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              position: "relative", width: logoSize, height: logoSize,
              borderRadius: 12,
              background: `linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 20px rgba(236,72,153,0.2), 0 0 40px rgba(107,61,245,0.1)`,
              transition: "all 0.3s ease",
              flexShrink: 0,
            }}>
              <img src="/logo.png" alt="LOOP Solutions" style={{ width: logoSize - 8, height: logoSize - 8, objectFit: "contain", borderRadius: 6 }} />
            </div>
            <div>
              <div style={{
                fontFamily: DS.heading, fontSize: 14, fontWeight: 900,
                letterSpacing: "0.06em", lineHeight: 1,
                background: GRD.primary,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 6px rgba(236,72,153,0.3))",
              }}>
                LOOP
              </div>
              <div style={{ color: DS.text4, fontSize: 7, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em", marginTop: 2 }}>
                SOLUTIONS
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav ref={navRef} className="hide-mobile site-nav-desktop"
            style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "0.5rem", flex: 1 }}>
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
                    locale={locale} t={t}
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
                  <Link key={link.href} href={link.href} title={link.label}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34, borderRadius: 10,
                      color: active ? DS.text : DS.text3,
                      background: active ? "rgba(236,72,153,0.15)" : "transparent",
                      border: active ? "1px solid rgba(236,72,153,0.35)" : "1px solid transparent",
                      textDecoration: "none", transition: "all 0.18s",
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.08)";
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </Link>
                );
              }
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href}
                  style={{
                    padding: "6px 14px", borderRadius: 10,
                    color: active ? DS.text : DS.text2,
                    background: active ? "rgba(236,72,153,0.12)" : "transparent",
                    border: active ? "1px solid rgba(236,72,153,0.30)" : "1px solid transparent",
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    textDecoration: "none", transition: "all 0.18s", whiteSpace: "nowrap",
                    position: "relative",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.06)";
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
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      style={{
                        position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                        width: 20, height: 2,
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
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hide-mobile"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: rgba(DS.text, 0.03), border: `1px solid ${rgba(DS.text, 0.06)}`,
                borderRadius: 10, padding: "5px 12px", color: DS.text5,
                cursor: "pointer", transition: "border-color 0.2s", minWidth: 140,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.pink, 0.3);
                (e.currentTarget as HTMLButtonElement).style.background = rgba(DS.pink, 0.04);
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = rgba(DS.text, 0.06);
                (e.currentTarget as HTMLButtonElement).style.background = rgba(DS.text, 0.03);
              }}
            >
              <Search size={13} style={{ color: DS.text5 }} />
              <span style={{ fontSize: 12, color: DS.text5, flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>Tìm kiếm...</span>
              <kbd style={{
                fontSize: 9, color: DS.text5, background: rgba(DS.text, 0.04),
                border: `1px solid ${rgba(DS.text, 0.07)}`, borderRadius: 5,
                padding: "1px 6px", fontFamily: DS.mono,
              }}>
                {isMac ? "⌘" : "Ctrl+"}K
              </kbd>
            </button>

            {/* Notification Bell */}
            <button
              className="hide-mobile"
              title="Thông báo"
              style={{
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36,
                background: rgba(DS.text, 0.03), border: `1px solid ${rgba(DS.text, 0.06)}`,
                borderRadius: 10, cursor: "pointer", color: DS.text3,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = rgba(DS.pink, 0.3);
                el.style.background = rgba(DS.pink, 0.06);
                el.style.color = DS.pink;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = rgba(DS.text, 0.06);
                el.style.background = rgba(DS.text, 0.03);
                el.style.color = DS.text3;
              }}
            >
              <Bell size={15} />
              {notifCount > 0 && (
                <div style={{
                  position: "absolute", top: 3, right: 3,
                  width: 16, height: 16, borderRadius: "50%",
                  background: DS.pink,
                  border: "2px solid rgba(10,10,18,0.98)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "#fff",
                  boxShadow: `0 0 6px ${DS.pink}`,
                }}>
                  {notifCount}
                </div>
              )}
            </button>

            {/* Locale Switcher */}
            <LocaleSwitcher locale={locale} />

            {/* User menu */}
            {mounted && hasValidToken && user ? (
              <div style={{ position: "relative" }} ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title={user.name}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "3px 10px 3px 3px",
                    background: userMenuOpen ? "rgba(236,72,153,0.10)" : rgba(DS.text, 0.03),
                    border: `1px solid ${userMenuOpen ? "rgba(236,72,153,0.35)" : rgba(DS.text, 0.06)}`,
                    borderRadius: 10, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = rgba(DS.pink, 0.3);
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
                    <img src={user.avatar} alt={user.name} style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover", border: `1px solid rgba(236,72,153,0.3)` }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: GRD.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{user.name.charAt(0)}</span>
                    </div>
                  )}
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: DS.text, lineHeight: 1.2, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                    <div style={{ fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.05em", color: DS.text4, lineHeight: 1.2, marginTop: 1 }}>
                      {(roleLabels[user.role] ?? { label: user.role }).label}
                    </div>
                  </div>
                  <ChevronDown size={10} style={{ color: DS.text5, flexShrink: 0 }} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        width: 240,
                        background: "rgba(10,10,18,0.98)",
                        border: "1px solid rgba(236,72,153,0.20)",
                        borderRadius: 16,
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(236,72,153,0.08)",
                        overflow: "hidden", zIndex: 110,
                      }}
                    >
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${DS.border}` }}>
                        <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{user.name}</div>
                        <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{user.email}</div>
                        {user.lpBalance > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, padding: "5px 10px", borderRadius: 8, background: "rgba(236,72,153,0.06)", border: `1px solid rgba(236,72,153,0.15)` }}>
                            <Zap size={10} style={{ color: DS.pink }} />
                            <span style={{ color: DS.pink, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{user.lpBalance.toLocaleString("vi-VN")} LP</span>
                          </div>
                        )}
                      </div>

                      {user.role === "client" && (
                        <>
                          <Link href={`/${locale}/khach-hang`} onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.06)"; (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <LayoutDashboard size={14} /> Trang khách hàng
                          </Link>
                          <Link href={`/${locale}/khach-hang`} onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.06)"; (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <Zap size={14} style={{ color: DS.cosmicPurple }} /> Ví LP của tôi
                          </Link>
                        </>
                      )}

                      {hasValidToken && accountType === "staff" && (
                        <>
                          <Link href="/admin/overview" onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.06)"; (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <Sparkles size={14} style={{ color: DS.cosmicPurple }} /> Quản trị
                          </Link>
                          <Link href={`/${locale}/khach-hang`} onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.06)"; (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <Zap size={14} style={{ color: DS.cosmicPurple }} /> Ví LP của tôi
                          </Link>
                          <Link href={`/${locale}/`} onClick={() => setUserMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: DS.text3, fontSize: 13, textDecoration: "none" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(236,72,153,0.06)"; (e.currentTarget as HTMLElement).style.color = DS.text; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = DS.text3; }}
                          >
                            <User size={14} /> Hồ sơ cá nhân
                          </Link>
                        </>
                      )}

                      <button onClick={handleLogout}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 16px",
                          background: "none", border: "none",
                          borderTop: `1px solid ${DS.border}`,
                          cursor: "pointer", color: DS.red, fontSize: 13,
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
              <Link href={`/${locale}/dang-nhap`} className="hide-mobile" title={t("login")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36,
                  borderRadius: 10, border: `1px solid ${rgba(DS.text, 0.06)}`,
                  color: DS.text3, textDecoration: "none", transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = rgba(DS.pink, 0.3); el.style.color = DS.text;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = rgba(DS.text, 0.06); el.style.color = DS.text3;
                }}
              >
                <User size={14} />
              </Link>
            )}

            {/* CTA */}
            <Link href={`/${locale}/booking`} className="hide-mobile"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: GRD.primary, color: "#fff",
                fontSize: 12, fontWeight: 600,
                padding: "7px 16px", borderRadius: 10,
                textDecoration: "none",
                boxShadow: `0 0 20px rgba(236,72,153,0.3)`,
                transition: "opacity 0.15s, box-shadow 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px rgba(236,72,153,0.5)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px rgba(236,72,153,0.3)`; }}
            >
              <Rocket size={13} />
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
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden", background: "rgba(2,6,23,0.98)", borderTop: `1px solid ${DS.border}` }}
            >
              <nav style={{ padding: "12px 1.5rem 20px", display: "flex", flexDirection: "column", gap: 4 }}>
                {navLinks.map((link, idx) => {
                  if (link.type === "mega" || link.type === "dropdown") {
                    const items = (link as { items: MobileNavItem[] }).items;
                    return (
                      <MobileDropdown
                        key={`m-drop-${link.labelKey ?? idx}`}
                        label={link.triggerLabel}
                        items={items}
                        onClose={() => setMobileOpen(false)}
                      />
                    );
                  }
                  const href = link.href;
                  const active = isActive(href);
                  return (
                    <Link key={`m-${href}-${idx}`} href={href} onClick={() => setMobileOpen(false)}
                      style={{
                        padding: "10px 14px", borderRadius: 10,
                        color: active ? DS.pink : DS.text3,
                        background: active ? rgba(DS.pink, 0.08) : "transparent",
                        fontSize: 15, fontWeight: active ? 600 : 400, textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                    borderRadius: 10, background: rgba(DS.text, 0.03),
                    border: `1px solid ${rgba(DS.text, 0.06)}`,
                    color: DS.text5, fontSize: 14, cursor: "pointer", marginTop: 4,
                  }}
                >
                  <Search size={14} /> <span style={{ flex: 1, textAlign: "left" }}>Tìm kiếm...</span>
                  <kbd style={{ fontSize: 9, fontFamily: DS.mono, color: DS.text5, background: rgba(DS.text, 0.04), borderRadius: 4, padding: "1px 5px" }}>⌘K</kbd>
                </button>
                <Link href={`/${locale}/booking`} onClick={() => setMobileOpen(false)}
                  style={{
                    marginTop: 8, padding: "12px", borderRadius: 12,
                    background: GRD.primary, color: "#fff",
                    fontSize: 15, fontWeight: 600, textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <Rocket size={15} /> {t("bookNow")}
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && <SearchOverlay locale={locale} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      {/* CSS Animations */}
      <style>{`
        @media (min-width: 768px) { .hide-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes pulse-ring {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </>
  );
}
