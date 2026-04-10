"use client";

/**
 * Admin Careers — Job Postings + Applications Management
 * Route: /admin/careers
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit2, Trash2, Search, Eye, Users,
  ChevronDown, ChevronUp, X, Check, Clock,
  Briefcase, MapPin, DollarSign,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type JobPosting = {
  id: string;
  title: string;
  titleEn: string | null;
  department: string;
  role: string;
  employmentType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  description: string;
  requirements: string;
  benefits: string;
  status: string;
  isActive: boolean;
  sortOrder: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number };
};

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  coverLetter: string | null;
  status: string;
  createdAt: string;
  jobPosting: { id: string; title: string; department: string };
};

type PostFormData = {
  title: string;
  titleEn: string;
  department: string;
  role: string;
  employmentType: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  benefits: string;
  status: string;
  sortOrder: string;
  expiresAt: string;
};

const DEPT_COLORS: Record<string, string> = {
  engineering: "#3B82F6",
  design: "#A78BFA",
  media: "#EC4899",
  marketing: "#F59E0B",
  sales: "#22C55E",
  finance: "#14B8A6",
  hr: "#6366F1",
  management: "#EAB308",
};

const APP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  applied: { label: "Ứng tuyển", color: "#3B82F6" },
  screening: { label: "Sàng lọc", color: "#8B5CF6" },
  interview: { label: "Phỏng vấn", color: "#F59E0B" },
  offer: { label: "Đề xuất", color: "#06B6D4" },
  hired: { label: "Tuyển dụng", color: "#22C55E" },
  rejected: { label: "Từ chối", color: "#EF4444" },
};

const DEFAULT_FORM: PostFormData = {
  title: "",
  titleEn: "",
  department: "engineering",
  role: "mid",
  employmentType: "full_time",
  location: "Ho Chi Minh City, Vietnam",
  salaryMin: "",
  salaryMax: "",
  description: "",
  requirements: "",
  benefits: "",
  status: "open",
  sortOrder: "0",
  expiresAt: "",
};

// ── Posting modal ────────────────────────────────────────────────────────────

function PostingModal({
  posting,
  onClose,
}: {
  posting: JobPosting | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<PostFormData>(
    posting
      ? {
          title: posting.title,
          titleEn: posting.titleEn ?? "",
          department: posting.department,
          role: posting.role,
          employmentType: posting.employmentType,
          location: posting.location,
          salaryMin: posting.salaryMin?.toString() ?? "",
          salaryMax: posting.salaryMax?.toString() ?? "",
          description: posting.description,
          requirements: posting.requirements,
          benefits: posting.benefits,
          status: posting.status,
          sortOrder: posting.sortOrder.toString(),
          expiresAt: posting.expiresAt ? posting.expiresAt.split("T")[0] : "",
        }
      : DEFAULT_FORM
  );

  const createMut = useMutation({
    mutationFn: (data: unknown) =>
      adminApi.post<{ data: JobPosting }>("/api/admin/job-postings", data as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-postings"] }); onClose(); },
  });

  const updateMut = useMutation({
    mutationFn: (data: unknown) =>
      adminApi.put<{ data: JobPosting }>(`/api/admin/job-postings/${posting!.id}`, data as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-postings"] }); onClose(); },
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      adminApi.delete(`/api/admin/job-postings/${posting!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-postings"] }); onClose(); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
      salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
      sortOrder: parseInt(form.sortOrder) || 0,
      expiresAt: form.expiresAt || null,
    };
    if (posting) updateMut.mutate(payload);
    else createMut.mutate(payload);
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: "#1A2438",
    border: `1px solid ${DS.border}`,
    borderRadius: 8,
    padding: "0.625rem 0.875rem",
    color: DS.text,
    fontSize: "0.8125rem",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    color: DS.text4,
    fontSize: "0.6875rem",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: "0.375rem",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "1.25rem",
          background: DS.bgCard3,
          border: `1px solid ${DS.border}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: `1px solid ${DS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: DS.bgCard3,
            zIndex: 1,
          }}
        >
          <div>
            <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1rem", fontWeight: 800 }}>
              {posting ? "Sửa tin tuyển dụng" : "Tạo tin tuyển dụng"}
            </h2>
            <p style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
              {posting ? `ID: ${posting.id.slice(0, 8)}...` : "Tạo tin mới"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(30,40,60,0.8)",
              border: `1px solid ${DS.border}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: DS.text3,
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Title row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Tiêu đề (VI) *</label>
              <input style={fieldStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Senior Frontend Developer" />
            </div>
            <div>
              <label style={labelStyle}>Tiêu đề (EN)</label>
              <input style={fieldStyle} value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Senior Frontend Developer (English)" />
            </div>
          </div>
          {/* Dept + Role */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>PHÒNG BAN</label>
              <select style={fieldStyle} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {["engineering","design","media","marketing","sales","finance","hr","management"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>CẤP BẬC</label>
              <select style={fieldStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {["junior","mid","senior","lead","manager"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>HÌNH THỨC</label>
              <select style={fieldStyle} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                {[["full_time","Toàn thời gian"],["part_time","Bán thời gian"],["contract","Hợp đồng"],["internship","Thực tập"]].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Salary + Location */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>LƯƠNG TỐI THIỂU (VNĐ)</label>
              <input style={fieldStyle} type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="15000000" />
            </div>
            <div>
              <label style={labelStyle}>LƯƠNG TỐI ĐA (VNĐ)</label>
              <input style={fieldStyle} type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="35000000" />
            </div>
            <div>
              <label style={labelStyle}>ĐỊA ĐIỂM</label>
              <input style={fieldStyle} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="TP.HCM" />
            </div>
          </div>
          {/* Description */}
          <div>
            <label style={labelStyle}>MÔ TẢ CÔNG VIỆC</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chi tiết công việc..."
            />
          </div>
          {/* Requirements */}
          <div>
            <label style={labelStyle}>YÊU CẦU</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="Yêu cầu kinh nghiệm, kỹ năng..."
            />
          </div>
          {/* Benefits */}
          <div>
            <label style={labelStyle}>PHÚC LỢI</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }}
              value={form.benefits}
              onChange={(e) => setForm({ ...form, benefits: e.target.value })}
              placeholder="Phúc lợi: bảo hiểm, remote, team building..."
            />
          </div>
          {/* Status + Sort */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>TRẠNG THÁI</label>
              <select style={fieldStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {[["open","Mở"],["closed","Đóng"],["draft","Nháp"]].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>SORT ORDER</label>
              <input style={fieldStyle} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>HẾT HẠN</label>
              <input style={fieldStyle} type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between", marginTop: "0.5rem" }}>
            {posting && (
              <button
                type="button"
                onClick={() => deleteMut.mutate()}
                disabled={deleteMut.isPending}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: `1px solid rgba(239,68,68,0.3)`,
                  color: DS.red,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Xóa
              </button>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: 8,
                  background: "rgba(30,40,60,0.8)",
                  border: `1px solid ${DS.border}`,
                  color: DS.text3,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: 8,
                  background: GRD.primary,
                  border: "none",
                  color: "#fff",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {posting ? "Lưu" : "Tạo mới"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Applications panel ──────────────────────────────────────────────────────

function ApplicationsPanel({ postingId }: { postingId: string }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["job-applications", postingId],
    queryFn: () => adminApi.get<{ data: { data: Application[] } }>(`/api/admin/job-applications?jobPostingId=${postingId}&limit=50`),
  });

  const qc = useQueryClient();
  const updateAppMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // We'd need a PATCH endpoint; use a workaround via job-postings
      // For now, just refetch
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-applications"] }),
  });

  const apps = (data as unknown as { data?: { data?: Application[] } })?.data?.data ?? [];
  const filtered = filterStatus === "all" ? apps : apps.filter((a) => a.status === filterStatus);

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        borderRadius: "0.875rem",
        background: "rgba(10,15,30,0.6)",
        border: `1px solid ${DS.border}`,
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
        {["all", "applied", "screening", "interview", "offer", "hired", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              background: filterStatus === s ? (s === "all" ? GRD.primary : `${APP_STATUS_CONFIG[s]?.color ?? DS.pink}20`) : "rgba(30,40,60,0.6)",
              border: `1px solid ${filterStatus === s ? (s === "all" ? "transparent" : APP_STATUS_CONFIG[s]?.color ?? DS.pink) : DS.border}`,
              color: filterStatus === s ? "#fff" : DS.text3,
              fontSize: "0.6875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s === "all" ? "Tất cả" : APP_STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ color: DS.text4, textAlign: "center", padding: "1rem" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: DS.text4, textAlign: "center", padding: "1rem" }}>Chưa có ứng viên</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map((app) => {
            const cfg = APP_STATUS_CONFIG[app.status] ?? APP_STATUS_CONFIG.applied;
            return (
              <div
                key={app.id}
                style={{
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  background: "rgba(15,23,42,0.5)",
                  border: `1px solid ${DS.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: GRD.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    flexShrink: 0,
                  }}
                >
                  {app.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: DS.text, fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.125rem" }}>
                    {app.name}
                  </div>
                  <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
                    {app.email}
                    {app.phone && ` · ${app.phone}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  {app.linkedinUrl && (
                    <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: DS.text4, display: "flex" }}>
                      <Eye size={13} />
                    </a>
                  )}
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: `${cfg.color}15`,
                      color: cfg.color,
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminCareersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["job-postings"],
    queryFn: () => adminApi.get<{ data: { data: JobPosting[] } }>("/api/admin/job-postings?limit=50"),
  });

  const postings: JobPosting[] = (data as unknown as { data?: { data?: JobPosting[] } })?.data?.data ?? [];
  const filtered = postings.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openCreate() {
    setEditingPosting(null);
    setShowModal(true);
  }

  function openEdit(posting: JobPosting) {
    setEditingPosting(posting);
    setShowModal(true);
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900, marginBottom: "0.25rem" }}>
            Tuyển dụng
          </h1>
          <p style={{ color: DS.text4, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>
            Quản lý tin tuyển dụng và ứng viên
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: 10,
            background: GRD.primary,
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={15} />
          Tạo tin mới
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          style={{
            flex: 1,
            minWidth: 200,
            background: DS.bgCard2,
            border: `1px solid ${DS.border}`,
            borderRadius: 8,
            padding: "0.5rem 0.875rem",
            color: DS.text,
            fontSize: "0.8125rem",
            outline: "none",
          }}
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {[
            { value: "all", label: "Tất cả" },
            { value: "open", label: "Đang tuyển" },
            { value: "closed", label: "Đã đóng" },
            { value: "draft", label: "Nháp" },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: 8,
                background: filterStatus === s.value ? (s.value === "open" ? `${DS.green}20` : s.value === "all" ? `${DS.pink}20` : "rgba(30,40,60,0.6)") : "rgba(30,40,60,0.6)",
                border: `1px solid ${filterStatus === s.value ? (s.value === "open" ? DS.green : s.value === "all" ? DS.pink : DS.border) : DS.border}`,
                color: filterStatus === s.value ? DS.text : DS.text3,
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: DS.text4 }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: DS.text4 }}>
          Không có tin tuyển dụng
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map((posting) => {
            const isExpanded = expandedId === posting.id;
            const deptColor = DEPT_COLORS[posting.department] ?? DS.pink;
            return (
              <div
                key={posting.id}
                style={{
                  borderRadius: "1rem",
                  background: "rgba(15,23,42,0.65)",
                  border: `1px solid ${DS.border}`,
                  overflow: "hidden",
                }}
              >
                {/* Row */}
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : posting.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: `${deptColor}15`,
                          border: `1px solid ${deptColor}30`,
                          color: deptColor,
                          fontSize: "0.5625rem",
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          textTransform: "uppercase",
                        }}
                      >
                        {posting.department}
                      </span>
                      <span style={{ color: DS.text, fontWeight: 700, fontSize: "0.9375rem", fontFamily: DS.heading }}>
                        {posting.title}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Briefcase size={10} />
                        {posting.role}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <MapPin size={10} />
                        {posting.location}
                      </span>
                      {posting.salaryMin && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: DS.gold }}>
                          <DollarSign size={10} />
                          {(posting.salaryMin / 1_000_000).toFixed(0)}–{(posting.salaryMax ?? posting.salaryMin) / 1_000_000}0M
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    {posting._count?.applications !== undefined && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: `${DS.cosmicBlue}15`,
                          color: DS.cosmicBlue,
                          fontSize: "0.625rem",
                          fontWeight: 600,
                        }}
                      >
                        <Users size={10} />
                        {posting._count.applications}
                      </span>
                    )}
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: posting.status === "open" ? `${DS.green}15` : "rgba(30,40,60,0.6)",
                        color: posting.status === "open" ? DS.green : DS.text4,
                        fontSize: "0.625rem",
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {posting.status === "open" ? "Mở" : posting.status === "draft" ? "Nháp" : "Đóng"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(posting); }}
                      style={{
                        background: "rgba(30,40,60,0.8)",
                        border: `1px solid ${DS.border}`,
                        borderRadius: 8,
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: DS.text3,
                        cursor: "pointer",
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} style={{ color: DS.text4 }} /> : <ChevronDown size={14} style={{ color: DS.text4 }} />}
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ borderTop: `1px solid ${DS.border}`, padding: "0 1.25rem 1rem" }}>
                        <ApplicationsPanel postingId={posting.id} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <PostingModal posting={editingPosting} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
