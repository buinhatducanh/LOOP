import { useState, CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Member, RANKS, RankKey } from './memberData';
import { LEDRunner } from './LEDRunner';

// ── Particle presets (fixed positions, no flicker) ────────────────────────
const PARTICLES: Record<string, Array<{ left: string; delay: string; duration: string; size: number }>> = {
  platinum: [
    { left: '12%', delay: '0s',   duration: '3.2s', size: 2   },
    { left: '28%', delay: '0.7s', duration: '2.6s', size: 1.5 },
    { left: '47%', delay: '1.4s', duration: '3.8s', size: 2   },
    { left: '66%', delay: '0.4s', duration: '2.9s', size: 1.5 },
    { left: '83%', delay: '1.1s', duration: '3.4s', size: 2   },
  ],
  ruby: [
    { left: '8%',  delay: '0s',   duration: '1.8s', size: 2   },
    { left: '22%', delay: '0.3s', duration: '2.1s', size: 1.5 },
    { left: '40%', delay: '0.6s', duration: '1.6s', size: 2   },
    { left: '57%', delay: '0.9s', duration: '2.3s', size: 1.5 },
    { left: '74%', delay: '0.2s', duration: '1.9s', size: 2   },
    { left: '90%', delay: '0.5s', duration: '2.0s', size: 1.5 },
  ],
};

const ROLE_SYMBOLS: Record<string, string> = {
  // Leadership & Management
  PM:      '⊙',  // Product Manager
  PO:      '◉',  // Product Owner
  CEO:     '⬢',  // Chief Executive Officer
  SC:      '◈',  // Scrum Master
  MAP:     '★',  // Tech Lead/Strategic
  
  // Business Functions
  HR:      '◇',  // Nhân sự (Human Resources)
  MKT:     '◐',  // Marketing
  
  // Design
  DESIGNER: '✦', // Designer
  STAFF:   '✦',  // UI/UX Designer (legacy)
  
  // Development
  BOW:     '⌖',  // Frontend Developer
  DAGGER:  '⌗',  // Backend Developer
  DUAL:    '⊛',  // Full Stack Developer
  DEV_FE:  '⌖',  // Frontend Developer
  DEV_BE:  '⌗',  // Backend Developer
  DEV_FS:  '⊛',  // Full Stack Developer
  
  // Infrastructure & Quality
  SHIELD:  '⬡',  // DevOps Engineer
  DEVOPS:  '⬡',  // DevOps Engineer
  QA:      '◎',  // Quality Assurance
  
  // Data & Analytics
  DATA:    '◆',  // Data Analyst/Engineer
};

// ── Box-shadow pulsing animations per rank (NO border-color animations) ──
const BOX_SHADOW_ANIM: Record<RankKey, string | undefined> = {
  iron:     undefined,
  bronze:   'guildBronzeFlow 2.5s ease-in-out infinite',
  silver:   'guildSilverPulse 2s ease-in-out infinite',
  gold:     'guildGoldGlow 2s ease-in-out infinite',
  platinum: 'guildPlatinumPulse 1.8s ease-in-out infinite',
  ruby:     'guildHeartbeat 1.1s ease-in-out infinite',
  diamond:  'guildDiamondSpectral 3s ease-in-out infinite',
};

// ── Rank-specific entrance animation variants ─────────────────────────────
export function getRankEntranceProps(rank: RankKey, delay: number) {
  switch (rank) {
    case 'iron':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.75, ease: 'easeOut', delay },
      };
    case 'bronze':
      return {
        initial: { opacity: 0, y: 55 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
      };
    case 'silver':
      return {
        initial: { opacity: 0, x: -40, scale: 0.94 },
        animate: { opacity: 1, x: 0, scale: 1 },
        transition: { duration: 0.55, ease: 'easeOut', delay },
      };
    case 'gold':
      return {
        initial: { opacity: 0, scale: 0.72 },
        animate: { opacity: 1, scale: 1 },
        transition: { type: 'spring' as const, stiffness: 220, damping: 16, delay },
      };
    case 'platinum':
      return {
        initial: { opacity: 0, rotateX: 68, y: 24 },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay },
        style: { transformPerspective: 900 },
      };
    case 'ruby':
      return {
        initial: { opacity: 0, x: 80, scale: 0.82 },
        animate: { opacity: 1, x: 0, scale: 1 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 22, delay },
      };
    case 'diamond':
      return {
        initial: { opacity: 0, scale: 1.3, filter: 'blur(18px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const, delay },
      };
    default:
      return {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut', delay },
      };
  }
}

// ── Corner decoration (rendered OUTSIDE overflow:hidden) ──────────────────
function CornerDeco({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const s: CSSProperties = { borderColor: color, opacity, transition: 'opacity 0.25s ease' };
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
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.symbol}</span>
      <span
        style={{
          color: cfg.color,
          fontSize: 9,
          letterSpacing: '0.15em',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ── Floating particles (platinum / ruby / diamond) ────────────────────────
function Particles({ rank }: { rank: RankKey }) {
  const list = PARTICLES[rank] || [];
  const color = RANKS[rank].particleColor;
  
  // REMOVED MASK FOR DIAMOND - No more blur on face
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

// ── Gold comet line ──────────────────────────────────────────────────────
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

// ── Ruby electric sparks ───────────────────────────────────────────────
function ElectricSparks({ color }: { color: string }) {
  const sparks = [
    { top: '15%', left: '0',   width: '40%', delay: '0s',   dur: '0.6s' },
    { top: '35%', left: '60%', width: '40%', delay: '0.3s', dur: '0.5s' },
    { top: '55%', left: '10%', width: '30%', delay: '0.5s', dur: '0.7s' },
    { top: '75%', left: '50%', width: '35%', delay: '0.1s', dur: '0.6s' },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {sparks.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: s.top, left: s.left, width: s.width, height: 1,
            backgroundImage: `linear-gradient(90deg, transparent, ${color}cc, transparent)`,
            animation: `guildElectric ${s.dur} ${s.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── LED Boost ripple overlay ────────────────────────────────────────────
function BoostRipple({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-20 rounded-xl overflow-hidden">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${color}30 0%, transparent 70%)`,
          animation: 'guildBoostRipple 0.5s ease-out forwards',
        }}
      />
    </div>
  );
}

// ── Mini Hover Stats Popup ────────────────────────────────────────────────
function HoverStatsPopup({ member, visible }: { member: Member; visible: boolean }) {
  const cfg = RANKS[member.rank];
  const topSkills = Object.entries(member.skills).slice(0, 3);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        backgroundImage: 'linear-gradient(135deg, #0F172Aee, #111827ee)',
        backgroundColor: '#0F172Aee',
        border: `1px solid ${cfg.color}35`,
        borderRadius: 6,
        padding: '8px 10px',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between mb-2"
        style={{ borderBottom: `1px solid ${cfg.color}20`, paddingBottom: 5 }}
      >
        <span
          style={{
            color: cfg.color,
            fontSize: 8,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.14em',
            fontWeight: 600,
          }}
        >
          ── QUICK STATS
        </span>
        <span
          style={{
            color: '#475569',
            fontSize: 8,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {cfg.symbol} {cfg.label}
        </span>
      </div>

      {/* Top 3 skill mini-bars */}
      <div style={{ marginBottom: 6 }}>
        {topSkills.map(([skill, val]) => (
          <div key={skill} style={{ marginBottom: 3.5 }}>
            <div className="flex justify-between" style={{ marginBottom: 1.5 }}>
              <span
                style={{
                  color: '#64748B',
                  fontSize: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.06em',
                }}
              >
                {skill.toUpperCase()}
              </span>
              <span
                style={{
                  color: cfg.color,
                  fontSize: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                }}
              >
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

      {/* Bottom quick stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: '#22C55E', boxShadow: '0 0 4px #22C55E' }}
          />
          <span
            style={{
              color: '#64748B',
              fontSize: 8,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
            }}
          >
            {member.missions} OPS
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#F59E0B', fontSize: 8 }}>★</span>
          <span
            style={{
              color: '#64748B',
              fontSize: 8,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
            }}
          >
            {member.achievements.length} TROPHIES
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: cfg.color, fontSize: 8 }}>◈</span>
          <span
            style={{
              color: '#64748B',
              fontSize: 8,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            TAP HUD
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Injected CSS keyframes ───────────────────────────────────────────────
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
    0%, 100% { box-shadow: 0 0 20px rgba(129,140,248,0.3), 0 0 50px rgba(125,211,252,0.1); }
    50%      { box-shadow: 0 0 45px rgba(129,140,248,0.7), 0 0 90px rgba(125,211,252,0.3), 0 0 120px rgba(255,255,255,0.15); }
  }
  @keyframes guildBoostRipple {
    0%   { opacity: 1; transform: scale(0.85); }
    100% { opacity: 0; transform: scale(1.05); }
  }
`;

// ── Main MemberCard ──────────────────────────────────────────────────────
interface MemberCardProps {
  member: Member;
  onClick: (m: Member) => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = RANKS[member.rank];
  const xpPct = Math.round((member.currentXP / member.maxXP) * 100);

  // Card style: dim border (LED runner is the primary border effect)
  const cardStyle: CSSProperties = {
    backgroundColor: '#0F172A',
    border: `1px solid ${cfg.color}40`,
    borderRadius: 12,
    animation: BOX_SHADOW_ANIM[member.rank],
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  };

  const hasParticles    = ['platinum', 'ruby'].includes(member.rank);
  const hasComet        = member.rank === 'gold';
  const hasSparks       = member.rank === 'ruby';

  return (
    <motion.div
      style={{ borderRadius: 12, position: 'relative' }}
      whileHover={{ y: -10, scale: 1.03 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onClick(member)}
    >
      {/* ── Ambient glow ring (behind card) ─────────────────────────── */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: `0 0 ${hovered ? 45 : 22}px ${cfg.glowColor}`,
          opacity: hovered ? 1 : 0.55,
          borderRadius: 12,
          transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        }}
      />

      {/* ── Card (overflow:hidden clips VFX to rounded corners) ──────── */}
      <div style={cardStyle}>
        {hasComet         && <CometLine color={cfg.color} />}
        {hasSparks        && <ElectricSparks color={cfg.color} />}
        {hasParticles     && <Particles rank={member.rank} />}

        {/* Avatar image section */}
        <div className="relative" style={{ paddingBottom: '110%' }}>
          <img
            src={member.img}
            alt={member.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ borderRadius: '10px 10px 0 0' }}
          />
          {/* Bottom gradient fade */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(to top, #0F172A 0%, #0F172A55 35%, transparent 62%)',
              borderRadius: '10px 10px 0 0',
            }}
          />
          {/* Rank badge — top right */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <RankBadge rank={member.rank} />
          </div>
          {/* Team tag — top left */}
          <div
            className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-sm"
            style={{
              backgroundColor: 'rgba(2,6,23,0.72)',
              border: '1px solid #1F2937',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ color: '#64748B', fontSize: 9, letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>
              ⬡ {member.team}
            </span>
          </div>
          {/* Level — bottom over image */}
          <div className="absolute bottom-3 left-3 z-20 flex items-baseline gap-1">
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                color: cfg.color,
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1,
                textShadow: `0 0 14px ${cfg.glowColor}`,
              }}
            >
              {member.level}
            </span>
            <span style={{ color: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 2 }}>
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
              <span style={{ color: cfg.color, fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
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
              fontFamily: "'Cinzel', serif",
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
            style={{ color: '#64748B', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}
          >
            {ROLE_SYMBOLS[member.roleCode] ?? '◎'} {member.role}
          </div>

          {/* XP bar */}
          <div className="mt-2.5">
            <div className="flex justify-between mb-1" style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
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

          {/* VIEW OPERATIVE button */}
          <button
            className="w-full mt-3 py-1.5 rounded-sm"
            style={{
              backgroundImage: hovered ? `linear-gradient(135deg, ${cfg.gradientFrom}35, ${cfg.gradientTo}35)` : `linear-gradient(135deg, ${cfg.gradientFrom}15, ${cfg.gradientTo}15)`,
              backgroundColor: 'transparent',
              border: `1px solid ${hovered ? cfg.color + '70' : cfg.color + '30'}`,
              color: hovered ? cfg.color : '#64748B',
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
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

      {/* ── LED Runner — outside overflow:hidden, traces card border ─── */}
      <LEDRunner member={member} />

      {/* ── Corner decorations — outside overflow:hidden ────────────── */}
      <CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.5} />
    </motion.div>
  );
}