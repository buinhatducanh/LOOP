"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Search,
  Briefcase,
  Users,
  Package,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Utility ───────────────────────────────────────────────────────────────────

function formatPrice(price: number | null | undefined) {
  if (!price) return null;
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

// ─── GlobalSearch Trigger Button ───────────────────────────────────────────────────

export function GlobalSearchButton() {
  const t = useTranslations("Search");

  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("openSearch")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "7px 14px",
          fontSize: "13px",
          color: "#9CA3AF",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.2s",
          minWidth: "180px",
          justifyContent: "space-between",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.5)";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Search size={14} />
          <span style={{ opacity: 0.7 }}>{t("placeholder")}</span>
        </span>
        <kbd
          style={{
            fontSize: "11px",
            padding: "2px 5px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "4px",
            color: "#6B7280",
            fontFamily: "monospace",
          }}
        >
          ⌘K
        </kbd>
      </button>

      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─── GlobalSearch Dialog ─────────────────────────────────────────────────────────

function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Search");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    } else {
      // Auto-focus input after dialog opens
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Debounced search
  const fetchResults = useCallback(
    async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setResults(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&locale=${locale}`
        );
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim() || value.length < 2) {
        setResults(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(() => fetchResults(value), 280);
    },
    [fetchResults]
  );

  const hasResults =
    results &&
    (results.services.length > 0 ||
      results.team.length > 0 ||
      results.projects.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="global-search-dialog"
        style={{
          background: "#0F1117",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: 0,
          maxWidth: "600px",
          width: "calc(100% - 2rem)",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.2)",
        }}
      >
        {/* ── Search input row ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            borderBottom: query
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search size={18} style={{ color: "#6B7280", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t("placeholder")}
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "16px",
              color: "#F9FAFB",
              caretColor: "#8B5CF6",
            }}
          />
          {loading ? (
            <Loader2
              size={16}
              style={{
                color: "#8B5CF6",
                animation: "globalSearchSpin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                setResults(null);
                inputRef.current?.focus();
              }}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "12px",
                color: "#9CA3AF",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={12} />
            </button>
          ) : (
            <kbd
              style={{
                fontSize: "11px",
                padding: "3px 6px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "5px",
                color: "#6B7280",
                flexShrink: 0,
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* ── Results ───────────────────────────────────────── */}
        <Command
          style={{
            background: "transparent",
            border: "none",
            borderRadius: 0,
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {/* Empty state: no query */}
          {!query && (
            <CommandEmpty
              style={{
                padding: "36px 16px",
                textAlign: "center",
                color: "#6B7280",
                fontSize: "14px",
              }}
            >
              <Search size={28} style={{ margin: "0 auto 10px", opacity: 0.25 }} />
              <p style={{ margin: 0, fontWeight: 500, color: "#9CA3AF" }}>
                {t("hint")}
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "12px",
                  opacity: 0.6,
                  lineHeight: 1.6,
                }}
              >
                {t("examples")}
              </p>
            </CommandEmpty>
          )}

          {/* No results */}
          {query && !loading && !hasResults && (
            <CommandEmpty
              style={{
                padding: "36px 16px",
                textAlign: "center",
                color: "#6B7280",
                fontSize: "14px",
              }}
            >
              <p style={{ margin: 0 }}>{t("noResults")}</p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", opacity: 0.6 }}>
                {t("tryDifferent")}
              </p>
            </CommandEmpty>
          )}

          {/* Services */}
          {results?.services && results.services.length > 0 && (
            <CommandGroup
              heading={t("services")}
              style={{
                padding: "8px 0 4px",
                overflow: "hidden",
              }}
            >
              {results.services.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.category || ""}`}
                  onSelect={() => {
                    onOpenChange(false);
                  }}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <NavResultIcon type="service" icon={item.icon} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#F9FAFB",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        margin: "2px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>{item.category}{item.price != null ? ` · từ ${formatPrice(item.price)}` : ""}{item.deliveryTime ? ` · ${item.deliveryTime}` : ""}</span>
                  </p>
                  <ArrowRight size={14} style={{ color: "#4B5563", flexShrink: 0 }} />
                </div>
                <ArrowRight size={14} style={{ color: "#4B5563", flexShrink: 0 }} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Team */}
        {results?.team && results.team.length > 0 && (
          <CommandGroup heading={t("teamMembers")}
              style={{
                padding: "8px 0 4px",
                overflow: "hidden",
              }}
            >
              {results.team.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.name} ${item.role || ""}`}
                  onSelect={() => {
                    onOpenChange(false);
                  }}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <NavResultIcon type="team" name={item.name} image={item.image} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#F9FAFB",
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
                        fontSize: "12px",
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
                  <ArrowRight size={14} style={{ color: "#4B5563", flexShrink: 0 }} />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Projects */}
          {results?.projects && results.projects.length > 0 && (
            <CommandGroup
              heading={t("projects")}
              style={{
                padding: "8px 0 4px",
                overflow: "hidden",
              }}
            >
              {results.projects.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.client || ""}`}
                  onSelect={() => {
                    onOpenChange(false);
                  }}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <NavResultIcon type="project" image={item.image} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#F9FAFB",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        margin: "2px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.client}
                      {item.category && ` · ${item.category}`}
                    </p>
                  </div>
                  <ArrowRight size={14} style={{ color: "#4B5563", flexShrink: 0 }} />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Footer */}
          {hasResults && (
            <div
              style={{
                padding: "8px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                marginTop: "4px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#4B5563",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {t("showingResults", { count: results.total })} · {t("pressEnter")}
              </p>
            </div>
          )}
        </Command>

        {/* Spinner animation */}
        <style>{`
          @keyframes globalSearchSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

// ─── Result icon helper ─────────────────────────────────────────────────────────

function NavResultIcon({
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
          width: "36px",
          height: "36px",
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
          width: "36px",
          height: "36px",
          borderRadius: "6px",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  const colors: Record<string, { bg: string; icon: string }> = {
    service: { bg: "rgba(139,92,246,0.15)", icon: "#8B5CF6" },
    team: { bg: "rgba(6,182,212,0.15)", icon: "#06B6D4" },
    project: { bg: "rgba(34,197,94,0.15)", icon: "#22C55E" },
  };
  const cfg = colors[type];

  return (
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: type === "team" ? "50%" : "8px",
        background: cfg.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {type === "service" && <Briefcase size={16} style={{ color: cfg.icon }} />}
      {type === "team" && <Users size={16} style={{ color: cfg.icon }} />}
      {type === "project" && <Package size={16} style={{ color: cfg.icon }} />}
    </div>
  );
}
