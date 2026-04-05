"use client";

/**
 * MemberCard — Guild-styled team member card
 * Matches FE design from FE/src/app/components/team/MemberCard.tsx
 *
 * Full gaming/guild aesthetic with:
 * - LED running border animation (LEDRunner)
 * - Rank-specific effects (gold comet, ruby sparks, platinum/ruby particles, diamond prismatic)
 * - XP bar, LP balance, hover glow
 * - Corner decorations
 */
import { useState, CSSProperties } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  RANKS,
  normalizeRank,
  formatLP,
  calcXpPct,
  BOX_SHADOW_ANIM,
  ROLE_SYMBOLS,
  type RankKey,
} from "./guildMemberData";
import { LEDRunner } from "./LEDRunner";
import { Counter } from "./Counter";
import { DS } from "@/lib/design-tokens";

type MemberRecord = Record<string, unknown>;

// ── Avatar fallback SVG ─────────────────────────────────────────────────────────
const AVATAR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%230F172A'/%3E%3Ctext x='100' y='118' font-family='system-ui' font-size='72' font-weight='700' text-anchor='middle' fill='%233B82F6'%3E%E2%9C%A8%3C/text%3E%3C/svg%3E";

/**
 * Avatar — renders an <img> with graceful onError fallback to a styled initial.
 * Props match common patterns used across TeamClient, HallOfFame, MemberCard.
 */
function Avatar({
  src,
  name,
  size = 80,
  radius = 10,
  bg = "#111827",
  color = "#374151",
  fontSize,
  objectFit = "cover",
}: {
  src: string;
  name: string;
  size?: number;
  radius?: number;
  bg?: string;
  color?: string;
  fontSize?: number;
  objectFit?: "cover" | "contain";
}) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";

  if (!src || imgError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: bg,
          display: "grid",
          placeItems: "center",
          color,
          fontSize: fontSize ?? Math.round(size * 0.4),
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit,
        flexShrink: 0,
      }}
    />
  );
}

// ── Corner decoration (rendered OUTSIDE overflow:hidden) ───────────────────
function CornerDeco({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const s: CSSProperties = { borderColor: color, opacity, transition: "opacity 0.25s ease" };
  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4 border-t-[1.5px] border-l-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-[1.5px] border-r-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[1.5px] border-l-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[1.5px] border-r-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
    </>
  );
}

// ── Rank Badge ───────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: RankKey }) {
  const cfg = RANKS[rank];
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-sm"
      style={{
        backgroundImage: `linear-gradient(135deg, ${cfg.gradientFrom}22, ${cfg.gradientTo}22)`,
        border: `1px solid ${cfg.color}55`,
        backdropFilter: "blur(4px)",
      }}
    >
      <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.symbol}</span>
      <span
        style={{
          color: cfg.color,
          fontSize: 9,
          letterSpacing: "0.15em",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ── Floating particles (platinum / ruby) ────────────────────────────────────────
const PARTICLES: Record<string, Array<{ left: string; delay: string; duration: string; size: number }>> = {
  platinum: [
    { left: "12%", delay: "0s", duration: "3.2s", size: 2 },
    { left: "28%", delay: "0.7s", duration: "2.6s", size: 1.5 },
    { left: "47%", delay: "1.4s", duration: "3.8s", size: 2 },
    { left: "66%", delay: "0.4s", duration: "2.9s", size: 1.5 },
    { left: "83%", delay: "1.1s", duration: "3.4s", size: 2 },
  ],
  ruby: [
    { left: "8%", delay: "0s", duration: "1.8s", size: 2 },
    { left: "22%", delay: "0.3s", duration: "2.1s", size: 1.5 },
    { left: "40%", delay: "0.6s", duration: "1.6s", size: 2 },
    { left: "57%", delay: "0.9s", duration: "2.3s", size: 1.5 },
    { left: "74%", delay: "0.2s", duration: "1.9s", size: 2 },
    { left: "90%", delay: "0.5s", duration: "2.0s", size: 1.5 },
  ],
};

export function Particles({ rank }: { rank: RankKey }) {
  const list = PARTICLES[rank] || [];
  const color = RANKS[rank].particleColor;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {list.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 6px 1px ${color}`,
            animation: `guildFloatParticle ${p.duration} ${p.delay} ease-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Diamond prismatic particles ──────────────────────────────────────────────
const DIAMOND_PARTICLES_LIST = [
  { left: "5%", delay: "0s", dur: "5.0s", size: 2.5, color: "#818CF8" },
  { left: "16%", delay: "1.3s", dur: "4.2s", size: 1.5, color: "#7DD3FC" },
  { left: "28%", delay: "0.5s", dur: "5.8s", size: 2.0, color: "#F0ABFC" },
  { left: "42%", delay: "2.1s", dur: "4.5s", size: 1.5, color: "#FFFFFF" },
  { left: "55%", delay: "0.9s", dur: "5.2s", size: 2.5, color: "#818CF8" },
  { left: "68%", delay: "1.7s", dur: "3.8s", size: 1.5, color: "#7DD3FC" },
  { left: "80%", delay: "0.3s", dur: "4.8s", size: 2.0, color: "#F0ABFC" },
  { left: "93%", delay: "2.4s", dur: "5.5s", size: 1.5, color: "#FFFFFF" },
];

export function DiamondParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {DIAMOND_PARTICLES_LIST.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px 2px ${p.color}`,
            animation: `guildFloatParticle ${p.dur} ${p.delay} ease-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Gold comet line ──────────────────────────────────────────────────────────
export function CometLine({ color }: { color: string }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 overflow-hidden pointer-events-none z-30"
      style={{ height: 2 }}
    >
      <div
        className="absolute top-0 h-full"
        style={{
          width: "60%",
          backgroundImage: `linear-gradient(90deg, transparent, ${color}cc, transparent)`,
          animation: "guildCometSweep 3.5s linear infinite",
        }}
      />
    </div>
  );
}

// ── Ruby electric sparks ────────────────────────────────────────────────────
export function ElectricSparks({ color }: { color: string }) {
  const sparks = [
    { top: "15%", left: "0", width: "40%", delay: "0s", dur: "0.6s" },
    { top: "35%", left: "60%", width: "40%", delay: "0.3s", dur: "0.5s" },
    { top: "55%", left: "10%", width: "30%", delay: "0.5s", dur: "0.7s" },
    { top: "75%", left: "50%", width: "35%", delay: "0.1s", dur: "0.6s" },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {sparks.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: s.top,
            left: s.left,
            width: s.width,
            height: 1,
            backgroundImage: `linear-gradient(90deg, transparent, ${color}cc, transparent)`,
            animation: `guildElectric ${s.dur} ${s.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Diamond prismatic beams ────────────────────────────────────────────────
const PRISM_BEAMS = [
  { top: "10%", delay: "0s", dur: "5.5s", color: "#818CF8", rot: "16deg" },
  { top: "35%", delay: "1.8s", dur: "4.8s", color: "#7DD3FC", rot: "-20deg" },
  { top: "60%", delay: "3.4s", dur: "6.0s", color: "#F0ABFC", rot: "24deg" },
  { top: "82%", delay: "0.9s", dur: "5.2s", color: "#FFFFFF", rot: "-14deg" },
];

export function DiamondPrism() {
  return (
    <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden">
      {PRISM_BEAMS.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: b.top,
            left: "-40%",
            width: "180%",
            height: 1,
            backgroundImage: `linear-gradient(90deg, transparent 0%, ${b.color}55 35%, ${b.color}90 50%, ${b.color}55 65%, transparent 100%)`,
            transform: `rotate(${b.rot})`,
            animation: `guildDiamondBeam ${b.dur} ${b.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── GUILD_ANIMATIONS_CSS (exported for injection) ───────────────────────────
export const GUILD_ANIMATIONS_CSS = `
  @keyframes guildFloatParticle {
    0%   { transform: translateY(0) scale(1); opacity: 0; }
    10%  { opacity: 0.85; }
    85%  { opacity: 0.6; }
    100% { transform: translateY(-320px) scale(0.2); opacity: 0; }
  }
  @keyframes guildCometSweep {
    0%   { transform: translateX(-100%); opacity: 0; }
    10%  { opacity: 1; }
    85%  { opacity: 0.8; }
    100% { transform: translateX(200%); opacity: 0; }
  }
  @keyframes guildElectric {
    0%,100% { opacity: 0; transform: scaleX(0.4); }
    50%     { opacity: 0.9; transform: scaleX(1); }
  }
  @keyframes guildSilverPulse {
    0%,100% { box-shadow: 0 0 8px rgba(203,213,225,0.25), 0 0 20px rgba(203,213,225,0.08); }
    50%     { box-shadow: 0 0 18px rgba(203,213,225,0.55), 0 0 40px rgba(203,213,225,0.18); }
  }
  @keyframes guildBronzeFlow {
    0%,100% { box-shadow: 0 0 10px rgba(205,127,50,0.35), 0 0 25px rgba(205,127,50,0.12); }
    50%     { box-shadow: 0 0 18px rgba(205,127,50,0.65), 0 0 45px rgba(205,127,50,0.22); }
  }
  @keyframes guildGoldGlow {
    0%,100% { box-shadow: 0 0 14px rgba(255,215,0,0.5), 0 0 35px rgba(255,215,0,0.2), 0 0 60px rgba(255,215,0,0.06); }
    50%     { box-shadow: 0 0 24px rgba(255,215,0,0.85), 0 0 55px rgba(255,215,0,0.35), 0 0 90px rgba(255,215,0,0.12); }
  }
  @keyframes guildPlatinumPulse {
    0%,100% { box-shadow: 0 0 15px rgba(20,184,166,0.5), 0 0 45px rgba(139,92,246,0.25), 0 0 70px rgba(20,184,166,0.08); }
    50%     { box-shadow: 0 0 28px rgba(20,184,166,0.8), 0 0 65px rgba(139,92,246,0.45), 0 0 110px rgba(20,184,166,0.15); }
  }
  @keyframes guildHeartbeat {
    0%,100% { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
    14%     { box-shadow: 0 0 28px rgba(239,68,68,0.95), 0 0 70px rgba(239,68,68,0.45), 0 0 110px rgba(239,68,68,0.12); }
    28%     { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
    42%     { box-shadow: 0 0 20px rgba(239,68,68,0.75), 0 0 55px rgba(239,68,68,0.35); }
    70%     { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
  }
  @keyframes guildDiamondSpectral {
    0%   { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); }
    33%  { box-shadow: 0 0 40px rgba(125,211,252,0.78), 0 0 90px rgba(240,171,252,0.32), 0 0 155px rgba(255,255,255,0.13); }
    66%  { box-shadow: 0 0 34px rgba(240,171,252,0.68), 0 0 78px rgba(129,140,248,0.34), 0 0 138px rgba(125,211,252,0.12); }
    100% { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); }
  }
  @keyframes guildDiamondBeam {
    0%, 12%  { opacity: 0; }
    32%, 68% { opacity: 1; }
    88%, 100% { opacity: 0; }
  }
`;

// ── Main MemberCard ────────────────────────────────────────────────────────
interface MemberCardProps {
  member: MemberRecord;
  index: number;
  locale: string;
}

export function MemberCard({ member, index, locale }: MemberCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const rankKey = normalizeRank(member.rank as string | undefined);
  const cfg = RANKS[rankKey];

  const name = (member.name as string) ?? "Unknown";
  const slug = (member.slug as string) ?? String(member.id ?? index);
  const role = (member.role as string) ?? "";
  const roleCode = (member.roleCode as string) ?? "BOW";
  const team = (member.team as string) ?? "Alpha";
  const image = (member.image as string) ?? "";
  const level = (member.level as number) ?? 1;
  const lpBalance = (member.availableLp as number) ?? 0;
  const currentXp = (member.currentXp as number) ?? 0;
  const maxXp = (member.maxXp as number) ?? 100;
  const xpPct = calcXpPct(currentXp, maxXp);

  const hasParticles = ["platinum", "ruby"].includes(rankKey);
  const hasComet = rankKey === "gold";
  const hasSparks = rankKey === "ruby";
  const hasDiamondFX = rankKey === "diamond";

  const cardStyle: CSSProperties = {
    backgroundColor: "#0F172A",
    border: `1px solid ${cfg.color}40`,
    borderRadius: 12,
    animation: BOX_SHADOW_ANIM[rankKey],
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <motion.div
      style={{ borderRadius: 12, position: "relative", willChange: "transform" }}
      whileHover={{ y: -10, scale: 1.03 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* ── Ambient glow ring ─────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: `0 0 ${hovered ? 45 : 22}px ${cfg.glowColor}`,
          opacity: hovered ? 1 : 0.55,
          borderRadius: 12,
          transition: "box-shadow 0.3s ease, opacity 0.3s ease",
        }}
      />

      {/* ── Card (overflow:hidden clips VFX) ─────────── */}
      <Link
        href={`/${locale}/team/${slug}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div style={cardStyle}>
          {hasComet && <CometLine color={cfg.color} />}
          {hasSparks && <ElectricSparks color={cfg.color} />}
          {hasParticles && <Particles rank={rankKey} />}
          {hasDiamondFX && <DiamondParticles />}
          {hasDiamondFX && <DiamondPrism />}

          {/* Avatar section */}
          <div className="relative" style={{ paddingBottom: "110%" }}>
            {image && !imgError ? (
              <img
                src={image}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ borderRadius: "10px 10px 0 0" }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "#111827", borderRadius: "10px 10px 0 0" }}
              >
                <span
                  style={{
                    color: "#374151",
                    fontSize: "3rem",
                    fontWeight: 900,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Bottom gradient fade — matches FE exactly */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 30%, rgba(15,23,42,0.15) 55%, transparent 75%)",
                borderRadius: "10px 10px 0 0",
              }}
            />

            {/* Rank badge — top right */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <RankBadge rank={rankKey} />
            </div>

            {/* Team tag — top left */}
            <div
              className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: "rgba(2,6,23,0.72)",
                border: "1px solid #1F2937",
                backdropFilter: "blur(4px)",
              }}
            >
              <span
                style={{
                  color: "#64748B",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ⬡ {team}
              </span>
            </div>

            {/* Level — bottom over image */}
            <div className="absolute bottom-3 left-3 z-20 flex items-baseline gap-1">
              <span
                style={{
                  fontFamily: DS.heading,
                  color: cfg.color,
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1,
                  textShadow: `0 0 14px ${cfg.glowColor}`,
                }}
              >
                <Counter value={level} duration={1.2} delay={0.1} />
              </span>
              <span
                style={{
                  color: "#64748B",
                  fontSize: 9,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                  marginBottom: 2,
                }}
              >
                LVL
              </span>
            </div>

            {/* LED boost indicator */}
            {hovered && (
              <div
                className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
                style={{
                  backgroundColor: `${cfg.color}20`,
                  border: `1px solid ${cfg.color}60`,
                  animation: "guildHeartbeat 0.5s ease-in-out infinite",
                }}
              >
                <span
                  style={{
                    color: cfg.color,
                    fontSize: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  ⚡ BOOST
                </span>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="px-3 pt-2 pb-3">
            {/* Name */}
            <div
              style={{
                color: "#FFFFFF",
                fontFamily: DS.heading,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </div>

            {/* Role */}
            <div
              className="mt-0.5"
              style={{
                color: "#64748B",
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
              }}
            >
              {ROLE_SYMBOLS[roleCode] ?? "◎"} {role}
            </div>

            {/* XP bar */}
            <div className="mt-2.5">
              <div
                className="flex justify-between mb-1"
                style={{ color: "#475569", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span style={{ color: cfg.color }}>
                  XP{" "}
                  <Counter value={xpPct} duration={1.2} delay={0.2} />
                  %
                </span>
                <span>
                  {currentXp}/{maxXp}
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden"
                style={{ height: 3, backgroundColor: "#1F2937" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpPct}%`,
                    backgroundImage: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                    boxShadow: `0 0 6px ${cfg.glowColor}`,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>

            {/* LP Balance */}
            <div
              className="flex items-center justify-between mt-2.5 px-2 py-1.5 rounded-sm"
              style={{
                background: `${cfg.color}0a`,
                border: `1px solid ${cfg.color}20`,
              }}
            >
              <div className="flex items-center gap-1">
                <span style={{ color: cfg.color, fontSize: 8 }}>◈</span>
                <span
                  style={{
                    color: "#475569",
                    fontSize: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.06em",
                  }}
                >
                  LP BALANCE
                </span>
              </div>
              <span
                style={{
                  color: cfg.color,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textShadow: `0 0 8px ${cfg.glowColor}`,
                }}
              >
                {formatLP(lpBalance)}
              </span>
            </div>

            {/* VIEW OPERATIVE button */}
            <div
              className="w-full mt-3 py-1.5 rounded-sm text-center"
              style={{
                backgroundImage: hovered
                  ? `linear-gradient(135deg, ${cfg.gradientFrom}35, ${cfg.gradientTo}35)`
                  : `linear-gradient(135deg, ${cfg.gradientFrom}15, ${cfg.gradientTo}15)`,
                backgroundColor: "transparent",
                border: `1px solid ${hovered ? cfg.color + "70" : cfg.color + "30"}`,
                color: hovered ? cfg.color : "#64748B",
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.15em",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              VIEW OPERATIVE
            </div>
          </div>
        </div>

        {/* ── LED Runner — outside overflow:hidden ─────────── */}
        <LEDRunner
          member={{
            id: (member.id as string | number) ?? index,
            rank: rankKey,
            level,
          }}
        />
      </Link>

      {/* ── Corner decorations ────────────────────────────── */}
      <CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.5} />
    </motion.div>
  );
}
