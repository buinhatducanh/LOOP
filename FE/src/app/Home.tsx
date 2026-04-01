/**
 * Home.tsx — Team Page /doi-ngu
 *
 * Redesigned 2026-04-01:
 *  - SEO: JSON-LD (Organization + FAQPage + BreadcrumbList), dynamic meta,
 *         canonical, semantic HTML, OG image
 *  - Visual hierarchy: 3-tier layout (Leadership → Core Team → Operatives)
 *  - Animation: AnimatedSection scroll-reveal, holographic/combat/command effects,
 *              2 MemberCard variants (full / compact)
 *  - Components: LeadershipCommandCenter, StatsBar, TeamGrid, HallOfFame,
 *               RoleFilters, SearchSortBar, HUDPanel
 */

import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

import { members as fallbackMembers, Member, RANKS, RankKey } from './components/team/memberData';
import { HallOfFame } from './components/team/HallOfFame';
import { RoleFilters, RoleFilter } from './components/team/RoleFilters';
import { SearchSortBar, SortOption } from './components/team/SearchSortBar';
import { HUDPanel } from './components/team/HUDPanel';
import { GRD, DS } from './components/layout/ds';
import { teamService, mapTeamMemberToMember } from '../api/team.service';
import { useLocaleStore } from './store/localeStore';
import {
  buildTeamOrganizationJsonLd,
  buildTeamFAQJsonLd,
  buildTeamBreadcrumbJsonLd,
} from './structured-data/team-jsonld';
import { LeadershipCommandCenter } from './components/team/LeadershipCommandCenter';
import { StatsBar } from './components/team/StatsBar';
import { TeamGrid } from './components/team/TeamGrid';
import { Users, Zap, Trophy, ChevronRight, ArrowRight } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────
function fmtLP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Hero Section ────────────────────────────────────────────────────────
const HeroSection = memo(function HeroSection({ members }: { members: Member[] }) {
  const totalLP   = members.reduce((s, m) => s + m.lpEarned, 0);
  const totalMissions = members.reduce((s, m) => s + m.missions, 0);
  const totalAchievements = members.reduce((s, m) => s + m.achievements.length, 0);

  const kpis = [
    { label: 'Thành viên đang hoạt động', value: `${members.length}`, suffix: ' operative', color: DS.blue },
    { label: 'Tổng LP lưu thông', value: fmtLP(totalLP), suffix: ' LP', color: DS.purple },
    { label: 'Nhiệm vụ hoàn thành', value: String(totalMissions), suffix: ' ops', color: DS.cyan },
    { label: 'Thành tích guild', value: String(totalAchievements), suffix: ' trophy', color: DS.amber },
  ];

  return (
    <section className="relative pt-28 pb-24 overflow-hidden" aria-label="Giới thiệu đội ngũ">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Gradient orbs */}
      <motion.div
        style={{
          position: 'absolute', top: '-10%', left: '-8%', width: '55%', height: '55%',
          background: 'radial-gradient(circle, rgba(29,78,216,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute', top: '30%', right: '-5%', width: '45%', height: '45%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }}
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: DS.blue, boxShadow: `0 0 6px ${DS.blue}` }} />
          <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.25em' }}>
            OPERATIVE GUILD · SEASON III · Q1/2026
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: 20 }}
        >
          <span
            style={{
              display: 'block', fontSize: 'clamp(36px, 5vw, 64px)',
              fontFamily: DS.heading, fontWeight: 900,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 50%, #FFFFFF 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 6s ease infinite',
            }}
          >
            ĐỘI NGŨ TINH NHUỆ
          </span>
          <span
            style={{
              display: 'block', fontSize: 'clamp(28px, 4vw, 52px)',
              fontFamily: DS.heading, fontWeight: 900,
              background: GRD.primary,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            LOOP SOLUTIONS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 40px' }}
        >
          Mỗi thành viên là một mảnh ghép quan trọng. Cùng nhau chúng tôi xây dựng những sản phẩm kỹ
          thuật số đỉnh cao — được đo lường bằng LP, thăng hạng bằng kết quả thực tế.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <Link
            to="/dat-lich"
            style={{
              background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 700,
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
              boxShadow: '0 0 32px rgba(129,140,248,0.45)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            Làm việc cùng chúng tôi <ArrowRight size={15} />
          </Link>
          <Link
            to="/admin"
            style={{
              color: DS.text3, fontSize: 13, padding: '11px 22px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)',
            }}
          >
            <Users size={13} style={{ color: DS.text5 }} /> Admin Panel
          </Link>
        </motion.div>

        {/* KPI row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-12"
        >
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              className="rounded-2xl p-5 text-center relative overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${k.color}20`, backdropFilter: 'blur(12px)' }}
              whileHover={{ borderColor: `${k.color}50`, boxShadow: `0 0 24px ${k.color}15` }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.06, duration: 0.5 }}
            >
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(circle at 50% 0%, ${k.color}06, transparent 60%)`,
                  pointerEvents: 'none',
                }}
              />
              <div style={{
                color: k.color, fontFamily: DS.heading, fontSize: 28, fontWeight: 700,
                textShadow: `0 0 16px ${k.color}50`, lineHeight: 1,
              }}>
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

// ── Section Divider ────────────────────────────────────────────────────
const SectionDivider = memo(function SectionDivider({ label, color = DS.text5 }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
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

// ── CTA Banner ─────────────────────────────────────────────────────────
const CTABanner = memo(function CTABanner() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-10 text-center mt-20"
      style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.15), rgba(129,140,248,0.1))', border: '1px solid rgba(129,140,248,0.2)' }}
    >
      <div style={{
        position: 'absolute', top: '-30%', left: '20%', width: '60%', height: '160%',
        background: 'radial-gradient(ellipse, rgba(129,140,248,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.5))' }} />
          <Trophy size={14} style={{ color: DS.amber }} />
          <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg, rgba(129,140,248,0.5), transparent)' }} />
        </div>
        <h2 style={{
          fontFamily: DS.heading, fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900,
          background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12,
        }}>
          Sẵn sàng làm việc cùng đội ngũ đỉnh cao?
        </h2>
        <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, maxWidth: 500, margin: '0 auto 28px' }}>
          Dù bạn là khách hàng hay nhân tài muốn gia nhập — LOOP Solutions luôn chào đón những người cùng chí hướng.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/dat-lich"
            style={{
              background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 700,
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
              boxShadow: '0 0 28px rgba(129,140,248,0.4)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            Đặt lịch tư vấn <ChevronRight size={15} />
          </Link>
          <Link
            to="/lien-he"
            style={{
              color: DS.text3, fontSize: 14, padding: '11px 24px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none',
            }}
          >
            Liên hệ ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
});

// ── Rank Legend ────────────────────────────────────────────────────────
const RankLegend = memo(function RankLegend() {
  const rankKeys: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];
  return (
    <div className="mt-20 mb-8">
      <SectionDivider label="BẢNG XẾP HẠNG RANK" />
      <div className="flex items-stretch justify-center flex-wrap gap-3">
        {rankKeys.map(r => {
          const cfg = RANKS[r];
          return (
            <div
              key={r}
              className="flex flex-col gap-1.5 px-4 py-3 rounded-xl"
              style={{ background: DS.bgCard, border: `1px solid ${cfg.color}22`, minWidth: 100 }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: cfg.color, fontSize: 14, textShadow: `0 0 8px ${cfg.glowColor}` }}>
                  {cfg.symbol}
                </span>
                <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', fontWeight: 700 }}>
                  {cfg.label}
                </span>
              </div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                Lv {cfg.minLevel}–{cfg.uncapped ? `${cfg.maxLevel}+` : cfg.maxLevel}
              </div>
              <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono }}>{fmtLP(cfg.lpPerLevel)} LP/cấp</div>
              <div className="h-px rounded-full mt-1" style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────────────────
export default function Home() {
  const [selected, setSelected]     = useState<Member | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [rankFilter, setRankFilter] = useState<RankKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]         = useState<SortOption>('level-desc');

  // API-loaded members
  const [apiMembers, setApiMembers] = useState<Member[]>([]);
  const { locale } = useLocaleStore();

  useEffect(() => {
    let cancelled = false;
    teamService.getMembers(locale)
      .then(({ members: fetched }) => {
        if (!cancelled && fetched.length > 0) {
          const fallbackBySlug: Record<string, { id: number; missions: number; achievements: string[]; skills: Record<string, number>; missionLogs: unknown[]; rankHistory: unknown[]; currentXP: number; maxXP: number; lpSpent: number }> = {};
          fallbackMembers.forEach(m => {
            fallbackBySlug[m.name.toLowerCase().replace(/\s+/g, '-')] = m;
          });
          const merged = fetched
            .map(beMember => {
              const fb = fallbackBySlug[beMember.slug]
                ?? fallbackBySlug[beMember.name.toLowerCase().replace(/\s+/g, '-')];
              return mapTeamMemberToMember(beMember, { [beMember.slug]: fb ?? { id: 0, missions: 0, achievements: [], skills: {}, missionLogs: [], rankHistory: [], currentXP: 0, maxXP: 0, lpSpent: 0 } });
            })
            .filter((m): m is Member => !!m);
          if (!cancelled) setApiMembers(merged);
        }
      })
      .catch(() => { /* keep using fallback */ });
    return () => { cancelled = true; };
  }, [locale]);

  const members: Member[] = apiMembers.length > 0 ? apiMembers : fallbackMembers;

  // Inject SEO meta + JSON-LD into <head> via useEffect
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const SEO_META = {
      title: 'Đội ngũ LOOP Solutions — 27 Chuyên gia từ Iron đến Diamond',
      description:
        'Khám phá đội ngũ 27 thành viên LOOP Solutions: Product Manager, Developer, Designer, Marketing. Hệ thống rank LP từ Iron đến Diamond, minh bạch và công bằng.',
      keywords: 'đội ngũ LOOP Solutions, team LOOP, thành viên LOOP, rank system, Iron Bronze Silver Gold Platinum Ruby Diamond',
      canonical: 'https://loops.vn/doi-ngu',
    };

    // Inject/update <title>
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', SEO_META.description);
    setMeta('keywords', SEO_META.keywords);
    setMeta('robots', 'index, follow');
    setMeta('og:title', SEO_META.title, true);
    setMeta('og:description', SEO_META.description, true);
    setMeta('og:image', '/api/og?page=team&members=27', true);
    setMeta('og:url', SEO_META.canonical, true);
    setMeta('og:type', 'website', true);
    setMeta('og:locale', 'vi_VN', true);

    // Locale alternates
    ['en_US', 'ja_JP', 'ko_KR', 'zh_CN'].forEach(loc => {
      setMeta(`og:locale:alternate`, loc, true);
    });

    // Update/insert canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = SEO_META.canonical;

    // Update title
    document.title = SEO_META.title;

    // JSON-LD scripts
    const scripts = [
      { id: 'json-ld-org', json: buildTeamOrganizationJsonLd(members) },
      { id: 'json-ld-faq', json: buildTeamFAQJsonLd() },
      { id: 'json-ld-breadcrumb', json: buildTeamBreadcrumbJsonLd() },
    ];
    scripts.forEach(({ id, json }) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement('script'); el.id = id; el.type = 'application/ld+json'; document.head.appendChild(el); }
      el.textContent = JSON.stringify(json);
    });

    return () => {
      // Cleanup JSON-LD only (keep meta for other pages to reuse)
      scripts.forEach(({ id }) => { document.getElementById(id)?.remove(); });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

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

  // Memoized filter + sort
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
  }, [roleFilter, rankFilter, searchQuery, sortBy, members]);

  const isFiltered = roleFilter !== 'all' || rankFilter !== 'all' || !!searchQuery;
  const diamond = members.find(m => m.rank === 'diamond') ?? members[0];
  const ruby    = members.find(m => m.rank === 'ruby')    ?? members[0];
  const gold    = members.find(m => m.rank === 'gold')    ?? members[0];

  return (
    <>
      {/* SEO meta + JSON-LD injected via useEffect above */}

      <div className="min-h-screen relative overflow-x-hidden" style={{ background: DS.bg, fontFamily: DS.body }}>
        {/* Fixed background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.04) 0%, transparent 65%)' }} />
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {/* ── Hero ── */}
          <HeroSection members={members} />

          <div className="max-w-7xl mx-auto px-6 pb-24">

            {/* ── Hall of Fame ── */}
            <motion.article
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              aria-label="Hall of Fame — Huyền thoại Guild"
            >
              <SectionDivider label="HALL OF FAME · HUYỀN THOẠI GUILD" />
              <HallOfFame mvp={diamond} bugSlayer={ruby} topPerformer={gold} onMemberClick={setSelected} />
            </motion.article>

            {/* ── Leadership Command Center (Tier 1) ── */}
            <LeadershipCommandCenter members={members} onMemberClick={setSelected} />

            {/* ── Stats Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              aria-label="Guild Performance Stats"
            >
              <StatsBar
                members={members}
                activeFilter={rankFilter}
                onFilterChange={setRankFilter}
              />
            </motion.div>

            {/* ── Controls ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4 }}
              aria-label="Bộ lọc và tìm kiếm đội ngũ"
            >
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>
                  BỘ LỌC ĐỘI NGŨ
                </div>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DS.border}, transparent)` }} />
                {isFiltered && (
                  <button
                    onClick={() => { setRoleFilter('all'); setRankFilter('all'); setSearchQuery(''); }}
                    style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.1em' }}
                  >
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

            {/* ── Team Grid (Tier 2 + Tier 3) ── */}
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 gap-4"
                role="status"
                aria-live="polite"
              >
                <Users size={48} style={{ color: DS.text5, opacity: 0.3 }} />
                <div style={{ color: DS.text4, fontSize: 15, fontFamily: DS.mono }}>Không tìm thấy thành viên phù hợp</div>
                <button
                  onClick={() => { setRoleFilter('all'); setRankFilter('all'); setSearchQuery(''); }}
                  style={{
                    color: DS.blue, background: 'none', border: `1px solid rgba(59,130,246,0.3)`,
                    borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Bỏ tất cả bộ lọc
                </button>
              </motion.div>
            ) : (
              <TeamGrid members={filtered} onMemberClick={setSelected} />
            )}

            {/* ── Rank legend ── */}
            <RankLegend />

            {/* ── CTA ── */}
            <CTABanner />
          </div>
        </div>

        {/* ── HUD Panel ── */}
        {selected && (
          <HUDPanel member={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </>
  );
}
