"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { DS } from "@/lib/design-tokens";
import { Search, Zap, Crown } from "lucide-react";

type MemberRecord = Record<string, unknown>;

type HeroContent = {
  badge: string;
  heroTitle1: string;
  heroHighlight: string;
  heroTitle2: string;
  heroDesc: string;
};

// ─── Rank config ──────────────────────────────────────────────────────────────

const RANK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Diamond: { label: "DIAMOND", color: "#60A5FA", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.35)", icon: <Crown size={12} /> },
  Gold:    { label: "GOLD",    color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.35)",  icon: <Zap size={12} /> },
  Silver:  { label: "SILVER",  color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.35)", icon: null },
  Bronze:  { label: "BRONZE",  color: "#CD7F32", bg: "rgba(205,127,50,0.1)",  border: "rgba(205,127,50,0.35)",  icon: null },
};

function getRankStyle(rank?: string | null) {
  const r = rank ? RANK_CONFIG[rank] : null;
  if (!r) return { color: DS.text3, bg: "transparent", border: DS.border, label: "", icon: null };
  return r;
}

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({ member, index, locale }: { member: MemberRecord; index: number; locale: string }) {
  const slug = (member.slug as string) ?? String(member.id ?? index);
  const name = (member.name as string) ?? "Unknown";
  const role = (member.role as string) ?? "";
  const shortBio = (member.shortBio as string) ?? "";
  const image = (member.image as string) ?? "";
  const rank = member.rank as string | undefined;
  const level = member.level as number | undefined;
  const lpBalance = member.lpBalance as number | undefined;
  const rStyle = getRankStyle(rank);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -4, boxShadow: `0 12px 40px ${rStyle.color}20` }}
      style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${rStyle.border}`, background: DS.bgCard, transition: "box-shadow 0.25s" }}
    >
      <Link href={`/${locale}/team/${slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {/* Avatar */}
        <div style={{ height: 220, background: "#111827", overflow: "hidden", position: "relative" }}>
          {image ? (
            <img src={image} alt={name} onError={() => markImgError(member.id as string)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "4rem", fontWeight: 800 }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Rank badge overlay */}
          {rStyle.label && (
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, background: rStyle.bg, border: `1px solid ${rStyle.border}`, borderRadius: 9999, padding: "3px 10px" }}>
              {rStyle.icon}
              <span style={{ color: rStyle.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, letterSpacing: "0.1em" }}>
                {rStyle.label}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "14px 16px" }}>
          <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{name}</h3>
          <p style={{ color: DS.blue, fontSize: 12, fontWeight: 600, fontFamily: DS.mono, marginBottom: 6 }}>{role}</p>
          {shortBio && (
            <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {shortBio}
            </p>
          )}
          {/* LP + Level */}
          {(lpBalance !== undefined || level !== undefined) && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {level !== undefined && (
                <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 9999, padding: "2px 8px", display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>LV</span>
                  <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono }}>{level}</span>
                </div>
              )}
              {lpBalance !== undefined && lpBalance > 0 && (
                <div style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", borderRadius: 9999, padding: "2px 8px", display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>LP</span>
                  <span style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono }}>
                    {lpBalance >= 1000 ? `${(lpBalance / 1000).toFixed(0)}K` : lpBalance}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

// ─── Filter definitions ───────────────────────────────────────────────────────

const FILTER_KEYS = [
  "filterAll",
  "filterFrontend",
  "filterBackend",
  "filterDesign",
  "filterMarketing",
  "filterQA",
  "filterDevOps",
  "filterPM",
  "filterCEO",
  "filterAdmin",
] as const;

type FilterKey = typeof FILTER_KEYS[number];

// Maps filter i18n key → role keyword to match against member.role
const FILTER_ROLE_MAP: Record<FilterKey, string> = {
  filterAll:      "",
  filterFrontend: "frontend",
  filterBackend:  "backend",
  filterDesign:   "design",
  filterMarketing:"marketing",
  filterQA:       "qa",
  filterDevOps:   "devops",
  filterPM:       "project manager",
  filterCEO:      "ceo",
  filterAdmin:    "admin",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamClient({
  locale,
  members,
  hero,
}: {
  locale: string;
  members: MemberRecord[];
  hero: HeroContent;
}) {
  const t = useTranslations("TeamPage");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("filterAll");
  // Track per-member image load errors
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>({});

  const markImgError = (id: string) =>
    setImgErrors(prev => ({ ...prev, [id]: true }));

  // Filter members by search query + role filter
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const name = ((m.name as string) ?? "").toLowerCase();
      const role = ((m.role as string) ?? "").toLowerCase();
      const bio = ((m.shortBio as string) ?? "").toLowerCase();
      const q = search.toLowerCase();
      const matchSearch = !q || name.includes(q) || role.includes(q) || bio.includes(q);
      const roleKeyword = FILTER_ROLE_MAP[activeFilter];
      const matchFilter = !roleKeyword || role.includes(roleKeyword);
      return matchSearch && matchFilter;
    });
  }, [members, search, activeFilter]);

  // Featured members (top LP)
  const featured = useMemo(() => {
    return [...members]
      .sort((a, b) => ((b.lpBalance as number) ?? 0) - ((a.lpBalance as number) ?? 0))
      .slice(0, 4);
  }, [members]);

  // Fallback label for members without a rank
  const fallbackRankLabel = t("filterAll");

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section className="py-16 px-6 text-center" style={{ background: "linear-gradient(180deg, rgba(251,191,36,0.05) 0%, transparent 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>
              {hero.badge}
            </span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 38, fontWeight: 900, letterSpacing: "0.06em", background: "linear-gradient(135deg, #FFFFFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
            {hero.heroTitle1}<span style={{ color: DS.amber }}>{hero.heroHighlight}</span>{hero.heroTitle2}
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>
            {hero.heroDesc}
          </p>
        </div>
      </section>

      {/* Hall of Fame */}
      {featured.length > 0 && (
        <section className="px-6 pb-10">
          <div className="max-w-6xl mx-auto">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 20, background: "linear-gradient(180deg, #FBBF24, #F59E0B)", borderRadius: 2 }} />
              <span style={{ color: DS.text2, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em" }}>
                {t("hallOfFame")}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {featured.map((m, i) => {
                const rStyle = getRankStyle(m.rank as string | undefined);
                return (
                  <Link key={m.id as string} href={`/${locale}/team/${m.slug as string}`} style={{ textDecoration: "none" }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 }}
                      style={{ background: rStyle.bg, border: `1px solid ${rStyle.border}`, borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: "#111827", flexShrink: 0 }}>
                        {(m.image as string) && !imgErrors[m.id as string] ? (
                          <img src={m.image as string} alt={m.name as string} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => markImgError(m.id as string)} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "1.25rem", fontWeight: 700 }}>
                            {(m.name as string).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name as string}</div>
                        <div style={{ color: rStyle.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                          {rStyle.label || fallbackRankLabel}
                        </div>
                        {(m.lpBalance as number) != null && (m.lpBalance as number) > 0 && (
                          <div style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>
                            {(m.lpBalance as number).toLocaleString()} LP
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Search + Filter */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Role filter pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {FILTER_KEYS.map((key) => {
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 9999,
                    border: isActive ? `1px solid ${DS.blue}` : `1px solid ${DS.border}`,
                    background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                    color: isActive ? DS.blue : DS.text4,
                    fontSize: 12,
                    fontFamily: DS.mono,
                    fontWeight: isActive ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {t(key)}
                </button>
              );
            })}
          </div>

          {/* Search input */}
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`,
                borderRadius: 12, padding: "10px 14px 10px 40px",
                color: DS.text, fontSize: 14, outline: "none",
                boxSizing: "border-box", fontFamily: DS.body,
              }}
            />
          </div>
        </div>
      </section>

      {/* Member Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: DS.text4, padding: "4rem" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 15 }}>{t("noResults")}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {filtered.map((member, i) => (
                <MemberCard key={member.id as string} member={member} index={i} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
