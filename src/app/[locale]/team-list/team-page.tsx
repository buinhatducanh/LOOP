"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { GuildMemberCard } from '@/components/team/GuildMemberCard';
import { GuildHallOfFame } from '@/components/team/GuildHallOfFame';
import { GuildRoleFilters, RoleFilter } from '@/components/team/GuildRoleFilters';
import { GuildSearchSortBar, SortOption } from '@/components/team/GuildSearchSortBar';
import { GuildHUDPanel } from '@/components/team/GuildHUDPanel';
import { RANKS, GUILD_ANIMATIONS_CSS } from '@/components/team/teamRanks';

interface TeamMemberData {
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
  skills?: string[];
  experience?: string | null;
  isFeatured?: boolean;
}

interface Expertise {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface TeamPageProps {
  team: TeamMemberData[];
  expertises?: Expertise[];
  settings?: {
    title?: string;
    subtitle?: string;
  };
}

// ── Asian background pattern ───────────────────────────────────────────────────
function AsianBgPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.025 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hexGrid" width="40" height="46" patternUnits="userSpaceOnUse">
          <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexGrid)" />
    </svg>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="text-center mb-14 relative">
      {/* Top ornament row */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1F2937)' }} />
        <div className="flex items-center gap-2">
          <span style={{ color: '#1F2937', fontSize: 10 }}>◈</span>
          <span style={{ color: '#3B82F620', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.3em' }}>────</span>
          <span style={{ color: '#3B82F6', fontSize: 12 }}>✦</span>
          <span style={{ color: '#3B82F620', fontSize: 8, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.3em' }}>────</span>
          <span style={{ color: '#1F2937', fontSize: 10 }}>◈</span>
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1F2937, transparent)' }} />
      </div>

      {/* Guild label */}
      <div className="mb-2" style={{ color: '#3B82F6', fontSize: 11, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.35em' }}>
        ◎ OPERATIVE GUILD ◎
      </div>

      {/* Main title */}
      <h2 style={{
        fontFamily: 'var(--font-cinzel), Cinzel, serif',
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: '0.08em',
        lineHeight: 1.1,
        background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {title || 'HALL OF OPERATIVES'}
      </h2>

      {/* Subtitle */}
      <p className="mt-3" style={{ color: '#64748B', fontSize: 12, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.15em' }}>
        {subtitle || '— SELECT AN OPERATIVE TO INSPECT THE HUD —'}
      </p>

      {/* Bottom ornament row */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <div style={{ flex: 1, maxWidth: 120, height: 1, background: 'linear-gradient(90deg, transparent, #1F2937)' }} />
        <div className="flex items-center gap-1">
          {['iron','bronze','silver','gold','platinum','ruby','diamond'].map((r) => (
            <div
              key={r}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: RANKS[r as keyof typeof RANKS].color,
                boxShadow: `0 0 4px ${RANKS[r as keyof typeof RANKS].glowColor}`,
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, maxWidth: 120, height: 1, background: 'linear-gradient(90deg, #1F2937, transparent)' }} />
      </div>
    </div>
  );
}

// ── Rank legend ───────────────────────────────────────────────────────────────
function RankLegend() {
  const rankKeys = ['iron','bronze','silver','gold','platinum','ruby','diamond'] as const;
  return (
    <div className="flex items-center justify-center flex-wrap gap-3 mt-12">
      {rankKeys.map((r) => {
        const cfg = RANKS[r];
        return (
          <div
            key={r}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
            style={{ background: '#0F172A', border: `1px solid ${cfg.color}30` }}
          >
            <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.symbol}</span>
            <span style={{ color: '#64748B', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
              {cfg.label}
            </span>
            <span style={{ color: '#475569', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace' }}>
              Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Role category helper ──────────────────────────────────────────────────────
function getRoleCategory(member: TeamMemberData): RoleFilter {
  const roleCode = member.roleCategory?.toUpperCase() || member.role?.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '') || '';
  const roleLower = member.role?.toLowerCase() || '';
  const roleLevel = member.roleLevel ?? 3;

  if (roleLevel === 0 || /ceo|founder|giám đốc|chủ tịch/i.test(roleLower)) return 'CEO';
  if (/product manager|pm$/i.test(roleLower)) return 'PM';
  if (/product owner|po$/i.test(roleLower)) return 'PO';
  if (/scrum|sc$/i.test(roleLower)) return 'SC';
  if (/hr|nhân sự|human/i.test(roleLower)) return 'HR';
  if (/marketing|mkt|sale/i.test(roleLower)) return 'MKT';
  if (/design|designer|ux|ui/i.test(roleLower)) return 'DESIGNER';
  if (roleCode === 'DEV' || /developer|dev|engineer|engineering|kỹ thuật/i.test(roleLower)) return 'DEV';
  return 'DEV'; // default
}

// ── Main TeamPage ─────────────────────────────────────────────────────────────
export function TeamPage({ team, expertises = [], settings }: TeamPageProps) {
  const [selected, setSelected] = useState<TeamMemberData | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('level-desc');

  // Inject guild animation keyframes
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'guild-animations';
    styleEl.textContent = GUILD_ANIMATIONS_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  // Sort options order map
  const RANK_TIER_MAP: Record<string, number> = {
    diamond: 7, ruby: 6, platinum: 5, gold: 4, silver: 3, bronze: 2, iron: 1,
  };

  // Filtered + sorted members
  const filteredMembers = useMemo(() => {
    let result = [...team];

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((m) => getRoleCategory(m) === roleFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.shortBio && m.shortBio.toLowerCase().includes(q)) ||
        (m.expertise && m.expertise.some((e) => typeof e === 'string' ? e.toLowerCase().includes(q) : (e as any).name?.toLowerCase().includes(q))) ||
        (m.skills && m.skills.some((s) => typeof s === 'string' ? s.toLowerCase().includes(q) : (s as any).name?.toLowerCase().includes(q)))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aLevel = a.roleLevel ?? 3;
      const bLevel = b.roleLevel ?? 3;
      const aIsCEO = aLevel === 0 || /ceo|founder/i.test(a.role || '');
      const bIsCEO = bLevel === 0 || /ceo|founder/i.test(b.role || '');

      if (sortBy === 'level-desc') {
        if (aIsCEO !== bIsCEO) return aIsCEO ? -1 : 1;
        return aLevel - bLevel;
      }
      if (sortBy === 'level-asc') {
        if (aIsCEO !== bIsCEO) return aIsCEO ? -1 : 1;
        return bLevel - aLevel;
      }
      if (sortBy === 'rank-desc') {
        if (aIsCEO !== bIsCEO) return aIsCEO ? -1 : 1;
        return aLevel - bLevel;
      }
      if (sortBy === 'rank-asc') {
        if (aIsCEO !== bIsCEO) return aIsCEO ? -1 : 1;
        return bLevel - aLevel;
      }
      return 0;
    });

    return result;
  }, [team, roleFilter, searchQuery, sortBy]);

  // Hall of Fame: top 3 by roleLevel (CEO first, then highest levels)
  const hallOfFameMembers = useMemo(() => {
    const sorted = [...team].sort((a, b) => (a.roleLevel ?? 3) - (b.roleLevel ?? 3));
    return sorted.slice(0, 3);
  }, [team]);

  // Derive level for each member for display
  const getLevel = (m: TeamMemberData) => {
    const isCEO = (m.roleLevel ?? 3) === 0 || /ceo|founder/i.test(m.role || '');
    const isCTO = /cto|technical/i.test(m.role || '');
    const isLead = (m.roleLevel ?? 3) === 1;
    const isSenior = (m.roleLevel ?? 3) === 2;
    if (isCEO) return 118;
    if (isCTO) return 103;
    if (isLead) return 68;
    if (isSenior) return 43;
    return 24;
  };

  const handleMemberClick = (member: TeamMemberData) => {
    setSelected(member);
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: '#020617', fontFamily: "'Cinzel', 'JetBrains Mono', 'Inter', sans-serif" }}
    >
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute"
          style={{
            top: '-20%',
            left: '-10%',
            width: '60%',
            height: '60%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '-10%',
            right: '-10%',
            width: '50%',
            height: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          }}
        />
        <AsianBgPattern />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <SectionHeader title={settings?.title} subtitle={settings?.subtitle} />
        </motion.div>

        {/* Hall of Fame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          <GuildHallOfFame members={hallOfFameMembers} onMemberClick={handleMemberClick} />
        </motion.div>

        {/* Role Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
        >
          <GuildRoleFilters activeFilter={roleFilter} onFilterChange={setRoleFilter} />
        </motion.div>

        {/* Search/Sort Bar */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
        >
          <GuildSearchSortBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </motion.div>

        {/* Results count */}
        {(roleFilter !== 'all' || searchQuery) && (
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span style={{ color: '#64748B', fontSize: 11, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
              ◈ {filteredMembers.length} OPERATIVE{filteredMembers.length !== 1 ? 'S' : ''} FOUND ◈
            </span>
          </motion.div>
        )}

        {/* Member Grid */}
        {filteredMembers.length > 0 ? (
          <>
            {/* Row 1 — up to 4 cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {filteredMembers.slice(0, 4).map((member, idx) => {
                const level = getLevel(member);
                const entrance = getEntranceProps(level, 0.6 + idx * 0.08);
                return (
                  <motion.div
                    key={member.id}
                    initial={entrance.initial}
                    animate={entrance.animate}
                    transition={entrance.transition}
                    style={(entrance as any).style}
                  >
                    <GuildMemberCard
                      member={{ ...member, level }}
                      onClick={handleMemberClick}
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* Row 2+ — remaining cards */}
            {filteredMembers.length > 4 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mt-6">
                {filteredMembers.slice(4).map((member, idx) => {
                  const level = getLevel(member);
                  const entrance = getEntranceProps(level, 0.6 + (idx + 4) * 0.08);
                  return (
                    <motion.div
                      key={member.id}
                      initial={entrance.initial}
                      animate={entrance.animate}
                      transition={entrance.transition}
                      style={(entrance as any).style}
                    >
                      <GuildMemberCard
                        member={{ ...member, level }}
                        onClick={handleMemberClick}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // No results state
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-block px-6 py-4 rounded-lg" style={{ background: '#0F172A', border: '1px solid #1F2937' }}>
              <div style={{ color: '#475569', fontSize: 32, marginBottom: 8 }}>◎</div>
              <div style={{ color: '#94A3B8', fontSize: 13, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
                NO OPERATIVES FOUND
              </div>
              <div style={{ color: '#475569', fontSize: 10, marginTop: 4 }}>
                Try adjusting your filters or search query
              </div>
            </div>
          </motion.div>
        )}

        {/* Rank legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <RankLegend />
        </motion.div>

        {/* Footer ornament */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1F2937)' }} />
          <span style={{ color: '#1F2937', fontSize: 12 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1F2937, transparent)' }} />
        </div>
        <div className="text-center mt-3" style={{ color: '#1F2937', fontSize: 9, fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', letterSpacing: '0.3em' }}>
          GUILD HALL — SEASON III — 2026
        </div>
      </div>

      {/* HUD Panel */}
      <GuildHUDPanel member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

// ── Entrance animation helper (inline to avoid circular deps) ───────────────
function getEntranceProps(level: number, delay: number) {
  if (level >= 115) {
    return {
      initial: { opacity: 0, scale: 1.3, filter: 'blur(18px)' },
      animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
    };
  }
  if (level >= 95) {
    return {
      initial: { opacity: 0, x: 80, scale: 0.82 },
      animate: { opacity: 1, x: 0, scale: 1 },
      transition: { type: 'spring' as const, stiffness: 380, damping: 22, delay },
    };
  }
  if (level >= 75) {
    return {
      initial: { opacity: 0, rotateX: 68, y: 24 },
      animate: { opacity: 1, rotateX: 0, y: 0 },
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
      style: { perspective: 900 },
    };
  }
  if (level >= 55) {
    return {
      initial: { opacity: 0, scale: 0.72 },
      animate: { opacity: 1, scale: 1 },
      transition: { type: 'spring' as const, stiffness: 220, damping: 16, delay },
    };
  }
  if (level >= 35) {
    return {
      initial: { opacity: 0, x: -40, scale: 0.94 },
      animate: { opacity: 1, x: 0, scale: 1 },
      transition: { duration: 0.55, ease: 'easeOut', delay },
    };
  }
  if (level >= 15) {
    return {
      initial: { opacity: 0, y: 55 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
    };
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.75, ease: 'easeOut', delay },
  };
}
