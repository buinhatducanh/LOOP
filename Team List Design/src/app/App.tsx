import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MemberCard, GUILD_ANIMATIONS_CSS, getRankEntranceProps } from './components/team/MemberCard';
import { HUDPanel } from './components/team/HUDPanel';
import { members, Member, RANKS } from './components/team/memberData';
import { HallOfFame } from './components/team/HallOfFame';
import { RoleFilters, RoleFilter } from './components/team/RoleFilters';
import { SearchSortBar, SortOption } from './components/team/SearchSortBar';

// ── Section decorative header ─────────────────────────────────────────────
function SectionHeader() {
  return (
    <div className="text-center mb-14 relative">
      {/* Top ornament row */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1F2937)' }} />
        <div className="flex items-center gap-2">
          <span style={{ color: '#1F2937', fontSize: 10 }}>◈</span>
          <span style={{ color: '#3B82F620', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.3em' }}>
            ────
          </span>
          <span style={{ color: '#3B82F6', fontSize: 12 }}>✦</span>
          <span style={{ color: '#3B82F620', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.3em' }}>
            ────
          </span>
          <span style={{ color: '#1F2937', fontSize: 10 }}>◈</span>
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1F2937, transparent)' }} />
      </div>

      {/* Guild label */}
      <div
        className="mb-2"
        style={{
          color: '#3B82F6',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.35em',
        }}
      >
        ◎ OPERATIVE GUILD ◎
      </div>

      {/* Main title */}
      <h2
        style={{
          fontFamily: "'Cinzel', serif",
          color: '#FFFFFF',
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: '0.08em',
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        HALL OF OPERATIVES
      </h2>

      {/* Subtitle */}
      <p
        className="mt-3"
        style={{ color: '#64748B', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em' }}
      >
        — SELECT AN OPERATIVE TO INSPECT THE HUD —
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

// ── Asian background pattern overlay ─────────────────────────────────────
function AsianBgPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.025 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hexGrid" width="40" height="46" patternUnits="userSpaceOnUse">
          <path
            d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexGrid)" />
    </svg>
  );
}

// ── Rank legend row ───────────────────────────────────────────────────────
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
            style={{
              background: '#0F172A',
              border: `1px solid ${cfg.color}30`,
            }}
          >
            <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.symbol}</span>
            <span
              style={{
                color: '#64748B',
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.1em',
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                color: '#475569',
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState<Member | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('level-desc');

  // Inject animation keyframes
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'guild-animations';
    styleEl.textContent = GUILD_ANIMATIONS_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  // ── Filtering logic ──────────────────────────────────────────────────
  const getRoleCategory = (member: Member): RoleFilter => {
    // Sử dụng roleCode để filter chính xác
    const roleCode = member.roleCode;
    
    // Map roleCode sang RoleFilter (đảm bảo mapping thông minh cho Tech-Zen)
    if (roleCode === 'PM') return 'PM';
    if (roleCode === 'PO') return 'PO';
    if (roleCode === 'CEO' || roleCode === 'MAP') return 'CEO';
    if (roleCode === 'SC' || roleCode === 'SHIELD') return 'SC';
    if (roleCode === 'HR') return 'HR';
    if (roleCode === 'MKT') return 'MKT';
    if (roleCode === 'DESIGNER' || roleCode === 'STAFF') return 'DESIGNER';
    if (['BOW', 'DAGGER', 'DUAL', 'DEV_FE', 'DEV_BE', 'DEV_FS', 'QA', 'DATA'].includes(roleCode)) return 'DEV';
    
    return 'all';
  };

  let filteredMembers = members.filter((m) => {
    // Role filter
    if (roleFilter !== 'all' && getRoleCategory(m) !== roleFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.team.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q)
      );
    }
    
    return true;
  });

  // ── Sorting logic ────────────────────────────────────────────────────
  filteredMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'level-desc') return b.level - a.level;
    if (sortBy === 'level-asc') return a.level - b.level;
    if (sortBy === 'rank-desc') return RANKS[b.rank].tier - RANKS[a.rank].tier;
    if (sortBy === 'rank-asc') return RANKS[a.rank].tier - RANKS[b.rank].tier;
    if (sortBy === 'team') return a.team.localeCompare(b.team);
    return 0;
  });

  // ── Hall of Fame members ─────────────────────────────────────────────
  const mvp = members.find((m) => m.id === 7)!; // Akira Sato
  const bugSlayer = members.find((m) => m.id === 6)!; // Rin Nakamura
  const topPerformer = members.find((m) => m.id === 4)!; // Yuna Park

  // Row 1: first 4 members, Row 2: last 3 members
  const row1 = filteredMembers.slice(0, 4);
  const row2 = filteredMembers.slice(4);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: '#020617', fontFamily: "'Noto Serif JP', 'Inter', sans-serif" }}
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
      <div className="relative z-10 px-8 py-16 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <SectionHeader />
        </motion.div>

        {/* Hall of Fame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          <HallOfFame
            mvp={mvp}
            bugSlayer={bugSlayer}
            topPerformer={topPerformer}
            onMemberClick={setSelected}
          />
        </motion.div>

        {/* Role Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
        >
          <RoleFilters activeFilter={roleFilter} onFilterChange={setRoleFilter} />
        </motion.div>

        {/* Search/Sort Bar */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
        >
          <SearchSortBar
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
            <span
              style={{
                color: '#64748B',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.1em',
              }}
            >
              ◈ {filteredMembers.length} OPERATIVE{filteredMembers.length !== 1 ? 'S' : ''} FOUND ◈
            </span>
          </motion.div>
        )}

        {/* Member Grid */}
        {filteredMembers.length > 0 ? (
          <>
            {/* Row 1 — 4 cards */}
            <div className="grid grid-cols-4 gap-8">
              {row1.map((member, idx) => {
                const entrance = getRankEntranceProps(member.rank, 0.6 + idx * 0.08);
                return (
                  <motion.div
                    key={member.id}
                    initial={entrance.initial}
                    animate={entrance.animate}
                    transition={entrance.transition}
                    style={(entrance as any).style}
                  >
                    <MemberCard member={member} onClick={setSelected} />
                  </motion.div>
                );
              })}
            </div>

            {/* Row 2 — 3 cards, centered */}
            {row2.length > 0 && (
              <div className="flex justify-center gap-8 mt-8">
                {row2.map((member, idx) => {
                  const entrance = getRankEntranceProps(member.rank, 0.6 + (idx + 4) * 0.08);
                  return (
                    <motion.div
                      key={member.id}
                      style={{ width: 'calc(25% - 24px)', minWidth: 160, maxWidth: 260, ...((entrance as any).style || {}) }}
                      initial={entrance.initial}
                      animate={entrance.animate}
                      transition={entrance.transition}
                    >
                      <MemberCard member={member} onClick={setSelected} />
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
            <div
              className="inline-block px-6 py-4 rounded-lg"
              style={{
                background: '#0F172A',
                border: '1px solid #1F2937',
              }}
            >
              <div style={{ color: '#475569', fontSize: 32, marginBottom: 8 }}>◎</div>
              <div
                style={{
                  color: '#94A3B8',
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                }}
              >
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
        <div
          className="text-center mt-3"
          style={{ color: '#1F2937', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.3em' }}
        >
          GUILD HALL — SEASON III — 2026
        </div>
      </div>

      {/* HUD Panel */}
      <HUDPanel member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}