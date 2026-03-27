/**
 * Guild Member Data — LOOP Solutions
 * Rank config + role symbol mapping used across guild UI components.
 * Source of truth for rank tiering, colors, and symbols.
 */

export type RankKey = "iron" | "bronze" | "silver" | "gold" | "platinum" | "ruby" | "diamond";

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
  lpPerLevel: number;
}

export const RANKS: Record<RankKey, RankConfig> = {
  iron: {
    label: "IRON",
    tier: 1,
    color: "#9CA3AF",
    gradientFrom: "#4B5563",
    gradientTo: "#9CA3AF",
    glowColor: "rgba(156,163,175,0.35)",
    symbol: "⬡",
    particleColor: "#9CA3AF",
    minLevel: 1,
    maxLevel: 14,
    lpPerLevel: 100,
  },
  bronze: {
    label: "BRONZE",
    tier: 2,
    color: "#CD7F32",
    gradientFrom: "#92400E",
    gradientTo: "#F59E0B",
    glowColor: "rgba(205,127,50,0.55)",
    symbol: "◈",
    particleColor: "#CD7F32",
    minLevel: 15,
    maxLevel: 34,
    lpPerLevel: 350,
  },
  silver: {
    label: "SILVER",
    tier: 3,
    color: "#CBD5E1",
    gradientFrom: "#94A3B8",
    gradientTo: "#E2E8F0",
    glowColor: "rgba(203,213,225,0.5)",
    symbol: "◇",
    particleColor: "#CBD5E1",
    minLevel: 35,
    maxLevel: 54,
    lpPerLevel: 800,
  },
  gold: {
    label: "GOLD",
    tier: 4,
    color: "#FFD700",
    gradientFrom: "#F59E0B",
    gradientTo: "#FDE68A",
    glowColor: "rgba(255,215,0,0.6)",
    symbol: "★",
    particleColor: "#FFD700",
    minLevel: 55,
    maxLevel: 74,
    lpPerLevel: 2000,
  },
  platinum: {
    label: "PLATINUM",
    tier: 5,
    color: "#14B8A6",
    gradientFrom: "#14B8A6",
    gradientTo: "#8B5CF6",
    glowColor: "rgba(20,184,166,0.6)",
    symbol: "❋",
    particleColor: "#14B8A6",
    minLevel: 75,
    maxLevel: 94,
    lpPerLevel: 5000,
  },
  ruby: {
    label: "RUBY",
    tier: 6,
    color: "#EF4444",
    gradientFrom: "#DC2626",
    gradientTo: "#F87171",
    glowColor: "rgba(239,68,68,0.7)",
    symbol: "♦",
    particleColor: "#EF4444",
    minLevel: 95,
    maxLevel: 114,
    lpPerLevel: 12000,
  },
  diamond: {
    label: "DIAMOND",
    tier: 7,
    color: "#818CF8",
    gradientFrom: "#818CF8",
    gradientTo: "#7DD3FC",
    glowColor: "rgba(129,140,248,0.7)",
    symbol: "✦",
    particleColor: "#7DD3FC",
    minLevel: 115,
    maxLevel: 135,
    uncapped: true,
    lpPerLevel: 30000,
  },
};

// Role code → display symbol mapping (guild aesthetic)
export const ROLE_SYMBOLS: Record<string, string> = {
  // Leadership
  PM: "⊙",
  PO: "◉",
  CEO: "⬢",
  SC: "◈",
  MAP: "★",

  // Business
  HR: "◇",
  MKT: "◐",

  // Design
  DESIGNER: "✦",
  STAFF: "✦",

  // Development
  BOW: "⌖",
  DAGGER: "⌗",
  DUAL: "⊛",
  DEV_FE: "⌖",
  DEV_BE: "⌗",
  DEV_FS: "⊛",

  // Infra / QA
  SHIELD: "⬡",
  DEVOPS: "⬡",
  QA: "◎",

  // Data
  DATA: "◆",
};

// Normalize a rank string to RankKey
export function normalizeRank(rank?: string | null): RankKey {
  const key = (rank ?? "iron").toLowerCase() as RankKey;
  return RANKS[key] ? key : "iron";
}

// Format LP balance for display (e.g. 1500 → "1.5K", 1200000 → "1.20M")
export function formatLP(lp: number): string {
  if (lp >= 1_000_000) return `${(lp / 1_000_000).toFixed(2)}M`;
  if (lp >= 1_000) return `${(lp / 1_000).toFixed(1)}K`;
  return lp.toString();
}

// Calculate XP percentage
export function calcXpPct(currentXp: number, maxXp: number): number {
  if (!maxXp || maxXp <= 0) return 0;
  return Math.min(100, Math.round((currentXp / maxXp) * 100));
}

// Box-shadow animation name per rank
export const BOX_SHADOW_ANIM: Record<RankKey, string | undefined> = {
  iron: undefined,
  bronze: "guildBronzeFlow 2.5s ease-in-out infinite",
  silver: "guildSilverPulse 2s ease-in-out infinite",
  gold: "guildGoldGlow 2s ease-in-out infinite",
  platinum: "guildPlatinumPulse 1.8s ease-in-out infinite",
  ruby: "guildHeartbeat 1.1s ease-in-out infinite",
  diamond: "guildDiamondSpectral 3.5s ease-in-out infinite",
};

// Rank tier icon (lucide-based, passed as icon)
export const RANK_TIER_ICONS: Record<RankKey, string> = {
  iron: "⬡",
  bronze: "◈",
  silver: "◇",
  gold: "★",
  platinum: "❋",
  ruby: "♦",
  diamond: "✦",
};
