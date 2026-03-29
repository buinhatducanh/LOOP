/**
 * Wire Home.tsx → teamService.getMembers()
 * Adds useEffect to fetch 27 team members from BE API.
 * Falls back to hardcoded memberData when BE offline.
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/Home.tsx', 'utf8');
let g = f;

// ── 1. Add teamService import ──────────────────────────────────────────────────
const oldImports = `import { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { MemberCard, GUILD_ANIMATIONS_CSS, getRankEntranceProps } from './components/team/MemberCard';
import { HUDPanel } from './components/team/HUDPanel';
import { members, Member, RANKS, RankKey } from './components/team/memberData';
import { HallOfFame } from './components/team/HallOfFame';
import { RoleFilters, RoleFilter } from './components/team/RoleFilters';
import { SearchSortBar, SortOption } from './components/team/SearchSortBar';
import { GRD, DS } from './components/layout/ds';
import { Shield, Users, Zap, Trophy, ChevronRight, ArrowRight } from 'lucide-react';`;

const newImports = `import { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { MemberCard, GUILD_ANIMATIONS_CSS, getRankEntranceProps } from './components/team/MemberCard';
import { HUDPanel } from './components/team/HUDPanel';
import { members as fallbackMembers, Member, RANKS, RankKey } from './components/team/memberData';
import { HallOfFame } from './components/team/HallOfFame';
import { RoleFilters, RoleFilter } from './components/team/RoleFilters';
import { SearchSortBar, SortOption } from './components/team/SearchSortBar';
import { GRD, DS } from './components/layout/ds';
import { Shield, Users, Zap, Trophy, ChevronRight, ArrowRight } from 'lucide-react';
import { teamService } from './api/team.service';`;

g = g.replace(oldImports, newImports);

// ── 2. Replace fmtLP (keep, it uses Member.lpEarned) ────────────────────────
// No change needed for fmtLP — it's a pure utility

// ── 3. Inject state + useEffect into Home component ─────────────────────────────
const oldHomeStart = `export default function Home() {
  const [selected, setSelected]     = useState<Member | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]         = useState<SortOption>('level-desc');`;

const newHomeStart = `export default function Home() {
  const [selected, setSelected]     = useState<Member | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]         = useState<SortOption>('level-desc');

  // API-loaded members — falls back to hardcoded data when offline
  const [apiMembers, setApiMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    teamService.getMembers('vi')
      .then(({ members: fetched }) => {
        if (!cancelled && fetched.length > 0) {
          // Merge: BE data + enriched fallback fields (missions, achievements, skills, rankHistory)
          const merged = fetched.map(beMember => {
            const fallback = fallbackMembers.find(m => m.id === beMember.id);
            return {
              ...beMember,
              // Fallback fields BE may not have
              missions: fallback?.missions ?? 0,
              achievements: fallback?.achievements ?? [],
              skills: fallback?.skills ?? {},
              missionLogs: fallback?.missionLogs ?? [],
              rankHistory: fallback?.rankHistory ?? [],
              currentXP: fallback?.currentXP ?? 0,
              maxXP: fallback?.maxXP ?? beMember.level * 100,
              lpSpent: fallback?.lpSpent ?? 0,
            } satisfies Member;
          });
          setApiMembers(merged);
        }
      })
      .catch(() => { /* keep using fallback */ })
      .finally(() => { if (!cancelled) setMembersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API members when loaded, fall back to hardcoded data
  const members: Member[] = apiMembers.length > 0 ? apiMembers : fallbackMembers;`;

g = g.replace(oldHomeStart, newHomeStart);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/Home.tsx', g, 'utf8');
console.log('Done — Home.tsx wired to teamService.getMembers()');
