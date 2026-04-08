"use client";

/**
 * TeamMemberClient — Guild-styled member detail page
 * Upgraded to match FE design with LED effects, rank animations, skills, stats.
 */

import { useState, useEffect, CSSProperties } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
  ArrowLeft, Crown, Zap, Target, Trophy, Award,
  Star, Shield, Briefcase, MapPin,
} from "lucide-react";

type MemberRecord = Record<string, unknown>;
type RelatedRecord = Record<string, unknown>;

// ── Rank config ───────────────────────────────────────────────────────────
const RANKS: Record<string, {
  label: string; color: string; glowColor: string;
  gradientFrom: string; gradientTo: string;
}> = {
  Diamond: { label: "DIAMOND", color: "#818CF8", glowColor: "rgba(129,140,248,0.4)", gradientFrom: "#818CF8", gradientTo: "#7DD3FC" },
  Ruby:    { label: "RUBY",    color: "#EF4444", glowColor: "rgba(239,68,68,0.4)",    gradientFrom: "#EF4444", gradientTo: "#F87171" },
  Platinum:{ label: "PLATINUM",color: "#14B8A6", glowColor: "rgba(20,184,166,0.4)",  gradientFrom: "#14B8A6", gradientTo: "#2DD4BF" },
  Gold:    { label: "GOLD",    color: "#FFD700", glowColor: "rgba(255,215,0,0.4)",   gradientFrom: "#FFD700", gradientTo: "#FDE047" },
  Silver:  { label: "SILVER",  color: "#CBD5E1", glowColor: "rgba(203,213,225,0.3)",gradientFrom: "#CBD5E1", gradientTo: "#E2E8F0" },
  Bronze:  { label: "BRONZE",  color: "#CD7F32", glowColor: "rgba(205,127,50,0.4)", gradientFrom: "#CD7F32", gradientTo: "#D97706" },
  Iron:    { label: "IRON",    color: "#9CA3AF", glowColor: "rgba(156,163,175,0.3)",gradientFrom: "#9CA3AF", gradientTo: "#D1D5DB" },
};

// ── Box-shadow animations per rank ────────────────────────────────────────
const BOX_ANIM: Record<string, string | undefined> = {
  Diamond:  "guildDiamondSpectral 3.5s ease-in-out infinite",
  Gold:     "guildGoldGlow 2s ease-in-out infinite",
  Silver:   "guildSilverPulse 2s ease-in-out infinite",
  Bronze:   "guildBronzeFlow 2.5s ease-in-out infinite",
  Ruby:     "guildHeartbeat 1.1s ease-in-out infinite",
  Platinum: "guildPlatinumPulse 1.8s ease-in-out infinite",
};

// ── CSS keyframes ────────────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes guildSilverPulse {
    0%,100% { box-shadow: 0 0 8px rgba(203,213,225,0.25), 0 0 20px rgba(203,213,225,0.08); }
    50%      { box-shadow: 0 0 18px rgba(203,213,225,0.55), 0 0 40px rgba(203,213,225,0.18); }
  }
  @keyframes guildBronzeFlow {
    0%,100% { box-shadow: 0 0 10px rgba(205,127,50,0.35), 0 0 25px rgba(205,127,50,0.12); }
    50%      { box-shadow: 0 0 18px rgba(205,127,50,0.65), 0 0 45px rgba(205,127,50,0.22); }
  }
  @keyframes guildGoldGlow {
    0%,100% { box-shadow: 0 0 14px rgba(255,215,0,0.5), 0 0 35px rgba(255,215,0,0.2), 0 0 60px rgba(255,215,0,0.06); }
    50%      { box-shadow: 0 0 24px rgba(255,215,0,0.85), 0 0 55px rgba(255,215,0,0.35), 0 0 90px rgba(255,215,0,0.12); }
  }
  @keyframes guildPlatinumPulse {
    0%,100% { box-shadow: 0 0 15px rgba(20,184,166,0.5), 0 0 45px rgba(139,92,246,0.25), 0 0 70px rgba(20,184,166,0.08); }
    50%      { box-shadow: 0 0 28px rgba(20,184,166,0.8), 0 0 65px rgba(139,92,246,0.45), 0 0 110px rgba(20,184,166,0.15); }
  }
  @keyframes guildHeartbeat {
    0%,100% { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
    14%      { box-shadow: 0 0 28px rgba(239,68,68,0.95), 0 0 70px rgba(239,68,68,0.45), 0 0 110px rgba(239,68,68,0.12); }
    28%      { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
    42%      { box-shadow: 0 0 20px rgba(239,68,68,0.75), 0 0 55px rgba(239,68,68,0.35); }
    70%      { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
  }
  @keyframes guildDiamondSpectral {
    0%   { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); }
    33%  { box-shadow: 0 0 40px rgba(125,211,252,0.78), 0 0 90px rgba(240,171,252,0.32), 0 0 155px rgba(255,255,255,0.13); }
    66%  { box-shadow: 0 0 34px rgba(240,171,252,0.68), 0 0 78px rgba(129,140,248,0.34), 0 0 138px rgba(125,211,252,0.12); }
    100% { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); }
  }
  @keyframes guildBoostRipple {
    0%   { opacity: 1; transform: scale(0.85); }
    100% { opacity: 0; transform: scale(1.05); }
  }
`;

// ── Animated counter ────────────────────────────────────────────────────
function Counter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  const startAnim = () => {
    if (started) return;
    setStarted(true);
    const duration = 1200;
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (current >= steps) {
        clearInterval(timer);
        setDisplay(value);
      }
    }, stepDuration);
  };

  return (
    <span
      suppressHydrationWarning
      onMouseEnter={startAnim}
      onClick={startAnim}
    >
      {started ? display.toLocaleString() : "0"}
    </span>
  );
}

// ── Corner decorations ───────────────────────────────────────────────────
function CornerDeco({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const s: CSSProperties = { borderColor: color, opacity, transition: "opacity 0.25s ease" };
  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r pointer-events-none" style={{ ...s, zIndex: 15 }} />
    </>
  );
}

// ── LED Runner border ───────────────────────────────────────────────────
function LEDRunner({ color }: { color: string }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPhase(p => (p + 1) % 4), 600);
    return () => clearInterval(iv);
  }, []);
  const segments = [
    { top: 0,    left: 0,  width: "100%", height: 2,  gradient: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)` },
    { top: 0,    right: 0, height: "100%", width: 2, gradient: `linear-gradient(180deg, transparent 0%, ${color} 50%, transparent 100%)` },
    { bottom: 0, left: 0,  width: "100%", height: 2, gradient: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)` },
    { top: 0,    left: 0,  height: "100%", width: 2, gradient: `linear-gradient(180deg, transparent 0%, ${color} 50%, transparent 100%)` },
  ];
  return (
    <>
      {segments.map((seg, i) => (
        <div key={i} className="absolute pointer-events-none overflow-hidden">
          <div style={{
            position: "absolute",
            ...seg,
            background: seg.gradient,
            opacity: phase === i ? 1 : 0,
            transition: "opacity 0.15s",
            filter: `blur(1px)`,
          }} />
        </div>
      ))}
    </>
  );
}

// ── Section header ──────────────────────────────────────────────────────
function SectionHead({ icon: Icon, label, color = DS.blue }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${color}18`,
        border: `1px solid ${color}35`,
        display: "grid", placeItems: "center",
      }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span style={{
        color: DS.text4, fontSize: 10,
        fontFamily: DS.mono, letterSpacing: "0.25em",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}20, transparent)` }} />
    </div>
  );
}

// ── Skill bar ───────────────────────────────────────────────────────────
function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [animated, setAnimated] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em" }}>
          {label.toUpperCase()}
        </span>
        <span style={{ color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
          <span
            onMouseEnter={() => setAnimated(true)}
            onClick={() => setAnimated(true)}
          >
            {animated ? <Counter value={value} /> : "0"}%
          </span>
        </span>
      </div>
      <div style={{ height: 4, background: DS.bgCard2, borderRadius: 2, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: animated ? `${value}%` : "0%" }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 6px ${color}80`,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export function TeamMemberClient({
  locale,
  member,
  expertises,
  related,
  tLabel,
  tRelated,
  tBack,
  tChallenge,
  tSolution,
  tResult,
}: {
  locale: string;
  member: MemberRecord;
  expertises: string[];
  related: RelatedRecord[];
  tLabel: string;
  tRelated: string;
  tBack: string;
  tChallenge: string;
  tSolution: string;
  tResult: string;
}) {
  const [hovered, setHovered] = useState(false);

  const name       = (member.name as string) ?? "Unknown";
  const role       = (member.role as string) ?? "";
  const bio        = (member.bio as string) ?? "";
  const image      = (member.image as string) ?? "";
  const rank       = (member.rank as string) ?? "Iron";
  const level      = (member.level as number | undefined);
  const lpBalance  = (member.availableLp as number | undefined) ?? (member.lpBalance as number | undefined);
  const currentXp  = (member.currentXp as number | undefined);
  const maxXp      = (member.maxXp as number | undefined);
  const missions   = (member.missions as number | undefined);
  const skills     = (member.skills as Record<string, number> | undefined);
  const achievements = (member.achievements as string[] | undefined);
  const challenge  = (member.challenge as string | undefined) ?? "";
  const solution   = (member.solution as string | undefined) ?? "";
  const result_    = (member.result as string | undefined) ?? "";

  const cfg = RANKS[rank] ?? RANKS.Iron;
  const xpPct = (currentXp !== undefined && maxXp !== undefined && maxXp > 0)
    ? Math.round((currentXp / maxXp) * 100)
    : 0;

  const skillEntries = skills ? Object.entries(skills).slice(0, 8) : [];

  return (
    <>
      <style>{ANIM_CSS}</style>
      <style>{`
        .member-detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .member-detail-grid {
            grid-template-columns: 320px 1fr;
          }
          .member-sidebar {
            position: sticky;
            top: 100px;
          }
        }
        @media (max-width: 1023px) {
          .member-sidebar {
            position: static;
          }
        }
      `}</style>
      <main style={{ background: DS.bg, minHeight: "100vh" }}>

        {/* ── Background grid ── */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.05,
            backgroundImage: "radial-gradient(#1F2937 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "60%",
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${cfg.glowColor}, transparent)`,
            opacity: 0.06,
          }} />
        </div>

        {/* ── Navigation ── */}
        <nav style={{
          position: "relative", zIndex: 50,
          padding: "24px 2rem",
          borderBottom: `1px solid ${DS.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link
            href={`/${locale}/team`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              color: DS.text4, textDecoration: "none",
              fontSize: 12, fontFamily: DS.mono,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.blue; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
          >
            <ArrowLeft size={16} />
            RETURN_TO_BASE
          </Link>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.3em", color: DS.border2,
          }}>
            <span>MEMBER_PROFILE</span>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px #22C55E" }} />
            <span>LVL_{level ?? "?"}</span>
          </div>
        </nav>

        {/* ── Main content ── */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "48px 2rem 80px" }}>

          {/* 2-column layout: sidebar + content */}
          <div className="member-detail-grid">

            {/* ══════ LEFT SIDEBAR ══════ */}
            <div className="member-sidebar">

              {/* Avatar card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ borderRadius: 14, position: "relative" }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
              >
                {/* Ambient glow ring */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    boxShadow: `0 0 ${hovered ? 60 : 30}px ${cfg.glowColor}`,
                    opacity: hovered ? 1 : 0.55,
                    borderRadius: 14,
                    transition: "box-shadow 0.35s ease, opacity 0.35s ease",
                  }}
                />

                {/* Card body */}
                <div
                  style={{
                    backgroundColor: DS.bgCard,
                    border: `1px solid ${cfg.color}40`,
                    borderRadius: 14,
                    position: "relative",
                    overflow: "hidden",
                    animation: BOX_ANIM[rank] ?? undefined,
                  }}
                >
                  {/* Avatar image */}
                  <div style={{ position: "relative", paddingBottom: "115%" }}>
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="absolute inset-0"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "13px 13px 0 0" }}
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: DS.bgCard, borderRadius: "13px 13px 0 0" }}
                      >
                        <span style={{ color: DS.border2, fontSize: "4rem", fontWeight: 900 }}>
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Bottom gradient */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: "linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.5) 30%, transparent 60%)",
                        borderRadius: "13px 13px 0 0",
                      }}
                    />
                    {/* Rank badge top-right */}
                    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 20 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: `${cfg.color}18`,
                        border: `1px solid ${cfg.color}40`,
                        backdropFilter: "blur(4px)",
                      }}>
                        <span style={{ color: cfg.color, fontSize: 10 }}>
                          {rank === "Diamond" ? "✦" : "◈"}
                        </span>
                        <span style={{ color: cfg.color, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", fontWeight: 700 }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    {/* Level bottom-left */}
                    <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 20, display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontFamily: DS.heading, color: cfg.color, fontSize: 22, fontWeight: 700, lineHeight: 1, textShadow: `0 0 16px ${cfg.glowColor}` }}>
                        <Counter value={level ?? 1} />
                      </span>
                      <span style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.1em" }}>LVL</span>
                    </div>
                    {/* Boost indicator */}
                    {hovered && (
                      <div style={{
                        position: "absolute", bottom: 12, right: 10, zIndex: 20,
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: `${cfg.color}20`,
                        border: `1px solid ${cfg.color}50`,
                        animation: "guildHeartbeat 0.5s ease-in-out infinite",
                      }}>
                        <span style={{ color: cfg.color, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                          ⚡ BOOST
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info panel */}
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{
                      fontFamily: DS.heading, color: DS.text,
                      fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", lineHeight: 1.3,
                      marginBottom: 4,
                    }}>
                      {name}
                    </div>
                    <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.06em", marginBottom: 12 }}>
                      ◎ {role}
                    </div>

                    {/* XP bar */}
                    {currentXp !== undefined && maxXp !== undefined && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 9, fontFamily: DS.mono }}>
                          <span style={{ color: cfg.color }}>
                            XP <Counter value={xpPct} />%
                          </span>
                          <span style={{ color: DS.text5 }}>
                            {currentXp}/{maxXp}
                          </span>
                        </div>
                        <div style={{ height: 3, background: DS.bgCard2, borderRadius: 2, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPct}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                            style={{
                              height: "100%",
                              background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                              boxShadow: `0 0 6px ${cfg.glowColor}`,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* LP balance */}
                    {lpBalance !== undefined && (
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: `${cfg.color}08`,
                        border: `1px solid ${cfg.color}20`,
                        marginBottom: 12,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ color: cfg.color, fontSize: 10 }}>◈</span>
                          <span style={{ color: DS.text4, fontSize: 8, fontFamily: DS.mono }}>LP BALANCE</span>
                        </div>
                        <span style={{ color: cfg.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                          <Counter value={lpBalance} />
                        </span>
                      </div>
                    )}

                    {/* View full profile button */}
                    <Link
                      href={`/${locale}/team`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "100%", padding: "8px",
                        borderRadius: 8,
                        background: hovered ? `${cfg.color}15` : `${cfg.color}08`,
                        border: `1px solid ${hovered ? cfg.color + "60" : cfg.color + "25"}`,
                        color: hovered ? cfg.color : DS.text4,
                        fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.15em", fontWeight: 700,
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      VIEW OPERATIVE
                    </Link>
                  </div>
                </div>

                {/* LED Runner — outside overflow */}
                <LEDRunner color={cfg.color} />

                {/* Corner decorations */}
                <CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.5} />
              </motion.div>

              {/* ── Core stats grid ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                {[
                  { label: "RANK",    val: cfg.label,       icon: Award,    color: cfg.color },
                  { label: "MISSIONS",val: missions ?? 0,    icon: Target,   color: "#EF4444" },
                  { label: "LEVEL",   val: level ?? 0,       icon: Star,     color: "#F59E0B" },
                  { label: "XP TOTAL", val: currentXp ?? 0,   icon: Zap,      color: DS.blue },
                ].map(s => (
                  <div key={s.label} style={{
                    background: `${DS.bgCard}80`,
                    border: `1px solid ${DS.border}`,
                    borderRadius: 10,
                    padding: "12px",
                    transition: "border-color 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <s.icon size={10} style={{ color: s.color }} />
                      <span style={{ color: DS.text4, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.15em" }}>{s.label}</span>
                    </div>
                    <div style={{ color: DS.text, fontSize: 14, fontFamily: DS.heading, fontWeight: 700, textTransform: "uppercase" }}>
                      <Counter value={s.val as number} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Expertise */}
              {expertises.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <SectionHead icon={Shield} label="EXPERTISE" color={DS.purple} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {expertises.map((exp, i) => (
                      <span key={i} style={{
                        padding: "4px 10px",
                        borderRadius: 9999,
                        background: `${DS.purple}12`,
                        border: `1px solid ${DS.purple}30`,
                        color: DS.purple,
                        fontSize: 10, fontFamily: DS.mono,
                      }}>
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ══════ RIGHT CONTENT ══════ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* ── Bio & role ── */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ background: `${DS.bgCard}60`, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28 }}
              >
                <SectionHead icon={Star} label="OPERATIVE_MANIFEST" color={cfg.color} />
                <blockquote style={{
                  fontSize: "1.125rem", fontFamily: DS.heading,
                  color: DS.text, lineHeight: 1.7,
                  borderLeft: `3px solid ${cfg.color}50`,
                  paddingLeft: 20, marginBottom: 20,
                  fontStyle: "italic",
                }}>
                  "{bio}"
                </blockquote>
                {/* Expertise */}
                {expertises.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {expertises.map((exp, i) => (
                      <span key={i} style={{
                        padding: "4px 10px",
                        background: DS.bgCard2,
                        border: `1px solid ${DS.border}`,
                        borderRadius: 6,
                        color: DS.text3,
                        fontSize: 10, fontFamily: DS.mono,
                      }}>
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* ── Skills ── */}
              {skillEntries.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ background: `${DS.bgCard}60`, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28 }}
                >
                  <SectionHead icon={Shield} label="SKILL_ARCHITECTURE" color={cfg.color} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                    {skillEntries.map(([skill, val]) => (
                      <SkillBar key={skill} label={skill} value={val} color={cfg.color} />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── Challenge / Solution / Result ── */}
              {(challenge || solution || result_) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}
                >
                  {challenge && (
                    <div style={{ background: DS.bgCard, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 16, padding: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 4, height: 18, background: "#EF4444", borderRadius: 2 }} />
                        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>{tChallenge.toUpperCase()}</span>
                      </div>
                      <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{challenge}</p>
                    </div>
                  )}
                  {solution && (
                    <div style={{ background: DS.bgCard, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 16, padding: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 4, height: 18, background: DS.blue, borderRadius: 2 }} />
                        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>{tSolution.toUpperCase()}</span>
                      </div>
                      <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{solution}</p>
                    </div>
                  )}
                  {result_ && (
                    <div style={{ background: DS.bgCard, border: `1px solid rgba(20,184,166,0.2)`, borderRadius: 16, padding: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 4, height: 18, background: DS.cyan, borderRadius: 2 }} />
                        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>{tResult.toUpperCase()}</span>
                      </div>
                      <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{result_}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Achievements ── */}
              {achievements && achievements.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ background: `${DS.bgCard}60`, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28 }}
                >
                  <SectionHead icon={Trophy} label="TROPHY_VAULT" color={cfg.color} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {achievements.map((ach, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px",
                        background: `${DS.bgCard}`,
                        border: `1px solid ${cfg.color}20`,
                        borderRadius: 10,
                        transition: "border-color 0.15s",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: `${cfg.color}15`,
                          border: `1px solid ${cfg.color}30`,
                          display: "grid", placeItems: "center", flexShrink: 0,
                        }}>
                          <Trophy size={12} style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <div style={{ color: DS.text2, fontSize: 11, fontFamily: DS.mono, lineHeight: 1.4 }}>{ach}</div>
                          <div style={{ color: DS.border2, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.1em", marginTop: 2 }}>VERIFIED</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── Related members ── */}
              {related.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{ background: `${DS.bgCard}60`, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28 }}
                >
                  <SectionHead icon={Briefcase} label={tRelated.toUpperCase()} color={DS.blue} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
                    {related.map((rel) => (
                      <Link key={rel.id as string} href={`/${locale}/team/${rel.slug as string}`} style={{ textDecoration: "none" }}>
                        <motion.div
                          whileHover={{ y: -4 }}
                          style={{
                            background: DS.bgCard,
                            border: `1px solid ${DS.border}`,
                            borderRadius: 14,
                            overflow: "hidden",
                            transition: "border-color 0.15s",
                          }}
                        >
                          <div style={{ height: 150, background: DS.bgCard2, overflow: "hidden" }}>
                            {(rel.image as string) ? (
                              <img
                                src={rel.image as string}
                                alt={rel.name as string}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <div style={{
                                width: "100%", height: "100%", display: "grid", placeItems: "center",
                                color: DS.text5, fontSize: "2rem", fontWeight: 900,
                              }}>
                                {(rel.name as string).charAt(0)}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: "10px 12px" }}>
                            <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{rel.name as string}</div>
                            <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono }}>{rel.role as string}</div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── Back CTA ── */}
              <div style={{ textAlign: "center" }}>
                <Link
                  href={`/${locale}/team`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "12px 28px", borderRadius: 12,
                    background: GRD.primary, color: "#fff",
                    textDecoration: "none", fontWeight: 700, fontSize: 13,
                    boxShadow: "0 0 30px rgba(129,140,248,0.3)",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  <ArrowLeft size={16} />
                  {tBack}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
