/**
 * TeamGrid — Tier 2 + Tier 3 member grid with masonry layout
 * Tier 2: Platinum + Gold — "full" variant card (larger, more details)
 * Tier 3: Silver + Bronze + Iron — "compact" variant (efficient, info-dense)
 * Uses Intersection Observer for scroll-triggered stagger animations.
 */

import { useState, useEffect, memo, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import type { Member, RankKey } from './memberData';
import { RANKS } from './memberData';
import { DS } from '../layout/ds';
import {
  GUILD_ANIMATIONS_CSS,
  CornerDeco,
} from './MemberCard';

// ── Tier helpers ────────────────────────────────────────────────────
export function getMemberTier(m: Member): 2 | 3 {
  if (m.rank === 'diamond' || m.rank === 'ruby') return 2;
  if (m.rank === 'gold' || m.rank === 'platinum') return 2;
  return 3;
}

// ── Format helpers ────────────────────────────────────────────────────
function fmtLP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── LED runner ────────────────────────────────────────────────────────
const LED_COLORS: Record<RankKey, string> = {
  iron: '#9CA3AF', bronze: '#CD7F32', silver: '#CBD5E1',
  gold: '#FFD700', platinum: '#14B8A6', ruby: '#E0115F', diamond: '#818CF8',
};

function LEDRunner({ member }: { member: Member }) {
  const color = LED_COLORS[member.rank];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId: number;
    let cancelled = false;

    const animate = () => {
      if (cancelled) return;
      setProgress(p => (p + 1) % 100);
      frameId = requestAnimationFrame(animate);
    };

    const intervalId = setInterval(animate, 50);
    frameId = requestAnimationFrame(animate); // kick off first frame

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      cancelAnimationFrame(frameId);
    };
  }, [member.rank]);

  return (
    <div
      className="absolute inset-0 rounded-xl pointer-events-none"
      style={{ overflow: 'hidden', borderRadius: 12 }}
    >
      {/* LED trace line */}
      <div
        className="absolute"
        style={{
          top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          opacity: 0.7,
          backgroundSize: '200% 100%',
          backgroundPosition: `${progress}% 0`,
          animation: 'ledRunner 2s linear infinite',
        }}
      />
    </div>
  );
}

// ── Box-shadow animations per rank ───────────────────────────────────
const BOX_SHADOW_ANIM: Record<RankKey, string | undefined> = {
  iron:     undefined,
  bronze:   'guildBronzeFlow 2.5s ease-in-out infinite',
  silver:   'guildSilverPulse 2s ease-in-out infinite',
  gold:     'guildGoldGlow 2s ease-in-out infinite',
  platinum: 'guildPlatinumPulse 1.8s ease-in-out infinite',
  ruby:     'guildHeartbeat 1.1s ease-in-out infinite',
  diamond:  'guildDiamondSpectral 3.5s ease-in-out infinite',
};

// ── Rank Badge ────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: RankKey }) {
  const cfg = RANKS[rank];
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
      style={{
        backgroundImage: `linear-gradient(135deg, ${cfg.gradientFrom}22, ${cfg.gradientTo}22)`,
        border: `1px solid ${cfg.color}50`,
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ color: cfg.color, fontSize: 9 }}>{cfg.symbol}</span>
      <span style={{ color: cfg.color, fontSize: 8, letterSpacing: '0.14em', fontFamily: DS.mono, fontWeight: 600 }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Full Card (Tier 2) ─────────────────────────────────────────────
interface FullCardProps {
  member: Member;
  index: number;
  onClick: (m: Member) => void;
}

const FullCard = memo(function FullCard({ member, index, onClick }: FullCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = RANKS[member.rank];
  const xpPct = Math.round((member.currentXP / member.maxXP) * 100);

  const cardStyle: CSSProperties = {
    backgroundColor: '#0F172A',
    border: `1px solid ${cfg.color}40`,
    borderRadius: 12,
    animation: BOX_SHADOW_ANIM[member.rank],
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <motion.div
      style={{ borderRadius: 12, position: 'relative', willChange: 'transform' }}
      whileHover={{ y: -10, scale: 1.03, transition: { duration: 0.32, ease: 'easeOut' } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onClick(member)}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
    >
      {/* Ambient glow ring */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: `0 0 ${hovered ? 45 : 22}px ${cfg.glowColor}`,
          opacity: hovered ? 1 : 0.55,
          transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        }}
      />

      <div style={cardStyle}>
        {/* Avatar */}
        <div className="relative overflow-hidden" style={{ paddingBottom: '110%' }}>
          <img
            src={member.img || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%230F172A'/%3E%3Ctext x='100' y='118' font-family='system-ui' font-size='72' font-weight='700' text-anchor='middle' fill='%233B82F6'%3E%E2%9C%A8%3C/text%3E%3C/svg%3E"}
            alt={`${member.name} — ${member.role} tại LOOP Solutions`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ borderRadius: '10px 10px 0 0' }}
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.5) 35%, rgba(15,23,42,0.1) 60%, transparent 80%)',
              borderRadius: '10px 10px 0 0',
            }}
          />

          {/* Badges */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <RankBadge rank={member.rank} />
          </div>
          <div
            className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: 'rgba(2,6,23,0.72)', border: '1px solid #1F2937', backdropFilter: 'blur(4px)' }}
          >
            <span style={{ color: '#64748B', fontSize: 9, letterSpacing: '0.12em', fontFamily: DS.mono }}>
              ⬡ {member.team}
            </span>
          </div>

          {/* Level */}
          <div className="absolute bottom-3 left-3 z-20 flex items-baseline gap-1">
            <span style={{ fontFamily: DS.heading, color: cfg.color, fontSize: 20, fontWeight: 700, lineHeight: 1, textShadow: `0 0 14px ${cfg.glowColor}` }}>
              {member.level}
            </span>
            <span style={{ color: '#64748B', fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 2 }}>LVL</span>
          </div>

          {/* Boost indicator */}
          {hovered && (
            <div
              className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
              style={{
                backgroundColor: `${cfg.color}20`,
                border: `1px solid ${cfg.color}60`,
                animation: 'guildHeartbeat 0.5s ease-in-out infinite',
              }}
            >
              <span style={{ color: cfg.color, fontSize: 8, fontFamily: DS.mono, letterSpacing: '0.1em' }}>⚡ BOOST</span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="px-3 pt-2 pb-3">
          <div style={{ color: '#fff', fontFamily: DS.heading, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.name}
          </div>
          <div className="mt-0.5" style={{ color: '#64748B', fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.08em' }}>
            {member.role}
          </div>

          {/* XP bar */}
          <div className="mt-2.5">
            <div className="flex justify-between mb-1" style={{ color: '#475569', fontSize: 9, fontFamily: DS.mono }}>
              <span style={{ color: cfg.color }}>XP {xpPct}%</span>
              <span>{member.currentXP}/{member.maxXP}</span>
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

          {/* LP + missions row */}
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-sm" style={{ background: `${cfg.color}0a`, border: `1px solid ${cfg.color}20` }}>
              <span style={{ color: cfg.color, fontSize: 8 }}>◈</span>
              <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(member.lpBalance)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: '#22C55E', fontSize: 8 }}>●</span>
              <span style={{ color: '#64748B', fontSize: 9, fontFamily: DS.mono }}>{member.missions} ops</span>
            </div>
            {member.achievements.length > 0 && (
              <div className="flex items-center gap-0.5">
                <span style={{ color: DS.amber, fontSize: 8 }}>★</span>
                <span style={{ color: '#64748B', fontSize: 9, fontFamily: DS.mono }}>{member.achievements.length}</span>
              </div>
            )}
          </div>

          <button
            className="w-full mt-3 py-1.5 rounded-sm"
            style={{
              backgroundImage: hovered ? `linear-gradient(135deg, ${cfg.gradientFrom}35, ${cfg.gradientTo}35)` : `linear-gradient(135deg, ${cfg.gradientFrom}15, ${cfg.gradientTo}15)`,
              backgroundColor: 'transparent',
              border: `1px solid ${hovered ? cfg.color + '70' : cfg.color + '30'}`,
              color: hovered ? cfg.color : '#64748B',
              fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em', fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
          >
            VIEW OPERATIVE
          </button>
        </div>
      </div>

      <LEDRunner member={member} />
      <CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.5} />
    </motion.div>
  );
});

// ── Compact Card (Tier 3) ────────────────────────────────────────────
interface CompactCardProps {
  member: Member;
  index: number;
  onClick: (m: Member) => void;
}

const AVATAR_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%230F172A'/%3E%3Ctext x='100' y='118' font-family='system-ui' font-size='72' font-weight='700' text-anchor='middle' fill='%233B82F6'%3E%E2%9C%A8%3C/text%3E%3C/svg%3E";

const CompactCard = memo(function CompactCard({ member, index, onClick }: CompactCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = RANKS[member.rank];

  return (
    <motion.div
      className="flex items-center gap-3 rounded-xl p-3 cursor-pointer"
      style={{
        background: hovered ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.6)',
        border: `1px solid ${hovered ? cfg.color + '50' : cfg.color + '18'}`,
        boxShadow: hovered ? `0 0 16px ${cfg.glowColor}` : 'none',
        transition: 'all 0.2s ease',
      }}
      whileHover={{ x: 4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onClick(member)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: (index % 6) * 0.04 }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 48, height: 48 }}>
        <img
          src={member.img || AVATAR_FALLBACK}
          alt={member.name}
          className="w-full h-full object-cover"
          loading="lazy"
          style={{ borderRadius: 8 }}
        />
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{ background: `linear-gradient(135deg, ${cfg.color}20, transparent)` }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            style={{
              color: '#fff',
              fontFamily: DS.heading,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {member.name}
          </span>
          <RankBadge rank={member.rank} />
        </div>
        <div style={{ color: '#64748B', fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.06em' }}>
          {member.role} · <span style={{ color: cfg.color }}>Lv.{member.level}</span>
        </div>
      </div>

      {/* Right stats */}
      <div className="flex-shrink-0 text-right space-y-1">
        <div style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
          {fmtLP(member.lpBalance)}
        </div>
        <div style={{ color: '#64748B', fontSize: 9, fontFamily: DS.mono }}>
          {member.missions} ops
        </div>
      </div>

      {/* LED indicator line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.gradientTo})`,
          width: hovered ? '100%' : '0%',
          transition: 'width 0.3s ease',
        }}
      />
    </motion.div>
  );
});

// ── Tier section header ──────────────────────────────────────────────
function TierSectionHeader({ tier, count }: { tier: 2 | 3; count: number }) {
  const labels = {
    2: { title: 'CORE TEAM', subtitle: 'Platinum & Gold — Senior Specialists', color: DS.purple },
    3: { title: 'OPERATIVES', subtitle: 'Silver, Bronze & Iron — Growing Talents', color: DS.text4 },
  };
  const { title, subtitle, color } = labels[tier];

  return (
    <div className="flex items-center gap-3 mb-5">
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${DS.border})` }} />
      <div className="flex flex-col items-center gap-1">
        <span style={{ color, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.25em', fontWeight: 700 }}>
          {title} · {count}
        </span>
        <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
          {subtitle}
        </span>
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DS.border}, transparent)` }} />
    </div>
  );
}

// ── Main TeamGrid ─────────────────────────────────────────────────────
interface TeamGridProps {
  members: Member[];
  onMemberClick: (m: Member) => void;
}

export const TeamGrid = memo(function TeamGrid({ members, onMemberClick }: TeamGridProps) {
  const tier2 = members.filter(m => getMemberTier(m) === 2);
  const tier3 = members.filter(m => getMemberTier(m) === 3);

  return (
    <div className="space-y-10">
      {/* Inject guild CSS */}
      <InjectGuildCSS />

      {/* Tier 2 — Core Team */}
      {tier2.length > 0 && (
        <section aria-label="Đội ngũ cốt lõi LOOP Solutions">
          <TierSectionHeader tier={2} count={tier2.length} />
          {/* Masonry grid: 2 cols mobile, 3 cols md, 4 cols xl */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {tier2.map((m, i) => (
              <FullCard
                key={m.id}
                member={m}
                index={i}
                onClick={onMemberClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tier 3 — Specialists */}
      {tier3.length > 0 && (
        <section aria-label="Operatives LOOP Solutions">
          <TierSectionHeader tier={3} count={tier3.length} />
          {/* List view: rows instead of masonry */}
          <div className="flex flex-col gap-2">
            {tier3.map((m, i) => (
              <CompactCard
                key={m.id}
                member={m}
                index={i}
                onClick={onMemberClick}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

// ── CSS injection helper ──────────────────────────────────────────────
function InjectGuildCSS() {
  useEffect(() => {
    let el = document.getElementById('guild-animations-grid');
    if (!el) {
      el = document.createElement('style');
      el.id = 'guild-animations-grid';
      el.textContent = GUILD_ANIMATIONS_CSS;
      document.head.appendChild(el);
    }
    return () => { /* keep on page — shared with MemberCard */ };
  }, []);
  return null;
}
