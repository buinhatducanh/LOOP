"use client";

/**
 * SearchOverlay — Extracted from SiteHeader for lazy loading (next/dynamic).
 * Full-featured search: debounced API + Fuse.js fuzzy + keyboard nav + recent searches.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, ArrowRight } from "lucide-react";
import Fuse from "fuse.js";
import { DS } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";

// ── Helpers ────────────────────────────────────────────────────────────────────

import { rgba } from "@/components/ui/utils";

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

// ── Component ─────────────────────────────────────────────────────────────────

interface SearchOverlayProps {
  locale: string;
  onClose: () => void;
}

export default function SearchOverlay({ locale, onClose }: SearchOverlayProps) {
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

        const grouped: Record<string, any[]> = {};
        for (const item of reRankedItems) {
          const key = item._entityKey;
          if (!grouped[key]) grouped[key] = [];
          if (grouped[key].length < 5) grouped[key].push(item._item);
        }

        const finalResults = Object.keys(grouped).length > 0 ? { ...data.data, ...grouped } : data.data;
        setResults(finalResults);

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
  }, [flatItems, activeIndex, query, onClose, addSearch]);

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
        background: rgba(DS.bgCosmic, 0.94), backdropFilter: "blur(20px)",
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
            background: DS.bgCard,
            border: `1px solid ${rgba(DS.pink, 0.35)}`,
            boxShadow: `0 0 40px ${rgba(DS.pink, 0.1)}, var(--figma-glow-card)`,
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
                background: DS.bgCard, border: `1px solid ${rgba(DS.cosmicPurple, 0.15)}`,
                boxShadow: "var(--figma-glow-card)", maxHeight: "70vh", overflowY: "auto",
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

              {/* No results */}
              {!loading && !error && results && results.totalHits === 0 && (
                <div style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                  <div style={{ color: DS.text3, fontSize: 14 }}>{t("noResults", { query })}</div>
                  <Link href={`/${locale}/contact`} onClick={onClose} style={{ color: DS.pink, fontSize: 13, textDecoration: "none", marginTop: 8, display: "inline-block" }}>
                    {t("emptyResultCta")}
                  </Link>
                </div>
              )}

              {/* Results — grouped by entity type */}
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
                        background: rgba(DS.text, 0.05),
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
