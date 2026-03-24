"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RANKS, RankKey, BOX_SHADOW_ANIM, ROLE_SYMBOLS } from './teamRanks';
import { LEDRunner } from './LEDRunner';
import { Users } from 'lucide-react';

// ── XP formula helpers (inline, no server dependency) ─────────────────────
const XP_PER_LP = 10;
function xpForLevel(level: number) { return level * 100; }
function levelFromXp(totalXp: number) {
  let level = 1, remaining = totalXp;
  while (xpForLevel(level) <= remaining) { remaining -= xpForLevel(level); level++; }
  return { level, currentXp: remaining };
}
function getRankFromLevel(level: number) {
  if (level >= 115) return 'diamond';
  if (level >= 95)  return 'ruby';
  if (level >= 75)  return 'platinum';
  if (level >= 55)  return 'gold';
  if (level >= 35)  return 'silver';
  if (level >= 15)  return 'bronze';
  return 'iron';
}

// ── Map existing TeamMemberData fields to guild system ──────────────────────
interface GuildMemberData {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  shortBio: string;
  image: string;
  expertise?: string[];
  achievements?: string[];
  linkedin?: string | null;
  twitter?: string | null;
  github?: string | null;
  email?: string | null;
  roleLevel?: number;
  roleCategory?: string | null;
  coverImage?: string | null;
  quote?: string | null;
  phone?: string | null;
  skills?: string[] | Record<string, number>;
  experience?: string | null;
  isFeatured?: boolean;
  // Guild system fields (derived/computed)
  level?: number;
  currentXP?: number;
  maxXP?: number;
  team?: string;
  missions?: number;
  roleCode?: string;
  /** Real total approved LP — if provided, rank/XP computed from LP data */
  totalApprovedLp?: number;
}

// ── Compute rank + guild stats from existing data ────────────────────────────
function deriveGuildData(member: GuildMemberData): {
  rank: RankKey;
  level: number;
  currentXP: number;
  maxXP: number;
  team: string;
  missions: number;
  skills: Record<string, number>;
} {
  // Role code from role or roleCategory
  const roleCode = member.roleCode ||
    (member.roleCategory?.toUpperCase() ?? 'DEFAULT') ||
    (member.role?.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '') || 'DEFAULT');

  // Derive rank from roleLevel (0=CEO/CTO, 1=lead, 2=senior, 3+=mid/junior)
  const roleLevel = member.roleLevel ?? 3;
  let rank: RankKey = 'iron';
  let level = 8;
  let currentXP = 45;
  let maxXP = 100;

  const isCEO = roleLevel === 0 || member.role?.toLowerCase().includes('ceo') ||
    member.role?.toLowerCase().includes('founder') || member.role?.toLowerCase().includes('giám đốc');
  const isCTO = member.role?.toLowerCase().includes('cto') || member.role?.toLowerCase().includes('technical');
  const isLead = roleLevel === 1 || member.role?.toLowerCase().includes('lead') || member.role?.toLowerCase().includes('trưởng');
  const isSenior = roleLevel === 2;

  if (isCEO) { rank = 'diamond'; level = 118; currentXP = 92; }
  else if (isCTO) { rank = 'ruby'; level = 103; currentXP = 60; }
  else if (isLead) { rank = 'gold'; level = 68; currentXP = 85; }
  else if (isSenior) { rank = 'silver'; level = 43; currentXP = 62; }
  else { rank = 'bronze'; level = 24; currentXP = 78; }

  // Compute skills from existing expertise/skills
  const skills: Record<string, number> = {};
  if (member.skills && Array.isArray(member.skills)) {
    member.skills.forEach((s, i) => {
      const name = typeof s === 'string' ? s : (s as any).name || (s as any).nameVi || String(s);
      skills[name] = Math.min(100, 60 + (i * 10) + Math.floor(Math.random() * 20));
    });
  }
  if (member.expertise) {
    member.expertise.forEach((e, i) => {
      const name = typeof e === 'string' ? e : (e as any).name || (e as any).nameVi || String(e);
      if (!skills[name]) skills[name] = Math.min(100, 50 + (i * 12) + Math.floor(Math.random() * 20));
    });
  }
  // Default skills if empty
  if (Object.keys(skills).length === 0) {
    skills['Code'] = 70; skills['Design'] = 45; skills['Strategy'] = 60;
    skills['Execution'] = 75; skills['Teamwork'] = 65;
  }

  return {
    rank,
    level,
    currentXP,
    maxXP,
    team: member.team || (isCEO ? 'All' : isCTO ? 'Omega' : 'Alpha'),
    missions: member.missions || (isCEO ? 201 : isCTO ? 138 : isLead ? 84 : 28),
    skills,
  };
}

// ── Corner decoration ────────────────────────────────────────────────────────
function CornerDeco({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const s = { borderColor: color, opacity, transition: 'opacity 0.25s ease' };
  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r pointer-events-none" style={{ ...s, zIndex: 15 }} />
    </>
  );
}

// ── Rank Badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: RankKey }) {
  const cfg = RANKS[rank];
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-sm"
      style={{
        backgroundImage: `linear-gradient(135deg, ${cfg.gradientFrom}22, ${cfg.gradientTo}22)`,
        border: `1px solid ${cfg.color}55`,
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.symbol}</span>
      <span
        style={{
          color: cfg.color,
          fontSize: 9,
          letterSpacing: '0.15em',
          fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
          fontWeight: 600,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ── Floating particles ───────────────────────────────────────────────────────
function Particles({ rank }: { rank: RankKey }) {
  const PARTICLES: Record<string, Array<{ left: string; delay: string; duration: string; size: number }>> = {
    platinum: [
      { left: '12%', delay: '0s', duration: '3.2s', size: 2 },
      { left: '28%', delay: '0.7s', duration: '2.6s', size: 1.5 },
      { left: '47%', delay: '1.4s', duration: '3.8s', size: 2 },
      { left: '66%', delay: '0.4s', duration: '2.9s', size: 1.5 },
      { left: '83%', delay: '1.1s', duration: '3.4s', size: 2 },
    ],
    ruby: [
      { left: '8%', delay: '0s', duration: '1.8s', size: 2 },
      { left: '22%', delay: '0.3s', duration: '2.1s', size: 1.5 },
      { left: '40%', delay: '0.6s', duration: '1.6s', size: 2 },
      { left: '57%', delay: '0.9s', duration: '2.3s', size: 1.5 },
      { left: '74%', delay: '0.2s', duration: '1.9s', size: 2 },
      { left: '90%', delay: '0.5s', duration: '2.0s', size: 1.5 },
    ],
    diamond: [
      { left: '15%', delay: '0s', duration: '2.5s', size: 2 },
      { left: '35%', delay: '0.5s', duration: '3.0s', size: 1.5 },
      { left: '55%', delay: '1.0s', duration: '2.8s', size: 2 },
      { left: '75%', delay: '0.3s', duration: '3.2s', size: 1.5 },
      { left: '90%', delay: '0.8s', duration: '2.6s', size: 2 },
    ],
  };

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

// ── Gold comet line ─────────────────────────────────────────────────────────
function CometLine({ color }: { color: string }) {
  return (
    <div className="absolute top-0 left-0 right-0 overflow-hidden pointer-events-none z-30" style={{ height: 2 }}>
      <div
        className="absolute top-0 h-full"
        style={{
          width: '60%',
          backgroundImage: `linear-gradient(90deg, transparent, ${color}cc, transparent)`,
          animation: 'guildCometSweep 3.5s linear infinite',
        }}
      />
    </div>
  );
}

// ── Hover stats popup ───────────────────────────────────────────────────────
function HoverStatsPopup({ member, guild, visible }: { member: GuildMemberData; guild: ReturnType<typeof deriveGuildData>; visible: boolean }) {
  const cfg = RANKS[guild.rank];
  const skillEntries = Object.entries(guild.skills).slice(0, 3);

  return (
    <div
      className="absolute z-40 rounded-md p-2.5 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        backgroundImage: 'linear-gradient(135deg, #0F172Aee, #111827ee)',
        backgroundColor: '#0F172Aee',
        border: `1px solid ${cfg.color}35`,
        backdropFilter: 'blur(8px)',
        top: '100%',
        left: '50%',
        width: 220,
        marginLeft: -110,
        marginTop: 4,
      }}
    >
      <div className="flex items-center justify-between mb-2" style={{ borderBottom: `1px solid ${cfg.color}20`, paddingBottom: 5 }}>
        <span style={{ color: cfg.color, fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.14em', fontWeight: 600 }}>
          ── QUICK STATS
        </span>
        <span style={{ color: '#475569', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>
          {cfg.symbol} {cfg.label}
        </span>
      </div>
      <div style={{ marginBottom: 6 }}>
        {skillEntries.map(([skill, val]) => (
          <div key={skill} style={{ marginBottom: 3.5 }}>
            <div className="flex justify-between" style={{ marginBottom: 1.5 }}>
              <span style={{ color: '#64748B', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
                {skill.toUpperCase()}
              </span>
              <span style={{ color: cfg.color, fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', fontWeight: 700 }}>
                {val}
              </span>
            </div>
            <div style={{ height: 2, backgroundColor: '#1F2937', borderRadius: 1, overflow: 'hidden' }}>
              <motion.div
                style={{
                  height: '100%',
                  width: visible ? `${val}%` : '0%',
                  backgroundImage: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                  borderRadius: 1,
                  transition: 'width 0.45s ease 0.1s',
                  boxShadow: `0 0 4px ${cfg.glowColor}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#22C55E', boxShadow: '0 0 4px #22C55E' }} />
          <span style={{ color: '#64748B', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
            {guild.missions} OPS
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#F59E0B', fontSize: 8 }}>★</span>
          <span style={{ color: '#64748B', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
            {(member.achievements?.length || 3)} TROPHIES
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main GuildMemberCard ────────────────────────────────────────────────────
interface GuildMemberCardProps {
  member: GuildMemberData;
  onClick?: (member: GuildMemberData) => void;
}

export function GuildMemberCard({ member, onClick }: GuildMemberCardProps) {
  const [hovered, setHovered] = useState(false);

  // ── Compute rank/XP from real LP data when available ────────────────────
  let guild: ReturnType<typeof deriveGuildData>;

  if (member.totalApprovedLp !== undefined && member.totalApprovedLp > 0) {
    const totalXp = member.totalApprovedLp * XP_PER_LP;
    const { level, currentXp } = levelFromXp(totalXp);
    const maxXp = xpForLevel(level);
    const rank = getRankFromLevel(level) as RankKey;
    const cfg = RANKS[rank];

    // Skills from existing data or fall back to defaults
    const skills: Record<string, number> = {};
    if (member.skills && Array.isArray(member.skills)) {
      member.skills.forEach((s, i) => {
        const name = typeof s === 'string' ? s : (s as unknown as { name?: string; nameVi?: string }).name || (s as unknown as { name?: string; nameVi?: string }).nameVi || String(s);
        skills[name] = Math.min(100, 60 + (i * 10) + Math.floor(Math.random() * 20));
      });
    }
    if (member.expertise) {
      member.expertise.forEach((e, i) => {
        const name = typeof e === 'string' ? e : (e as unknown as { name?: string; nameVi?: string }).name || (e as unknown as { name?: string; nameVi?: string }).nameVi || String(e);
        if (!skills[name]) skills[name] = Math.min(100, 50 + (i * 12) + Math.floor(Math.random() * 20));
      });
    }
    if (Object.keys(skills).length === 0) {
      skills['Code'] = 70; skills['Design'] = 45; skills['Strategy'] = 60;
      skills['Execution'] = 75; skills['Teamwork'] = 65;
    }

    guild = {
      rank,
      level,
      currentXP: currentXp,
      maxXP: maxXp,
      team: member.team || 'Alpha',
      missions: member.missions || 12,
      skills,
    };
  } else {
    guild = deriveGuildData(member);
  }

  const cfg = RANKS[guild.rank];
  const xpPct = Math.round((guild.currentXP / guild.maxXP) * 100);
  const roleSymbol = ROLE_SYMBOLS[member.roleCode || member.roleCategory || 'default'] || ROLE_SYMBOLS.default;

  const hasParticles = ['platinum', 'ruby', 'diamond'].includes(guild.rank);
  const hasComet = guild.rank === 'gold';
  const hasGlitch = guild.rank === 'ruby';
  const hasAurora = guild.rank === 'diamond';

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ borderRadius: 12, position: 'relative' }}
      whileHover={{ y: -10, scale: 1.03 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onClick?.(member)}
    >
      {/* Ambient glow ring */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: `0 0 ${hovered ? 45 : 22}px ${cfg.glowColor}`,
          opacity: hovered ? 1 : 0.55,
          borderRadius: 12,
          transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        }}
      />

      {/* Card */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: '#0F172A',
          border: `1px solid ${cfg.color}40`,
          borderRadius: 12,
          animation: BOX_SHADOW_ANIM[guild.rank] || undefined,
        }}
      >
        {hasComet && <CometLine color={cfg.color} />}
        {hasGlitch && (
          <>
            {/* Glitch layer 1 — red offset */}
            <div
              className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[11px]"
              style={{ animation: 'guildGlitch 2.4s steps(1) infinite' }}
            >
              <div
                className="absolute inset-0"
                style={{ boxShadow: '2px 0 0 rgba(239,68,68,0.55) inset' }}
              />
            </div>
            {/* Glitch layer 2 — cyan offset */}
            <div
              className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[11px]"
              style={{ animation: 'guildGlitchInner 2.4s steps(1) infinite 0.3s' }}
            >
              <div
                className="absolute inset-0"
                style={{ boxShadow: '-2px 0 0 rgba(6,182,212,0.5) inset' }}
              />
            </div>
          </>
        )}
        {hasAurora && (
          <div
            className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[11px]"
            style={{
              background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(125,211,252,0.10), rgba(139,92,246,0.08), rgba(255,255,255,0.06))',
              backgroundSize: '300% 300%',
              animation: 'auroraShift 5s ease-in-out infinite',
            }}
          />
        )}
        {hasParticles && <Particles rank={guild.rank} />}

        {/* Avatar image section */}
        <div className="relative" style={{ paddingBottom: '110%' }}>
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ borderRadius: '10px 10px 0 0' }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center" style={{ borderRadius: '10px 10px 0 0' }}>
              <Users size={48} className="text-slate-600" />
            </div>
          )}

          {/* Gradient fade at bottom */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(to top, #0F172A 0%, #0F172A55 35%, transparent 62%)',
              borderRadius: '10px 10px 0 0',
            }}
          />

          {/* Rank badge — top right */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <RankBadge rank={guild.rank} />
          </div>

          {/* Team tag — top left */}
          <div
            className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: 'rgba(2,6,23,0.72)', border: '1px solid #1F2937', backdropFilter: 'blur(4px)' }}
          >
            <span style={{ color: '#64748B', fontSize: 9, letterSpacing: '0.12em', fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>
              ⬡ {guild.team}
            </span>
          </div>

          {/* Level — bottom over image */}
          <div className="absolute bottom-3 left-3 z-20 flex items-baseline gap-1">
            <span
              style={{
                fontFamily: 'var(--font-cinzel), Cinzel, serif',
                color: cfg.color,
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1,
                textShadow: `0 0 14px ${cfg.glowColor}`,
              }}
            >
              {guild.level}
            </span>
            <span style={{ color: '#64748B', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 2 }}>
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
                animation: 'guildHeartbeat 0.5s ease-in-out infinite',
              }}
            >
              <span style={{ color: cfg.color, fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
                ⚡ BOOST
              </span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="px-3 pt-2 pb-3">
          <div
            style={{
              color: '#FFFFFF',
              fontFamily: 'var(--font-cinzel), Cinzel, serif',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {member.name}
          </div>
          <div
            className="mt-0.5"
            style={{ color: '#64748B', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.08em' }}
          >
            {roleSymbol} {member.role}
          </div>

          {/* XP bar */}
          <div className="mt-2.5">
            <div className="flex justify-between mb-1" style={{ color: '#475569', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>
              <span style={{ color: cfg.color }}>XP {xpPct}%</span>
              <span>{guild.currentXP}/{guild.maxXP}</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 3, backgroundColor: '#1F2937' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${xpPct}%`,
                  backgroundImage: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                  boxShadow: `0 0 6px ${cfg.glowColor}`,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>

          {/* VIEW OPERATIVE button */}
          <button
            className="w-full mt-3 py-1.5 rounded-sm"
            style={{
              backgroundImage: hovered ? `linear-gradient(135deg, ${cfg.gradientFrom}35, ${cfg.gradientTo}35)` : `linear-gradient(135deg, ${cfg.gradientFrom}15, ${cfg.gradientTo}15)`,
              backgroundColor: 'transparent',
              border: `1px solid ${hovered ? cfg.color + '70' : cfg.color + '30'}`,
              color: hovered ? cfg.color : '#64748B',
              fontSize: 9,
              fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
              letterSpacing: '0.15em',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
          >
            VIEW OPERATIVE
          </button>
        </div>
      </div>

      {/* LED Runner */}
      <LEDRunner memberId={member.id} rank={guild.rank} level={guild.level} />

      {/* Corner decorations */}
      <CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.5} />

      {/* Hover stats popup */}
      <HoverStatsPopup member={member} guild={guild} visible={hovered} />
    </motion.div>
  );
}
