"use client";

/**
 * HUDPanel — Guild-styled slide-in member stats panel.
 * Matches CHECKING FE design: slide from right, radar chart, 4 tabs, Diamond crown badge.
 *
 * Triggered by: clicking any MemberCard on the team page.
 * Data source: loopStore.activeMember (MemberStats type).
 *
 * NOTE: MemberCard passes skills as string[]. HUDPanel generates realistic fake values
 * from skill names for the radar chart and skill bars.
 */
import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Zap, Trophy, Target, GitBranch } from "lucide-react";
import Link from "next/link";
import { useLoopStore, type MemberStats } from "@/app/store/loopStore";
import { RANKS, normalizeRank, type RankKey } from "./guildMemberData";
import { DS } from "@/lib/design-tokens";

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtLP(n: number): string {
  if (!n && n !== 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

/** Deterministic fake skill value from a skill name string */
function skillValue(skill: string): number {
  let hash = 0;
  for (let i = 0; i < skill.length; i++) {
    hash = ((hash << 5) - hash) + skill.charCodeAt(i);
    hash |= 0;
  }
  // Map to 25–95 range
  return 25 + Math.abs(hash) % 71;
}

// ── Custom SVG Radar Chart ───────────────────────────────────────────────────
interface RadarDatum { subject: string; A: number; }

function CustomRadar({ data, color, memberId }: { data: RadarDatum[]; color: string; memberId: string }) {
  const SIZE = 160;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const MAX_R = SIZE * 0.34;
  const LEVELS = 4;
  const n = data.length;
  const filterId = `hud-radar-${memberId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, frac: number) => ({
    x: CX + MAX_R * frac * Math.cos(angle(i)),
    y: CY + MAX_R * frac * Math.sin(angle(i)),
  });

  const rings = Array.from({ length: LEVELS }, (_, l) => {
    const frac = (l + 1) / LEVELS;
    return data.map((_, i) => pt(i, frac)).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  });

  const shape = data.map((d, i) => {
    const p = pt(i, Math.min(Math.max(d.A, 0), 100) / 100);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {data.map((_, i) => {
        const p = pt(i, 1);
        return <line key={i} x1={CX} y1={CY} x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} stroke={DS.border2} strokeWidth={0.8} />;
      })}
      {rings.map((pts, l) => (
        <polygon key={l} points={pts} fill="none" stroke={DS.border2} strokeWidth={0.8} opacity={l === LEVELS - 1 ? 1 : 0.55} />
      ))}
      <polygon points={shape} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.8} strokeLinejoin="round" filter={`url(#${filterId})`} />
      {data.map((d, i) => {
        const p = pt(i, Math.min(Math.max(d.A, 0), 100) / 100);
        return <circle key={i} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={2.8} fill={color} opacity={0.95} />;
      })}
      {data.map((d, i) => {
        const p = pt(i, 1.32);
        return (
          <text key={i} x={p.x.toFixed(2)} y={p.y.toFixed(2)} textAnchor="middle" dominantBaseline="middle"
            fill={DS.text4} fontSize={8.5} fontFamily={DS.mono}>{d.subject}</text>
        );
      })}
      {data.map((d, i) => {
        const pc = pt(i, (Math.min(Math.max(d.A, 0), 100) / 100) * 0.72);
        return (
          <text key={i} x={pc.x.toFixed(2)} y={pc.y.toFixed(2)} textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize={7.5} fontFamily={DS.mono} opacity={0.75}>{d.A}</text>
        );
      })}
    </svg>
  );
}

// ── Tier dots ───────────────────────────────────────────────────────────────
function TierDots({ tier, color }: { tier: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: i < tier ? 8 : 6, height: i < tier ? 8 : 6,
            background: i < tier ? color : DS.border,
            boxShadow: i < tier ? `0 0 6px ${color}` : "none",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Tech chip ────────────────────────────────────────────────────────────────
function TechChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-sm"
      style={{ border: `1px solid ${color}40`, color: DS.text3, background: `${color}0a`, fontFamily: DS.mono, fontSize: 10, letterSpacing: "0.06em" }}
    >
      {label}
    </span>
  );
}

// ── Mission log item ─────────────────────────────────────────────────────────
function MissionItem({ title, date, status, color, lpReward }: { title: string; date: string; status: string; color: string; lpReward?: number }) {
  const sc: Record<string, { label: string; c: string }> = {
    completed: { label: "DONE",   c: "#22C55E" },
    ongoing:   { label: "ACTIVE", c: "#F59E0B" },
    failed:    { label: "FAILED", c: "#EF4444" },
  };
  const s = sc[status] ?? sc.completed;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.c, boxShadow: `0 0 5px ${s.c}` }} />
      <div className="flex-1 min-w-0">
        <div style={{ color: DS.text2, fontSize: 12, lineHeight: 1.4 }}>{title}</div>
        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{date}</div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="px-1.5 py-0.5 rounded-sm"
          style={{ color: s.c, background: `${s.c}15`, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
          {s.label}
        </span>
        {lpReward !== undefined && lpReward > 0 && (
          <span style={{ color, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>
            +{fmtLP(lpReward)} LP
          </span>
        )}
      </div>
    </div>
  );
}

// ── Achievement badge ────────────────────────────────────────────────────────
function AchievementBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: DS.bgCard, border: `1px solid ${color}30` }}>
      <Trophy size={12} style={{ color, flexShrink: 0 }} />
      <span style={{ color: DS.text3, fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ── Rank Progression Timeline ───────────────────────────────────────────────
const ALL_RANKS: RankKey[] = ["iron", "bronze", "silver", "gold", "platinum", "ruby", "diamond"];

function RankTimeline({ member, cfg }: { member: MemberStats; cfg: { color: string } }) {
  const historyMap = new Map(member.rankHistory.map((e) => [e.to, e]));
  const currentRank = normalizeRank(member.rank);
  const currentTier = RANKS[currentRank]?.tier ?? 1;

  return (
    <div>
      <div className="mb-3" style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
        ── RANK CHRONICLE
      </div>
      <div className="relative">
        <div className="absolute" style={{ left: 11, top: 8, bottom: 8, width: 1, background: DS.border }} />
        <div className="space-y-1">
          {[...ALL_RANKS].reverse().map((rankKey, revIdx) => {
            const rankCfg = RANKS[rankKey];
            const event = historyMap.get(rankKey);
            const isAchieved = rankCfg.tier <= currentTier;
            const isCurrent = rankKey === currentRank;

            // Progress within current rank
            let barWidth = 100;
            if (isCurrent && member.level > 0) {
              const levelsInRank = (rankCfg.maxLevel ?? 100) - rankCfg.minLevel + 1;
              const levelsDone = member.level - rankCfg.minLevel;
              barWidth = Math.min(Math.max(Math.round((levelsDone / levelsInRank) * 100), 0), 100);
            }

            return (
              <motion.div
                key={rankKey}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: revIdx * 0.06, duration: 0.35, ease: "easeOut" }}
              >
                <div className="relative flex-shrink-0" style={{ marginTop: 4 }}>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background: isAchieved ? `linear-gradient(135deg, ${rankCfg.gradientFrom}, ${rankCfg.gradientTo})` : DS.bgCard,
                      border: `1.5px solid ${isAchieved ? rankCfg.color : DS.border}`,
                      boxShadow: isCurrent ? `0 0 10px ${rankCfg.glowColor}, 0 0 20px ${rankCfg.glowColor}` : "none",
                    }}
                  >
                    <span style={{ color: isAchieved ? "#fff" : DS.border, fontSize: 8 }}>{rankCfg.symbol}</span>
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${rankCfg.color}`, animation: "hudRankPulse 1.8s ease-in-out infinite" }} />
                    )}
                  </div>
                </div>
                <div className="flex-1 pb-2 rounded-lg px-3 py-2"
                  style={{
                    background: isAchieved
                      ? isCurrent
                        ? `linear-gradient(135deg, ${rankCfg.gradientFrom}18, ${rankCfg.gradientTo}0a)`
                        : DS.bgCard
                      : "transparent",
                    border: isAchieved ? `1px solid ${rankCfg.color}${isCurrent ? "60" : "20"}` : "1px solid transparent",
                    opacity: isAchieved ? 1 : 0.35,
                  }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span style={{ color: isAchieved ? rankCfg.color : DS.border, fontFamily: DS.mono, fontSize: 10, letterSpacing: "0.14em", fontWeight: 700 }}>
                        {rankCfg.label}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-sm"
                          style={{ background: `${rankCfg.color}20`, border: `1px solid ${rankCfg.color}60`, color: rankCfg.color, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    {event && (
                      <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                        Lv {event.to.split("-").pop()} · {event.date}
                      </span>
                    )}
                    {!isAchieved && (
                      <span style={{ color: DS.border, fontSize: 9, fontFamily: DS.mono }}>
                        Lv {rankCfg.minLevel}+
                      </span>
                    )}
                  </div>
                  {event && (
                    <div className="mt-1" style={{ color: DS.text4, fontSize: 10, lineHeight: 1.5, fontStyle: "italic" }}>
                      {event.reason}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 2, background: DS.border }}>
                      {isAchieved && (
                        <div style={{
                          height: "100%", width: `${barWidth}%`,
                          background: `linear-gradient(90deg, ${rankCfg.gradientFrom}, ${rankCfg.gradientTo})`,
                          boxShadow: isCurrent ? `0 0 4px ${rankCfg.glowColor}` : "none",
                          borderRadius: 1,
                        }} />
                      )}
                    </div>
                    <span style={{ color: DS.border, fontSize: 8, fontFamily: DS.mono, flexShrink: 0 }}>
                      {rankCfg.minLevel}–{rankCfg.uncapped ? `${rankCfg.maxLevel}+` : rankCfg.maxLevel}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 p-3 rounded-lg" style={{ background: DS.bgCard, border: `1px solid ${cfg.color}25` }}>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 6 }}>
          ◈ JOURNEY STATS
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div style={{ color: cfg.color, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>
              {member.rankHistory.length}
            </div>
            <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.1em" }}>RANK-UPS</div>
          </div>
          <div style={{ width: 1, height: 28, background: `linear-gradient(180deg, transparent, ${DS.border}, transparent)` }} />
          <div className="text-center">
            <div style={{ color: cfg.color, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{member.level}</div>
            <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.1em" }}>TOTAL LVL</div>
          </div>
          <div style={{ width: 1, height: 28, background: `linear-gradient(180deg, transparent, ${DS.border}, transparent)` }} />
          <div className="text-center">
            <div style={{ color: cfg.color, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{RANKS[currentRank]?.tier ?? 1}</div>
            <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.1em" }}>TIER</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab spark particles ─────────────────────────────────────────────────────
interface TabSpark { id: number; left: number; dx: number; color: string; size: number; dur: number; }

function TabSparks({ sparks }: { sparks: TabSpark[] }) {
  return (
    <>
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute pointer-events-none rounded-full"
          style={{
            bottom: "50%", left: `${s.left}%`, width: s.size, height: s.size,
            background: s.color,
            boxShadow: `0 0 6px ${s.color}, 0 0 12px ${s.color}80`,
            zIndex: 20,
            animation: `guildTabSpark ${s.dur}ms ease-out forwards`,
            ["--spark-dx" as string]: `${s.dx}px`,
          }}
        />
      ))}
    </>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = "tech" | "missions" | "achievements" | "timeline";
const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "tech",         label: "Tech Tree",   icon: <Zap size={12} /> },
  { id: "missions",     label: "Missions",    icon: <Target size={12} /> },
  { id: "achievements", label: "Trophies",    icon: <Trophy size={12} /> },
  { id: "timeline",     label: "Chronicle",   icon: <GitBranch size={12} /> },
];

// ── Diamond Crown Badge ─────────────────────────────────────────────────────
const CROWN_SPARKS_FIXED = [
  { left: "8%",  delay: "0s",   dur: "2.8s", size: 2.5, color: "#818CF8" },
  { left: "22%", delay: "1.1s", dur: "3.2s", size: 1.5, color: "#7DD3FC" },
  { left: "38%", delay: "0.5s", dur: "2.5s", size: 2.0, color: "#F0ABFC" },
  { left: "55%", delay: "1.8s", dur: "3.5s", size: 1.5, color: "#FFFFFF" },
  { left: "70%", delay: "0.3s", dur: "2.9s", size: 2.0, color: "#818CF8" },
  { left: "85%", delay: "1.4s", dur: "3.1s", size: 1.5, color: "#7DD3FC" },
];

function DiamondCrownBadge() {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <div style={{ position: "relative", borderRadius: 10, padding: 1.5, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: "-150%",
            background: "conic-gradient(from 0deg, #818CF8, #7DD3FC, #F0ABFC, #FFFFFF, #7DD3FC, #818CF8, #818CF8)",
            animation: "diamondCrownSpin 4s linear infinite",
          }}
        />
        <div style={{
          position: "relative", background: "linear-gradient(135deg, #0a0f1e 0%, #0F172A 50%, #0d1526 100%)",
          borderRadius: 8, padding: "10px 14px", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {CROWN_SPARKS_FIXED.map((s, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  bottom: 0, left: s.left, width: s.size, height: s.size,
                  borderRadius: "50%", backgroundColor: s.color,
                  boxShadow: `0 0 6px 1px ${s.color}`,
                  animation: `diamondCrownFloat ${s.dur} ${s.delay} ease-out infinite`,
                }}
              />
            ))}
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none" style={{ flexShrink: 0 }}>
              <defs>
                <linearGradient id="hudCrownGradL" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#818CF8" />
                  <stop offset="50%"  stopColor="#7DD3FC" />
                  <stop offset="100%" stopColor="#F0ABFC" />
                </linearGradient>
                <filter id="hudCrownGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <path d="M2 20 L5 8 L10.5 14.5 L13 2 L15.5 14.5 L21 8 L24 20 Z" fill="none"
                stroke="url(#hudCrownGradL)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" filter="url(#hudCrownGlow)" />
              <line x1="2" y1="20" x2="24" y2="20" stroke="url(#hudCrownGradL)" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="2"  cy="20" r="2" fill="#F0ABFC" opacity="0.9" />
              <circle cx="13" cy="2"  r="2" fill="#7DD3FC" opacity="0.9" />
              <circle cx="24" cy="20" r="2" fill="#818CF8" opacity="0.9" />
              <circle cx="5"  cy="8"  r="1.2" fill="#FFFFFF" opacity="0.7" />
              <circle cx="21" cy="8"  r="1.2" fill="#FFFFFF" opacity="0.7" />
            </svg>
            <div>
              <div style={{
                background: "linear-gradient(90deg, #818CF8 0%, #7DD3FC 40%, #F0ABFC 70%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.22em", fontWeight: 800, whiteSpace: "nowrap",
              }}>
                ✦ GUILD MASTER ✦
              </div>
              <div style={{
                background: "linear-gradient(90deg, #7DD3FC, #F0ABFC)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                fontFamily: DS.mono, fontSize: 8, letterSpacing: "0.2em", fontWeight: 600, textAlign: "center", marginTop: 3, whiteSpace: "nowrap",
              }}>
                DIAMOND APEX · TIER VII · UNCAPPED
              </div>
            </div>
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none" style={{ flexShrink: 0, transform: "scaleX(-1)" }}>
              <path d="M2 20 L5 8 L10.5 14.5 L13 2 L15.5 14.5 L21 8 L24 20 Z" fill="none"
                stroke="url(#hudCrownGradL)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
              <line x1="2" y1="20" x2="24" y2="20" stroke="url(#hudCrownGradL)" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="2"  cy="20" r="2" fill="#818CF8" opacity="0.9" />
              <circle cx="13" cy="2"  r="2" fill="#7DD3FC" opacity="0.9" />
              <circle cx="24" cy="20" r="2" fill="#F0ABFC" opacity="0.9" />
              <circle cx="5"  cy="8"  r="1.2" fill="#FFFFFF" opacity="0.7" />
              <circle cx="21" cy="8"  r="1.2" fill="#FFFFFF" opacity="0.7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inject HUD keyframes once ────────────────────────────────────────────────
function useHUDKeyframes() {
  useEffect(() => {
    // Avoid duplicate injection
    if (document.getElementById("hud-panel-anim")) return;
    const style = document.createElement("style");
    style.id = "hud-panel-anim";
    style.textContent = `
      @keyframes hudRankPulse {
        0%,100% { transform: scale(1); opacity: 0.8; }
        50%     { transform: scale(1.5); opacity: 0; }
      }
      @keyframes guildTabSpark {
        0%   { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
        60%  { opacity: 0.7; }
        100% { transform: translateY(-36px) translateX(var(--spark-dx, 0px)) scale(0.1); opacity: 0; }
      }
      @keyframes diamondCrownSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes diamondCrownFloat {
        0%   { transform: translateY(0) scale(1); opacity: 0; }
        10%  { opacity: 0.9; }
        85%  { opacity: 0.5; }
        100% { transform: translateY(-60px) scale(0.15); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);
}

// ── Main HUDPanel ────────────────────────────────────────────────────────────
export function HUDPanel() {
  useHUDKeyframes();

  const activeMember = useLoopStore((s) => s.activeMember);
  const clearActiveMember = useLoopStore((s) => s.clearActiveMember);
  const [activeTab, setActiveTab] = useState<TabId>("tech");
  const [tabSparks, setTabSparks] = useState<TabSpark[]>([]);
  const sparkId = useRef(0);

  const rankKey = activeMember ? normalizeRank(activeMember.rank) : "iron";
  const cfg = activeMember ? RANKS[rankKey] : null;

  // Reset tab when member changes
  useEffect(() => {
    if (activeMember) setActiveTab("tech");
  }, [activeMember?.id]);

  const handleTabChange = (newTab: TabId) => {
    if (newTab === activeTab || !cfg) return;
    const newSparks: TabSpark[] = Array.from({ length: 10 }, () => ({
      id: ++sparkId.current,
      left: 15 + Math.random() * 70,
      dx: (Math.random() - 0.5) * 40,
      color: cfg.color,
      size: Math.random() * 3 + 1.5,
      dur: 500 + Math.random() * 250,
    }));
    setTabSparks((prev) => [...prev, ...newSparks]);
    setTimeout(() => {
      setTabSparks((prev) => prev.filter((s) => !newSparks.find((ns) => ns.id === s.id)));
    }, 800);
    setActiveTab(newTab);
  };

  // XP percentage — guard against NaN when maxXp is 0
  const xpPct = (activeMember && activeMember.maxXp > 0)
    ? Math.min(Math.round((activeMember.currentXp / activeMember.maxXp) * 100), 100)
    : 0;

  // LP values — always show a number
  const lpBalance = activeMember?.availableLp ?? 0;
  const lpTotal = (activeMember?.totalApprovedLp ?? 0) || lpBalance;

  // Build radar data: skill names from activeMember → fake numeric values
  const skillNames: string[] = activeMember?.skills && activeMember.skills.length > 0
    ? activeMember.skills
    : ["Code", "Design", "Strategy", "Execution", "Teamwork"];

  // Always show exactly 5 radar axes
  const radarData: RadarDatum[] = skillNames.slice(0, 5).map((s) => ({
    subject: s,
    A: skillValue(s),
  }));

  // Pad to 5 if fewer skills
  while (radarData.length < 5) {
    radarData.push({ subject: "Skill", A: 30 + radarData.length * 10 });
  }

  // Skills with fake bar values
  const skillBars: Array<{ name: string; value: number }> = skillNames.slice(0, 6).map((s) => ({
    name: s,
    value: skillValue(s),
  }));

  if (!activeMember || !cfg) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(2,6,23,0.7)", backdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={clearActiveMember}
      />

      {/* Panel */}
      <motion.div
        className="fixed right-0 top-0 h-full z-50 overflow-y-auto"
        style={{ width: 400, background: DS.bg, borderLeft: `1px solid ${DS.border}` }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`, opacity: 0.8 }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-1"
              style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>
              <Shield size={10} />
              <span>OPERATIVE HUD</span>
            </div>
            <button
              onClick={clearActiveMember}
              className="w-7 h-7 flex items-center justify-center rounded-sm transition-colors"
              style={{ border: `1px solid ${DS.border}`, color: DS.text4 }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = cfg.color;
                el.style.color = cfg.color;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = DS.border;
                el.style.color = DS.text4;
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Avatar + basic info */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-lg overflow-hidden"
                style={{ border: `2px solid ${cfg.color}`, boxShadow: `0 0 20px ${cfg.glowColor}, 0 0 40px ${cfg.glowColor}40` }}
              >
                {activeMember.avatar ? (
                  <img src={activeMember.avatar} alt={activeMember.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: DS.bgCard, color: cfg.color, fontFamily: DS.heading, fontSize: 24, fontWeight: 700 }}>
                    {activeMember.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-sm flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                  border: `1px solid ${cfg.color}`, fontSize: 11,
                  boxShadow: `0 0 10px ${cfg.glowColor}`,
                }}>
                {cfg.symbol}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>
                {activeMember.name}
              </div>
              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>
                {activeMember.role}
              </div>
              <div className="mt-2">
                <TierDots tier={cfg.tier} color={cfg.color} />
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-sm"
                  style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}50`, color: cfg.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
                  {cfg.symbol} {cfg.label}
                </span>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                  ◎ {activeMember.teamTag ?? activeMember.department ?? "ALL TEAMS"}
                </span>
              </div>
            </div>
          </div>

          {/* Diamond Crown — exclusive for Diamond rank */}
          {rankKey === "diamond" && <DiamondCrownBadge />}

          {/* Level + XP */}
          <div className="p-3 rounded-lg mb-5"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex justify-between items-baseline mb-2">
              <div className="flex items-baseline gap-1.5">
                <span style={{ fontFamily: DS.heading, color: cfg.color, fontSize: 22, fontWeight: 700, textShadow: `0 0 12px ${cfg.glowColor}` }}>
                  {activeMember.level}
                </span>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>LEVEL</span>
              </div>
              <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                {activeMember.currentXp} / {activeMember.maxXp || 100} XP
              </span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 5, background: DS.border }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                  boxShadow: `0 0 8px ${cfg.glowColor}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(xpPct, 1)}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                ◈ {activeMember.missionsCompleted} MISSIONS
              </span>
              <span style={{ color: cfg.color, fontSize: 9, fontFamily: DS.mono }}>
                {xpPct}%
              </span>
            </div>
          </div>

          {/* LP Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {([
              { label: "BALANCE", value: fmtLP(lpBalance), accent: cfg.color },
              { label: "EARNED",  value: fmtLP(lpTotal),  accent: "#22C55E" },
              { label: "SPENT",  value: "—",             accent: "#F59E0B" },
            ] as const).map(({ label, value, accent }) => (
              <div key={label} className="text-center px-2 py-2 rounded-lg"
                style={{ background: DS.bgCard, border: `1px solid ${accent}20` }}>
                <div style={{ color: accent, fontFamily: DS.mono, fontSize: 13, fontWeight: 700, textShadow: `0 0 8px ${accent}60` }}>
                  {value}
                </div>
                <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.1em", marginTop: 2 }}>
                  {label} LP
                </div>
              </div>
            ))}
          </div>

          {/* Radar chart */}
          <div className="mb-5">
            <div className="mb-2" style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
              ── ABILITY MATRIX
            </div>
            <div style={{ height: 180 }}>
              <CustomRadar
                data={radarData}
                color={cfg.color}
                memberId={activeMember.id}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mb-5" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${DS.border}, transparent)` }} />

          {/* Tabs */}
          <div className="relative flex gap-1 mb-4">
            <TabSparks sparks={tabSparks} />
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm transition-all duration-200"
                  style={{
                    background: active ? `${cfg.color}18` : "transparent",
                    border: `1px solid ${active ? cfg.color + "60" : DS.border}`,
                    color: active ? cfg.color : DS.text5,
                    fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {active && (
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}20, transparent)`, animation: "guildCometSweep 2.5s linear infinite" }}
                    />
                  )}
                  <span className="relative">{tab.icon}</span>
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {activeTab === "tech" && (
                <div className="space-y-3">
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                    ── SKILL MATRIX
                  </div>
                  <div className="space-y-2.5">
                    {skillBars.map(({ name, value }) => (
                      <div key={name}>
                        <div className="flex justify-between mb-1">
                          <span style={{ color: DS.text3, fontSize: 11 }}>{name}</span>
                          <span style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono }}>{value}</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                              boxShadow: `0 0 6px ${cfg.glowColor}`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4" style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                    ── TECH STACK
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillNames.slice(0, 8).map((t) => (
                      <TechChip key={t} label={t} color={cfg.color} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "missions" && (
                <div className="space-y-2">
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                    ── MISSION LOGS ({activeMember.missionLogs.length})
                  </div>
                  {activeMember.missionLogs.length === 0 ? (
                    <div className="py-8 text-center" style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>
                      No missions recorded yet
                    </div>
                  ) : (
                    activeMember.missionLogs.map((log, i) => (
                      <MissionItem
                        key={i}
                        title={log.task}
                        date={log.date}
                        status={log.lpEarned > 0 ? "completed" : "ongoing"}
                        color={cfg.color}
                        lpReward={log.lpEarned}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "achievements" && (
                <div className="space-y-2">
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                    ── TROPHY VAULT ({activeMember.achievements.length})
                  </div>
                  {activeMember.achievements.length === 0 ? (
                    <div className="py-8 text-center" style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>
                      No achievements yet
                    </div>
                  ) : (
                    activeMember.achievements.map((ach) => (
                      <AchievementBadge key={ach} label={ach} color={cfg.color} />
                    ))
                  )}
                </div>
              )}

              {activeTab === "timeline" && (
                <RankTimeline member={activeMember} cfg={cfg} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Specialty footer */}
          <div className="mt-6 p-3 rounded" style={{ background: DS.bgCard, border: `1px solid ${cfg.color}25` }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 4 }}>
              ◈ SPECIALTY
            </div>
            <div style={{ color: DS.text3, fontSize: 12 }}>{activeMember.department ?? "General Operations"}</div>
          </div>

          {/* View Full Profile Button */}
          <div className="mt-8 px-1">
            <Link
              href={`/team/${activeMember.slug}`}
              onClick={clearActiveMember}
              className="w-full py-3 rounded-lg flex items-center justify-center gap-3 transition-all group relative overflow-hidden"
              style={{
                background: DS.bgCard, border: `1px solid ${cfg.color}40`,
                color: DS.text, fontFamily: DS.mono, fontSize: 12, letterSpacing: "0.15em",
                textDecoration: "none",
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}15, transparent)` }} />
              <Shield size={14} style={{ color: cfg.color }} />
              VIEW FULL OPERATIVE PROFILE
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Zap size={12} style={{ color: cfg.color }} />
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}
