"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  X, Camera, CheckCircle2, Eye, ChevronRight, Search,
  RefreshCw, Trash2, Plus, ChevronLeft, Upload, FileText, TrendingUp,
  Image, ZoomIn, ExternalLink, LayoutGrid, List, Package as PackageIcon, Check, Loader2, Edit2,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:       { label: "pending", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  confirmed:     { label: "confirmed", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  in_progress:   { label: "inProgress", color: "#818CF8", bg: "rgba(129,140,248,0.1)" },
  delivered:     { label: "delivered", color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  rejected:      { label: "rejected", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid:   { label: "unpaid", color: "#F59E0B" },
  partial:  { label: "partial", color: "#3B82F6" },
  paid:     { label: "paid", color: "#22C55E" },
  refunded:  { label: "refunded", color: "#6B7280" },
};

const BOOKING_TYPE_OPTIONS = [
  { value: "event", labelKey: "typeEvent" },
  { value: "product", labelKey: "typeProduct" },
  { value: "corporate", labelKey: "typeCorporate" },
  { value: "social", labelKey: "typeSocial" },
  { value: "media", labelKey: "typeMedia" },
  { value: "custom", labelKey: "typeCustom" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaBooking = {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  bookingType: string;
  title: string;
  requirements?: string;
  note?: string;
  deadline?: string;
  status: string;
  paymentStatus: string;
  totalAmount?: number;
  paidAmount: number;
  deliveredAssets: (string | { url?: string; name?: string })[];
  revisionNotes?: string;
  deliveredAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedByUser?: { name: string };
  rejectedByUser?: { name: string };
  packageId?: string;
  package?: { title: string };
  teamMember?: { id: string; name: string };
  isFeatured?: boolean;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
};

type MediaPackage = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  shortDesc: string;
  shortDescEn?: string | null;
  tagline?: string | null;
  color?: string | null;
  type: string;
  price: number | null;
  priceText?: string | null;
  features: string[];
  isSubscription: boolean;
  sortOrder: number;
  isActive: boolean;
};

type BookingFormData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  bookingType: string;
  title: string;
  requirements: string;
  note: string;
  deadline: string;
  totalAmount: string;
  teamMemberId: string;
  paymentStatus: string;
  packageId: string;
  orderId?: string; // Links to parent order
  linkedBookingId?: string; // UI only - for auto-fill
  isFeatured: boolean;
};

type PackageFormData = {
  title: string;
  slug: string;
  shortDesc: string;
  type: string;
  price: string;
  priceText: string;
  tagline: string;
  color: string;
  features: string;
  sortOrder: string;
  isActive: boolean;
  isPopular: boolean;
};

// ─── Row component ─────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  onTransition,
  onDetail,
  onDelete,
  t,
}: {
  booking: MediaBooking;
  onTransition: (id: string, toStatus: string) => void;
  onDetail: (b: MediaBooking) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useAdminTranslations>["t"];
}) {
  const cfgRaw = STATUS_CONFIG[booking.status] ?? { label: booking.status, color: DS.blue, bg: "rgba(59,130,246,0.1)" };
  const cfg = { ...cfgRaw, label: t(`media.status${cfgRaw.label.charAt(0).toUpperCase() + cfgRaw.label.slice(1)}` as `media.status${string}`) };
  const payCfgRaw = PAYMENT_CONFIG[booking.paymentStatus] ?? { label: booking.paymentStatus, color: DS.text4 };
  const payCfg = { ...payCfgRaw, label: t(`media.payment${payCfgRaw.label.charAt(0).toUpperCase() + payCfgRaw.label.slice(1)}` as `media.payment${string}`) };

  const fmt = (n?: number) =>
    n != null
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)
      : "—";

  const VALID_NEXT: Record<string, string[]> = {
    pending:     ["confirmed", "cancelled"],
    confirmed:   ["in_progress", "cancelled"],
    in_progress: ["delivered", "cancelled"],
    delivered:   [],
    approved:    [],
    rejected:    ["in_progress"],
    cancelled:   [],
  };
  const nextOptions = VALID_NEXT[booking.status] ?? [];

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
      <div style={{
        width: 8, height: 8, borderRadius: "50%", background: cfg.color,
        flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}`,
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <p style={{
            color: DS.text, fontWeight: 600, fontSize: 14,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {booking.title}
          </p>
          {booking.teamMember && (
            <span style={{
              fontSize: 10, padding: "1px 6px", borderRadius: 99,
              background: "rgba(139,92,246,0.1)", color: "#8B5CF6",
              fontFamily: DS.mono, fontWeight: 600,
            }}>
              {booking.teamMember.name}
            </span>
          )}
        </div>
        <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {booking.bookingNumber} · {booking.customerName} · {booking.customerEmail} {booking.package && ` · ${booking.package.title}`}
        </p>
      </div>

      {/* Booking type badge */}
      <div style={{
        flexShrink: 0, padding: "3px 8px", borderRadius: 99,
        background: DS.bg, border: `1px solid ${DS.border}`,
        fontSize: 11, color: DS.text4, fontFamily: DS.mono,
      }}>
        {t(`media.${BOOKING_TYPE_OPTIONS.find((opt) => opt.value === booking.bookingType)?.labelKey ?? "typeCustom"}`)}
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>{fmt(booking.totalAmount)}</p>
        <span style={{ color: payCfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{payCfg.label}</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {nextOptions.slice(0, 1).map((ns) => (
          <button
            key={ns}
            onClick={() => onTransition(booking.id, ns)}
            title={`→ ${t(`media.status${(STATUS_CONFIG[ns]?.label || ns).charAt(0).toUpperCase() + (STATUS_CONFIG[ns]?.label || ns).slice(1)}` as `media.status${string}`)}`}
            style={{
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.green,
              display: "flex", alignItems: "center", fontSize: 11, fontFamily: DS.mono,
            }}
          >
            <ChevronRight size={12} />
          </button>
        ))}
        <button
          onClick={() => onDetail(booking)}
          title={t("media.btnDetail")}
          style={{
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue,
            display: "flex", alignItems: "center",
          }}
        >
          <Eye size={13} />
        </button>
        <button
          onClick={() => onDelete(booking.id)}
          title={t("common.delete")}
          style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#EF4444",
            display: "flex", alignItems: "center",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({
  booking,
  onClose,
  onTransition,
  onEdit,
  onUpdatePayment,
  t,
}: {
  booking: MediaBooking | null;
  onClose: () => void;
  onTransition: (id: string, toStatus: string, note?: string) => void;
  onEdit: (b: MediaBooking) => void;
  onUpdatePayment: (id: string, paymentStatus: string) => void;
  t: ReturnType<typeof useAdminTranslations>["t"];
}) {
  if (!booking) return null;

  const cfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, color: DS.text4, bg: "transparent" };
  const _payCfg = PAYMENT_CONFIG[booking.paymentStatus] ?? { label: booking.paymentStatus, color: DS.text4 };
  const statusLabel = (raw: string) => { const lbl = STATUS_CONFIG[raw]?.label || raw; return t(`media.status${lbl.charAt(0).toUpperCase() + lbl.slice(1)}` as `media.status${string}`); };
  const fmt = (n?: number) =>
    n != null
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)
      : "—";

  const VALID_NEXT = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["in_progress", "cancelled"],
    in_progress: ["delivered", "cancelled"],
    delivered: [],
    approved: [],
    rejected: ["in_progress"],
    cancelled: [],
  }[booking.status] ?? [];

  const detailFields = [
    { label: t("media.detailId"), value: booking.bookingNumber, mono: true },
    { label: t("media.detailCustomer"), value: booking.customerName },
    { label: t("media.detailEmail"), value: booking.customerEmail, mono: true },
    { label: t("media.detailPhone"), value: booking.customerPhone ?? "—" },
    { label: t("media.detailCompany"), value: booking.companyName ?? "—" },
    { label: t("media.detailType"), value: booking.bookingType },
    { label: t("media.detailService"), value: booking.package?.title ?? "—" },
    { label: t("media.detailTotal"), value: fmt(booking.totalAmount), bold: true },
    { label: t("media.detailPaid"), value: fmt(booking.paidAmount) },
    { label: t("media.detailDeadline"), value: booking.deadline ? new Date(booking.deadline).toLocaleDateString("vi-VN") : "—" },
    { label: t("media.detailAssignee"), value: booking.teamMember?.name ?? "—" },
    { label: t("media.detailCreated"), value: new Date(booking.createdAt).toLocaleString("vi-VN") },
    ...(booking.approvedAt ? [{ label: t("media.detailApprovedBy"), value: booking.approvedByUser?.name ?? "—", mono: false }] : []),
    ...(booking.rejectedAt ? [{ label: t("media.detailRejectedBy"), value: booking.rejectedByUser?.name ?? "—", mono: false }] : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`,
            borderRadius: 16, padding: 24, width: "100%", maxWidth: 580,
            maxHeight: "90vh", overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{booking.title}</h3>
              <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{booking.bookingNumber}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { onClose(); onEdit(booking); }}
                style={{
                  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
                  color: DS.blue, fontSize: 12, fontWeight: 600,
                }}
              >
                {t("media.btnEdit")}
              </button>
              <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 99, background: cfg.bg,
            marginBottom: 16,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
            <span style={{ color: cfg.color, fontSize: 12, fontWeight: 600 }}>{statusLabel(cfg.label)}</span>
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {detailFields.map((f) => (
              <div key={f.label} style={{
                background: DS.bg, border: `1px solid ${DS.border}`,
                borderRadius: 10, padding: "10px 14px",
              }}>
                <p style={{
                  color: DS.text4, fontSize: 10, fontFamily: DS.mono,
                  letterSpacing: "0.1em", marginBottom: 4,
                }}>
                  {f.label.toUpperCase()}
                </p>
                <p style={{
                  color: f.bold ? DS.blue : DS.text, fontWeight: f.bold ? 700 : 600,
                  fontSize: 13, fontFamily: f.mono ? DS.mono : DS.body,
                  wordBreak: "break-word",
                }}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>

          {/* Requirements */}
          {booking.requirements && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 6 }}>{t("media.detailRequirements")}</p>
              <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: 12 }}>
                <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>{booking.requirements}</p>
              </div>
            </div>
          )}

          {/* Admin note */}
          {booking.note && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 6 }}>{t("media.detailNotes")}</p>
              <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: 12 }}>
                <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>{booking.note}</p>
              </div>
            </div>
          )}

          {/* Delivered assets */}
          {booking.deliveredAssets && Array.isArray(booking.deliveredAssets) && booking.deliveredAssets.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 6 }}>{t("media.detailDocs")} ({booking.deliveredAssets.length})</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {booking.deliveredAssets.map((item, i) => {
                  const href = typeof item === "string" ? item : (item as { url?: string }).url ?? "#";
                  const label = typeof item === "string"
                    ? item.split("/").pop() ?? item
                    : (item as { name?: string }).name ?? `File ${i + 1}`;
                  return (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 12px", borderRadius: 8,
                        background: "rgba(139,92,246,0.1)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        color: "#8B5CF6", fontSize: 12, fontFamily: DS.mono,
                        display: "flex", alignItems: "center", gap: 4,
                        textDecoration: "none",
                        maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      <FileText size={12} />
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status transition buttons */}
          {(VALID_NEXT.length > 0 || (booking.status === "delivered" && booking.paymentStatus !== "paid")) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {booking.status === "delivered" && booking.paymentStatus !== "paid" && (
                <button
                  onClick={() => { onUpdatePayment(booking.id, "paid"); onClose(); }}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                    background: "rgba(34,197,94,0.1)",
                    border: `1px solid rgba(34,197,94,0.4)`,
                    color: "#22C55E", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}
                >
                  <CheckCircle2 size={13} />
                  Đã thanh toán
                </button>
              )}
              {VALID_NEXT.map((ns) => {
                const nsCfg = STATUS_CONFIG[ns] ?? { label: ns, color: DS.text4, bg: "transparent" };
                return (
                <button
                  key={ns}
                  onClick={() => { onTransition(booking.id, ns); }}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                    background: nsCfg.bg,
                    border: `1px solid ${nsCfg.color}40`,
                    color: nsCfg.color, fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}
                >
                  <CheckCircle2 size={13} />
                  {t(`media.status${nsCfg.label.charAt(0).toUpperCase() + nsCfg.label.slice(1)}` as `media.status${string}`)}
                </button>
              );
              })}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "10px", background: DS.bg,
              color: DS.text3, border: `1px solid ${DS.border}`,
              borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13,
            }}
          >
            {t("media.btnClose")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

function BookingFormModal({
  booking,
  onClose,
  onSuccess,
  mode = "booking",
}: {
  booking?: MediaBooking | null;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "booking" | "project";
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!booking;

  const { data: pkgsData } = useQuery({
    queryKey: ["admin", "pricing-packages"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: MediaPackage[] }>("/api/admin/pricing/packages", { params: { limit: 100, type: "media" } });
      return res;
    },
  });
  const pkgOptionsRaw = pkgsData?.data ?? [];

  const { data: membersData } = useQuery({
    queryKey: ["admin", "team-options"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: Array<{ id: string; name: string }> }>("/api/admin/team", { params: { limit: 100 } });
      return res;
    },
  });
  const memberOptions = membersData?.data ?? [];

  const { data: mediaJobsData } = useQuery({
    queryKey: ["admin", "media-jobs-options"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: MediaBooking[] }>("/api/admin/media-bookings", { 
        params: { limit: 100, status: "delivered" } 
      });
      return res;
    },
  });
  const mediaJobOptions = mediaJobsData?.data ?? [];


  const [form, setForm] = useState<BookingFormData>({
    customerName: booking?.customerName ?? "",
    customerEmail: booking?.customerEmail ?? "",
    customerPhone: booking?.customerPhone ?? "",
    companyName: booking?.companyName ?? "",
    bookingType: booking?.bookingType ?? "event",
    title: booking?.title ?? "",
    requirements: booking?.requirements ?? "",
    note: booking?.note ?? "",
    deadline: booking?.deadline ?? "",
    totalAmount: booking?.totalAmount?.toString() ?? "",
    teamMemberId: booking?.teamMember?.id ?? "",
    paymentStatus: (booking as MediaBooking | undefined)?.paymentStatus ?? (mode === "project" ? "paid" : "unpaid"),
    packageId: booking?.packageId ?? "",
    orderId: booking?.orderId ?? "",
    isFeatured: booking?.isFeatured ?? false,
  });

  const currentJob = mediaJobOptions.find(j => j.id === form.linkedBookingId);
  const pkgOptions = [...pkgOptionsRaw];
  if (currentJob?.packageId && !pkgOptions.some(p => p.id === currentJob.packageId)) {
    pkgOptions.push({
      id: currentJob.packageId,
      title: (currentJob as any).package?.title || "Gói dịch vụ liên kết",
      slug: "",
      shortDesc: "",
      type: "media",
    } as any);
  }

  const [deliveredAssets, setDeliveredAssets] = useState<(string | { url?: string; name?: string })[]>(
    Array.isArray(booking?.deliveredAssets) ? booking.deliveredAssets : []
  );
  const [assetUrl, setAssetUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { linkedBookingId: _lb, ...formToSave } = form;
      const payload = {
        ...formToSave,
        totalAmount: form.totalAmount ? parseInt(form.totalAmount, 10) : null,
        teamMemberId: form.teamMemberId || null,
        packageId: form.packageId || null,
        orderId: form.orderId || null,
        deliveredAssets: deliveredAssets,
        paymentStatus: form.paymentStatus,
        isFeatured: form.isFeatured,
        ...(mode === "project" ? { bookingType: "portfolio", status: "approved" } : {}),
      };
      if (isEdit && booking) {
        return adminApi.put(`/api/admin/media-bookings/${booking.id}`, payload);
      }
      return adminApi.post("/api/admin/media-bookings", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "media-bookings"] });
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t("media.errGeneral");
      setError(msg);
      setSaving(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fill for project mode
    if (mode === "project") {
      if (!form.customerName.trim()) form.customerName = "Dự án mới";
      if (!form.customerEmail.trim()) form.customerEmail = "media@loop.vn";
    }

    if (!form.customerName.trim()) {
      setError("Vui lòng nhập tên dự án");
      return;
    }
    
    if (mode !== "project") {
      if (!form.customerEmail.trim()) {
        setError(t("media.errRequired"));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
        setError(t("media.errInvalidEmail"));
        return;
      }
    }

    setSaving(true);
    mutation.mutate();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "media-portfolio");

        const res = await adminApi.post<{ data: { url: string } }>("/api/admin/upload", formData);
        if (res.data?.url) {
          setDeliveredAssets((prev) => [...prev, res.data.url]);
        } else {
          throw new Error("Không nhận được URL từ máy chủ");
        }
      }
    } catch (err: any) {
      setError(err?.message || err?.error || "Lỗi khi tải lên tệp");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addAsset = async () => {
    setError(""); // Clear any previous errors
    const trimmed = assetUrl.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    // Prepend https:// if it starts with www.
    const uploadSource = lower.startsWith("www.") ? `https://${trimmed}` : trimmed;
    const finalLower = uploadSource.toLowerCase();

    // Check if it's a direct upload candidate (Base64 or URL)
    const shouldUpload = 
      finalLower.startsWith("data:image") || 
      finalLower.startsWith("data:video") || 
      finalLower.startsWith("http://") || 
      finalLower.startsWith("https://");

    if (shouldUpload) {
      setUploading(true);
      try {
        const res = await adminApi.post<any>("/api/admin/upload", { 
          file: uploadSource,
          folder: "media-portfolio" 
        });
        
        // Resilience: check both wrapped and unwrapped response shapes
        const url = res?.data?.url || res?.url;
        
        if (url) {
          setDeliveredAssets((prev) => {
            const exists = prev.some(a => {
              const aUrl = typeof a === "string" ? a : (a as any).url;
              return aUrl === url;
            });
            if (exists) return prev;
            return [...prev, url];
          });
          setAssetUrl("");
          setError("");
        } else {
          throw new Error("Máy chủ không trả về URL sau khi tải lên.");
        }
      } catch (err: any) {
        console.error("Add asset upload error:", err);
        setError(`Không thể tải lên từ URL: ${err.message || "Lỗi không xác định"}.`);
      } finally {
        setUploading(false);
      }
      return;
    }

    try {
      let newItem: string | object = trimmed;
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          newItem = JSON.parse(trimmed);
        } catch (e) {
          newItem = trimmed;
        }
      }
      
      const key = typeof newItem === "string" ? newItem : JSON.stringify(newItem);
      const alreadyExists = deliveredAssets.some((a) => {
        const aKey = typeof a === "string" ? a : JSON.stringify(a);
        return aKey === key;
      });
      
      if (!alreadyExists) {
        setDeliveredAssets((prev) => [...prev, newItem]);
      }
      setAssetUrl("");
    } catch (err) {
      console.error("Add asset error:", err);
      setDeliveredAssets((prev) => [...prev, trimmed]);
      setAssetUrl("");
    }
  };

  const removeAsset = (item: string | { url?: string; name?: string }) => {
    const key = typeof item === "string" ? item : JSON.stringify(item);
    setDeliveredAssets((prev) => prev.filter((a) => {
      const aKey = typeof a === "string" ? a : JSON.stringify(a);
      return aKey !== key;
    }));
  };

  const fieldStyle = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "10px 14px", color: DS.text, fontSize: 13,
    outline: "none", fontFamily: DS.body, boxSizing: "border-box" as const,
  };
  const labelStyle = {
    display: "block", color: DS.text4, fontSize: 11,
    fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 6,
  };
  const groupStyle = { marginBottom: 14 };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`,
            borderRadius: 16, padding: 24, width: "100%", maxWidth: 600,
            maxHeight: "90vh", overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Camera size={20} style={{ color: mode === "project" ? "#F472B6" : DS.blue }} />
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 17 }}>
                {isEdit ? "Cập nhật Portfolio" : mode === "project" ? "Đăng dự án Portfolio" : t("media.formCreateTitle")}
              </h3>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Link to Order (Top of form for Portfolio Mode) */}
            {mode === "project" && (
              <div style={{ ...groupStyle, padding: "16px", background: "rgba(244,114,182,0.03)", border: "1px solid rgba(244,114,182,0.15)", borderRadius: 16, marginBottom: 24 }}>
                <label style={{ ...labelStyle, color: "#F472B6", fontSize: 11, letterSpacing: "0.05em", marginBottom: 10 }}>LIÊN KẾT DỮ LIỆU TỪ BOOKING (TÙY CHỌN)</label>
                <select
                  style={{ ...fieldStyle, background: "rgba(15,23,42,0.5)", border: "1px solid rgba(244,114,182,0.2)", color: DS.text }}
                  value={form.linkedBookingId || ""}
                  onChange={(e) => {
                    const oid = e.target.value;
                    const selectedJob = mediaJobOptions.find(j => j.id === oid);
                    if (selectedJob) {
                      setForm((f) => ({ 
                        ...f, 
                        linkedBookingId: oid,
                        orderId: selectedJob.orderId || "",
                        customerName: selectedJob.customerName || "",
                        customerEmail: selectedJob.customerEmail || "",
                        customerPhone: selectedJob.customerPhone || "",
                        companyName: selectedJob.companyName || "",
                        packageId: selectedJob.packageId || "",
                        title: selectedJob.title || "",
                        requirements: selectedJob.requirements || "",
                        bookingType: selectedJob.bookingType || "event",
                      }));
                      if (Array.isArray(selectedJob.deliveredAssets)) {
                        setDeliveredAssets(selectedJob.deliveredAssets);
                      }
                    } else {
                      setForm(f => ({ ...f, linkedBookingId: oid }));
                    }
                  }}
                >
                  <option value="" style={{ background: "#1E293B" }}>— Đăng dự án mới (Không liên kết) —</option>
                  {mediaJobOptions.map((j) => (
                    <option key={j.id} value={j.id} style={{ background: "#1E293B" }}>
                      {j.bookingNumber} - {j.customerName} ({j.title})
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 8, fontSize: 10, color: DS.text5, fontStyle: "italic", lineHeight: 1.4 }}>
                  * Sau khi lưu, Portfolio này sẽ là một bản ghi riêng biệt, không thay đổi dữ liệu Booking gốc của khách hàng.
                </div>
              </div>
            )}

            {/* Customer info */}
            <div style={{ display: "grid", gridTemplateColumns: mode === "project" ? "1fr" : "1fr 1fr", gap: 12, ...groupStyle }}>
              <div>
                <label style={labelStyle}>{mode === "project" ? "TÊN KHÁCH HÀNG / THƯƠNG HIỆU" : t("media.formCustomerName")}</label>
                <input style={fieldStyle} value={form.customerName}
                  placeholder={mode === "project" ? "Ví dụ: GENTLE MONSTER" : "Nguyễn Văn A"}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
              </div>
              {mode !== "project" && (
                <div>
                  <label style={labelStyle}>{t("media.formEmail")}</label>
                  <input style={fieldStyle} type="email" value={form.customerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} />
                </div>
              )}
            </div>

            {/* Booking type + title */}
            <div style={{ display: "grid", gridTemplateColumns: mode === "project" ? "1fr" : "1fr 2fr", gap: 12, ...groupStyle }}>
              {mode !== "project" && (
                <div>
                  <label style={labelStyle}>{t("media.formBookingType")}</label>
                  <select style={fieldStyle} value={form.bookingType}
                    onChange={(e) => setForm((f) => ({ ...f, bookingType: e.target.value }))}>
                    {BOOKING_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{t(`media.${opt.labelKey}`)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>{t("media.formTitle")}</label>
                <input style={fieldStyle} value={form.title}
                  placeholder="VD: Chụp ảnh sản phẩm tháng 4"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
            </div>

            {mode === "project" && (
              <div style={{ marginTop: -10, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <input 
                  type="checkbox" 
                  id="isFeatured"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <label htmlFor="isFeatured" style={{ fontSize: 14, fontWeight: 700, color: DS.pink, cursor: "pointer" }}>
                  DỰ ÁN TIÊU BIỂU (Hiện lên khung 5 ảnh ở trang chủ)
                </label>
              </div>
            )}

            {/* Service Package selection */}
            <div style={groupStyle}>
              <label style={labelStyle}>{mode === "project" ? "GÓI DỊCH VỤ ĐÃ SỬ DỤNG" : (t("media.formService") || "Gói dịch vụ")}</label>
              <select style={fieldStyle} value={form.packageId}
                onChange={(e) => {
                  const pkgId = e.target.value;
                  const pkg = pkgOptions.find(p => p.id === pkgId);
                  setForm((f) => ({ 
                    ...f, 
                    packageId: pkgId,
                    ...(pkg && !f.totalAmount ? { totalAmount: pkg.price?.toString() || "" } : {}),
                    ...(pkg && (!f.bookingType || f.bookingType === "event") ? { bookingType: pkg.type } : {}),
                  }));
                }}>
                <option value="">— {t("media.formSelectPackage") || "Chọn gói dịch vụ"} —</option>
                {pkgOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.price ? fmtVND(p.price) : "Liên hệ"})</option>
                ))}
              </select>
            </div>

            {/* Deadline + amount */}
            {mode !== "project" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, ...groupStyle }}>
                <div>
                  <label style={labelStyle}>{t("media.formDeadline")}</label>
                  <input type="date" style={fieldStyle} value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>{t("media.formTotal")}</label>
                  <input style={fieldStyle} type="number" placeholder="VD: 5000000"
                    value={form.totalAmount}
                    onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Assignee + payment status */}
            <div style={{ display: "grid", gridTemplateColumns: mode === "project" ? "1fr" : "1fr 1fr", gap: 12, ...groupStyle }}>
              <div>
                <label style={labelStyle}>{t("media.formAssignee")}</label>
                <select style={fieldStyle} value={form.teamMemberId}
                  onChange={(e) => setForm((f) => ({ ...f, teamMemberId: e.target.value }))}>
                  <option value="">— {t("media.formSelectAssignee")} —</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              {mode !== "project" && (
                <div>
                  <label style={labelStyle}>{t("media.formPaymentStatus")}</label>
                  <select style={fieldStyle} value={form.paymentStatus}
                    onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}>
                    <option value="unpaid">{t("media.paymentUnpaid")}</option>
                    <option value="partial">{t("media.paymentPartial")}</option>
                    <option value="paid">{t("media.paymentPaid")}</option>
                    <option value="refunded">{t("media.paymentRefunded")}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div style={groupStyle}>
              <label style={labelStyle}>{mode === "project" ? "MÔ TẢ DỰ ÁN" : t("media.formRequirements")}</label>
              <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
                value={form.requirements}
                placeholder={mode === "project" ? "Mô tả ngắn gọn về sản phẩm để khách hàng nắm bắt..." : "Mô tả chi tiết yêu cầu media..."}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} />
            </div>

            {/* Admin note */}
            <div style={groupStyle}>
              <label style={labelStyle}>{t("media.formNotes")}</label>
              <textarea style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }}
                value={form.note}
                placeholder="Ghi chú cho team media..."
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>

            {/* Delivered assets (edit or project mode) */}
            {(isEdit || mode === "project") && (
              <div style={groupStyle}>
                <label style={labelStyle}>{t("media.formDocs")}</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    style={{ ...fieldStyle, flex: 1 }}
                    placeholder="Dán URL hoặc chọn tệp..."
                    value={assetUrl}
                    onChange={(e) => {
                      setAssetUrl(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAsset())}
                  />
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    accept="image/*"
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ padding: "10px 14px", background: DS.bg, color: DS.text, border: `1px solid ${DS.border}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    Tải lên
                  </button>
                  <button type="button" onClick={addAsset}
                    style={{ padding: "10px 14px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={14} /> {t("media.formBtnAdd")}
                  </button>
                </div>
                {deliveredAssets.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {deliveredAssets.map((item, i) => {
                      const href = typeof item === "string" ? item : (item as { url?: string }).url ?? "#";
                      const label = typeof item === "string"
                        ? item.split("/").pop() ?? item
                        : (item as { name?: string }).name ?? `File ${i + 1}`;
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                          borderRadius: 8, background: "rgba(139,92,246,0.1)",
                          border: "1px solid rgba(139,92,246,0.3)",
                        }}>
                          <a href={href} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#8B5CF6", fontSize: 12, fontFamily: DS.mono, textDecoration: "none", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {label}
                          </a>
                          <button type="button" onClick={() => removeAsset(item)}
                            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 0, display: "flex" }}>
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 14, color: "#EF4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: "11px", background: DS.bg, color: DS.text3, border: `1px solid ${DS.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={saving}
                style={{
                  flex: 2, padding: "11px", background: saving ? `${DS.blue}80` : mode === "project" ? DS.pink : GRD.primary,
                  color: "#fff", border: "none", borderRadius: 10, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", fontSize: 13,
                  boxShadow: mode === "project" ? "0 4px 12px rgba(236,72,153,0.3)" : "none"
                }}>
                {saving ? t("common.loading") : isEdit ? t("common.save") : mode === "project" ? "Đăng dự án ngay" : t("media.formBtnCreate")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Lightbox Modal ────────────────────────────────────────────────────────────

function LightboxModal({
  items,
  startIndex,
  onClose,
  title,
  customer,
  bookingNumber,
  t,
}: {
  items: (string | { url?: string; name?: string })[];
  startIndex: number;
  onClose: () => void;
  title: string;
  customer: string;
  bookingNumber: string;
  t: ReturnType<typeof useAdminTranslations>["t"];
}) {
  const [idx, setIdx] = useState(startIndex);
  const item = items[idx];
  const src = typeof item === "string" ? item : (item as { url?: string }).url ?? "#";
  const label = typeof item === "string"
    ? item.split("/").pop() ?? item
    : (item as { name?: string }).name ?? `File ${idx + 1}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)",
          zIndex: 100, display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px", borderBottom: `1px solid ${DS.border}`,
        }}>
          <div>
            <p style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{title}</p>
            <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
              {bookingNumber} · {customer} · {label}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "6px 12px", borderRadius: 8,
                background: "rgba(59,130,246,0.15)", border: `1px solid rgba(59,130,246,0.3)`,
                color: DS.blue, fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, textDecoration: "none",
              }}
            >
              <ExternalLink size={12} /> {t("media.portfolioOpenOriginal")}
            </a>
            <button
              onClick={onClose}
              style={{
                padding: "6px 12px", borderRadius: 8, background: DS.bgCard,
                border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer",
                display: "flex", alignItems: "center", fontSize: 12,
              }}
            >
              <X size={13} /> {t("common.close")}
            </button>
          </div>
        </div>

        {/* Image */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 24px", position: "relative",
        }}>
          {/* Prev */}
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)", border: "none",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20,
              }}
            >
              ‹
            </button>
          )}

          <img
            key={idx}
            src={src}
            alt={label}
            style={{
              maxHeight: "80vh", maxWidth: "90vw", objectFit: "contain",
              borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />

          {/* Next */}
          {idx < items.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)", border: "none",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20,
              }}
            >
              ›
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        {items.length > 1 && (
          <div style={{
            display: "flex", gap: 8, padding: "12px 24px",
            overflowX: "auto", borderTop: `1px solid ${DS.border}`,
          }}>
            {items.map((it, i) => {
              const url = typeof it === "string" ? it : (it as { url?: string }).url ?? "#";
              return (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  style={{
                    width: 56, height: 56, borderRadius: 8, flexShrink: 0,
                    border: `2px solid ${i === idx ? DS.blue : "transparent"}`,
                    overflow: "hidden", cursor: "pointer", padding: 0,
                    opacity: i === idx ? 1 : 0.6,
                    transition: "opacity 0.15s",
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Counter */}
        <div style={{
          textAlign: "center", padding: "8px 0 12px",
          color: DS.text4, fontSize: 11, fontFamily: DS.mono,
        }}>
          {idx + 1} / {items.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Portfolio Gallery ──────────────────────────────────────────────────────────

function PortfolioGallery({
  onEditBooking,
  onDeleteBooking,
  onAdd,
  t,
}: {
  onEditBooking: (booking: MediaBooking) => void;
  onDeleteBooking: (id: string) => void;
  onAdd: () => void;
  t: ReturnType<typeof useAdminTranslations>["t"];
}) {
  const [lightbox, setLightbox] = useState<{
    items: (string | { url?: string; name?: string })[];
    index: number;
    booking: MediaBooking;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "media-bookings", "portfolio"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: MediaBooking[] }>("/api/admin/media-bookings", {
        params: { portfolio: "true", limit: 100 },
      });
      return res;
    },
  });

  const bookings = data?.data ?? [];

  const openLightbox = (booking: MediaBooking, itemIndex: number) => {
    setLightbox({ items: booking.deliveredAssets as (string | { url?: string; name?: string })[], index: itemIndex, booking });
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${DS.border}`, borderTopColor: DS.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Portfolio Showcase
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {t("media.portfolioCount", { n: bookings.length })}
          </p>
        </div>
        <button
          onClick={onAdd}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 12, cursor: "pointer",
            background: DS.pink, border: "none",
            color: "#fff", fontSize: 14, fontWeight: 800,
            boxShadow: "0 0 20px rgba(236,72,153,0.4)",
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <Plus size={18} />
          Thêm dự án
        </button>
      </div>

      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: DS.text4 }}>
          <Image size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>{t("media.portfolioEmpty")}</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>{t("media.portfolioEmptyHint")}</p>
        </div>
      ) : (
        /* Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {bookings.map((booking) => {
            const assets = (booking.deliveredAssets as (string | { url?: string; name?: string })[]);
            const cover = assets[0];
            const coverSrc = typeof cover === "string" ? cover : (cover as { url?: string }).url ?? "";

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: DS.bgCard, border: `1px solid ${DS.border}`,
                  borderRadius: 16, overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Cover image */}
                <div
                  style={{
                    height: 180, background: DS.bg, position: "relative",
                    overflow: "hidden", cursor: "pointer",
                  }}
                  onClick={() => assets.length > 0 && openLightbox(booking, 0)}
                >
                  {coverSrc ? (
                    <>
                      <img
                        src={coverSrc}
                        alt={booking.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
                      }} />
                    </>
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", display: "flex",
                      alignItems: "center", justifyContent: "center", color: DS.text4,
                    }}>
                      <Camera size={32} />
                    </div>
                  )}
                  {/* Overlay icon */}
                  <div style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.4)", opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = "0")}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                    }}>
                      <ZoomIn size={18} />
                    </div>
                  </div>
                  {/* Asset count badge */}
                  {assets.length > 1 && (
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      background: "rgba(0,0,0,0.7)", color: "#fff",
                      fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 99,
                    }}>
                      +{assets.length - 1}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "12px 16px 16px" }}>
                  <p style={{
                    color: DS.text, fontWeight: 700, fontSize: 14,
                    marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {booking.title}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", alignItems: "center", marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 99,
                      background: `${DS.purple}15`, color: DS.purple,
                      fontFamily: DS.mono, fontWeight: 600,
                    }}>
                      {t(`media.${BOOKING_TYPE_OPTIONS.find((o) => o.value === booking.bookingType)?.labelKey ?? "typeCustom"}`)}
                    </span>
                    {booking.teamMember && (
                      <span style={{
                        fontSize: 10, padding: "1px 6px", borderRadius: 99,
                        background: "rgba(139,92,246,0.1)", color: "#8B5CF6",
                        fontFamily: DS.mono, fontWeight: 600,
                      }}>
                        {booking.teamMember.name}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                        {booking.customerName}
                      </p>
                      {booking.deliveredAt && (
                        <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>
                          {new Date(booking.deliveredAt).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {assets.length > 0 && (
                        <button
                          onClick={() => openLightbox(booking, 0)}
                          title={t("media.portfolioViewAll")}
                          style={{
                            padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                            background: "rgba(59,130,246,0.1)",
                            border: "1px solid rgba(59,130,246,0.3)",
                            color: DS.blue, display: "flex", alignItems: "center",
                          }}
                        >
                          <ZoomIn size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => onEditBooking(booking)}
                        title={t("btnEdit")}
                        style={{
                          padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                          background: "rgba(139,92,246,0.1)",
                          border: "1px solid rgba(139,92,246,0.3)",
                          color: "#8B5CF6", display: "flex", alignItems: "center",
                        }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t("media.confirmDelete"))) {
                            onDeleteBooking(booking.id);
                          }
                        }}
                        title={t("btnDelete")}
                        style={{
                          padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: DS.red, display: "flex", alignItems: "center",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <LightboxModal
          items={lightbox.items}
          startIndex={lightbox.index}
          title={lightbox.booking.title}
          customer={lightbox.booking.customerName}
          bookingNumber={lightbox.booking.bookingNumber}
          onClose={() => setLightbox(null)}
          t={t}
        />
      )}
    </>
  );
}

// ─── Package Form Modal ────────────────────────────────────────────────────────
function PackageFormModal({
  pkg,
  onClose,
  onSuccess,
}: {
  pkg?: MediaPackage | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!pkg;

  const [form, setForm] = useState<PackageFormData>({
    title: pkg?.title ?? "",
    slug: pkg?.slug ?? "",
    shortDesc: pkg?.shortDesc ?? "",
    type: pkg?.type ?? "media",
    price: pkg?.price?.toString() ?? "",
    priceText: pkg?.priceText ?? "",
    tagline: pkg?.tagline ?? "",
    color: pkg?.color ?? DS.pink,
    features: pkg?.features?.join("\n") ?? "",
    sortOrder: pkg?.sortOrder?.toString() ?? "0",
    isActive: pkg?.isActive ?? true,
    isPopular: (pkg as any)?.isPopular ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        id: pkg?.id,
        type: "media",
        price: form.price ? parseInt(form.price, 10) : null,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isPopular: form.isPopular,
        serviceKey: "media",
        features: form.features.split("\n").filter(f => f.trim()),
      };
      if (isEdit) {
        return adminApi.put("/api/admin/pricing/packages", payload);
      } else {
        return adminApi.post("/api/admin/pricing/packages", payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "media-packages"] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || err.message || "Failed to save package");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    mutation.mutate();
    setSaving(false);
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: DS.text4, marginBottom: 6, fontFamily: DS.mono, letterSpacing: "0.05em"
  };
  const groupStyle: React.CSSProperties = { marginBottom: 16 };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          style={{ background: DS.bgCard, width: "100%", maxWidth: 500, borderRadius: 24, border: `1px solid ${DS.border}`, overflow: "hidden", boxShadow: GLOW.cardShadow }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: DS.text }}>
              {isEdit ? "Chỉnh sửa gói" : "Tạo gói dịch vụ Media"}
            </h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Tên gói</label>
              <input required style={fieldStyle} value={form.title}
                onChange={(e) => {
                  const val = e.target.value;
                  const slug = val.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
                  setForm(f => ({ ...f, title: val, ...(!isEdit ? { slug } : {}) }));
                }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, ...groupStyle }}>
              <div>
                <label style={labelStyle}>Slug</label>
                <input required style={fieldStyle} value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Màu chủ đạo (HEX)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...fieldStyle, flex: 1 }} value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} />
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: form.color, border: `1px solid ${DS.border}` }} />
                </div>
              </div>
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Tagline (Mô tả ngắn gọn)</label>
              <input style={fieldStyle} value={form.tagline} onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="E-commerce Ready" />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Mô tả chi tiết</label>
              <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} value={form.shortDesc} onChange={(e) => setForm(f => ({ ...f, shortDesc: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, ...groupStyle }}>
              <div>
                <label style={labelStyle}>Giá (VNĐ)</label>
                <input type="number" style={fieldStyle} value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Text hiển thị giá</label>
                <input style={fieldStyle} value={form.priceText} onChange={(e) => setForm(f => ({ ...f, priceText: e.target.value }))} placeholder="Từ 5.000.000₫" />
              </div>
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Tính năng (mỗi dòng 1 tính năng)</label>
              <textarea style={{ ...fieldStyle, minHeight: 120, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }} 
                value={form.features} onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, ...groupStyle }}>
              <div>
                <label style={labelStyle}>Thứ tự sắp xếp</label>
                <input type="number" style={fieldStyle} value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: DS.text }}>
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm(f => ({ ...f, isPopular: e.target.checked }))} />
                  Gói phổ biến (Badge)
                </label>
              </div>
            </div>

            {error && <div style={{ color: DS.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, background: DS.bg, color: DS.text3, border: `1px solid ${DS.border}`, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
              <button type="submit" disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 12, background: GRD.primary, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo gói mới"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MediaBookingsPage() {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<MediaBooking | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editBooking, setEditBooking] = useState<MediaBooking | null>(null);
  const [showPackageCreate, setShowPackageCreate] = useState(false);
  const [editPackage, setEditPackage] = useState<MediaPackage | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "portfolio" | "packages">("bookings");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showProjectCreate, setShowProjectCreate] = useState(false);

  // Expose trigger to global for tab access
  if (typeof window !== "undefined") {
    (window as any).triggerPackageCreate = () => setShowPackageCreate(true);
  }

  const translatedStatuses = Object.fromEntries(
    Object.entries(STATUS_CONFIG).map(([k, v]) => [
      k,
      { ...v, label: t(`media.status${v.label.charAt(0).toUpperCase() + v.label.slice(1)}` as `media.status${string}`) },
    ])
  );
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "media-bookings", { page, limit: 20, search, status: statusFilter, featured: featuredFilter }],
    queryFn: async () => {
      const res = await adminApi.get<{
        data: MediaBooking[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>("/api/admin/media-bookings", {
        params: { page, limit: 20, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(featuredFilter ? { featured: true } : {}) },
      });
      return res;
    },
  });

  const bookings = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const transitionMutation = useMutation({
    mutationFn: async ({ id, toStatus }: { id: string; toStatus: string }) => {
      return adminApi.post(`/api/admin/media-bookings/${id}/transition`, { toStatus });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media-bookings"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.delete(`/api/admin/media-bookings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media-bookings"] }),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      return adminApi.put(`/api/admin/media-bookings/${id}`, { paymentStatus });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media-bookings"] }),
  });

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: DS.bgCosmic ?? "var(--figma-bg-cosmic, #09090b)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>
            {t("media.title")}
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {t("media.titleCount", { n: pagination?.total ?? 0 })}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 20,
        background: DS.bg, border: `1px solid ${DS.border}`,
        borderRadius: 12, padding: 4, width: "fit-content",
      }}>
        {([
          { key: "bookings", label: t("media.tabBookings"), icon: <List size={13} /> },
          { key: "portfolio", label: t("media.tabPortfolio"), icon: <LayoutGrid size={13} /> },
          { key: "packages", label: "Gói dịch vụ", icon: <PackageIcon size={13} /> },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 9, cursor: "pointer",
              fontSize: 12, fontFamily: DS.mono, fontWeight: 600,
              border: "none", outline: "none",
              background: activeTab === tab.key ? GRD.primary : "transparent",
              color: activeTab === tab.key ? "#fff" : DS.text4,
              transition: "all 0.15s",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Packages tab */}
      {activeTab === "packages" ? (
        <MediaPackagesTab onEdit={setEditPackage} onAdd={() => setShowPackageCreate(true)} />
      ) : activeTab === "portfolio" ? (
        <PortfolioGallery
          onEditBooking={(booking) => setEditBooking(booking)}
          onDeleteBooking={(id) => deleteMutation.mutate(id)}
          onAdd={() => setShowProjectCreate(true)}
          t={t}
        />
      ) : (
      /* Bookings tab */
      <>

      {/* Bookings Header Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "media-bookings"] })}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10,
              color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono,
            }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> {t("media.refreshBtn")}
          </button>
          
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
              background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12,
              color: DS.text, cursor: "pointer", fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <Plus size={16} style={{ color: DS.pink }} /> {t("media.createBtn")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
          <input
            type="text"
            placeholder={t("media.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`,
              borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13,
              outline: "none", boxSizing: "border-box", fontFamily: DS.body,
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10,
            padding: "8px 12px", color: DS.text3, fontSize: 13, outline: "none",
            cursor: "pointer", fontFamily: DS.mono,
          }}
        >
          <option value="">{t("media.filterAll")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{translatedStatuses[s]?.label ?? s}</option>
          ))}
        </select>

        <button
          onClick={() => { setFeaturedFilter((f) => !f); setPage(1); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            background: featuredFilter ? "rgba(236,72,153,0.15)" : DS.bgCard,
            border: `1px solid ${featuredFilter ? "rgba(236,72,153,0.5)" : DS.border}`,
            borderRadius: 10,
            color: featuredFilter ? DS.pink : DS.text4,
            fontSize: 13, fontFamily: DS.mono, cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <TrendingUp size={13} />
          {t("media.featuredOnly") ?? "Featured"}
        </button>
      </div>

      {/* KPI MiniStats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          {
            label: t("media.kpiTotal"),
            value: (pagination?.total ?? 0).toString(),
            color: DS.blue,
            icon: <Camera size={15} />,
          },
          {
            label: t("media.kpiPending"),
            value: bookings.filter((b) => b.status === "pending").length.toString(),
            color: DS.amber,
            icon: <RefreshCw size={15} />,
          },
          {
            label: t("media.kpiInProgress"),
            value: bookings.filter((b) => b.status === "in_progress").length.toString(),
            color: DS.purple,
            icon: <Camera size={15} />,
          },
          {
            label: t("media.kpiRevenue"),
            value: fmtVND(bookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0)),
            color: DS.green,
            icon: <TrendingUp size={15} />,
          },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`,
            borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `${kpi.color}15`, border: `1px solid ${kpi.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: kpi.color, flexShrink: 0,
            }}>
              {kpi.icon}
            </div>
            <div>
              <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 1 }}>
                {kpi.label.toUpperCase()}
              </p>
              <p style={{ color: DS.text, fontWeight: 700, fontSize: 16 }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = bookings.filter((b) => b.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              style={{
                padding: "4px 10px", borderRadius: 99, cursor: "pointer", fontSize: 11,
                fontFamily: DS.mono, fontWeight: 600,
                background: statusFilter === s ? cfg.bg : DS.bg,
                border: `1px solid ${statusFilter === s ? cfg.color + "60" : DS.border}`,
                color: statusFilter === s ? cfg.color : DS.text4,
              }}
            >
              {translatedStatuses[s]?.label ?? s} {count > 0 && <span>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${DS.border}`, borderTopColor: DS.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: DS.text4 }}>
          <Camera size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>{t("media.emptyState")}</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>{t("media.emptyStateHint")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              onTransition={(id, toStatus) => transitionMutation.mutate({ id, toStatus })}
              onDetail={setSelectedBooking}
              onDelete={(id) => {
                if (confirm(t("media.confirmDelete"))) {
                  deleteMutation.mutate(id);
                }
              }}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              width: 36, height: 36, borderRadius: 10, cursor: page <= 1 ? "not-allowed" : "pointer",
              background: DS.bgCard, border: `1px solid ${DS.border}`,
              color: page <= 1 ? DS.text4 : DS.text3, opacity: page <= 1 ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ color: DS.text4, fontSize: 13, fontFamily: DS.mono }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              width: 36, height: 36, borderRadius: 10, cursor: page >= totalPages ? "not-allowed" : "pointer",
              background: DS.bgCard, border: `1px solid ${DS.border}`,
              color: page >= totalPages ? DS.text4 : DS.text3, opacity: page >= totalPages ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      </> /* end activeTab === "bookings" */)}

      {/* Detail Modal */}
      <DetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onTransition={(id, toStatus) => transitionMutation.mutate({ id, toStatus })}
        onEdit={(b) => { setSelectedBooking(null); setEditBooking(b); }}
        onUpdatePayment={(id, paymentStatus) => updatePaymentMutation.mutate({ id, paymentStatus })}
        t={t}
      />

      {/* Create/Edit Booking Modal */}
      {(showCreate || editBooking) && (
        <BookingFormModal
          booking={editBooking}
          mode={editBooking?.status === "delivered" || editBooking?.status === "approved" ? "project" : "booking"}
          onClose={() => { setShowCreate(false); setEditBooking(null); }}
          onSuccess={() => { setShowCreate(false); setEditBooking(null); }}
        />
      )}

      {/* Create Project Modal */}
      {showProjectCreate && (
        <BookingFormModal
          mode="project"
          onClose={() => setShowProjectCreate(false)}
          onSuccess={() => { setShowProjectCreate(false); qc.invalidateQueries({ queryKey: ["admin", "media-bookings", "portfolio"] }); }}
        />
      )}

      {/* Create/Edit Media Package Modal */}
      {(showPackageCreate || editPackage) && (
        <PackageFormModal
          pkg={editPackage}
          onClose={() => { setShowPackageCreate(false); setEditPackage(null); }}
          onSuccess={() => { setShowPackageCreate(false); setEditPackage(null); }}
        />
      )}
    </div>
  );
}

// ─── Tab 3: Media Packages ─────────────────────────────────────────────────────

function MediaPackagesTab({ 
  onEdit,
  onAdd
}: { 
  onEdit: (pkg: MediaPackage) => void;
  onAdd: () => void;
}) {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "media-packages"],
    queryFn: () => adminApi.get<{ data: MediaPackage[] }>("/api/admin/pricing/packages?type=media"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (pkg: MediaPackage) => {
      await adminApi.put("/api/admin/pricing/packages", {
        id: pkg.id,
        isActive: !pkg.isActive,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media-packages"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Lưu thất bại", type: "error" }); },
  });

  const seedMutation = useMutation({
    mutationFn: () => adminApi.post("/api/pricing/media-seed", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media-packages"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Seed thất bại", type: "error" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/pricing/packages?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media-packages"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Xóa thất bại", type: "error" }); },
  });

  const packages: MediaPackage[] = data?.data ?? [];

  // Card gradient + icon color config per package slug
  const PKG_META: Record<string, { gradient: string; iconBg: string; iconColor: string; badge: string; popular?: boolean }> = {
    "chup-anh":       { gradient: GRD.teal,   iconBg: "rgba(110,177,168,0.15)", iconColor: "#6EB1A8", badge: "Basic" },
    "quay-va-dung":   { gradient: GRD.blue,   iconBg: "rgba(79,125,243,0.15)",  iconColor: "#4F7DF3", badge: "Standard", popular: true },
    "quay-dung-content": { gradient: GRD.primary, iconBg: "rgba(236,72,153,0.15)", iconColor: DS.pink, badge: "Premium" },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text, margin: "0 0 4px" }}>
            Gói dịch vụ Media
          </h3>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            3 gói: Chụp Ảnh · Quay & Dựng · Quay & Dựng + Content
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12, cursor: "pointer",
              background: "rgba(139,92,246,0.15)", border: `1px solid rgba(139,92,246,0.4)`,
              color: "#A78BFA", fontSize: 13, fontFamily: DS.mono, fontWeight: 700,
              opacity: seedMutation.isPending ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {seedMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Seed / Sync
          </button>

          <button
            onClick={onAdd}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px", borderRadius: 12, cursor: "pointer",
              background: DS.pink, border: "none",
              color: "#fff", fontSize: 14, fontWeight: 800,
              boxShadow: "0 0 20px rgba(236,72,153,0.4)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <Plus size={18} />
            Thêm gói mới
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: DS.pink }} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && packages.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: DS.bgCard, border: `1px dashed ${DS.border}`,
          borderRadius: 16,
        }}>
          <Camera size={40} style={{ color: DS.text4, marginBottom: 12 }} />
          <p style={{ color: DS.text3, fontFamily: DS.heading, fontSize: 16, marginBottom: 8 }}>Chưa có gói Media nào</p>
          <p style={{ color: DS.text4, fontSize: 13, marginBottom: 20 }}>
            Nhấn "Seed / Sync" để tạo 3 gói mặc định
          </p>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            style={{
              padding: "8px 20px", borderRadius: 9, cursor: "pointer",
              background: GRD.primary, border: "none", color: "#fff",
              fontFamily: DS.heading, fontSize: 14, fontWeight: 700,
            }}
          >
            Tạo 3 gói mặc định
          </button>
        </div>
      )}

      {/* Package cards */}
      {!isLoading && packages.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {packages.map((pkg) => {
            const meta = PKG_META[pkg.slug] ?? { gradient: GRD.cosmicBg1, iconBg: "rgba(139,92,246,0.15)", iconColor: DS.purple, badge: "—" };
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: DS.bgCard,
                  border: `1px solid ${pkg.isActive ? meta.iconColor + "44" : DS.border}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  position: "relative",
                  transition: "border-color 0.2s",
                  opacity: pkg.isActive ? 1 : 0.55,
                }}
              >
                {/* Gradient top bar */}
                <div style={{
                  height: 4,
                  background: pkg.isActive ? meta.gradient : "transparent",
                }} />

                {/* Popular badge */}
                {meta.popular && pkg.isActive && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: DS.pink, color: "#fff",
                    fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 99,
                  }}>
                    PHỔ BIẾN
                  </div>
                )}

                <div style={{ padding: "20px 20px 16px" }}>
                  {/* Icon + badge row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: meta.iconBg, display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Camera size={24} style={{ color: meta.iconColor }} />
                    </div>
                    <span style={{
                      fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
                      padding: "3px 8px", borderRadius: 99,
                      background: meta.iconBg, color: meta.iconColor,
                    }}>
                      {meta.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 style={{
                    fontFamily: DS.heading, fontSize: 18, fontWeight: 700,
                    color: DS.text, margin: "0 0 4px",
                  }}>
                    {pkg.title}
                  </h4>

                  {/* Short desc */}
                  <p style={{ color: DS.text4, fontSize: 13, lineHeight: 1.5, margin: "0 0 16px", minHeight: 40 }}>
                    {pkg.shortDesc}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: 16 }}>
                    <span style={{
                      fontFamily: DS.heading, fontSize: 24, fontWeight: 700,
                      color: pkg.isActive ? meta.iconColor : DS.text4,
                    }}>
                      {pkg.price != null ? fmtVND(pkg.price) : "Liên hệ"}
                    </span>
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
                    {(pkg.features ?? []).map((feat, i) => (
                      <li key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 8,
                        marginBottom: 8, fontSize: 13, color: DS.text3, lineHeight: 1.4,
                      }}>
                        <Check size={13} style={{ color: meta.iconColor, flexShrink: 0, marginTop: 2 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer: toggle */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: DS.text4, fontFamily: DS.mono }}>
                        {pkg.isActive ? "Đang bật" : "Đã tắt"}
                      </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => onEdit(pkg)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: `1px solid ${DS.border}`,
                          background: DS.bg, color: DS.text3, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Xóa gói "${pkg.title}"?`)) {
                            deleteMutation.mutate(pkg.id);
                          }
                        }}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: `1px solid ${DS.border}`,
                          background: DS.bg, color: DS.red, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(pkg)}
                        disabled={toggleMutation.isPending}
                        style={{
                          width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                          background: pkg.isActive ? "#22C55E" : DS.border,
                          transition: "background 0.2s", position: "relative",
                          marginTop: 6,
                          opacity: toggleMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        <span style={{
                          position: "absolute", top: 2,
                          left: pkg.isActive ? 18 : 2,
                          width: 16, height: 16, borderRadius: "50%", background: "#fff",
                          transition: "left 0.2s",
                        }} />
                      </button>
                    </div>
                    </div>
                    <span style={{ fontSize: 10, color: DS.text5, fontFamily: DS.mono }}>
                      #{pkg.sortOrder}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add-on note */}
      {!isLoading && packages.length > 0 && (
        <div style={{
          marginTop: 20, padding: "12px 16px", borderRadius: 10,
          background: "rgba(59,130,246,0.05)", border: `1px solid rgba(59,130,246,0.15)`,
        }}>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            💡 <strong style={{ color: DS.text3 }}>Tùy chỉnh thêm:</strong> Khách hàng có thể chọn thêm dịch vụ đắp thêm (extra shooting, extra clip, drone footage, makeup artist) khi đặt dịch vụ.
            Extra được ghi nhận trong <strong style={{ color: DS.text3 }}>MediaBooking.note</strong> hoặc thêm field <strong style={{ color: DS.text3 }}>addonAmount</strong>.
          </p>
        </div>
      )}

      {/* Toast */}
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
    </div>
  );
}
