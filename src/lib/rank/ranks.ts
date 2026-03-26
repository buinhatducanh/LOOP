// ── Rank configuration for guild/operative system ──────────────────────────
export type RankKey = 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'diamond';

export interface RankConfig {
  label: string;
  tier: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  symbol: string;
  particleColor: string;
  minLevel: number;
  maxLevel: number;
  uncapped?: boolean;
}

export const RANKS: Record<RankKey, RankConfig> = {
  iron: {
    label: 'IRON',
    tier: 1,
    color: '#9CA3AF',
    gradientFrom: '#4B5563',
    gradientTo: '#9CA3AF',
    glowColor: 'rgba(156,163,175,0.35)',
    symbol: '⬡',
    particleColor: '#9CA3AF',
    minLevel: 1,
    maxLevel: 14,
  },
  bronze: {
    label: 'BRONZE',
    tier: 2,
    color: '#CD7F32',
    gradientFrom: '#92400E',
    gradientTo: '#F59E0B',
    glowColor: 'rgba(205,127,50,0.55)',
    symbol: '◈',
    particleColor: '#CD7F32',
    minLevel: 15,
    maxLevel: 34,
  },
  silver: {
    label: 'SILVER',
    tier: 3,
    color: '#CBD5E1',
    gradientFrom: '#94A3B8',
    gradientTo: '#E2E8F0',
    glowColor: 'rgba(203,213,225,0.5)',
    symbol: '◇',
    particleColor: '#CBD5E1',
    minLevel: 35,
    maxLevel: 54,
  },
  gold: {
    label: 'GOLD',
    tier: 4,
    color: '#FFD700',
    gradientFrom: '#F59E0B',
    gradientTo: '#FDE68A',
    glowColor: 'rgba(255,215,0,0.6)',
    symbol: '★',
    particleColor: '#FFD700',
    minLevel: 55,
    maxLevel: 74,
  },
  platinum: {
    label: 'PLATINUM',
    tier: 5,
    color: '#14B8A6',
    gradientFrom: '#14B8A6',
    gradientTo: '#8B5CF6',
    glowColor: 'rgba(20,184,166,0.6)',
    symbol: '❋',
    particleColor: '#14B8A6',
    minLevel: 75,
    maxLevel: 94,
  },
  ruby: {
    label: 'RUBY',
    tier: 6,
    color: '#EF4444',
    gradientFrom: '#DC2626',
    gradientTo: '#F87171',
    glowColor: 'rgba(239,68,68,0.7)',
    symbol: '♦',
    particleColor: '#EF4444',
    minLevel: 95,
    maxLevel: 114,
  },
  diamond: {
    label: 'DIAMOND',
    tier: 7,
    color: '#818CF8',
    gradientFrom: '#818CF8',
    gradientTo: '#7DD3FC',
    glowColor: 'rgba(129,140,248,0.7)',
    symbol: '✦',
    particleColor: '#7DD3FC',
    minLevel: 115,
    maxLevel: 135,
    uncapped: true,
  },
};

// ── Box-shadow pulsing animations per rank ─────────────────────────────────
export const BOX_SHADOW_ANIM: Record<RankKey, string | undefined> = {
  iron:     undefined,
  bronze:   'guildBronzeFlow 2.5s ease-in-out infinite',
  silver:   'guildSilverPulse 2s ease-in-out infinite',
  gold:     'guildGoldGlow 2s ease-in-out infinite',
  platinum: 'guildPlatinumPulse 1.8s ease-in-out infinite',
  ruby:     'guildGlitch 2.4s steps(1) infinite',
  diamond:  'guildDiamondSpectral 3s ease-in-out infinite',
};

// ── Rank entrance animation variants ───────────────────────────────────────
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
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
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
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
        style: { perspective: 900 },
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
        transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
      };
    default:
      return {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut', delay },
      };
  }
}

// ── Determine rank from level ───────────────────────────────────────────────
export function getRankFromLevel(level: number): RankKey {
  if (level >= 115) return 'diamond';
  if (level >= 95)  return 'ruby';
  if (level >= 75)  return 'platinum';
  if (level >= 55)  return 'gold';
  if (level >= 35)  return 'silver';
  if (level >= 15)  return 'bronze';
  return 'iron';
}

// ── Quick rank accessors ────────────────────────────────────────────────────
export function getRankColor(rank: RankKey): string {
  return RANKS[rank].color;
}
export function getRankLabel(rank: RankKey): string {
  return RANKS[rank].label;
}
export function getRankSymbol(rank: RankKey): string {
  return RANKS[rank].symbol;
}

// ── Role symbol map ──────────────────────────────────────────────────────────
export const ROLE_SYMBOLS: Record<string, string> = {
  CEO:         '⬢',
  CTO:         '⬢',
  FOUNDER:     '⬢',
  PM:          '⊙',
  PO:          '◉',
  SC:          '◈',
  HR:          '◇',
  MKT:         '◐',
  MARKETING:   '◐',
  DESIGNER:    '✦',
  DESIGN:      '✦',
  STAFF:       '✦',
  BOW:         '⌖',
  DAGGER:      '⌗',
  DUAL:        '⊛',
  DEV_FE:      '⌖',
  DEV_BE:      '⌗',
  DEV_FS:      '⊛',
  DEVOPS:      '⬡',
  QA:          '◎',
  DATA:        '◆',
  TECH:        '★',
  LEADERSHIP:  '★',
  default:     '◎',
};

// ── CSS keyframe animations ─────────────────────────────────────────────────
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
  @keyframes guildGlitch {
    0%   { clip-path: inset(0 0 95% 0); transform: translateX(-4px) skewX(-12deg); opacity: 0.85; }
    10%  { clip-path: inset(30% 0 50% 0); transform: translateX(4px) skewX(8deg); }
    25%  { clip-path: inset(60% 0 20% 0); transform: translateX(-3px) skewX(-6deg); opacity: 0.9; }
    40%  { clip-path: inset(80% 0 5% 0); transform: translateX(2px) skewX(4deg); }
    60%  { clip-path: inset(10% 0 70% 0); transform: translateX(-5px) skewX(-9deg); opacity: 0.8; }
    80%  { clip-path: inset(45% 0 40% 0); transform: translateX(3px) skewX(6deg); }
    100% { clip-path: inset(0 0 95% 0); transform: translateX(-4px) skewX(-12deg); opacity: 0; }
  }
  @keyframes guildGlitchInner {
    0%   { clip-path: inset(5% 0 80% 0); transform: translateX(3px) skewX(10deg); opacity: 0.7; }
    30%  { clip-path: inset(50% 0 25% 0); transform: translateX(-2px) skewX(-5deg); opacity: 0.85; }
    60%  { clip-path: inset(75% 0 10% 0); transform: translateX(4px) skewX(8deg); opacity: 0.75; }
    100% { clip-path: inset(5% 0 80% 0); transform: translateX(3px) skewX(10deg); opacity: 0; }
  }
  @keyframes auroraShift {
    0%   { opacity: 0.18; background-position: 0% 50%; }
    25%  { opacity: 0.45; background-position: 30% 20%; }
    50%  { opacity: 0.28; background-position: 60% 80%; }
    75%  { opacity: 0.52; background-position: 80% 40%; }
    100% { opacity: 0.18; background-position: 0% 50%; }
  }
  @keyframes guildBoostRipple {
    0%   { opacity: 1; transform: scale(0.85); }
    100% { opacity: 0; transform: scale(1.05); }
  }
  @keyframes guildHoloShine {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes hudRankPulse {
    0%,100% { transform: scale(1); opacity: 0.8; }
    50%     { transform: scale(1.5); opacity: 0; }
  }
  @keyframes guildTabSpark {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
    60%  { opacity: 0.7; }
    100% { transform: translateY(-36px) translateX(var(--spark-dx, 0px)) scale(0.1); opacity: 0; }
  }
`;
