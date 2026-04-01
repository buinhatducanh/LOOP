import { useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { MemberCard, GUILD_ANIMATIONS_CSS, getRankEntranceProps } from './components/team/MemberCard';
import { HUDPanel } from './components/team/HUDPanel';
import { members as fallbackMembers, Member, RANKS, RankKey } from './components/team/memberData';
import { HallOfFame } from './components/team/HallOfFame';
import { RoleFilters, RoleFilter } from './components/team/RoleFilters';
import { SearchSortBar, SortOption } from './components/team/SearchSortBar';
import { GRD, DS } from './components/layout/ds';
import { teamService, mapTeamMemberToMember } from '../api/team.service';
import { Shield, Users, Zap, Trophy, ChevronRight, ArrowRight } from 'lucide-react';
import { useLocaleStore } from './store/localeStore';

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtLP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Background hex pattern ────────────────────────────────────────────────
const HexPattern = memo(function HexPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.02 }}>
      <defs>
        <pattern id="hexTeam" width="40" height="46" patternUnits="userSpaceOnUse">
          <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexTeam)" />
    </svg>
  );
});

// ── Hero Section ──────────────────────────────────────────────────────────
const HeroSection = memo(function HeroSection({ members }: { members: Member[] }) {
  const totalLP   = members.reduce((s, m) => s + m.lpEarned, 0);
  const totalMissions = members.reduce((s, m) => s + m.missions, 0);
  const totalAchievements = members.reduce((s, m) => s + m.achievements.length, 0);
  const topMember = [...members].sort((a, b) => (RANKS[b.rank]?.tier ?? 0) - (RANKS[a.rank]?.tier ?? 0))[0];

  const kpis = [
    { label: 'Thành viên đang hoạt động', value: `${members.length}`, suffix: ' operative', color: DS.blue },
    { label: 'Tổng LP lưu thông', value: fmtLP(totalLP), suffix: ' LP', color: DS.purple },
    { label: 'Nhiệm vụ hoàn thành', value: String(totalMissions), suffix: ' ops', color: DS.cyan },
    { label: 'Thành tích guild', value: String(totalAchievements), suffix: ' trophy', color: DS.amber },
  ];

  return (
    <section className="relative pt-28 pb-20 px-6 overflow-hidden">
      {/* Gradient orbs — opacity reduced to 0.04 to avoid doubling with the page-level fixed background orbs */}
      <motion.div style={{ position: 'absolute', top: '-10%', left: '-8%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(29,78,216,0.04) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div style={{ position: 'absolute', top: '30%', right: '-5%', width: '45%', height: '45%', background: 'radial-gradient(circle, rgba(129,140,248,0.04) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }} />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.blue, boxShadow: `0 0 6px ${DS.blue}` }} />
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.25em' }}>OPERATIVE GUILD · SEASON III · Q1/2026</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: DS.heading, letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: 20 }}>
            <span style={{ display: 'block', fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ĐỘI NGŨ TINH NHUỆ
            </span>
            <span style={{ display: 'block', fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, background: GRD.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LOOP SOLUTIONS
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 40px' }}>
            Mỗi thành viên là một mảnh ghép quan trọng. Cùng nhau chúng tôi xây dựng những sản phẩm kỹ thuật số
            đỉnh cao — được đo lường bằng LP, thăng hạng bằng kết quả thực tế.
          </motion.p>

          {/* CTA row */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/dat-lich"
              style={{ background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 0 32px rgba(129,140,248,0.45)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Làm việc cùng chúng tôi <ArrowRight size={15} />
            </Link>
            <Link to="/admin"
              style={{ color: DS.text3, fontSize: 13, padding: '11px 22px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
              <Shield size={13} style={{ color: DS.text5 }} /> Admin Panel
            </Link>
          </motion.div>
        </div>

        {/* KPI row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} className="rounded-2xl p-5 text-center relative overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${k.color}20`, backdropFilter: 'blur(12px)' }}
              whileHover={{ borderColor: `${k.color}50`, boxShadow: `0 0 24px ${k.color}15` }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.06 }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 0%, ${k.color}06, transparent 60%)`, pointerEvents: 'none' }} />
              <div style={{ color: k.color, fontFamily: DS.heading, fontSize: 28, fontWeight: 700, textShadow: `0 0 16px ${k.color}50`, lineHeight: 1 }}>
                {k.value}<span style={{ fontSize: 12 }}>{k.suffix}</span>
              </div>
              <div style={{ color: DS.text4, fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>{k.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

// ── Rank Distribution Strip ───────────────────────────────────────────────
type RankFilter = RankKey | 'all';

const RankStrip = memo(function RankStrip({ members, active, onChange }: { members: Member[]; active: RankFilter; onChange: (r: RankFilter) => void }) {
  const rankKeys: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];
  const countPerRank = rankKeys.reduce((acc, r) => ({ ...acc, [r]: members.filter(m => m.rank === r).length }), {} as Record<RankKey, number>);
  const lpPerRank = rankKeys.reduce((acc, r) => ({ ...acc, [r]: members.filter(m => m.rank === r).reduce((s, m) => s + m.lpEarned, 0) }), {} as Record<RankKey, number>);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-5" style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>
        <div style={{ width: 24, height: 1, background: DS.border }} />
        PHÂN BỐ RANK · BẤM ĐỂ LỌC
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DS.border}, transparent)` }} />
        {active !== 'all' && (
          <button onClick={() => onChange('all')} style={{ color: DS.text5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: RANKS[active].color }}>×</span> Bỏ lọc
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2" style={{ borderLeft: `2px solid ${DS.border}`, paddingLeft: 8 }}>
        {rankKeys.map((rk, idx) => {
          const cfg = RANKS[rk];
          const isActive = active === rk;
          const isDimmed = active !== 'all' && !isActive;
          return (
            <motion.button key={rk}
              onClick={() => onChange(isActive ? 'all' : rk)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="relative rounded-xl p-3 text-left"
              style={{
                background: isActive ? `linear-gradient(135deg, ${cfg.gradientFrom}20, ${cfg.gradientTo}10)` : 'rgba(15,23,42,0.6)',
                border: `1px solid ${isActive ? cfg.color + '70' : cfg.color + '18'}`,
                boxShadow: isActive ? `0 0 20px ${cfg.glowColor}, 0 4px 20px rgba(0,0,0,0.3)` : 'none',
                opacity: isDimmed ? 0.4 : 1,
                cursor: 'pointer', transition: 'opacity 0.2s',
              }}>
              <div style={{ color: cfg.color, fontSize: 18, lineHeight: 1, textShadow: isActive ? `0 0 12px ${cfg.glowColor}` : 'none', marginBottom: 4 }}>{cfg.symbol}</div>
              <div style={{ color: isActive ? cfg.color : DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>{cfg.label}</div>
              <div style={{ color: '#FFFFFF', fontFamily: DS.heading, fontSize: 20, fontWeight: 700, lineHeight: 1, textShadow: isActive ? `0 0 10px ${cfg.glowColor}` : 'none' }}>{countPerRank[rk]}</div>
              <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: '0.08em', marginBottom: 6 }}>thành viên</div>
              <div style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 600, opacity: 0.85 }}>{fmtLP(lpPerRank[rk])}</div>
              <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>LP earned</div>
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${cfg.color}15` }}>
                <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}</div>
              </div>
              {isActive && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
                  style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
                  layoutId="rankBar" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

// ── Section Divider ───────────────────────────────────────────────────────
const SectionDivider = memo(function SectionDivider({ label, color = DS.text5 }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${DS.border})` }} />
      <div className="flex items-center gap-2">
        <span style={{ color: DS.blue, fontSize: 8 }}>◈</span>
        <span style={{ color, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.25em' }}>{label}</span>
        <span style={{ color: DS.blue, fontSize: 8 }}>◈</span>
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DS.border}, transparent)` }} />
    </div>
  );
});

// ── Rank Legend ────────────────────────────────────────────────────────────
const RankLegend = memo(function RankLegend() {
  const rankKeys: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];
  return (
    <div className="mt-20 mb-8">
      <SectionDivider label="BẢNG XẾP HẠNG RANK" />
      <div className="flex items-stretch justify-center flex-wrap gap-3">
        {rankKeys.map(r => {
          const cfg = RANKS[r];
          return (
            <div key={r} className="flex flex-col gap-1.5 px-4 py-3 rounded-xl"
              style={{ background: DS.bgCard, border: `1px solid ${cfg.color}22`, minWidth: 100 }}>
              <div className="flex items-center gap-2">
                <span style={{ color: cfg.color, fontSize: 14, textShadow: `0 0 8px ${cfg.glowColor}` }}>{cfg.symbol}</span>
                <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', fontWeight: 700 }}>{cfg.label}</span>
              </div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}</div>
              <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>{fmtLP(cfg.lpPerLevel)} LP/cấp</div>
              <div className="h-px rounded-full mt-1" style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── CTA Banner ─────────────────────────────────────────────────────────────
const CTABanner = memo(function CTABanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden p-10 text-center mt-20"
      style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.15), rgba(129,140,248,0.1))', border: '1px solid rgba(129,140,248,0.2)' }}>
      <div style={{ position: 'absolute', top: '-30%', left: '20%', width: '60%', height: '160%', background: 'radial-gradient(ellipse, rgba(129,140,248,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.5))' }} />
          <Trophy size={14} style={{ color: DS.amber }} />
          <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, rgba(129,140,248,0.5), transparent)' }} />
        </div>
        <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900, background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
          Sẵn sàng làm việc cùng đội ngũ đỉnh cao?
        </h2>
        <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, maxWidth: 500, margin: '0 auto 28px' }}>
          Dù bạn là khách hàng hay nhân tài muốn gia nhập — LOOP Solutions luôn chào đón những người cùng chí hướng.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 0 28px rgba(129,140,248,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Đặt lịch tư vấn <ChevronRight size={15} />
          </Link>
          <Link to="/lien-he" style={{ color: DS.text3, fontSize: 14, padding: '11px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none' }}>
            Liên hệ ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────────────────────
export default function Home() {
  const [selected, setSelected]     = useState<Member | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]         = useState<SortOption>('level-desc');

  // API-loaded members — falls back to hardcoded data when offline
  const [apiMembers, setApiMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // i18n: read current locale from global store
  const { locale } = useLocaleStore();

  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    teamService.getMembers(locale)
      .then(({ members: fetched }) => {
        if (!cancelled && fetched.length > 0) {
          // Build lookup by slug (lowercase, hyphenated) → fallback Member
          const fallbackBySlug: Record<string, { id: number; missions: number; achievements: string[]; skills: Record<string, number>; missionLogs: unknown[]; rankHistory: unknown[]; currentXP: number; maxXP: number; lpSpent: number }> = {};
          fallbackMembers.forEach(m => {
            const slug = m.name.toLowerCase().replace(/\s+/g, '-');
            fallbackBySlug[slug] = m;
          });
          const merged = fetched
            .map(beMember => {
              // Match BE slug to fallback by name-derived slug
              const fb = fallbackBySlug[beMember.slug] ?? fallbackBySlug[beMember.name.toLowerCase().replace(/\s+/g, '-')];
              return mapTeamMemberToMember(beMember, { [beMember.slug]: fb ?? { id: 0, missions: 0, achievements: [], skills: {}, missionLogs: [], rankHistory: [], currentXP: 0, maxXP: 0, lpSpent: 0 } });
            })
            .filter((m): m is Member => !!m);
          if (!cancelled) setApiMembers(merged);
        }
      })
      .catch(() => { /* keep using fallback */ })
      .finally(() => { if (!cancelled) setMembersLoading(false); });
    return () => { cancelled = true; };
  }, [locale]);

  // Use API members when loaded, fall back to hardcoded data
  const members: Member[] = apiMembers.length > 0 ? apiMembers : fallbackMembers;

  // Inject guild CSS animations
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'guild-animations';
    el.textContent = GUILD_ANIMATIONS_CSS;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  // Role → category
  const getRoleCategory = (m: Member): RoleFilter => {
    const c = m.roleCode;
    if (c === 'PM') return 'PM';
    if (c === 'PO') return 'PO';
    if (c === 'CEO' || c === 'MAP') return 'CEO';
    if (c === 'SC' || c === 'SHIELD') return 'SC';
    if (c === 'HR') return 'HR';
    if (c === 'MKT') return 'MKT';
    if (c === 'DESIGNER' || c === 'STAFF') return 'DESIGNER';
    if (['BOW', 'DAGGER', 'DUAL', 'DEV_FE', 'DEV_BE', 'DEV_FS', 'QA', 'DATA'].includes(c)) return 'DEV';
    return 'all';
  };

  // Memoized filter + sort — prevents re-computation on unrelated state changes
  const filtered = useMemo(() => {
    let list = members.filter(m => {
      if (roleFilter !== 'all' && getRoleCategory(m) !== roleFilter) return false;
      if (rankFilter !== 'all' && m.rank !== rankFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.team.toLowerCase().includes(q);
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'level-desc') return b.level - a.level;
      if (sortBy === 'level-asc') return a.level - b.level;
      if (sortBy === 'rank-desc') return RANKS[b.rank].tier - RANKS[a.rank].tier;
      if (sortBy === 'rank-asc') return RANKS[a.rank].tier - RANKS[b.rank].tier;
      if (sortBy === 'team') return a.team.localeCompare(b.team);
      return 0;
    });
  }, [roleFilter, rankFilter, searchQuery, sortBy]);

  const isFiltered = roleFilter !== 'all' || rankFilter !== 'all' || !!searchQuery;
  const diamond = members.find(m => m.rank === 'diamond') ?? members[0];
  const ruby    = members.find(m => m.rank === 'ruby') ?? members[0];
  const gold    = members.find(m => m.rank === 'gold') ?? members[0];

  const row1 = filtered.slice(0, 4);
  const row2 = filtered.slice(4);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: DS.bg, fontFamily: DS.body }}>
      {/* Fixed background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.04) 0%, transparent 65%)' }} />
        <HexPattern />
      </div>

      {/* Main content — pt-0 since PublicLayout Navbar is sticky */}
      <div className="relative z-10">
        {/* ── Hero ── */}
        <HeroSection members={members} />

        <div className="max-w-7xl mx-auto px-6 pb-24">

          {/* ── Hall of Fame ── */}
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <SectionDivider label="HALL OF FAME · HUYỀN THOẠI GUILD" />
            <HallOfFame mvp={diamond} bugSlayer={ruby} topPerformer={gold} onMemberClick={setSelected} />
          </motion.div>

          {/* ── Rank Distribution ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <SectionDivider label="MA TRẬN PHÂN BỔ RANK" />
            <RankStrip members={members} active={rankFilter} onChange={setRankFilter} />
          </motion.div>

          {/* ── Controls ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>
                BỘ LỌC ĐỘI NGŨ
              </div>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DS.border}, transparent)` }} />
              {isFiltered && (
                <button onClick={() => { setRoleFilter('all'); setRankFilter('all'); setSearchQuery(''); }}
                  style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.1em' }}>
                  × XÓA BỘ LỌC
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3 mb-8">
              <RoleFilters activeFilter={roleFilter} onFilterChange={setRoleFilter} />
              <SearchSortBar
                searchQuery={searchQuery} onSearchChange={setSearchQuery}
                sortBy={sortBy} onSortChange={setSortBy}
                resultCount={filtered.length} totalCount={members.length}
              />
            </div>
          </motion.div>

          {/* ── Member Grid ── */}
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4">
                <Users size={48} style={{ color: DS.text5, opacity: 0.3 }} />
                <div style={{ color: DS.text4, fontSize: 15, fontFamily: DS.mono }}>Không tìm thấy thành viên phù hợp</div>
                <button onClick={() => { setRoleFilter('all'); setRankFilter('all'); setSearchQuery(''); }}
                  style={{ color: DS.blue, background: 'none', border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13 }}>
                  Bỏ tất cả bộ lọc
                </button>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Row 1: up to 4 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                  {row1.map((m, i) => {
                    const entranceProps = getRankEntranceProps(m.rank, i * 0.06);
                    return (
                      <motion.div key={m.id} {...entranceProps}>
                        <MemberCard member={m} onClick={setSelected} />
                      </motion.div>
                    );
                  })}
                </div>
                {/* Row 2: remaining */}
                {row2.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {row2.map((m, i) => {
                      const entranceProps = getRankEntranceProps(m.rank, (i + 4) * 0.06);
                      return (
                        <motion.div key={m.id} {...entranceProps}>
                          <MemberCard member={m} onClick={setSelected} />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Rank legend ── */}
          <RankLegend />

          {/* ── CTA ── */}
          <CTABanner />
        </div>
      </div>

      {/* ── HUD Panel (member detail overlay) ── */}
      <AnimatePresence>
        {selected && (
          <HUDPanel member={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}