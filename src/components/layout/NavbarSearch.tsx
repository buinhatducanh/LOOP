"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Search,
  X,
  Package,
  Briefcase,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResultItem {
  id: string;
  slug: string;
  title?: string;
  name?: string;
  description?: string;
  icon?: string | null;
  image?: string | null;
  category?: string;
  role?: string;
  client?: string;
  price?: number | null;
  deliveryTime?: string | null;
  href: string;
}

interface SearchResults {
  services: SearchResultItem[];
  team: SearchResultItem[];
  projects: SearchResultItem[];
  total: number;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatPrice(price: number | null | undefined) {
  if (!price) return null;
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

// ─── Result Icon ──────────────────────────────────────────────────────────────

function ResultIcon({
  type,
  icon,
  image,
  name,
}: {
  type: "service" | "team" | "project";
  icon?: string | null;
  image?: string | null;
  name?: string;
}) {
  if (type === "team" && image) {
    return (
      <img
        src={image}
        alt={name || ""}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid rgba(255,255,255,0.1)",
        }}
      />
    );
  }

  if (type === "project" && image) {
    return (
      <img
        src={image}
        alt=""
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "6px",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  const colors: Record<string, { bg: string; icon: string }> = {
    service: { bg: "rgba(139,92,246,0.2)", icon: "#A78BFA" },
    team: { bg: "rgba(6,182,212,0.2)", icon: "#22D3EE" },
    project: { bg: "rgba(34,197,94,0.2)", icon: "#4ADE80" },
  };
  const cfg = colors[type];

  return (
    <div
      style={{
        width: "34px",
        height: "34px",
        borderRadius: type === "team" ? "50%" : "8px",
        background: cfg.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {type === "service" && <Briefcase size={15} style={{ color: cfg.icon }} />}
      {type === "team" && <Users size={15} style={{ color: cfg.icon }} />}
      {type === "project" && <Package size={15} style={{ color: cfg.icon }} />}
    </div>
  );
}

// ─── Navbar Search ─────────────────────────────────────────────────────────────

export function NavbarSearch() {
  const locale = useLocale();
  const t = useTranslations("Search");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Flattened items for keyboard navigation
  const flatItems: Array<{ type: "service" | "team" | "project"; item: SearchResultItem; label: string }> = [];

  if (results) {
    results.services.forEach((item) => flatItems.push({ type: "service", item, label: item.title || "" }));
    results.team.forEach((item) => flatItems.push({ type: "team", item, label: item.name || "" }));
    results.projects.forEach((item) => flatItems.push({ type: "project", item, label: item.title || "" }));
  }

  // ── Fetch results
  const fetchResults = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
      if (res.ok) {
        const data: SearchResults = await res.json();
        setResults(data);
        setActiveIndex(-1);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [locale]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => fetchResults(value), 280);
  }, [fetchResults]);

  // ── Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Global ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const hasResults =
    results &&
    (results.services.length > 0 ||
      results.team.length > 0 ||
      results.projects.length > 0);

  const showDropdown = open && query.length >= 2;

  // ── Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && flatItems[activeIndex]) {
      e.preventDefault();
      const selected = flatItems[activeIndex];
      window.location.href = `${selected.item.href}/${selected.item.slug}`;
      setOpen(false);
      setQuery("");
    }
  };

  // ── Live label update
  const getGroupLabel = (type: "service" | "team" | "project") => {
    if (type === "service") return t("services");
    if (type === "team") return t("teamMembers");
    return t("projects");
  };

  let flatIndex = -1;

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
      {/* ── Search Input ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 14px",
          height: "40px",
          background: "rgba(255,255,255,0.06)",
          border: open
            ? "1.5px solid rgba(139,92,246,0.5)"
            : "1.5px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          transition: "all 0.2s",
          boxShadow: open ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
        }}
      >
        {loading ? (
          <Loader2
            size={15}
            style={{ color: "#8B5CF6", animation: "nsSpin 0.7s linear infinite", flexShrink: 0 }}
          />
        ) : (
          <Search size={15} style={{ color: "#6B7280", flexShrink: 0 }} />
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          autoComplete="off"
          spellCheck={false}
          className="navbar-search-input"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "13.5px",
            color: "#F9FAFB",
            caretColor: "#8B5CF6",
            minWidth: 0,
          }}
        />

        {query && (
          <button
            onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "4px",
              padding: "2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#9CA3AF",
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        )}

        <kbd
          style={{
            fontSize: "10px",
            padding: "2px 5px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            color: "#6B7280",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* ── Dropdown Results ─────────────────────────────────────── */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#0F1117",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15)",
            zIndex: 99999,
            maxHeight: "460px",
            overflowY: "auto",
          }}
        >
          {/* No results */}
          {!loading && !hasResults && (
            <div style={{ padding: "28px 16px", textAlign: "center" }}>
              <Search size={24} style={{ margin: "0 auto 8px", opacity: 0.2, color: "#6B7280" }} />
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>{t("noResults")}</p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#4B5563" }}>{t("tryDifferent")}</p>
            </div>
          )}

          {/* Hint when not typing */}
          {query.length < 2 && !hasResults && (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                {t("hint")}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "12px", opacity: 0.5, lineHeight: 1.5 }}>
                {t("examples")}
              </p>
            </div>
          )}

          {/* Services */}
          {results?.services && results.services.length > 0 && (
            <div>
              <div
                style={{
                  padding: "8px 16px 4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#8B5CF6",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {t("services")}
              </div>
              {results.services.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                return (
                  <Link
                    key={item.id}
                    href={`/services/${item.slug}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 16px",
                      cursor: "pointer",
                      textDecoration: "none",
                      background: activeIndex === idx ? "rgba(139,92,246,0.1)" : "transparent",
                      borderLeft: activeIndex === idx ? "2px solid #8B5CF6" : "2px solid transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <ResultIcon type="service" icon={item.icon} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 500,
                          color: "#F3F4F6",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </p>
                      <p style={{ fontSize: "11.5px", color: "#6B7280", margin: "2px 0 0" }}>
                        {item.category}
                        {item.price != null && ` · từ ${formatPrice(item.price)}`}
                        {item.deliveryTime && ` · ${item.deliveryTime}`}
                      </p>
                    </div>
                    <ArrowRight size={13} style={{ color: "#4B5563", flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Team */}
          {results?.team && results.team.length > 0 && (
            <div>
              <div
                style={{
                  padding: "8px 16px 4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#06B6D4",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderTop: results.services.length > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                }}
              >
                {t("teamMembers")}
              </div>
              {results.team.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                return (
                  <Link
                    key={item.id}
                    href={`/team-list/${item.slug}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 16px",
                      cursor: "pointer",
                      textDecoration: "none",
                      background: activeIndex === idx ? "rgba(6,182,212,0.1)" : "transparent",
                      borderLeft: activeIndex === idx ? "2px solid #06B6D4" : "2px solid transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <ResultIcon type="team" image={item.image} name={item.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 500,
                          color: "#F3F4F6",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          fontSize: "11.5px",
                          color: "#6B7280",
                          margin: "2px 0 0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.role}
                      </p>
                    </div>
                    <ArrowRight size={13} style={{ color: "#4B5563", flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Projects */}
          {results?.projects && results.projects.length > 0 && (
            <div>
              <div
                style={{
                  padding: "8px 16px 4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#22C55E",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderTop:
                    (results.services.length > 0 || results.team.length > 0)
                      ? "1px solid rgba(255,255,255,0.06)"
                      : undefined,
                }}
              >
                {t("projects")}
              </div>
              {results.projects.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                return (
                  <Link
                    key={item.id}
                    href={`/portfolio/${item.slug}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 16px",
                      cursor: "pointer",
                      textDecoration: "none",
                      background: activeIndex === idx ? "rgba(34,197,94,0.1)" : "transparent",
                      borderLeft: activeIndex === idx ? "2px solid #22C55E" : "2px solid transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <ResultIcon type="project" image={item.image} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 500,
                          color: "#F3F4F6",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </p>
                      <p style={{ fontSize: "11.5px", color: "#6B7280", margin: "2px 0 0" }}>
                        {item.client}
                        {item.category && ` · ${item.category}`}
                      </p>
                    </div>
                    <ArrowRight size={13} style={{ color: "#4B5563", flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {hasResults && (
            <div
              style={{
                padding: "7px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ fontSize: "11px", color: "#4B5563", margin: 0, textAlign: "center" }}>
                {t("showingResults", { count: results.total })} · ↑↓ {t("pressEnter")}
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes nsSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .navbar-search-dropdown::-webkit-scrollbar { width: 4px; }
        .navbar-search-dropdown::-webkit-scrollbar-track { background: transparent; }
        .navbar-search-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
