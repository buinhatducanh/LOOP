"use client";

import { useState } from "react";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";

import { DS, GRD } from "@/lib/design-tokens";
import {
  X, CheckCircle2, Eye, ChevronRight, Search,
  RefreshCw, Plus, Trash2, Edit2, AlertTriangle,
  Monitor,
} from "lucide-react";

// P1-6 FIX: align FE statuses with actual backend order-lifecycle.ts
// ── Status config: all statuses used by the backend ──────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  // Custom order statuses
  draft:        { label: "Bản nháp",     color: "#94A3B8", bg: "rgba(148,163,168,0.1)" },
  pending:      { label: "Chờ báo giá",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  quoted:       { label: "Đã báo giá",   color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  accepted:     { label: "Đã chấp nhận", color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  paid_partial: { label: "Thanh toán 1 phần", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  paid_full:    { label: "Thanh toán đủ",    color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  contracted:   { label: "Đã ký hợp đồng",  color: "#818CF8", bg: "rgba(129,140,248,0.1)" },
  designing:    { label: "Đang thiết kế",    color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  developing:   { label: "Đang phát triển",  color: "#C084FC", bg: "rgba(192,132,252,0.1)" },
  reviewing:    { label: "Review",             color: "#F472B6", bg: "rgba(244,114,182,0.1)" },
  delivered:    { label: "Đã bàn giao",      color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  completed:    { label: "Hoàn thành",        color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  cancelled:   { label: "Đã hủy",            color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  // Template order statuses
  setting_up:   { label: "Đang thiết lập",   color: "#F97316", bg: "rgba(249,115,22,0.1)" },
};

// ── Transition map — mirrors backend order-lifecycle.ts ────────────────────────
// Used to compute "next valid status" for each current status
const TRANSITIONS: Record<string, string[]> = {
  // Custom
  draft:        ["pending", "cancelled"],
  pending:      ["quoted", "cancelled"],
  quoted:       ["accepted", "cancelled"],
  accepted:     ["paid_partial", "paid_full", "cancelled"],
  paid_partial: ["paid_full", "contracted", "cancelled"],
  paid_full:    ["contracted", "cancelled"],
  contracted:   ["designing", "cancelled"],
  designing:    ["developing", "cancelled"],
  developing:   ["reviewing", "cancelled"],
  reviewing:    ["delivered", "developing", "cancelled"],
  delivered:    ["completed"],
  completed:    [],
  cancelled:    [],
  // Template (pending/paid_full/delivered already defined above — merge below)
  setting_up:   ["delivered", "cancelled"],
};

// Terminal statuses that should block certain UI actions
const TERMINAL_STATUSES = new Set(["completed", "cancelled"]);

// ── Ordered flow for UI display (status timeline + filter chips) ───────────────
const STATUS_FLOW = [
  "draft", "pending", "quoted", "accepted",
  "paid_partial", "paid_full", "contracted",
  "designing", "developing", "reviewing", "delivered", "completed", "cancelled",
] as const;

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number | null | undefined;
  status: string;
  createdAt: string;
  package?: { title: string };
  projectTitle?: string;
  note?: string;
};

type OrderFormData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageTitle: string;
  totalAmount: string;
  note: string;
};

function OrderRow({
  order,
  onTransition,
  onDetail,
  onEdit,
  onDelete,
  onSendDemo,
}: {
  order: Order;
  onTransition: (id: string, currentStatus: string) => void;
  onDetail: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onSendDemo?: (order: Order) => void;
}) {
  const { t } = useAdminTranslations();
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: DS.text4, bg: "transparent" };

  const fmt = (n: number | null | undefined) =>
    n != null
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)
      : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "border-color 0.2s",
      }}
    >
      {/* Status dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}` }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.customerName}
        </p>
        <p style={{ color: DS.text4, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.package?.title ?? order.customerEmail}
        </p>
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>{fmt(order.totalAmount)}</p>
        <span style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{cfg.label}</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(order)}
          title="Sửa"
          style={{
            background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)",
            borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.purple,
            display: "flex", alignItems: "center",
          }}
        >
          <Edit2 size={12} />
        </button>
        {/* Gửi Demo — hiện khi order đang ở designing hoặc developing */}
        {onSendDemo && (order.status === "designing" || order.status === "developing") && (
          <button
            onClick={() => onSendDemo(order)}
            title="Gửi Demo cho khách"
            style={{
              background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)",
              borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.blue,
              display: "flex", alignItems: "center",
            }}
          >
            <Monitor size={12} />
          </button>
        )}
        {((): React.ReactNode => {
          // P1-6 FIX: derive next valid statuses from TRANSITIONS map (backend-aligned)
          const validNext = TRANSITIONS[order.status] ?? [];
          const next = validNext[0]; // primary forward step
          if (!next || TERMINAL_STATUSES.has(order.status)) return null;
          return (
            <button
              onClick={() => onTransition(order.id, next)}
              title={`Chuyển → ${STATUS_CONFIG[next]?.label ?? ""}`}
              style={{
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.green,
                display: "flex", alignItems: "center", fontSize: 11, fontFamily: DS.mono,
              }}
            >
              <ChevronRight size={12} />
            </button>
          );
        })()}
        <button
          onClick={() => onDelete(order)}
          title="Xóa"
          style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#EF4444",
            display: "flex", alignItems: "center",
          }}
        >
          <Trash2 size={12} />
        </button>
        <button
          onClick={() => onDetail(order)}
          title="Chi tiết"
          style={{
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue,
            display: "flex", alignItems: "center",
          }}
        >
          <Eye size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function OrderEditModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!order;
  const [form, setForm] = useState<OrderFormData>({
    customerName: order?.customerName ?? "",
    customerEmail: order?.customerEmail ?? "",
    customerPhone: order?.customerPhone ?? "",
    packageTitle: order?.package?.title ?? "",
    totalAmount: order?.totalAmount != null ? String(order.totalAmount) : "",
    note: order?.note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return setError("Tên khách hàng là bắt buộc");
    if (!form.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      return setError("Email không hợp lệ");
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        packageTitle: form.packageTitle.trim() || undefined,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
        note: form.note.trim() || undefined,
        ...(isEdit ? {} : { status: "pending" }),
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/orders/${order!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/orders", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{isEdit ? t("orders.modalEditTitle") : t("orders.modalCreateTitle")}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>TÊN KHÁCH HÀNG *</label>
              <input style={inputStyle} value={form.customerName} onChange={(e) => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Nguyễn Văn A" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>EMAIL *</label>
                <input style={inputStyle} type="email" value={form.customerEmail} onChange={(e) => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="khach@email.com" required />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>ĐIỆN THOẠI</label>
                <input style={inputStyle} value={form.customerPhone} onChange={(e) => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="0901..." />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>GÓI DỊCH VỤ</label>
                <input style={inputStyle} value={form.packageTitle} onChange={(e) => setForm(f => ({ ...f, packageTitle: e.target.value }))} placeholder="Web Doanh Nghiệp" />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>TỔNG TIỀN (VNĐ)</label>
                <input style={inputStyle} type="number" value={form.totalAmount} onChange={(e) => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="15000000" min="0" />
              </div>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>GHI CHÚ</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Ghi chú thêm..." />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? t("orders.formBtnSaving") : isEdit ? t("orders.formBtnSave") : t("orders.formBtnCreate")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DeleteConfirmModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useAdminTranslations();
  if (!order) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}
        >
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <AlertTriangle size={24} style={{ color: "#EF4444" }} />
            </div>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{t("orders.deleteTitle")}</h3>
            <p style={{ color: DS.text4, fontSize: 13 }}>
              {t("orders.deleteMsg", { name: order.customerName })}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
              {t("common.cancel")}
            </button>
            <button onClick={onConfirm} style={{ flex: 1, padding: "10px", background: "#EF4444", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              {t("common.delete")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { t } = useAdminTranslations();
  if (!order) return null;
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: DS.text4, bg: "transparent" };
  const fmt = (n: number | null | undefined) =>
    n != null
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)
      : "—";

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 520 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{order.customerName}</h3>
              <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{order.customerEmail}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Gói dịch vụ", value: order.package?.title ?? "—" },
              { label: "Tổng tiền", value: fmt(order.totalAmount) },
              { label: "Trạng thái", value: cfg.label, color: cfg.color },
              { label: "Ngày tạo", value: new Date(order.createdAt).toLocaleDateString("vi-VN") },
            ].map((item) => (
              <div key={item.label} style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>{item.label.toUpperCase()}</p>
                <p style={{ color: (item as { color?: string }).color ?? DS.text, fontWeight: 600, fontSize: 14 }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
            <span style={{ color: cfg.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{cfg.label}</span>
          </div>

          <div style={{ display: "flex", gap: STATUS_FLOW.length, flexWrap: "wrap", marginBottom: 20, padding: "12px", background: DS.bg, borderRadius: 10 }}>
            {STATUS_FLOW.map((s, i) => {
              const sc = STATUS_CONFIG[s];
              const isActive = s === order.status;
              // P1-6 FIX: cast to string[] to allow runtime indexOf on a const tuple
              const isPast = (STATUS_FLOW as readonly string[]).indexOf(order.status) > i;
              return (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: isPast ? 0.5 : 1 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: isActive ? sc.color : "transparent", border: `2px solid ${isActive ? sc.color : DS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isPast && <CheckCircle2 size={12} style={{ color: DS.green }} />}
                  </div>
                  <span style={{ color: isActive ? sc.color : DS.text4, fontSize: 9, fontFamily: DS.mono, textAlign: "center", maxWidth: 50 }}>{sc.label.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            style={{ width: "100%", padding: "10px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            {t("common.close")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type SendDemoFormData = {
  title: string;
  figmaUrl: string;
  clientEmail: string;
};

function SendDemoModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order | null;
  onClose: () => void;
  onSuccess: (data: { orderId: string; title: string; figmaUrl: string;  }) => void;
}) {
  const { t } = useAdminTranslations();
  if (!order) return null;

  const [form, setForm] = useState<SendDemoFormData>({
    title: `${order.package?.title ?? "Website"} — Demo v1`,
    figmaUrl: "",
    clientEmail: order.customerEmail ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.figmaUrl.trim()) return setError("Link Monitor/Prototype là bắt buộc");
    if (!form.title.trim()) return setError("Tiêu đề demo là bắt buộc");
    setSaving(true);
    setError("");
    try {
      await onSuccess({ orderId: order.id, ...form });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gửi demo thất bại");
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Monitor size={18} style={{ color: DS.blue }} />
              </div>
              <div>
                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>Gửi Demo</h3>
                <p style={{ color: DS.text4, fontSize: 11, margin: 0 }}>{order.customerName}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
              Demo sẽ được gửi đến <strong style={{ color: DS.blue }}>{order.customerEmail}</strong>. Khách sẽ nhận notification trong Customer Portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>TIÊU ĐỀ DEMO *</label>
              <input style={inputStyle} value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Website Landing Page — Demo v1" required />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>LINK FIGMA / PROTOTYPE *</label>
              <input style={inputStyle} value={form.figmaUrl} onChange={(e) => setForm(f => ({ ...f, figmaUrl: e.target.value }))} placeholder="https://figma.com/proto/..." required />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>EMAIL KHÁCH HÀNG</label>
              <input style={{...inputStyle}} type="email" value={form.clientEmail} onChange={(e) => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder={order.customerEmail ?? ""} />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : DS.blue, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? t("common.saving") : "Gửi Demo"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



export default function OrdersPage() {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [sendDemoOrder, setSendDemoOrder] = useState<Order | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.orders({ page, limit: 20, search, status: statusFilter }),
    queryFn: async () => {
      const res = await adminApi.get<{ data: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        "/api/admin/orders",
        { params: { page, limit: 20, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) } }
      );
      return res;
    },
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const transition = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // P0-1 FIX: use /transition endpoint to enforce status transition rules
      const res = await adminApi.post<{ data: Order }>(`/api/admin/orders/${id}/transition`, { toStatus: status });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders() }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Chuyển trạng thái thất bại"); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/orders/${id}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.orders() }); setDeleteOrder(null); },
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Xóa thất bại"); },
  });

  // Gửi demo cho khách hàng — tạo FigmaDemo record + notification (backend tự chuyển status)
  const sendDemoMutation = useMutation({
    mutationFn: async ({ orderId, title, figmaUrl }: { orderId: string; title: string; figmaUrl: string;  }) => {
      const res = await adminApi.post(`/api/admin/orders/${orderId}/demo`, {
        figmaUrl,
        note: `Demo "${title}" đã được gửi từ admin.`,
      });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.orders() });
      setSendDemoOrder(null);
    },
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Gửi demo thất bại"); },
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>{t("orders.title")}</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {pagination?.total ?? 0} {t("orders.orderCount")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setEditOrder({} as Order)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: GRD.primary, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}
          >
            <Plus size={13} /> {t("orders.create")}
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: qk.orders({ page }) })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> {t("common.refresh")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: DS.mono }}
        >
          <option value="">{t("orders.allStatuses")}</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_FLOW.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              style={{
                padding: "4px 12px", borderRadius: 9999,
                border: `1px solid ${statusFilter === s ? cfg.color : DS.border}`,
                background: statusFilter === s ? cfg.bg : "transparent",
                color: statusFilter === s ? cfg.color : DS.text4,
                fontSize: 11, fontFamily: DS.mono, cursor: "pointer", fontWeight: statusFilter === s ? 700 : 400,
              }}
            >
              {cfg.label} {count > 0 && <span>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Order list */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>
              {t("orders.empty")}
            </div>
          ) : (
            orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onTransition={(id, nextStatus) => transition.mutate({ id, status: nextStatus })}
                onDetail={setSelectedOrder}
                onEdit={setEditOrder}
                onDelete={setDeleteOrder}
                onSendDemo={setSendDemoOrder}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${page === p ? DS.blue : DS.border}`,
                background: page === p ? "rgba(59,130,246,0.1)" : "transparent",
                color: page === p ? DS.blue : DS.text4,
                cursor: "pointer", fontSize: 13, fontFamily: DS.mono,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />

      {/* Edit/Create modal */}
      <OrderEditModal
        order={editOrder}
        onClose={() => setEditOrder(null)}
        onSuccess={() => qc.invalidateQueries({ queryKey: qk.orders() })}
      />

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        order={deleteOrder}
        onClose={() => setDeleteOrder(null)}
        onConfirm={() => { if (deleteOrder) deleteMutation.mutate(deleteOrder.id); }}
      />

      {/* Send Demo modal */}
      <SendDemoModal
        order={sendDemoOrder}
        onClose={() => setSendDemoOrder(null)}
        onSuccess={(data) => sendDemoMutation.mutate(data)}
      />
    </div>
  );
}
