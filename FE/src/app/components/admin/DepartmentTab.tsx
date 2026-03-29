/**
 * DepartmentTab — Scalable department management
 * Handles 1 → 100+ members per department gracefully
 *
 * Org chart modes:
 *   ≤ 8  members → classic tree nodes
 *   9-24 members → head + compact grid
 *   25+  members → head + role-grouped squads (collapsible)
 *
 * Member list: search · rank filter · sort · pagination (12/page)
 * Assign modal: rank filter · select-all · bulk ops
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Crown, ChevronRight, ChevronDown, ChevronUp, X, Save,
  Megaphone, Monitor, Film, Building2,
  BarChart3, UserPlus, Search,
  Plus, Layers, ArrowUpDown, CheckSquare, Square, Loader2, AlertCircle,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { members as seedMembers, RANKS, type RankKey } from '../team/memberData';
import { teamService } from '../../../api/team.service';

// ── Types ─────────────────────────────────────────────────────────────────────

// Bridge member type: BE uses CUID strings, seed uses numbers
type MemberId = string | number;

interface BridgeMember {
  id: MemberId;
  name: string;
  role: string;
  rank: RankKey;
  level: number;
  lpBalance: number;
  img: string;
}

interface DeptConfig {
  id: string;
  name: string;
  shortName: string;
  icon: typeof Megaphone;
  color: string;
  description: string;
  mission: string;
  headId: MemberId;
  memberIds: MemberId[];
  kpi: { label: string; value: string; color: string }[];
}

type SortKey = 'level' | 'name' | 'lp' | 'rank';

// ── Initial data ──────────────────────────────────────────────────────────────

const INIT_DEPTS: DeptConfig[] = [
  {
    id: 'marketing', name: 'Phòng Marketing', shortName: 'MKT',
    icon: Megaphone, color: DS.amber,
    description: 'Chiến lược thương hiệu, nội dung số, SEO/SEM và quản lý cộng đồng',
    mission: 'Xây dựng nhận diện thương hiệu LOOP và thu hút khách hàng tiềm năng',
    headId: 2,
    memberIds: [2, 8, 9, 11, 15, 19, 22],
    kpi: [
      { label: 'Chiến dịch active', value: '3', color: DS.green },
      { label: 'Reach tháng này', value: '124K', color: DS.amber },
      { label: 'Conversion rate', value: '3.2%', color: DS.blue },
      { label: 'Dự án đang làm', value: '4', color: DS.purple },
    ],
  },
  {
    id: 'it', name: 'Phòng IT', shortName: 'IT',
    icon: Monitor, color: DS.blue,
    description: 'Phát triển phần mềm, hạ tầng hệ thống, bảo mật và DevOps',
    mission: 'Đảm bảo hạ tầng kỹ thuật ổn định và phát triển sản phẩm chất lượng cao',
    headId: 3,
    memberIds: [1, 3, 4, 5, 6, 10, 13, 14, 16, 20, 23, 24, 25],
    kpi: [
      { label: 'Sprint velocity', value: '48 pts', color: DS.blue },
      { label: 'Bug fix rate', value: '94%', color: DS.green },
      { label: 'Uptime', value: '99.98%', color: DS.cyan },
      { label: 'PR merged/tháng', value: '127', color: DS.purple },
    ],
  },
  {
    id: 'media', name: 'Phòng Media', shortName: 'MDI',
    icon: Film, color: DS.purple,
    description: 'Sản xuất video, thiết kế đồ họa, photography và motion graphics',
    mission: 'Tạo ra nội dung hình ảnh chất lượng cao, phục vụ brand và client',
    headId: 7,
    memberIds: [7, 12, 17, 18, 21, 26, 27],
    kpi: [
      { label: 'Video deliveries', value: '12', color: DS.purple },
      { label: 'Design assets', value: '340+', color: DS.blue },
      { label: 'Client satisfaction', value: '4.8/5', color: DS.green },
      { label: 'Turnaround avg', value: '2.3d', color: DS.amber },
    ],
  },
];

// ── Rank order map ─────────────────────────────────────────────────────────────

const RANK_ORDER: Record<RankKey, number> = {
  diamond: 7, ruby: 6, platinum: 5, gold: 4, silver: 3, bronze: 2, iron: 1,
};

const RANK_KEYS: RankKey[] = ['diamond', 'ruby', 'platinum', 'gold', 'silver', 'bronze', 'iron'];

// ── Avatar Stack (for groups) ─────────────────────────────────────────────────

function AvatarStack({ ids, max = 5, size = 28 }: { ids: MemberId[]; max?: number; size?: number }) {
  const shown = ids.slice(0, max);
  const rest = ids.length - shown.length;
  return (
    <div className="flex items-center" style={{ gap: 0 }}>
      {shown.map((id, i) => {
        const m = seedMembers.find(x => String(x.id) === String(id));
        if (!m) return null;
        const rc = RANKS[m.rank];
        return (
          <div key={id} style={{
            width: size, height: size, borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${DS.bgCard}`,
            marginLeft: i === 0 ? 0 : -(size * 0.35),
            zIndex: shown.length - i,
            position: 'relative',
            boxShadow: `0 0 4px ${rc.glowColor}`,
          }}>
            <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        );
      })}
      {rest > 0 && (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: DS.bgCard2, border: `2px solid ${DS.border}`,
          marginLeft: -(size * 0.35),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 0, position: 'relative',
        }}>
          <span style={{ color: DS.text4, fontSize: size * 0.3, fontFamily: DS.mono, fontWeight: 700 }}>+{rest}</span>
        </div>
      )}
    </div>
  );
}

// ── Org Chart — adapts to team size ───────────────────────────────────────────

function OrgChart({ dept, members }: { dept: DeptConfig; members: BridgeMember[] }) {
  const { color, headId, memberIds } = dept;
  const head = members.find(m => String(m.id) === String(headId));
  const headRc = head ? RANKS[head.rank] : null;
  const subMembers: BridgeMember[] = memberIds
    .filter(id => String(id) !== String(headId))
    .map(id => members.find(m => String(m.id) === String(id)))
    .filter(Boolean) as BridgeMember[];

  const count = subMembers.length;

  // Group sub-members by role category
  const roleGroups = useMemo(() => {
    const groups: Record<string, BridgeMember[]> = {};
    subMembers.forEach(m => {
      const cat = m.role.includes('Dev') || m.role.includes('DevOps') || m.role.includes('QA') ? 'Dev'
        : m.role.includes('Design') || m.role.includes('UI') ? 'Design'
        : m.role.includes('Manager') || m.role.includes('PM') || m.role.includes('Lead') ? 'Lead'
        : m.role.includes('Content') || m.role.includes('SEO') || m.role.includes('Market') ? 'Marketing'
        : m.role.includes('Video') || m.role.includes('Photo') || m.role.includes('Media') ? 'Media'
        : 'Khác';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [subMembers]);

  if (!head || !headRc) return null;

  // ─ Mode A: ≤ 8 sub-members → classic individual nodes ─────────────────────
  if (count <= 8) {
    return (
      <div className="flex flex-col items-center gap-0">
        {/* Head */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            <div style={{ position: 'absolute', top: -8, right: -4, zIndex: 10 }}>
              <Crown size={14} style={{ color: DS.amber, filter: `drop-shadow(0 0 4px ${DS.amber})` }} />
            </div>
            <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${DS.amber}`, boxShadow: `0 0 18px ${DS.amber}50` }}>
              <img src={head.img} alt={head.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: DS.amber, fontSize: 11, fontWeight: 700 }}>{head.name.split(' ').slice(-1)[0]}</div>
            <div style={{ color: headRc.color, fontSize: 8, fontFamily: DS.mono }}>{headRc.symbol} {headRc.label}</div>
          </div>
        </div>

        {count > 0 && (
          <>
            <div style={{ width: 1, height: 16, background: `${color}40` }} />
            {/* Horizontal connector */}
            <div className="relative w-full" style={{ maxWidth: 520 }}>
              <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: 1, background: `${color}30` }} />
              <div className="flex flex-wrap justify-center gap-5 pt-4">
                {subMembers.map(m => {
                  const rc = RANKS[m.rank];
                  return (
                    <div key={m.id} className="flex flex-col items-center gap-1">
                      <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${rc.color}60`, boxShadow: `0 0 6px ${rc.glowColor}` }}>
                        <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ textAlign: 'center', maxWidth: 68 }}>
                        <div style={{ color: DS.text3, fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name.split(' ').slice(-1)[0]}</div>
                        <div style={{ color: rc.color, fontSize: 7, fontFamily: DS.mono }}>{rc.symbol} {rc.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─ Mode B: 9-24 sub-members → head card + scrollable compact grid ──────────
  if (count <= 24) {
    return (
      <div className="space-y-4">
        {/* Head card */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${DS.amber}08`, border: `1px solid ${DS.amber}30` }}>
          <div className="relative flex-shrink-0">
            <Crown size={12} style={{ color: DS.amber, position: 'absolute', top: -4, right: -3, zIndex: 10 }} />
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${DS.amber}`, boxShadow: `0 0 14px ${DS.amber}40` }}>
              <img src={head.img} alt={head.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <div>
            <div style={{ color: DS.amber, fontSize: 12, fontWeight: 700 }}>{head.name}</div>
            <div style={{ color: DS.text4, fontSize: 10 }}>{head.role}</div>
            <div style={{ color: headRc.color, fontSize: 8, fontFamily: DS.mono }}>{headRc.symbol} {headRc.label} Lv.{head.level}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div style={{ height: 24, width: 1, background: DS.border }} />
            <AvatarStack ids={subMembers.map(m => m.id)} max={4} size={24} />
            <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{count} nhân sự</span>
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center gap-2">
          <div style={{ width: 16, height: 1, background: `${color}30` }} />
          <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>QUẢN LÝ TRỰC TIẾP</span>
          <div style={{ flex: 1, height: 1, background: `${color}20` }} />
        </div>

        {/* Compact avatar grid */}
        <div className="grid grid-cols-4 gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
          {subMembers.map(m => {
            const rc = RANKS[m.rank];
            return (
              <div key={m.id} className="flex flex-col items-center gap-1 p-2 rounded-xl"
                style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${rc.color}60`, boxShadow: `0 0 6px ${rc.glowColor}` }}>
                  <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ color: DS.text3, fontSize: 9, fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {m.name.split(' ').slice(-1)[0]}
                </div>
                <div style={{ color: rc.color, fontSize: 7, fontFamily: DS.mono }}>{rc.symbol} Lv.{m.level}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─ Mode C: 25+ sub-members → head + role-grouped collapsible squads ─────────
  return (
    <div className="space-y-4">
      {/* Head banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${DS.amber}12, transparent)`, border: `1px solid ${DS.amber}35` }}>
        <div className="relative flex-shrink-0">
          <Crown size={14} style={{ color: DS.amber, position: 'absolute', top: -5, right: -4, zIndex: 10 }} />
          <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${DS.amber}`, boxShadow: `0 0 18px ${DS.amber}50` }}>
            <img src={head.img} alt={head.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
        <div className="flex-1">
          <div style={{ color: DS.amber, fontSize: 13, fontWeight: 700 }}>{head.name}</div>
          <div style={{ color: DS.text4, fontSize: 11 }}>{head.role} · Trưởng phòng</div>
          <div style={{ color: headRc.color, fontSize: 9, fontFamily: DS.mono, marginTop: 2 }}>{headRc.symbol} {headRc.label} Lv.{head.level}</div>
        </div>
        <div className="text-right">
          <div style={{ color: DS.text, fontSize: 18, fontFamily: DS.mono, fontWeight: 700 }}>{count}</div>
          <div style={{ color: DS.text5, fontSize: 9 }}>nhân sự</div>
        </div>
      </div>

      {/* Role squads */}
      <div className="space-y-2">
        {Object.entries(roleGroups).map(([group, gMembers]) => (
          <SquadGroup key={group} label={group} color={color} members={gMembers} />
        ))}
      </div>
    </div>
  );
}

function SquadGroup({ label, color, members: gMembers }: { label: string; color: string; members: BridgeMember[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: DS.bgCard2, border: 'none', cursor: 'pointer' }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
          <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.1em' }}>{label}</span>
          <span style={{ color: color, fontSize: 10, fontFamily: DS.mono, background: `${color}15`, border: `1px solid ${color}30`, padding: '1px 6px', borderRadius: 4 }}>{gMembers.length}</span>
        </div>
        <AvatarStack ids={gMembers.map(m => m.id)} max={5} size={22} />
        {open ? <ChevronUp size={13} style={{ color: DS.text5 }} /> : <ChevronDown size={13} style={{ color: DS.text5 }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="grid grid-cols-3 gap-1.5 p-3" style={{ background: DS.bgCard }}>
              {gMembers.map(m => {
                const rc = RANKS[m.rank];
                return (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                    style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${rc.color}50`, flexShrink: 0 }}>
                      <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="min-w-0">
                      <div style={{ color: DS.text3, fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name.split(' ').slice(-1)[0]}</div>
                      <div style={{ color: rc.color, fontSize: 7, fontFamily: DS.mono }}>{rc.symbol} Lv.{m.level}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Member List (paginated + filtered) ────────────────────────────────────────

const PAGE_SIZE = 12;

function MemberList({ dept, members }: { dept: DeptConfig; members: BridgeMember[] }) {
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState<RankKey | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('level');
  const [page, setPage] = useState(1);

  const deptMembers = useMemo<BridgeMember[]>(() =>
    dept.memberIds
      .map(id => members.find(m => String(m.id) === String(id)))
      .filter(Boolean) as BridgeMember[],
    [dept.memberIds, members]
  );

  const filtered = useMemo(() => {
    let list = deptMembers;
    if (rankFilter !== 'all') list = list.filter(m => m.rank === rankFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === 'level') sorted.sort((a, b) => b.level - a.level);
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'lp') sorted.sort((a, b) => b.lpBalance - a.lpBalance);
    else if (sort === 'rank') sorted.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
    return sorted;
  }, [deptMembers, rankFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rankCounts = useMemo(() => {
    const counts: Partial<Record<RankKey, number>> = {};
    deptMembers.forEach(m => { counts[m.rank] = (counts[m.rank] ?? 0) + 1; });
    return counts;
  }, [deptMembers]);

  // Reset page when filter changes
  const handleFilter = (r: RankKey | 'all') => { setRankFilter(r); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleSort = (s: SortKey) => { setSort(s); setPage(1); };

  return (
    <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>
            ── DANH SÁCH NHÂN SỰ
            <span style={{ color: dept.color, marginLeft: 8 }}>({filtered.length}/{deptMembers.length})</span>
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <ArrowUpDown size={11} style={{ color: DS.text5 }} />
            <select value={sort} onChange={e => handleSort(e.target.value as SortKey)}
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text4, fontSize: 11, fontFamily: DS.mono, cursor: 'pointer' }}>
              <option value="level">Cấp độ</option>
              <option value="rank">Rank</option>
              <option value="lp">LP</option>
              <option value="name">Tên</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
          <Search size={13} style={{ color: DS.text5 }} />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm theo tên, chức vụ..."
            style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, flex: 1 }} />
          {search && (
            <button onClick={() => handleSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text5, padding: 0, display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Rank filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => handleFilter('all')}
            style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: 'pointer', border: `1px solid ${rankFilter === 'all' ? dept.color : DS.border}`, background: rankFilter === 'all' ? `${dept.color}15` : 'none', color: rankFilter === 'all' ? dept.color : DS.text5 }}>
            TẤT CẢ ({deptMembers.length})
          </button>
          {RANK_KEYS.filter(r => rankCounts[r]).map(r => {
            const rc = RANKS[r];
            const active = rankFilter === r;
            return (
              <button key={r} onClick={() => handleFilter(r)}
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: 'pointer', border: `1px solid ${active ? rc.color : DS.border}`, background: active ? `${rc.color}15` : 'none', color: active ? rc.color : DS.text5, display: 'flex', alignItems: 'center', gap: 4 }}>
                {rc.symbol} {rc.label} ({rankCounts[r]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3" style={{ color: DS.text5 }}>
          <Users size={32} />
          <span style={{ fontSize: 13 }}>Không tìm thấy nhân viên phù hợp</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {paginated.map(m => {
            const rc = RANKS[m.rank];
            const isHead = m.id === dept.headId;
            return (
              <motion.div key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: isHead ? `${DS.amber}06` : DS.bgCard2, border: `1px solid ${isHead ? DS.amber + '35' : DS.border}` }}
                whileHover={{ borderColor: rc.color + '50', x: 2 }}>
                <div className="relative flex-shrink-0">
                  {isHead && <Crown size={10} style={{ color: DS.amber, position: 'absolute', top: -4, right: -3, zIndex: 10 }} />}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${isHead ? DS.amber : rc.color + '50'}` }}>
                    <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: DS.text2, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                    {isHead && <span style={{ color: DS.amber, fontSize: 7, fontFamily: DS.mono, border: `1px solid ${DS.amber}30`, padding: '1px 4px', borderRadius: 3, background: `${DS.amber}10`, flexShrink: 0 }}>TRƯỞNG</span>}
                  </div>
                  <div style={{ color: DS.text5, fontSize: 10 }}>{m.role}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label}</span>
                  <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Lv.{m.level}</span>
                  <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{(m.lpBalance / 1000).toFixed(1)}K LP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1px solid ${DS.border}` }}>
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '5px 12px', borderRadius: 8, background: 'none', border: `1px solid ${DS.border}`, color: page === 1 ? DS.text5 : DS.text3, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>
              ‹ Trước
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Smart pagination: show first, last, and pages around current
              let pageNum: number | null;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (i === 0) {
                pageNum = 1;
              } else if (i === 6) {
                pageNum = totalPages;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                const offsets = [null, -2, -1, 0, 1, 2, null];
                const off = offsets[i];
                pageNum = off === null ? null : page + off;
              }
              if (pageNum === null) {
                return <span key={i} style={{ color: DS.text5, fontSize: 11, padding: '0 2px' }}>…</span>;
              }
              return (
                <button key={i} onClick={() => setPage(pageNum!)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${page === pageNum ? dept.color : DS.border}`, background: page === pageNum ? `${dept.color}15` : 'none', color: page === pageNum ? dept.color : DS.text4, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono }}>
                  {pageNum}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '5px 12px', borderRadius: 8, background: 'none', border: `1px solid ${DS.border}`, color: page === totalPages ? DS.text5 : DS.text3, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>
              Sau ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Assign Modal — scalable, rank-filtered ────────────────────────────────────

function AssignModal({
  dept, members, onClose, onSave,
}: {
  dept: DeptConfig;
  members: BridgeMember[];
  onClose: () => void;
  onSave: (ids: MemberId[], headId: MemberId) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<MemberId[]>(dept.memberIds);
  const [headId, setHeadId] = useState<MemberId>(dept.headId);
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState<RankKey | 'all'>('all');

  const toggleId = (id: MemberId) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // Head must be in selected
      if (!next.includes(headId)) setHeadId(next[0] ?? id);
      return next;
    });
  };

  const filteredAll = useMemo(() => {
    let list = [...members];
    if (rankFilter !== 'all') list = list.filter(m => m.rank === rankFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    return list.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
  }, [rankFilter, search]);

  const selectAll = () => setSelectedIds(prev => {
    const toAdd = filteredAll.map(m => m.id).filter(id => !prev.includes(id));
    return [...prev, ...toAdd];
  });
  const deselectAll = () => setSelectedIds(prev => prev.filter(id => !filteredAll.some(m => m.id === id)));
  const allSelected = filteredAll.every(m => selectedIds.includes(m.id));

  const rankCounts: Partial<Record<RankKey, number>> = {};
  members.forEach(m => { rankCounts[m.rank] = (rankCounts[m.rank] ?? 0) + 1; });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.90)', backdropFilter: 'blur(10px)' }} />
      <motion.div className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${dept.color}30`, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── PHÂN CÔNG NHÂN SỰ</div>
            <div style={{ color: dept.color, fontSize: 15, fontWeight: 700, marginTop: 2 }}>{dept.name}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full" style={{ background: `${dept.color}15`, border: `1px solid ${dept.color}30` }}>
              <span style={{ color: dept.color, fontFamily: DS.mono, fontSize: 12, fontWeight: 700 }}>{selectedIds.length} đã chọn</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Trưởng phòng */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 8, letterSpacing: '0.12em' }}>
              TRƯỞNG PHÒNG (chọn từ danh sách đã chọn)
            </label>
            <select value={headId} onChange={e => setHeadId(Number(e.target.value))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${dept.color}40`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none' }}>
              {selectedIds.map(id => {
                const m = members.find(x => String(x.id) === String(id));
                if (!m) return null;
                const rc = RANKS[m.rank];
                return <option key={String(id)} value={String(id)}>{rc.symbol} {m.name} — {m.role} (Lv.{m.level})</option>;
              })}
            </select>
          </div>

          {/* Search + rank filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <Search size={13} style={{ color: DS.text5 }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Tìm trong ${members.length} thành viên...`}
                style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, flex: 1 }} />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text5, padding: 0, display: 'flex' }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Rank filter row */}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setRankFilter('all')}
                style={{ padding: '2px 9px', borderRadius: 20, fontSize: 9, fontFamily: DS.mono, cursor: 'pointer', border: `1px solid ${rankFilter === 'all' ? dept.color : DS.border}`, background: rankFilter === 'all' ? `${dept.color}15` : 'none', color: rankFilter === 'all' ? dept.color : DS.text5 }}>
                TẤT CẢ
              </button>
              {RANK_KEYS.filter(r => rankCounts[r]).map(r => {
                const rc = RANKS[r];
                const active = rankFilter === r;
                const selCount = selectedIds.filter(id => members.find(m => String(m.id) === String(id))?.rank === r).length;
                return (
                  <button key={r} onClick={() => setRankFilter(active ? 'all' : r)}
                    style={{ padding: '2px 9px', borderRadius: 20, fontSize: 9, fontFamily: DS.mono, cursor: 'pointer', border: `1px solid ${active ? rc.color : DS.border}`, background: active ? `${rc.color}15` : 'none', color: active ? rc.color : DS.text5 }}>
                    {rc.symbol} {rc.label} {selCount > 0 && `(${selCount})`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bulk actions + count */}
          <div className="flex items-center justify-between">
            <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
              Hiển thị {filteredAll.length} / {members.length} thành viên
            </span>
            <button onClick={() => allSelected ? deselectAll() : selectAll()}
              className="flex items-center gap-1.5"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: allSelected ? DS.red : dept.color, fontSize: 11, fontFamily: DS.mono }}>
              {allSelected ? <Square size={13} /> : <CheckSquare size={13} />}
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          {/* Member grid — 3 cols, compact */}
          <div className="grid grid-cols-1 gap-1.5">
            {filteredAll.map(m => {
              const rc = RANKS[m.rank];
              const sel = selectedIds.includes(m.id);
              const isHead = headId === m.id;
              return (
                <div key={m.id} onClick={() => toggleId(m.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                  style={{ background: sel ? `${rc.color}08` : 'rgba(255,255,255,0.01)', border: `1px solid ${sel ? rc.color + '35' : DS.border}`, transition: 'all 0.15s' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${rc.color}${sel ? '80' : '25'}`, flexShrink: 0 }}>
                    <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: sel ? DS.text : DS.text3, fontSize: 12, fontWeight: sel ? 600 : 400 }}>{m.name}</span>
                      {isHead && <Crown size={9} style={{ color: DS.amber, flexShrink: 0 }} />}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>{m.role}</div>
                  </div>
                  <div style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono, flexShrink: 0 }}>{rc.symbol} {rc.label}</div>
                  {/* Checkbox */}
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? dept.color : DS.border}`, background: sel ? dept.color : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {sel && <div style={{ width: 8, height: 6, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg) translate(1px,-1px)' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, cursor: 'pointer', fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={() => { onSave(selectedIds, headId); onClose(); }}
            style={{ flex: 2, background: selectedIds.length === 0 ? DS.bgCard2 : GRD.primary, color: selectedIds.length === 0 ? DS.text5 : '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: selectedIds.length === 0 ? 'default' : 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={14} /> Lưu phân công ({selectedIds.length})
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Dept Detail ───────────────────────────────────────────────────────────────

function DeptDetail({ dept, members, onAssign }: { dept: DeptConfig; members: BridgeMember[]; onAssign: () => void }) {
  const head = members.find(m => String(m.id) === String(dept.headId));
  const headRank = head ? RANKS[head.rank] : null;
  const deptMembers = dept.memberIds.map(id => members.find(m => String(m.id) === String(id))).filter(Boolean) as BridgeMember[];
  const avgLevel = deptMembers.length > 0 ? Math.round(deptMembers.reduce((s, m) => s + m.level, 0) / deptMembers.length) : 0;
  const totalLP = deptMembers.reduce((s, m) => s + m.lpBalance, 0);
  const DeptIcon = dept.icon;

  // Rank distribution
  const rankDist = useMemo(() => {
    const dist: Partial<Record<RankKey, number>> = {};
    deptMembers.forEach(m => { dist[m.rank] = (dist[m.rank] ?? 0) + 1; });
    return dist;
  }, [deptMembers]);

  const maxRankCount = Math.max(...Object.values(rankDist).map(v => v ?? 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${dept.color}30` }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${dept.color}08, transparent 55%)`, pointerEvents: 'none' }} />
        <div className="flex items-start justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${dept.color}15`, border: `1px solid ${dept.color}40` }}>
              <DeptIcon size={24} style={{ color: dept.color }} />
            </div>
            <div>
              <div style={{ color: dept.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── PHÒNG BAN</div>
              <div style={{ color: DS.text, fontSize: 18, fontWeight: 700 }}>{dept.name}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{dept.description}</div>
            </div>
          </div>
          <button onClick={onAssign}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0"
            style={{ background: `${dept.color}12`, border: `1px solid ${dept.color}30`, color: dept.color, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            <UserPlus size={13} /> Phân công
          </button>
        </div>
        <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${DS.border}` }}>
          <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>SỨ MỆNH: </span>
          <span style={{ color: DS.text3, fontSize: 12, fontStyle: 'italic' }}>{dept.mission}</span>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {dept.kpi.map(k => (
          <div key={k.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: k.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{k.value}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Org chart + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── SƠ ĐỒ TỔ CHỨC</div>
            <div className="flex items-center gap-1.5">
              <Layers size={11} style={{ color: DS.text5 }} />
              <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                {deptMembers.length <= 8 ? 'Tree' : deptMembers.length <= 24 ? 'Grid' : 'Squads'} mode
              </span>
            </div>
          </div>
          <OrgChart dept={dept} members={members} />
        </div>

        {/* Stats sidebar */}
        <div className="space-y-3">
          {/* Head info */}
          {head && headRank && (
            <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.amber}25` }}>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>TRƯỞNG PHÒNG</div>
              <div className="flex items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${DS.amber}`, boxShadow: `0 0 10px ${DS.amber}40` }}>
                  <img src={head.img} alt={head.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ color: DS.amber, fontSize: 13, fontWeight: 700 }}>{head.name}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{head.role}</div>
                  <div style={{ color: headRank.color, fontSize: 9, fontFamily: DS.mono }}>{headRank.symbol} {headRank.label} Lv.{head.level}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                <div className="flex-1 text-center">
                  <div style={{ color: DS.amber, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{head.level}</div>
                  <div style={{ color: DS.text5, fontSize: 9 }}>Cấp độ</div>
                </div>
                <div className="flex-1 text-center">
                  <div style={{ color: DS.green, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{(head.lpBalance / 1000).toFixed(0)}K</div>
                  <div style={{ color: DS.text5, fontSize: 9 }}>LP Balance</div>
                </div>
              </div>
            </div>
          )}

          {/* Team stats */}
          <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>THỐNG KÊ PHÒNG</div>
            {[
              { label: 'Tổng nhân sự', value: deptMembers.length, color: DS.text3 },
              { label: 'Cấp độ trung bình', value: `Lv.${avgLevel}`, color: dept.color },
              { label: 'Tổng LP đã kiếm', value: `${(totalLP / 1000).toFixed(0)}K`, color: DS.purple },
            ].map(s => (
              <div key={s.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text4, fontSize: 12 }}>{s.label}</span>
                <span style={{ color: s.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Rank distribution mini bar chart */}
          <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>PHÂN BỐ RANK</div>
            <div className="space-y-2">
              {RANK_KEYS.filter(r => rankDist[r]).map(r => {
                const rc = RANKS[r];
                const count = rankDist[r] ?? 0;
                const pct = (count / maxRankCount) * 100;
                return (
                  <div key={r} className="flex items-center gap-2">
                    <span style={{ color: rc.color, fontSize: 8, fontFamily: DS.mono, width: 52, flexShrink: 0 }}>{rc.symbol} {rc.label}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: DS.border }}>
                      <motion.div style={{ height: '100%', background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 3 }}
                        initial={{ width: '0%' }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }} />
                    </div>
                    <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, width: 14, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Member list — paginated */}
      <MemberList dept={dept} members={members} />
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DepartmentTab() {
  const [depts, setDepts] = useState<DeptConfig[]>(INIT_DEPTS);
  const [selectedId, setSelectedId] = useState('it');
  const [assignDept, setAssignDept] = useState<DeptConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Bridge members state: BE data takes priority, seed as fallback
  const [members, setMembers] = useState<BridgeMember[]>(
    seedMembers.map(m => ({ id: m.id, name: m.name, role: m.role, rank: m.rank, level: m.level, lpBalance: m.lpBalance, img: m.img }))
  );

  // ── Fetch BE members ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    teamService.getAdminMembers({ limit: 200 })
      .then(({ members: be }) => {
        if (cancelled) return;
        if (!be.length) return;
        const beMap = new Map<string, BridgeMember>();
        be.forEach(m => beMap.set(m.id, {
          id: m.id,
          name: m.name,
          role: m.role ?? 'Thành viên',
          rank: (m.rank ?? 'iron') as RankKey,
          level: m.level,
          lpBalance: m.lpBalance,
          img: m.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`,
        }));
        // Merge: start from seed, overlay BE data where available
        setMembers(prev => prev.map(sm => {
          const beM = beMap.get(String(sm.id));
          return beM ?? sm;
        }));
      })
      .catch(() => { if (!cancelled) setLoadError('Không tải được danh sách thành viên'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selected = depts.find(d => d.id === selectedId)!;
  const totalMembers = [...new Set(depts.flatMap(d => d.memberIds))].length;
  const avgMembers = Math.round(depts.reduce((s, d) => s + d.memberIds.length, 0) / depts.length);

  return (
    <div className="space-y-6">
      {/* Top KPI */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng phòng ban', value: depts.length, color: DS.blue, icon: <Building2 size={18} /> },
          { label: 'Tổng nhân sự', value: totalMembers, color: DS.green, icon: <Users size={18} /> },
          { label: 'TB nhân sự/phòng', value: avgMembers, color: DS.amber, icon: <BarChart3 size={18} /> },
          { label: 'Trưởng phòng', value: depts.length, color: DS.purple, icon: <Crown size={18} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Loader2 size={18} className="animate-spin" style={{ color: DS.purple }} />
          <span style={{ color: DS.text4, fontSize: 12 }}>Đang tải dữ liệu thành viên...</span>
        </div>
      )}
      {loadError && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `${DS.red}10`, border: `1px solid ${DS.red}30` }}>
          <AlertCircle size={14} style={{ color: DS.red }} />
          <span style={{ color: DS.red, fontSize: 12 }}>{loadError}</span>
        </div>
      )}

      {/* Dept selector + detail */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5" style={{ alignItems: 'start' }}>
        {/* Left: dept list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── PHÒNG BAN</div>
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: DS.blue, fontSize: 10, fontFamily: DS.mono, cursor: 'pointer' }}>
              <Plus size={11} /> Thêm
            </button>
          </div>
          {depts.map(d => {
            const DIcon = d.icon;
            const isSelected = selectedId === d.id;
            const head = members.find(m => String(m.id) === String(d.headId));
            const headRank = head ? RANKS[head.rank] : null;
            return (
              <motion.div key={d.id} onClick={() => setSelectedId(d.id)}
                className="p-4 rounded-2xl cursor-pointer"
                style={{ background: DS.bgCard, border: `1px solid ${isSelected ? d.color + '50' : DS.border}`, boxShadow: isSelected ? `0 0 20px ${d.color}10` : 'none' }}
                whileHover={{ borderColor: d.color + '35' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${d.color}15`, border: `1px solid ${d.color}30` }}>
                    <DIcon size={18} style={{ color: d.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ color: d.color, fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{d.memberIds.length} nhân sự</div>
                  </div>
                  {isSelected && <ChevronRight size={14} style={{ color: d.color, flexShrink: 0 }} />}
                </div>

                {/* Avatar stack preview */}
                <div className="flex items-center gap-2 mb-2">
                  <AvatarStack ids={d.memberIds.filter(id => id !== d.headId)} max={4} size={22} />
                </div>

                {head && headRank && (
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${headRank.color}40` }}>
                      <img src={head.img} alt={head.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ color: DS.text5, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{head.name}</span>
                    <Crown size={9} style={{ color: DS.amber, flexShrink: 0 }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Right: detail */}
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            <DeptDetail key={selectedId} dept={selected} members={members} onAssign={() => setAssignDept(selected)} />
          </AnimatePresence>
        </div>
      </div>

      {/* Assign modal */}
      <AnimatePresence>
        {assignDept && (
          <AssignModal
            dept={assignDept}
            members={members}
            onClose={() => setAssignDept(null)}
            onSave={(ids, headId) => {
              setDepts(prev => prev.map(d => d.id === assignDept.id ? { ...d, memberIds: ids, headId } : d));
              setAssignDept(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}