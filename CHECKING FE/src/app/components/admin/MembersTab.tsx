import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  Search, Plus, X, Edit3, Trash2, Zap, ChevronUp, ChevronDown,
  LayoutGrid, List, Filter, Award, Users, TrendingUp, Star,
  Save, AlertTriangle, CheckCircle2, Clock, UserMinus, Calendar,
  ChevronRight, Eye, ArrowUpDown, Download, RefreshCw, UserPlus,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { members as INITIAL_MEMBERS, RANKS, Member, RankKey, MissionLog } from '../team/memberData';

// ── Types ──────────────────────────────────────────────────────────────────
type MemberStatus = 'active' | 'inactive' | 'on-leave' | 'probation';
type ViewMode = 'table' | 'grid';
type SortKey = 'name' | 'level' | 'lpBalance' | 'missions' | 'rank';
type SortDir = 'asc' | 'desc';

interface MemberExt extends Member {
  status: MemberStatus;
  joinDate: string;
  lastActive: string;
  phone: string;
  email: string;
}

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG: Record<MemberStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: 'Đang hoạt động', color: '#22C55E', icon: <CheckCircle2 size={11} /> },
  inactive:  { label: 'Không hoạt động', color: '#64748B', icon: <UserMinus size={11} /> },
  'on-leave':{ label: 'Tạm nghỉ', color: '#F59E0B', icon: <Clock size={11} /> },
  probation: { label: 'Thử việc', color: '#818CF8', icon: <AlertTriangle size={11} /> },
};

const TEAMS = ['All', 'Alpha', 'Sigma', 'Omega'];
const RANK_KEYS: RankKey[] = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'];

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

const fmtDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

// ── Seed extended data ─────────────────────────────────────────────────────
const MOCK_EXT: Record<number, Pick<MemberExt, 'status' | 'joinDate' | 'lastActive' | 'phone' | 'email'>> = {
  1: { status: 'active',    joinDate: '2025-11-15', lastActive: '2026-03-24', phone: '0901 234 567', email: 'kai.tanaka@loop.vn' },
  2: { status: 'active',    joinDate: '2025-06-01', lastActive: '2026-03-24', phone: '0912 345 678', email: 'mei.lin@loop.vn' },
  3: { status: 'active',    joinDate: '2025-01-10', lastActive: '2026-03-23', phone: '0923 456 789', email: 'ryo.hashimoto@loop.vn' },
  4: { status: 'active',    joinDate: '2024-09-05', lastActive: '2026-03-24', phone: '0934 567 890', email: 'yuna.park@loop.vn' },
  5: { status: 'on-leave',  joinDate: '2024-03-10', lastActive: '2026-03-20', phone: '0945 678 901', email: 'shin.watanabe@loop.vn' },
  6: { status: 'active',    joinDate: '2023-08-20', lastActive: '2026-03-24', phone: '0956 789 012', email: 'rin.nakamura@loop.vn' },
  7: { status: 'active',    joinDate: '2022-04-01', lastActive: '2026-03-24', phone: '0967 890 123', email: 'akira.sato@loop.vn' },
};

const buildExtMembers = (): MemberExt[] =>
  INITIAL_MEMBERS.map(m => ({ ...m, ...(MOCK_EXT[m.id] ?? { status: 'active', joinDate: '2026-01-01', lastActive: '2026-03-24', phone: '', email: '' }) }));

// ── Mini Stat Card ─────────────────────────────────────────────────────────
function MiniStat({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{sub}</span>
      </div>
      <div style={{ color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700, textShadow: `0 0 12px ${color}40` }}>{value}</div>
      <div style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: MemberStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full w-fit" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}>
      <span style={{ color: cfg.color }}>{cfg.icon}</span>
      <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono }}>{cfg.label}</span>
    </div>
  );
}

// ── LP Award Modal ─────────────────────────────────────────────────────────
function LPAwardModal({ member, onClose, onConfirm }: {
  member: MemberExt;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => void;
}) {
  const [mode, setMode] = useState<'award' | 'deduct'>('award');
  const [amount, setAmount] = useState(1000);
  const [reason, setReason] = useState('');
  const rc = RANKS[member.rank];

  const presets = mode === 'award'
    ? [500, 1000, 2000, 5000, 10000]
    : [500, 1000, 2000];

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div className="relative w-full max-w-sm rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rc.color}` }}>
              <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{member.name}</div>
              <div style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono }}>{rc.symbol} {rc.label} · Lv.{member.level}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
            {(['award', 'deduct'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '9px', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, fontWeight: 700,
                background: mode === m ? (m === 'award' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'none',
                color: mode === m ? (m === 'award' ? DS.green : DS.red) : DS.text4,
                transition: 'all 0.2s',
              }}>
                {m === 'award' ? '+ THƯỞNG LP' : '− TRỪ LP'}
              </button>
            ))}
          </div>

          {/* Preset amounts */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 8 }}>CHỌN NHANH</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button key={p} onClick={() => setAmount(p)} style={{
                  padding: '5px 12px', borderRadius: 20, border: `1px solid ${amount === p ? rc.color : DS.border}`,
                  background: amount === p ? `${rc.color}18` : 'none', color: amount === p ? rc.color : DS.text4,
                  fontSize: 12, fontFamily: DS.mono, cursor: 'pointer',
                }}>
                  {fmtLP(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>SỐ LP</label>
            <input type="number" value={amount} onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: mode === 'award' ? DS.green : DS.red, fontSize: 15, fontFamily: DS.mono, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Reason */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>LÝ DO</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: Hoàn thành task xuất sắc..."
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text3, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between">
              <span style={{ color: DS.text4, fontSize: 12 }}>LP hiện tại</span>
              <span style={{ color: rc.color, fontSize: 12, fontFamily: DS.mono }}>{fmtLP(member.lpBalance)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ color: DS.text4, fontSize: 12 }}>{mode === 'award' ? '+ Thưởng' : '− Trừ'}</span>
              <span style={{ color: mode === 'award' ? DS.green : DS.red, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                {mode === 'award' ? '+' : '-'}{fmtLP(amount)}
              </span>
            </div>
            <div style={{ height: 1, background: DS.border, margin: '8px 0' }} />
            <div className="flex items-center justify-between">
              <span style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>LP sau giao dịch</span>
              <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>
                {fmtLP(Math.max(0, member.lpBalance + (mode === 'award' ? amount : -amount)))}
              </span>
            </div>
          </div>

          <button onClick={() => { onConfirm(mode === 'award' ? amount : -amount, reason); onClose(); }}
            style={{ width: '100%', background: mode === 'award' ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Xác nhận {mode === 'award' ? 'thưởng' : 'trừ'} {fmtLP(amount)} LP
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({ member, onClose, onConfirm }: { member: MemberExt; onClose: () => void; onConfirm: () => void }) {
  const rc = RANKS[member.rank];
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid rgba(239,68,68,0.4)` }}
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Trash2 size={20} style={{ color: DS.red }} />
          </div>
          <div>
            <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>Xóa thành viên</div>
            <div style={{ color: DS.text4, fontSize: 12 }}>Hành động này không thể hoàn tác</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rc.color}` }}>
            <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{member.name}</div>
            <div style={{ color: DS.text4, fontSize: 11 }}>{rc.symbol} {rc.label} · {member.role}</div>
          </div>
        </div>
        <p style={{ color: DS.text4, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          Toàn bộ dữ liệu giao dịch LP, nhiệm vụ và lịch sử rank của <strong style={{ color: DS.text2 }}>{member.name}</strong> sẽ bị xóa vĩnh viễn.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', cursor: 'pointer', color: DS.text3, fontSize: 13 }}>Hủy</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700 }}>Xóa</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Add/Edit Member Modal ──────────────────────────────────────────────────
const EMPTY_MEMBER: Omit<MemberExt, 'id'> = {
  name: '', title: '', role: '', roleCode: 'BOW', team: 'Alpha',
  rank: 'iron', level: 1, currentXP: 0, maxXP: 100,
  lpBalance: 0, lpEarned: 0, lpSpent: 0,
  img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=560&crop=faces',
  bio: '', specialty: '', missions: 0,
  achievements: [], skills: { Code: 50, Design: 50, Strategy: 50, Execution: 50, Teamwork: 50 },
  techStack: [],
  missionLogs: [],
  rankHistory: [],
  status: 'probation', joinDate: new Date().toISOString().split('T')[0], lastActive: new Date().toISOString().split('T')[0],
  phone: '', email: '',
};

function MemberFormModal({ member, onClose, onSave, isEdit }: {
  member: MemberExt | null;
  onClose: () => void;
  onSave: (m: MemberExt) => void;
  isEdit: boolean;
}) {
  const defaultData: MemberExt = isEdit && member ? { ...member } : { ...EMPTY_MEMBER, id: Date.now() };
  const [draft, setDraft] = useState<MemberExt>(defaultData);
  const [activeSection, setActiveSection] = useState<'info' | 'stats' | 'skills'>('info');
  const rc = RANKS[draft.rank];

  const set = <K extends keyof MemberExt>(key: K, val: MemberExt[K]) => setDraft(d => ({ ...d, [key]: val }));

  const inputStyle = { width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text2, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 };

  const sections = [
    { id: 'info', label: 'Thông tin' },
    { id: 'stats', label: 'Rank & LP' },
    { id: 'skills', label: 'Kỹ năng' },
  ] as const;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(10px)' }} />
      <motion.div className="relative w-full max-w-2xl rounded-2xl flex flex-col" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '90vh' }}
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: `1.5px solid ${rc.color}` }}>
              <img src={draft.img} alt={draft.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{isEdit ? `Chỉnh sửa · ${draft.name}` : 'Thêm thành viên mới'}</div>
              <div style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono }}>{rc.symbol} {rc.label} Lv.{draft.level}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Section tabs */}
        <div className="flex px-6 flex-shrink-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              color: activeSection === s.id ? DS.blue : DS.text4,
              fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.08em',
              borderBottom: activeSection === s.id ? `2px solid ${DS.blue}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-zen p-6 space-y-4">
          {/* ── SECTION: INFO ── */}
          {activeSection === 'info' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label style={labelStyle}>AVATAR URL</label>
                  <input value={draft.img} onChange={e => set('img', e.target.value)} style={inputStyle} placeholder="https://..." />
                </div>
                <div>
                  <label style={labelStyle}>HỌ VÀ TÊN *</label>
                  <input value={draft.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="Tên đầy đủ" />
                </div>
                <div>
                  <label style={labelStyle}>DANH HIỆU</label>
                  <input value={draft.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="VD: Code Sentinel" />
                </div>
                <div>
                  <label style={labelStyle}>VAI TRÒ *</label>
                  <input value={draft.role} onChange={e => set('role', e.target.value)} style={inputStyle} placeholder="VD: Backend Dev" />
                </div>
                <div>
                  <label style={labelStyle}>ROLE CODE</label>
                  <select value={draft.roleCode} onChange={e => set('roleCode', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['BOW', 'DAGGER', 'DUAL', 'SHIELD', 'STAFF', 'MAP', 'PM', 'QA', 'DATA', 'MKT', 'HR'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>TEAM</label>
                  <select value={draft.team} onChange={e => set('team', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['Alpha', 'Sigma', 'Omega', 'All'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>TRẠNG THÁI</label>
                  <select value={draft.status} onChange={e => set('status', e.target.value as MemberStatus)} style={{ ...inputStyle, cursor: 'pointer', color: STATUS_CFG[draft.status].color }}>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input value={draft.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="email@loop.vn" />
                </div>
                <div>
                  <label style={labelStyle}>ĐIỆN THOẠI</label>
                  <input value={draft.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="09xx xxx xxx" />
                </div>
                <div>
                  <label style={labelStyle}>NGÀY VÀO GUILD</label>
                  <input type="date" value={draft.joinDate} onChange={e => set('joinDate', e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>CHUYÊN MÔN</label>
                  <input value={draft.specialty} onChange={e => set('specialty', e.target.value)} style={inputStyle} placeholder="VD: Node.js & Microservices" />
                </div>
                <div className="col-span-2">
                  <label style={labelStyle}>BIO</label>
                  <textarea value={draft.bio} onChange={e => set('bio', e.target.value)} rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Mô tả ngắn về thành viên..." />
                </div>
                <div className="col-span-2">
                  <label style={labelStyle}>TECH STACK (phân cách bằng dấu phẩy)</label>
                  <input value={draft.techStack.join(', ')} onChange={e => set('techStack', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} style={inputStyle} placeholder="React, Node.js, Docker..." />
                  {draft.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {draft.techStack.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: DS.blue, fontSize: 11 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label style={labelStyle}>ACHIEVEMENTS (phân cách bằng dấu phẩy)</label>
                  <input value={draft.achievements.join(', ')} onChange={e => set('achievements', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} style={inputStyle} placeholder="First Deployment, Bug Slayer..." />
                </div>
              </div>
            </>
          )}

          {/* ── SECTION: RANK & LP ── */}
          {activeSection === 'stats' && (
            <div className="space-y-5">
              {/* Rank selector */}
              <div>
                <label style={labelStyle}>RANK</label>
                <div className="flex flex-wrap gap-2">
                  {RANK_KEYS.map(rk => {
                    const r = RANKS[rk];
                    return (
                      <button key={rk} onClick={() => set('rank', rk)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                        background: draft.rank === rk ? `${r.color}18` : 'none',
                        border: `1px solid ${draft.rank === rk ? r.color : DS.border}`,
                        color: draft.rank === rk ? r.color : DS.text4, fontSize: 12, fontFamily: DS.mono,
                      }}>
                        <span>{r.symbol}</span> {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle}>LEVEL</label>
                  <input type="number" value={draft.level} onChange={e => set('level', Number(e.target.value))}
                    min={rc.minLevel} max={rc.uncapped ? 999 : rc.maxLevel}
                    style={{ ...inputStyle, color: rc.color, fontFamily: DS.mono }} />
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>
                    Range: {rc.minLevel} – {rc.uncapped ? '∞' : rc.maxLevel}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>XP HIỆN TẠI</label>
                  <input type="number" value={draft.currentXP} onChange={e => set('currentXP', Number(e.target.value))}
                    min={0} max={draft.maxXP}
                    style={{ ...inputStyle, color: DS.cyan, fontFamily: DS.mono }} />
                </div>
                <div>
                  <label style={labelStyle}>XP TỐI ĐA</label>
                  <input type="number" value={draft.maxXP} onChange={e => set('maxXP', Number(e.target.value))}
                    style={{ ...inputStyle, fontFamily: DS.mono }} />
                </div>
              </div>

              {/* XP preview bar */}
              <div className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div className="flex justify-between mb-2">
                  <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono }}>XP Progress</span>
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{draft.currentXP}/{draft.maxXP}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 6, background: DS.border }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (draft.currentXP / draft.maxXP) * 100)}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle}>LP BALANCE</label>
                  <input type="number" value={draft.lpBalance} onChange={e => set('lpBalance', Number(e.target.value))}
                    style={{ ...inputStyle, color: DS.blue, fontFamily: DS.mono }} />
                </div>
                <div>
                  <label style={labelStyle}>LP EARNED (Tổng)</label>
                  <input type="number" value={draft.lpEarned} onChange={e => set('lpEarned', Number(e.target.value))}
                    style={{ ...inputStyle, color: DS.green, fontFamily: DS.mono }} />
                </div>
                <div>
                  <label style={labelStyle}>LP SPENT (Đã dùng)</label>
                  <input type="number" value={draft.lpSpent} onChange={e => set('lpSpent', Number(e.target.value))}
                    style={{ ...inputStyle, color: DS.amber, fontFamily: DS.mono }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>SỐ NHIỆM VỤ ĐÃ HOÀN THÀNH</label>
                  <input type="number" value={draft.missions} onChange={e => set('missions', Number(e.target.value))}
                    style={{ ...inputStyle, fontFamily: DS.mono }} />
                </div>
                <div>
                  <label style={labelStyle}>NGÀY HOẠT ĐỘNG GẦN NHẤT</label>
                  <input type="date" value={draft.lastActive} onChange={e => set('lastActive', e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION: SKILLS ── */}
          {activeSection === 'skills' && (
            <div className="space-y-5">
              <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>
                Điều chỉnh điểm kỹ năng từ <strong style={{ color: DS.text3 }}>0 – 100</strong>. Biểu đồ sẽ cập nhật trực tiếp trên hồ sơ thành viên.
              </div>
              {Object.entries(draft.skills).map(([skill, val]) => (
                <div key={skill}>
                  <div className="flex items-center justify-between mb-2">
                    <label style={labelStyle}>{skill.toUpperCase()}</label>
                    <span style={{ color: rc.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{val}</span>
                  </div>
                  <input type="range" min={0} max={100} value={val}
                    onChange={e => set('skills', { ...draft.skills, [skill]: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: rc.color, cursor: 'pointer' }} />
                  <div className="rounded-full overflow-hidden mt-1" style={{ height: 4, background: DS.border }}>
                    <div style={{ height: '100%', width: `${val}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99, transition: 'width 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: 'pointer', fontSize: 13 }}>Hủy</button>
          <button onClick={() => { if (draft.name.trim()) { onSave(draft); onClose(); } }}
            style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={14} /> {isEdit ? 'Lưu thay đổi' : 'Thêm thành viên'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Member Detail Modal ────────────────────────────────────────────────────
function MemberDetailModal({ member, onClose, onEdit, onLP }: {
  member: MemberExt;
  onClose: () => void;
  onEdit: () => void;
  onLP: () => void;
}) {
  const rc = RANKS[member.rank];
  const xpPct = Math.round((member.currentXP / member.maxXP) * 100);
  const completedMissions = member.missionLogs.filter(m => m.status === 'completed').length;
  const completionRate = member.missionLogs.length > 0 ? Math.round((completedMissions / member.missionLogs.length) * 100) : 0;

  const statusLog: Record<MissionLog['status'], { color: string; label: string }> = {
    completed: { color: DS.green, label: 'Hoàn thành' },
    ongoing: { color: DS.amber, label: 'Đang thực hiện' },
    failed: { color: DS.red, label: 'Thất bại' },
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(10px)' }} />
      <motion.div className="relative w-full max-w-3xl rounded-2xl flex flex-col" style={{ background: DS.bgCard, border: `1px solid ${rc.color}30`, maxHeight: '92vh' }}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}>

        {/* Banner */}
        <div className="relative flex-shrink-0" style={{ height: 120, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
          <img src={member.img} alt={member.name} className="w-full h-full object-cover" style={{ filter: 'blur(12px) brightness(0.4)', transform: 'scale(1.1)' }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${rc.gradientFrom}40, ${rc.gradientTo}20)` }} />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button onClick={onLP} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: `1px solid ${DS.green}40`, color: DS.green, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={12} /> LP
            </button>
            <button onClick={onEdit} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: `1px solid ${DS.blue}40`, color: DS.blue, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Edit3 size={12} /> Edit
            </button>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: `1px solid ${DS.border}`, color: DS.text4, borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Profile header */}
        <div className="px-6 pb-4 flex-shrink-0" style={{ marginTop: -40, position: 'relative', zIndex: 1 }}>
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `2.5px solid ${rc.color}`, boxShadow: `0 0 24px ${rc.glowColor}` }}>
              <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pb-1">
              <div style={{ color: DS.text, fontSize: 18, fontWeight: 700, fontFamily: DS.heading }}>{member.name}</div>
              <div style={{ color: DS.text4, fontSize: 13, marginTop: 2 }}>{member.title} · {member.role}</div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${rc.color}15`, border: `1px solid ${rc.color}35` }}>
                  <span style={{ color: rc.color }}>{rc.symbol}</span>
                  <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{rc.label} Lv.{member.level}</span>
                </div>
                <StatusBadge status={member.status} />
                <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>Team {member.team}</span>
              </div>
            </div>
            <div className="text-right pb-1">
              <div style={{ color: rc.color, fontSize: 20, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(member.lpBalance)}</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>LP BALANCE</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-zen">
          <div className="grid grid-cols-3 gap-4 px-6 pb-2">
            {/* Left: Stats + Missions */}
            <div className="col-span-2 space-y-4">
              {/* XP + LP stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'LP Tổng kiếm', value: fmtLP(member.lpEarned), color: DS.green },
                  { label: 'LP Đã dùng', value: fmtLP(member.lpSpent), color: DS.amber },
                  { label: 'Nhiệm vụ', value: String(member.missions), color: DS.blue },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <div style={{ color: s.color, fontSize: 16, fontFamily: DS.mono, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: DS.text5, fontSize: 10, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* XP bar */}
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div className="flex justify-between mb-2">
                  <span style={{ color: rc.color, fontSize: 12, fontFamily: DS.mono }}>XP Progress</span>
                  <span style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{xpPct}% · {member.currentXP}/{member.maxXP}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 8, background: DS.border }}>
                  <div style={{ height: '100%', width: `${xpPct}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99, boxShadow: `0 0 10px ${rc.glowColor}`, transition: 'width 0.6s' }} />
                </div>
              </div>

              {/* Skills */}
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 12 }}>── KỸ NĂNG</div>
                <div className="space-y-3">
                  {Object.entries(member.skills).map(([skill, val]) => (
                    <div key={skill}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: DS.text4, fontSize: 11 }}>{skill}</span>
                        <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono }}>{val}</span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                        <div style={{ height: '100%', width: `${val}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mission Logs */}
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>── NHIỆM VỤ GẦN ĐÂY</span>
                  <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Tỷ lệ thành công: <span style={{ color: DS.green }}>{completionRate}%</span></span>
                </div>
                <div className="space-y-2">
                  {member.missionLogs.map((log, i) => {
                    const sc = statusLog[log.status];
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.color, boxShadow: `0 0 4px ${sc.color}` }} />
                        <div className="flex-1 min-w-0">
                          <div style={{ color: DS.text2, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.title}</div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fmtDate(log.date)}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono }}>{sc.label}</div>
                          <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>+{fmtLP(log.lpReward)} LP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Info + Achievements */}
            <div className="space-y-4">
              {/* Contact */}
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>── THÔNG TIN</div>
                {[
                  { label: 'Email', value: member.email || '—' },
                  { label: 'Phone', value: member.phone || '—' },
                  { label: 'Join', value: fmtDate(member.joinDate) },
                  { label: 'Last active', value: fmtDate(member.lastActive) },
                  { label: 'Specialty', value: member.specialty },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <span style={{ color: DS.text5, fontSize: 11 }}>{label}</span>
                    <span style={{ color: DS.text3, fontSize: 11, fontFamily: label === 'Email' || label === 'Join' || label === 'Last active' ? DS.mono : DS.body, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Tech stack */}
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>── TECH STACK</div>
                <div className="flex flex-wrap gap-1.5">
                  {member.techStack.map(t => (
                    <span key={t} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: DS.blue, fontSize: 10, padding: '2px 8px', borderRadius: 4, fontFamily: DS.mono }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>── THÀNH TÍCH ({member.achievements.length})</div>
                <div className="space-y-1.5">
                  {member.achievements.map(a => (
                    <div key={a} className="flex items-center gap-2">
                      <Star size={9} style={{ color: rc.color, flexShrink: 0 }} />
                      <span style={{ color: DS.text3, fontSize: 11 }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rank history */}
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>── LỊCH SỬ RANK</div>
                <div className="space-y-2">
                  {[...member.rankHistory].reverse().map((rh, i) => {
                    const r = RANKS[rh.rank];
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ color: r.color, fontSize: 10, flexShrink: 0, marginTop: 1 }}>{r.symbol}</span>
                        <div>
                          <div style={{ color: DS.text3, fontSize: 11 }}>{r.label} Lv.{rh.level}</div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fmtDate(rh.date)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link to={`/member/${member.id}`} onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: GRD.primary, color: '#fff', borderRadius: 10, padding: '10px', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                <Eye size={13} /> Xem hồ sơ đầy đủ <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Table Row ──────────────────────────────────────────────────────────────
function MemberTableRow({ member, selected, onSelect, onView, onEdit, onLP, onDelete, index }: {
  member: MemberExt; selected: boolean; index: number;
  onSelect: () => void; onView: () => void; onEdit: () => void;
  onLP: () => void; onDelete: () => void;
}) {
  const rc = RANKS[member.rank];
  const xpPct = Math.round((member.currentXP / member.maxXP) * 100);
  const topSkill = Object.entries(member.skills).sort((a, b) => b[1] - a[1])[0];

  return (
    <motion.div
      className="grid items-center px-4 py-3"
      style={{
        gridTemplateColumns: '40px 2.5fr 1.2fr 1fr 1fr 1fr 1fr 100px',
        borderBottom: `1px solid ${DS.border}`,
        backgroundColor: selected ? 'rgba(59,130,246,0.06)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.15s',
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ backgroundColor: selected ? 'rgba(59,130,246,0.09)' : 'rgba(255,255,255,0.02)' }}
    >
      {/* Checkbox */}
      <button onClick={onSelect} style={{
        width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${selected ? DS.blue : DS.border}`,
        background: selected ? DS.blue : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {selected && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
      </button>

      {/* Member info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rc.color}60`, boxShadow: `0 0 8px ${rc.glowColor}` }}>
          <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
          <div style={{ color: DS.text5, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.role} · {member.email || member.team}</div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, background: DS.bgCard2, padding: '1px 5px', borderRadius: 3 }}>Team {member.team}</span>
          </div>
        </div>
      </div>

      {/* Rank + Level + XP */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ color: rc.color, fontSize: 11 }}>{rc.symbol}</span>
          <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{rc.label}</span>
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>Lv.{member.level}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full overflow-hidden flex-1" style={{ height: 3, background: DS.border, maxWidth: 80 }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }} />
          </div>
          <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{xpPct}%</span>
        </div>
      </div>

      {/* LP */}
      <div>
        <div style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(member.lpBalance)}</div>
        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Earned: {fmtLP(member.lpEarned)}</div>
      </div>

      {/* Missions + top skill */}
      <div>
        <div style={{ color: DS.text3, fontSize: 13, fontFamily: DS.mono }}>{member.missions}</div>
        {topSkill && (
          <div style={{ color: DS.text5, fontSize: 10 }}>{topSkill[0]}: <span style={{ color: rc.color }}>{topSkill[1]}</span></div>
        )}
      </div>

      {/* Join date */}
      <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtDate(member.joinDate)}</div>

      {/* Status */}
      <StatusBadge status={member.status} />

      {/* Actions */}
      <div className="flex items-center gap-1.5 justify-end">
        <button onClick={onView} title="Xem chi tiết" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${DS.border}`, background: 'none', color: DS.text4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Eye size={13} />
        </button>
        <button onClick={onLP} title="Quản lý LP" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid rgba(34,197,94,0.3)`, background: 'rgba(34,197,94,0.08)', color: DS.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={13} />
        </button>
        <button onClick={onEdit} title="Chỉnh sửa" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid rgba(59,130,246,0.3)`, background: 'rgba(59,130,246,0.08)', color: DS.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Edit3 size={13} />
        </button>
        <button onClick={onDelete} title="Xóa" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid rgba(239,68,68,0.3)`, background: 'rgba(239,68,68,0.08)', color: DS.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Grid Card ──────────────────────────────────────────────────────────────
function MemberGridCard({ member, onView, onEdit, onLP, onDelete }: {
  member: MemberExt;
  onView: () => void; onEdit: () => void; onLP: () => void; onDelete: () => void;
}) {
  const rc = RANKS[member.rank];
  const xpPct = Math.round((member.currentXP / member.maxXP) * 100);
  return (
    <motion.div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, position: 'relative' }}
      whileHover={{ borderColor: `${rc.color}40`, boxShadow: `0 4px 24px rgba(0,0,0,0.3)`, y: -2 }}>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rc.color}60`, boxShadow: `0 0 10px ${rc.glowColor}` }}>
          <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
          <div style={{ color: DS.text4, fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.role}</div>
          <StatusBadge status={member.status} />
        </div>
      </div>

      {/* Rank + LP */}
      <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: `${rc.color}0a`, border: `1px solid ${rc.color}20` }}>
        <div className="flex items-center gap-1.5">
          <span style={{ color: rc.color }}>{rc.symbol}</span>
          <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{rc.label} Lv.{member.level}</span>
        </div>
        <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(member.lpBalance)}</span>
      </div>

      {/* XP bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span style={{ color: DS.text5, fontSize: 10 }}>XP</span>
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{xpPct}%</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <span style={{ color: DS.text5, fontSize: 11 }}><span style={{ color: DS.text3, fontWeight: 700 }}>{member.missions}</span> nhiệm vụ</span>
        <span style={{ color: DS.text5, fontSize: 11 }}>{fmtDate(member.joinDate)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onView} style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1px solid ${DS.border}`, background: 'none', color: DS.text4, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Eye size={12} /> Xem
        </button>
        <button onClick={onLP} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(34,197,94,0.3)`, background: 'rgba(34,197,94,0.08)', color: DS.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={13} />
        </button>
        <button onClick={onEdit} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(59,130,246,0.3)`, background: 'rgba(59,130,246,0.08)', color: DS.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Edit3 size={13} />
        </button>
        <button onClick={onDelete} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(239,68,68,0.3)`, background: 'rgba(239,68,68,0.08)', color: DS.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Bulk LP Modal ──────────────────────────────────────────────────────────
function BulkLPModal({ count, onClose, onConfirm }: { count: number; onClose: () => void; onConfirm: (amount: number, reason: string) => void }) {
  const [mode, setMode] = useState<'award' | 'deduct'>('award');
  const [amount, setAmount] = useState(500);
  const [reason, setReason] = useState('');
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div className="relative w-full max-w-sm rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>Bulk LP · {count} thành viên</div>
            <div style={{ color: DS.text4, fontSize: 12 }}>Áp dụng cho tất cả thành viên được chọn</div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
            {(['award', 'deduct'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '9px', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono,
                background: mode === m ? (m === 'award' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'none',
                color: mode === m ? (m === 'award' ? DS.green : DS.red) : DS.text4 }}>
                {m === 'award' ? '+ THƯỞNG' : '− TRỪ'}
              </button>
            ))}
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>SỐ LP MỖI NGƯỜI</label>
            <input type="number" value={amount} onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: mode === 'award' ? DS.green : DS.red, fontSize: 15, fontFamily: DS.mono, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>LÝ DO</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do..."
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text3, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text4, fontSize: 12 }}>Tổng LP {mode === 'award' ? 'thưởng' : 'trừ'}</div>
            <div style={{ color: mode === 'award' ? DS.green : DS.red, fontSize: 20, fontFamily: DS.mono, fontWeight: 700, marginTop: 4 }}>
              {mode === 'award' ? '+' : '-'}{fmtLP(amount * count)}
            </div>
            <div style={{ color: DS.text5, fontSize: 11 }}>{fmtLP(amount)} × {count} thành viên</div>
          </div>
          <button onClick={() => { onConfirm(mode === 'award' ? amount : -amount, reason); onClose(); }}
            style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Xác nhận
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Sort Header Cell ──────────────────────────────────────────────────────
function SortHeader({ label, sortKey, current, dir, onSort }: { label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void }) {
  const active = current === sortKey;
  return (
    <button onClick={() => onSort(sortKey)} className="flex items-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer', color: active ? DS.blue : DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', padding: 0 }}>
      {label}
      {active ? (dir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={9} style={{ opacity: 0.4 }} />}
    </button>
  );
}

// ── MAIN MEMBERS TAB ───────────────────────────────────────────────────────
export function MembersTab() {
  const [members, setMembers] = useState<MemberExt[]>(buildExtMembers);
  const [search, setSearch] = useState('');
  const [filterRank, setFilterRank] = useState<RankKey | 'all'>('all');
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [editingMember, setEditingMember] = useState<MemberExt | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingMember, setViewingMember] = useState<MemberExt | null>(null);
  const [lpMember, setLPMember] = useState<MemberExt | null>(null);
  const [deleteMember, setDeleteMember] = useState<MemberExt | null>(null);
  const [showBulkLP, setShowBulkLP] = useState(false);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);

  const showToast = (msg: string, color = DS.green) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = members.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      const matchRank = filterRank === 'all' || m.rank === filterRank;
      const matchTeam = filterTeam === 'All' || m.team === filterTeam;
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      return matchSearch && matchRank && matchTeam && matchStatus;
    });

    list = list.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortKey === 'name') { va = a.name; vb = b.name; }
      else if (sortKey === 'level') { va = a.level; vb = b.level; }
      else if (sortKey === 'lpBalance') { va = a.lpBalance; vb = b.lpBalance; }
      else if (sortKey === 'missions') { va = a.missions; vb = b.missions; }
      else if (sortKey === 'rank') { va = RANKS[a.rank].tier; vb = RANKS[b.rank].tier; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return list;
  }, [members, search, filterRank, filterTeam, filterStatus, sortKey, sortDir]);

  const toggleSelect = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(m => m.id)));

  const handleSaveMember = (m: MemberExt) => {
    setMembers(prev => {
      const exists = prev.find(x => x.id === m.id);
      if (exists) return prev.map(x => x.id === m.id ? m : x);
      return [...prev, m];
    });
    showToast(editingMember ? `Đã cập nhật ${m.name}` : `Đã thêm ${m.name}`, DS.green);
    setEditingMember(null);
  };

  const handleDelete = (id: number) => {
    const m = members.find(x => x.id === id);
    setMembers(prev => prev.filter(x => x.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    showToast(`Đã xóa ${m?.name ?? 'thành viên'}`, DS.red);
  };

  const handleLP = (member: MemberExt, amount: number, reason: string) => {
    setMembers(prev => prev.map(m => m.id === member.id ? {
      ...m,
      lpBalance: Math.max(0, m.lpBalance + amount),
      lpEarned: amount > 0 ? m.lpEarned + amount : m.lpEarned,
      lpSpent: amount < 0 ? m.lpSpent + Math.abs(amount) : m.lpSpent,
    } : m));
    const sign = amount > 0 ? '+' : '';
    showToast(`${sign}${fmtLP(amount)} LP cho ${member.name}${reason ? ` · ${reason}` : ''}`, amount > 0 ? DS.green : DS.red);
  };

  const handleBulkLP = (amount: number, reason: string) => {
    const ids = Array.from(selected);
    ids.forEach(id => {
      const m = members.find(x => x.id === id);
      if (m) handleLP(m, amount, reason);
    });
    showToast(`${amount > 0 ? '+' : ''}${fmtLP(amount)} LP cho ${ids.length} thành viên`, amount > 0 ? DS.green : DS.red);
    setSelected(new Set());
  };

  // Stats
  const totalLP = members.reduce((s, m) => s + m.lpBalance, 0);
  const activeCount = members.filter(m => m.status === 'active').length;
  const topMember = [...members].sort((a, b) => b.level - a.level)[0];
  const avgLevel = Math.round(members.reduce((s, m) => s + m.level, 0) / members.length);

  const rankDist = RANK_KEYS.map(rk => ({ rank: rk, count: members.filter(m => m.rank === rk).length })).filter(r => r.count > 0);

  return (
    <div className="space-y-5">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[999] px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: DS.bgCard, border: `1px solid ${toast.color}40`, boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: toast.color, boxShadow: `0 0 6px ${toast.color}` }} />
            <span style={{ color: DS.text2, fontSize: 13 }}>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniStat label="Tổng thành viên" value={String(members.length)} sub={`${activeCount} active`} color={DS.blue} icon={<Users size={16} />} />
        <MiniStat label="LP đang lưu thông" value={fmtLP(totalLP)} sub="Season III" color={DS.cyan} icon={<Zap size={16} />} />
        <MiniStat label="Top member" value={topMember?.name.split(' ')[0] ?? '—'} sub={`${RANKS[topMember?.rank ?? 'iron'].label} Lv.${topMember?.level}`} color={RANKS[topMember?.rank ?? 'iron'].color} icon={<Award size={16} />} />
        <MiniStat label="Trung bình Level" value={String(avgLevel)} sub="Toàn đội" color={DS.amber} icon={<TrendingUp size={16} />} />
      </div>

      {/* Rank distribution bar */}
      <div className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>PHÂN BỐ RANK</div>
        <div className="flex items-center gap-2 flex-wrap">
          {rankDist.map(({ rank, count }) => {
            const r = RANKS[rank];
            return (
              <button key={rank} onClick={() => setFilterRank(filterRank === rank ? 'all' : rank)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                  background: filterRank === rank ? `${r.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${filterRank === rank ? r.color : DS.border}`,
                  color: filterRank === rank ? r.color : DS.text4, fontSize: 12, fontFamily: DS.mono,
                }}>
                <span>{r.symbol}</span>
                <span>{r.label}</span>
                <span style={{ background: filterRank === rank ? `${r.color}30` : DS.bgCard2, padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Search size={13} style={{ color: DS.text4, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, role, email..."
            style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: '100%' }} />
          {search && <button onClick={() => setSearch('')} style={{ color: DS.text5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>}
        </div>

        {/* Team filter */}
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          {TEAMS.map(t => <option key={t} value={t}>{t === 'All' ? 'Tất cả team' : `Team ${t}`}</option>)}
        </select>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as MemberStatus | 'all')}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* View mode */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
          {([['table', <List size={14} />], ['grid', <LayoutGrid size={14} />]] as const).map(([m, icon]) => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: viewMode === m ? 'rgba(59,130,246,0.15)' : 'none', border: 'none', cursor: 'pointer',
              color: viewMode === m ? DS.blue : DS.text4,
            }}>{icon}</button>
          ))}
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>{selected.size} đã chọn</span>
            <button onClick={() => setShowBulkLP(true)} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: DS.green, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={11} /> Bulk LP
            </button>
            <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer', padding: 0, display: 'flex' }}><X size={13} /></button>
          </div>
        )}

        {/* Export (UI only) */}
        <button style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text4, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Download size={13} /> Export
        </button>

        {/* Add member */}
        <button onClick={() => setShowAddForm(true)}
          style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, boxShadow: '0 0 16px rgba(129,140,248,0.3)' }}>
          <UserPlus size={14} /> Thêm thành viên
        </button>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between">
        <div style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>
          Hiển thị <span style={{ color: DS.text3 }}>{filtered.length}</span> / {members.length} thành viên
          {(search || filterRank !== 'all' || filterTeam !== 'All' || filterStatus !== 'all') && (
            <button onClick={() => { setSearch(''); setFilterRank('all'); setFilterTeam('All'); setFilterStatus('all'); }}
              style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <RefreshCw size={10} /> Xóa bộ lọc
            </button>
          )}
        </div>
        <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
          Sắp xếp: <span style={{ color: DS.text3 }}>{sortKey} {sortDir === 'asc' ? '↑' : '↓'}</span>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
          {/* Table header */}
          <div className="grid px-4 py-3 items-center" style={{
            gridTemplateColumns: '40px 2.5fr 1.2fr 1fr 1fr 1fr 1fr 100px',
            background: DS.bgCard2, borderBottom: `1px solid ${DS.border}`,
          }}>
            <button onClick={toggleAll} style={{
              width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${selected.size === filtered.length && filtered.length > 0 ? DS.blue : DS.border}`,
              background: selected.size === filtered.length && filtered.length > 0 ? DS.blue : 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {selected.size === filtered.length && filtered.length > 0 && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
            </button>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>THÀNH VIÊN</div>
            <SortHeader label="RANK" sortKey="rank" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortHeader label="LP BALANCE" sortKey="lpBalance" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortHeader label="MISSIONS" sortKey="missions" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortHeader label="NGÀY VÀO" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>TRẠNG THÁI</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', textAlign: 'right' }}>THAO TÁC</div>
          </div>

          {/* Rows */}
          <AnimatePresence>
            {filtered.map((m, i) => (
              <MemberTableRow
                key={m.id} member={m} selected={selected.has(m.id)} index={i}
                onSelect={() => toggleSelect(m.id)}
                onView={() => setViewingMember(m)}
                onEdit={() => setEditingMember(m)}
                onLP={() => setLPMember(m)}
                onDelete={() => setDeleteMember(m)}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: DS.text5 }}>
              <Users size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>Không tìm thấy thành viên nào</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
            </div>
          )}
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map(m => (
              <MemberGridCard key={m.id} member={m}
                onView={() => setViewingMember(m)}
                onEdit={() => setEditingMember(m)}
                onLP={() => setLPMember(m)}
                onDelete={() => setDeleteMember(m)}
              />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16" style={{ color: DS.text5 }}>
              <Users size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div>Không tìm thấy thành viên nào</div>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showAddForm && (
          <MemberFormModal key="add" member={null} isEdit={false} onClose={() => setShowAddForm(false)} onSave={handleSaveMember} />
        )}
        {editingMember && (
          <MemberFormModal key="edit" member={editingMember} isEdit={true} onClose={() => setEditingMember(null)} onSave={handleSaveMember} />
        )}
        {viewingMember && (
          <MemberDetailModal key="view" member={viewingMember} onClose={() => setViewingMember(null)}
            onEdit={() => { setEditingMember(viewingMember); setViewingMember(null); }}
            onLP={() => { setLPMember(viewingMember); setViewingMember(null); }}
          />
        )}
        {lpMember && (
          <LPAwardModal key="lp" member={lpMember} onClose={() => setLPMember(null)}
            onConfirm={(amount, reason) => handleLP(lpMember, amount, reason)} />
        )}
        {deleteMember && (
          <DeleteConfirmModal key="delete" member={deleteMember} onClose={() => setDeleteMember(null)}
            onConfirm={() => handleDelete(deleteMember.id)} />
        )}
        {showBulkLP && (
          <BulkLPModal key="bulk" count={selected.size} onClose={() => setShowBulkLP(false)} onConfirm={handleBulkLP} />
        )}
      </AnimatePresence>
    </div>
  );
}
