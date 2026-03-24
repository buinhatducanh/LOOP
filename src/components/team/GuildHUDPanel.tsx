"use client";

import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Zap, Trophy, Target, GitBranch } from 'lucide-react';
import { RANKS, RankKey, getRankFromLevel, ROLE_SYMBOLS } from './teamRanks';
import { useRank } from '@/hooks/useRank';

// ── Inline XP helpers (same logic as src/lib/rank/xp.ts) ─────────────────────
const XP_PER_LP = 10;
function hudXpForLevel(level: number) { return level * 100; }
function hudLevelFromXp(totalXp: number) {
  let level = 1, remaining = totalXp;
  while (hudXpForLevel(level) <= remaining) { remaining -= hudXpForLevel(level); level++; }
  return { level, currentXp: remaining };
}

interface HUDMemberData {
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
  level?: number;
  currentXP?: number;
  maxXP?: number;
  team?: string;
  missions?: number;
  roleCode?: string;
  /** Real total approved LP — if provided, rank/XP computed from LP data */
  totalApprovedLp?: number;
}

// ── Derive guild data for HUD ────────────────────────────────────────────────
function deriveHUDData(member: HUDMemberData) {
  const isCEO = (member.roleLevel ?? 3) === 0 || /ceo|founder|giám đốc|chủ tịch/i.test(member.role || '');
  const isCTO = /cto|technical lead/i.test(member.role || '');
  const isLead = (member.roleLevel ?? 3) === 1 || /lead|trưởng/i.test(member.role || '');
  const isSenior = (member.roleLevel ?? 3) === 2;

  let level = 8, currentXP = 45, maxXP = 100, missions = 12;
  if (isCEO) { level = 118; currentXP = 92; missions = 201; }
  else if (isCTO) { level = 103; currentXP = 60; missions = 138; }
  else if (isLead) { level = 68; currentXP = 85; missions = 84; }
  else if (isSenior) { level = 43; currentXP = 62; missions = 51; }
  else { level = 24; currentXP = 78; missions = 28; }

  const rank = getRankFromLevel(level);

  const skillsMap: Record<string, number> = {};
  if (member.skills && Array.isArray(member.skills)) {
    member.skills.forEach((s, i) => {
      const name = typeof s === 'string' ? s : (s as any).name || (s as any).nameVi || String(s);
      skillsMap[name] = Math.min(100, 50 + i * 10 + Math.floor(Math.random() * 20));
    });
  }
  if (member.expertise) {
    member.expertise.forEach((e, i) => {
      const name = typeof e === 'string' ? e : (e as any).name || (e as any).nameVi || String(e);
      if (!skillsMap[name]) skillsMap[name] = Math.min(100, 40 + i * 12 + Math.floor(Math.random() * 20));
    });
  }
  if (Object.keys(skillsMap).length === 0) {
    skillsMap['Code'] = 70; skillsMap['Design'] = 45; skillsMap['Strategy'] = 60;
    skillsMap['Execution'] = 75; skillsMap['Teamwork'] = 65;
  }

  const techStack = member.expertise?.map((e) =>
    typeof e === 'string' ? e : (e as any).name || (e as any).nameVi || String(e)
  ).slice(0, 6) || ['React', 'TypeScript', 'Node.js'];

  const defaultAchievements = ['First Deployment', 'Code Apprentice', 'Team Player'];
  const achievementList = member.achievements?.length ? member.achievements : defaultAchievements;

  return { level, currentXP, maxXP, rank, missions, skillsMap, techStack, achievementList };
}

// ── Custom SVG Radar Chart ───────────────────────────────────────────────────
function CustomRadar({ data, color, memberId }: { data: { subject: string; A: number }[]; color: string; memberId: string }) {
  const SIZE = 160, CX = SIZE / 2, CY = SIZE / 2, MAX_R = SIZE * 0.34, LEVELS = 4;
  const n = data.length;
  const filterId = `hud-radar-glow-${memberId}`;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, frac: number) => ({ x: CX + MAX_R * frac * Math.cos(angle(i)), y: CY + MAX_R * frac * Math.sin(angle(i)) });

  const rings = Array.from({ length: LEVELS }, (_, l) => {
    const frac = (l + 1) / LEVELS;
    return data.map((_, i) => pt(i, frac)).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  });

  const shape = data.map((d, i) => { const p = pt(i, d.A / 100); return `${p.x.toFixed(2)},${p.y.toFixed(2)}`; }).join(' ');

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {data.map((_, i) => {
        const p = pt(i, 1);
        return <line key={`spoke-${i}`} x1={CX} y1={CY} x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} stroke="#1F2937" strokeWidth={0.8} />;
      })}
      {rings.map((pts, l) => (
        <polygon key={`ring-${l}`} points={pts} fill="none" stroke="#1F2937" strokeWidth={0.8} opacity={l === LEVELS - 1 ? 1 : 0.55} />
      ))}
      <polygon points={shape} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.8} strokeLinejoin="round" filter={`url(#${filterId})`} />
      {data.map((d, i) => {
        const p = pt(i, d.A / 100);
        return <circle key={`dot-${i}`} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={2.8} fill={color} opacity={0.95} />;
      })}
      {data.map((d, i) => {
        const p = pt(i, 1.32);
        return <text key={`lbl-${i}`} x={p.x.toFixed(2)} y={p.y.toFixed(2)} textAnchor="middle" dominantBaseline="middle" fill="#64748B" fontSize={8.5} fontFamily="JetBrains Mono, monospace">{d.subject}</text>;
      })}
      {data.map((d, i) => {
        const pc = pt(i, (d.A / 100) * 0.72);
        return <text key={`val-${i}`} x={pc.x.toFixed(2)} y={pc.y.toFixed(2)} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={7.5} fontFamily="JetBrains Mono, monospace" opacity={0.75}>{d.A}</text>;
      })}
    </svg>
  );
}

// ── Tier dots ─────────────────────────────────────────────────────────────────
function TierDots({ tier, color }: { tier: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: i < tier ? 8 : 6,
            height: i < tier ? 8 : 6,
            background: i < tier ? color : '#1F2937',
            boxShadow: i < tier ? `0 0 6px ${color}` : 'none',
            transition: 'all 0.3s ease',
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
      className="px-2 py-0.5 rounded-sm text-xs"
      style={{
        border: `1px solid ${color}40`,
        color: '#94A3B8',
        background: `${color}0a`,
        fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </span>
  );
}

// ── Achievement badge ─────────────────────────────────────────────────────────
function AchievementBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: '#111827', border: `1px solid ${color}30` }}>
      <Trophy size={12} style={{ color, flexShrink: 0 }} />
      <span style={{ color: '#94A3B8', fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ── Rank chronicle timeline ──────────────────────────────────────────────────
const ALL_RANKS: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];

function RankChronicle({ rank, level, color }: { rank: RankKey; level: number; color: string }) {
  const currentTier = RANKS[rank].tier;

  // Simulated rank history
  const rankHistory = [
    { rank: 'iron' as RankKey, level: 1, date: '2024-01-01', note: 'Guild Registration — Welcome to the Guild.' },
    ...(currentTier >= 2 ? [{ rank: 'bronze' as RankKey, level: 15, date: '2024-06-01', note: 'Bronze Ascension — First milestone achieved.' }] : []),
    ...(currentTier >= 3 ? [{ rank: 'silver' as RankKey, level: 35, date: '2024-09-01', note: 'Silver Ascension — Growing stronger.' }] : []),
    ...(currentTier >= 4 ? [{ rank: 'gold' as RankKey, level: 55, date: '2025-01-01', note: 'Gold Ascension — Elite operative status.' }] : []),
    ...(currentTier >= 5 ? [{ rank: 'platinum' as RankKey, level: 75, date: '2025-06-01', note: 'Platinum Ascension — Near legendary status.' }] : []),
    ...(currentTier >= 6 ? [{ rank: 'ruby' as RankKey, level: 95, date: '2025-09-01', note: 'Ruby Ascension — Breaking limits.' }] : []),
    ...(currentTier >= 7 ? [{ rank: 'diamond' as RankKey, level: 115, date: '2025-12-01', note: 'Diamond Ascension — Guild Legend.' }] : []),
  ];

  const historyMap = new Map(rankHistory.map((e) => [e.rank, e]));

  return (
    <div>
      <div className="mb-3" style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.12em' }}>
        ── RANK CHRONICLE
      </div>
      <div className="relative">
        <div className="absolute left-2.5 top-3 bottom-3 w-px" style={{ background: 'linear-gradient(180deg, #1F2937 0%, #1F2937 100%)' }} />
        <div className="space-y-1">
          {[...ALL_RANKS].reverse().map((rankKey, revIdx) => {
            const rankCfg = RANKS[rankKey];
            const event = historyMap.get(rankKey);
            const isAchieved = rankCfg.tier <= currentTier;
            const isCurrent = rankKey === rank;

            return (
              <motion.div
                key={rankKey}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: revIdx * 0.06, duration: 0.35, ease: 'easeOut' }}
              >
                <div className="relative flex-shrink-0" style={{ marginTop: 4 }}>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background: isAchieved ? `linear-gradient(135deg, ${rankCfg.gradientFrom}, ${rankCfg.gradientTo})` : '#111827',
                      border: `1.5px solid ${isAchieved ? rankCfg.color : '#1F2937'}`,
                      boxShadow: isCurrent ? `0 0 10px ${rankCfg.glowColor}, 0 0 20px ${rankCfg.glowColor}` : 'none',
                      fontSize: 8,
                    }}
                  >
                    <span style={{ color: isAchieved ? '#fff' : '#374151' }}>{rankCfg.symbol}</span>
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${rankCfg.color}`, animation: 'hudRankPulse 1.8s ease-in-out infinite' }} />
                    )}
                  </div>
                </div>
                <div className="flex-1 pb-2 px-3 py-2 rounded-lg" style={{
                  background: isAchieved ? (isCurrent ? `linear-gradient(135deg, ${rankCfg.gradientFrom}18, ${rankCfg.gradientTo}0a)` : '#111827') : 'transparent',
                  border: isAchieved ? `1px solid ${rankCfg.color}${isCurrent ? '60' : '20'}` : '1px solid transparent',
                  opacity: isAchieved ? 1 : 0.35,
                }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span style={{ color: isAchieved ? rankCfg.color : '#374151', fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', fontWeight: 700 }}>
                        {rankCfg.label}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-sm" style={{ background: `${rankCfg.color}20`, border: `1px solid ${rankCfg.color}60`, color: rankCfg.color, fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    {event && (
                      <span style={{ color: '#475569', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>
                        Lv {event.level} · {event.date}
                      </span>
                    )}
                    {!isAchieved && (
                      <span style={{ color: '#374151', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>
                        Lv {rankCfg.minLevel}+
                      </span>
                    )}
                  </div>
                  {event && (
                    <div className="mt-1" style={{ color: '#64748B', fontSize: 10, lineHeight: 1.5, fontStyle: 'italic' }}>
                      {event.note}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Journey stats */}
      <div className="mt-4 p-3 rounded-lg" style={{ background: '#111827', border: `1px solid ${color}25` }}>
        <div style={{ color: '#475569', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.12em', marginBottom: 6 }}>
          ◈ JOURNEY STATS
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div style={{ color, fontFamily: 'var(--font-cinzel), Cinzel, serif', fontSize: 16, fontWeight: 700 }}>{currentTier - 1}</div>
            <div style={{ color: '#475569', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>RANK-UPS</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'linear-gradient(180deg, transparent, #1F2937, transparent)' }} />
          <div className="text-center">
            <div style={{ color, fontFamily: 'var(--font-cinzel), Cinzel, serif', fontSize: 16, fontWeight: 700 }}>{level}</div>
            <div style={{ color: '#475569', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>TOTAL LVL</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'linear-gradient(180deg, transparent, #1F2937, transparent)' }} />
          <div className="text-center">
            <div style={{ color, fontFamily: 'var(--font-cinzel), Cinzel, serif', fontSize: 16, fontWeight: 700 }}>{currentTier}</div>
            <div style={{ color: '#475569', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>TIER</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab spark particles ───────────────────────────────────────────────────────
interface TabSpark { id: number; left: number; dx: number; color: string; size: number; dur: number; }

function TabSparks({ sparks }: { sparks: TabSpark[] }) {
  return (
    <>
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute pointer-events-none rounded-full"
          style={{
            bottom: '50%',
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 6px ${s.color}, 0 0 12px ${s.color}80`,
            zIndex: 20,
            animation: `guildTabSpark ${s.dur}ms ease-out forwards`,
          }}
        />
      ))}
    </>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
type TabId = 'tech' | 'achievements' | 'timeline';
const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'tech',         label: 'Tech Tree',  icon: <Zap size={12} /> },
  { id: 'achievements', label: 'Trophies',   icon: <Trophy size={12} /> },
  { id: 'timeline',     label: 'Chronicle',  icon: <GitBranch size={12} /> },
];

// ── Main HUDPanel ────────────────────────────────────────────────────────────
interface HUDPanelProps {
  member: HUDMemberData | null;
  onClose: () => void;
}

export function GuildHUDPanel({ member, onClose }: HUDPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('tech');
  const [tabSparks, setTabSparks] = useState<TabSpark[]>([]);
  const sparkId = useRef(0);

  // Inject keyframe CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'hud-panel-anim';
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
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Reset tab when member changes
  useEffect(() => {
    if (member) setActiveTab('tech');
  }, [member?.id]);

  // ── Fetch real rank from API when totalApprovedLp is available ──────────────
  const { data: rankData } = useRank(
    member && member.totalApprovedLp !== undefined ? member.id : undefined
  );

  const hud = member ? deriveHUDData(member) : null;

  // Merge real rank data (from API) with derived HUD data
  let hudRank = hud?.rank ?? 'iron';
  let hudLevel = hud?.level ?? 8;
  let hudCurrentXP = hud?.currentXP ?? 45;
  let hudMaxXP = hud?.maxXP ?? 100;

  if (rankData) {
    hudRank = rankData.rank;
    hudLevel = rankData.level;
    hudCurrentXP = rankData.currentXp;
    hudMaxXP = rankData.maxXp;
  } else if (member?.totalApprovedLp !== undefined && member.totalApprovedLp > 0) {
    // Compute from LP data client-side (no API call)
    const totalXp = member.totalApprovedLp * XP_PER_LP;
    const { level, currentXp } = hudLevelFromXp(totalXp);
    hudRank = getRankFromLevel(level) as RankKey;
    hudLevel = level;
    hudCurrentXP = currentXp;
    hudMaxXP = hudXpForLevel(level);
  }

  const cfg = hud ? RANKS[hudRank] : null;

  const radarData = hud ? Object.entries(hud.skillsMap).map(([subject, A]) => ({ subject, A: A as number })) : [];

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
    setTimeout(() => setTabSparks((prev) => prev.filter((s) => !newSparks.find((ns) => ns.id === s.id))), 800);
    setActiveTab(newTab);
  };

  return (
    <AnimatePresence>
      {member && hud && cfg && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full z-50 overflow-y-auto"
            style={{ width: 400, maxWidth: '100vw', background: '#0F172A', borderLeft: '1px solid #1F2937' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`, opacity: 0.8 }} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-1" style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.15em' }}>
                  <Shield size={10} />
                  <span>OPERATIVE HUD</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-sm transition-colors"
                  style={{ border: '1px solid #1F2937', color: '#64748B' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = cfg.color; (e.currentTarget as HTMLElement).style.color = cfg.color; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#1F2937'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Avatar + info */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-lg overflow-hidden" style={{ border: `2px solid ${cfg.color}`, boxShadow: `0 0 20px ${cfg.glowColor}, 0 0 40px ${cfg.glowColor}40` }}>
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <Shield size={32} className="text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`, border: `1px solid ${cfg.color}`, fontSize: 11, boxShadow: `0 0 10px ${cfg.glowColor}` }}>
                    {cfg.symbol}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: '#FFFFFF', fontFamily: 'var(--font-cinzel), Cinzel, serif', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' }}>{member.name}</div>
                  <div style={{ color: '#64748B', fontSize: 11, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', marginTop: 2 }}>{member.role}</div>
                  <div className="mt-2"><TierDots tier={cfg.tier} color={cfg.color} /></div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-sm" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}50`, color: cfg.color, fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.12em' }}>
                      {cfg.symbol} {cfg.label}
                    </span>
                    <span style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>
                      ◎ {member.team || 'Alpha'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Level + XP */}
              <div className="p-3 rounded-lg mb-5" style={{ background: '#111827', border: '1px solid #1F2937' }}>
                <div className="flex justify-between items-baseline mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif', color: cfg.color, fontSize: 22, fontWeight: 700, textShadow: `0 0 12px ${cfg.glowColor}` }}>{hudLevel}</span>
                    <span style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>LEVEL</span>
                  </div>
                  <span style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>{hudCurrentXP} / {hudMaxXP} XP</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 5, background: '#1F2937' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`, boxShadow: `0 0 8px ${cfg.glowColor}` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((hudCurrentXP / hudMaxXP) * 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span style={{ color: '#475569', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>◈ {hud.missions} MISSIONS</span>
                  <span style={{ color: cfg.color, fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>{Math.round((hudCurrentXP / hudMaxXP) * 100)}%</span>
                </div>
              </div>

              {/* Radar chart */}
              <div className="mb-5">
                <div className="mb-2" style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.12em' }}>
                  ── ABILITY MATRIX
                </div>
                <div style={{ height: 180 }}>
                  <CustomRadar data={radarData} color={cfg.color} memberId={String(member.id)} />
                </div>
              </div>

              {/* Divider */}
              <div className="mb-5" style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1F2937, transparent)' }} />

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
                        background: active ? `${cfg.color}18` : 'transparent',
                        border: `1px solid ${active ? cfg.color + '60' : '#1F2937'}`,
                        color: active ? cfg.color : '#475569',
                        fontSize: 10,
                        fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                        letterSpacing: '0.08em',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {active && (
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}20, transparent)`, animation: 'guildCometSweep 2.5s linear infinite' }} />
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
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {activeTab === 'tech' && (
                    <div className="space-y-3">
                      <div style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>── SKILL MATRIX</div>
                      <div className="space-y-2.5">
                        {Object.entries(hud.skillsMap).map(([skill, val]) => (
                          <div key={skill}>
                            <div className="flex justify-between mb-1">
                              <span style={{ color: '#94A3B8', fontSize: 11 }}>{skill}</span>
                              <span style={{ color: cfg.color, fontSize: 11, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>{val}</span>
                            </div>
                            <div className="rounded-full overflow-hidden" style={{ height: 4, background: '#1F2937' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`, boxShadow: `0 0 6px ${cfg.glowColor}` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4" style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>── TECH STACK</div>
                      <div className="flex flex-wrap gap-1.5">
                        {hud.techStack.map((t) => <TechChip key={t} label={t} color={cfg.color} />)}
                      </div>
                    </div>
                  )}

                  {activeTab === 'achievements' && (
                    <div className="space-y-2">
                      <div style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
                        ── TROPHY VAULT ({hud.achievementList.length})
                      </div>
                      {hud.achievementList.map((ach) => (
                        <AchievementBadge key={ach} label={ach} color={cfg.color} />
                      ))}
                    </div>
                  )}

                  {activeTab === 'timeline' && (
                    <RankChronicle rank={hudRank} level={hudLevel} color={cfg.color} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Specialty */}
              <div className="mt-6 p-3 rounded" style={{ background: '#111827', border: `1px solid ${cfg.color}25` }}>
                <div style={{ color: '#475569', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.12em', marginBottom: 4 }}>◈ SPECIALTY</div>
                <div style={{ color: '#94A3B8', fontSize: 12 }}>{member.shortBio || member.bio?.slice(0, 100) || 'Digital craftsman shaping the future of the web.'}</div>
              </div>

              {/* Bio */}
              <div className="mt-3 px-1">
                <div style={{ color: '#475569', fontSize: 11, fontStyle: 'italic', lineHeight: 1.6, borderLeft: `2px solid ${cfg.color}40`, paddingLeft: 10 }}>
                  "{member.bio?.slice(0, 200) || member.shortBio || 'A dedicated operative pursuing excellence.'}"
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
