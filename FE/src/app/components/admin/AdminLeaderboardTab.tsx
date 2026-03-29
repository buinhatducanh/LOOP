/**
 * AdminLeaderboardTab — Tab "Leaderboard quản trị" trong Admin Dashboard
 * Cho phép admin xem, điều chỉnh LP, thưởng/phạt thủ công cho từng thành viên
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Zap, Plus, Minus, Search, Filter, ChevronUp,
  ChevronDown, Save, X, Award, TrendingUp, Users, RotateCcw,
  Check, AlertTriangle, Loader2,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { members as seedMembers, RANKS, type RankKey } from '../team/memberData';
import { teamService } from '../../../api/team.service';
import { lpService } from '../../../api/lp.service';

const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : String(n);

type AdjustType = 'bonus' | 'penalty' | 'event' | 'manual';

interface LPAdjustment {
  memberId: string;
  memberName: string;
  amount: number;
  type: AdjustType;
  reason: string;
  timestamp: number;
}

interface LocalMember {
  id: string; // BE CUID string
  seedId: number; // Fallback seed numeric id
  name: string;
  rank: RankKey;
  level: number;
  lpBalance: number;
  img: string;
  role: string;
  team: string;
  missions: number;
  delta: number; // pending LP change
}

const TYPE_CFG: Record<AdjustType, { label: string; color: string; icon: React.ReactNode }> = {
  bonus:   { label: 'Thưởng',   color: DS.green,  icon: <Plus size={12} /> },
  penalty: { label: 'Phạt',     color: DS.red,    icon: <Minus size={12} /> },
  event:   { label: 'Sự kiện',  color: DS.purple, icon: <Award size={12} /> },
  manual:  { label: 'Điều chỉnh', color: DS.blue, icon: <Zap size={12} /> },
};

const PRESET_REASONS = [
  'Hoàn thành dự án xuất sắc', 'Vượt KPI tháng', 'Tham gia sự kiện công ty',
  'Góp ý cải tiến quy trình', 'Vi phạm deadline', 'Bù đắp lỗi LP hệ thống',
  'Hackathon Internal Q1', 'Streak 30 ngày', 'Review 5 sao từ KH',
];

export function AdminLeaderboardTab() {
  // ── BE state ──────────────────────────────────────────────────────
  const [beMembers, setBeMembers] = useState<LocalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [localMembers, setLocalMembers] = useState<LocalMember[]>([]);
  const [search, setSearch] = useState('');
  const [filterRank, setFilterRank] = useState<RankKey | 'all'>('all');
  const [filterTeam, setFilterTeam] = useState<'all' | 'Alpha' | 'Sigma' | 'Omega'>('all');
  const [sortBy, setSortBy] = useState<'lp' | 'level' | 'missions'>('lp');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<AdjustType>('bonus');
  const [adjustReason, setAdjustReason] = useState('');
  const [history, setHistory] = useState<LPAdjustment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Fetch BE members ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    teamService.getAdminMembers({ limit: 100 })
      .then(({ members: be }) => {
        if (cancelled) return;
        // Map BE members → LocalMember
        const mapped: LocalMember[] = be.map(m => {
          // Find matching seed member by name for numeric id
          const seed = seedMembers.find(sm => sm.name === m.name);
          const rk = (m.rank ?? 'iron') as RankKey;
          const rc = RANKS[rk] ?? RANKS.iron;
          return {
            id: m.id, // BE CUID
            seedId: seed?.id ?? 0, // fallback seed id
            name: m.name,
            rank: rk,
            level: m.level,
            lpBalance: m.lpBalance,
            img: m.image ?? seed?.img ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`,
            role: m.role,
            team: (m.department ?? 'engineering') as LocalMember['team'],
            missions: seed?.missions ?? 0,
            delta: 0,
          };
        });
        // Sort by LP desc
        mapped.sort((a, b) => b.lpBalance - a.lpBalance);
        setBeMembers(mapped);
        setLocalMembers(mapped);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Không tải được danh sách thành viên');
        // Fallback to seed members
        const fallback: LocalMember[] = seedMembers.map(m => ({
          id: String(m.id),
          seedId: m.id,
          name: m.name,
          rank: m.rank,
          level: m.level,
          lpBalance: m.lpBalance,
          img: m.img,
          role: m.role,
          team: m.team as LocalMember['team'],
          missions: m.missions,
          delta: 0,
        }));
        fallback.sort((a, b) => b.lpBalance - a.lpBalance);
        setLocalMembers(fallback);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayMembers = useMemo(() => {
    return beMembers.length > 0 ? beMembers : localMembers;
  }, [beMembers, localMembers]);

  const totalLP = displayMembers.reduce((s, m) => s + m.lpBalance, 0);
  const pendingChanges = localMembers.filter(m => m.delta !== 0).length;
  const rankKeys: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];

  const filtered = localMembers
    .filter(m => {
      const matchSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase());
      const matchRank = filterRank === 'all' || m.rank === filterRank;
      const matchTeam = filterTeam === 'all' || m.team === filterTeam;
      return matchSearch && matchRank && matchTeam;
    })
    .sort((a, b) => {
      if (sortBy === 'lp') return (b.lpBalance + b.delta) - (a.lpBalance + a.delta);
      if (sortBy === 'level') return b.level - a.level;
      return b.missions - a.missions;
    });

  const applyAdjustment = (id: string) => {
    const amount = parseInt(adjustAmount);
    if (!amount || !adjustReason.trim()) return;
    const signed = adjustType === 'penalty' ? -Math.abs(amount) : Math.abs(amount);
    const member = localMembers.find(m => m.id === id);
    if (!member) return;

    setLocalMembers(prev => prev.map(m =>
      m.id === id ? { ...m, delta: m.delta + signed } : m
    ));
    // Optimistic: also update beMembers for display consistency
    setBeMembers(prev => prev.map(m => m.id === id ? { ...m, lpBalance: m.lpBalance + signed } : m));
    setHistory(prev => [{
      memberId: id,
      memberName: member.name,
      amount: signed,
      type: adjustType,
      reason: adjustReason,
      timestamp: Date.now(),
    }, ...prev]);

    setEditingId(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  const applyBulk = () => {
    const amount = parseInt(bulkAmount);
    if (!amount || !bulkReason.trim() || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setLocalMembers(prev => prev.map(m =>
      ids.includes(m.id) ? { ...m, delta: m.delta + amount } : m
    ));
    setBeMembers(prev => prev.map(m =>
      ids.includes(m.id) ? { ...m, lpBalance: m.lpBalance + amount } : m
    ));
    ids.forEach(id => {
      const member = localMembers.find(m => m.id === id);
      if (!member) return;
      setHistory(prev => [{
        memberId: id,
        memberName: member.name,
        amount,
        type: 'event',
        reason: bulkReason,
        timestamp: Date.now(),
      }, ...prev]);
    });
    setSelectedIds(new Set());
    setBulkAmount('');
    setBulkReason('');
  };

  const resetDelta = (id: string) => {
    const member = localMembers.find(m => m.id === id);
    const oldDelta = member?.delta ?? 0;
    setLocalMembers(prev => prev.map(m => m.id === id ? { ...m, delta: 0 } : m));
    setBeMembers(prev => prev.map(m => m.id === id ? { ...m, lpBalance: m.lpBalance - oldDelta } : m));
  };

  const commitAll = () => {
    // Collect all pending deltas
    const changes = localMembers.filter(m => m.delta !== 0);
    // Apply locally
    setLocalMembers(prev => prev.map(m => ({ ...m, lpBalance: m.lpBalance + m.delta, delta: 0 })));
    setBeMembers(prev => prev.map(m => {
      const change = changes.find(c => c.id === m.id);
      return change ? { ...m, lpBalance: m.lpBalance + change.delta } : m;
    }));
    // Sync to BE: award LP for each positive delta
    changes.forEach(m => {
      if (m.delta > 0) {
        lpService.awardLp({
          memberId: Number(m.seedId) || 0,
          amount: m.delta,
          source: 'manual',
          reason: 'Điều chỉnh LP thủ công',
        }).catch(() => {/* silently ignore — already applied optimistically */});
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header stats */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Loader2 size={14} className="animate-spin" style={{ color: DS.blue }} />
          <span style={{ color: DS.text4, fontSize: 12 }}>Đang tải danh sách LP thành viên...</span>
        </div>
      )}
      {loadError && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={14} style={{ color: DS.red }} />
          <span style={{ color: DS.red, fontSize: 12 }}>{loadError}</span>
        </div>
      )}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Tổng thành viên', value: String(displayMembers.length), color: DS.blue, icon: <Users size={15} /> },
          { label: 'Tổng LP hệ thống', value: fmtLP(totalLP), color: DS.purple, icon: <Zap size={15} /> },
          { label: 'LP chờ duyệt', value: `${pendingChanges} người`, color: DS.amber, icon: <AlertTriangle size={15} /> },
          { label: 'Lịch sử điều chỉnh', value: String(history.length), color: DS.green, icon: <TrendingUp size={15} /> },
        ].map(s => (
          <motion.div key={s.label} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 3 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Bulk action panel */}
      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)' }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>
            ── THƯỞNG/PHẠT ĐỒNG LOẠT · {selectedIds.size} THÀNH VIÊN ĐÃ CHỌN
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>SỐ LP</div>
              <input type="number" value={bulkAmount} onChange={e => setBulkAmount(e.target.value)}
                placeholder="VD: 500"
                style={{ width: 120, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none', fontFamily: DS.mono }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>LÝ DO</div>
              <input type="text" value={bulkReason} onChange={e => setBulkReason(e.target.value)}
                placeholder="Lý do điều chỉnh..."
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none' }} />
            </div>
            <button onClick={applyBulk}
              style={{ padding: '9px 18px', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Zap size={13} /> Áp dụng
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              style={{ padding: '9px 14px', background: 'transparent', color: DS.text4, border: `1px solid ${DS.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 12 }}>
              Bỏ chọn
            </button>
          </div>
        </motion.div>
      )}

      {/* Pending commit bar */}
      {pendingChanges > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} style={{ color: DS.amber }} />
            <span style={{ color: DS.amber, fontSize: 13, fontWeight: 700 }}>
              {pendingChanges} thành viên có thay đổi LP chưa lưu
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLocalMembers(prev => prev.map(m => ({ ...m, delta: 0 })))}
              style={{ padding: '8px 16px', background: 'transparent', color: DS.text4, border: `1px solid ${DS.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RotateCcw size={12} /> Hoàn tác tất cả
            </button>
            <button onClick={commitAll}
              style={{ padding: '8px 18px', background: saved ? `${DS.green}15` : GRD.primary, color: saved ? DS.green : '#fff', border: saved ? `1px solid ${DS.green}30` : 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              {saved ? <><Check size={12} /> Đã lưu!</> : <><Save size={12} /> Lưu tất cả</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 px-4 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, height: 40 }}>
          <Search size={14} style={{ color: DS.text4 }} />
          <input type="text" placeholder="Tìm thành viên..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 13 }} />
        </div>

        {/* Rank filter */}
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterRank('all')}
            style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${filterRank === 'all' ? DS.blue : DS.border}`, background: filterRank === 'all' ? 'rgba(59,130,246,0.12)' : 'transparent', color: filterRank === 'all' ? DS.blue : DS.text4, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, transition: 'all 0.15s' }}>
            Tất cả
          </button>
          {rankKeys.map(rk => {
            const rc = RANKS[rk];
            return (
              <button key={rk} onClick={() => setFilterRank(filterRank === rk ? 'all' : rk)}
                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${filterRank === rk ? rc.color : DS.border}`, background: filterRank === rk ? `${rc.color}12` : 'transparent', color: filterRank === rk ? rc.color : DS.text4, cursor: 'pointer', fontSize: 10, fontFamily: DS.mono, transition: 'all 0.15s' }}>
                {rc.symbol} {rc.label.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* Team filter */}
        <div className="flex gap-1">
          {(['all', 'Alpha', 'Sigma', 'Omega'] as const).map(t => (
            <button key={t} onClick={() => setFilterTeam(t)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${filterTeam === t ? DS.purple : DS.border}`, background: filterTeam === t ? 'rgba(129,140,248,0.1)' : 'transparent', color: filterTeam === t ? DS.purple : DS.text4, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, transition: 'all 0.15s' }}>
              {t === 'all' ? 'Nhóm' : t}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1">
          {([['lp', 'LP'], ['level', 'Level'], ['missions', 'Tasks']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${sortBy === key ? DS.cyan : DS.border}`, background: sortBy === key ? 'rgba(20,184,166,0.1)' : 'transparent', color: sortBy === key ? DS.cyan : DS.text4, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* History toggle */}
        <button onClick={() => setShowHistory(v => !v)}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${showHistory ? DS.amber : DS.border}`, background: showHistory ? 'rgba(245,158,11,0.08)' : 'transparent', color: showHistory ? DS.amber : DS.text4, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 5 }}>
          <TrendingUp size={12} /> Lịch sử ({history.length})
        </button>
      </div>

      {/* History panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── LỊCH SỬ ĐIỀU CHỈNH LP · PHIÊN NÀY</div>
            {history.length === 0 ? (
              <div style={{ color: DS.text5, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Chưa có điều chỉnh nào trong phiên này</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((h, i) => {
                  const tc = TYPE_CFG[h.type];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${tc.color}15`, border: `1px solid ${tc.color}25` }}>
                        <span style={{ color: tc.color }}>{tc.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ color: DS.text2, fontSize: 12, fontWeight: 600 }}>{h.memberName}</div>
                        <div style={{ color: DS.text5, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.reason}</div>
                      </div>
                      <div style={{ color: h.amount >= 0 ? DS.green : DS.red, fontFamily: DS.mono, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {h.amount >= 0 ? '+' : ''}{h.amount.toLocaleString()} LP
                      </div>
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, flexShrink: 0 }}>
                        {new Date(h.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main leaderboard table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ background: DS.bgCard, borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>
            ── BẢNG LP QUẢN TRỊ · {filtered.length} / {displayMembers.length} THÀNH VIÊN
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <span style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono }}>{selectedIds.size} đã chọn</span>
            )}
            <Trophy size={13} style={{ color: DS.amber }} />
          </div>
        </div>

        <div className="p-3 space-y-1.5" style={{ background: DS.bgCard }}>
          {filtered.map((m, i) => {
            const rc = RANKS[m.rank];
            const globalRank = localMembers
              .sort((a, b) => (b.lpBalance + b.delta) - (a.lpBalance + a.delta))
              .findIndex(mm => mm.id === m.id) + 1;
            const isEditing = editingId === m.id;
            const isSelected = selectedIds.has(m.id);
            const effectiveLP = m.lpBalance + m.delta;
            const hasDelta = m.delta !== 0;

            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${isEditing ? DS.blue + '40' : isSelected ? DS.purple + '40' : hasDelta ? DS.amber + '30' : DS.border}` }}>
                {/* Main row */}
                <div className="flex items-center gap-3 p-3 cursor-pointer"
                  style={{ background: isEditing ? 'rgba(59,130,246,0.05)' : isSelected ? 'rgba(129,140,248,0.05)' : DS.bgCard2 }}
                  onClick={() => !isEditing && toggleSelect(m.id)}>
                  {/* Checkbox */}
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ border: `1.5px solid ${isSelected ? DS.purple : DS.border}`, background: isSelected ? DS.purple : 'transparent', cursor: 'pointer' }}>
                    {isSelected && <Check size={11} color="#fff" />}
                  </div>

                  {/* Rank badge */}
                  <div className="w-8 text-center flex-shrink-0">
                    {globalRank <= 3 ? (
                      <span style={{ fontSize: 15 }}>{['', '🥇', '🥈', '🥉'][globalRank]}</span>
                    ) : (
                      <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>#{globalRank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: `1.5px solid ${rc.color}60`, boxShadow: `0 0 6px ${rc.glowColor}30` }}>
                    <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{m.name}</span>
                      <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono, background: `${rc.color}12`, border: `1px solid ${rc.color}25`, padding: '1px 6px', borderRadius: 20 }}>
                        {rc.symbol} {rc.label} · Lv.{m.level}
                      </span>
                      <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{m.role} · {m.team}</span>
                    </div>
                    {/* Mini LP bar */}
                    <div className="rounded-full overflow-hidden hidden md:block" style={{ height: 3, background: DS.border, maxWidth: 200 }}>
                      <div style={{ height: '100%', width: `${Math.min((effectiveLP / 180000) * 100, 100)}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }} />
                    </div>
                  </div>

                  {/* LP value + delta */}
                  <div className="text-right flex-shrink-0">
                    <div style={{ color: rc.color, fontFamily: DS.mono, fontSize: 14, fontWeight: 900, textShadow: `0 0 8px ${rc.glowColor}50` }}>
                      {fmtLP(effectiveLP)}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LP · {m.missions} tasks</div>
                    {hasDelta && (
                      <div style={{ color: m.delta >= 0 ? DS.green : DS.red, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, marginTop: 1 }}>
                        {m.delta >= 0 ? '+' : ''}{m.delta.toLocaleString()} pending
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {hasDelta && (
                      <button onClick={() => resetDelta(m.id)}
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 8, cursor: 'pointer', color: DS.red }}>
                        <RotateCcw size={12} />
                      </button>
                    )}
                    <button onClick={() => setEditingId(isEditing ? null : m.id)}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isEditing ? 'rgba(59,130,246,0.15)' : DS.bgCard, border: `1px solid ${isEditing ? DS.blue + '40' : DS.border}`, borderRadius: 8, cursor: 'pointer', color: isEditing ? DS.blue : DS.text4 }}>
                      {isEditing ? <X size={12} /> : <Zap size={12} />}
                    </button>
                  </div>
                </div>

                {/* Edit panel */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 overflow-hidden" style={{ background: 'rgba(59,130,246,0.03)', borderTop: `1px solid rgba(59,130,246,0.15)` }}>
                      <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', margin: '12px 0 10px' }}>
                        ĐIỀU CHỈNH LP CHO {m.name.toUpperCase()}
                      </div>
                      <div className="flex flex-wrap gap-3 items-end">
                        {/* Type */}
                        <div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>LOẠI</div>
                          <div className="flex gap-1">
                            {(Object.entries(TYPE_CFG) as [AdjustType, typeof TYPE_CFG[AdjustType]][]).map(([key, cfg]) => (
                              <button key={key} onClick={() => setAdjustType(key)}
                                style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${adjustType === key ? cfg.color : DS.border}`, background: adjustType === key ? `${cfg.color}12` : 'transparent', color: adjustType === key ? cfg.color : DS.text5, cursor: 'pointer', fontSize: 10, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                                {cfg.icon} {cfg.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Amount */}
                        <div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>SỐ LP</div>
                          <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)}
                            placeholder="VD: 1000"
                            style={{ width: 110, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '7px 10px', color: DS.text, fontSize: 13, outline: 'none', fontFamily: DS.mono }} />
                        </div>

                        {/* Reason */}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>LÝ DO</div>
                          <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                            list={`reasons-${m.id}`}
                            placeholder="Lý do điều chỉnh..."
                            style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '7px 10px', color: DS.text, fontSize: 13, outline: 'none' }} />
                          <datalist id={`reasons-${m.id}`}>
                            {PRESET_REASONS.map(r => <option key={r} value={r} />)}
                          </datalist>
                        </div>

                        {/* Submit */}
                        <button onClick={() => applyAdjustment(m.id)}
                          disabled={!adjustAmount || !adjustReason.trim()}
                          style={{ padding: '8px 16px', background: (!adjustAmount || !adjustReason.trim()) ? DS.border : GRD.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: (!adjustAmount || !adjustReason.trim()) ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, opacity: (!adjustAmount || !adjustReason.trim()) ? 0.5 : 1 }}>
                          <Check size={13} /> Xác nhận
                        </button>
                      </div>

                      {/* Preset quick buttons */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {[100, 200, 500, 1000, 2000, 5000].map(preset => (
                          <button key={preset} onClick={() => setAdjustAmount(String(preset))}
                            style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${DS.border}`, background: 'transparent', color: DS.text5, cursor: 'pointer', fontSize: 10, fontFamily: DS.mono }}>
                            {preset >= 1000 ? `${preset / 1000}K` : preset}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
