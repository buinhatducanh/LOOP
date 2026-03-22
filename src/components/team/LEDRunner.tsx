"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RANKS, RankKey } from './teamRanks';

// ── Neon descriptor ──────────────────────────────────────────────────────────
interface Neon {
  color: string;
  hasGlow: boolean;
  glowBlur: number;
  trailFrac: number;
  speed: number;
  opacity: number;
  sw: number;
  isPreview: boolean;
}

// ── Config builder ───────────────────────────────────────────────────────────
function buildNeons(rank: RankKey, level: number, memberId: string): Neon[] {
  const baseColor = RANKS[rank].color;
  const list: Neon[] = [];

  let mainCount: number;
  let speed: number;
  let trail: number;
  let hasGlow: boolean;
  let glowBlur: number;
  let sw: number;

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

  } else {
    // diamond — 8-layer LED system
    mainCount = 8;
    speed = 1.0;
    trail = 0.45;
    hasGlow = true;
    glowBlur = 22;
    sw = 1.8;
  }

  // Main neons (evenly spaced around perimeter)
  for (let i = 0; i < mainCount; i++) {
    const isDiamond = rank === 'diamond';
    list.push({
      color: isDiamond ? `url(#diamond-grad-${memberId})` : baseColor,
      hasGlow,
      glowBlur: isDiamond ? glowBlur * (1 - i * 0.08) : glowBlur,
      trailFrac: isDiamond ? trail * (1 - i * 0.03) : trail,
      speed: isDiamond ? speed * (1 + i * 0.05) : speed,
      opacity: isDiamond ? 0.9 - (i * 0.08) : 1,
      sw: isDiamond ? sw * (1 + i * 0.2) : sw,
      isPreview: false,
    });
  }

  // Preview neons (next-rank preview)
  if (rank === 'gold' && level >= 70) {
    list.push({ color: '#2DD4BF', hasGlow: false, glowBlur: 0, trailFrac: 0.06, speed: speed * 1.45, opacity: 0.35, sw: 1, isPreview: true });
  } else if (rank === 'platinum' && level >= 90) {
    list.push({ color: '#9B1C1C', hasGlow: false, glowBlur: 0, trailFrac: 0.06, speed: speed * 1.35, opacity: 0.45, sw: 1, isPreview: true });
  } else if (rank === 'ruby' && level >= 110) {
    list.push({ color: '#F1F5F9', hasGlow: true, glowBlur: 4, trailFrac: 0.05, speed: speed * 1.28, opacity: 0.42, sw: 1, isPreview: true });
  }

  return list;
}

// ── SVG path helpers ─────────────────────────────────────────────────────────
function clockwisePath(w: number, h: number, r: number): string {
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

// ── LEDRunner component ─────────────────────────────────────────────────────
interface LEDRunnerProps {
  memberId: string | number;
  rank: RankKey;
  level: number;
  boosted?: boolean;
}

export function LEDRunner({ memberId, rank, level, boosted = false }: LEDRunnerProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<[number, number] | null>(null);
  const BR = 12; // must match card border-radius
  const memberIdStr = String(memberId);

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

  const neons = buildNeons(rank, level, memberIdStr);

  return (
    <div
      ref={divRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-12"
      style={{ borderRadius: BR }}
    >
      {dims && (() => {
        const [w, h] = dims;
        const pd = clockwisePath(w, h, BR);
        const P = calcPerimeter(w, h, BR);

        return (
          <svg
            width="100%"
            height="100%"
            className="absolute inset-0 overflow-visible"
          >
            <defs>
              {/* Diamond gradient */}
              {rank === 'diamond' && (
                <linearGradient id={`diamond-grad-${memberIdStr}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <motion.stop
                    offset="0%"
                    animate={{ stopColor: ['#FFFFFF', '#7DD3FC', '#FFFFFF'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    stopOpacity="0.95"
                  />
                  <stop offset="25%" stopColor="#7DD3FC" stopOpacity="0.85" />
                  <motion.stop
                    offset="50%"
                    animate={{ stopColor: ['#6366F1', '#818CF8', '#6366F1'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    stopOpacity="0.75"
                  />
                  <stop offset="75%" stopColor="#818CF8" stopOpacity="0.85" />
                  <motion.stop
                    offset="100%"
                    animate={{ stopColor: ['#FFFFFF', '#7DD3FC', '#FFFFFF'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    stopOpacity="0.95"
                  />
                </linearGradient>
              )}

              {neons.map((n, i) =>
                n.hasGlow ? (
                  <filter
                    key={`led-filter-${memberIdStr}-${i}`}
                    id={`led-filter-${memberIdStr}-${i}`}
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                  >
                    <feGaussianBlur in="SourceGraphic" stdDeviation={n.glowBlur * 1.5} result="auraBlur" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation={n.glowBlur} result="outerBlur" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation={n.glowBlur * 0.3} result="innerBlur" />
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

            {neons.map((n, i) => {
              const trail = Math.max(n.trailFrac * P, 5);
              const gap = Math.max(P - trail, 1);
              const mainCountTotal = neons.filter((x) => !x.isPreview).length;
              const isMain = !n.isPreview;
              const mainIdx = isMain ? neons.slice(0, i).filter((x) => !x.isPreview).length : 0;
              const layerOffset = rank === 'diamond' ? (i * 12) : 0;
              const startOff = isMain
                ? -(mainIdx / mainCountTotal) * P - layerOffset
                : -(P * (0.15 + i * 0.25));
              const speedMult = boosted ? 0.28 : 1;

              return (
                <motion.path
                  key={`led-neon-${memberIdStr}-${i}`}
                  d={pd}
                  fill="none"
                  stroke={n.color}
                  strokeWidth={boosted ? n.sw * 1.6 : n.sw}
                  strokeLinecap="round"
                  strokeDasharray={`${boosted ? trail * 1.4 : trail} ${gap}`}
                  opacity={boosted ? Math.min(n.opacity * 1.35, 1) : n.opacity}
                  filter={n.hasGlow ? `url(#led-filter-${memberIdStr}-${i})` : undefined}
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
