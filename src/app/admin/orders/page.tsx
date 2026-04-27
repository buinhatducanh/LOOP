"use client";
import { useState, useCallback } from "react";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { InlineLoader } from "@/components/ui/LoadingScreen";

import { DS, GRD } from "@/lib/design-tokens";
import {
    X, CheckCircle2, Eye, ChevronRight, Search,
    RefreshCw, Plus, Trash2, Edit2, AlertTriangle,
    Monitor, CreditCard, Users, Clock, CheckCheck,
    DollarSign, Package, List, UserCheck,
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Bản nháp", color: "#94A3B8", bg: "rgba(148,163,168,0.1)" },
    pending: { label: "Chờ báo giá", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    quoted: { label: "Đã báo giá", color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
    accepted: { label: "Đã chấp nhận", color: "#34D399", bg: "rgba(52,211,153,0.1)" },
    paid_partial: { label: "Thanh toán 1 phần", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
    paid_full: { label: "Thanh toán đủ", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
    contracted: { label: "Đã ký HĐ", color: "#818CF8", bg: "rgba(129,140,248,0.1)" },
    designing: { label: "Đang thiết kế", color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
    developing: { label: "Đang phát triển", color: "#C084FC", bg: "rgba(192,132,252,0.1)" },
    reviewing: { label: "Review", color: "#F472B6", bg: "rgba(244,114,182,0.1)" },
    delivered: { label: "Đã bàn giao", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
    completed: { label: "Hoàn thành", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    cancelled: { label: "Đã hủy", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    setting_up: { label: "Đang thiết lập", color: "#F97316", bg: "rgba(249,115,22,0.1)" },
};

// ── Transition maps ─────────────────────────────────────────────────────────────
const CUSTOM_TRANSITIONS: Record<string, string[]> = {
    draft: ["pending", "cancelled"],
    pending: ["quoted", "cancelled"],
    quoted: ["accepted", "cancelled"],
    accepted: ["paid_partial", "paid_full", "cancelled"],
    paid_partial: ["paid_full", "contracted", "cancelled"],
    paid_full: ["contracted", "cancelled"],
    contracted: ["designing", "cancelled"],
    designing: ["developing", "cancelled"],
    developing: ["reviewing", "cancelled"],
    reviewing: ["delivered", "developing", "cancelled"],
    delivered: ["completed"],
    completed: [],
    cancelled: [],
};

const TEMPLATE_TRANSITIONS: Record<string, string[]> = {
    pending: ["paid_full", "cancelled"],
    paid_full: ["setting_up", "cancelled"],
    setting_up: ["delivered", "cancelled"],
    delivered: ["completed"],
    completed: [],
    cancelled: [],
};

function getTransitions(orderType: string, status: string): readonly string[] {
    const map = orderType === "template" || orderType === "web_package"
        ? TEMPLATE_TRANSITIONS
        : CUSTOM_TRANSITIONS;
    return map[status] ?? [];
}

const TERMINAL_STATUSES = new Set(["completed", "cancelled"]);

// ── Custom status flow ─────────────────────────────────────────────────────────
const CUSTOM_FLOW = [
    "draft", "pending", "quoted", "accepted",
    "paid_partial", "paid_full", "contracted",
    "designing", "developing", "reviewing", "delivered", "completed", "cancelled",
] as const;

// ── Template status flow ───────────────────────────────────────────────────────
const TEMPLATE_FLOW = [
    "pending", "paid_full", "setting_up", "delivered", "completed", "cancelled",
] as const;

// ── Order type config ───────────────────────────────────────────────────────────
const ORDER_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    package: { label: "Gói dịch vụ", color: "#818CF8" },
    template: { label: "Web mẫu", color: "#F97316" },
    custom: { label: "Tùy chỉnh", color: "#6EB1A8" },
};

// ── Demo status config ───────────────────────────────────────────────────────────
const DEMO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Đang chờ", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    approved: { label: "Đã duyệt", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
    rejected: { label: "Từ chối", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

// ── Payment methods ─────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
    { value: "bank_transfer", label: "Chuyển khoản" },
    { value: "cash", label: "Tiền mặt" },
    { value: "vnpay", label: "VNPay" },
    { value: "momo", label: "MoMo" },
    { value: "other", label: "Khác" },
];

// ── Project roles ───────────────────────────────────────────────────────────────
const PROJECT_ROLES = [
    { key: "pm", label: "Project Manager", color: "#EC4899" },
    { key: "designer", label: "Designer", color: "#8B5CF6" },
    { key: "dev", label: "Developer", color: "#3B82F6" },
    { key: "qa", label: "QA Engineer", color: "#22C55E" },
    { key: "seo", label: "SEO Specialist", color: "#F59E0B" },
];

// ── Types ───────────────────────────────────────────────────────────────────────
type Order = {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    totalAmount: number | null;
    paidAmount: number;
    finalPrice: number | null;
    lpUsed: number;
    lpReward: number;
    salesRepId: string | null;
    status: string;
    orderType: string;
    paymentStatus: string;
    createdAt: string;
    package?: { title: string };
    projectTitle?: string;
    note?: string;
    demo?: {
        id: string;
        status: string;
        figmaUrl: string;
        maskedUrl: string | null;
        createdAt: string;
        approvedAt: string | null;
    } | null;
};

type OrderFormData = {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    packageTitle: string;
    totalAmount: string;
    orderType: string;
    note: string;
};

type PaymentFormData = {
    amount: string;
    method: string;
    note: string;
};

type SendDemoFormData = {
    title: string;
    figmaUrl: string;
};

type AssignMemberFormData = {
    memberId: string;
    projectRoleKey: string;
};

// ───────────────────────────────────────────────────────────────────────────────
// UTILITY
// ───────────────────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined, currency = "VND") =>
    n != null
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
        : "—";

// ───────────────────────────────────────────────────────────────────────────────
// ORDER ROW
// ───────────────────────────────────────────────────────────────────────────────
function OrderRow({
    order,
    onTransition,
    onDetail,
    onEdit,
    onDelete,
    onSendDemo,
    onRecordPayment,
    onAssignMember,
    onAssignSalesRep,
}: {
    order: Order;
    onTransition: (id: string, status: string) => void;
    onDetail: (order: Order) => void;
    onEdit: (order: Order) => void;
    onDelete: (order: Order) => void;
    onSendDemo: (order: Order) => void;
    onRecordPayment: (order: Order) => void;
    onAssignMember: (order: Order) => void;
    onAssignSalesRep: (order: Order) => void;
}) {
    const { t } = useAdminTranslations();
    const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: DS.text4, bg: "transparent" };
    const typeCfg = ORDER_TYPE_CONFIG[order.orderType] ?? { label: order.orderType, color: DS.text4 };

    const nextStatuses = getTransitions(order.orderType, order.status);
    const primaryNext = nextStatuses[0];

    // Progress bar: paid / total
    const total = order.finalPrice ?? order.totalAmount ?? 0;
    const paid = order.paidAmount ?? 0;
    const progressPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

    const demoCfg = order.demo ? (DEMO_STATUS_CONFIG[order.demo.status] ?? { label: order.demo.status, color: DS.text4, bg: "transparent" }) : null;

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
                flexDirection: "column",
                gap: 10,
                transition: "border-color 0.2s",
            }}
        >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Status dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}` }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {order.customerName}
                        </p>
                        <span style={{ fontSize: 10, color: typeCfg.color, background: `${typeCfg.color}20`, borderRadius: 4, padding: "1px 6px", fontFamily: DS.mono, fontWeight: 600 }}>
                            {typeCfg.label}
                        </span>
                        <span style={{ fontSize: 10, color: DS.text4, fontFamily: DS.mono }}>
                            #{order.orderNumber.slice(-8)}
                        </span>
                    </div>
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
                    <button onClick={() => onEdit(order)} title="Sửa"
                        style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.purple, display: "flex", alignItems: "center" }}>
                        <Edit2 size={12} />
                    </button>

                    {/* Gửi Demo */}
                    {(order.status === "designing" || order.status === "developing") && (
                        <button onClick={() => onSendDemo(order)} title="Gửi Demo"
                            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}>
                            <Monitor size={12} />
                        </button>
                    )}

                    {/* Ghi nhận thanh toán */}
                    {!TERMINAL_STATUSES.has(order.status) && order.status !== "draft" && (
                        <button onClick={() => onRecordPayment(order)} title="Ghi nhận thanh toán"
                            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#10B981", display: "flex", alignItems: "center" }}>
                            <CreditCard size={12} />
                        </button>
                    )}

                    {/* Gán thành viên */}
                    {(order.status === "contracted" || order.status === "designing" || order.status === "developing" || order.status === "reviewing") && (
                        <button onClick={() => onAssignMember(order)} title="Gán thành viên"
                            style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#EAB308", display: "flex", alignItems: "center" }}>
                            <Users size={12} />
                        </button>
                    )}

                    {/* Sales Rep */}
                    {order.status !== "completed" && order.status !== "cancelled" && (
                        <button onClick={() => onAssignSalesRep(order)} title="Sales Rep"
                            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#22C55E", display: "flex", alignItems: "center" }}>
                            <UserCheck size={12} />
                        </button>
                    )}

                    {/* Next transition */}
                    {primaryNext && !TERMINAL_STATUSES.has(order.status) ? (
                        <button onClick={() => onTransition(order.id, primaryNext as string)} title={`Chuyển → ${STATUS_CONFIG[primaryNext]?.label ?? ""}`}
                            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.green, display: "flex", alignItems: "center", fontSize: 11, fontFamily: DS.mono }}>
                            <ChevronRight size={12} />
                        </button>
                    ) : null}

                    {/* Xóa — chỉ cho phép khi không phải terminal status */}
                    {!TERMINAL_STATUSES.has(order.status) && (
                        <button onClick={() => onDelete(order)} title="Xóa"
                            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center" }}>
                            <Trash2 size={12} />
                        </button>
                    )}

                    <button onClick={() => onDetail(order)} title="Chi tiết"
                        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}>
                        <Eye size={13} />
                    </button>
                </div>
            </div>

            {/* Progress bar + demo status */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {total > 0 && (
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 10, color: DS.text4, fontFamily: DS.mono }}>Thanh toán</span>
                            <span style={{ fontSize: 10, color: DS.text4, fontFamily: DS.mono }}>
                                {fmt(paid)} / {fmt(total)}
                            </span>
                        </div>
                        <div style={{ height: 4, background: DS.border, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progressPct}%`, background: progressPct >= 100 ? "#10B981" : DS.blue, borderRadius: 2, transition: "width 0.3s" }} />
                        </div>
                    </div>
                )}
                {demoCfg && (
                    <span style={{ fontSize: 11, color: demoCfg.color, background: demoCfg.bg, borderRadius: 6, padding: "2px 8px", fontFamily: DS.mono, fontWeight: 600, flexShrink: 0 }}>
                        Demo: {demoCfg.label}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// ORDER EDIT MODAL
// ───────────────────────────────────────────────────────────────────────────────
function OrderEditModal({ order, onClose, onSuccess }: { order: Order | null; onClose: () => void; onSuccess: () => void }) {
    const { t } = useAdminTranslations();
    const isEdit = !!order;
    const [form, setForm] = useState<OrderFormData>({
        customerName: order?.customerName ?? "",
        customerEmail: order?.customerEmail ?? "",
        customerPhone: order?.customerPhone ?? "",
        packageTitle: order?.package?.title ?? "",
        totalAmount: order?.totalAmount != null ? String(order.totalAmount) : "",
        orderType: order?.orderType ?? "custom",
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
                note: form.note.trim() || undefined,
                ...(isEdit
                    ? {}
                    : {
                        status: "pending",
                        orderType: form.orderType,
                        totalAmount: form.totalAmount ? parseInt(form.totalAmount) : undefined,
                    }),
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 520 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{isEdit ? "Sửa đơn hàng" : "Tạo đơn hàng"}</h3>
                        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
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
                        {!isEdit && (
                            <div>
                                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>LOẠI ĐƠN HÀNG</label>
                                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.orderType} onChange={(e) => setForm(f => ({ ...f, orderType: e.target.value }))}>
                                    <option value="package">Gói dịch vụ</option>
                                    <option value="template">Web mẫu</option>
                                    <option value="custom">Tùy chỉnh</option>
                                </select>
                            </div>
                        )}
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
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
                            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                {saving ? <InlineLoader size={16} color="#fff" /> : (isEdit ? "Lưu thay đổi" : "Tạo đơn hàng")}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// PAYMENT MODAL
// ───────────────────────────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onSuccess }: { order: Order | null; onClose: () => void; onSuccess: () => void }) {
    const { t } = useAdminTranslations();
    if (!order) return null;

    const total = order.finalPrice ?? order.totalAmount ?? 0;
    const paid = order.paidAmount ?? 0;
    const remaining = Math.max(0, total - paid);

    const [form, setForm] = useState<PaymentFormData>({
        amount: "",
        method: "bank_transfer",
        note: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        if (!amount || amount <= 0) return setError("Số tiền phải lớn hơn 0");
        setSaving(true);
        setError("");
        try {
            await adminApi.post(`/api/admin/orders/${order.id}/payments`, {
                amount,
                method: form.method,
                note: form.note.trim() || undefined,
            });
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Ghi nhận thanh toán thất bại");
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 460 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <CreditCard size={18} style={{ color: "#10B981" }} />
                            </div>
                            <div>
                                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>Ghi nhận thanh toán</h3>
                                <p style={{ color: DS.text4, fontSize: 11, margin: 0 }}>{order.customerName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
                    </div>

                    {/* Order summary */}
                    <div style={{ background: DS.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>TỔNG</p>
                            <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>{fmt(total)}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>ĐÃ THANH TOÁN</p>
                            <p style={{ color: "#10B981", fontWeight: 700, fontSize: 14 }}>{fmt(paid)}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>CÒN LẠI</p>
                            <p style={{ color: remaining > 0 ? "#F59E0B" : "#10B981", fontWeight: 700, fontSize: 14 }}>{fmt(remaining)}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>SỐ TIỀN (VNĐ) *</label>
                            <input style={inputStyle} type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                                placeholder={String(Math.ceil(remaining))} min="0" step="1000" required />
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                {[25, 50, 75, 100].map(pct => {
                                    const suggested = Math.round((remaining * pct / 100) / 1000) * 1000;
                                    return suggested > 0 ? (
                                        <button key={pct} type="button" onClick={() => setForm(f => ({ ...f, amount: String(suggested) }))}
                                            style={{ flex: 1, padding: "4px 0", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 6, color: DS.text4, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}>
                                            {pct === 100 ? "Đủ" : `${pct}%`}
                                        </button>
                                    ) : null;
                                })}
                            </div>
                        </div>
                        <div>
                            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>PHƯƠNG THỨC</label>
                            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.method} onChange={(e) => setForm(f => ({ ...f, method: e.target.value }))}>
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>GHI CHÚ</label>
                            <input style={inputStyle} value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Ghi chú thanh toán..." />
                        </div>
                        {error && (
                            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
                            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : "#10B981", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                                {saving ? "Đang xử lý..." : "Xác nhận thanh toán"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// SEND DEMO MODAL
// ───────────────────────────────────────────────────────────────────────────────
function SendDemoModal({ order, onClose, onSuccess }: { order: Order | null; onClose: () => void; onSuccess: (data: { orderId: string; title: string; figmaUrl: string }) => void }) {
    const { t } = useAdminTranslations();
    if (!order) return null;

    const [form, setForm] = useState<SendDemoFormData>({
        title: `${order.package?.title ?? "Website"} — Demo v1`,
        figmaUrl: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.figmaUrl.trim()) return setError("Link Figma/Prototype là bắt buộc");
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480 }}>
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
                        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
                    </div>
                    <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                        <p style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                            Demo sẽ được gửi đến <strong style={{ color: DS.blue }}>{order.customerEmail}</strong>. Khách sẽ nhận thông báo trong Customer Portal.
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
                        {error && (
                            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
                            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : DS.blue, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                                {saving ? "Đang gửi..." : "Gửi Demo"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ───────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ order, onClose, onConfirm }: { order: Order | null; onClose: () => void; onConfirm: () => void }) {
    const { t } = useAdminTranslations();
    if (!order) return null;
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: DS.bgCard, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                            <AlertTriangle size={24} style={{ color: "#EF4444" }} />
                        </div>
                        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Xóa đơn hàng</h3>
                        <p style={{ color: DS.text4, fontSize: 13 }}>Xóa đơn hàng của <strong style={{ color: DS.text }}>{order.customerName}</strong>? Hành động này không thể hoàn tác.</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
                        <button onClick={onConfirm} style={{ flex: 1, padding: "10px", background: "#EF4444", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Xóa</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// PROJECT MEMBERS MODAL
// ───────────────────────────────────────────────────────────────────────────────
type ProjectMember = {
    id: string;
    memberId: string;
    projectRoleKey: string;
    assignedLp: number;
    earnedLp: number;
    member: { id: string; name: string; email: string; avatar: string | null };
    projectRole: { key: string; label: string; color: string } | null;
};

function ProjectMembersModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
    const { t } = useAdminTranslations();
    const qc = useQueryClient();
    if (!order) return null;

    const { data: membersData, isLoading: loadingMembers } = useQuery({
        queryKey: ["admin", "projects", order.id, "members"],
        queryFn: () => adminApi.get<{ data: ProjectMember[] }>(`/api/admin/projects/${order.id}/members`),
        enabled: !!order.id,
    });

    const { data: teamData, isLoading: loadingTeam } = useQuery({
        queryKey: ["admin", "team", "all"],
        queryFn: () => adminApi.get<{ data: unknown[] }>("/api/admin/team?limit=100&page=1"),
    });

    const [form, setForm] = useState<AssignMemberFormData>({ memberId: "", projectRoleKey: "dev" });
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const members: ProjectMember[] = membersData?.data ?? [];
    const team: { id: string; name: string; email: string; avatar: string | null }[] = (teamData?.data as { id: string; name: string; email: string; avatar: string | null }[] | undefined) ?? [];
    const assignedMemberIds = new Set(members.map(m => m.memberId));
    const availableMembers = team.filter(m => !assignedMemberIds.has(m.id));

    const addMember = useMutation({
        mutationFn: async () => {
            if (!form.memberId) throw new Error("Chọn thành viên");
            if (!form.projectRoleKey) throw new Error("Chọn vai trò");
            await adminApi.post(`/api/admin/projects/${order.id}/members`, {
                memberId: form.memberId,
                projectRoleKey: form.projectRoleKey,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "projects", order.id, "members"] });
            setForm({ memberId: "", projectRoleKey: "dev" });
            setAddError("");
        },
        onError: (err: unknown) => setAddError(err instanceof Error ? err.message : "Thêm thất bại"),
    });

    const removeMember = useMutation({
        mutationFn: async (memberId: string) => {
            await adminApi.delete(`/api/admin/projects/${order.id}/members`, { body: JSON.stringify({ memberId }) });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "projects", order.id, "members"] }),
        onError: (err: unknown) => setAddError(err instanceof Error ? err.message : "Xóa thất bại"),
    });

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 540 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Users size={18} style={{ color: "#EAB308" }} />
                            </div>
                            <div>
                                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>Gán thành viên</h3>
                                <p style={{ color: DS.text4, fontSize: 11, margin: 0 }}>{order.customerName} · #{order.orderNumber.slice(-8)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
                    </div>

                    {/* Add member form */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 16 }}>
                        <select
                            value={form.memberId}
                            onChange={(e) => setForm(f => ({ ...f, memberId: e.target.value }))}
                            disabled={adding || loadingTeam}
                            style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: DS.body }}>
                            <option value="">Chọn thành viên...</option>
                            {availableMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                            ))}
                        </select>
                        <select
                            value={form.projectRoleKey}
                            onChange={(e) => setForm(f => ({ ...f, projectRoleKey: e.target.value }))}
                            style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: DS.body, minWidth: 130 }}>
                            {PROJECT_ROLES.map(r => (
                                <option key={r.key} value={r.key}>{r.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => { setAdding(true); addMember.mutate(); }}
                            disabled={!form.memberId || adding}
                            style={{ padding: "9px 14px", background: !form.memberId ? DS.text4 : "#EAB308", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: !form.memberId ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                            <Plus size={13} /> Thêm
                        </button>
                    </div>
                    {addError && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "6px 10px", color: "#EF4444", fontSize: 12, marginBottom: 12 }}>
                            <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{addError}
                        </div>
                    )}

                    {/* Member list */}
                    {loadingMembers ? (
                        <div style={{ textAlign: "center", padding: 24, color: DS.text4 }}>Đang tải...</div>
                    ) : members.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 24, color: DS.text4, fontSize: 13 }}>Chưa có thành viên nào được gán.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                            {members.map(m => (
                                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: DS.bg, borderRadius: 10, border: `1px solid ${DS.border}` }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: DS.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                                        {m.member.avatar ? (
                                            <img src={m.member.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : m.member.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ color: DS.text, fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{m.member.name}</p>
                                        <p style={{ color: DS.text4, fontSize: 11 }}>{m.member.email}</p>
                                    </div>
                                    <span style={{ fontSize: 11, color: m.projectRole?.color ?? DS.text4, background: `${m.projectRole?.color ?? DS.text4}20`, borderRadius: 6, padding: "2px 8px", fontFamily: DS.mono, fontWeight: 600 }}>
                                        {m.projectRole?.label ?? m.projectRoleKey}
                                    </span>
                                    <button onClick={() => removeMember.mutate(m.memberId)}
                                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center" }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>Đóng</button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// SALES REP MODAL
// ───────────────────────────────────────────────────────────────────────────────
function SalesRepModal({ order, onClose, onSuccess }: { order: Order | null; onClose: () => void; onSuccess: () => void }) {
    const { t } = useAdminTranslations();
    const qc = useQueryClient();
    if (!order) return null;

    const { data: teamData, isLoading: loadingTeam } = useQuery({
        queryKey: ["admin", "team", "all"],
        queryFn: () => adminApi.get<{ data: { id: string; name: string; email: string; avatar: string | null; rank: string }[] }>("/api/admin/team?limit=100&page=1"),
    });

    const [selectedId, setSelectedId] = useState(order.salesRepId ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const team: { id: string; name: string; email: string; avatar: string | null; rank: string }[] = teamData?.data ?? [];

    const save = async () => {
        setSaving(true);
        setError("");
        try {
            await adminApi.put(`/api/admin/orders/${order!.id}`, {
                salesRepId: selectedId || null,
            });
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Lưu thất bại");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <UserCheck size={18} style={{ color: "#22C55E" }} />
                            </div>
                            <div>
                                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>Sales Rep</h3>
                                <p style={{ color: DS.text4, fontSize: 11, margin: 0 }}>{order.customerName} · #{order.orderNumber.slice(-8)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
                    </div>

                    <p style={{ color: DS.text4, fontSize: 12, marginBottom: 12 }}>
                        Sales Rep nhận commission LP khi đơn hàng hoàn thành (10% main + 5% addon).
                    </p>

                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        disabled={saving || loadingTeam}
                        style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px 12px", color: DS.text, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: DS.body, boxSizing: "border-box", marginBottom: 12 }}>
                        <option value="">— Không chọn —</option>
                        {team.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.rank})</option>
                        ))}
                    </select>

                    {error && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12, marginBottom: 12 }}>
                            <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
                        <button onClick={save} disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : "#22C55E", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL MODAL
// ───────────────────────────────────────────────────────────────────────────────
type DetailTab = "overview" | "history" | "demos" | "handover";

function OrderDetailModal({ order, onClose, setToast }: { order: Order | null; onClose: () => void; setToast?: (t: { message: string; type: "success" | "error" } | null) => void }) {
    const { t } = useAdminTranslations();
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<DetailTab>("overview");
    if (!order) return null;

    const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: DS.text4, bg: "transparent" };
    const total = order.finalPrice ?? order.totalAmount ?? 0;
    const paid = order.paidAmount ?? 0;
    const remaining = Math.max(0, total - paid);
    const statusFlow = order.orderType === "template" || order.orderType === "web_package" ? TEMPLATE_FLOW : CUSTOM_FLOW;

    type HistoryItem = { fromStatus: string; toStatus: string; note: string | null; createdAt: string };
    type DemoItem = { id: string; figmaUrl: string; status: string; createdAt: string; approvedAt: string | null };
    type HistoryResponse = { data: HistoryItem[] };
    type DemoResponse = { data: DemoItem[] };

    const { data: historyData } = useQuery({
        queryKey: ["admin", "orders", order.id, "history"],
        queryFn: (): Promise<HistoryResponse> => adminApi.get(`/api/admin/orders/${order.id}/history`),
        enabled: activeTab === "history",
    });

    const { data: demosData } = useQuery({
        queryKey: ["admin", "orders", order.id, "demos"],
        queryFn: (): Promise<DemoResponse> => adminApi.get(`/api/admin/orders/${order.id}/demo`),
        enabled: activeTab === "demos",
    });

    const { data: handoverData, refetch: refetchHandover } = useQuery({
        queryKey: ["admin", "orders", order.id, "handover"],
        queryFn: () => adminApi.get<{ data: { id: string; figmaUrl: string | null; githubUrl: string | null; deploymentUrl: string | null; scope: unknown; notes: string | null; status: string; createdAt: string } | null }>(`/api/admin/orders/${order.id}/handover`),
        enabled: activeTab === "handover",
    });

    const [handoverForm, setHandoverForm] = useState({ figmaUrl: "", githubUrl: "", deploymentUrl: "", notes: "" });
    const [savingHandover, setSavingHandover] = useState(false);
    const [handoverError, setHandoverError] = useState("");
    const [handoverSuccess, setHandoverSuccess] = useState("");

    const saveHandover = useMutation({
        mutationFn: async () => {
            await adminApi.post(`/api/admin/orders/${order.id}/handover`, {
                figmaUrl: handoverForm.figmaUrl || null,
                githubUrl: handoverForm.githubUrl || null,
                deploymentUrl: handoverForm.deploymentUrl || null,
                notes: handoverForm.notes || null,
                status: handoverData?.data ? "updated" : "draft",
            });
        },
        onSuccess: () => {
            refetchHandover();
            setHandoverError("");
            setHandoverSuccess("Đã lưu handover thành công");
            setTimeout(() => setHandoverSuccess(""), 3000);
        },
        onError: (err: unknown) => setHandoverError(err instanceof Error ? err.message : "Lưu thất bại"),
    });

    const inputStyle = {
        width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
        borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
        outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
    };

    const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
        { key: "overview", label: "Tổng quan", icon: <List size={13} /> },
        { key: "history", label: "Lịch sử", icon: <Clock size={13} /> },
        { key: "demos", label: "Demo", icon: <Monitor size={13} /> },
        { key: "handover", label: "Bàn giao", icon: <CheckCheck size={13} /> },
    ];

    return (
        <AnimatePresence>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
                <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 640, margin: "auto" }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>{order.customerName}</h3>
                                <span style={{ fontSize: 10, color: ORDER_TYPE_CONFIG[order.orderType]?.color ?? DS.text4, background: `${ORDER_TYPE_CONFIG[order.orderType]?.color ?? DS.text4}20`, borderRadius: 4, padding: "1px 6px", fontFamily: DS.mono, fontWeight: 600 }}>
                                    {ORDER_TYPE_CONFIG[order.orderType]?.label ?? order.orderType}
                                </span>
                            </div>
                            <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>#{order.orderNumber} · {order.customerEmail}</p>
                        </div>
                        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${DS.border}`, paddingBottom: 12 }}>
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontFamily: DS.mono, fontWeight: activeTab === tab.key ? 700 : 400,
                                    background: activeTab === tab.key ? `${DS.purple}20` : "transparent",
                                    color: activeTab === tab.key ? DS.purple : DS.text4,
                                }}>
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
                    {activeTab === "overview" && (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                {[
                                    { label: "Gói dịch vụ", value: order.package?.title ?? "—" },
                                    { label: "Tổng tiền", value: fmt(total), bold: true },
                                    { label: "Đã thanh toán", value: fmt(paid), color: "#10B981" },
                                    { label: "Còn lại", value: fmt(remaining), color: remaining > 0 ? "#F59E0B" : "#10B981" },
                                    { label: "LP sử dụng", value: order.lpUsed > 0 ? `${order.lpUsed.toLocaleString()} LP` : "—" },
                                    { label: "LP thưởng", value: order.lpReward > 0 ? `${order.lpReward.toLocaleString()} LP` : "—" },
                                    { label: "Trạng thái", value: cfg.label, color: cfg.color },
                                    { label: "Ngày tạo", value: new Date(order.createdAt).toLocaleDateString("vi-VN") },
                                ].map((item) => (
                                    <div key={item.label} style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px 14px" }}>
                                        <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>{item.label.toUpperCase()}</p>
                                        <p style={{ color: (item as { color?: string }).color ?? DS.text, fontWeight: (item as { bold?: boolean }).bold ? 700 : 600, fontSize: 14 }}>{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Demo status */}
                            {order.demo && (
                                <div style={{ background: `${DEMO_STATUS_CONFIG[order.demo.status]?.bg ?? "transparent"}`, border: `1px solid ${DEMO_STATUS_CONFIG[order.demo.status]?.color ?? DS.border}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>DEMO HIỆN TẠI</p>
                                            <p style={{ color: DS.text, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{order.demo.figmaUrl}</p>
                                            {order.demo.maskedUrl && <p style={{ color: DS.text4, fontSize: 11 }}>{order.demo.maskedUrl}</p>}
                                        </div>
                                        <span style={{ fontSize: 12, color: DEMO_STATUS_CONFIG[order.demo.status]?.color ?? DS.text4, background: DEMO_STATUS_CONFIG[order.demo.status]?.bg ?? "transparent", borderRadius: 8, padding: "4px 12px", fontFamily: DS.mono, fontWeight: 600 }}>
                                            {DEMO_STATUS_CONFIG[order.demo.status]?.label ?? order.demo.status}
                                        </span>
                                    </div>
                                    {order.demo.approvedAt && (
                                        <p style={{ color: "#10B981", fontSize: 11, marginTop: 6 }}>Khách duyệt: {new Date(order.demo.approvedAt).toLocaleDateString("vi-VN")}</p>
                                    )}
                                </div>
                            )}

                            {/* Status timeline */}
                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 8 }}>TIẾN TRÌNH ĐƠN HÀNG</p>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16, padding: "12px", background: DS.bg, borderRadius: 10 }}>
                                {statusFlow.map((s, i) => {
                                    const sc = STATUS_CONFIG[s];
                                    const currentIdx = (statusFlow as readonly string[]).indexOf(order.status);
                                    const isActive = s === order.status;
                                    const isPast = i < currentIdx;
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
                        </>
                    )}

                    {/* ── HISTORY TAB ─────────────────────────────────────────────────── */}
                    {activeTab === "history" && (
                        <div>
                            {(!historyData?.data || historyData.data.length === 0) ? (
                                <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có lịch sử chuyển trạng thái.</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                                    {(historyData?.data ?? []).map((h, i) => {
                                        const from = STATUS_CONFIG[h.fromStatus] ?? { label: h.fromStatus, color: DS.text4 };
                                        const to = STATUS_CONFIG[h.toStatus] ?? { label: h.toStatus, color: DS.text4 };
                                        return (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: DS.bg, borderRadius: 10, border: `1px solid ${DS.border}` }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${from.color}20`, border: `1px solid ${from.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Clock size={14} style={{ color: from.color }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                                        <span style={{ fontSize: 12, color: from.color, fontFamily: DS.mono, fontWeight: 600 }}>{from.label}</span>
                                                        <span style={{ color: DS.text4 }}>→</span>
                                                        <span style={{ fontSize: 12, color: to.color, fontFamily: DS.mono, fontWeight: 700 }}>{to.label}</span>
                                                    </div>
                                                    {h.note && <p style={{ color: DS.text4, fontSize: 11 }}>{h.note}</p>}
                                                </div>
                                                <span style={{ fontSize: 11, color: DS.text4, fontFamily: DS.mono, flexShrink: 0 }}>
                                                    {new Date(h.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── DEMOS TAB ──────────────────────────────────────────────────── */}
                    {activeTab === "demos" && (
                        <div>
                            {!demosData?.data || demosData.data.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có demo nào được gửi.</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                                    {demosData.data.map(demo => {
                                        const dc = DEMO_STATUS_CONFIG[demo.status] ?? { label: demo.status, color: DS.text4, bg: "transparent" };
                                        return (
                                            <div key={demo.id} style={{ padding: "12px 16px", background: DS.bg, borderRadius: 10, border: `1px solid ${DS.border}` }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                                    <span style={{ fontSize: 11, color: DS.text4, fontFamily: DS.mono }}>{new Date(demo.createdAt).toLocaleDateString("vi-VN")}</span>
                                                    <span style={{ fontSize: 11, color: dc.color, background: dc.bg, borderRadius: 6, padding: "2px 8px", fontFamily: DS.mono, fontWeight: 600 }}>{dc.label}</span>
                                                </div>
                                                <a href={demo.figmaUrl} target="_blank" rel="noreferrer" style={{ color: DS.blue, fontSize: 13, wordBreak: "break-all" }}>{demo.figmaUrl}</a>
                                                {demo.approvedAt && (
                                                    <p style={{ color: "#10B981", fontSize: 11, marginTop: 6 }}>Khách duyệt: {new Date(demo.approvedAt).toLocaleDateString("vi-VN")}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── HANDOVER TAB ───────────────────────────────────────────────── */}
                    {activeTab === "handover" && (
                        <div>
                            {handoverData?.data ? (
                                <div style={{ background: DS.bg, borderRadius: 10, padding: "16px", border: `1px solid ${DS.border}`, marginBottom: 16 }}>
                                    {handoverData.data.figmaUrl && (
                                        <div style={{ marginBottom: 12 }}>
                                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>FIGMA URL</p>
                                            <a href={handoverData.data.figmaUrl} target="_blank" rel="noreferrer" style={{ color: DS.blue, fontSize: 13, wordBreak: "break-all" }}>{handoverData.data.figmaUrl}</a>
                                        </div>
                                    )}
                                    {handoverData.data.githubUrl && (
                                        <div style={{ marginBottom: 12 }}>
                                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>GITHUB</p>
                                            <a href={handoverData.data.githubUrl} target="_blank" rel="noreferrer" style={{ color: DS.blue, fontSize: 13, wordBreak: "break-all" }}>{handoverData.data.githubUrl}</a>
                                        </div>
                                    )}
                                    {handoverData.data.deploymentUrl && (
                                        <div style={{ marginBottom: 12 }}>
                                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>DEPLOYMENT</p>
                                            <a href={handoverData.data.deploymentUrl} target="_blank" rel="noreferrer" style={{ color: "#10B981", fontSize: 13, wordBreak: "break-all" }}>{handoverData.data.deploymentUrl}</a>
                                        </div>
                                    )}
                                    {handoverData.data.notes && (
                                        <div>
                                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>GHI CHÚ</p>
                                            <p style={{ color: DS.text, fontSize: 13 }}>{handoverData.data.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p style={{ color: DS.text4, fontSize: 13, textAlign: "center", padding: "1rem" }}>Chưa có handover. Điền thông tin bên dưới để tạo.</p>
                            )}

                            {/* Handover form */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em" }}>CẬP NHẬT HANDOVER</p>
                                <input style={inputStyle} value={handoverForm.figmaUrl} onChange={(e) => setHandoverForm(f => ({ ...f, figmaUrl: e.target.value }))} placeholder="https://figma.com/..." />
                                <input style={inputStyle} value={handoverForm.githubUrl} onChange={(e) => setHandoverForm(f => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..." />
                                <input style={inputStyle} value={handoverForm.deploymentUrl} onChange={(e) => setHandoverForm(f => ({ ...f, deploymentUrl: e.target.value }))} placeholder="https://domain.com" />
                                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={handoverForm.notes} onChange={(e) => setHandoverForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ghi chú bàn giao..." />
                                {handoverError && (
                                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "6px 10px", color: "#EF4444", fontSize: 12 }}>
                                        <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{handoverError}
                                    </div>
                                )}
                                <button onClick={() => { setSavingHandover(true); saveHandover.mutate(); }}
                                    disabled={savingHandover}
                                    style={{ padding: "10px", background: savingHandover ? DS.text4 : DS.purple, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: savingHandover ? "not-allowed" : "pointer", fontSize: 13 }}>
                                    {savingHandover ? "Đang lưu..." : "Lưu Handover"}
                                </button>
                            </div>
                        </div>
                    )}

                    <button onClick={onClose}
                        style={{ width: "100%", marginTop: 16, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                        Đóng
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ───────────────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
    const { t } = useAdminTranslations();
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [orderTypeFilter, setOrderTypeFilter] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editOrder, setEditOrder] = useState<Order | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
    const [sendDemoOrder, setSendDemoOrder] = useState<Order | null>(null);
    const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
    const [assignMemberOrder, setAssignMemberOrder] = useState<Order | null>(null);
    const [salesRepOrder, setSalesRepOrder] = useState<Order | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: qk.orders({ page, limit: 20, search, status: statusFilter }),
        queryFn: async () => {
            const res = await adminApi.get<{ data: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
                "/api/admin/orders",
                { params: { page, limit: 20, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(orderTypeFilter ? { orderType: orderTypeFilter } : {}) } }
            );
            return res;
        },
    });

    // Stats for chip counts
    const { data: statsData } = useQuery({
        queryKey: ["admin", "orders", "stats", orderTypeFilter],
        queryFn: () => adminApi.get<{ data: { total: number; statusCounts: Record<string, number> } }>(
            `/api/admin/orders/stats${orderTypeFilter ? `?orderType=${orderTypeFilter}` : ""}`
        ),
    });
    const stats = statsData?.data;
    const statusCounts = stats?.statusCounts ?? {};

    const orders = data?.data ?? [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages ?? 1;

    const transition = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await adminApi.post<{ data: unknown }>(`/api/admin/orders/${id}/transition`, { toStatus: status });
            return res;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders() }),
        onError: (err: unknown) => setToast({ message: err instanceof Error ? err.message : "Chuyển trạng thái thất bại", type: "error" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await adminApi.delete(`/api/admin/orders/${id}`);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: qk.orders() }); setDeleteOrder(null); },
        onError: (err: unknown) => setToast({ message: err instanceof Error ? err.message : "Xóa thất bại", type: "error" }),
    });

    const sendDemoMutation = useMutation({
        mutationFn: async ({ orderId, title, figmaUrl }: { orderId: string; title: string; figmaUrl: string }) => {
            await adminApi.post(`/api/admin/orders/${orderId}/demo`, {
                figmaUrl,
                note: `Demo "${title}" đã được gửi từ admin.`,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk.orders() });
            setSendDemoOrder(null);
        },
        onError: (err: unknown) => setToast({ message: err instanceof Error ? err.message : "Gửi demo thất bại", type: "error" }),
    });

    const currentFlow = orderTypeFilter === "template" || orderTypeFilter === "web_package" ? TEMPLATE_FLOW : CUSTOM_FLOW;

    return (
        <>
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>{t("orders.title")}</h2>
                    <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
                        {stats?.total ?? pagination?.total ?? 0} đơn hàng
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowCreateModal(true)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: GRD.primary, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                        <Plus size={13} /> {t("orders.create")}
                    </button>
                    <button onClick={() => { qc.invalidateQueries({ queryKey: qk.orders({ page }) }); qc.invalidateQueries({ queryKey: ["admin", "orders", "stats", orderTypeFilter] }); }}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}>
                        <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> {t("common.refresh")}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
                    <input type="text" placeholder="Tìm theo tên, email, mã..."
                        value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }} />
                </div>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: DS.mono }}>
                    <option value="">Tất cả trạng thái</option>
                    {currentFlow.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                </select>
                <select value={orderTypeFilter} onChange={(e) => { setOrderTypeFilter(e.target.value); setPage(1); qc.invalidateQueries({ queryKey: ["admin", "orders", "stats", e.target.value] }); }}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: DS.mono }}>
                    <option value="">Tất cả loại</option>
                    <option value="package">Gói dịch vụ</option>
                    <option value="template">Web mẫu</option>
                    <option value="custom">Tùy chỉnh</option>
                </select>
            </div>

            {/* Status chips */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {currentFlow.map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const count = statusCounts[s] ?? 0;
                    return (
                        <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                            style={{
                                padding: "4px 12px", borderRadius: 9999,
                                border: `1px solid ${statusFilter === s ? cfg.color : DS.border}`,
                                background: statusFilter === s ? cfg.bg : "transparent",
                                color: statusFilter === s ? cfg.color : DS.text4,
                                fontSize: 11, fontFamily: DS.mono, cursor: "pointer", fontWeight: statusFilter === s ? 700 : 400,
                            }}>
                            {cfg.label} {count > 0 && <span>({count})</span>}
                        </button>
                    );
                })}
            </div>

            {/* Loading */}
            {isLoading && (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                    <InlineLoader size={32} />
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
                        orders.map(order => (
                            <OrderRow
                                key={order.id}
                                order={order}
                                onTransition={(id, nextStatus) => transition.mutate({ id, status: nextStatus })}
                                onDetail={setSelectedOrder}
                                onEdit={setEditOrder}
                                onDelete={setDeleteOrder}
                                onSendDemo={setSendDemoOrder}
                                onRecordPayment={setPaymentOrder}
                                onAssignMember={setAssignMemberOrder}
                                onAssignSalesRep={setSalesRepOrder}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                border: `1px solid ${page === p ? DS.blue : DS.border}`,
                                background: page === p ? "rgba(59,130,246,0.1)" : "transparent",
                                color: page === p ? DS.blue : DS.text4,
                                cursor: "pointer", fontSize: 13, fontFamily: DS.mono,
                            }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Modals */}
            {!!selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} setToast={setToast} />
            )}
            {showCreateModal && (
                <OrderEditModal order={null} onClose={() => setShowCreateModal(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: qk.orders() }); setShowCreateModal(false); }} />
            )}
            {!!editOrder && (
                <OrderEditModal order={editOrder} onClose={() => setEditOrder(null)} onSuccess={() => qc.invalidateQueries({ queryKey: qk.orders() })} />
            )}
            {!!deleteOrder && (
                <DeleteConfirmModal order={deleteOrder} onClose={() => setDeleteOrder(null)} onConfirm={() => { if (deleteOrder) deleteMutation.mutate(deleteOrder.id); }} />
            )}
            {!!sendDemoOrder && (
                <SendDemoModal order={sendDemoOrder} onClose={() => setSendDemoOrder(null)} onSuccess={(data) => sendDemoMutation.mutate(data)} />
            )}
            {!!paymentOrder && (
                <PaymentModal order={paymentOrder} onClose={() => setPaymentOrder(null)} onSuccess={() => qc.invalidateQueries({ queryKey: qk.orders() })} />
            )}
            {!!assignMemberOrder && (
                <ProjectMembersModal order={assignMemberOrder} onClose={() => setAssignMemberOrder(null)} />
            )}
            {!!salesRepOrder && (
                <SalesRepModal order={salesRepOrder} onClose={() => setSalesRepOrder(null)} onSuccess={() => qc.invalidateQueries({ queryKey: qk.orders() })} />
            )}
        </div>
        {toast && (
            <div style={{
                position: "fixed", bottom: 24, right: 24, zIndex: 9999,
                background: DS.bgCard, border: `1px solid ${toast.type === "error" ? DS.red : DS.green}`,
                borderRadius: 12, padding: "12px 20px", minWidth: 260,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
                <div style={{ color: toast.type === "error" ? DS.red : DS.green, fontSize: 13, fontFamily: DS.mono }}>
                    {toast.message}
                </div>
            </div>
        )}
        </>
    );
}
