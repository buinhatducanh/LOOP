"use client";
/**
 * Departments Admin Page — v5.0 Ban-Phòng Hierarchy
 * Route: /admin/departments
 *
 * Hierarchy: Division (Ban) → Department (Phòng) → MemberDepartment (junction)
 * APIs: /api/admin/divisions, /api/admin/departments
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Building2, Users, Crown, ChevronRight, ChevronDown,
  X, Save, Search, BarChart3, UserPlus, Layers,
  CheckSquare, Square, RefreshCw, Loader2, AlertCircle,
  Plus, Pencil, Trash2, ChevronLeft, Network,
} from "lucide-react";
// ── Types ─────────────────────────────────────────────────────────────────────
type RankKey = "iron" | "bronze" | "silver" | "gold" | "platinum" | "ruby" | "diamond";
interface RankConfig { label: string; symbol: string; color: string; glowColor: string; }
const RANKS: Record<RankKey, RankConfig> = {
  iron:     { label: "Iron",     symbol: "⬡", color: "#9CA3AF", glowColor: "rgba(156,163,175,0.3)" },
  bronze:   { label: "Bronze",   symbol: "◈", color: "#CD7F32", glowColor: "rgba(205,127,50,0.3)" },
  silver:   { label: "Silver",   symbol: "◇", color: "#CBD5E1", glowColor: "rgba(203,213,225,0.3)" },
  gold:     { label: "Gold",     symbol: "★", color: "#FFD700", glowColor: "rgba(255,215,0,0.3)" },
  platinum: { label: "Platinum", symbol: "❋", color: "#14B8A6", glowColor: "rgba(20,184,166,0.3)" },
  ruby:     { label: "Ruby",     symbol: "♦", color: "#EF4444", glowColor: "rgba(239,68,68,0.3)" },
  diamond:  { label: "Diamond",  symbol: "✦", color: "#818CF8", glowColor: "rgba(129,140,248,0.3)" },
};
function getRank(rank: string): RankConfig {
  return RANKS[rank as RankKey] ?? RANKS.iron;
}
interface DeptMember {
  id: string; name: string; avatar: string | null; image: string | null;
  rank: string; level: number; role: string;
  position: string | null; isDeptHead: boolean; isPrimary: boolean;
}
interface DepartmentSummary {
  id: string; key: string; name: string; shortName: string; color: string;
  memberCount: number; headId: string | null;
}
interface DivisionAPI {
  id: string; key: string; name: string; shortName: string; color: string;
  description: string | null;
  departmentCount: number; memberCount: number;
  departments: DepartmentSummary[];
}
interface DivisionDetail extends DivisionAPI {
  // full detail loaded on click
}
interface DepartmentDetail extends DepartmentSummary {
  mission: string | null; description: string | null;
  members: DeptMember[];
  divisionId: string | null;
  division: { id: string; key: string; name: string; shortName: string } | null;
}
interface MemberAPI {
  id: string; name: string; avatar: string | null; image: string | null;
  rank: string; level: number; role: string;
  departments: { id: string; key: string; name: string; shortName: string; color: string; position: string | null; isDeptHead: boolean; isPrimary: boolean }[];
}
interface AllMemberAPI {
  id: string; name: string; avatar: string | null; image: string | null;
  rank: string; level: number; role: string; position: string | null;
  departments: { id: string; key: string; name: string; shortName: string; color: string; position: string | null; isDeptHead: boolean; isPrimary: boolean }[];
}
// ── API calls ─────────────────────────────────────────────────────────────────
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("loop-staff-token") : null; }
async function apiFetch(url: string, opts?: RequestInit) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
    headers: { ...opts?.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } as HeadersInit,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
async function fetchDivisions(): Promise<DivisionAPI[]> {
  const data = await apiFetch("/api/admin/divisions?limit=50");
  return data.data ?? data;
}
async function fetchDivision(id: string): Promise<DivisionDetail> {
  const data = await apiFetch(`/api/admin/divisions/${id}`);
  return data.data ?? data;
}
async function fetchDepartments(): Promise<DepartmentDetail[]> {
  const data = await apiFetch("/api/admin/departments?limit=100");
  return data.data ?? data;
}
async function fetchDepartment(id: string): Promise<DepartmentDetail> {
  const data = await apiFetch(`/api/admin/departments/${id}`);
  return data.data ?? data;
}
async function fetchAllMembers(): Promise<AllMemberAPI[]> {
  const data = await apiFetch("/api/admin/team?limit=500");
  return data.data ?? data;
}
// ── Avatar helpers ────────────────────────────────────────────────────────────
function avatarSrc(m: { avatar?: string | null; image?: string | null; id: string }): string {
  return m.avatar ?? m.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`;
}
// ── Mini Avatar ───────────────────────────────────────────────────────────────
function MiniAvatar({ m, size = 32 }: { m: { id: string; name: string; avatar?: string | null; image?: string | null; rank: string; level?: number }; size?: number }) {
  const [tip, setTip] = useState(false);
  const rc = getRank(m.rank);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}
      onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `2px solid ${rc.color}70`, boxShadow: `0 0 6px ${rc.glowColor}` }}>
        <img src={avatarSrc(m)} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {tip && (
        <div style={{ position: "absolute", bottom: size + 4, left: "50%", transform: "translateX(-50%)", background: DS.bgCard, border: `1px solid ${rc.color}40`, borderRadius: 8, padding: "5px 10px", whiteSpace: "nowrap", zIndex: 99, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          <div style={{ color: DS.text, fontSize: 11, fontWeight: 700 }}>{m.name}</div>
          <div style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label} Lv.{m.level}</div>
        </div>
      )}
    </div>
  );
}
// ── Division Form Modal ────────────────────────────────────────────────────────
function DivisionModal({ division, onClose, onSave }: {
  division?: DivisionAPI;
  onClose: () => void;
  onSave: (data: { name: string; shortName: string; color: string; description: string }) => Promise<void>;
}) {
  const [name, setName] = useState(division?.name ?? "");
  const [shortName, setShortName] = useState(division?.shortName ?? "");
  const [color, setColor] = useState(division?.color ?? "#3B82F6");
  const [description, setDescription] = useState(division?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSave = async () => {
    if (!name.trim() || !shortName.trim()) { setError("Tên và tên viết tắt bắt buộc"); return; }
    setSaving(true); setError(null);
    try { await onSave({ name: name.trim(), shortName: shortName.trim(), color, description: description.trim() }); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    finally { setSaving(false); }
  };
  const COLORS = ["#3B82F6","#EC4899","#22C55E","#F59E0B","#8B5CF6","#06B6D4","#EAB308","#EF4444","#14B8A6","#6366F1"];
  return (
    <Modal title={division ? "Sửa Ban" : "Thêm Ban mới"} onClose={onClose}>
      {error && <div style={{ background: `${DS.red}10`, border: `1px solid ${DS.red}30`, borderRadius: 10, padding: "10px 14px", color: DS.red, fontSize: 12 }}>{error}</div>}
      <Field label="Tên Ban" required>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Ban Kỹ thuật"
          style={{ ...inputStyle, borderColor: DS.border }} />
      </Field>
      <Field label="Tên viết tắt" required>
        <input value={shortName} onChange={e => setShortName(e.target.value.toUpperCase())} placeholder="VD: KT" maxLength={8}
          style={{ ...inputStyle, borderColor: DS.border }} />
      </Field>
      <Field label="Màu đại diện">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)}
              style={{ width: 32, height: 32, borderRadius: 8, background: c, cursor: "pointer", border: color === c ? `3px solid #fff` : "2px solid transparent", boxShadow: color === c ? `0 0 12px ${c}` : "none" }} />
          ))}
        </div>
      </Field>
      <Field label="Mô tả">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả ban..."
          style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, ...btnSecondary }}>Hủy</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, ...btnPrimary }}>
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
          {saving ? "Đang lưu…" : division ? "Lưu thay đổi" : "Tạo Ban"}
        </button>
      </div>
    </Modal>
  );
}
// ── Department Form Modal ─────────────────────────────────────────────────────
function DepartmentModal({ department, divisions, onClose, onSave }: {
  department?: DepartmentDetail;
  divisions: DivisionAPI[];
  onClose: () => void;
  onSave: (data: { name: string; shortName: string; key: string; color: string; description: string; mission: string; divisionId: string }) => Promise<void>;
}) {
  const [name, setName] = useState(department?.name ?? "");
  const [shortName, setShortName] = useState(department?.shortName ?? "");
  const [key, setKey] = useState(department?.key ?? "");
  const [color, setColor] = useState(department?.color ?? "#3B82F6");
  const [description, setDescription] = useState(department?.description ?? "");
  const [mission, setMission] = useState(department?.mission ?? "");
  const [divisionId, setDivisionId] = useState(department?.division?.id ?? divisions[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSave = async () => {
    if (!name.trim() || !shortName.trim() || !key.trim()) { setError("Tên, tên viết tắt và key bắt buộc"); return; }
    setSaving(true); setError(null);
    try {
      await onSave({ name: name.trim(), shortName: shortName.trim().toUpperCase(),
        key: key.trim().toLowerCase().replace(/\s+/g, "-"), color, description: description.trim(), mission: mission.trim(), divisionId });
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    finally { setSaving(false); }
  };
  const COLORS = ["#3B82F6","#EC4899","#22C55E","#F59E0B","#8B5CF6","#06B6D4","#EAB308","#EF4444","#14B8A6","#6366F1"];
  return (
    <Modal title={department ? "Sửa Phòng" : "Thêm Phòng mới"} onClose={onClose}>
      {error && <div style={{ background: `${DS.red}10`, border: `1px solid ${DS.red}30`, borderRadius: 10, padding: "10px 14px", color: DS.red, fontSize: 12 }}>{error}</div>}
      <Field label="Thuộc Ban" required>
        <select value={divisionId} onChange={e => setDivisionId(e.target.value)} style={{ ...inputStyle, borderColor: DS.border }}>
          {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <Field label="Tên Phòng" required>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Phòng Lập trình"
          style={{ ...inputStyle, borderColor: DS.border }} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Tên viết tắt" required>
          <input value={shortName} onChange={e => setShortName(e.target.value.toUpperCase())} placeholder="VD: DEV" maxLength={8}
            style={{ ...inputStyle, borderColor: DS.border }} />
        </Field>
        <Field label="Key (URL)" required>
          <input value={key} onChange={e => setKey(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="dev"
            style={{ ...inputStyle, borderColor: DS.border, fontFamily: DS.mono, fontSize: 11 }} />
        </Field>
      </div>
      <Field label="Màu đại diện">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)}
              style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer", border: color === c ? `3px solid #fff` : "2px solid transparent", boxShadow: color === c ? `0 0 10px ${c}` : "none" }} />
          ))}
        </div>
      </Field>
      <Field label="Mô tả">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả phòng ban..."
          style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      <Field label="Sứ mệnh">
        <textarea value={mission} onChange={e => setMission(e.target.value)} rows={2} placeholder="Sứ mệnh phòng ban..."
          style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, ...btnSecondary }}>Hủy</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, ...btnPrimary }}>
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
          {saving ? "Đang lưu…" : department ? "Lưu thay đổi" : "Tạo Phòng"}
        </button>
      </div>
    </Modal>
  );
}
// ── Assign Members Modal ────────────────────────────────────────────────────────
function AssignModal({ department, allMembers, onClose, onSave }: {
  department: DepartmentDetail;
  allMembers: AllMemberAPI[];
  onClose: () => void;
  onSave: (memberIds: string[], headId: string | null) => Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(department.members.map(m => m.id));
  const [headId, setHeadId] = useState<string | null>(department.headId ?? null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (!selectedIds.includes(id) && selectedIds.length === 0) setHeadId(id);
  };
  const filtered = useMemo(() => {
    if (!search.trim()) return allMembers;
    const q = search.toLowerCase();
    return allMembers.filter(m => m.name.toLowerCase().includes(q) || (m.role ?? "").toLowerCase().includes(q));
  }, [allMembers, search]);
  const handleSave = async () => {
    setSaving(true); setError(null);
    try { await onSave(selectedIds, headId); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={`Phân công nhân sự — ${department.name}`} onClose={onClose} wide>
      {error && <div style={{ background: `${DS.red}10`, border: `1px solid ${DS.red}30`, borderRadius: 10, padding: "10px 14px", color: DS.red, fontSize: 12 }}>{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <Field label="Trưởng phòng">
          <select value={headId ?? ""} onChange={e => setHeadId(e.target.value || null)}
            style={{ ...inputStyle, borderColor: department.color + "40" }}>
            <option value="">— Chưa chỉ định —</option>
            {selectedIds.map(id => {
              const m = allMembers.find(x => x.id === id);
              if (!m) return null;
              const rc = getRank(m.rank);
              return <option key={id} value={id}>{rc.symbol} {m.name} — {m.role} (Lv.{m.level})</option>;
            })}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}`, marginBottom: 12 }}>
        <Search size={13} style={{ color: DS.text5 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Tìm trong ${allMembers.length} thành viên...`}
          style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 13, flex: 1 }} />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5 }}><X size={12} /></button>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
          Hiển thị {filtered.length} / {allMembers.length} thành viên
        </span>
        <button onClick={() => filtered.length === selectedIds.length ? setSelectedIds([]) : setSelectedIds(filtered.map(m => m.id))}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: department.color, fontSize: 11, fontFamily: DS.mono }}>
          {filtered.every(m => selectedIds.includes(m.id)) ? <Square size={13} /> : <CheckSquare size={13} />}
          {filtered.every(m => selectedIds.includes(m.id)) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </button>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(m => {
          const sel = selectedIds.includes(m.id);
          const rc = getRank(m.rank);
          return (
            <div key={m.id} onClick={() => toggle(m.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 12, cursor: "pointer",
                background: sel ? `${rc.color}08` : "rgba(255,255,255,0.01)",
                border: `1px solid ${sel ? rc.color + "35" : DS.border}`, transition: "all 0.15s" }}>
              <MiniAvatar m={m} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: sel ? DS.text : DS.text3, fontSize: 12, fontWeight: sel ? 600 : 400 }}>{m.name}</span>
                  {headId === m.id && <Crown size={9} style={{ color: DS.amber, flexShrink: 0 }} />}
                </div>
                <div style={{ color: DS.text5, fontSize: 10 }}>{m.role}</div>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? department.color : DS.border}`,
                background: sel ? department.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {sel && <div style={{ width: 8, height: 6, borderLeft: "2px solid #fff", borderBottom: "2px solid #fff", transform: "rotate(-45deg) translate(1px,-1px)" }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={onClose} style={{ flex: 1, ...btnSecondary }}>Hủy</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, ...btnPrimary }}>
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
          {saving ? "Đang lưu…" : `Lưu (${selectedIds.length} nhân sự)`}
        </button>
      </div>
    </Modal>
  );
}
// ── Shared UI Components ────────────────────────────────────────────────────────
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
        {label}{required && <span style={{ color: DS.red, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
  borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
};
const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px",
  cursor: "pointer", fontSize: 13, fontWeight: 700,
};
const btnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px",
  color: DS.text3, cursor: "pointer", fontSize: 13,
};
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.90)", backdropFilter: "blur(10px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}30`, borderRadius: 16, width: "100%", maxWidth: wide ? 680 : 480, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <span style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
// ── Department Detail Panel ────────────────────────────────────────────────────
function DeptDetail({ dept, onAssign, onEdit }: { dept: DepartmentDetail; onAssign: () => void; onEdit: () => void }) {
  const head = dept.members.find(m => m.isDeptHead);
  const headRank = head ? getRank(head.rank) : null;
  const totalLP = dept.members.reduce((s, m) => s + 0, 0);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ background: DS.bgCard, border: `1px solid ${dept.color}30`, borderRadius: 16, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top right, ${dept.color}08, transparent 55%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${dept.color}15`, border: `1px solid ${dept.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} style={{ color: dept.color }} />
            </div>
            <div>
              <div style={{ color: dept.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── PHÒNG BAN</div>
              <div style={{ color: DS.text, fontSize: 18, fontWeight: 700 }}>{dept.name}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{dept.shortName}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, background: `${dept.color}12`, border: `1px solid ${dept.color}30`, color: dept.color, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              <Pencil size={13} /> Sửa
            </button>
            <button onClick={onAssign} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, background: `${dept.color}12`, border: `1px solid ${dept.color}30`, color: dept.color, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              <UserPlus size={13} /> Phân công
            </button>
          </div>
        </div>
        {dept.mission && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>SỨ MỆNH: </span>
            <span style={{ color: DS.text3, fontSize: 12, fontStyle: "italic" }}>{dept.mission}</span>
          </div>
        )}
      </div>
      {/* Stats + Head */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
          {[
            { label: "Tổng nhân sự", value: dept.memberCount, color: dept.color },
            { label: "Trưởng phòng", value: head ? "👑" : "—", color: DS.amber },
          ].map(s => (
            <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
              <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: DS.text4, fontSize: 11, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {head && headRank && (
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.amber}25`, borderRadius: 16, padding: "1rem", minWidth: 220 }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 10 }}>TRƯỞNG PHÒNG</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: `2px solid ${DS.amber}`, boxShadow: `0 0 10px rgba(245,158,11,0.4)` }}>
                <img src={avatarSrc(head)} alt={head.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ color: DS.amber, fontSize: 13, fontWeight: 700 }}>{head.name}</div>
                <div style={{ color: DS.text4, fontSize: 11 }}>{head.position ?? head.role}</div>
                <div style={{ color: headRank.color, fontSize: 9, fontFamily: DS.mono }}>{headRank.symbol} {headRank.label} Lv.{head.level}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Member list */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 16 }}>── NHÂN SỰ ({dept.members.length})</div>
        {dept.members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: DS.text5 }}>Chưa có nhân sự trong phòng này</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dept.members.map(m => {
              const rc = getRank(m.rank);
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: m.isDeptHead ? `${DS.amber}06` : DS.bgCard2, border: `1px solid ${m.isDeptHead ? `${DS.amber}35` : DS.border}` }}>
                  <MiniAvatar m={m} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: DS.text2, fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                      {m.isDeptHead && <span style={{ color: DS.amber, fontSize: 7, fontFamily: DS.mono, border: `1px solid ${DS.amber}30`, padding: "1px 4px", borderRadius: 3, background: `${DS.amber}10` }}>TRƯỞNG</span>}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>{m.position ?? m.role}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
                    <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label}</span>
                    <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Lv.{m.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
// ── Division Row ─────────────────────────────────────────────────────────────
function DivisionRow({ division, isSelected, onSelect, onAddDept, onEdit }: {
  division: DivisionAPI;
  isSelected: boolean;
  onSelect: () => void;
  onAddDept: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div key={division.id} onClick={onSelect}
      whileHover={{ borderColor: `${division.color}35` }}
      style={{ padding: "1rem", borderRadius: 16, cursor: "pointer",
        background: DS.bgCard,
        border: `1px solid ${isSelected ? `${division.color}50` : DS.border}`,
        boxShadow: isSelected ? `0 0 20px ${division.color}10` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${division.color}15`, border: `1px solid ${division.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Network size={18} style={{ color: division.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: division.color, fontSize: 13, fontWeight: 700 }}>{division.name}</div>
          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{division.shortName} · {division.departmentCount} phòng · {division.memberCount} nhân sự</div>
        </div>
        {isSelected ? <ChevronRight size={14} style={{ color: division.color, flexShrink: 0 }} /> : null}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {division.departments.map(d => (
          <div key={d.id} style={{ padding: "2px 8px", borderRadius: 6, background: `${d.color}15`, border: `1px solid ${d.color}30`, fontSize: 9, fontFamily: DS.mono, color: d.color }}>
            {d.shortName}
          </div>
        ))}
      </div>
      {isSelected && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${DS.border}` }}>
          <button onClick={e => { e.stopPropagation(); onAddDept(); }}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, background: `${division.color}10`, border: `1px solid ${division.color}30`, color: division.color, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            <Plus size={11} /> Thêm Phòng
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, background: "none", border: `1px solid ${DS.border}`, color: DS.text4, cursor: "pointer", fontSize: 11 }}>
            <Pencil size={11} /> Sửa Ban
          </button>
        </div>
      )}
    </motion.div>
  );
}
// ── Department List Panel ─────────────────────────────────────────────────────
function DeptListPanel({ division, selectedDeptId, onSelectDept, onAddDept, onEditDept, onDeleteDept }: {
  division: DivisionAPI;
  selectedDeptId: string | null;
  onSelectDept: (id: string) => void;
  onAddDept: () => void;
  onEditDept: (dept: DepartmentSummary) => void;
  onDeleteDept: (id: string) => void;
}) {
  return (
    <motion.div key="dept-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${division.color}15`, border: `1px solid ${division.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Network size={18} style={{ color: division.color }} />
          </div>
          <div>
            <div style={{ color: division.color, fontSize: 16, fontWeight: 700 }}>{division.name}</div>
            <div style={{ color: DS.text4, fontSize: 11 }}>{division.departmentCount} phòng · {division.memberCount} nhân sự</div>
          </div>
        </div>
        <button onClick={onAddDept}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, background: `${division.color}12`, border: `1px solid ${division.color}30`, color: division.color, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          <Plus size={13} /> Thêm Phòng
        </button>
      </div>
      {division.departments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: DS.text5, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16 }}>
          <Building2 size={32} style={{ margin: "0 auto 12px", display: "block" }} />
          <span style={{ fontSize: 13 }}>Chưa có phòng ban nào trong Ban này</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
          {division.departments.map(d => {
            const isSelected = selectedDeptId === d.id;
            return (
              <motion.div key={d.id} onClick={() => onSelectDept(d.id)}
                whileHover={{ borderColor: `${d.color}35` }}
                style={{ padding: "1rem", borderRadius: 16, cursor: "pointer",
                  background: DS.bgCard,
                  border: `1px solid ${isSelected ? `${d.color}50` : DS.border}`,
                  boxShadow: isSelected ? `0 0 20px ${d.color}10` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${d.color}15`, border: `1px solid ${d.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={18} style={{ color: d.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: d.color, fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{d.shortName} · {d.memberCount} nhân sự</div>
                  </div>
                  {isSelected ? <ChevronRight size={14} style={{ color: d.color }} /> : null}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{d.memberCount} nhân sự</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={e => { e.stopPropagation(); onSelectDept(d.id); }}
                      style={{ padding: "4px 8px", borderRadius: 6, background: "none", border: `1px solid ${DS.border}`, color: DS.text4, cursor: "pointer", fontSize: 10 }}>
                      <Pencil size={10} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDeleteDept(d.id); }}
                      style={{ padding: "4px 8px", borderRadius: 6, background: "none", border: `1px solid ${DS.red}30`, color: DS.red, cursor: "pointer", fontSize: 10 }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
export default function DepartmentsPage() {
  const [divisions, setDivisions] = useState<DivisionAPI[]>([]);
  const [allMembers, setAllMembers] = useState<AllMemberAPI[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<DepartmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Modals
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [editDivision, setEditDivision] = useState<DivisionAPI | undefined>();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentDetail | undefined>();
  const [pendingDivisionId, setPendingDivisionId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [divs, mems] = await Promise.all([fetchDivisions(), fetchAllMembers()]);
      setDivisions(divs);
      setAllMembers(mems);
      if (divs.length > 0 && !selectedDivisionId) setSelectedDivisionId(divs[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    finally { setLoading(false); }
  }, [selectedDivisionId]);
  useEffect(() => { load(); }, [load]);
  const selectedDivision = divisions.find(d => d.id === selectedDivisionId);
  // Save division
  const handleSaveDivision = async (data: { name: string; shortName: string; color: string; description: string }) => {
    const token = getToken()!;
    if (editDivision) {
      await fetch(`/api/admin/divisions/${editDivision.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      }).then(r => r.json());
    } else {
      await fetch("/api/admin/divisions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      }).then(r => r.json());
    }
    await load();
  };
  // Save department
  const handleSaveDept = async (data: { name: string; shortName: string; key: string; color: string; description: string; mission: string; divisionId: string }) => {
    const token = getToken()!;
    if (editDept) {
      await fetch(`/api/admin/departments/${editDept.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      }).then(r => r.json());
    } else {
      await fetch("/api/admin/departments", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      }).then(r => r.json());
    }
    await load();
  };
  // Assign members to department
  const handleAssignMembers = async (memberIds: string[], headId: string | null) => {
    if (!selectedDept) return;
    const token = getToken()!;
    await fetch(`/api/admin/departments/${selectedDept.id}/members`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ memberIds, headId }),
    }).then(r => r.json());
    // Refresh selected dept
    const updated = await fetchDepartment(selectedDept.id);
    setSelectedDept(updated);
    await load();
  };
  // Delete division
  const handleDeleteDivision = async (id: string) => {
    if (!confirm("Xóa Ban này? Phòng bên trong sẽ không bị xóa.")) return;
    const token = getToken()!;
    await fetch(`/api/admin/divisions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setSelectedDivisionId(divisions.find(d => d.id !== id)?.id ?? null);
    await load();
  };
  // Delete department
  const handleDeleteDept = async (id: string) => {
    if (!confirm("Xóa Phòng này?")) return;
    const token = getToken()!;
    await fetch(`/api/admin/departments/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setSelectedDept(null);
    await load();
  };
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <Loader2 size={32} style={{ color: DS.purple, animation: "spin 1s linear infinite" }} />
        <span style={{ color: DS.text4, fontSize: 13, fontFamily: DS.mono }}>Đang tải Ban-Phòng…</span>
      </div>
    </div>
  );
  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 16 }}>
      <AlertCircle size={32} style={{ color: DS.red }} />
      <span style={{ color: DS.red, fontSize: 13 }}>{error}</span>
      <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 10, background: DS.bgCard2, border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer", fontSize: 12 }}>
        <RefreshCw size={13} /> Thử lại
      </button>
    </div>
  );
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>Ban — Phòng ban</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {divisions.length} Ban · {divisions.reduce((s, d) => s + d.departmentCount, 0)} Phòng · {divisions.reduce((s, d) => s + d.memberCount, 0)} nhân sự
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, background: DS.bgCard2, border: `1px solid ${DS.border}`, color: DS.text4, cursor: "pointer", fontSize: 12 }}>
            <RefreshCw size={13} /> Làm mới
          </button>
          <button onClick={() => { setEditDivision(undefined); setShowDivisionModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, background: GRD.primary, border: "none", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Plus size={13} /> Thêm Ban
          </button>
        </div>
      </div>
      {/* 3-column layout: Divisions | Departments | Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", alignItems: "start" }}>
        {/* Left: Division list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 4 }}>── BAN</div>
          {divisions.map(d => (
            <DivisionRow key={d.id} division={d} isSelected={selectedDivisionId === d.id}
              onSelect={() => { setSelectedDivisionId(d.id); setSelectedDept(null); }}
              onAddDept={() => { setPendingDivisionId(d.id); setEditDept(undefined); setShowDeptModal(true); }}
              onEdit={() => { setEditDivision(d); setShowDivisionModal(true); }}
            />
          ))}
        </div>
        {/* Right: Departments of selected division OR dept detail */}
        <AnimatePresence mode="wait">
          {selectedDept ? (
            <motion.div key="dept-detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <button onClick={() => setSelectedDept(null)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, background: "none", border: `1px solid ${DS.border}`, color: DS.text4, cursor: "pointer", fontSize: 12 }}>
                  <ChevronLeft size={13} /> Quay lại
                </button>
              </div>
              <DeptDetail dept={selectedDept}
                onAssign={() => setShowAssignModal(true)}
                onEdit={() => { setEditDept(selectedDept); setShowDeptModal(true); }}
              />
            </motion.div>
          ) : selectedDivision ? (
            <DeptListPanel division={selectedDivision} selectedDeptId={null}
              onSelectDept={(id) => fetchDepartment(id).then(setSelectedDept)}
              onAddDept={() => { setPendingDivisionId(selectedDivision.id); setEditDept(undefined); setShowDeptModal(true); }}
              onEditDept={(dept) => { fetchDepartment(dept.id).then(d => { setEditDept(d); setShowDeptModal(true); }); }}
              onDeleteDept={handleDeleteDept}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text5, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16 }}>
              <Network size={32} style={{ margin: "0 auto 12px", display: "block" }} />
              <span style={{ fontSize: 13 }}>Chọn một Ban để xem các Phòng bên trong</span>
            </div>
          )}
        </AnimatePresence>
      </div>
      {/* Modals */}
      <AnimatePresence>
        {showDivisionModal && (
          <DivisionModal division={editDivision} onClose={() => setShowDivisionModal(false)}
            onSave={handleSaveDivision} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDeptModal && (
          <DepartmentModal department={editDept} divisions={divisions}
            onClose={() => { setShowDeptModal(false); setPendingDivisionId(null); setEditDept(undefined); }}
            onSave={async (data) => {
              await handleSaveDept({ ...data, divisionId: pendingDivisionId ?? data.divisionId });
            }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAssignModal && selectedDept && (
          <AssignModal department={selectedDept} allMembers={allMembers}
            onClose={() => setShowAssignModal(false)} onSave={handleAssignMembers} />
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
