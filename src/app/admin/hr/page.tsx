"use client";

/**
 * HR — Leave Management Admin Page — /admin/hr
 * Section: Leave Requests + Team Calendar + Leave Balance
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  X, Plus, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Calendar, Users, Clock, AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveRequest = {
  id: string;
  memberId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  respondedBy: string | null;
  respondedAt: string | null;
  note: string | null;
  createdAt: string;
  member?: { id: string; name: string | null; image: string | null } | null;
};

type Member = {
  id: string;
  name: string;
  image: string | null;
  rank: string;
};

type LeaveRequestFormData = {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
};

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  annual:     { label: "Nghỉ phép",  color: DS.cosmicBlue,   bg: "rgba(79,125,243,0.12)" },
  sick:       { label: "Ốm đau",     color: DS.green,        bg: "rgba(124,181,160,0.12)" },
  unpaid:     { label: "Không lương", color: DS.text4,       bg: "rgba(148,163,184,0.12)" },
  maternity:  { label: "Thai sản",   color: DS.pink,         bg: "rgba(236,72,153,0.12)" },
  paternity:  { label: "Cha sản",    color: DS.cosmicCyan,   bg: "rgba(98,197,235,0.12)" },
  bereavement:{ label: "Tang lễ",    color: DS.cosmicPurple,  bg: "rgba(107,61,245,0.12)" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Chờ duyệt",  color: DS.gold,        bg: "rgba(230,199,95,0.12)" },
  approved:  { label: "Đã duyệt",   color: DS.green,       bg: "rgba(124,181,160,0.12)" },
  rejected:  { label: "Từ chối",    color: DS.red,          bg: "rgba(204,51,68,0.12)" },
  cancelled: { label: "Đã hủy",      color: DS.text4,        bg: "rgba(148,163,184,0.12)" },
};

const TYPE_OPTIONS = Object.keys(TYPE_CONFIG);
const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
}

function fmtShortDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }); }
  catch { return String(d); }
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${DS.border}`,
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    color: DS.text,
    fontSize: 13,
    fontFamily: DS.body,
    outline: "none",
    boxSizing: "border-box",
  };
}

function btnStyle(bg: string, color = "#fff"): React.CSSProperties {
  return {
    background: bg,
    border: "none",
    borderRadius: 8,
    padding: "0.5rem 1.25rem",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: DS.body,
    color,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
}

function tinyBtn(color: string): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${color}40`,
    borderRadius: 6,
    padding: "4px 8px",
    color,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
  };
}

// ── Badges ──────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? { label: type, color: DS.text4, bg: "rgba(148,163,184,0.12)" };
  return <span style={{ color: cfg.color, background: cfg.bg, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: DS.text4, bg: "rgba(148,163,184,0.12)" };
  return <span style={{ color: cfg.color, background: cfg.bg, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

// ── Calendar ─────────────────────────────────────────────────────────────────

function LeaveCalendar({ requests }: { requests: LeaveRequest[] }) {
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth()); // 0-indexed

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const MONTH_NAMES = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  // Build a map: "YYYY-MM-DD" → LeaveRequest[]
  const dateMap = new Map<string, LeaveRequest[]>();
  for (const req of requests) {
    if (req.status !== "approved") continue;
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const d = new Date(start);
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(req);
      d.setDate(d.getDate() + 1);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
        <button onClick={prevMonth} style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronLeft size={14} /></button>
        <h3 style={{ color: DS.text2, fontSize: "0.95rem", fontWeight: 700, fontFamily: DS.heading }}>
          {MONTH_NAMES[calMonth]} {calYear}
        </h3>
        <button onClick={nextMonth} style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronRight size={14} /></button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
          <div key={d} style={{
            textAlign: "center", color: DS.text4, fontSize: 10,
            fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em",
            padding: "2px 0",
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today;
          const entries = dateMap.get(dateStr) ?? [];
          return (
            <div key={dateStr} style={{
              minHeight: 52,
              background: isToday ? `${DS.pink}10` : DS.bg,
              border: `1px solid ${isToday ? DS.pink : DS.border}40`,
              borderRadius: 6,
              padding: "3px 4px",
              position: "relative",
            }}>
              <span style={{
                color: isToday ? DS.pink : DS.text4,
                fontSize: 10, fontWeight: isToday ? 700 : 400,
                fontFamily: DS.mono,
                display: "block", marginBottom: 2,
              }}>{day}</span>
              {entries.slice(0, 2).map(e => (
                <div key={e.id} style={{
                  background: `${TYPE_CONFIG[e.type]?.color ?? DS.text4}30`,
                  color: TYPE_CONFIG[e.type]?.color ?? DS.text4,
                  borderRadius: 3, padding: "1px 3px",
                  fontSize: 9, fontFamily: DS.mono,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  marginBottom: 1,
                }}>
                  {e.member?.name?.split(" ")[0] ?? e.memberId.slice(0, 4)}
                </div>
              ))}
              {entries.length > 2 && (
                <span style={{ color: DS.text4, fontSize: 9 }}>+{entries.length - 2}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Leave Balance Section ─────────────────────────────────────────────────────

function LeaveBalance({ members }: { members: Member[] }) {
  // Placeholder balances (leave tracking not yet in DB)
  return (
    <div>
      <h3 style={{ color: DS.text2, fontSize: "0.95rem", fontWeight: 700, fontFamily: DS.heading, marginBottom: "0.875rem" }}>
        Số ngày phép còn lại (tham khảo)
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
        {members.slice(0, 12).map(m => (
          <div key={m.id} style={{
            background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "0.75rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `${DS.cosmicPurple}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: DS.cosmicPurple,
              }}>
                {m.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div style={{ color: DS.text2, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.name}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[
                { label: "Nghỉ phép", val: 12, color: DS.cosmicBlue },
                { label: "Ốm đau", val: 5, color: DS.green },
              ].map(b => (
                <div key={b.label} style={{ background: `${b.color}10`, borderRadius: 4, padding: "3px 6px" }}>
                  <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 1 }}>{b.label}</div>
                  <div style={{ color: b.color, fontSize: 14, fontWeight: 700, fontFamily: DS.heading }}>{b.val}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: "0.75rem", textAlign: "center" }}>
        * Số ngày phép chưa được đồng bộ từ HR system — chỉ mang tính tham khảo
      </p>
    </div>
  );
}

// ── Create Modal ─────────────────────────────────────────────────────────────

function CreateLeaveModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: LeaveRequestFormData) => void;
}) {
  const [form, setForm] = useState<LeaveRequestFormData>({
    type: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const set = (k: keyof LeaveRequestFormData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return;
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ color: DS.text, fontSize: "1.1rem", fontWeight: 700, fontFamily: DS.heading }}>Tạo đơn xin nghỉ</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ color: DS.text3, fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", fontFamily: DS.mono }}>Loại nghỉ phép *</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle()}>
              {TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{(TYPE_CONFIG[t] ?? { label: t }).label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <label style={{ color: DS.text3, fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", fontFamily: DS.mono }}>Từ ngày *</label>
              <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} style={inputStyle()} required />
            </div>
            <div>
              <label style={{ color: DS.text3, fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", fontFamily: DS.mono }}>Đến ngày *</label>
              <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} style={inputStyle()} required />
            </div>
          </div>

          <div>
            <label style={{ color: DS.text3, fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", fontFamily: DS.mono }}>Lý do</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)}
              style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }}
              placeholder="VD: Đi du lịch gia đình..." />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose} style={{ ...btnStyle("#374151"), color: DS.text3 }}>Hủy</button>
            <button type="submit" style={{ ...btnStyle(DS.cosmicPurple), color: DS.text }}>Gửi đơn</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HrPage() {
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leave-requests", statusFilter, typeFilter, page],
    queryFn: () => {
      const params: Record<string, string | number> = { limit: 20, page };
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      return adminApi.get<{
        data: LeaveRequest[];
        pagination: { total: number; page: number; totalPages: number };
      }>("/api/admin/leave-requests", { params });
    },
  });

  const { data: membersData } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: () => adminApi.get<{ data: Member[] }>("/api/admin/team", { params: { limit: 100 } }),
  });

  const createMut = useMutation({
    mutationFn: (data: LeaveRequestFormData) => adminApi.post("/api/admin/leave-requests", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] }); setShowCreate(false); },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => adminApi.post(`/api/admin/leave-requests/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => adminApi.post(`/api/admin/leave-requests/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] }),
  });

  const requests = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };
  const members = membersData?.data ?? [];

  // Stats
  const pending = requests.filter(r => r.status === "pending").length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const approvedThisMonth = requests.filter(r =>
    r.status === "approved" && r.respondedAt?.startsWith(thisMonth)
  ).length;
  const totalDaysThisMonth = requests
    .filter(r => r.status === "approved" && r.respondedAt?.startsWith(thisMonth))
    .reduce((s, r) => s + r.days, 0);
  const onLeaveToday = requests.filter(r => {
    if (r.status !== "approved") return false;
    const today = new Date().toISOString().slice(0, 10);
    return r.startDate <= today && r.endDate >= today;
  }).length;

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: DS.text, fontSize: "1.4rem", fontWeight: 800, fontFamily: DS.heading }}>Nhân sự & Nghỉ phép</h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 2 }}>Quản lý đơn xin nghỉ và lịch nghỉ phép</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ ...btnStyle(DS.cosmicPurple), color: DS.text }}>
          <Plus size={16} /> Tạo đơn nghỉ
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Chờ duyệt", value: pending, color: DS.gold, icon: <Clock size={14} /> },
          { label: "Đã duyệt tháng này", value: approvedThisMonth, color: DS.green, icon: <CheckCircle2 size={14} /> },
          { label: "Ngày nghỉ tháng này", value: totalDaysThisMonth, color: DS.cosmicCyan, icon: <Calendar size={14} /> },
          { label: "Đang nghỉ hôm nay", value: onLeaveToday, color: DS.pink, icon: <Users size={14} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>
              {isLoading ? "—" : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ─── SECTION: Leave Requests ─────────────────────────────────────── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
            <option value="all">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{(STATUS_CONFIG[s] ?? { label: s }).label}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
            <option value="all">Tất cả loại</option>
            {TYPE_OPTIONS.map(t => (
              <option key={t} value={t}>{(TYPE_CONFIG[t] ?? { label: t }).label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                {["Thành viên", "Loại nghỉ", "Từ ngày", "Đến ngày", "Số ngày", "Lý do", "Trạng thái", "Thao tác"].map(h => (
                  <th key={h} style={{
                    padding: "0.625rem 1rem", textAlign: "left",
                    color: DS.text4, fontSize: 11, fontWeight: 600,
                    fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>Chưa có đơn nghỉ nào</td></tr>
              ) : requests.map(req => (
                <tr key={req.id} style={{ borderBottom: `1px solid ${DS.border}`, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: `${DS.cosmicPurple}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, color: DS.cosmicPurple,
                        flexShrink: 0,
                      }}>
                        {req.member?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>
                        {req.member?.name ?? req.memberId.slice(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}><TypeBadge type={req.type} /></td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12 }}>{fmtShortDate(req.startDate)}</td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12 }}>{fmtShortDate(req.endDate)}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ color: DS.text2, fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
                      {req.days}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ color: DS.text4, fontSize: 12, maxWidth: 120, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {req.reason ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}><StatusBadge status={req.status} /></td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {req.status === "pending" && (
                        <>
                          <button onClick={() => approveMut.mutate(req.id)}
                            style={{ ...tinyBtn(DS.green), color: DS.green }} title="Duyệt">
                            <CheckCircle2 size={13} />
                          </button>
                          <button onClick={() => rejectMut.mutate(req.id)}
                            style={{ ...tinyBtn(DS.red), color: DS.red }} title="Từ chối">
                            <XCircle size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.875rem" }}>
            <span style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
              Trang {pagination.page} / {pagination.totalPages} — {pagination.total} đơn
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: DS.border, margin: "1.5rem 0" }} />

      {/* ─── SECTION: Calendar + Balance ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <LeaveCalendar requests={requests} />
        </div>
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <LeaveBalance members={members} />
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateLeaveModal
            onClose={() => setShowCreate(false)}
            onSave={data => createMut.mutate(data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
