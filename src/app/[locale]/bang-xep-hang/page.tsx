/**
 * LeaderboardPage — /bang-xep-hang
 * Bảng xếp hạng LP toàn công ty · Season III · Pure SVG charts
 * Hành trình từ Iron → Diamond được trực quan hoá toàn diện
 */
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Zap, Users, TrendingUp, Crown,
  ChevronRight, ArrowUpRight, Flame, Search,
  Target,
} from 'lucide-react';
import { DS, GRD } from '@/lib/design-tokens';
import { members, RANKS, type RankKey } from '@/components/landing/guild/memberData';
import { useAuthStore } from '@/app/store/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : String(n);

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, dur = 1400, trigger = true) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!trigger || done.current) return;
    done.current = true;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur, trigger]);
  return val;
}

// ── Pure SVG: Rank Distribution Donut ────────────────────────────────────────
function RankDonut() {
  const rankKeys: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];
  const counts = rankKeys.map(r => ({ rank: r, count: members.filter(m => m.rank === r).length }));
  const total = members.length;
  const cx = 80, cy = 80, r = 58, stroke = 22;

  let offset = 0;
  const slices = counts.map(({ rank, count }) => {
    const pct = count / total;
    const dashArray = `${pct * 2 * Math.PI * r} ${2 * Math.PI * r}`;
    const dashOffset = -offset * 2 * Math.PI * r;
    offset += pct;
    return { rank, count, pct, dashArray, dashOffset };
  });

  return (
    <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
      {/* SVG donut */}
      <div className="relative flex-shrink-0">
        <svg width={160} height={160} viewBox="0 0 160 160">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={DS.border} strokeWidth={stroke} />
          {slices.map(s => {
            const rc = RANKS[s.rank];
            return (
              <motion.circle
                key={s.rank}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={rc.color}
                strokeWidth={stroke}
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
                transform="rotate(-90 80 80)"
                initial={{ strokeDasharray: `0 ${2 * Math.PI * r}` }}
                animate={{ strokeDasharray: s.dashArray }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 6px ${rc.glowColor})` }}
              />
            );
          })}
          {/* Center label */}
          <text x={cx} y={cy - 8} textAnchor="middle" fill={DS.text} fontSize="20" fontWeight="900" fontFamily={DS.mono}>27</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill={DS.text5} fontSize="9" fontFamily={DS.mono}>THÀNH VIÊN</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {slices.filter(s => s.count > 0).map(s => {
          const rc = RANKS[s.rank];
          return (
            <div key={s.rank} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: rc.color, boxShadow: `0 0 6px ${rc.glowColor}` }} />
              <span style={{ color: DS.text3, fontSize: 11 }}>
                <span style={{ color: rc.color, fontWeight: 700 }}>{s.count}</span> {rc.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pure SVG: LP Bar Chart (Top 10) ──────────────────────────────────────────
function LPBarChart({ sorted }: { sorted: typeof members }) {
  const top10 = sorted.slice(0, 10);
  const maxLP = top10[0]?.lpBalance ?? 1;
  const w = 500, h = 140, padL = 10, padR = 10, padT = 10, padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const barW = (chartW / top10.length) * 0.6;
  const barGap = chartW / top10.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 500, display: 'block' }}>
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i}
          x1={padL} y1={padT + chartH * (1 - t)}
          x2={w - padR} y2={padT + chartH * (1 - t)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"
        />
      ))}
      {top10.map((m, i) => {
        const rc = RANKS[m.rank];
        const pct = m.lpBalance / maxLP;
        const x = padL + i * barGap + (barGap - barW) / 2;
        const barH = chartH * pct;
        const y = padT + chartH - barH;
        return (
          <g key={m.id}>
            <defs>
              <linearGradient id={`bg-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={rc.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={rc.gradientFrom} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <motion.rect
              x={x} width={barW} y={y} height={barH}
              rx={3} fill={`url(#bg-${m.id})`}
              initial={{ y: padT + chartH, height: 0 }}
              animate={{ y, height: barH }}
              transition={{ duration: 0.9, delay: i * 0.07, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 4px ${rc.glowColor})` }}
            />
            {/* Name label */}
            <text
              x={x + barW / 2} y={h - 10}
              textAnchor="middle"
              fill={DS.text5} fontSize="7" fontFamily={DS.mono}
            >
              {m.name.split(' ')[0].slice(0, 6)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Season Header ─────────────────────────────────────────────────────────────
function SeasonBanner() {
  const totalLP = members.reduce((s, m) => s + m.lpEarned, 0);
  const totalMissions = members.reduce((s, m) => s + m.missions, 0);
  const countedLP = useCountUp(totalLP, 1600);
  const countedMissions = useCountUp(totalMissions, 1200);

  return (
    <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 mb-8"
      style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.18) 0%, rgba(129,140,248,0.08) 50%, rgba(20,184,166,0.06) 100%)', border: '1px solid rgba(129,140,248,0.2)' }}>
      {/* Orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 left-16 w-48 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {/* Hex pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.025 }}>
        <defs>
          <pattern id="hex-lb" width="40" height="46" patternUnits="userSpaceOnUse">
            <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="none" stroke="#818CF8" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-lb)" />
      </svg>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)' }}>
            <Flame size={11} style={{ color: RANKS.diamond.color }} />
            <span style={{ color: RANKS.diamond.color, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>SEASON III · ĐANG DIỄN RA</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: DS.green }} />
            <span style={{ color: DS.green, fontSize: 9, fontFamily: DS.mono }}>LIVE</span>
          </div>
        </div>

        <h1 style={{ fontFamily: DS.heading, fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 900, letterSpacing: '0.06em', marginBottom: 6 }}>
          <span style={{ background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'unset', color: 'var(--light-text, #0F172A)' }}>
            BẢNG XẾP HẠNG LP
          </span>
        </h1>
        <p style={{ color: DS.text3, fontSize: 14, marginBottom: 20, maxWidth: 480 }}>
          Hành trình từ Iron đến Diamond — Mỗi nhiệm vụ hoàn thành là một bước tiến trên bảng vinh danh LOOP.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-6">
          {[
            { label: 'Tổng LP đã phát hành', value: fmtLP(countedLP), color: DS.blue, icon: <Zap size={14} /> },
            { label: 'Tổng nhiệm vụ hoàn thành', value: countedMissions.toLocaleString('vi-VN'), color: DS.green, icon: <Target size={14} /> },
            { label: 'Thành viên tích cực', value: '27', color: DS.purple, icon: <Users size={14} /> },
            { label: 'Tuần của Season III', value: '12', color: DS.amber, icon: <Trophy size={14} /> },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div>
                <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 15, fontWeight: 900, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Top 3 Podium ─────────────────────────────────────────────────────────────
function Podium({ sorted }: { sorted: typeof members }) {
  const [first, second, third] = [sorted[0], sorted[1], sorted[2]];
  const ORDER = [second, first, third]; // visual order: 2nd-1st-3rd
  const HEIGHTS = [200, 240, 170];
  const POSITIONS = [2, 1, 3];
  const DELAYS = [0.3, 0.1, 0.5];

  return (
    <div className="rounded-2xl p-6 mb-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
      <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 24 }}>── TOP 3 · HUYỀN THOẠI SEASON III</div>
      <div className="flex items-end justify-center gap-4 md:gap-8">
        {ORDER.map((m, i) => {
          const rc = RANKS[m.rank];
          const pos = POSITIONS[i];
          const h = HEIGHTS[i];
          const posColors = ['', RANKS.diamond.color, '#CBD5E1', '#CD7F32'];
          const posGlows = ['', RANKS.diamond.glowColor, 'rgba(203,213,225,0.5)', 'rgba(205,127,50,0.55)'];
          const posLabels = ['', '🥇', '🥈', '🥉'];
          const isFirst = pos === 1;

          return (
            <motion.div
              key={m.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: DELAYS[i], type: 'spring', stiffness: 100, damping: 15 }}
            >
              {/* Avatar */}
              <div className="relative mb-3">
                {isFirst && (
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown size={22} style={{ color: RANKS.diamond.color, filter: `drop-shadow(0 0 8px ${RANKS.diamond.glowColor})` }} />
                  </motion.div>
                )}
                <motion.div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    width: isFirst ? 72 : 56,
                    height: isFirst ? 72 : 56,
                    border: `2.5px solid ${posColors[pos]}`,
                    boxShadow: `0 0 20px ${posGlows[pos]}`,
                  }}
                  animate={isFirst ? { boxShadow: [`0 0 20px ${posGlows[1]}`, `0 0 35px ${posGlows[1]}`, `0 0 20px ${posGlows[1]}`] } : {}}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                </motion.div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: DS.bgCard, border: `1.5px solid ${posColors[pos]}` }}>
                  {posLabels[pos]}
                </div>
              </div>

              {/* Name & rank */}
              <div style={{ color: DS.text, fontSize: isFirst ? 14 : 12, fontWeight: 700, textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name.split(' ').slice(-1)[0]}
              </div>
              <div style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, marginTop: 1 }}>
                {rc.symbol} {rc.label}
              </div>

              {/* LP */}
              <div style={{ color: posColors[pos], fontSize: isFirst ? 16 : 13, fontFamily: DS.mono, fontWeight: 900, marginTop: 4, textShadow: `0 0 12px ${posGlows[pos]}` }}>
                {fmtLP(m.lpBalance)}
              </div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LP</div>

              {/* Podium block */}
              <motion.div
                className="mt-3 w-20 md:w-28 rounded-t-xl flex items-center justify-center"
                style={{
                  height: h * 0.35,
                  background: `linear-gradient(180deg, ${posColors[pos]}20 0%, ${posColors[pos]}06 100%)`,
                  border: `1px solid ${posColors[pos]}30`,
                  borderBottom: 'none',
                }}
                initial={{ height: 0 }}
                animate={{ height: h * 0.35 }}
                transition={{ delay: DELAYS[i] + 0.2, duration: 0.6, ease: 'easeOut' }}
              >
                <span style={{ color: posColors[pos], fontFamily: DS.mono, fontSize: 18, fontWeight: 900, opacity: 0.5 }}>#{pos}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Member Row ────────────────────────────────────────────────────────────────
interface MemberRowProps {
  m: typeof members[0];
  rank: number;
  maxLP: number;
  isMe: boolean;
  onView: () => void;
}

function MemberRow({ m, rank: pos, maxLP, isMe, onView }: MemberRowProps) {
  const rc = RANKS[m.rank];
  const pct = (m.lpBalance / maxLP) * 100;
  const isTop3 = pos <= 3;
  const top3Colors = ['', RANKS.diamond.color, '#CBD5E1', '#CD7F32'];

  return (
    <motion.div
      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl cursor-pointer"
      style={{
        background: isMe ? 'rgba(59,130,246,0.07)' : DS.bgCard,
        border: `1px solid ${isMe ? 'rgba(59,130,246,0.3)' : isTop3 ? `${top3Colors[pos]}20` : DS.border}`,
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={onView}
    >
      {/* Rank number */}
      <div className="w-8 md:w-10 text-center flex-shrink-0">
        {pos <= 3 ? (
          <span style={{ fontSize: 16 }}>{['', '🥇', '🥈', '🥉'][pos]}</span>
        ) : (
          <span style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>#{pos}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden flex-shrink-0"
        style={{ border: `1.5px solid ${rc.color}60`, boxShadow: `0 0 8px ${rc.glowColor}40` }}>
        <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span style={{ color: isMe ? DS.blue : DS.text, fontSize: 13, fontWeight: 700 }}>{m.name}</span>
          {isMe && <span style={{ color: DS.blue, fontSize: 9, fontFamily: DS.mono, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', padding: '1px 6px', borderRadius: 20 }}>BẠN</span>}
          <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono, background: `${rc.color}12`, border: `1px solid ${rc.color}25`, padding: '1px 6px', borderRadius: 20 }}>
            {rc.symbol} {rc.label} · Lv.{m.level}
          </span>
        </div>
        <div style={{ color: DS.text5, fontSize: 11 }}>{m.role} · {m.team}</div>
        {/* LP bar */}
        <div className="mt-1.5 hidden md:block">
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: DS.border }}>
            <motion.div
              style={{ height: '100%', background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }}
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* LP value */}
      <div className="text-right flex-shrink-0">
        <div style={{ color: rc.color, fontFamily: DS.mono, fontSize: 14, fontWeight: 900, textShadow: `0 0 8px ${rc.glowColor}50` }}>
          {fmtLP(m.lpBalance)}
        </div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LP</div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 1 }}>
          {m.missions} quests
        </div>
      </div>

      <ChevronRight size={13} style={{ color: DS.text5, flexShrink: 0 }} />
    </motion.div>
  );
}

// ── Department Overview ───────────────────────────────────────────────────────
function DeptSummary() {
  const teams = ['Alpha', 'Sigma', 'Omega', 'All'];
  const teamStats = teams.map(team => {
    const teamMembers = members.filter(m => m.team === team || team === 'All');
    const avgLP = teamMembers.reduce((s, m) => s + m.lpBalance, 0) / (teamMembers.length || 1);
    const topMember = [...teamMembers].sort((a, b) => b.lpBalance - a.lpBalance)[0];
    return { team, count: teamMembers.length, avgLP, topMember };
  });

  const teamColors: Record<string, string> = {
    Alpha: DS.blue, Sigma: DS.purple, Omega: DS.cyan, All: DS.amber,
  };

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {teamStats.map(t => {
        const rc = t.topMember ? RANKS[t.topMember.rank] : RANKS.iron;
        const color = teamColors[t.team];
        return (
          <div key={t.team} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${color}25` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <Users size={14} style={{ color }} />
              </div>
              <div>
                <div style={{ color, fontSize: 12, fontWeight: 700, fontFamily: DS.mono }}>TEAM {t.team.toUpperCase()}</div>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{t.count} thành viên</div>
              </div>
            </div>
            <div style={{ color, fontFamily: DS.mono, fontSize: 16, fontWeight: 900 }}>{fmtLP(Math.round(t.avgLP))}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 6 }}>LP trung bình</div>
            {t.topMember && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg overflow-hidden" style={{ border: `1px solid ${rc.color}60` }}>
                  <img src={t.topMember.img} alt={t.topMember.name} className="w-full h-full object-cover" />
                </div>
                <span style={{ color: DS.text4, fontSize: 10 }}>{t.topMember.name.split(' ').pop()}</span>
                <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "vi";
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'Alpha' | 'Sigma' | 'Omega'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'lp' | 'level' | 'missions'>('lp');
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = members.filter(m => {
    const matchTeam = filter === 'all' || m.team === filter;
    const matchSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase());
    return matchTeam && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'lp') return b.lpBalance - a.lpBalance;
    if (sortBy === 'level') return b.level - a.level;
    return b.missions - a.missions;
  });

  const allSorted = [...members].sort((a, b) => b.lpBalance - a.lpBalance);
  const maxLP = allSorted[0]?.lpBalance ?? 1;
  const myMember = user ? members.find(m => m.name.toLowerCase().includes(user.shortName?.toLowerCase() ?? '')) : null;
  const myRank = myMember ? allSorted.findIndex(m => m.id === myMember.id) + 1 : null;

  const FILTERS: { key: 'all' | 'Alpha' | 'Sigma' | 'Omega'; label: string; color: string }[] = [
    { key: 'all', label: 'Tất cả', color: DS.blue },
    { key: 'Alpha', label: 'Alpha', color: DS.blue },
    { key: 'Sigma', label: 'Sigma', color: DS.purple },
    { key: 'Omega', label: 'Omega', color: DS.cyan },
  ];

  const SORTS = [
    { key: 'lp' as const, label: 'LP Balance', icon: <Zap size={12} /> },
    { key: 'level' as const, label: 'Level', icon: <TrendingUp size={12} /> },
    { key: 'missions' as const, label: 'Quests', icon: <Target size={12} /> },
  ];

  return (
    <div style={{ background: DS.bg, minHeight: '100vh', fontFamily: DS.body, paddingBottom: 80 }}>
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Season Banner */}
        <SeasonBanner />

        {/* My rank card (if logged in as staff) */}
        {myMember && myRank && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-center gap-4"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: `1.5px solid ${RANKS[myMember.rank].color}`, boxShadow: `0 0 10px ${RANKS[myMember.rank].glowColor}` }}>
              <img src={myMember.img} alt={myMember.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 2 }}>VỊ TRÍ CỦA BẠN · SEASON III</div>
              <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{myMember.name}</div>
            </div>
            <div className="text-right">
              <div style={{ color: RANKS[myMember.rank].color, fontFamily: DS.mono, fontSize: 20, fontWeight: 900, textShadow: `0 0 12px ${RANKS[myMember.rank].glowColor}` }}>
                #{myRank}
              </div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fmtLP(myMember.lpBalance)} LP</div>
            </div>
          </motion.div>
        )}

        {/* Podium */}
        {filter === 'all' && search === '' && <Podium sorted={allSorted} />}

        {/* Analytics row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Rank distribution donut */}
          <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── PHÂN PHỐI RANK</div>
            <RankDonut />
          </div>

          {/* LP bar chart top 10 */}
          <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── LP TOP 10 THÀNH VIÊN</div>
            {showChart && <LPBarChart sorted={allSorted} />}
          </div>
        </div>

        {/* Team summary */}
        <div className="mb-6">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── TỔNG QUAN THEO NHÓM</div>
          <DeptSummary />
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 px-4 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, height: 40 }}>
            <Search size={14} style={{ color: DS.text4, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Tìm thành viên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 13, fontFamily: DS.body }}
            />
          </div>

          {/* Team filter */}
          <div className="flex gap-1.5">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  border: `1px solid ${filter === f.key ? f.color : DS.border}`,
                  background: filter === f.key ? `${f.color}12` : 'transparent',
                  color: filter === f.key ? f.color : DS.text4,
                  cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, transition: 'all 0.15s',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-1.5">
            {SORTS.map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)}
                className="flex items-center gap-1"
                style={{
                  padding: '8px 12px', borderRadius: 10,
                  border: `1px solid ${sortBy === s.key ? DS.purple : DS.border}`,
                  background: sortBy === s.key ? 'rgba(129,140,248,0.1)' : 'transparent',
                  color: sortBy === s.key ? DS.purple : DS.text4,
                  cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, transition: 'all 0.15s',
                }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Full ranked list */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: DS.bgCard, borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>
              ── BẢNG XẾP HẠNG · {sorted.length} THÀNH VIÊN
            </div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
              Sắp xếp theo {sortBy === 'lp' ? 'LP' : sortBy === 'level' ? 'Level' : 'Quests'}
            </div>
          </div>
          <div className="p-3 md:p-4 space-y-2" style={{ background: DS.bgCard }}>
            <AnimatePresence mode="popLayout">
              {sorted.map((m, _i) => {
                const globalRank = allSorted.findIndex(mm => mm.id === m.id) + 1;
                return (
                  <MemberRow
                    key={m.id}
                    m={m}
                    rank={globalRank}
                    maxLP={maxLP}
                    isMe={myMember?.id === m.id}
                    onView={() => {}}
                  />
                );
              })}
            </AnimatePresence>
            {sorted.length === 0 && (
              <div className="py-12 text-center">
                <div style={{ color: DS.text5, fontSize: 13 }}>Không tìm thấy thành viên phù hợp</div>
              </div>
            )}
          </div>
        </div>

        {/* CTA for non-logged-in users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-2xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.1), rgba(129,140,248,0.06))', border: '1px solid rgba(129,140,248,0.2)' }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 900, color: DS.text, letterSpacing: '0.04em', marginBottom: 8 }}>
              THAM GIA LOOP — LEO BẢNG XẾP HẠNG
            </h3>
            <p style={{ color: DS.text3, fontSize: 14, maxWidth: 400, margin: '0 auto 20px' }}>
              Tích lũy LP qua mỗi dự án, nhiệm vụ và sự kiện. Thăng hạng từ Iron đến Diamond.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href={`/${locale}/dang-nhap`}
                style={{ padding: '12px 28px', background: GRD.primary, color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 0 20px rgba(129,140,248,0.35)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Tham gia ngay <ArrowUpRight size={15} />
              </Link>
              <Link href={`/${locale}/dang-nhap`}
                style={{ padding: '12px 28px', background: 'transparent', color: DS.blue, borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: 'none', border: `1px solid rgba(59,130,246,0.35)` }}>
                Đăng nhập
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
