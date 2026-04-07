"use client";

/**
 * TeamGuildClient — Full guild-styled team page
 * Matches FE design from FE/src/app/Home.tsx
 *
 * Sections (top to bottom):
 * 1. Hero        → eyebrow badge + gradient heading + desc + 2 CTA + 4 KPI cards
 * 2. HallOfFame  → top-3 member cards (diamond/ruby/gold)
 * 3. Rank Strip  → 7-rank clickable distribution grid
 * 4. Filters     → RoleFilters + SearchSortBar
 * 5. MemberGrid  → 2 rows × 4 cols with rank entrance animations
 * 6. RankLegend  → 7 rank badge cards with LP/level info
 * 7. CTA Banner  → call-to-action section
 */
import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { MemberCard } from "./MemberCard";
import { HallOfFame } from "./HallOfFame";
import { RoleFilters, type RoleFilter } from "./RoleFilters";
import { SearchSortBar, type SortOption } from "./SearchSortBar";
import { GuildAnimations } from "./GuildAnimations";
import { RANKS, normalizeRank, formatLP, type RankKey } from "./guildMemberData";
import { Shield, Users, Trophy, ChevronRight, ArrowRight } from "lucide-react";
import { DS } from "@/lib/design-tokens";

type MemberRecord = Record<string, unknown>;

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtLP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getRoleCategory(m: MemberRecord): RoleFilter {
  const c = ((m.roleCode as string) ?? "").toUpperCase();
  if (c === "PM") return "PM";
  if (c === "PO") return "PO";
  if (c === "CEO" || c === "MAP") return "CEO";
  if (c === "SC" || c === "SHIELD") return "SC";
  if (c === "HR") return "HR";
  if (c === "MKT") return "MKT";
  if (c === "DESIGNER" || c === "STAFF") return "DESIGNER";
  if (["BOW", "DAGGER", "DUAL", "DEV_FE", "DEV_BE", "DEV_FS", "QA", "DATA"].includes(c)) return "DEV";
  return "all";
}

// ── Section Divider ──────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #1F2937)" }} />
      <div className="flex items-center gap-2">
        <span style={{ color: "#3B82F6", fontSize: 8 }}>◈</span>
        <span style={{ color: "#64748B", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.25em" }}>{label}</span>
        <span style={{ color: "#3B82F6", fontSize: 8 }}>◈</span>
      </div>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #1F2937, transparent)" }} />
    </div>
  );
}

// ── Rank Legend ────────────────────────────────────────────────────────────
function RankLegend() {
  const rankKeys: RankKey[] = ["iron", "bronze", "silver", "gold", "platinum", "ruby", "diamond"];
  return (
    <div className="mt-20 mb-8">
      <SectionDivider label="BẢNG XẾP HẠNG RANK" />
      <div className="flex items-stretch justify-center flex-wrap gap-3">
        {rankKeys.map((r) => {
          const cfg = RANKS[r];
          return (
            <div
              key={r}
              className="flex flex-col gap-1.5 px-4 py-3 rounded-xl"
              style={{ background: "#0F172A", border: `1px solid ${cfg.color}22`, minWidth: 100 }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: cfg.color, fontSize: 14, textShadow: `0 0 8px ${cfg.glowColor}` }}>{cfg.symbol}</span>
                <span style={{ color: cfg.color, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", fontWeight: 700 }}>{cfg.label}</span>
              </div>
              <div style={{ color: "#64748B", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
                Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}
              </div>
              <div style={{ color: "#64748B", fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                {formatLP(cfg.lpPerLevel)} LP/cấp
              </div>
              <div className="h-px rounded-full mt-1" style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CTA Banner ─────────────────────────────────────────────────────────────
function CTABanner({ locale }: { locale: string }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-10 text-center mt-20"
      style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.15), rgba(129,140,248,0.1))", border: "1px solid rgba(129,140,248,0.2)" }}
    >
      <div
        style={{
          position: "absolute", top: "-30%", left: "20%", width: "60%", height: "160%",
          background: "radial-gradient(ellipse, rgba(129,140,248,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div style={{ height: 1, width: 50, background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.5)" }} />
          <Trophy size={14} style={{ color: "#F59E0B" }} />
          <div style={{ height: 1, width: 50, background: "linear-gradient(90deg, rgba(129,140,248,0.5), transparent)" }} />
        </div>
        <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 900, background: "linear-gradient(135deg, #FFFFFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
          Sẵn sàng làm việc cùng đội ngũ đỉnh cao?
        </h2>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.8, maxWidth: 500, margin: "0 auto 28px" }}>
          Dù bạn là khách hàng hay nhân tài muốn gia nhập — LOOP Solutions luôn chào đón những người cùng chí hướng.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href={`/${locale}/booking`}
            style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", fontSize: 14, fontWeight: 700, padding: "12px 28px", borderRadius: 12, textDecoration: "none", boxShadow: "0 0 28px rgba(129,140,248,0.4)", display: "flex", alignItems: "center", gap: 8 }}
          >
            Nhận báo giá Website <ChevronRight size={15} />
          </Link>
          <Link
            href={`/${locale}/contact`}
            style={{ color: "#64748B", fontSize: 14, padding: "11px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none" }}
          >
            Liên hệ ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ── Rank Distribution Strip ──────────────────────────────────────────────────
type RankFilterValue = RankKey | "all";

function RankStrip({ members, active, onChange }: { members: MemberRecord[]; active: RankFilterValue; onChange: (r: RankFilterValue) => void }) {
  const rankKeys: RankKey[] = ["iron", "bronze", "silver", "gold", "platinum", "ruby", "diamond"];
  const countPerRank = rankKeys.reduce((acc, r) => ({ ...acc, [r]: members.filter((m) => normalizeRank(m.rank as string) === r).length }), {} as Record<RankKey, number>);
  const lpPerRank = rankKeys.reduce((acc, r) => ({ ...acc, [r]: members.filter((m) => normalizeRank(m.rank as string) === r).reduce((s, m) => s + ((m.availableLp as number) ?? 0), 0) }), {} as Record<RankKey, number>);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-5" style={{ color: "#64748B", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>
        <div style={{ width: 24, height: 1, background: "#1F2937" }} />
        PHÂN BỔ RANK · BẤM ĐỂ LỌC
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #1F2937, transparent)" }} />
        {active !== "all" && (
          <button
            onClick={() => onChange("all")}
            style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: 4 }}
          >
            <span style={{ color: "#3B82F6" }}>×</span> Bỏ lọc
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {rankKeys.map((rk, idx) => {
          const cfg = RANKS[rk];
          const isActive = active === rk;
          const isDimmed = active !== "all" && !isActive;
          return (
            <motion.button
              key={rk}
              onClick={() => onChange(isActive ? "all" : rk)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isDimmed ? 0.4 : 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="relative rounded-xl p-3 text-left cursor-pointer"
              style={{
                background: isActive ? `linear-gradient(135deg, ${cfg.gradientFrom}20, ${cfg.gradientTo}10)` : "rgba(15,23,42,0.6)",
                border: `1px solid ${isActive ? cfg.color + "70" : cfg.color + "18"}`,
                boxShadow: isActive ? `0 0 20px ${cfg.glowColor}, 0 4px 20px rgba(0,0,0,0.3)` : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ color: cfg.color, fontSize: 18, lineHeight: 1, textShadow: isActive ? `0 0 12px ${cfg.glowColor}` : "none", marginBottom: 4 }}>{cfg.symbol}</div>
              <div style={{ color: isActive ? cfg.color : "#64748B", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 6 }}>{cfg.label}</div>
              <div style={{ color: "#FFFFFF", fontFamily: DS.heading, fontSize: 20, fontWeight: 700, lineHeight: 1, textShadow: isActive ? `0 0 10px ${cfg.glowColor}` : "none" }}>{countPerRank[rk]}</div>
              <div style={{ color: "#64748B", fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", marginBottom: 6 }}>thành viên</div>
              <div style={{ color: cfg.color, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, opacity: 0.85 }}>{fmtLP(lpPerRank[rk])}</div>
              <div style={{ color: "#64748B", fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}>LP earned</div>
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${cfg.color}15` }}>
                <div style={{ color: "#64748B", fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                  Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}
                </div>
              </div>
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
                  style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
                  layoutId="rankBar"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Hex Pattern Background ───────────────────────────────────────────────────
function HexPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.02 }}>
      <defs>
        <pattern id="hexTeam" width="40" height="46" patternUnits="userSpaceOnUse">
          <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexTeam)" />
    </svg>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────
interface HeroSectionProps {
  members: MemberRecord[];
  hero: TeamGuildClientProps["hero"];
  locale: string;
}

function HeroSection({ members, hero, locale }: HeroSectionProps) {
  const totalLP = members.reduce((s, m) => s + ((m.availableLp as number) ?? 0), 0);
  const totalAchievements = members.reduce((s, m) => s + ((m.achievements as string[])?.length ?? 0), 0);

  const kpis = [
    { label: "Thành viên đang hoạt động", value: `${members.length}`, suffix: " operative", color: "#3B82F6" },
    { label: "Tổng LP lưu thông", value: fmtLP(totalLP), suffix: " LP", color: "#818CF8" },
    { label: "Thành tích guild", value: String(totalAchievements), suffix: " trophy", color: "#F59E0B" },
    { label: "Thành viên Diamond", value: String(members.filter(m => normalizeRank(m.rank as string) === "diamond").length), suffix: " star", color: "#06B6D4" },
  ];

  return (
    <section className="relative pt-28 pb-20 px-6 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        style={{ position: "absolute", top: "-10%", left: "-8%", width: "55%", height: "55%", background: "radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ position: "absolute", top: "30%", right: "-5%", width: "45%", height: "45%", background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }}
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3B82F6", boxShadow: "0 0 6px #3B82F6" }} />
            <span style={{ color: "#3B82F6", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.25em" }}>
              OPERATIVE GUILD · SEASON III · Q1/2026
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: DS.heading, letterSpacing: "0.04em", lineHeight: 1.1, marginBottom: 20 }}
          >
            <span style={{ display: "block", fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 900, background: "linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {hero.heroTitle1}
            </span>
            <span style={{ display: "block", fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 900, background: "linear-gradient(135deg, #3B82F6, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {hero.heroHighlight}{hero.heroTitle2}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: "#64748B", fontSize: 16, lineHeight: 1.8, maxWidth: 560, margin: "0 auto 40px" }}
          >
            {hero.heroDesc}
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              href={`/${locale}/booking`}
              style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", fontSize: 14, fontWeight: 700, padding: "12px 28px", borderRadius: 12, textDecoration: "none", boxShadow: "0 0 32px rgba(129,140,248,0.45)", display: "flex", alignItems: "center", gap: 8 }}
            >
              Làm việc cùng chúng tôi <ArrowRight size={15} />
            </Link>
            <Link
              href={`/${locale}/admin`}
              style={{ color: "#64748B", fontSize: 13, padding: "11px 22px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)" }}
            >
              <Shield size={13} style={{ color: "#64748B" }} /> Admin Panel
            </Link>
          </motion.div>
        </div>

        {/* KPI row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              className="rounded-2xl p-5 text-center relative overflow-hidden"
              whileHover={{ borderColor: `${k.color}50`, boxShadow: `0 0 24px ${k.color}15` }}
              transition={{ delay: 0.55 + i * 0.06 }}
              style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${k.color}20`, backdropFilter: "blur(12px)" }}
            >
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${k.color}06, transparent 60%)`, pointerEvents: "none" }} />
              <div style={{ color: k.color, fontFamily: DS.heading, fontSize: 28, fontWeight: 700, textShadow: `0 0 16px ${k.color}50`, lineHeight: 1 }}>
                {k.value}<span style={{ fontSize: 12 }}>{k.suffix}</span>
              </div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>{k.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
interface TeamGuildClientProps {
  locale: string;
  members: MemberRecord[];
  hero: {
    badge: string;
    heroTitle1: string;
    heroHighlight: string;
    heroTitle2: string;
    heroDesc: string;
  };
}

export function TeamGuildClient({ locale, members, hero }: TeamGuildClientProps) {
  const t = useTranslations("TeamPage");

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankKey | "all">("all");
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("level-desc");

  // Inject guild CSS animations once
  useEffect(() => {
    const keyframes = `
      @keyframes guildFloatParticle { 0% { transform: translateY(0) scale(1); opacity: 0; } 10% { opacity: 0.85; } 85% { opacity: 0.6; } 100% { transform: translateY(-320px) scale(0.2); opacity: 0; } }
      @keyframes guildCometSweep { 0% { transform: translateX(-100%); opacity: 0; } 10% { opacity: 1; } 85% { opacity: 0.8; } 100% { transform: translateX(200%); opacity: 0; } }
      @keyframes guildElectric { 0%,100% { opacity: 0; transform: scaleX(0.4); } 50% { opacity: 0.9; transform: scaleX(1); } }
      @keyframes guildSilverPulse { 0%,100% { box-shadow: 0 0 8px rgba(203,213,225,0.25), 0 0 20px rgba(203,213,225,0.08); } 50% { box-shadow: 0 0 18px rgba(203,213,225,0.55), 0 0 40px rgba(203,213,225,0.18); } }
      @keyframes guildBronzeFlow { 0%,100% { box-shadow: 0 0 10px rgba(205,127,50,0.35), 0 0 25px rgba(205,127,50,0.12); } 50% { box-shadow: 0 0 18px rgba(205,127,50,0.65), 0 0 45px rgba(205,127,50,0.22); } }
      @keyframes guildGoldGlow { 0%,100% { box-shadow: 0 0 14px rgba(255,215,0,0.5), 0 0 35px rgba(255,215,0,0.2), 0 0 60px rgba(255,215,0,0.06); } 50% { box-shadow: 0 0 24px rgba(255,215,0,0.85), 0 0 55px rgba(255,215,0,0.35), 0 0 90px rgba(255,215,0,0.12); } }
      @keyframes guildPlatinumPulse { 0%,100% { box-shadow: 0 0 15px rgba(20,184,166,0.5), 0 0 45px rgba(139,92,246,0.25), 0 0 70px rgba(20,184,166,0.08); } 50% { box-shadow: 0 0 28px rgba(20,184,166,0.8), 0 0 65px rgba(139,92,246,0.45), 0 0 110px rgba(20,184,166,0.15); } }
      @keyframes guildHeartbeat { 0%,100% { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); } 14% { box-shadow: 0 0 28px rgba(239,68,68,0.95), 0 0 70px rgba(239,68,68,0.45), 0 0 110px rgba(239,68,68,0.12); } 28% { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); } 42% { box-shadow: 0 0 20px rgba(239,68,68,0.75), 0 0 55px rgba(239,68,68,0.35); } 70% { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); } }
      @keyframes guildDiamondSpectral { 0% { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); } 33% { box-shadow: 0 0 40px rgba(125,211,252,0.78), 0 0 90px rgba(240,171,252,0.32), 0 0 155px rgba(255,255,255,0.13); } 66% { box-shadow: 0 0 34px rgba(240,171,252,0.68), 0 0 78px rgba(129,140,248,0.34), 0 0 138px rgba(125,211,252,0.12); } 100% { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); } }
      @keyframes guildHoloShine { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    `;
    const style = document.createElement("style");
    style.id = "guild-animations";
    style.textContent = keyframes;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Role filter labels
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

  // Sort updated via useMemo deps: [members, search, roleFilter, rankFilter, sortOption]

  // Hall of Fame — diamond/ruby/gold members
  const { diamond, ruby, gold } = useMemo(() => {
    const sorted = [...members].sort(
      (a, b) => (RANKS[normalizeRank(b.rank as string)]?.tier ?? 0) - (RANKS[normalizeRank(a.rank as string)]?.tier ?? 0)
    );
    const safe = (i: number): MemberRecord =>
      sorted[i] ?? { id: i, name: "???", role: "", rank: "iron", level: 1, availableLp: 0, missions: 0 } as MemberRecord;
    return {
      diamond: members.find((m) => normalizeRank(m.rank as string) === "diamond") ?? safe(0),
      ruby: members.find((m) => normalizeRank(m.rank as string) === "ruby") ?? safe(1),
      gold: members.find((m) => normalizeRank(m.rank as string) === "gold") ?? safe(2),
    };
  }, [members]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = members.filter((m) => {
      const roleCat = getRoleCategory(m);
      if (roleFilter !== "all" && roleCat !== roleFilter) return false;
      if (rankFilter !== "all" && normalizeRank(m.rank as string) !== rankFilter) return false;
      if (q) {
        const name = ((m.name as string) ?? "").toLowerCase();
        const role = ((m.role as string) ?? "").toLowerCase();
        const team = ((m.team as string) ?? "").toLowerCase();
        if (!name.includes(q) && !role.includes(q) && !team.includes(q)) return false;
      }
      return true;
    });
    // Sort
    return [...list].sort((a, b) => {
      const idA = String(a.id ?? "");
      const idB = String(b.id ?? "");
      if (sortOption === "level-desc") return ((b.level as number) ?? 0) - ((a.level as number) ?? 0) || idA.localeCompare(idB);
      if (sortOption === "level-asc") return ((a.level as number) ?? 0) - ((b.level as number) ?? 0) || idA.localeCompare(idB);
      if (sortOption === "rank-desc") return (RANKS[normalizeRank(b.rank as string)]?.tier ?? 0) - (RANKS[normalizeRank(a.rank as string)]?.tier ?? 0) || idA.localeCompare(idB);
      if (sortOption === "rank-asc") return (RANKS[normalizeRank(a.rank as string)]?.tier ?? 0) - (RANKS[normalizeRank(b.rank as string)]?.tier ?? 0) || idA.localeCompare(idB);
      if (sortOption === "team") return ((a.team as string) ?? "").localeCompare((b.team as string) ?? "") || idA.localeCompare(idB);
      return idA.localeCompare(idB);
    });
  }, [members, search, roleFilter, rankFilter, sortOption]);

  const isFiltered = roleFilter !== "all" || rankFilter !== "all" || !!search;
  const row1 = filtered.slice(0, 4);
  const row2 = filtered.slice(4);

  return (
    <>
      <GuildAnimations />

      {/* Fixed background — orbs + hex pattern (matches FE Home.tsx) */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* Blue orb top-left */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-15%",
            width: "60%",
            height: "70%",
            background: "radial-gradient(circle, rgba(29,78,216,0.09) 0%, transparent 65%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        {/* Purple orb bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-10%",
            width: "55%",
            height: "65%",
            background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 65%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        <HexPattern />
      </div>

      <main
        style={{
          background: "transparent",
          minHeight: "100vh",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Hero ── */}
        <HeroSection members={members} hero={hero} locale={locale} />

        <div className="max-w-7xl mx-auto px-6 pb-24">

          {/* ── Hall of Fame ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionDivider label="HALL OF FAME · HUYỀN THOẠI GUILD" />
            <HallOfFame
              mvp={diamond}
              bugSlayer={ruby}
              topPerformer={gold}
              locale={locale}
            />
          </motion.div>

          {/* ── Rank Distribution ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionDivider label="MA TRẬN PHÂN BỔ RANK" />
            <RankStrip members={members} active={rankFilter} onChange={setRankFilter} />
          </motion.div>

          {/* ── Filters ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div style={{ color: "#64748B", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>
                BỘ LỌC ĐỘI NGŨ
              </div>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #1F2937, transparent)" }} />
              {isFiltered && (
                <button
                  onClick={() => { setRoleFilter("all"); setRankFilter("all"); setSearch(""); }}
                  style={{ color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}
                >
                  × XÓA BỘ LỌC
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3 mb-8">
              <RoleFilters activeFilter={roleFilter} onFilterChange={setRoleFilter} labels={filterLabels} />
              <SearchSortBar
                searchQuery={search}
                onSearchChange={setSearch}
                sortBy={sortOption}
                onSortChange={setSortOption}
                tSearchPlaceholder={t("searchPlaceholder")}
                tSortByLevelDesc={t("sortByLevelDesc")}
                tSortByLevelAsc={t("sortByLevelAsc")}
                tSortByRankDesc={t("sortByRankDesc")}
                tSortByRankAsc={t("sortByRankAsc")}
                tSortByTeam={t("sortByTeam")}
              />
            </div>
          </motion.div>

          {/* ── Member Grid ── */}
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4"
              >
                <Users size={48} style={{ color: "#64748B", opacity: 0.3 }} />
                <div style={{ color: "#475569", fontSize: 15, fontFamily: "'JetBrains Mono', monospace" }}>{t("noMembersFound")}</div>
                <button
                  onClick={() => { setRoleFilter("all"); setRankFilter("all"); setSearch(""); }}
                  style={{ color: "#3B82F6", background: "none", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13 }}
                >
                  Bỏ tất cả bộ lọc
                </button>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Row 1: up to 4 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                  {row1.map((member, i) => (
                    <MemberCard key={member.id as string | number} member={member} index={i} locale={locale} />
                  ))}
                </div>
                {/* Row 2: remaining */}
                {row2.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {row2.map((member, i) => (
                      <MemberCard key={member.id as string | number} member={member} index={i + 4} locale={locale} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Rank Legend ── */}
          <RankLegend />

          {/* ── CTA Banner ── */}
          <CTABanner locale={locale} />
        </div>
      </main>
    </>
  );
}
