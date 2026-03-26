import { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Edit3, Trash2, AlertTriangle, Clock, ChevronDown,
  Tag, Zap, Calendar, MessageSquare, Paperclip, MoreHorizontal,
  CheckCircle2, Circle, User, Search,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { members, RANKS } from '../team/memberData';

const ITEM_TYPE = 'TASK';

type Priority = 'urgent' | 'high' | 'medium' | 'low';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assigneeIds: number[];
  lp: number;
  dueDate: string;
  tags: string[];
  colId: string;
  comments: number;
  attachments: number;
  checklist: { done: number; total: number };
}

interface Column {
  id: string;
  label: string;
  color: string;
  icon: string;
}

const COLUMNS: Column[] = [
  { id: 'backlog', label: 'Backlog', color: DS.text4, icon: '○' },
  { id: 'todo', label: 'Cần làm', color: DS.blue, icon: '◎' },
  { id: 'doing', label: 'Đang làm', color: DS.amber, icon: '◑' },
  { id: 'review', label: 'Review', color: DS.purple, icon: '◕' },
  { id: 'done', label: 'Hoàn thành', color: DS.green, icon: '●' },
];

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Khẩn', color: DS.red, bg: 'rgba(239,68,68,0.15)' },
  high:   { label: 'Cao', color: DS.amber, bg: 'rgba(245,158,11,0.15)' },
  medium: { label: 'TB', color: DS.blue, bg: 'rgba(59,130,246,0.15)' },
  low:    { label: 'Thấp', color: DS.text4, bg: 'rgba(100,116,139,0.15)' },
};

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'SEO Audit tháng 4', description: 'Kiểm tra toàn bộ technical SEO cho 5 website khách hàng. Báo cáo chi tiết và kế hoạch cải thiện.', priority: 'medium', assigneeIds: [1, 2], lp: 3000, dueDate: '2026-04-30', tags: ['SEO', 'Audit'], colId: 'backlog', comments: 3, attachments: 2, checklist: { done: 2, total: 8 } },
  { id: 't2', title: 'Landing Page Redesign', description: 'Redesign lại landing page cho StartupHub theo brand mới. Focus conversion rate.', priority: 'low', assigneeIds: [2], lp: 2500, dueDate: '2026-04-15', tags: ['Design', 'UI/UX'], colId: 'backlog', comments: 1, attachments: 5, checklist: { done: 0, total: 5 } },
  { id: 't3', title: 'API Documentation', description: 'Viết tài liệu API cho toàn bộ endpoints của hệ thống. Dùng OpenAPI 3.0 spec.', priority: 'medium', assigneeIds: [3], lp: 1500, dueDate: '2026-04-10', tags: ['Backend', 'Docs'], colId: 'todo', comments: 0, attachments: 1, checklist: { done: 1, total: 4 } },
  { id: 't4', title: 'Mobile Responsive Fix', description: 'Fix các issue responsive trên mobile cho 3 trang quan trọng.', priority: 'high', assigneeIds: [1, 4], lp: 800, dueDate: '2026-04-05', tags: ['Frontend', 'Bug'], colId: 'todo', comments: 5, attachments: 0, checklist: { done: 3, total: 6 } },
  { id: 't5', title: 'Payment API Integration', description: 'Tích hợp VNPAY và Momo vào nền tảng SaaS. Test đầy đủ các luồng thanh toán.', priority: 'urgent', assigneeIds: [3, 4], lp: 8000, dueDate: '2026-04-01', tags: ['Backend', 'Payment'], colId: 'doing', comments: 12, attachments: 3, checklist: { done: 5, total: 10 } },
  { id: 't6', title: 'Mobile App MVP', description: 'Hoàn thiện MVP ứng dụng mobile MedApp. React Native, đầy đủ tính năng core.', priority: 'urgent', assigneeIds: [4, 6], lp: 15000, dueDate: '2026-03-28', tags: ['Mobile', 'React Native'], colId: 'doing', comments: 8, attachments: 7, checklist: { done: 8, total: 14 } },
  { id: 't7', title: 'Observability Stack Setup', description: 'Thiết lập Prometheus, Grafana và alerting cho toàn bộ infrastructure.', priority: 'high', assigneeIds: [5], lp: 10000, dueDate: '2026-04-20', tags: ['DevOps', 'Monitoring'], colId: 'doing', comments: 4, attachments: 2, checklist: { done: 4, total: 8 } },
  { id: 't8', title: '10x Performance Refactor', description: 'Refactor cache layer và query optimization. Target: latency < 100ms cho 95th percentile.', priority: 'high', assigneeIds: [6], lp: 25000, dueDate: '2026-03-25', tags: ['Backend', 'Performance'], colId: 'review', comments: 15, attachments: 4, checklist: { done: 9, total: 10 } },
  { id: 't9', title: 'Dashboard Analytics v2', description: 'Nâng cấp dashboard analytics với real-time charts và export PDF.', priority: 'medium', assigneeIds: [7, 2], lp: 12000, dueDate: '2026-04-02', tags: ['Frontend', 'Analytics'], colId: 'review', comments: 6, attachments: 3, checklist: { done: 7, total: 9 } },
  { id: 't10', title: 'Auth Service Overhaul', description: 'Refactor toàn bộ auth service sang JWT + refresh token rotation. Zero downtime migration.', priority: 'high', assigneeIds: [3], lp: 9000, dueDate: '2026-03-12', tags: ['Backend', 'Security'], colId: 'done', comments: 18, attachments: 5, checklist: { done: 12, total: 12 } },
  { id: 't11', title: 'Brand Identity System', description: 'Tạo design system hoàn chỉnh: colors, typography, components library.', priority: 'low', assigneeIds: [2], lp: 4500, dueDate: '2026-03-08', tags: ['Design', 'Brand'], colId: 'done', comments: 7, attachments: 12, checklist: { done: 15, total: 15 } },
];

// ── Date helpers ──────────────────────────────────────────────────────────
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DOW_VI = ['CN','T2','T3','T4','T5','T6','T7'];

function formatDisplayDate(iso: string): string | null {
  if (!iso || iso === '--') return null;
  // Legacy "DD/MM" format — pass through
  if (iso.includes('/') && iso.length <= 5) return iso;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── DatePickerInput — custom calendar popup ───────────────────────────────
function DatePickerInput({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsed = value && !value.includes('/') ? new Date(value + 'T00:00:00') : null;

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayDate = value ? formatDisplayDate(value) : null;

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const isSelected = (day: number) =>
    !!parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;

  const pad = compact ? '7px 10px' : '9px 12px';
  const radius = compact ? 8 : 10;
  const fsize = compact ? 12 : 13;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: DS.bgCard2,
          border: `1px solid ${open ? 'rgba(6,182,212,0.45)' : DS.border}`,
          borderRadius: radius, padding: pad, cursor: 'pointer', boxSizing: 'border-box',
          color: displayDate ? DS.text2 : DS.text5, fontSize: fsize,
          transition: 'border-color 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Calendar size={compact ? 12 : 13} style={{ color: displayDate ? DS.blue : DS.text5, flexShrink: 0 }} />
          <span style={{ fontFamily: displayDate ? DS.mono : DS.body }}>{displayDate ?? 'Chọn ngày...'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {value && (
            <span
              onClick={e => { e.stopPropagation(); onChange(''); }}
              style={{ color: DS.text5, display: 'flex', cursor: 'pointer', padding: 2, borderRadius: 4 }}
            >
              <X size={10} />
            </span>
          )}
          <ChevronDown size={12} style={{ color: DS.text5, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {/* Calendar popup */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: DS.bgCard,
          border: '1px solid rgba(6,182,212,0.35)',
          borderRadius: 14, padding: '14px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(6,182,212,0.08)',
          minWidth: 248,
        }}>
          {/* Month/Year nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: DS.text3, cursor: 'pointer', width: 26, height: 26, borderRadius: 7, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, fontWeight: 700, letterSpacing: '0.06em' }}>
              {MONTHS_VI[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: DS.text3, cursor: 'pointer', width: 26, height: 26, borderRadius: 7, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* DOW headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DOW_VI.map(d => (
              <div key={d} style={{ textAlign: 'center', color: DS.text5, fontSize: 9, fontFamily: DS.mono, padding: '2px 0', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const tod = isToday(day);
              const sel = isSelected(day);
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  style={{
                    width: '100%', aspectRatio: '1', border: 'none', cursor: 'pointer', borderRadius: 7,
                    fontSize: 11, fontFamily: DS.mono,
                    background: sel
                      ? 'linear-gradient(135deg, rgba(6,182,212,0.75), rgba(139,92,246,0.75))'
                      : tod ? 'rgba(6,182,212,0.13)' : 'none',
                    color: sel ? '#fff' : tod ? DS.blue : DS.text3,
                    outline: tod && !sel ? `1px solid rgba(6,182,212,0.4)` : 'none',
                    fontWeight: sel || tod ? 700 : 400,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = sel
                      ? 'linear-gradient(135deg, rgba(6,182,212,0.75), rgba(139,92,246,0.75))'
                      : tod ? 'rgba(6,182,212,0.13)' : 'none';
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => { onChange(isoToday()); setOpen(false); }}
              style={{ background: 'none', border: 'none', color: DS.blue, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono }}
            >
              Hôm nay
            </button>
            {value && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                style={{ background: 'none', border: 'none', color: DS.red, fontSize: 11, cursor: 'pointer' }}
              >
                Xóa ngày
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Member Avatar ─────────────────────────────────────────────────────────
function MemberAvatar({ memberId, size = 22 }: { memberId: number; size?: number }) {
  const m = members.find(x => x.id === memberId);
  if (!m) return null;
  const rc = RANKS[m.rank];
  return (
    <div
      title={m.name}
      style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        border: `1.5px solid ${rc.color}`, boxShadow: `0 0 5px ${rc.glowColor}`,
      }}
    >
      <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

// ── Assignee Picker — scales to 100s of members ────────────────────────────
function AssigneePicker({
  assigneeIds,
  onToggle,
}: {
  assigneeIds: number[];
  onToggle: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  const selectedMembers = members.filter(m => assigneeIds.includes(m.id));

  return (
    <div>
      {/* Label + count */}
      <div className="flex items-center justify-between mb-2">
        <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>
          NGƯỜI PHỤ TRÁCH
        </label>
        {assigneeIds.length > 0 && (
          <span style={{
            fontSize: 10, fontFamily: DS.mono,
            color: DS.blue, background: 'rgba(59,130,246,0.12)',
            padding: '1px 8px', borderRadius: 10,
            border: '1px solid rgba(59,130,246,0.25)',
          }}>
            {assigneeIds.length} đã chn
          </span>
        )}
      </div>

      {/* Selected chips row */}
      {selectedMembers.length > 0 && (
        <div
          className="flex gap-1.5 mb-2 scrollbar-zen"
          style={{
            overflowX: 'auto', paddingBottom: 4,
            flexWrap: 'nowrap',
          }}
        >
          {selectedMembers.map(m => {
            const rc = RANKS[m.rank];
            return (
              <div
                key={m.id}
                className="flex items-center gap-1 flex-shrink-0"
                style={{
                  background: `${rc.color}18`,
                  border: `1px solid ${rc.color}50`,
                  borderRadius: 20, padding: '3px 8px 3px 4px',
                }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${rc.color}`, flexShrink: 0 }}>
                  <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ color: rc.color, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {m.name.split(' ').slice(-1)[0]}
                </span>
                <button
                  onClick={() => onToggle(m.id)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: rc.color, display: 'flex', alignItems: 'center', opacity: 0.7, marginLeft: 1 }}
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle dropdown */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: DS.bgCard2, border: `1px solid ${open ? 'rgba(6,182,212,0.4)' : DS.border}`,
          borderRadius: open ? '10px 10px 0 0' : 10,
          padding: '8px 12px', cursor: 'pointer', color: DS.text4, fontSize: 12,
          transition: 'border-color 0.2s',
        }}
      >
        <div className="flex items-center gap-2">
          <User size={13} style={{ color: DS.text5 }} />
          <span>{assigneeIds.length === 0 ? 'Chọn nhân sự...' : `Chỉnh sửa danh sách`}</span>
        </div>
        <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          background: DS.bgCard2,
          border: `1px solid rgba(6,182,212,0.4)`,
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
        }}>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${DS.border}` }}>
            <Search size={12} style={{ color: DS.text5, flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo tên..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: DS.text2, fontSize: 12, fontFamily: DS.body,
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: DS.text5, cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={11} />
              </button>
            )}
          </div>

          {/* Member list — scrollable */}
          <div
            className="scrollbar-zen"
            style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}
          >
            {filtered.length === 0 ? (
              <div style={{ color: DS.text5, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                Không tìm thấy nhân sự
              </div>
            ) : (
              filtered.map(m => {
                const rc = RANKS[m.rank];
                const selected = assigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => onToggle(m.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 12px', background: selected ? `${rc.color}12` : 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = selected ? `${rc.color}12` : 'none';
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${selected ? rc.color : DS.border}` }}>
                        <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      {selected && (
                        <div style={{
                          position: 'absolute', bottom: -1, right: -1,
                          width: 11, height: 11, borderRadius: '50%',
                          background: rc.color, border: `1.5px solid ${DS.bgCard2}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <X size={6} color="#000" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Name + rank */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: selected ? rc.color : DS.text2, fontSize: 12, fontWeight: selected ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name}
                      </div>
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{rc.label}</div>
                    </div>

                    {/* Rank dot */}
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: rc.color, flexShrink: 0, boxShadow: `0 0 6px ${rc.color}` }} />
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: select all / clear */}
          <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
              {filtered.length} kết quả
            </span>
            <div className="flex gap-3">
              {assigneeIds.length > 0 && (
                <button
                  onClick={() => assigneeIds.forEach(id => onToggle(id))}
                  style={{ background: 'none', border: 'none', color: DS.red, fontSize: 11, cursor: 'pointer', padding: 0 }}
                >
                  Xóa hết
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: DS.blue, fontSize: 11, cursor: 'pointer', padding: 0 }}
              >
                Xong ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task Modal ─────────────────────────────────────────────────────────────
function TaskModal({
  task, onClose, onSave, onDelete, columns,
}: {
  task: Task; onClose: () => void;
  onSave: (t: Task) => void; onDelete: (id: string) => void;
  columns: Column[];
}) {
  const [draft, setDraft] = useState<Task>({ ...task });

  const handleSave = () => { onSave(draft); onClose(); };
  const handleDelete = () => { onDelete(task.id); onClose(); };

  const toggleAssignee = (id: number) => {
    setDraft(d => ({
      ...d,
      assigneeIds: d.assigneeIds.includes(id)
        ? d.assigneeIds.filter(x => x !== id)
        : [...d.assigneeIds, id],
    }));
  };

  const pc = PRIORITY_CFG[draft.priority];
  const col = columns.find(c => c.id === draft.colId)!;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: pc.bg, border: `1px solid ${pc.color}30` }}>
              <AlertTriangle size={10} style={{ color: pc.color }} />
              <span style={{ color: pc.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{pc.label.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${col.color}15`, border: `1px solid ${col.color}30` }}>
              <span style={{ color: col.color, fontSize: 11 }}>{col.icon}</span>
              <span style={{ color: col.color, fontSize: 10, fontFamily: DS.mono }}>{col.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: DS.red, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={12} /> Xóa
            </button>
            <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>TIÊU ĐỀ</label>
            <input
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: DS.text, fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>MÔ TẢ</label>
            <textarea
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              rows={3}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: DS.text3, fontSize: 14, lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: DS.body }}
            />
          </div>

          {/* Row: Priority + Column + Due Date + LP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>ƯU TIÊN</label>
              <select
                value={draft.priority}
                onChange={e => setDraft(d => ({ ...d, priority: e.target.value as Priority }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: PRIORITY_CFG[draft.priority].color, fontSize: 13, outline: 'none', cursor: 'pointer' }}
              >
                {Object.entries(PRIORITY_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>CỘT</label>
              <select
                value={draft.colId}
                onChange={e => setDraft(d => ({ ...d, colId: e.target.value }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text2, fontSize: 13, outline: 'none', cursor: 'pointer' }}
              >
                {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>DEADLINE</label>
              <DatePickerInput
                value={draft.dueDate}
                onChange={v => setDraft(d => ({ ...d, dueDate: v }))}
                compact
              />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>LP THƯỞNG</label>
              <input
                type="number"
                value={draft.lp}
                onChange={e => setDraft(d => ({ ...d, lp: Number(e.target.value) }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.blue, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: DS.mono }}
              />
            </div>
          </div>

          {/* Assignees */}
          <AssigneePicker
            assigneeIds={draft.assigneeIds}
            onToggle={id => setDraft(d => ({
              ...d,
              assigneeIds: d.assigneeIds.includes(id)
                ? d.assigneeIds.filter(x => x !== id)
                : [...d.assigneeIds, id],
            }))}
          />

          {/* Tags */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>TAGS (phân cách bằng dấu phẩy)</label>
            <input
              value={draft.tags.join(', ')}
              onChange={e => setDraft(d => ({ ...d, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text2, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
            <button onClick={handleSave} style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(129,140,248,0.3)' }}>
              Lưu thay đổi
            </button>
            <button onClick={onClose} style={{ padding: '11px 20px', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: 'pointer', fontSize: 14 }}>
              Hủy
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Add Task Modal ─────────────────────────────────────────────────────────
function AddTaskModal({ colId, onAdd, onClose }: { colId: string; onAdd: (t: Task) => void; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [lp, setLp] = useState(1000);
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      id: `t${Date.now()}`,
      title: title.trim(),
      description: '',
      priority,
      assigneeIds,
      lp,
      dueDate: dueDate || '--',
      tags: [],
      colId,
      comments: 0, attachments: 0,
      checklist: { done: 0, total: 0 },
    });
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <span style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>+ Thêm task mới</span>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tiêu đề task..."
            style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>ƯU TIÊN</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 10px', color: PRIORITY_CFG[priority].color, fontSize: 12, outline: 'none' }}>
                {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>LP</label>
              <input type="number" value={lp} onChange={e => setLp(Number(e.target.value))} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 10px', color: DS.blue, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: DS.mono }} />
            </div>
          </div>
          <div>
            <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>NGƯỜI PH TRÁCH</label>
            <div className="flex flex-wrap gap-1.5">
              {members.slice(0, 7).map(m => {
                const rc = RANKS[m.rank];
                const sel = assigneeIds.includes(m.id);
                return (
                  <button key={m.id} onClick={() => setAssigneeIds(prev => sel ? prev.filter(x => x !== m.id) : [...prev, m.id])} title={m.name}
                    style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: sel ? `2px solid ${rc.color}` : `2px solid ${DS.border}`, cursor: 'pointer', opacity: sel ? 1 : 0.5, padding: 0 }}>
                    <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>DEADLINE</label>
            <DatePickerInput
              value={dueDate}
              onChange={v => setDueDate(v)}
              compact
            />
          </div>
          <button onClick={handleAdd} style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Thêm task
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Draggable Task Card ────────────────────────────────────────────────────
function TaskCard({ task, colColor, onEdit }: { task: Task; colColor: string; onEdit: (t: Task) => void }) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: task.id, fromColId: task.colId },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  const pc = PRIORITY_CFG[task.priority];
  const hasChecklist = task.checklist.total > 0;
  const progress = hasChecklist ? Math.round((task.checklist.done / task.checklist.total) * 100) : 0;

  return (
    <motion.div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      layout
      style={{
        opacity: isDragging ? 0.35 : 1,
        cursor: 'grab',
        background: DS.bgCard2,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        padding: '12px',
        userSelect: 'none',
      }}
      whileHover={{ borderColor: `${colColor}50`, boxShadow: `0 4px 20px rgba(0,0,0,0.3)`, y: -2 }}
      onClick={() => onEdit(task)}
    >
      {/* Priority + tags row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span style={{ fontSize: 9, fontFamily: DS.mono, fontWeight: 700, color: pc.color, background: pc.bg, padding: '2px 6px', borderRadius: 4 }}>
          {pc.label.toUpperCase()}
        </span>
        {task.tags.slice(0, 2).map(t => (
          <span key={t} style={{ fontSize: 9, color: DS.text5, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontFamily: DS.mono }}>{t}</span>
        ))}
      </div>

      {/* Title */}
      <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.45, marginBottom: 8 }}>{task.title}</div>

      {/* Checklist progress */}
      {hasChecklist && (
        <div className="mb-2">
          <div style={{ height: 3, background: DS.border, borderRadius: 2, marginBottom: 3 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? DS.green : `linear-gradient(90deg, ${DS.blue}, ${DS.purple})`, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{task.checklist.done}/{task.checklist.total}</div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        {/* Assignees */}
        <div className="flex items-center" style={{ gap: -4 }}>
          {task.assigneeIds.slice(0, 3).map((id, idx) => (
            <div key={id} style={{ marginLeft: idx > 0 ? -6 : 0, zIndex: 3 - idx }}>
              <MemberAvatar memberId={id} size={22} />
            </div>
          ))}
          {task.assigneeIds.length > 3 && (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: DS.bgCard, border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -6, fontSize: 9, color: DS.text4, fontFamily: DS.mono }}>
              +{task.assigneeIds.length - 3}
            </div>
          )}
          {task.assigneeIds.length === 0 && (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: DS.bgCard, border: `1px dashed ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={10} style={{ color: DS.text5 }} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {task.comments > 0 && (
            <div className="flex items-center gap-1" style={{ color: DS.text5, fontSize: 10 }}>
              <MessageSquare size={10} /> {task.comments}
            </div>
          )}
          {task.attachments > 0 && (
            <div className="flex items-center gap-1" style={{ color: DS.text5, fontSize: 10 }}>
              <Paperclip size={10} /> {task.attachments}
            </div>
          )}
          <div className="flex items-center gap-1" style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono }}>
            <Zap size={9} /> {task.lp >= 1000 ? `${(task.lp / 1000).toFixed(1)}K` : task.lp}
          </div>
          {(() => {
            const d = formatDisplayDate(task.dueDate);
            return d ? (
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={9} /> {d}
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </motion.div>
  );
}

// ── Droppable Column ───────────────────────────────────────────────────────
function KanbanColumn({
  col, tasks, onDrop, onEdit, onAddClick,
}: {
  col: Column; tasks: Task[];
  onDrop: (taskId: string, fromColId: string, toColId: string) => void;
  onEdit: (t: Task) => void;
  onAddClick: (colId: string) => void;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: string; fromColId: string }) => {
      if (item.fromColId !== col.id) {
        onDrop(item.id, item.fromColId, col.id);
      }
    },
    collect: m => ({ isOver: m.isOver() }),
  });

  const totalLP = tasks.reduce((s, t) => s + t.lp, 0);

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      style={{
        minWidth: 260, maxWidth: 280, flex: '1 0 260px',
        background: isOver ? `${col.color}06` : DS.bgCard,
        border: isOver ? `1px solid ${col.color}40` : `1px solid ${DS.border}`,
        borderRadius: 16,
        transition: 'all 0.2s ease',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-2">
          <span style={{ color: col.color, fontSize: 14 }}>{col.icon}</span>
          <span style={{ color: col.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700, letterSpacing: '0.08em' }}>{col.label.toUpperCase()}</span>
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, background: `${col.color}15`, padding: '1px 7px', borderRadius: 10 }}>{tasks.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {totalLP > 0 && (
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono }}>{totalLP >= 1000 ? `${(totalLP / 1000).toFixed(0)}K` : totalLP} LP</span>
          )}
          <button
            onClick={() => onAddClick(col.id)}
            style={{ background: `${col.color}15`, border: `1px solid ${col.color}30`, color: col.color, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div
        className="flex-1 p-3 space-y-2.5 overflow-y-auto scrollbar-zen"
        style={{ maxHeight: 600, overflowX: 'hidden', minWidth: 0 }}
      >
        <AnimatePresence>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} colColor={col.color} onEdit={onEdit} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-8"
            style={{ border: `1px dashed ${DS.border}`, borderRadius: 10, opacity: 0.5, cursor: 'pointer' }}
            onClick={() => onAddClick(col.id)}
          >
            <Plus size={16} style={{ color: col.color, marginBottom: 6 }} />
            <span style={{ color: DS.text5, fontSize: 11 }}>Kéo thả hoặc thêm task</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Kanban Board ─────────────────────────────────────────────────────
export function KanbanBoard({
  projectTitle,
  projectColor,
  onBack,
  initialTasks: propTasks,
}: {
  projectTitle?: string;
  projectColor?: string;
  onBack?: () => void;
  initialTasks?: Task[];
} = {}) {
  const [tasks, setTasks] = useState<Task[]>(propTasks ?? INITIAL_TASKS);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingToCol, setAddingToCol] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');

  const moveTask = useCallback((taskId: string, fromColId: string, toColId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, colId: toColId } : t));
  }, []);

  const handleSave = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAdd = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  };

  const filtered = tasks.filter(t =>
    (filterPriority === 'all' || t.priority === filterPriority) &&
    t.title.toLowerCase().includes(searchQ.toLowerCase())
  );

  const getColTasks = (colId: string) => filtered.filter(t => t.colId === colId);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.colId === 'done').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.colId !== 'done').length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {/* Board header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div>
            {onBack && (
              <button onClick={onBack}
                className="flex items-center gap-1.5 mb-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4, fontSize: 11, fontFamily: DS.mono, padding: 0 }}>
                ← Quay lại danh sách dự án
              </button>
            )}
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── KANBAN DỰ ÁN</div>
            {projectTitle && (
              <div style={{ color: projectColor ?? DS.blue, fontSize: 16, fontWeight: 700, marginTop: 2, fontFamily: DS.heading }}>{projectTitle}</div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span style={{ color: DS.text4, fontSize: 12 }}>
                <span style={{ color: DS.green, fontWeight: 700 }}>{doneTasks}</span>/{totalTasks} hoàn thành
              </span>
              {urgentTasks > 0 && (
                <span style={{ color: DS.red, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> {urgentTasks} task khẩn
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Tìm task..."
                style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: 140, fontFamily: DS.body }}
              />
            </div>
            {/* Filter priority */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 13, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Tất cả ưu tiên</option>
              {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {/* Add task */}
            <button
              onClick={() => setAddingToCol('todo')}
              style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <Plus size={14} /> Thêm task
            </button>
          </div>
        </div>

        {/* Columns */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-zen">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              tasks={getColTasks(col.id)}
              onDrop={moveTask}
              onEdit={setEditingTask}
              onAddClick={setAddingToCol}
            />
          ))}
        </div>
      </div>

      {/* Task Edit Modal */}
      <AnimatePresence>
        {editingTask && (
          <TaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleSave}
            onDelete={handleDelete}
            columns={COLUMNS}
          />
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {addingToCol && (
          <AddTaskModal
            colId={addingToCol}
            onAdd={handleAdd}
            onClose={() => setAddingToCol(null)}
          />
        )}
      </AnimatePresence>
    </DndProvider>
  );
}