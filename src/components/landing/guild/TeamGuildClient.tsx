"use client";

/**
 * TeamGuildClient — Full guild-styled team page
 *
 * Replaces the plain team page with the full gaming aesthetic:
 * - Hall of Fame (MVP / Bug Slayer / Top Performer)
 * - Role filter pills
 * - Search + Sort bar
 * - Member grid with rank-specific LED border animations
 * - In-game ambient guild CSS
 */
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { MemberCard } from "./MemberCard";
import { HallOfFame } from "./HallOfFame";
import { RoleFilters, type RoleFilter } from "./RoleFilters";
import { SearchSortBar, type SortOption } from "./SearchSortBar";
import { GuildAnimations } from "./GuildAnimations";
import { RANKS, normalizeRank } from "./guildMemberData";

type MemberRecord = Record<string, unknown>;

type HeroContent = {
  badge: string;
  heroTitle1: string;
  heroHighlight: string;
  heroTitle2: string;
  heroDesc: string;
};

// Maps role filter → role keywords to match
const FILTER_ROLE_MAP: Record<RoleFilter, string> = {
  all: "",
  PM: "project manager",
  PO: "product owner",
  CEO: "ceo",
  SC: "scrum master",
  HR: "nhân sự",
  MKT: "marketing",
  DESIGNER: "design",
  DEV: "developer",
};

function getTop3(members: MemberRecord[]): {
  mvp: MemberRecord;
  bugSlayer: MemberRecord;
  topPerformer: MemberRecord;
} {
  const sorted = [...members].sort(
    (a, b) => ((b.availableLp as number) ?? 0) - ((a.availableLp as number) ?? 0)
  );
  const safe = (i: number): MemberRecord =>
    sorted[i] ?? ({ id: i, name: "???", role: "", rank: "iron", level: 1, availableLp: 0, missions: 0 } as unknown as MemberRecord);
  return { mvp: safe(0), bugSlayer: safe(1), topPerformer: safe(2) };
}

function sortMembers(members: MemberRecord[], sortBy: SortOption): MemberRecord[] {
  const rankTier = (rank: string | undefined) => RANKS[normalizeRank(rank)]?.tier ?? 0;
  const sorted = [...members];
  switch (sortBy) {
    case "level-desc": return sorted.sort((a, b) => ((b.level as number) ?? 0) - ((a.level as number) ?? 0));
    case "level-asc":  return sorted.sort((a, b) => ((a.level as number) ?? 0) - ((b.level as number) ?? 0));
    case "rank-desc":  return sorted.sort((a, b) => rankTier(b.rank as string | undefined) - rankTier(a.rank as string | undefined));
    case "rank-asc":   return sorted.sort((a, b) => rankTier(a.rank as string | undefined) - rankTier(b.rank as string | undefined));
    case "team":        return sorted.sort((a, b) => ((a.team as string) ?? "").localeCompare((b.team as string) ?? ""));
    default: return sorted;
  }
}

interface TeamGuildClientProps {
  locale: string;
  members: MemberRecord[];
  hero: HeroContent;
}

export function TeamGuildClient({ locale, members, hero }: TeamGuildClientProps) {
  const t = useTranslations("TeamPage");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<RoleFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("level-desc");

  // Role filter labels (i18n)
  const filterLabels = useMemo<Record<RoleFilter, string>>(() => ({
    all: t("filterAll"),
    PM: t("filterPM"),
    PO: t("filterPO"),
    CEO: t("filterCEO"),
    SC: t("filterSC"),
    HR: t("filterHR"),
    MKT: t("filterMKT"),
    DESIGNER: t("filterDesigner"),
    DEV: t("filterDev"),
  }), [t]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const roleKw = FILTER_ROLE_MAP[activeFilter];
    const base = members.filter((m) => {
      const name = ((m.name as string) ?? "").toLowerCase();
      const role = ((m.role as string) ?? "").toLowerCase();
      const bio = ((m.shortBio as string) ?? "").toLowerCase();
      const team = ((m.team as string) ?? "").toLowerCase();
      const matchSearch = !q || name.includes(q) || role.includes(q) || bio.includes(q) || team.includes(q);
      const matchFilter = !roleKw || role.includes(roleKw);
      return matchSearch && matchFilter;
    });
    return sortMembers(base, sortBy);
  }, [members, search, activeFilter, sortBy]);

  const { mvp, bugSlayer, topPerformer } = useMemo(() => getTop3(members), [members]);

  return (
    <>
      <GuildAnimations />

      <main
        style={{
          background: "#020617",
          minHeight: "100vh",
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(129,140,248,0.06) 0%, transparent 60%)",
        }}
      >
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section
          className="py-16 px-6 text-center"
          style={{
            background:
              "linear-gradient(180deg, rgba(251,191,36,0.05) 0%, transparent 100%)",
          }}
        >
          <div className="max-w-2xl mx-auto">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.25)",
              }}
            >
              <span
                style={{
                  color: "#F59E0B",
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.22em",
                }}
              >
                {hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "0.06em",
                background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: 12,
              }}
            >
              {hero.heroTitle1}
              <span style={{ color: "#F59E0B" }}>{hero.heroHighlight}</span>
              {hero.heroTitle2}
            </h1>

            {/* Description */}
            <p
              style={{
                color: "#64748B",
                fontSize: 15,
                lineHeight: 1.8,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {hero.heroDesc}
            </p>

            {/* Stats bar */}
            <div
              className="flex items-center justify-center gap-8 mt-8 flex-wrap"
            >
              {[
                { label: "MEMBERS", value: members.length },
                { label: "MISSIONS", value: members.reduce((s, m) => s + ((m.missions as number) ?? 0), 0) },
                { label: "TEAMS", value: new Set(members.map((m) => m.team as string)).size },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#F59E0B",
                      textShadow: "0 0 12px rgba(245,158,11,0.5)",
                    }}
                  >
                    {value.toLocaleString()}
                  </div>
                  <div
                    style={{
                      color: "#475569",
                      fontSize: 9,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.18em",
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hall of Fame ──────────────────────────────────────────────── */}
        <section className="px-6 pb-10">
          <div className="max-w-6xl mx-auto">
            <HallOfFame
              mvp={mvp}
              bugSlayer={bugSlayer}
              topPerformer={topPerformer}
              locale={locale}
            />
          </div>
        </section>

        {/* ── Filters + Search ─────────────────────────────────────────── */}
        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto space-y-4">
            <RoleFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              labels={filterLabels}
            />
            <SearchSortBar
              searchQuery={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              tSearchPlaceholder={t("searchPlaceholder")}
              tSortByLevelDesc={t("sortByLevelDesc")}
              tSortByLevelAsc={t("sortByLevelAsc")}
              tSortByRankDesc={t("sortByRankDesc")}
              tSortByRankAsc={t("sortByRankAsc")}
              tSortByTeam={t("sortByTeam")}
            />
          </div>
        </section>

        {/* ── Member Grid ──────────────────────────────────────────────── */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#334155",
                  padding: "5rem 2rem",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 14, letterSpacing: "0.1em" }}>
                  — NO OPERATIVES FOUND —
                </p>
                <p style={{ fontSize: 11, marginTop: 8, color: "#1F2937" }}>
                  Adjust your search parameters and try again.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                {filtered.map((member, i) => (
                  <MemberCard
                    key={member.id as string | number}
                    member={member}
                    index={i}
                    locale={locale}
                  />
                ))}
              </div>
            )}

            {/* Footer ornament */}
            <div className="text-center mt-16">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 20px",
                  background: "rgba(129,140,248,0.05)",
                  border: "1px solid rgba(129,140,248,0.2)",
                  borderRadius: 9999,
                }}
              >
                <span style={{ color: "#818CF8", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
                  ✦ {filtered.length} / {members.length} OPERATIVES ON DUTY ✦
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
