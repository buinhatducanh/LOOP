"use client";

/**
 * LEDRunner — GPU-composited SVG LED border animation around card
 *
 * Renders neon LED trails that orbit the card border using CSS animations.
 * Uses SVG stroke-dasharray technique — zero JS per-frame, fully GPU composited.
 * Diamond rank gets a prismatic gradient layer.
 */
import { useEffect, useRef, useState, useMemo, memo } from "react";
import type { RankKey } from "./guildMemberData";

interface MemberLite {
  id: string | number;
  rank: RankKey;
  level: number;
}

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

const BR = 12; // border-radius of card

function buildNeons(rank: RankKey, level: number, memberId: string | number): Neon[] {
  const baseColor = "#818CF8"; // fallback
  const list: Neon[] = [];

  let mainCount: number;
  let speed: number;
  let trail: number;
  let hasGlow: boolean;
  let glowBlur: number;
  let sw: number;

  switch (rank) {
    case "iron":
      mainCount = level <= 4 ? 1 : level <= 9 ? 2 : 3;
      speed = 8; trail = 0.04; hasGlow = false; glowBlur = 0; sw = 1.5;
      break;
    case "bronze":
      mainCount = level <= 19 ? 1 : level <= 24 ? 2 : 3;
      speed = 5.5; trail = 0.08; hasGlow = false; glowBlur = 0; sw = 1.5;
      break;
    case "silver":
      mainCount = level <= 39 ? 1 : level <= 44 ? 2 : 3;
      speed = 4.0; trail = 0.13; hasGlow = true; glowBlur = 2.5; sw = 1.5;
      break;
    case "gold":
      mainCount = level <= 59 ? 1 : level <= 64 ? 2 : 3;
      speed = 3.0; trail = 0.19; hasGlow = true; glowBlur = 5; sw = 2;
      break;
    case "platinum":
      mainCount = level <= 79 ? 1 : level <= 84 ? 2 : 3;
      speed = 2.5; trail = 0.22; hasGlow = true; glowBlur = 7; sw = 2;
      break;
    case "ruby":
      mainCount = level <= 99 ? 1 : level <= 104 ? 2 : 3;
      speed = 1.8; trail = 0.17; hasGlow = true; glowBlur = 9; sw = 2;
      break;
    default: {
      // diamond — 5 layers
      mainCount = 5;
      speed = 1.0; trail = 0.35; hasGlow = true; glowBlur = 14; sw = 1.8;
    }
  }

  const isDiamond = rank === "diamond";

  for (let i = 0; i < mainCount; i++) {
    list.push({
      color: isDiamond ? `url(#diamond-grad-${memberId})` : baseColor,
      hasGlow,
      glowBlur: isDiamond ? glowBlur * (1 - i * 0.1) : glowBlur,
      trailFrac: isDiamond ? trail * (1 - i * 0.05) : trail,
      speed: isDiamond ? speed * (1 + i * 0.07) : speed,
      opacity: isDiamond ? 0.9 - i * 0.12 : 1,
      sw: isDiamond ? sw * (1 + i * 0.25) : sw,
      isPreview: false,
    });
  }

  // Preview neons (next-rank preview)
  if (rank === "gold" && level >= 70) {
    list.push({ color: "#2DD4BF", hasGlow: false, glowBlur: 0, trailFrac: 0.06, speed: speed * 1.45, opacity: 0.35, sw: 1, isPreview: true });
  } else if (rank === "platinum" && level >= 90) {
    list.push({ color: "#9B1C1C", hasGlow: false, glowBlur: 0, trailFrac: 0.06, speed: speed * 1.35, opacity: 0.45, sw: 1, isPreview: true });
  } else if (rank === "ruby" && level >= 110) {
    list.push({ color: "#F1F5F9", hasGlow: true, glowBlur: 4, trailFrac: 0.05, speed: speed * 1.28, opacity: 0.42, sw: 1, isPreview: true });
  }

  return list;
}

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
    "Z"
  );
}

function calcPerimeter(w: number, h: number, r: number): number {
  return 2 * (w - 2 * r + h - 2 * r) + 2 * Math.PI * r;
}

export const LEDRunner = memo(function LEDRunner({
  member,
  boosted = false,
}: {
  member: MemberLite;
  boosted?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const [dims, setDims] = useState<[number, number] | null>(null);

  const neons = useMemo(
    () => buildNeons(member.rank, member.level, member.id),
    [member.rank, member.level]
  );

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        setDims((prev) => (prev && prev[0] === w && prev[1] === h ? prev : [w, h]));
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dims) return;
    const [w, h] = dims;
    const P = calcPerimeter(w, h, BR);

    let css = "";
    neons.forEach((_, i) => {
      css += `@keyframes led${member.id}n${i}{from{stroke-dashoffset:0}to{stroke-dashoffset:${(-P).toFixed(2)}}}\n`;
    });

    if (!styleRef.current) {
      const el = document.createElement("style");
      el.id = `led-kf-${member.id}`;
      document.head.appendChild(el);
      styleRef.current = el;
    }
    styleRef.current.textContent = css;
  }, [dims, member.id, neons]);

  useEffect(() => {
    return () => {
      styleRef.current?.remove();
      styleRef.current = null;
    };
  }, []);

  if (!dims) {
    return (
      <div
        ref={divRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: BR, zIndex: 12 }}
      />
    );
  }

  const [w, h] = dims;
  const pd = clockwisePath(w, h, BR);
  const P = calcPerimeter(w, h, BR);
  const mainCount = neons.filter((n) => !n.isPreview).length;
  let mainSeen = 0;

  return (
    <div
      ref={divRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: BR, zIndex: 12 }}
    >
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          {member.rank === "diamond" && (
            <linearGradient id={`diamond-grad-${member.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#7DD3FC" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#7DD3FC" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
            </linearGradient>
          )}
          {neons.map((n, i) =>
            n.hasGlow ? (
              <filter
                key={`f-${member.id}-${i}`}
                id={`led-filter-${member.id}-${i}`}
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation={n.glowBlur} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ) : null
          )}
        </defs>

        {neons.map((n, i) => {
          const speedMult = boosted ? 0.28 : 1;
          const actualSpeed = n.speed * speedMult;
          const trail = Math.max(n.trailFrac * P * (boosted ? 1.4 : 1), 5);
          const gap = Math.max(P - trail, 1);

          const isMain = !n.isPreview;
          const myMainIdx = isMain ? mainSeen : 0;
          if (isMain) mainSeen++;

          const layerOffset = member.rank === "diamond" ? i * 12 : 0;
          const startFrac = isMain ? myMainIdx / mainCount + layerOffset / P : 0.15 + i * 0.25;

          const animDelay = -(startFrac * actualSpeed);

          return (
            <path
              key={`led-${member.id}-${i}`}
              d={pd}
              fill="none"
              stroke={n.color}
              strokeWidth={boosted ? n.sw * 1.6 : n.sw}
              strokeLinecap="round"
              strokeDasharray={`${trail} ${gap}`}
              opacity={boosted ? Math.min(n.opacity * 1.35, 1) : n.opacity}
              filter={n.hasGlow ? `url(#led-filter-${member.id}-${i})` : undefined}
              style={{
                animation: `led${member.id}n${i} ${actualSpeed}s linear infinite`,
                animationDelay: `${animDelay.toFixed(3)}s`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
});
