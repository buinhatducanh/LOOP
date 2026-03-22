import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Member, RANKS, RankKey } from './memberData';

// ── Neon descriptor ──────────────────────────────────────────────────────
interface Neon {
  color: string;
  hasGlow: boolean;
  glowBlur: number;
  trailFrac: number;  // fraction of perimeter
  speed: number;      // seconds per full revolution
  opacity: number;
  sw: number;         // stroke-width
  isPreview: boolean;
}

// Diamond neons use diamond/prismatic colors - Focused on Indigo, Cyan, and White
// Colors now managed via SVG Gradient for Diamond rank
const PRISM: string[] = []; 

// ── Config builder ────────────────────────────────────────────────────────
function buildNeons(rank: RankKey, level: number, memberId: string): Neon[] {
  const baseColor = RANKS[rank].color;
  const list: Neon[] = [];

  let mainCount: number;
  let speed: number;
  let trail: number;
  let hasGlow: boolean;
  let glowBlur: number;
  let sw: number;

  // ── Per-rank base params ───────────────────────────────────────────────
  if (rank === 'iron') {
    mainCount = level <= 4 ? 1 : level <= 9 ? 2 : 3;
    speed = 8; trail = 0.04; hasGlow = false; glowBlur = 0; sw = 1.5;

  } else if (rank === 'bronze') {
    mainCount = level <= 19 ? 1 : level <= 24 ? 2 : 3;
    speed = 5.5; trail = 0.08; hasGlow = false; glowBlur = 0; sw = 1.5;

  } else if (rank === 'silver') {
    mainCount = level <= 39 ? 1 : level <= 44 ? 2 : 3;
    speed = 4.0; trail = 0.13; hasGlow = true; glowBlur = 2.5; sw = 1.5;

  } else if (rank === 'gold') {
    mainCount = level <= 59 ? 1 : level <= 64 ? 2 : 3;
    speed = 3.0; trail = 0.19; hasGlow = true; glowBlur = 5; sw = 2;

  } else if (rank === 'platinum') {
    mainCount = level <= 79 ? 1 : level <= 84 ? 2 : 3;
    speed = 2.5; trail = 0.22; hasGlow = true; glowBlur = 7; sw = 2;

  } else if (rank === 'ruby') {
    mainCount = level <= 99 ? 1 : level <= 104 ? 2 : 3;
    speed = 1.8; trail = 0.17; hasGlow = true; glowBlur = 9; sw = 2;

  } else { // diamond - Sovereign Elite
    // DIAMOND always has 8-layer LED system for maximum rank prestige
    // Refined to "Dynamic Range Gradient" for a more minimalist/elegant feel
    mainCount = 8;
    speed = 1.0; 
    trail = 0.45; // Longer, more ethereal trails
    hasGlow = true; 
    glowBlur = 22; 
    sw = 1.8; // Thinner, more precise lines for "Zen" feel
  }

  // ── Main neons (evenly spaced around perimeter) ───────────────────────
  for (let i = 0; i < mainCount; i++) {
    const isDiamond = rank === 'diamond';
    list.push({
      color: isDiamond ? `url(#diamond-grad-${memberId})` : baseColor,
      hasGlow,
      glowBlur: isDiamond ? glowBlur * (1 - i * 0.08) : glowBlur, // Layered blur for depth
      trailFrac: isDiamond ? trail * (1 - i * 0.03) : trail,
      // Diamond neons have slightly different speeds to create a "trailing spectral" effect
      speed: isDiamond ? speed * (1 + i * 0.05) : speed,
      opacity: isDiamond ? 0.9 - (i * 0.08) : 1, // Fading outer layers
      sw: isDiamond ? sw * (1 + i * 0.2) : sw,   // Outwardly thickening glow
      isPreview: false,
    });
  }

  // ── Preview neons (next-rank preview) ────────────────────────────────
  // GOLD Lv70-74: 1 faint platinum teal neon
  if (rank === 'gold' && level >= 70) {
    list.push({
      color: '#2DD4BF',
      hasGlow: false, glowBlur: 0, trailFrac: 0.06,
      speed: speed * 1.45, opacity: 0.35, sw: 1, isPreview: true,
    });
  }
  // PLATINUM Lv90-94: 1 dark ruby neon (no glow)
  else if (rank === 'platinum' && level >= 90) {
    list.push({
      color: '#9B1C1C',
      hasGlow: false, glowBlur: 0, trailFrac: 0.06,
      speed: speed * 1.35, opacity: 0.45, sw: 1, isPreview: true,
    });
  }
  // RUBY Lv110-114: 1 white glitch neon
  else if (rank === 'ruby' && level >= 110) {
    list.push({
      color: '#F1F5F9',
      hasGlow: true, glowBlur: 4, trailFrac: 0.05,
      speed: speed * 1.28, opacity: 0.42, sw: 1, isPreview: true,
    });
  }

  return list;
}

// ── SVG path helpers ─────────────────────────────────────────────────────
function clockwisePath(w: number, h: number, r: number): string {
  // Clockwise from top-left: → right → down → left ↑ up
  return (
    `M${r},0 ` +
    `L${w - r},0 ` +
    `A${r},${r},0,0,1,${w},${r} ` +
    `L${w},${h - r} ` +
    `A${r},${r},0,0,1,${w - r},${h} ` +
    `L${r},${h} ` +
    `A${r},${r},0,0,1,0,${h - r} ` +
    `L0,${r} ` +
    `A${r},${r},0,0,1,${r},0 ` +
    `Z`
  );
}

function calcPerimeter(w: number, h: number, r: number): number {
  return 2 * (w - 2 * r + h - 2 * r) + 2 * Math.PI * r;
}

// ── LEDRunner component ──────────────────────────────────────────────────
export function LEDRunner({ member, boosted = false }: { member: Member; boosted?: boolean }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<[number, number] | null>(null);
  const BR = 12; // must match card border-radius

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setDims([w, h]);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const neons = member ? buildNeons(member.rank, member.level, member.id) : [];

  return (
    <div
      ref={divRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        borderRadius: BR,
        zIndex: 12,
      }}
    >
      {member && dims && (() => {
        const [w, h] = dims;
        const pd = clockwisePath(w, h, BR);
        const P = calcPerimeter(w, h, BR);

        return (
          <svg
            key={`${member.id}-${boosted ? 'boost' : 'normal'}`}
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            <defs>
              {/* Dynamic Range Gradient for Diamond Rank - Cyber-Zen Spectrum */}
              {member.rank === 'diamond' && (
                <linearGradient id={`diamond-grad-${member.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <motion.stop 
                    offset="0%" 
                    animate={{ stopColor: ["#FFFFFF", "#7DD3FC", "#FFFFFF"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    stopOpacity="0.95" 
                  />
                  <stop offset="25%" stopColor="#7DD3FC" stopOpacity="0.85" />
                  <motion.stop 
                    offset="50%" 
                    animate={{ stopColor: ["#6366F1", "#818CF8", "#6366F1"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    stopOpacity="0.75" 
                  />
                  <stop offset="75%" stopColor="#818CF8" stopOpacity="0.85" />
                  <motion.stop 
                    offset="100%" 
                    animate={{ stopColor: ["#FFFFFF", "#7DD3FC", "#FFFFFF"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    stopOpacity="0.95" 
                  />
                </linearGradient>
              )}

              {neons.map((n, i) =>
                n.hasGlow ? (
                  <filter
                    key={`led-filter-${member.id}-${i}`}
                    id={`led-filter-${member.id}-${i}`}
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                  >
                    {/* Far outer atmosphere for extra prestige */}
                    <feGaussianBlur
                      in="SourceGraphic"
                      stdDeviation={n.glowBlur * 1.5}
                      result="auraBlur"
                    />
                    {/* Soft outer glow */}
                    <feGaussianBlur
                      in="SourceGraphic"
                      stdDeviation={n.glowBlur}
                      result="outerBlur"
                    />
                    {/* Tight inner core glow */}
                    <feGaussianBlur
                      in="SourceGraphic"
                      stdDeviation={n.glowBlur * 0.3}
                      result="innerBlur"
                    />
                    <feMerge>
                      <feMergeNode in="auraBlur" />
                      <feMergeNode in="outerBlur" />
                      <feMergeNode in="innerBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ) : null
              )}
            </defs>

            {/* All neons (main + preview) */}
            {neons.map((n, i) => {
              const trail = Math.max(n.trailFrac * P, 5);
              const gap = Math.max(P - trail, 1);
              // Distribute start positions evenly for main neons
              const mainCountTotal = neons.filter((x) => !x.isPreview).length;
              const isMain = !n.isPreview;
              const mainIdx = isMain ? neons.slice(0, i).filter((x) => !x.isPreview).length : 0;
              
              // Evenly spaced for main, fixed offset for preview
              // For Diamond, we slightly offset each of the 8 layers to create a "ghosting" motion trail
              const layerOffset = member.rank === 'diamond' ? (i * 12) : 0;
              const startOff = isMain
                ? -(mainIdx / mainCountTotal) * P - layerOffset
                : -(P * (0.15 + i * 0.25));

              // Boost multiplier: when boosted, speed is 3.5x faster
              const speedMult = boosted ? 0.28 : 1;

              return (
                <motion.path
                  key={`led-neon-${member.id}-${i}`}
                  d={pd}
                  fill="none"
                  stroke={n.color}
                  strokeWidth={boosted ? n.sw * 1.6 : n.sw}
                  strokeLinecap="round"
                  strokeDasharray={`${boosted ? trail * 1.4 : trail} ${gap}`}
                  opacity={boosted ? Math.min(n.opacity * 1.35, 1) : n.opacity}
                  filter={n.hasGlow ? `url(#led-filter-${member.id}-${i})` : undefined}
                  initial={{ strokeDashoffset: startOff }}
                  animate={{ strokeDashoffset: startOff - P }}
                  transition={{
                    duration: n.speed * speedMult,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'linear',
                  }}
                />
              );
            })}
          </svg>
        );
      })()}
    </div>
  );
}