/**
 * LPManagementTab — Quản lý LP toàn diện
 * Các nguồn: Dự án · Thưởng hiệu suất · Dịch vụ · Lương cứng · Thưởng Tết
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet, Plus, Save, X, Search, Filter,
  FolderKanban, Trophy, Briefcase, DollarSign, Gift,
  TrendingUp, TrendingDown, BarChart3, Users, Zap,
  ChevronDown, Edit3, Trash2, CheckCircle2, Clock,
  Send, RefreshCw, Settings, Info, Star,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { members, RANKS, type RankKey } from '../team/memberData';
import { lpService, type LpAward } from '../../../api/lp.service';

// ── Types ─────────────────────────────────────────────────────────────────

type LPSource = 'project' | 'performance' | 'service' | 'salary' | 'tet_bonus' | 'manual';

interface LPTransaction {
  id: string;
  memberId: number;
  source: LPSource;
  amount: number;       // LP amount (positive = earned, negative = deducted)
  vndEquivalent: number;
  note: string;
  period: string;       // "T3/2026" or "Q1/2026"
  createdAt: string;
  createdBy: string;
}

interface LPRateConfig {
  lp_to_vnd: number;          // 1 LP = X VND
  // Salary bases by rank (LP/month)
  salary_iron: number;
  salary_bronze: number;
  salary_silver: number;
  salary_gold: number;
  salary_platinum: number;
  salary_ruby: number;
  salary_diamond: number;
  // Bonus rates
  perf_bonus_pct: number;     // % of monthly salary
  tet_bonus_months: number;   // number of salary months
  service_per_unit: number;   // LP per service delivered
  // Project LP rates
  project_small: number;
  project_medium: number;
  project_large: number;
}

// ── Config ─────────────────────────────────────────────────────────────────

const SOURCE_CFG: Record<LPSource, { label: string; labelVi: string; color: string; icon: typeof FolderKanban; desc: string }> = {
  project:     { label: 'Project',     labelVi: 'Dự án',               color: DS.blue,   icon: FolderKanban, desc: 'LP từ dự án hoàn thành (small/medium/large)' },
  performance: { label: 'Performance', labelVi: 'Thưởng hiệu suất',    color: DS.amber,  icon: Trophy,       desc: 'Thưởng KPI hàng tháng/quý theo phòng ban' },
  service:     { label: 'Service',     labelVi: 'Dịch vụ',             color: DS.cyan,   icon: Briefcase,    desc: 'LP khi hoàn thành gói dịch vụ cho khách hàng' },
  salary:      { label: 'Salary',      labelVi: 'Lương cứng',          color: DS.green,  icon: DollarSign,   desc: 'Lương tháng/quý cố định theo rank' },
  tet_bonus:   { label: 'Tết Bonus',   labelVi: 'Thưởng Tết',          color: DS.red,    icon: Gift,         desc: 'Thưởng Tết hàng năm (tháng lương × hệ số)' },
  manual:      { label: 'Manual',      labelVi: 'Thủ công',            color: DS.purple, icon: Star,         desc: 'Admin cấp/trừ LP thủ công với lý do rõ ràng' },
};

const INIT_RATE: LPRateConfig = {
  lp_to_vnd: 1_000,
  salary_iron:     500,
  salary_bronze:   1_200,
  salary_silver:   2_500,
  salary_gold:     5_000,
  salary_platinum: 10_000,
  salary_ruby:     22_000,
  salary_diamond:  50_000,
  perf_bonus_pct:  20,
  tet_bonus_months: 1.5,
  service_per_unit: 300,
  project_small:   500,
  project_medium:  1_500,
  project_large:   4_000,
};

const SALARY_BY_RANK: Record<RankKey, keyof LPRateConfig> = {
  iron:     'salary_iron',
  bronze:   'salary_bronze',
  silver:   'salary_silver',
  gold:     'salary_gold',
  platinum: 'salary_platinum',
  ruby:     'salary_ruby',
  diamond:  'salary_diamond',
};

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const CURRENT_YEAR = 2026;

// ── Bridge: LpAward → LPTransaction ──────────────────────────────────
function genId() { return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function mapAwardToTransaction(award: LpAward): LPTransaction {
  return {
    id: award.id,
    memberId: award.memberId,
    source: award.source,
    amount: award.amount,
    vndEquivalent: 0,
    note: award.reason,
    period: new Date(award.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }),
    createdAt: award.createdAt,
    createdBy: award.awardedBy,
  };
}

// ── Format helpers ────────────────────────────────────────────────────────

const fmtLP = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M LP` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K LP` : `${n} LP`;
const fmtVND = (n: number) => n >= 1_000_000_000 ? `${(n/1_000_000_000).toFixed(2)}B` : n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : String(n);

// ── Rate Config Modal ─────────────────────────────────────────────────────

function RateConfigModal({ rate, onClose, onSave }: {
  rate: LPRateConfig; onClose: () => void; onSave: (r: LPRateConfig) => void;
}) {
  const [draft, setDraft] = useState({ ...rate });
  const inputStyle = { width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none', fontFamily: DS.mono, boxSizing: 'border-box' as const };
  const labelStyle = { color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block' as const, marginBottom: 5, letterSpacing: '0.1em' };

  const set = (k: keyof LPRateConfig, v: number) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(10px)' }} />
      <motion.div className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '90vh' }}
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}`, position: 'sticky', top: 0, background: DS.bgCard, zIndex: 10 }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── CẤU HÌNH HỆ THỐNG LP</div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Tỷ lệ LP & Định mức lương</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="p-5 space-y-5">
            {/* Exchange rate */}
            <div className="p-4 rounded-2xl" style={{ background: `${DS.green}06`, border: `1px solid ${DS.green}20` }}>
              <label style={{ ...labelStyle, color: DS.green }}>TỶ GIÁ: 1 LP = ? VND</label>
              <input type="number" value={draft.lp_to_vnd} onChange={e => set('lp_to_vnd', Number(e.target.value))} style={{ ...inputStyle, color: DS.green }} />
              <div style={{ color: DS.text5, fontSize: 11, marginTop: 6 }}>
                💡 Ví dụ: 1,000 LP = {(1000 * draft.lp_to_vnd).toLocaleString('vi-VN')} VND
              </div>
            </div>

            {/* Salary by rank */}
            <div>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── LƯƠNG CỨ (LP/THÁNG) THEO RANK</div>
              <div className="grid grid-cols-2 gap-3">
                {(['iron','bronze','silver','gold','platinum','ruby','diamond'] as RankKey[]).map(rk => {
                  const rc = RANKS[rk];
                  const key = SALARY_BY_RANK[rk];
                  const vnd = (draft[key] as number) * draft.lp_to_vnd;
                  return (
                    <div key={rk} className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${rc.color}20` }}>
                      <label style={{ ...labelStyle, color: rc.color }}>{rc.symbol} {rc.label} (LP/tháng)</label>
                      <input type="number" value={draft[key] as number} onChange={e => set(key, Number(e.target.value))} style={{ ...inputStyle, color: rc.color }} />
                      <div style={{ color: DS.text5, fontSize: 10, marginTop: 4, fontFamily: DS.mono }}>≈ {fmtVND(vnd)} VND</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bonus rates */}
            <div>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── ĐỊNH MỨC THƯỞNG</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'perf_bonus_pct' as const, label: 'Thưởng hiệu suất (% lương)', color: DS.amber, unit: '%' },
                  { key: 'tet_bonus_months' as const, label: 'Thưởng Tết (tháng lương)', color: DS.red, unit: 'tháng' },
                  { key: 'service_per_unit' as const, label: 'LP mỗi gói dịch vụ', color: DS.cyan, unit: 'LP' },
                  { key: 'project_small' as const,  label: 'Dự án nhỏ (<10M VND)', color: DS.blue, unit: 'LP' },
                  { key: 'project_medium' as const, label: 'Dự án vừa (10-50M VND)', color: DS.purple, unit: 'LP' },
                  { key: 'project_large' as const,  label: 'Dự án lớn (>50M VND)', color: DS.green, unit: 'LP' },
                ].map(f => (
                  <div key={f.key} className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <label style={{ ...labelStyle, color: f.color }}>{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={draft[f.key] as number} onChange={e => set(f.key, Number(e.target.value))} style={{ ...inputStyle, color: f.color, flex: 1 }} />
                      <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, cursor: 'pointer', fontSize: 13 }}>Hủy</button>
          <button onClick={() => { onSave(draft); onClose(); }}
            style={{ flex: 2, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={14} /> Lưu cấu hình
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Add LP Modal ──────────────────────────────────────────────────────────

function AddLPModal({ rate, onClose, onSave }: {
  rate: LPRateConfig;
  onClose: () => void;
  onSave: (tx: LPTransaction) => void;
}) {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [source, setSource] = useState<LPSource>('salary');
  const [memberId, setMemberId] = useState<number>(members[0].id);
  const [deptId, setDeptId] = useState('it');
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [period, setPeriod] = useState(`T${new Date().getMonth() + 1}/${CURRENT_YEAR}`);
  const [projectSize, setProjectSize] = useState<'small' | 'medium' | 'large'>('medium');

  const sc = SOURCE_CFG[source];
  const selectedMember = members.find(m => m.id === memberId)!;
  const rc = RANKS[selectedMember?.rank ?? 'iron'];

  // Auto-calculate amount based on source
  const calcAmount = () => {
    if (!selectedMember) return 0;
    const salaryKey = SALARY_BY_RANK[selectedMember.rank];
    const baseSalary = rate[salaryKey] as number;
    switch (source) {
      case 'salary':      return baseSalary;
      case 'performance': return Math.round(baseSalary * rate.perf_bonus_pct / 100);
      case 'service':     return rate.service_per_unit;
      case 'project':     return rate[`project_${projectSize}`] as number;
      case 'tet_bonus':   return Math.round(baseSalary * rate.tet_bonus_months);
      default: return 0;
    }
  };

  const inputStyle = { width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', fontFamily: DS.body, boxSizing: 'border-box' as const };
  const labelStyle = { color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block' as const, marginBottom: 6, letterSpacing: '0.1em' };

  const handleSave = () => {
    const finalAmount = amount || calcAmount();
    // Call BE API
    lpService.awardLp({ memberId, amount: finalAmount, source, reason: note || `${sc.labelVi} — ${period}` })
      .then(() => {
        onSave({
          id: genId(),
          memberId,
          source,
          amount: finalAmount,
          vndEquivalent: finalAmount * rate.lp_to_vnd,
          note: note || `${sc.labelVi} — ${period}`,
          period,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Admin',
        });
        onClose();
      })
      .catch(() => {
        // Fallback: save locally even if API fails
        onSave({
          id: genId(),
          memberId,
          source,
          amount: finalAmount,
          vndEquivalent: finalAmount * rate.lp_to_vnd,
          note: note || `${sc.labelVi} — ${period}`,
          period,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Admin',
        });
        onClose();
      });
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(10px)' }} />
      <motion.div className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── CẤP LP MỚI</div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Thêm giao dịch LP</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Source selector */}
          <div>
            <label style={labelStyle}>NGUỒN LP</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(SOURCE_CFG) as LPSource[]).map(s => {
                const cfg = SOURCE_CFG[s];
                const SIcon = cfg.icon;
                return (
                  <button key={s} onClick={() => setSource(s)}
                    className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: source === s ? `${cfg.color}15` : DS.bgCard2, border: `1px solid ${source === s ? cfg.color + '50' : DS.border}`, color: source === s ? cfg.color : DS.text4, cursor: 'pointer', fontSize: 11 }}>
                    <SIcon size={12} /> {cfg.labelVi}
                  </button>
                );
              })}
            </div>
            <div style={{ color: DS.text5, fontSize: 10, marginTop: 6 }}>{sc.desc}</div>
          </div>

          {/* Member selector */}
          <div>
            <label style={labelStyle}>THÀNH VIÊN</label>
            <select value={memberId} onChange={e => setMemberId(Number(e.target.value))} style={inputStyle}>
              {members.slice(0, 20).map(m => {
                const mr = RANKS[m.rank];
                return <option key={m.id} value={m.id}>{mr.symbol} {m.name} — {m.role} (Lv.{m.level})</option>;
              })}
            </select>
          </div>

          {/* Project size (if project) */}
          {source === 'project' && (
            <div>
              <label style={labelStyle}>QUY MÔ DỰ ÁN</label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map(sz => (
                  <button key={sz} onClick={() => setProjectSize(sz)}
                    className="flex-1 py-2 rounded-xl"
                    style={{ background: projectSize === sz ? `${DS.blue}15` : DS.bgCard2, border: `1px solid ${projectSize === sz ? DS.blue + '40' : DS.border}`, color: projectSize === sz ? DS.blue : DS.text4, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono }}>
                    {sz === 'small' ? 'Nhỏ' : sz === 'medium' ? 'Vừa' : 'Lớn'}
                    <span style={{ display: 'block', fontSize: 9, color: DS.text5, marginTop: 2 }}>
                      {sz === 'small' ? `${rate.project_small} LP` : sz === 'medium' ? `${rate.project_medium} LP` : `${rate.project_large} LP`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label style={labelStyle}>SỐ LP (để trống = tự tính)</label>
            <div className="flex gap-2 items-center">
              <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))}
                placeholder={`${calcAmount()} LP (tự tính)`}
                style={{ ...inputStyle, flex: 1, color: DS.green, fontFamily: DS.mono }} />
              <button onClick={() => setAmount(calcAmount())}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl flex-shrink-0"
                style={{ background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, color: DS.blue, cursor: 'pointer', fontSize: 11 }}>
                <RefreshCw size={11} /> Auto
              </button>
            </div>
            {(amount > 0 || calcAmount() > 0) && (
              <div style={{ color: DS.text5, fontSize: 11, marginTop: 4, fontFamily: DS.mono }}>
                ≈ {fmtVND((amount || calcAmount()) * rate.lp_to_vnd)} VND
              </div>
            )}
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>KỲ LƯƠNG / KỲ THƯỞNG</label>
              <input value={period} onChange={e => setPeriod(e.target.value)}
                placeholder="VD: T3/2026, Q1/2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>GHI CHÚ</label>
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder={`${sc.labelVi} — ${period}`} style={inputStyle} />
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${sc.color}08`, border: `1px solid ${sc.color}20` }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${rc.color}50`, flexShrink: 0 }}>
              <img src={selectedMember?.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="flex-1">
              <div style={{ color: DS.text2, fontSize: 12, fontWeight: 700 }}>{selectedMember?.name}</div>
              <div style={{ color: DS.text5, fontSize: 10 }}>{sc.labelVi} · {period}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: sc.color, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>+{fmtLP(amount || calcAmount())}</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fmtVND((amount || calcAmount()) * rate.lp_to_vnd)} VND</div>
            </div>
          </div>

          <button onClick={handleSave}
            style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 0 20px rgba(129,140,248,0.25)' }}>
            <Send size={14} /> Cấp LP ngay
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export function LPManagementTab() {
  const [transactions, setTransactions] = useState<LPTransaction[]>([]);
  const [rate, setRate] = useState<LPRateConfig>(INIT_RATE);
  const [showConfig, setShowConfig] = useState(false);
  const [showAddLP, setShowAddLP] = useState(false);
  const [filterSource, setFilterSource] = useState<LPSource | 'all'>('all');
  const [filterMember, setFilterMember] = useState<number | 'all'>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [activeView, setActiveView] = useState<'transactions' | 'summary' | 'config'>('transactions');

  // Fetch LP awards from BE
  useEffect(() => {
    let cancelled = false;
    lpService.getAwards()
      .then(awards => {
        if (cancelled) return;
        const mapped = awards.map(mapAwardToTransaction);
        setTransactions(mapped);
      })
      .catch(() => {/* keep empty transactions on error */});
    return () => { cancelled = true; };
  }, []);

  const periods = useMemo(() => {
    const set = new Set(transactions.map(t => t.period));
    return ['all', ...Array.from(set)];
  }, [transactions]);

  const filtered = transactions.filter(t =>
    (filterSource === 'all' || t.source === filterSource) &&
    (filterMember === 'all' || t.memberId === filterMember) &&
    (filterPeriod === 'all' || t.period === filterPeriod)
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalLP = transactions.reduce((s, t) => s + t.amount, 0);
  const totalVND = transactions.reduce((s, t) => s + t.vndEquivalent, 0);
  const bySource = (Object.keys(SOURCE_CFG) as LPSource[]).map(s => ({
    source: s,
    total: transactions.filter(t => t.source === s).reduce((sum, t) => sum + t.amount, 0),
    count: transactions.filter(t => t.source === s).length,
  })).sort((a, b) => b.total - a.total);

  // Per-member summary
  const memberSummary = members.slice(0, 15).map(m => {
    const txs = transactions.filter(t => t.memberId === m.id);
    const totalEarned = txs.reduce((s, t) => s + t.amount, 0);
    const bySourceMap = (Object.keys(SOURCE_CFG) as LPSource[]).reduce((acc, s) => {
      acc[s] = txs.filter(t => t.source === s).reduce((sum, t) => sum + t.amount, 0);
      return acc;
    }, {} as Record<LPSource, number>);
    return { member: m, totalEarned, bySourceMap, txCount: txs.length };
  }).filter(x => x.totalEarned > 0).sort((a, b) => b.totalEarned - a.totalEarned);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng LP đã cấp', value: fmtLP(totalLP), sub: `${transactions.length} giao dịch`, color: DS.purple, icon: <Wallet size={18} /> },
          { label: 'Tổng VND quy đổi', value: fmtVND(totalVND), sub: `1 LP = ${rate.lp_to_vnd.toLocaleString()} VND`, color: DS.green, icon: <DollarSign size={18} /> },
          { label: 'Thành viên nhận LP', value: new Set(transactions.map(t => t.memberId)).size, sub: 'trong hệ thống', color: DS.blue, icon: <Users size={18} /> },
          { label: 'Tỷ lệ đổi hiện tại', value: `1:${rate.lp_to_vnd}`, sub: 'LP → VND', color: DS.amber, icon: <TrendingUp size={18} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 2 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* View + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {[
            { id: 'transactions', label: 'Lịch sử', icon: <BarChart3 size={13} /> },
            { id: 'summary',      label: 'Tổng hợp thành viên', icon: <Users size={13} /> },
          ].map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: activeView === v.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeView === v.id ? DS.blue + '40' : DS.border}`, color: activeView === v.id ? DS.blue : DS.text3, fontSize: 12, cursor: 'pointer' }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer', fontSize: 12 }}>
            <Settings size={13} /> Cấu hình tỷ lệ
          </button>
          <button onClick={() => setShowAddLP(true)}
            style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Cấp LP
          </button>
        </div>
      </div>

      {/* Source breakdown */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {bySource.map(s => {
          const cfg = SOURCE_CFG[s.source];
          const SIcon = cfg.icon;
          const pct = totalLP > 0 ? (s.total / totalLP) * 100 : 0;
          return (
            <div key={s.source} className="p-4 rounded-2xl cursor-pointer"
              style={{ background: DS.bgCard, border: `1px solid ${filterSource === s.source ? cfg.color + '50' : DS.border}` }}
              onClick={() => setFilterSource(filterSource === s.source ? 'all' : s.source)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}25` }}>
                    <SIcon size={14} style={{ color: cfg.color }} />
                  </div>
                  <span style={{ color: cfg.color, fontSize: 12, fontWeight: 700 }}>{cfg.labelVi}</span>
                </div>
                <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{s.count} tx</span>
              </div>
              <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{fmtLP(s.total)}</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{fmtVND(s.total * rate.lp_to_vnd)} VND · {pct.toFixed(1)}%</div>
              <div style={{ height: 3, background: DS.border, borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: cfg.color, borderRadius: 99 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {activeView === 'transactions' && (
          <motion.div key="tx" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap items-center">
              <select value={filterSource} onChange={e => setFilterSource(e.target.value as LPSource | 'all')}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none' }}>
                <option value="all">Tất cả nguồn</option>
                {(Object.keys(SOURCE_CFG) as LPSource[]).map(s => <option key={s} value={s}>{SOURCE_CFG[s].labelVi}</option>)}
              </select>
              <select value={String(filterMember)} onChange={e => setFilterMember(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none' }}>
                <option value="all">Tất cả thành viên</option>
                {members.slice(0, 20).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none' }}>
                {periods.map(p => <option key={p} value={p}>{p === 'all' ? 'Tất cả kỳ' : p}</option>)}
              </select>
              <span style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono, marginLeft: 'auto' }}>{filtered.length} giao dịch</span>
            </div>

            {/* Transactions table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0"
                style={{ borderBottom: `1px solid ${DS.border}`, padding: '10px 16px' }}>
                {['Thành viên', 'Ghi chú', 'Nguồn', 'Kỳ', 'LP / VND'].map(h => (
                  <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.1em' }}>{h}</div>
                ))}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
                {filtered.map((tx, i) => {
                  const m = members.find(x => x.id === tx.memberId);
                  const rc = m ? RANKS[m.rank] : null;
                  const sc = SOURCE_CFG[tx.source];
                  const SIcon = sc.icon;
                  return (
                    <motion.div key={tx.id}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${DS.border}` : 'none' }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
                      {/* Member */}
                      <div className="flex items-center gap-2">
                        <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${rc?.color ?? DS.border}50` }}>
                          <img src={m?.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ color: DS.text2, fontSize: 11, fontWeight: 600 }}>{m?.name ?? 'N/A'}</div>
                          <div style={{ color: rc?.color ?? DS.text5, fontSize: 9, fontFamily: DS.mono }}>{rc?.symbol} {rc?.label}</div>
                        </div>
                      </div>
                      {/* Note */}
                      <div style={{ color: DS.text3, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note}</div>
                      {/* Source */}
                      <div className="flex items-center gap-1.5"
                        style={{ color: sc.color, background: `${sc.color}10`, border: `1px solid ${sc.color}25`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono, whiteSpace: 'nowrap' }}>
                        <SIcon size={9} /> {sc.labelVi}
                      </div>
                      {/* Period */}
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, whiteSpace: 'nowrap' }}>{tx.period}</div>
                      {/* Amount */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: tx.amount > 0 ? DS.green : DS.red, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                          {tx.amount > 0 ? '+' : ''}{fmtLP(tx.amount)}
                        </div>
                        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{fmtVND(tx.vndEquivalent)}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'summary' && (
          <motion.div key="sum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', padding: '14px 18px', borderBottom: `1px solid ${DS.border}` }}>
                ── TỔNG HỢP LP THEO THÀNH VIÊN
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
                {memberSummary.map((ms, i) => {
                  const rc = RANKS[ms.member.rank];
                  return (
                    <div key={ms.member.id} className="p-4" style={{ borderBottom: i < memberSummary.length - 1 ? `1px solid ${DS.border}` : 'none' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${rc.color}50` }}>
                          <img src={ms.member.img} alt={ms.member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="flex-1">
                          <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{ms.member.name}</div>
                          <div style={{ color: DS.text5, fontSize: 10 }}>{ms.member.role} · {rc.symbol} {rc.label}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>{fmtLP(ms.totalEarned)}</div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fmtVND(ms.totalEarned * rate.lp_to_vnd)} VND · {ms.txCount} tx</div>
                        </div>
                      </div>
                      {/* Source breakdown mini-bars */}
                      <div className="flex gap-2 flex-wrap">
                        {(Object.keys(SOURCE_CFG) as LPSource[]).filter(s => ms.bySourceMap[s] > 0).map(s => {
                          const cfg = SOURCE_CFG[s];
                          const pct = (ms.bySourceMap[s] / ms.totalEarned) * 100;
                          const SIcon = cfg.icon;
                          return (
                            <div key={s} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                              style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
                              <SIcon size={10} style={{ color: cfg.color }} />
                              <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono }}>{fmtLP(ms.bySourceMap[s])}</span>
                              <span style={{ color: DS.text5, fontSize: 9 }}>({pct.toFixed(0)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showConfig && <RateConfigModal rate={rate} onClose={() => setShowConfig(false)} onSave={setRate} />}
        {showAddLP && <AddLPModal rate={rate} onClose={() => setShowAddLP(false)} onSave={tx => setTransactions(prev => [tx, ...prev])} />}
      </AnimatePresence>
    </div>
  );
}
