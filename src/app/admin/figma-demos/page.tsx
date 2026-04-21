"use client";

/**
 * Figma Demos Admin Page — LOOP Solutions
 * Route: /admin/figma-demos
 * FIX #2 (2026-04-06): Dedicated admin UI for managing Figma demo links.
 *   - List all FigmaDemo records with order context
 *   - Create new demo (link Figma URL to order)
 *   - Send demo to customer via email
 *   - Approve / reject demo versions
 *   - View demo history per order
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  X,   CheckCircle2, XCircle, Clock,
  RefreshCw, Plus, ExternalLink, Copy, Search,
  Monitor,  ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type FigmaDemo = {
  id: string;
  projectId: string;
  title: string;
  figmaUrl: string;
  clientToken: string;
  status: "pending" | "approved" | "rejected" | "approved_by_client";
  clientEmail: string | null;
  versionHash: string | null;
  rejectionNote: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    orderNumber: string;
    customerName: string;
  };
};

type DemoForm = {
  projectId: string;
  title: string;
  figmaUrl: string;
  clientEmail: string;
  versionHash: string;
};

type CreateDemoResult = {
  demoId: string;
  maskedUrl: string;
  clientToken: string;
  figmaUrl: string;
  sent: boolean;
  message: string;
};

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:           { label: "Chờ gửi",        color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  icon: <Clock size={12} /> },
  approved:          { label: "Đã duyệt",        color: "#22C55E", bg: "rgba(34,197,94,0.1)",  icon: <CheckCircle2 size={12} /> },
  rejected:          { label: "Từ chối",        color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: <XCircle size={12} /> },
  approved_by_client:{ label: "KH đã duyệt",    color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: <CheckCircle2 size={12} /> },
};

// ── Create / Send Demo Modal ───────────────────────────────────────────────────

function CreateDemoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<DemoForm>({ projectId: "", title: "", figmaUrl: "", clientEmail: "", versionHash: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateDemoResult | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApi.post<{ data: CreateDemoResult }>("/api/admin/orders/" + form.projectId + "/demo", {
        figmaUrl: form.figmaUrl,
        note: form.title,
      });
      return res;
    },
    onSuccess: (res) => {
      setResult(res as unknown as CreateDemoResult);
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId.trim()) return setError("Chọn đơn hàng");
    if (!form.figmaUrl.trim()) return setError("Figma URL là bắt buộc");
    if (!form.figmaUrl.includes("figma.com")) return setError("URL phải là link Figma hợp lệ");
    setSaving(true);
    setError("");
    try {
      await createMutation.mutateAsync();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tạo demo thất bại");
      setSaving(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: DS.body,
  };

  if (result) {
    const reviewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/figma-review/${result.clientToken}`;
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
          onClick={e => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.green}35`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 500 }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <CheckCircle2 size={48} style={{ color: DS.green, margin: "0 auto 12px" }} />
            <h3 style={{ color: DS.green, fontFamily: DS.heading, fontSize: 18, marginBottom: 4 }}>Demo đã được tạo!</h3>
            <p style={{ color: DS.text4, fontSize: 13 }}>{result.message}</p>
          </div>
          <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 6 }}>LINK KHÁCH HÀNG XEM DEMO</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={reviewUrl} readOnly style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
              <button onClick={() => copyLink(reviewUrl)} style={{ padding: "8px 12px", background: `${DS.blue}15`, border: `1px solid ${DS.blue}30`, borderRadius: 8, color: DS.blue, cursor: "pointer" }}>
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", background: GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Đóng</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>── TẠO DEMO MỚI</div>
            <div style={{ color: DS.blue, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Gửi Figma cho khách hàng</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>ORDER ID / ĐƠN HÀNG *</label>
            <input
              value={form.projectId}
              onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
              placeholder="Nhập Order ID (VD: clxxxxx)"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>TÊN DEMO</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Demo Home Page v1" style={inputStyle} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>FIGMA URL *</label>
            <input value={form.figmaUrl} onChange={e => setForm(f => ({ ...f, figmaUrl: e.target.value }))} placeholder="https://www.figma.com/file/..." style={inputStyle} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>VERSION HASH (TÙY CHỌN)</label>
            <input value={form.versionHash} onChange={e => setForm(f => ({ ...f, versionHash: e.target.value }))} placeholder="v1.2.0" style={inputStyle} />
          </div>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 8, padding: "8px 12px", color: DS.red, fontSize: 12 }}>
              {error}
            </div>
          )}
          <div style={{ padding: "0.75rem", borderRadius: 10, background: `${DS.blue}08`, border: `1px solid ${DS.blue}20` }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>HƯỚNG DẪN</div>
            <p style={{ color: DS.text3, fontSize: 12, marginTop: 6 }}>Copy link Figma từ Figma → dán vào ô trên → bấm Tạo. Hệ thống sẽ tự động tạo link review và gửi email cho khách hàng.</p>
          </div>
        </form>
        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer" }}>Hủy</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            style={{ flex: 2, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Đang tạo..." : "Tạo & gửi Demo"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Demo Row ─────────────────────────────────────────────────────────────────

function DemoRow({ demo, onApprove, onReject }: { demo: FigmaDemo; onApprove: (d: FigmaDemo) => void; onReject: (d: FigmaDemo) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[demo.status] ?? STATUS_CONFIG.pending;

  const copyLink = () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/figma-review/${demo.clientToken}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: DS.text, fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {demo.title}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {demo.project && (
              <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
                {demo.project.orderNumber}
              </span>
            )}
            <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
              {demo.project?.customerName ?? demo.clientEmail ?? "—"}
            </span>
            {demo.sentAt && (
              <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>
                Đã gửi {new Date(demo.sentAt).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            {cfg.icon} {cfg.label}
          </span>
          <button onClick={copyLink} title="Copy review link" style={{ padding: "5px 8px", background: `${DS.blue}10`, border: `1px solid ${DS.blue}25`, borderRadius: 7, color: DS.blue, cursor: "pointer" }}>
            <Copy size={12} />
          </button>
          {demo.status === "pending" && (
            <>
              <button onClick={() => onApprove(demo)} title="Duyệt demo" style={{ padding: "5px 8px", background: "rgba(34,197,94,0.1)", border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 7, color: DS.green, cursor: "pointer" }}>
                <CheckCircle2 size={12} />
              </button>
              <button onClick={() => onReject(demo)} title="Từ chối" style={{ padding: "5px 8px", background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 7, color: DS.red, cursor: "pointer" }}>
                <XCircle size={12} />
              </button>
            </>
          )}
          <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: DS.text5, cursor: "pointer" }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 16px 12px", borderTop: `1px solid ${DS.border}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>FIGMA URL</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={demo.figmaUrl} readOnly style={{ ...{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "7px 10px", color: DS.text3, fontSize: 12, outline: "none" } as React.CSSProperties, flex: 1 }} />
                  <a href={demo.figmaUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 10px", background: `${DS.purple}10`, border: `1px solid ${DS.purple}25`, borderRadius: 8, color: DS.purple, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              {demo.versionHash && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>VERSION:</span>
                  <span style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, background: `${DS.amber}10`, border: `1px solid ${DS.amber}25`, padding: "2px 8px", borderRadius: 5 }}>{demo.versionHash}</span>
                </div>
              )}
              {demo.rejectionNote && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px` }}>
                  <div style={{ color: DS.red, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>LÝ DO TỪ CHỐI</div>
                  <p style={{ color: DS.text3, fontSize: 12 }}>{demo.rejectionNote}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                  Tạo: {new Date(demo.createdAt).toLocaleDateString("vi-VN HH:mm")}
                </span>
                {demo.approvedAt && (
                  <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>
                    Duyệt: {new Date(demo.approvedAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FigmaDemosPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "figma-demos"],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await adminApi.get<{ data: FigmaDemo[] }>("/api/admin/figma-demos", { params });
      return res;
    },
  });

  const demos = data?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: async (demo: FigmaDemo) => {
      // ✅ Call the dedicated endpoint — activates project + creates default backlogs
      await adminApi.post(`/api/admin/figma-demos/${demo.id}/approve`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "figma-demos"] }),
    onError: (err: unknown) => setToast({ message: err instanceof Error ? err.message : "Duyệt thất bại", type: "error" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (demo: FigmaDemo) => {
      const note = prompt("Lý do từ chối demo:");
      if (!note) return; // user cancelled
      // ✅ Call the dedicated reject endpoint — stores rejection reason
      await adminApi.post(`/api/admin/figma-demos/${demo.id}/reject`, { reason: note });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "figma-demos"] }),
    onError: (err: unknown) => setToast({ message: err instanceof Error ? err.message : "Từ chối thất bại", type: "error" }),
  });

  const _deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/figma-demos/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "figma-demos"] }),
  });

  const filtered = demos.filter((d: FigmaDemo) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        (d.project?.customerName ?? "").toLowerCase().includes(q) ||
        (d.project?.orderNumber ?? "").toLowerCase().includes(q) ||
        (d.clientEmail ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = demos.filter((d: FigmaDemo) => d.status === "pending").length;
  const approvedCount = demos.filter((d: FigmaDemo) => d.status === "approved" || d.status === "approved_by_client").length;

  return (<>
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Figma Demo Links
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {demos.length} demo · {pendingCount} chờ duyệt · {approvedCount} đã duyệt
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "figma-demos"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono, boxShadow: "0 0 16px rgba(129,140,248,0.3)" }}>
            <Plus size={13} /> Tạo Demo mới
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng số Demo", value: demos.length, color: DS.blue, icon: <Monitor size={18} /> },
          { label: "Chờ gửi", value: pendingCount, color: DS.amber, icon: <Clock size={18} /> },
          { label: "Đã duyệt", value: approvedCount, color: DS.green, icon: <CheckCircle2 size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Search size={13} style={{ color: DS.text5 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm demo, khách hàng..."
            style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 13, flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "pending", "approved", "approved_by_client", "rejected"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: DS.mono, cursor: "pointer", border: `1px solid ${statusFilter === s ? DS.blue : DS.border}`, background: statusFilter === s ? `${DS.blue}15` : "none", color: statusFilter === s ? DS.blue : DS.text5 }}>
              {s === "all" ? "Tất cả" : s === "pending" ? "Chờ duyệt" : s === "approved" ? "Đã duyệt" : s === "approved_by_client" ? "KH duyệt" : "Từ chối"}
            </button>
          ))}
        </div>
      </div>

      {/* Demo list */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12 }}>
          <Monitor size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>Không có demo nào</div>
        </div>
      ) : (
        filtered.map((demo: FigmaDemo) => (
          <DemoRow
            key={demo.id}
            demo={demo}
            onApprove={d => approveMutation.mutate(d)}
            onReject={d => rejectMutation.mutate(d)}
          />
        ))
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateDemoModal
            onClose={() => setShowCreate(false)}
            onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["admin", "figma-demos"] }); }}
          />
        )}
      </AnimatePresence>
    </div>
    {toast && (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#0F172A", border: `1px solid ${toast.type === "success" ? "#22C55E" : "#CC3344"}50`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 320 }}>
        <span style={{ color: toast.type === "success" ? "#22C55E" : "#CC3344", fontSize: 16 }}>{toast.type === "success" ? "✓" : "✗"}</span>
        <span style={{ color: "#fff", fontSize: 13 }}>{toast.message}</span>
        <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8" }}><X size={14} /></button>
      </div>
    )}
    </>
  );
}
