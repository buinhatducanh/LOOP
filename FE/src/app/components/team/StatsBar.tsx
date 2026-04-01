/**
 * StatsBar — Rank distribution horizontal bar + team stats
 * Shows visual rank breakdown with animated progress bars + skill radar preview.
 */

import { useRef, useEffect, useState, memo } from 'react';
import { motion } from 'motion/react';
import type { Member } from './memberData';
import { RANKS, RankKey } from './memberData';
import { DS } from '../layout/ds';

// ── Format helpers ───────────────────────────────────────────────────
function fmtLP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

// ── Section divider ───────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${DS.border})` }} />
      <div className="flex items-center gap-2">
        <span style={{ color: DS.blue, fontSize: 8 }}>◈</span>
        <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.25em' }}>
          {label}
        </span>
        <span style={{ color: DS.blue, fontSize: 8 }}>◈</span>
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DS.border}, transparent)` }} />
    </div>
  );
}

// ── Single rank bar item ──────────────────────────────────────────────
interface RankBarItemProps {
  rank: RankKey;
  count: number;
  lpTotal: number;
  maxCount: number;
  delay: number;
}

const RankBarItem = memo(function RankBarItem({
  rank, count, lpTotal, maxCount, delay,
}: RankBarItemProps) {
  const cfg = RANKS[rank];
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <motion.div
      className="flex flex-col gap-1.5"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {/* Top row: icon + name + count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: cfg.color, fontSize: 13, textShadow: `0 0 8px ${cfg.glowColor}` }}>
            {cfg.symbol}
          </span>
          <span style={{ color: cfg.color, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.14em', fontWeight: 700 }}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
            {count}
          </span>
          <span style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>
            {fmtLP(lpTotal)} LP
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
            boxShadow: `0 0 8px ${cfg.glowColor}`,
          }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Glow dot at end */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{
            right: 0,
            width: 8, height: 8,
            background: cfg.color,
            boxShadow: `0 0 8px 3px ${cfg.glowColor}`,
            transform: 'translateY(-50%) translateX(50%)',
          }}
        />
      </div>

      {/* Level range */}
      <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>
        Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}
      </div>
    </motion.div>
  );
});

// ── Team Skills Summary (aggregate top skills) ───────────────────────
interface SkillsSummaryProps {
  members: Member[];
}

const SkillsSummary = memo(function SkillsSummary({ members }: SkillsSummaryProps) {
  const skillTotals: Record<string, { total: number; count: number; color: string }> = {};

  members.forEach(m => {
    Object.entries(m.skills).forEach(([skill, value]) => {
      if (!skillTotals[skill]) {
        // Assign a consistent color per skill category
        const colors: Record<string, string> = {
          React: '#61DAFB', Vue: '#4FC08D', Angular: '#DD0031',
          Node: '#339933', Python: '#3776AB', Go: '#00ADD8',
          Rust: '#CE422B', TypeScript: '#3178C6', JavaScript: '#F7DF1E',
          Figma: '#F24E1E', CSS: '#1572B6', MongoDB: '#47A248',
          PostgreSQL: '#336791', Docker: '#2496ED', AWS: '#FF9900',
          Firebase: '#FFCA28', GraphQL: '#E10098', SEO: '#E34F26',
          Marketing: '#FF6B6B', Design: '#9B59B6',
        };
        skillTotals[skill] = { total: 0, count: 0, color: colors[skill] ?? DS.purple };
      }
      skillTotals[skill].total += value;
      skillTotals[skill].count += 1;
    });
  });

  const topSkills = Object.entries(skillTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8);

  const maxTotal = topSkills[0]?.[1].total ?? 1;

  return (
    <div className="space-y-3">
      {topSkills.map(([skill, data], i) => {
        const pct = (data.total / maxTotal) * 100;
        return (
          <div key={skill} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span style={{ color: data.color, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.1em', fontWeight: 600 }}>
                {skill.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>
                  {data.count} members
                </span>
                <span style={{ color: data.color, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>
                  {data.total}
                </span>
              </div>
            </div>
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: data.color,
                  boxShadow: `0 0 4px ${data.color}80`,
                }}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ── Main StatsBar ────────────────────────────────────────────────────
interface StatsBarProps {
  members: Member[];
  activeFilter: RankKey | 'all';
  onFilterChange: (r: RankKey | 'all') => void;
}

export const StatsBar = memo(function StatsBar({
  members,
  activeFilter,
  onFilterChange,
}: StatsBarProps) {
  const rankKeys: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];
  const countPerRank = rankKeys.reduce(
    (acc, r) => ({ ...acc, [r]: members.filter(m => m.rank === r).length }),
    {} as Record<RankKey, number>
  );
  const lpPerRank = rankKeys.reduce(
    (acc, r) => ({
      ...acc,
      [r]: members
        .filter(m => m.rank === r)
        .reduce((s, m) => s + m.lpEarned, 0),
    }),
    {} as Record<RankKey, number>
  );
  const maxCount = Math.max(...Object.values(countPerRank), 1);

  const totalLP = members.reduce((s, m) => s + m.lpEarned, 0);
  const totalMissions = members.reduce((s, m) => s + m.missions, 0);
  const totalAchievements = members.reduce((s, m) => s + m.achievements.length, 0);
  const avgLevel = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.level, 0) / members.length)
    : 0;

  return (
    <div className="mb-14 space-y-8">
      {/* ── Summary KPIs row ─────────────────────────── */}
      <div>
        <SectionDivider label="GUILD PERFORMANCE OVERVIEW" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'MEMBERS', value: members.length, color: DS.blue },
            { label: 'TOTAL LP', value: fmtLP(totalLP), color: DS.purple },
            { label: 'MISSIONS', value: totalMissions, color: DS.cyan },
            { label: 'AVG LEVEL', value: avgLevel, color: DS.amber },
            { label: 'TROPHIES', value: totalAchievements, color: DS.pink },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="rounded-xl p-4 text-center relative overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${stat.color}25` }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
            >
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(circle at 50% 0%, ${stat.color}06, transparent 60%)`,
                  pointerEvents: 'none',
                }}
              />
              <div style={{
                color: stat.color,
                fontFamily: DS.heading,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1,
                textShadow: `0 0 14px ${stat.color}50`,
              }}>
                {stat.value}
              </div>
              <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: '0.14em', marginTop: 4 }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Rank distribution ────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <SectionDivider label="RANK DISTRIBUTION" />
          {activeFilter !== 'all' && (
            <button
              onClick={() => onFilterChange('all')}
              className="flex-shrink-0"
              style={{
                color: DS.blue,
                background: 'none',
                border: `1px solid rgba(59,130,246,0.3)`,
                borderRadius: 6,
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 9,
                fontFamily: DS.mono,
                letterSpacing: '0.1em',
              }}
            >
              ✕ CLEAR FILTER
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {rankKeys.map((rk, idx) => {
            const count = countPerRank[rk];
            const lp = lpPerRank[rk];
            const cfg = RANKS[rk];
            const isActive = activeFilter === rk;

            return (
              <motion.button
                key={rk}
                onClick={() => onFilterChange(isActive ? 'all' : rk)}
                className="relative rounded-xl p-4 text-left"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${cfg.gradientFrom}22, ${cfg.gradientTo}12)`
                    : 'rgba(15,23,42,0.6)',
                  border: `1px solid ${isActive ? cfg.color + '70' : cfg.color + '15'}`,
                  boxShadow: isActive ? `0 0 20px ${cfg.glowColor}` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: 'easeOut' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: cfg.color, fontSize: 16, textShadow: isActive ? `0 0 12px ${cfg.glowColor}` : 'none' }}>
                      {cfg.symbol}
                    </span>
                    <span style={{ color: isActive ? cfg.color : DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.14em', fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <span style={{ color: '#FFFFFF', fontFamily: DS.heading, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                    {count}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between" style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                    <span>Level range</span>
                    <span style={{ color: isActive ? cfg.color : DS.text4 }}>
                      Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}
                    </span>
                  </div>
                  <div className="flex justify-between" style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                    <span>Total LP</span>
                    <span style={{ color: isActive ? cfg.color : DS.text4 }}>
                      {fmtLP(lp)}
                    </span>
                  </div>

                  {/* Mini bar */}
                  <div className="relative h-1 rounded-full overflow-hidden mt-2" style={{ background: '#1F2937' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                        background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                        boxShadow: `0 0 4px ${cfg.glowColor}`,
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                </div>

                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
                    style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
                    layoutId="statsRankBar"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Skills matrix ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 16 }}>
            ── SKILLS MATRIX (TOP 8)
          </div>
          <SkillsSummary members={members} />
        </div>

        <div className="rounded-xl p-5" style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 16 }}>
            ── RANK PROGRESSION
          </div>
          <RankBarItem rank="diamond" count={countPerRank.diamond} lpTotal={lpPerRank.diamond} maxCount={maxCount} delay={0} />
          <RankBarItem rank="ruby"     count={countPerRank.ruby}     lpTotal={lpPerRank.ruby}     maxCount={maxCount} delay={0.04} />
          <RankBarItem rank="platinum" count={countPerRank.platinum} lpTotal={lpPerRank.platinum} maxCount={maxCount} delay={0.08} />
          <RankBarItem rank="gold"     count={countPerRank.gold}     lpTotal={lpPerRank.gold}     maxCount={maxCount} delay={0.12} />
          <RankBarItem rank="silver"  count={countPerRank.silver}  lpTotal={lpPerRank.silver}  maxCount={maxCount} delay={0.16} />
          <RankBarItem rank="bronze"  count={countPerRank.bronze}  lpTotal={lpPerRank.bronze}  maxCount={maxCount} delay={0.20} />
          <RankBarItem rank="iron"    count={countPerRank.iron}    lpTotal={lpPerRank.iron}    maxCount={maxCount} delay={0.24} />
        </div>
      </div>
    </div>
  );
});
