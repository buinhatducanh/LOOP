/**
 * LeadershipCommandCenter — Tier 1 showcase
 * Diamond / Ruby / Gold leaders displayed prominently with holographic + command effects.
 */

import { useCallback, memo } from 'react';
import { motion } from 'motion/react';
import type { Member, RankKey } from './memberData';
import { RANKS } from './memberData';
import { DS } from '../layout/ds';

// ── Helpers ────────────────────────────────────────────────────────────
function fmtLP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const FALLBACK_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%230F172A'/%3E%3Ctext x='100' y='118' font-family='system-ui' font-size='72' font-weight='700' text-anchor='middle' fill='%233B82F6'%3E%E2%9C%A8%3C/text%3E%3C/svg%3E";

// ── Section label ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${DS.border})` }} />
      <div className="flex items-center gap-2">
        <span style={{ color: DS.blue, fontSize: 8 }}>◆</span>
        <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.25em' }}>
          {children}
        </span>
        <span style={{ color: DS.blue, fontSize: 8 }}>◆</span>
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DS.border}, transparent)` }} />
    </div>
  );
}

// ── Diamond prism beams ───────────────────────────────────────────────
const PRISM_BEAMS = [
  { top: '12%', delay: '0s',   dur: '5.5s', color: '#818CF8', rot: '16deg'  },
  { top: '38%', delay: '1.8s', dur: '4.8s', color: '#7DD3FC', rot: '-20deg' },
  { top: '62%', delay: '3.4s', dur: '6.0s', color: '#F0ABFC', rot: '24deg'  },
  { top: '84%', delay: '0.9s', dur: '5.2s', color: '#FFFFFF', rot: '-14deg' },
];

function DiamondPrism() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 16, zIndex: 5 }}>
      {PRISM_BEAMS.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: b.top, left: '-40%', width: '180%', height: 1,
            backgroundImage: `linear-gradient(90deg, transparent 0%, ${b.color}55 35%, ${b.color}90 50%, ${b.color}55 65%, transparent 100%)`,
            transform: `rotate(${b.rot})`,
            animation: `guildDiamondBeam ${b.dur} ${b.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Holographic floating orbs ────────────────────────────────────────
const ORBS = [
  { left: '8%',  delay: '0s',   dur: '3.5s', size: 4, color: '#818CF8' },
  { left: '25%', delay: '0.8s', dur: '4.2s', size: 3, color: '#7DD3FC' },
  { left: '50%', delay: '1.5s', dur: '3.8s', size: 5, color: '#F0ABFC' },
  { left: '72%', delay: '2.2s', dur: '4.5s', size: 3, color: '#FFFFFF' },
  { left: '90%', delay: '0.4s', dur: '3.2s', size: 4, color: '#818CF8' },
];

function HoloOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: 16, zIndex: 6 }}>
      {ORBS.map((o, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: o.left,
            width: o.size, height: o.size,
            backgroundColor: o.color,
            boxShadow: `0 0 8px 2px ${o.color}`,
            animation: `holoOrb ${o.dur} ${o.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Rank badge ──────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: RankKey }) {
  const cfg = RANKS[rank];
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
      style={{
        backgroundImage: `linear-gradient(135deg, ${cfg.gradientFrom}28, ${cfg.gradientTo}18)`,
        border: `1px solid ${cfg.color}60`,
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ color: cfg.color, fontSize: 11, textShadow: `0 0 8px ${cfg.glowColor}` }}>
        {cfg.symbol}
      </span>
      <span style={{ color: cfg.color, fontSize: 9, letterSpacing: '0.18em', fontFamily: DS.mono, fontWeight: 700 }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Individual Leadership Card ─────────────────────────────────────────
interface LeaderCardProps {
  member: Member;
  index: number;
  onClick: (m: Member) => void;
}

function LeaderCard({ member, index, onClick }: LeaderCardProps) {
  const cfg = RANKS[member.rank];
  const isDiamond = member.rank === 'diamond';
  const isRuby     = member.rank === 'ruby';
  const isGold     = member.rank === 'gold';
  const isHolo     = isDiamond || isRuby;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(member);
    }
  }, [member, onClick]);

  const cardBase: React.CSSProperties = {
    position: 'relative',
    borderRadius: 16,
    padding: '24px',
    minHeight: 420,
    cursor: 'pointer',
    overflow: 'hidden',
    background: `linear-gradient(145deg, ${cfg.gradientFrom}18, ${cfg.gradientTo}08)`,
    border: `1px solid ${cfg.color}55`,
    boxShadow: `0 0 30px ${cfg.glowColor}`,
    transition: 'box-shadow 0.3s ease',
  };

  return (
    <motion.article
      onClick={() => onClick(member)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={isHolo ? 'holo-card' : isGold ? 'command-card' : undefined}
      style={cardBase}
      initial={{ opacity: 0, y: 80, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3, ease: 'easeOut' } }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
      role="button"
      aria-label={`Xem chi tiết ${member.name}, ${cfg.label} level ${member.level}`}
    >
      {/* Holographic effects for Diamond */}
      {isDiamond && <DiamondPrism />}
      {isDiamond && <HoloOrbs />}
      {isDiamond && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${cfg.glowColor}20 0%, transparent 65%)`,
            animation: 'pulseGlow 3s ease-in-out infinite',
            zIndex: 4,
            borderRadius: 16,
          }}
        />
      )}

      {/* Command scan line for Gold */}
      {isGold && (
        <div className="absolute top-0 left-0 right-0 overflow-hidden pointer-events-none" style={{ height: 3, zIndex: 10 }}>
          <div
            className="absolute top-0 h-full"
            style={{
              width: '60%',
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)',
              animation: 'commandScan 3s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Top row: rank badge + level */}
      <div className="flex items-center justify-between mb-5" style={{ position: 'relative', zIndex: 10 }}>
        <RankBadge rank={member.rank} />
        <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
          LVL {member.level}
        </span>
      </div>

      {/* Avatar */}
      <div className="relative mb-5 overflow-hidden" style={{ borderRadius: 12, paddingBottom: '70%' }}>
        <img
          src={member.img || FALLBACK_AVATAR}
          alt={`${member.name} — ${member.role} tại LOOP Solutions`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ borderRadius: 12, boxShadow: `0 0 50px ${cfg.glowColor}` }}
          loading="lazy"
        />
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${cfg.glowColor}35 0%, transparent 70%)`,
            animation: 'pulseGlow 3s ease-in-out infinite',
            borderRadius: 12,
          }}
        />
        {/* Diamond prismatic overlay */}
        {isDiamond && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at 30% 20%, rgba(129,140,248,0.2) 0%, transparent 50%),
                          radial-gradient(circle at 70% 80%, rgba(125,211,252,0.15) 0%, transparent 50%)`,
              animation: 'holoOrb 4s ease-in-out infinite',
              borderRadius: 12,
            }}
          />
        )}
      </div>

      {/* Member info */}
      <div className="space-y-1.5" style={{ position: 'relative', zIndex: 10 }}>
        <h3 style={{ fontFamily: DS.heading, fontSize: 17, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
          {member.name}
        </h3>
        <div style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono }}>
          {member.role}
        </div>
        {member.shortBio && (
          <p style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>
            {member.shortBio.length > 100 ? `${member.shortBio.slice(0, 100)}…` : member.shortBio}
          </p>
        )}
      </div>

      {/* Stats footer */}
      <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: `1px solid ${cfg.color}22`, position: 'relative', zIndex: 10 }}>
        <div className="flex justify-between items-center">
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>LP BALANCE</span>
          <span style={{ color: cfg.color, fontSize: 14, fontFamily: DS.mono, fontWeight: 700, textShadow: `0 0 10px ${cfg.glowColor}` }}>
            {fmtLP(member.lpBalance)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>MISSIONS</span>
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{member.missions} ops</span>
        </div>
        {member.achievements.length > 0 && (
          <div className="flex justify-between items-center">
            <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>TROPHIES</span>
            <div className="flex items-center gap-1">
              {member.achievements.slice(0, 3).map((_a, i) => (
                <span key={i} style={{ fontSize: 10, color: DS.amber }}>★</span>
              ))}
              {member.achievements.length > 3 && (
                <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                  +{member.achievements.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View CTA */}
      <button
        className="w-full mt-4 py-2.5 rounded-xl"
        style={{
          backgroundImage: `linear-gradient(135deg, ${cfg.gradientFrom}30, ${cfg.gradientTo}20)`,
          border: `1px solid ${cfg.color}50`,
          color: cfg.color,
          fontSize: 10,
          fontFamily: DS.mono,
          letterSpacing: '0.18em',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          position: 'relative',
          zIndex: 10,
        }}
      >
        VIEW OPERATIVE PROFILE
      </button>
    </motion.article>
  );
}

// ── Main LeadershipCommandCenter ─────────────────────────────────────
interface Props {
  members: Member[];
  onMemberClick: (m: Member) => void;
}

export function LeadershipCommandCenter({ members, onMemberClick }: Props) {
  const leaders = members
    .filter(m => ['diamond', 'ruby', 'gold'].includes(m.rank))
    .sort((a, b) => {
      const tierDiff = RANKS[b.rank].tier - RANKS[a.rank].tier;
      return tierDiff !== 0 ? tierDiff : b.level - a.level;
    })
    .slice(0, 3);

  if (leaders.length === 0) return null;

  return (
    <section aria-label="Đội ngũ lãnh đạo LOOP Solutions" className="mb-16">
      <SectionLabel>LEADERSHIP COMMAND CENTER</SectionLabel>

      <div
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${DS.border} transparent` }}
      >
        {leaders.map((m, i) => (
          <div key={m.id} className="flex-shrink-0 w-full md:w-auto md:flex-1 snap-center">
            <LeaderCard member={m} index={i} onClick={onMemberClick} />
          </div>
        ))}
      </div>

      {/* Rank strip */}
      <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
        {leaders.map(m => {
          const cfg = RANKS[m.rank];
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span style={{ color: cfg.color, fontSize: 12 }}>{cfg.symbol}</span>
              <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>
                {m.name} · {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
