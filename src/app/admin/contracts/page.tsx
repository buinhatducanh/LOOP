"use client";

/**
 * Contracts Admin Page — /admin/contracts
 * Dark admin theme, matches existing admin pages.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  X, Plus, Edit2, Trash2, Eye, Search,
  FileText, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Contract = {
  id: string;
  title: string;
  orderId: string | null;
  customerId: string | null;
  value: number | null;
  status: string;
  fileUrl: string | null;
  sentAt: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  note: string | null;
  createdAt: string;
  order?: { id: string; customerName: string } | null;
};

type ContractFormData = {
  title: string;
  orderId: string;
  customerId: string;
  value: string;
  status: string;
  fileUrl: string;
  sentAt: string;
  signedAt: string;
  expiresAt: string;
  note: string;
};

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Bản nháp",   color: DS.text4,   bg: "rgba(148,163,184,0.12)" },
  sent:      { label: "Đã gửi",     color: DS.cosmicBlue, bg: "rgba(79,125,243,0.12)" },
  signed:    { label: "Đã ký",      color: DS.green,   bg: "rgba(124,181,160,0.12)" },
  expired:   { label: "Hết hạn",    color: DS.red,     bg: "rgba(204,51,68,0.12)" },
  cancelled: { label: "Đã hủy",     color: DS.gold,    bg: "rgba(230,199,95,0.12)" },
};

const STATUS_TABS = ["all", "draft", "sent", "signed", "expired", "cancelled"];

const EMPTY_FORM: ContractFormData = {
  title: "", orderId: "", customerId: "", value: "",
  status: "draft", fileUrl: "", sentAt: "", signedAt: "", expiresAt: "", note: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtVND = (n: number | null) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(n);
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// ── Badge ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: DS.text4, bg: "rgba(148,163,184,0.12)" };
  return (
    <span style={{
      color: cfg.color, background: cfg.bg,
      borderRadius: 6, padding: "2px 10px",
      fontSize: 11, fontWeight: 600, fontFamily: DS.mono,
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ContractModal({
  contract, orders, onClose, onSave,
}: {
  contract?: Contract;
  orders?: Record<string, unknown>[];
  onClose: () => void;
  onSave: (data: ContractFormData) => void;
}) {
  const [form, setForm] = useState<ContractFormData>(
    contract
      ? {
          title: contract.title,
          orderId: contract.orderId ?? "",
          customerId: contract.customerId ?? "",
          value: contract.value != null ? String(contract.value) : "",
          status: contract.status,
          fileUrl: contract.fileUrl ?? "",
          sentAt: contract.sentAt ? contract.sentAt.slice(0, 10) : "",
          signedAt: contract.signedAt ? contract.signedAt.slice(0, 10) : "",
          expiresAt: contract.expiresAt ? contract.expiresAt.slice(0, 10) : "",
          note: contract.note ?? "",
        }
      : EMPTY_FORM
  );

  const set = (k: keyof ContractFormData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: DS.bgCard, border: `1px solid ${DS.border}`,
          borderRadius: 16, padding: "1.5rem",
          width: "100%", maxWidth: 640,
          maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ color: DS.text, fontSize: "1.1rem", fontWeight: 700, fontFamily: DS.heading }}>
            {contract ? "Sửa Hợp đồng" : "Tạo Hợp đồng mới"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <Field label="Tiêu đề *" required>
            <input value={form.title} onChange={e => set("title", e.target.value)} required
              style={inputStyle()} placeholder="VD: Hợp đồng thiết kế website ABC" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <Field label="Đơn hàng">
              <select value={form.orderId} onChange={e => set("orderId", e.target.value)}
                style={inputStyle()}>
                <option value="">— Chọn đơn hàng —</option>
                {orders?.map((o: Record<string, unknown>) => (
                  <option key={o.id as string} value={o.id as string}>
                    {(o.customerName as string) ?? (o.id as string)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Giá trị (VND)">
              <input type="number" value={form.value} onChange={e => set("value", e.target.value)}
                style={inputStyle()} placeholder="VD: 50000000" min="0" />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <Field label="Trạng thái">
              <select value={form.status} onChange={e => set("status", e.target.value)}
                style={inputStyle()}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="File URL">
              <input value={form.fileUrl} onChange={e => set("fileUrl", e.target.value)}
                style={inputStyle()} placeholder="https://..." />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.875rem" }}>
            <Field label="Ngày gửi">
              <input type="date" value={form.sentAt} onChange={e => set("sentAt", e.target.value)}
                style={inputStyle()} />
            </Field>
            <Field label="Ngày ký">
              <input type="date" value={form.signedAt} onChange={e => set("signedAt", e.target.value)}
                style={inputStyle()} />
            </Field>
            <Field label="Ngày hết hạn">
              <input type="date" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)}
                style={inputStyle()} />
            </Field>
          </div>

          <Field label="Ghi chú">
            <textarea value={form.note} onChange={e => set("note", e.target.value)}
              style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }}
              placeholder="Ghi chú thêm..." />
          </Field>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose}
              style={{ ...btnStyle("#374151"), color: DS.text3 }}>
              Hủy
            </button>
            <button type="submit"
              style={{ ...btnStyle(DS.cosmicPurple), color: DS.text }}>
              {contract ? "Lưu thay đổi" : "Tạo hợp đồng"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ color: DS.text3, fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", fontFamily: DS.mono }}>
        {label}{required && <span style={{ color: DS.pink }}> *</span>}
      </label>
      {children}
    </div>
  );
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

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    border: "none",
    borderRadius: 8,
    padding: "0.5rem 1.25rem",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: DS.body,
    transition: "opacity 0.15s",
  };
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalContract, setModalContract] = useState<Contract | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "contracts", statusFilter, search, page],
    queryFn: () => {
      const params: Record<string, string | number> = { limit: 20, page };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      return adminApi.get<{ data: Contract[]; pagination: { total: number; page: number; totalPages: number } }>(
        "/api/admin/contracts", { params }
      );
    },
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin", "orders", "all"],
    queryFn: () => adminApi.get<{ data: Record<string, unknown>[] }>("/api/admin/orders", { params: { limit: 200 } }),
  });

  const createMut = useMutation({
    mutationFn: (data: ContractFormData) =>
      adminApi.post("/api/admin/contracts", {
        ...data,
        value: data.value ? parseInt(data.value, 10) : undefined,
        sentAt: data.sentAt || undefined,
        signedAt: data.signedAt || undefined,
        expiresAt: data.expiresAt || undefined,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "contracts"] }); setShowModal(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContractFormData }) =>
      adminApi.put(`/api/admin/contracts/${id}`, {
        ...data,
        value: data.value ? parseInt(data.value, 10) : undefined,
        sentAt: data.sentAt || undefined,
        signedAt: data.signedAt || undefined,
        expiresAt: data.expiresAt || undefined,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "contracts"] }); setShowModal(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/contracts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contracts"] }),
  });

  const transitionMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.put(`/api/admin/contracts/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contracts"] }),
  });

  const contracts = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };

  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === "draft").length,
    sent: contracts.filter(c => c.status === "sent").length,
    signed: contracts.filter(c => c.status === "signed").length,
    expired: contracts.filter(c => c.status === "expired").length,
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: DS.text, fontSize: "1.4rem", fontWeight: 800, fontFamily: DS.heading }}>
            Hợp đồng
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 2 }}>Quản lý hợp đồng với khách hàng</p>
        </div>
        <button
          onClick={() => { setModalContract(undefined); setShowModal(true); }}
          style={{ ...btnStyle(DS.cosmicPurple), display: "flex", alignItems: "center", gap: 6, color: DS.text }}
        >
          <Plus size={16} /> Tạo hợp đồng
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng cộng", value: stats.total, color: DS.text },
          { label: "Bản nháp", value: stats.draft, color: DS.text4 },
          { label: "Đã gửi", value: stats.sent, color: DS.cosmicBlue },
          { label: "Đã ký", value: stats.signed, color: DS.green },
          { label: "Hết hạn", value: stats.expired, color: DS.red },
        ].map(s => (
          <div key={s.label} style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`,
            borderRadius: 10, padding: "0.75rem 1rem",
          }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ color: s.color, fontSize: "1.4rem", fontWeight: 700, fontFamily: DS.heading }}>
              {isLoading ? "—" : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              background: statusFilter === s ? DS.cosmicPurple : DS.bgCard,
              border: `1px solid ${statusFilter === s ? DS.cosmicPurple : DS.border}`,
              borderRadius: 8, padding: "0.3rem 0.875rem",
              color: statusFilter === s ? DS.text : DS.text4,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: DS.body, transition: "all 0.15s",
            }}>
            {s === "all" ? "Tất cả" : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm kiếm hợp đồng..."
          style={{ ...inputStyle(), paddingLeft: "2.25rem", width: "100%", maxWidth: 320 }}
        />
      </div>

      {/* Table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
              {["Tiêu đề", "Giá trị", "Trạng thái", "Ngày gửi", "Ngày ký", "Hết hạn", "Thao tác"].map(h => (
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
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>
                  Đang tải...
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>
                  Chưa có hợp đồng nào
                </td>
              </tr>
            ) : contracts.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${DS.border}`, transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                  {c.order && (
                    <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>
                      ĐH: {c.order.customerName ?? c.order.id}
                    </div>
                  )}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: DS.gold, fontSize: 13, fontWeight: 600, fontFamily: DS.mono }}>
                  {fmtVND(c.value)}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12 }}>{fmtDate(c.sentAt)}</td>
                <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12 }}>{fmtDate(c.signedAt)}</td>
                <td style={{ padding: "0.75rem 1rem", color: c.expiresAt && new Date(c.expiresAt) < new Date() ? DS.red : DS.text3, fontSize: 12 }}>
                  {fmtDate(c.expiresAt)}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {c.status === "draft" && (
                      <button onClick={() => transitionMut.mutate({ id: c.id, status: "sent" })}
                        style={{ ...tinyBtn(DS.cosmicBlue), color: DS.cosmicBlue }}>
                        Đã gửi
                      </button>
                    )}
                    {c.status === "sent" && (
                      <button onClick={() => transitionMut.mutate({ id: c.id, status: "signed" })}
                        style={{ ...tinyBtn(DS.green), color: DS.green }}>
                        Đã ký
                      </button>
                    )}
                    {c.fileUrl && (
                      <a href={c.fileUrl} target="_blank" rel="noopener noreferrer"
                        style={{ ...tinyBtn(DS.text4), color: DS.text3 }}>
                        <Eye size={13} />
                      </a>
                    )}
                    <button onClick={() => { setModalContract(c); setShowModal(true); }}
                      style={{ ...tinyBtn(DS.cosmicPurple), color: DS.cosmicPurple }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => {
                      if (confirm("Xóa hợp đồng này?")) deleteMut.mutate(c.id);
                    }}
                      style={{ ...tinyBtn(DS.red), color: DS.red }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <span style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            Trang {pagination.page} / {pagination.totalPages} — {pagination.total} hợp đồng
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ ...tinyBtn(DS.border), color: DS.text3, cursor: page <= 1 ? "not-allowed" : "pointer" }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              style={{ ...tinyBtn(DS.border), color: DS.text3, cursor: page >= pagination.totalPages ? "not-allowed" : "pointer" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ContractModal
            contract={modalContract}
            orders={ordersData?.data}
            onClose={() => setShowModal(false)}
            onSave={data => {
              if (modalContract) updateMut.mutate({ id: modalContract.id, data });
              else createMut.mutate(data);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function tinyBtn(color: string): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${color}40`,
    borderRadius: 6,
    padding: "4px 6px",
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
  };
}
