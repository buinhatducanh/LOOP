/**
 * KanbanHub — Hệ thống quản lý dự án 3 cấp
 * Cấp 1: Hub tổng quan → Phòng ban + thống kê toàn công ty
 * Cấp 2: Phòng ban → Danh sách dự án (List/Gantt view) + Workload
 * Cấp 3: Dự án → KanbanBoard (Drag & Drop tasks)
 */
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderKanban, Plus, ChevronRight, Search, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, Target,
  BarChart3, ArrowLeft, Edit3, Trash2, X,
  Megaphone, Monitor, Film, Calendar, LayoutList,
  Users, Zap, Save, ChevronDown, Loader2,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { members as seedMembers, RANKS } from '../team/memberData';
import { KanbanBoard } from './KanbanBoard';
import { projectsService } from '../../../api/projects.service';
import { teamService } from '../../../api/team.service';

// ── Types ──────────────────────────────────────────────────────────────────

type ProjectStatus = 'active' | 'planning' | 'completed' | 'paused' | 'cancelled';
type ProjectPriority = 'urgent' | 'high' | 'medium' | 'low';

interface KanbanProject {
  id: string;
  deptId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  deadline: string;
  progress: number;
  leadId: string | number; // BE: CUID string, seed: number
  memberIds: (string | number)[]; // mixed bridge type
  taskStats: { total: number; done: number; inProgress: number; urgent: number };
  tags: string[];
  budget?: number;
  color: string;
  clientName?: string;
}

interface KanbanMember {
  id: string | number;
  name: string;
  img: string;
  rank: keyof typeof RANKS;
}

interface Department {
  id: string;
  name: string;
  icon: ReactNode;
  emoji: string;
  color: string;
  description: string;
  headId: string | number; // BE: CUID, seed: number
}

// ── Config ─────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<ProjectPriority, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Khẩn cấp',   color: DS.red,   bg: 'rgba(239,68,68,0.12)' },
  high:   { label: 'Cao',         color: DS.amber, bg: 'rgba(245,158,11,0.12)' },
  medium: { label: 'Trung bình',  color: DS.blue,  bg: 'rgba(59,130,246,0.12)' },
  low:    { label: 'Thấp',        color: DS.text4, bg: 'rgba(100,116,139,0.12)' },
};

const STATUS_CFG: Record<ProjectStatus, { label: string; color: string; icon: ReactNode }> = {
  active:    { label: 'Đang thực hiện', color: DS.green,  icon: <TrendingUp size={11} /> },
  planning:  { label: 'Lên kế hoạch',  color: DS.blue,   icon: <Target size={11} /> },
  completed: { label: 'Hoàn thành',    color: DS.text4,  icon: <CheckCircle2 size={11} /> },
  paused:    { label: 'Tạm dừng',      color: DS.amber,  icon: <Clock size={11} /> },
  cancelled: { label: 'Đã hủy',        color: DS.red,    icon: <X size={11} /> },
};

const PROJECT_COLORS = [
  DS.blue, DS.purple, DS.cyan, DS.green, DS.amber, DS.red,
  '#EC4899', '#8B5CF6', '#06B6D4', '#10B981',
];

// ── Departments ─────────────────────────────────────────────────────────────

const DEPARTMENTS: Department[] = [
  {
    id: 'marketing', name: 'Phòng Marketing',
    icon: <Megaphone size={22} />, emoji: '📣', color: DS.amber,
    description: 'Chiến lược thương hiệu, nội dung, SEO và quảng cáo trực tuyến',
    headId: 2,
  },
  {
    id: 'it', name: 'Phòng IT',
    icon: <Monitor size={22} />, emoji: '💻', color: DS.blue,
    description: 'Phát triển phần mềm, hạ tầng hệ thống và bảo mật',
    headId: 3,
  },
  {
    id: 'media', name: 'Phòng Media',
    icon: <Film size={22} />, emoji: '🎬', color: DS.purple,
    description: 'Sản xuất nội dung video, thiết kế đồ hoạ và photography',
    headId: 7,
  },
];

// ── Initial Projects ─────────────────────────────────────────────────────────

const INIT_PROJECTS: KanbanProject[] = [
  // Marketing
  { id: 'mkt-1', deptId: 'marketing', name: 'Chiến dịch Brand Q2/2026', description: 'Toàn bộ chiến lược thương hiệu LOOP Q2: TVC, digital ads, KOL partnership và event offline tại TP.HCM & Hà Nội.', status: 'active', priority: 'high', startDate: '2026-04-01', deadline: '2026-06-30', progress: 38, leadId: 2, memberIds: [1, 2, 5, 8], taskStats: { total: 24, done: 9, inProgress: 8, urgent: 3 }, tags: ['Brand', 'Digital', 'KOL', 'Event'], color: DS.amber, budget: 120_000_000, clientName: 'Nội bộ' },
  { id: 'mkt-2', deptId: 'marketing', name: 'SEO & Content Hub 2026', description: 'Xây dựng hệ thống blog, landing page SEO và content calendar cho toàn bộ dịch vụ LOOP Solutions.', status: 'active', priority: 'medium', startDate: '2026-01-01', deadline: '2026-12-31', progress: 55, leadId: 5, memberIds: [2, 5, 9], taskStats: { total: 36, done: 20, inProgress: 10, urgent: 1 }, tags: ['SEO', 'Content', 'Blog'], color: DS.green, clientName: 'Nội bộ' },
  { id: 'mkt-3', deptId: 'marketing', name: 'Social Media Automation', description: 'Thiết lập hệ thống tự động đăng bài, lên lịch content và báo cáo engagement trên Facebook, LinkedIn, TikTok.', status: 'planning', priority: 'medium', startDate: '2026-04-15', deadline: '2026-06-15', progress: 12, leadId: 8, memberIds: [8, 2], taskStats: { total: 14, done: 2, inProgress: 4, urgent: 0 }, tags: ['Social', 'Automation'], color: DS.cyan, clientName: 'Nội bộ' },
  { id: 'mkt-4', deptId: 'marketing', name: 'Email Marketing Pipeline', description: 'Xây dựng funnel email marketing đầy đủ: welcome series, nurture sequence và retention campaign cho 5K+ subscribers.', status: 'completed', priority: 'low', startDate: '2026-01-10', deadline: '2026-03-01', progress: 100, leadId: 2, memberIds: [2, 5], taskStats: { total: 18, done: 18, inProgress: 0, urgent: 0 }, tags: ['Email', 'Funnel', 'CRM'], color: DS.text4, clientName: 'Nội bộ' },
  // IT
  { id: 'it-1', deptId: 'it', name: 'LOOP OS v2.0 Core Platform', description: 'Phát triển phiên bản 2.0 của hệ điều hành LOOP: microservices, real-time sync, offline-first với PWA.', status: 'active', priority: 'urgent', startDate: '2026-02-01', deadline: '2026-07-31', progress: 28, leadId: 3, memberIds: [3, 4, 6, 10, 11], taskStats: { total: 58, done: 16, inProgress: 20, urgent: 8 }, tags: ['React', 'Node.js', 'PWA'], color: DS.blue, budget: 350_000_000, clientName: 'Nội bộ' },
  { id: 'it-2', deptId: 'it', name: 'VNRetail Platform v3', description: 'Phát triển pha 2 nền tảng VNRetail: thêm module B2B, multi-warehouse và AI inventory prediction.', status: 'active', priority: 'urgent', startDate: '2026-03-01', deadline: '2026-05-30', progress: 45, leadId: 6, memberIds: [3, 4, 6, 14], taskStats: { total: 42, done: 19, inProgress: 14, urgent: 5 }, tags: ['SaaS', 'E-commerce', 'AI'], color: DS.purple, budget: 175_000_000, clientName: 'VNRetail JSC' },
  { id: 'it-3', deptId: 'it', name: 'Security & Zero-Trust Infra', description: 'Nâng cấp toàn bộ hạ tầng bảo mật: Zero-trust network, WAF, DDoS protection và SOC 2 compliance.', status: 'active', priority: 'high', startDate: '2026-03-15', deadline: '2026-06-15', progress: 32, leadId: 10, memberIds: [10, 11, 4], taskStats: { total: 30, done: 10, inProgress: 12, urgent: 4 }, tags: ['Security', 'DevOps'], color: DS.red, clientName: 'Nội bộ' },
  { id: 'it-4', deptId: 'it', name: 'Analytics Engine Next-Gen', description: 'Xây dựng engine analytics real-time mới: ClickHouse, streaming pipeline và AI anomaly detection.', status: 'planning', priority: 'medium', startDate: '2026-06-01', deadline: '2026-09-30', progress: 8, leadId: 14, memberIds: [14, 6, 3], taskStats: { total: 20, done: 2, inProgress: 3, urgent: 0 }, tags: ['ClickHouse', 'AI', 'Analytics'], color: DS.cyan, clientName: 'Nội bộ' },
  { id: 'it-5', deptId: 'it', name: 'MedApp Vietnam v2', description: 'Cập nhật lớn MedApp: AI triage chatbot, telemedicine dashboard, tích hợp BHYT API và iOS HealthKit.', status: 'active', priority: 'high', startDate: '2026-04-01', deadline: '2026-06-30', progress: 22, leadId: 4, memberIds: [4, 6, 15], taskStats: { total: 35, done: 8, inProgress: 12, urgent: 3 }, tags: ['React Native', 'AI', 'Health'], color: DS.green, budget: 120_000_000, clientName: 'HealthTech Vietnam' },
  // Media
  { id: 'media-1', deptId: 'media', name: 'LOOP Brand Film 2026', description: 'Sản xuất phim thương hiệu LOOP Solutions: 3 phút TVC + 15 short clips cho mạng xã hội.', status: 'active', priority: 'high', startDate: '2026-03-01', deadline: '2026-05-01', progress: 60, leadId: 7, memberIds: [7, 12, 13], taskStats: { total: 22, done: 13, inProgress: 6, urgent: 2 }, tags: ['Video', 'TVC', 'Brand'], color: DS.purple, budget: 85_000_000, clientName: 'Nội bộ' },
  { id: 'media-2', deptId: 'media', name: 'Design System Library v2', description: 'Nâng cấp thư viện design system: bổ sung 200+ component mới, dark/light mode, Figma library sync.', status: 'active', priority: 'medium', startDate: '2026-03-15', deadline: '2026-06-30', progress: 42, leadId: 13, memberIds: [7, 12, 13], taskStats: { total: 28, done: 12, inProgress: 9, urgent: 1 }, tags: ['Figma', 'Design System', 'UI'], color: DS.blue, clientName: 'Nội bộ' },
  { id: 'media-3', deptId: 'media', name: 'Client Case Study Series', description: 'Sản xuất 6 video case study dạng mini-documentary về các dự án nổi bật: VNRetail, MedApp, FinDash.', status: 'planning', priority: 'medium', startDate: '2026-06-01', deadline: '2026-08-31', progress: 10, leadId: 12, memberIds: [12, 7], taskStats: { total: 18, done: 2, inProgress: 3, urgent: 0 }, tags: ['Documentary', 'Case Study'], color: DS.amber, clientName: 'Nội bộ' },
  { id: 'media-4', deptId: 'media', name: 'Photography Assets 2026', description: 'Chụp ảnh team, văn phòng và event LOOP Summit 2026.', status: 'completed', priority: 'low', startDate: '2026-02-01', deadline: '2026-03-15', progress: 100, leadId: 7, memberIds: [7, 12], taskStats: { total: 12, done: 12, inProgress: 0, urgent: 0 }, tags: ['Photography', 'Event'], color: DS.text4, clientName: 'Nội bộ' },
];

// ── Navigation ───────────────────────────────────────────────────────────────

type NavState =
  | { view: 'hub' }
  | { view: 'dept'; deptId: string }
  | { view: 'board'; projectId: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function MemberAvatar({ id, size = 28 }: { id: string | number; size?: number }) {
  const m = seedMembers.find(x => String(x.id) === String(id));
  if (!m) return null;
  const rc = RANKS[m.rank];
  return (
    <div title={m.name} style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${rc.color}`, boxShadow: `0 0 5px ${rc.glowColor}` }}>
      <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function ProgressBar({ value, color, height = 4 }: { value: number; color: string; height?: number }) {
  return (
    <div style={{ height, background: DS.border, borderRadius: 99, overflow: 'hidden', width: '100%' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function isOverdue(iso: string, status: ProjectStatus) {
  if (!iso || status === 'completed' || status === 'cancelled') return false;
  return new Date(iso + 'T00:00:00') < new Date();
}

// ── Create / Edit Project Modal ───────────────────────────────────────────────

const EMPTY_PROJECT = (): Omit<KanbanProject, 'id'> => ({
  deptId: 'it',
  name: '',
  description: '',
  status: 'planning',
  priority: 'medium',
  startDate: '',
  deadline: '',
  progress: 0,
  leadId: Number(seedMembers[0]?.id ?? 1),
  memberIds: [],
  taskStats: { total: 0, done: 0, inProgress: 0, urgent: 0 },
  tags: [],
  color: DS.blue,
  clientName: '',
  budget: undefined,
});

function ProjectModal({
  project,
  deptId,
  onSave,
  onClose,
}: {
  project?: KanbanProject;
  deptId: string;
  onSave: (p: KanbanProject) => void;
  onClose: () => void;
}) {
  const isNew = !project;
  const [draft, setDraft] = useState<Omit<KanbanProject, 'id'>>(
    project ? { ...project } : { ...EMPTY_PROJECT(), deptId }
  );
  const [tagInput, setTagInput] = useState(project?.tags.join(', ') ?? '');
  const [memberOpen, setMemberOpen] = useState(false);

  const set = <K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) =>
    setDraft(d => ({ ...d, [key]: val }));

  const toggleMember = (id: string | number) =>
    set('memberIds', draft.memberIds.includes(id)
      ? draft.memberIds.filter(x => x !== id)
      : [...draft.memberIds, id]);

  const handleSave = () => {
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      id: project?.id ?? `proj-${Date.now()}`,
      tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
    } as KanbanProject);
    onClose();
  };

  const inputStyle = {
    width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: '9px 12px', color: DS.text2, fontSize: 13,
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: DS.body,
  };
  const labelStyle = {
    color: DS.text4, fontSize: 10, fontFamily: DS.mono,
    letterSpacing: '0.12em', display: 'block' as const, marginBottom: 5,
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(10px)' }} />
      <motion.div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '90vh', overflowY: 'auto' }}
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sticky top-0 z-10"
          style={{ background: DS.bgCard, borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>
              {isNew ? '── TẠO DỰ ÁN MỚI' : '── CHỈNH SỬA DỰ ÁN'}
            </div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              {isNew ? 'Dự án mới' : draft.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label style={labelStyle}>TÊN DỰ ÁN *</label>
            <input value={draft.name} onChange={e => set('name', e.target.value)}
              placeholder="Nhập tên dự án..." style={{ ...inputStyle, fontSize: 15, fontWeight: 700, color: DS.text }} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>MÔ TẢ</label>
            <textarea value={draft.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Mô tả ngắn về mục tiêu và phạm vi dự án..."
              style={{ ...inputStyle, lineHeight: 1.6, resize: 'vertical' as const }} />
          </div>

          {/* Row 1: Dept + Status + Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>PHÒNG BAN</label>
              <select value={draft.deptId} onChange={e => set('deptId', e.target.value)} style={inputStyle}>
                {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>TRẠNG THÁI</label>
              <select value={draft.status} onChange={e => set('status', e.target.value as ProjectStatus)} style={{ ...inputStyle, color: STATUS_CFG[draft.status].color }}>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ƯU TIÊN</label>
              <select value={draft.priority} onChange={e => set('priority', e.target.value as ProjectPriority)} style={{ ...inputStyle, color: PRIORITY_CFG[draft.priority].color }}>
                {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>NGÀY BẮT ĐẦU</label>
              <input type="date" value={draft.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>DEADLINE</label>
              <input type="date" value={draft.deadline} onChange={e => set('deadline', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Row 3: Progress + Budget + Client */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>TIẾN ĐỘ ({draft.progress}%)</label>
              <input type="range" min={0} max={100} value={draft.progress}
                onChange={e => set('progress', Number(e.target.value))}
                style={{ width: '100%', accentColor: draft.color, cursor: 'pointer', marginTop: 8 }} />
            </div>
            <div>
              <label style={labelStyle}>NGÂN SÁCH (VNĐ)</label>
              <input type="number" value={draft.budget ?? ''} onChange={e => set('budget', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="VD: 50000000" style={{ ...inputStyle, color: DS.green, fontFamily: DS.mono }} />
            </div>
            <div>
              <label style={labelStyle}>KHÁCH HÀNG</label>
              <input value={draft.clientName ?? ''} onChange={e => set('clientName', e.target.value)}
                placeholder="Tên khách hàng..." style={inputStyle} />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label style={labelStyle}>MÀU DỰ ÁN</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: draft.color === c ? `3px solid #fff` : `3px solid transparent`, cursor: 'pointer', boxShadow: draft.color === c ? `0 0 12px ${c}` : 'none', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>

          {/* Lead + Members */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>TRƯỞNG DỰ ÁN</label>
              <select value={String(draft.leadId)} onChange={e => set('leadId', Number(e.target.value))} style={inputStyle}>
                {seedMembers.slice(0, 20).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>THÀNH VIÊN ({draft.memberIds.length} đã chọn)</label>
              <button type="button" onClick={() => setMemberOpen(o => !o)}
                className="w-full flex items-center justify-between"
                style={{ ...inputStyle, cursor: 'pointer', color: DS.text4 }}>
                <span>{draft.memberIds.length === 0 ? 'Chọn thành viên...' : `${draft.memberIds.length} người`}</span>
                <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: memberOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
          </div>

          {/* Member dropdown */}
          {memberOpen && (
            <div className="rounded-xl p-3" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <div className="flex flex-wrap gap-2">
                {seedMembers.slice(0, 20).map(m => {
                  const rc = RANKS[m.rank];
                  const sel = draft.memberIds.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggleMember(m.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                      style={{ background: sel ? `${rc.color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? rc.color + '50' : DS.border}`, cursor: 'pointer' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${rc.color}` }}>
                        <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ color: sel ? rc.color : DS.text4, fontSize: 11 }}>{m.name.split(' ').slice(-1)[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label style={labelStyle}>TAGS (phân cách bằng dấu phẩy)</label>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              placeholder="VD: React, Design, SEO..." style={inputStyle} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
            <button onClick={handleSave}
              className="flex items-center justify-center gap-2 flex-1"
              style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(129,140,248,0.25)', opacity: draft.name.trim() ? 1 : 0.5 }}>
              <Save size={14} /> {isNew ? 'Tạo dự án' : 'Lưu thay đổi'}
            </button>
            <button onClick={onClose}
              style={{ padding: '11px 20px', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: 'pointer', fontSize: 14 }}>
              Hủy
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ nav, projects, onNavigate }: {
  nav: NavState;
  projects: KanbanProject[];
  onNavigate: (n: NavState) => void;
}) {
  const dept = nav.view !== 'hub'
    ? DEPARTMENTS.find(d => d.id === (
      nav.view === 'dept' ? nav.deptId
        : projects.find(p => p.id === (nav as { projectId: string }).projectId)?.deptId
    ))
    : null;
  const project = nav.view === 'board'
    ? projects.find(p => p.id === (nav as { projectId: string }).projectId)
    : null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={() => onNavigate({ view: 'hub' })}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: nav.view === 'hub' ? DS.blue : DS.text4, fontSize: 12, fontFamily: DS.mono, padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <FolderKanban size={12} /> Tất cả phòng ban
      </button>
      {dept && (
        <>
          <ChevronRight size={12} style={{ color: DS.text5 }} />
          <button onClick={() => onNavigate({ view: 'dept', deptId: dept.id })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: nav.view === 'dept' ? dept.color : DS.text4, fontSize: 12, fontFamily: DS.mono, padding: '2px 6px', borderRadius: 6 }}>
            {dept.emoji} {dept.name}
          </button>
        </>
      )}
      {project && (
        <>
          <ChevronRight size={12} style={{ color: DS.text5 }} />
          <span style={{ color: project.color, fontSize: 12, fontFamily: DS.mono, padding: '2px 6px' }}>{project.name}</span>
        </>
      )}
    </div>
  );
}

// ── Department Card ───────────────────────────────────────────────────────────

function DeptCard({ dept, projects, onClick }: {
  dept: Department; projects: KanbanProject[]; onClick: () => void;
}) {
  const active = projects.filter(p => p.status === 'active').length;
  const totalTasks = projects.reduce((s, p) => s + p.taskStats.total, 0);
  const doneTasks = projects.reduce((s, p) => s + p.taskStats.done, 0);
  const urgentTasks = projects.reduce((s, p) => s + p.taskStats.urgent, 0);
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const headMember = seedMembers.find(m => String(m.id) === String(dept.headId));
  const headRank = headMember ? RANKS[headMember.rank] : null;

  return (
    <motion.div onClick={onClick} className="rounded-2xl p-5 cursor-pointer relative overflow-hidden"
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
      whileHover={{ borderColor: `${dept.color}50`, y: -3, boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px ${dept.color}18` }}
      whileTap={{ scale: 0.99 }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `${dept.color}05`, pointerEvents: 'none' }} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${dept.color}15`, border: `1px solid ${dept.color}30`, color: dept.color }}>
            {dept.icon}
          </div>
          <div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{dept.name}</div>
            <div style={{ color: DS.text5, fontSize: 11, marginTop: 1 }}>{dept.description.slice(0, 46)}…</div>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: DS.text5, flexShrink: 0, marginTop: 4 }} />
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>TIẾN ĐỘ TỔNG</span>
          <span style={{ color: dept.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{overallProgress}%</span>
        </div>
        <ProgressBar value={overallProgress} color={dept.color} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Dự án', value: projects.length, color: DS.text3 },
          { label: 'Đang chạy', value: active, color: DS.green },
          { label: 'Task khẩn', value: urgentTasks, color: urgentTasks > 0 ? DS.red : DS.text5 },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center"
            style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div style={{ color: s.color, fontSize: 18, fontWeight: 700, fontFamily: DS.heading }}>{s.value}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {headMember && headRank && (
        <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${headRank.color}` }}>
            <img src={headMember.img} alt={headMember.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <span style={{ color: DS.text4, fontSize: 10 }}>Trưởng phòng: </span>
            <span style={{ color: headRank.color, fontSize: 10, fontWeight: 700 }}>{headMember.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {projects.filter(p => p.status === 'active').slice(0, 3).map(p => (
              <div key={p.id} style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} title={p.name} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Project Card (Grid view) ──────────────────────────────────────────────────

function ProjectCard({ project, onOpen, onEdit, onDelete }: {
  project: KanbanProject;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sc = STATUS_CFG[project.status];
  const pc = PRIORITY_CFG[project.priority];
  const overdue = isOverdue(project.deadline, project.status);
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      className="rounded-2xl p-5 relative overflow-hidden group"
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, cursor: 'default' }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      whileHover={{ borderColor: `${project.color}45`, boxShadow: `0 6px 24px rgba(0,0,0,0.25)` }}>

      {project.status === 'active' && (
        <motion.div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '0 16px 0 60px', background: `${project.color}08`, pointerEvents: 'none' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
      )}

      {/* Action buttons — appear on hover */}
      <AnimatePresence>
        {showActions && (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
            className="absolute top-3 right-3 flex items-center gap-1 z-10">
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(59,130,246,0.15)', border: `1px solid rgba(59,130,246,0.3)`, color: DS.blue, cursor: 'pointer' }}>
              <Edit3 size={11} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(239,68,68,0.12)', border: `1px solid rgba(239,68,68,0.25)`, color: DS.red, cursor: 'pointer' }}>
              <Trash2 size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span style={{ color: sc.color, background: `${sc.color}12`, border: `1px solid ${sc.color}25`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
          {sc.icon} {sc.label}
        </span>
        <span style={{ color: pc.color, background: pc.bg, border: `1px solid ${pc.color}25`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono }}>
          {pc.label}
        </span>
        {overdue && (
          <span style={{ color: DS.red, background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
            <AlertTriangle size={9} /> Quá hạn
          </span>
        )}
      </div>

      {/* Title — clickable */}
      <button onClick={onOpen} style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', width: '100%' }}>
        <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>{project.name}</div>
      </button>
      <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.55, marginBottom: 14 }}>{project.description.slice(0, 90)}…</div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{project.taskStats.done}/{project.taskStats.total} tasks</span>
          <span style={{ color: project.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} color={project.color} />
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 9, color: DS.text5, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, padding: '1px 6px', borderRadius: 4, fontFamily: DS.mono }}>{t}</span>
          ))}
          {project.tags.length > 3 && <span style={{ fontSize: 9, color: DS.text5, fontFamily: DS.mono }}>+{project.tags.length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
        <div className="flex items-center">
          {project.memberIds.slice(0, 4).map((id, i) => (
            <div key={id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
              <MemberAvatar id={id} size={26} />
            </div>
          ))}
          {project.memberIds.length > 4 && (
            <div style={{ marginLeft: -8, width: 26, height: 26, borderRadius: '50%', background: DS.bgCard2, border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: DS.text4, fontFamily: DS.mono }}>
              +{project.memberIds.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {project.taskStats.urgent > 0 && (
            <span style={{ color: DS.red, fontSize: 10, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle size={10} /> {project.taskStats.urgent}
            </span>
          )}
          {project.budget && (
            <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>
              {(project.budget / 1_000_000).toFixed(0)}M
            </span>
          )}
          <span style={{ color: overdue ? DS.red : DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} /> {formatDate(project.deadline)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Gantt Timeline View ───────────────────────────────────────────────────────

function GanttView({ projects, onOpen }: { projects: KanbanProject[]; onOpen: (id: string) => void }) {
  // Compute date range
  const allDates = projects.flatMap(p => [p.startDate, p.deadline]).filter(Boolean);
  const minDate = allDates.length > 0 ? new Date(allDates.reduce((a, b) => a < b ? a : b) + 'T00:00:00') : new Date();
  const maxDate = allDates.length > 0 ? new Date(allDates.reduce((a, b) => a > b ? a : b) + 'T00:00:00') : new Date();
  // Pad
  minDate.setMonth(minDate.getMonth() - 0);
  maxDate.setMonth(maxDate.getMonth() + 1);
  const totalDays = Math.max((maxDate.getTime() - minDate.getTime()) / 86400000, 1);

  // Generate month headers
  const months: { label: string; left: number; width: number }[] = [];
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cur <= maxDate) {
    const mStart = new Date(cur);
    const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const left = Math.max((mStart.getTime() - minDate.getTime()) / 86400000 / totalDays * 100, 0);
    const width = (Math.min(mEnd.getTime(), maxDate.getTime()) - Math.max(mStart.getTime(), minDate.getTime())) / 86400000 / totalDays * 100;
    months.push({
      label: `T${mStart.getMonth() + 1}/${mStart.getFullYear()}`,
      left, width: Math.max(width, 0),
    });
    cur.setMonth(cur.getMonth() + 1);
  }

  const today = new Date();
  const todayLeft = (today.getTime() - minDate.getTime()) / 86400000 / totalDays * 100;
  const showToday = todayLeft >= 0 && todayLeft <= 100;

  const getBar = (p: KanbanProject) => {
    if (!p.startDate || !p.deadline) return null;
    const s = new Date(p.startDate + 'T00:00:00');
    const e = new Date(p.deadline + 'T00:00:00');
    const left = Math.max((s.getTime() - minDate.getTime()) / 86400000 / totalDays * 100, 0);
    const width = Math.max((e.getTime() - s.getTime()) / 86400000 / totalDays * 100, 1);
    return { left, width: Math.min(width, 100 - left) };
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
      {/* Month headers */}
      <div className="flex" style={{ borderBottom: `1px solid ${DS.border}`, paddingLeft: 220 }}>
        <div style={{ position: 'relative', flex: 1, height: 32 }}>
          {months.map((m, i) => (
            <div key={i} style={{ position: 'absolute', left: `${m.left}%`, width: `${m.width}%`, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      {projects.map((p, idx) => {
        const bar = getBar(p);
        const overdue = isOverdue(p.deadline, p.status);
        return (
          <div key={p.id} className="flex items-center"
            style={{ borderBottom: idx < projects.length - 1 ? `1px solid ${DS.border}` : 'none', minHeight: 44 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            {/* Name col */}
            <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 220, paddingLeft: 16, paddingRight: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: `0 0 6px ${p.color}` }} />
              <button onClick={() => onOpen(p.id)}
                style={{ background: 'none', border: 'none', color: DS.text2, fontSize: 12, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: 0, flex: 1 }}>
                {p.name}
              </button>
            </div>
            {/* Bar area */}
            <div style={{ flex: 1, position: 'relative', height: 44, borderLeft: `1px solid ${DS.border}` }}>
              {/* Grid lines */}
              {months.map((m, i) => (
                <div key={i} style={{ position: 'absolute', left: `${m.left}%`, top: 0, bottom: 0, width: 1, background: DS.border, opacity: 0.5 }} />
              ))}
              {/* Today line */}
              {showToday && (
                <div style={{ position: 'absolute', left: `${todayLeft}%`, top: 0, bottom: 0, width: 1, background: DS.red, zIndex: 5, opacity: 0.7 }} />
              )}
              {/* Bar */}
              {bar && (
                <motion.div
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.04 }}
                  style={{
                    position: 'absolute',
                    left: `${bar.left}%`, width: `${bar.width}%`,
                    top: '50%', transform: 'translateY(-50%)',
                    height: 20, borderRadius: 6,
                    background: p.status === 'completed'
                      ? `repeating-linear-gradient(45deg, ${p.color}40, ${p.color}40 4px, ${p.color}20 4px, ${p.color}20 8px)`
                      : p.color,
                    opacity: p.status === 'cancelled' ? 0.3 : 1,
                    cursor: 'pointer',
                    boxShadow: `0 0 8px ${p.color}40`,
                    overflow: 'hidden',
                    zIndex: 3,
                  }}
                  title={`${p.name}: ${formatDate(p.startDate)} → ${formatDate(p.deadline)}`}
                  onClick={() => onOpen(p.id)}>
                  {/* Progress fill */}
                  <div style={{
                    position: 'absolute', inset: 0, width: `${p.progress}%`,
                    background: 'rgba(255,255,255,0.2)', borderRadius: 6,
                  }} />
                </motion.div>
              )}
            </div>
            {/* Progress col */}
            <div style={{ width: 50, flexShrink: 0, textAlign: 'right', paddingRight: 14, color: overdue ? DS.red : DS.text5, fontSize: 10, fontFamily: DS.mono }}>
              {p.progress}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Workload Panel ────────────────────────────────────────────────────────────

function WorkloadPanel({ projects }: { projects: KanbanProject[] }) {
  // Count active projects per member
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
  const countMap: Record<string, number> = {};
  activeProjects.forEach(p => p.memberIds.forEach(id => {
    countMap[String(id)] = (countMap[String(id)] ?? 0) + 1;
  }));
  const entries = Object.entries(countMap)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxCount = Math.max(...entries.map(e => e.count), 1);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
      <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 14 }}>── WORKLOAD THÀNH VIÊN</div>
      <div className="space-y-3">
        {entries.map(({ id, count }) => {
          const m = seedMembers.find(x => String(x.id) === id);
          if (!m) return null;
          const rc = RANKS[m.rank];
          const pct = (count / maxCount) * 100;
          const color = count >= 3 ? DS.red : count === 2 ? DS.amber : DS.green;
          return (
            <div key={id} className="flex items-center gap-3">
              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${rc.color}` }}>
                <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: DS.text3, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  <span style={{ color, fontSize: 10, fontFamily: DS.mono, flexShrink: 0, marginLeft: 8 }}>{count} dự án</span>
                </div>
                <ProgressBar value={pct} color={color} height={3} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hub Overview (Level 1) ────────────────────────────────────────────────────

function HubView({ projects, onNavigate }: {
  projects: KanbanProject[];
  onNavigate: (n: NavState) => void;
}) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const urgentTasks = projects.reduce((s, p) => s + p.taskStats.urgent, 0);
  const totalDone = projects.reduce((s, p) => s + p.taskStats.done, 0);
  const totalTasks = projects.reduce((s, p) => s + p.taskStats.total, 0);
  const overallProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng dự án',    value: totalProjects,          sub: 'toàn công ty',          color: DS.blue,   icon: <FolderKanban size={18} /> },
          { label: 'Đang thực hiện', value: activeProjects,         sub: 'dự án active',           color: DS.green,  icon: <TrendingUp size={18} /> },
          { label: 'Task khẩn',     value: urgentTasks,            sub: 'cần xử lý ngay',         color: urgentTasks > 0 ? DS.red : DS.text4, icon: <AlertTriangle size={18} /> },
          { label: 'Tiến độ chung', value: `${overallProgress}%`,  sub: `${totalDone}/${totalTasks} tasks`, color: DS.purple, icon: <BarChart3 size={18} /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text2, fontSize: 13, marginTop: 1 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Department cards */}
      <div>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 16 }}>── PHÒNG BAN</div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {DEPARTMENTS.map(dept => (
            <DeptCard key={dept.id} dept={dept}
              projects={projects.filter(p => p.deptId === dept.id)}
              onClick={() => onNavigate({ view: 'dept', deptId: dept.id })} />
          ))}
        </div>
      </div>

      {/* Active projects list + workload */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── DỰ ÁN ĐANG THỰC HIỆN</div>
            <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{activeProjects} dự án</span>
          </div>
          <div className="space-y-2">
            {projects.filter(p => p.status === 'active').map(p => {
              const dept = DEPARTMENTS.find(d => d.id === p.deptId)!;
              const pc = PRIORITY_CFG[p.priority];
              return (
                <motion.div key={p.id}
                  onClick={() => onNavigate({ view: 'board', projectId: p.id })}
                  className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer"
                  style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                  whileHover={{ borderColor: `${p.color}40`, x: 4 }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                    {dept.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ color: DS.text, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      <span style={{ color: dept.color, background: `${dept.color}10`, border: `1px solid ${dept.color}22`, borderRadius: 4, padding: '1px 6px', fontSize: 8, fontFamily: DS.mono, flexShrink: 0 }}>
                        {dept.name.replace('Phòng ', '')}
                      </span>
                    </div>
                    <ProgressBar value={p.progress} color={p.color} height={3} />
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center">
                      {p.memberIds.slice(0, 3).map((id, i) => (
                        <div key={id} style={{ marginLeft: i > 0 ? -6 : 0 }}><MemberAvatar id={id} size={20} /></div>
                      ))}
                    </div>
                    <span style={{ color: pc.color, background: pc.bg, borderRadius: 6, padding: '1px 7px', fontSize: 9, fontFamily: DS.mono }}>{pc.label}</span>
                    <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{p.progress}%</span>
                    <ChevronRight size={13} style={{ color: DS.text5 }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        <WorkloadPanel projects={projects} />
      </div>
    </div>
  );
}

// ── Department View (Level 2) ─────────────────────────────────────────────────

function DeptView({ deptId, projects, onNavigate, onProjectsChange }: {
  deptId: string;
  projects: KanbanProject[];
  onNavigate: (n: NavState) => void;
  onProjectsChange: (ps: KanbanProject[]) => void;
}) {
  const dept = DEPARTMENTS.find(d => d.id === deptId)!;
  const deptProjects = projects.filter(p => p.deptId === deptId);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'progress' | 'deadline' | 'priority'>('priority');
  const [viewMode, setViewMode] = useState<'grid' | 'gantt'>('grid');
  const [modalState, setModalState] = useState<{ open: boolean; project?: KanbanProject }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const head = seedMembers.find(m => String(m.id) === String(dept.headId));
  const headRank = head ? RANKS[head.rank] : null;

  const filtered = deptProjects
    .filter(p => (statusFilter === 'all' || p.status === statusFilter) && p.name.toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'deadline') return a.deadline.localeCompare(b.deadline);
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });

  const handleSaveProject = (p: KanbanProject) => {
    const exists = projects.find(x => x.id === p.id);
    onProjectsChange(exists ? projects.map(x => x.id === p.id ? p : x) : [...projects, p]);
  };

  const handleDelete = (id: string) => {
    onProjectsChange(projects.filter(p => p.id !== id));
    setConfirmDelete(null);
  };

  const stats = [
    { label: 'Tổng', value: deptProjects.length, color: DS.text3 },
    { label: 'Đang làm', value: deptProjects.filter(p => p.status === 'active').length, color: DS.green },
    { label: 'Kế hoạch', value: deptProjects.filter(p => p.status === 'planning').length, color: DS.blue },
    { label: 'Hoàn thành', value: deptProjects.filter(p => p.status === 'completed').length, color: DS.text5 },
  ];

  return (
    <div className="space-y-5">
      {/* Dept header */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${dept.color}30` }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${dept.color}06, transparent 60%)`, pointerEvents: 'none' }} />
        <div className="flex items-center justify-between gap-4 flex-wrap relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: `${dept.color}15`, border: `1px solid ${dept.color}40` }}>
              {dept.emoji}
            </div>
            <div>
              <div style={{ color: dept.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 3 }}>── PHÒNG BAN</div>
              <div style={{ color: DS.text, fontSize: 20, fontWeight: 700 }}>{dept.name}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{dept.description}</div>
            </div>
          </div>
          {head && headRank && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{ background: `${headRank.color}08`, border: `1px solid ${headRank.color}22` }}>
              <div className="w-9 h-9 rounded-full overflow-hidden" style={{ border: `1.5px solid ${headRank.color}` }}>
                <img src={head.img} alt={head.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>TRƯỞNG PHÒNG</div>
                <div style={{ color: headRank.color, fontSize: 12, fontWeight: 700 }}>{head.name}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-5 mt-4 pt-4 flex-wrap" style={{ borderTop: `1px solid ${DS.border}` }}>
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</span>
              <span style={{ color: DS.text5, fontSize: 11 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, minWidth: 180 }}>
          <Search size={13} style={{ color: DS.text5 }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm dự án..."
            style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, flex: 1, fontFamily: DS.body }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'all')}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          <option value="priority">Ưu tiên</option>
          <option value="progress">Tiến độ</option>
          <option value="deadline">Deadline</option>
        </select>
        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
          {[
            { mode: 'grid' as const, icon: <LayoutList size={14} />, label: 'Grid' },
            { mode: 'gantt' as const, icon: <Calendar size={14} />, label: 'Gantt' },
          ].map(v => (
            <button key={v.mode} onClick={() => setViewMode(v.mode)}
              className="flex items-center gap-1.5 px-3 py-2"
              style={{ background: viewMode === v.mode ? 'rgba(59,130,246,0.18)' : DS.bgCard, border: 'none', color: viewMode === v.mode ? DS.blue : DS.text5, cursor: 'pointer', fontSize: 12, borderRight: v.mode === 'grid' ? `1px solid ${DS.border}` : 'none' }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        <button onClick={() => setModalState({ open: true })}
          className="flex items-center gap-2"
          style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(129,140,248,0.2)' }}>
          <Plus size={14} /> Tạo dự án
        </button>
      </div>

      {/* Project list / Gantt */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl py-16 flex flex-col items-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <FolderKanban size={36} style={{ color: DS.text5, opacity: 0.35, marginBottom: 12 }} />
          <div style={{ color: DS.text4, fontSize: 14 }}>Không tìm thấy dự án phù hợp</div>
          <button onClick={() => setModalState({ open: true })} className="flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl"
            style={{ background: GRD.primary, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            <Plus size={13} /> Tạo dự án mới
          </button>
        </div>
      ) : viewMode === 'gantt' ? (
        <div className="space-y-4">
          <GanttView projects={filtered} onOpen={id => onNavigate({ view: 'board', projectId: id })} />
          <WorkloadPanel projects={deptProjects} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => onNavigate({ view: 'board', projectId: project.id })}
              onEdit={() => setModalState({ open: true, project })}
              onDelete={() => setConfirmDelete(project.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <AnimatePresence>
        {modalState.open && (
          <ProjectModal
            project={modalState.project}
            deptId={deptId}
            onSave={handleSaveProject}
            onClose={() => setModalState({ open: false })}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}>
            <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }} />
            <motion.div className="relative w-full max-w-sm rounded-2xl p-6"
              style={{ background: DS.bgCard, border: `1px solid rgba(239,68,68,0.35)` }}
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239,68,68,0.12)', border: `1px solid rgba(239,68,68,0.3)` }}>
                <Trash2 size={22} style={{ color: DS.red }} />
              </div>
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Xóa dự án?</div>
              <div style={{ color: DS.text4, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                Hành động này không thể hoàn tác. Toàn bộ dữ liệu dự án sẽ bị xóa vĩnh viễn.
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(confirmDelete)}
                  style={{ flex: 1, background: DS.red, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  Xóa vĩnh viễn
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, cursor: 'pointer', fontSize: 14 }}>
                  Hủy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main KanbanHub ────────────────────────────────────────────────────────────

export function KanbanHub() {
  const [nav, setNav] = useState<NavState>({ view: 'hub' });
  const [beProjects, setBeProjects] = useState<KanbanProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  // ── Fetch BE projects ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    setProjectsError('');
    projectsService.getAdminProjects()
      .then(be => {
        if (cancelled) return;
        // Map BE PortfolioProject → KanbanProject bridge shape
        const mapped: KanbanProject[] = be.map(p => ({
          id: p.id,
          deptId: 'it', // BE doesn't have deptId → fallback
          name: p.title,
          description: p.challenge || p.solution || '',
          status: p.status === 'completed' ? 'completed' : p.status === 'active' ? 'active' : 'planning',
          priority: 'medium' as ProjectPriority,
          startDate: p.publishedAt ?? '',
          deadline: '',
          progress: 0,
          leadId: 1,
          memberIds: [],
          taskStats: { total: 0, done: 0, inProgress: 0, urgent: 0 },
          tags: p.tags ?? [],
          budget: undefined,
          color: p.color,
          clientName: p.client,
        }));
        setBeProjects(mapped);
      })
      .catch(() => { if (!cancelled) setProjectsError('Không tải được dự án'); })
      .finally(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fallback-safe display list
  const displayProjects = useMemo<KanbanProject[]>(() => {
    if (beProjects.length > 0) return beProjects;
    return INIT_PROJECTS;
  }, [beProjects]);

  const currentProject = nav.view === 'board'
    ? displayProjects.find(p => p.id === (nav as { projectId: string }).projectId)
    : null;

  // ── CRUD handlers (optimistic + BE sync) ───────────────────────────
  const handleProjectsChange = (updated: KanbanProject[]) => {
    setBeProjects(updated); // optimistic — BE sync optional for kanban
  };

  return (
    <div className="space-y-4">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 rounded-2xl"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <Breadcrumb nav={nav} projects={displayProjects} onNavigate={setNav} />

        <div className="flex items-center gap-2">
          {projectsLoading && (
            <div className="flex items-center gap-1.5 px-2" style={{ color: DS.text5 }}>
              <Loader2 size={12} className="animate-spin" />
              <span style={{ fontSize: 10, fontFamily: DS.mono }}>Đang tải...</span>
            </div>
          )}
          {projectsError && (
            <span style={{ fontSize: 10, color: DS.red, fontFamily: DS.mono }}>{projectsError}</span>
          )}
          {nav.view !== 'hub' && (
            <motion.button onClick={() => setNav({ view: 'hub' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.2)`, color: DS.blue, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono }}
              whileHover={{ scale: 1.03 }}>
              <ArrowLeft size={11} /> Hub
            </motion.button>
          )}
          <div className="flex items-center gap-1.5">
            {DEPARTMENTS.map(d => (
              <motion.button key={d.id} onClick={() => setNav({ view: 'dept', deptId: d.id })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                style={{
                  background: nav.view === 'dept' && (nav as { deptId?: string }).deptId === d.id ? `${d.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${nav.view === 'dept' && (nav as { deptId?: string }).deptId === d.id ? d.color + '40' : DS.border}`,
                  color: nav.view === 'dept' && (nav as { deptId?: string }).deptId === d.id ? d.color : DS.text5,
                  fontSize: 11, cursor: 'pointer',
                }}
                whileHover={{ scale: 1.04 }}>
                <span className="text-sm">{d.emoji}</span>
                <span className="hidden xl:inline" style={{ fontFamily: DS.mono }}>{d.name.replace('Phòng ', '')}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={JSON.stringify(nav)}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: 'easeOut' }}>

          {nav.view === 'hub' && <HubView projects={displayProjects} onNavigate={setNav} />}

          {nav.view === 'dept' && (
            <DeptView
              deptId={(nav as { deptId: string }).deptId}
              projects={displayProjects}
              onNavigate={setNav}
              onProjectsChange={handleProjectsChange}
            />
          )}

          {nav.view === 'board' && currentProject && (
            <KanbanBoard
              projectId={currentProject.id}
              projectTitle={currentProject.name}
              projectColor={currentProject.color}
              onBack={() => setNav({ view: 'dept', deptId: currentProject.deptId })}
            />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
