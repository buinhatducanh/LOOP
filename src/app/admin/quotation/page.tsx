"use client";

/**
 * Quotation Admin Page — LOOP Solutions
 * Route: /admin/quotation
 * Wire: /api/admin/quotes, /api/admin/quote-requests
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { FileText, RefreshCw, Plus, Check, Clock, XCircle, X, AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const fmtB = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Nháp", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  pending: { label: "Chờ duyệt", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  approved: { label: "Đã duyệt", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  sent: { label: "Đã gửi", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  viewed: { label: "Đã xem", color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  signed: { label: "Đã ký", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  rejected: { label: "Từ chối", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  cancelled: { label: "Hủy", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  status: string;
  salesLead?: { customerName: string; companyName: string };
  validUntil?: string;
  createdAt: string;
};

type QuoteRequest = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  selectedItems?: unknown[];
  totalAmount?: number;
  lpUsed?: number;
  notes?: string;
  status: string;
  createdAt: string;
  /** "fixed" = standard wizard, "custom" = custom-code/custom-api selected */
  source?: string;
  /** Full pricing breakdown sent by wizard */
  pricingBreakdown?: Record<string, unknown>;
};

const WORKFLOW_ACTIONS: Record<string, { next: string; label: string; action: string }[]> = {
  draft: [{ next: "sent", label: "Gửi khách", action: "send" }],
  sent: [{ next: "viewed", label: "Khách đã xem", action: "viewed" }, { next: "cancelled", label: "Hủy bỏ", action: "cancel" }],
  viewed: [{ next: "approved", label: "Duyệt báo giá", action: "approve" }, { next: "cancelled", label: "Hủy bỏ", action: "cancel" }],
  approved: [{ next: "signed", label: "Ký hợp đồng", action: "sign" }],
  signed: [],
  cancelled: [],
};

const STATUS_STEPS = ["draft", "sent", "viewed", "approved", "signed"];

function QuoteCreateModal({
  onClose, onSuccess,
  salesLeadId,
  quoteRequest,
}: {
  onClose: () => void; onSuccess: () => void;
  salesLeadId?: string;
  /** Pre-fill from a QuoteRequest row so admin doesn't have to re-enter customer data */
  quoteRequest?: QuoteRequest | null;
}) {
  const { t } = useAdminTranslations();

  // Derive title from quoteRequest if available
  const derivedTitle = quoteRequest
    ? `Báo giá cho ${quoteRequest.customerName}${quoteRequest.companyName ? ` — ${quoteRequest.companyName}` : ""}`
    : "";

  const [form, setForm] = useState({
    title: derivedTitle || "",
    customerName: quoteRequest?.customerName ?? "",
    customerEmail: quoteRequest?.customerEmail ?? "",
    companyName: quoteRequest?.companyName ?? "",
    phone: quoteRequest?.customerPhone ?? "",
    totalAmount: quoteRequest?.totalAmount ? String(quoteRequest.totalAmount) : "",
    validUntil: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("quotation.errTitleRequired"));
    // salesLeadId required when opening modal from scratch (no quoteRequest);
    // when opening from a QuoteRequest, the API auto-creates the SalesLead.
    if (!salesLeadId && !quoteRequest) {
      return setError("Vui lòng chọn khách hàng trước khi tạo báo giá");
    }
    setSaving(true); setError("");
    try {
      // Auto-generate quoteNumber client-side (format: QT-YYYYMM-XXXX)
      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const seq = Math.random().toString(36).substring(2, 6).toUpperCase();
      const quoteNumber = `QT-${ym}-${seq}`;
      await adminApi.post("/api/admin/quotes", {
        // Link to SalesLead if pre-selected; otherwise API auto-creates one from QuoteRequest
        salesLeadId: salesLeadId || undefined,
        // Pass quoteRequestId so the API wires Quote → QuoteRequest and auto-creates SalesLead
        quoteRequestId: quoteRequest?.id,
        quoteNumber,
        title: form.title.trim(),
        customerName: form.customerName.trim() || undefined,
        customerEmail: form.customerEmail.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : 0,
        validUntil: form.validUntil || undefined,
        status: "draft",
      });
      onSuccess(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t("quotation.errCreateFailed")); }
    finally { setSaving(false); }
  };
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 460 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>{t("quotation.formTitle")}</h3>
              {quoteRequest && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "rgba(59,130,246,0.15)", color: DS.blue, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600, letterSpacing: "0.05em" }}>
                    Từ yêu cầu báo giá
                  </span>
                  <span style={{ color: DS.text4, fontSize: 11 }}>{quoteRequest.customerEmail}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formQuoteTitle")}</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Báo giá website công ty ABC" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formCustomerName")}</label>
                <input style={inp} value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Nguyễn Văn A" /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formEmail")}</label>
                <input style={inp} value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="khach@company.vn" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formCompany")}</label>
                <input style={inp} value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Công ty ABC" /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formPhone")}</label>
                <input style={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901..." /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formValue")}</label>
                <input style={inp} type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="15000000" /></div>
              <div><label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formDeadline")}</label>
                <input style={inp} type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} /></div>
            </div>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}><AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>{t("quotation.formBtnCancel")}</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>{saving ? t("quotation.formBtnCreating") : t("quotation.formBtnCreate")}</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function QuotationPage() {
  const { t } = useAdminTranslations();
  const [tab, setTab] = useState<"quotes" | "requests">("quotes");
  const [showCreate, setShowCreate] = useState(false);
  /** Pre-filled data when opening modal from a QuoteRequest row */
  const [quoteRequestForModal, setQuoteRequestForModal] = useState<QuoteRequest | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [transitionQuote, setTransitionQuote] = useState<Quote | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const qc = useQueryClient();

  const { data: quotesData, isLoading: quotesLoading, isFetching: quotesFetching } = useQuery({
    queryKey: ["admin", "quotation", "quotes"],
    queryFn: () => adminApi.get<{ data: Quote[]; total: number; page: number; totalPages: number }>("/api/admin/quotes", { params: { limit: 50 } }),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["admin", "quotation", "requests"],
    queryFn: () => adminApi.get<{ data: QuoteRequest[] }>("/api/admin/quote-requests", { params: { limit: 50 } }),
  });

  const quotes = quotesData?.data ?? [];
  const requests = requestsData?.data ?? [];

  const totalQuoteValue = quotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0);
  const approvedQuotes = quotes.filter(q => q.status === "approved" || q.status === "signed");
  const approvedValue = approvedQuotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0);
  const pendingQuotes = quotes.filter(q => q.status === "pending" || q.status === "sent");
  const pendingValue = pendingQuotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0);

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status, note, action }: { id: string; status: string; note?: string; action: string }) => {
      if (action === "approve") {
        return await adminApi.post(`/api/admin/quotes/${id}/approve`, { action: "approve", note });
      }
      if (action === "sign") {
        return await adminApi.post(`/api/admin/quotes/${id}/sign`, { note });
      }
      if (action === "send") {
        return await adminApi.post(`/api/admin/quotes/${id}/approve`, { action: "send", note });
      }
      // Fallback: generic patch for statuses like "viewed", "cancelled"
      return await adminApi.patch(`/api/admin/quotes/${id}`, { status, note });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] });
      setTransitionQuote(null);
      setToast({ message: "Cập nhật giai đoạn thành công", type: "success" });
    },
    onError: (err: unknown) => {
      setToast({ message: err instanceof Error ? err.message : "Lỗi khi chuyển giai đoạn", type: "error" });
    }
  });

  return (<>
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            {t("quotation.title")}
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {quotes.length} {t("quotation.tabQuotes")} · {requests.length} {t("quotation.tabRequests")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] });
              qc.invalidateQueries({ queryKey: ["admin", "quotation", "requests"] });
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={quotesFetching ? "animate-spin" : ""} /> {t("quotation.refreshBtn")}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.blue, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}
          >
            <Plus size={13} /> {t("quotation.createBtn")}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiTotal")}</span>
            <FileText size={14} style={{ color: DS.blue }} />
          </div>
          <div style={{ color: DS.text, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(totalQuoteValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtVND(totalQuoteValue)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiSigned")}</span>
            <Check size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(approvedValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{approvedQuotes.length} {t("quotation.tabQuotes")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiPending")}</span>
            <Clock size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(pendingValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{pendingQuotes.length} {t("quotation.tabQuotes")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiNewRequests")}</span>
            <XCircle size={14} style={{ color: DS.purple }} />
          </div>
          <div style={{ color: DS.purple, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{requests.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{t("quotation.kpiFrom")}</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {([["quotes", "quotes"], ["requests", "requests"]] as const).map(([tabKey, labelKey]) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey as "quotes" | "requests")}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === tabKey ? DS.blue : "transparent"}`,
              color: tab === tabKey ? DS.blue : DS.text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              fontWeight: tab === tabKey ? 600 : 400,
            }}
          >
            {t(`quotation.tab${labelKey.charAt(0).toUpperCase() + labelKey.slice(1) as "Quotes" | "Requests"}`)}
          </button>
        ))}
      </div>

      {/* Quotes table */}
      {tab === "quotes" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {quotesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : quotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("quotation.emptyStateQuotes")}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {[t("quotation.colId"), t("quotation.colTitle"), t("quotation.colCustomer"), t("quotation.colValue"), t("quotation.colDeadline"), t("quotation.colStatus")].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q, idx) => {
                    const cfg = STATUS_CFG[q.status] ?? { label: q.status, color: DS.text4, bg: "transparent" };
                    return (
                      <tr key={q.id || `quote-${idx}`} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{q.quoteNumber}</td>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13 }}>{q.title}</td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>
                          <div>{q.salesLead?.customerName ?? "—"}</div>
                          {q.salesLead?.companyName && <div style={{ color: DS.text5, fontSize: 11 }}>{q.salesLead.companyName}</div>}
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(q.totalAmount)}</td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(q.validUntil)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                              {t(`quotation.status${q.status.charAt(0).toUpperCase() + q.status.slice(1)}` as `quotation.status${string}`)}
                            </span>
                            <button
                              onClick={() => setTransitionQuote(q)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 24, height: 24, borderRadius: 6, cursor: "pointer",
                                background: "rgba(59,130,246,0.1)", border: `1px solid ${DS.blue}30`,
                                color: DS.blue, transition: "all 0.2s"
                              }}
                              onMouseOver={e => e.currentTarget.style.background = "rgba(59,130,246,0.2)"}
                              onMouseOut={e => e.currentTarget.style.background = "rgba(59,130,246,0.1)"}
                              title="Chuyển trạng thái"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quote requests */}
      {tab === "requests" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {requestsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("quotation.emptyStateRequests")}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {[t("quotation.colCustomer"), t("quotation.colEmail"), t("quotation.colCompany"), "Nguồn", t("quotation.colDate"), t("quotation.colStatus"), t("quotation.colActions")].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, idx) => (
                    <React.Fragment key={r.id || `req-${idx}`}>
                      <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 600 }}>{r.customerName}</td>
                        <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>{r.customerEmail}</td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{r.companyName ?? "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {r.source === "custom" ? (
                            <span style={{ background: "rgba(236,72,153,0.12)", color: DS.pink, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>Custom</span>
                          ) : (
                            <span style={{ background: "rgba(59,130,246,0.1)", color: DS.blue, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>Fixed</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(r.createdAt)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: STATUS_CFG[r.status]?.bg ?? "transparent", color: STATUS_CFG[r.status]?.color ?? DS.text4, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                            {t(`quotation.status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}` as `quotation.status${string}`)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {r.pricingBreakdown && (
                            <button
                              onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(107,61,245,0.1)", border: "1px solid rgba(107,61,245,0.3)", borderRadius: 8, color: DS.cosmicPurple, cursor: "pointer", fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}
                            >
                              {expandedRow === r.id ? "Ẩn" : "Xem giá"}
                            </button>
                          )}
                          {r.status !== "quoted" && (
                            <button
                              onClick={() => {
                                setQuoteRequestForModal(r);
                                setShowCreate(true);
                              }}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}
                            >
                              <Plus size={11} />
                              Tạo báo giá
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedRow === r.id && r.pricingBreakdown && (
                        <tr key={`${r.id}-breakdown`} style={{ background: "rgba(0,0,0,0.25)" }}>
                          <td colSpan={7} style={{ padding: "12px 16px" }}>
                            <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "12px 16px" }}>
                              <div style={{ color: DS.text4, marginBottom: 8, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: DS.mono }}>Pricing Breakdown</div>
                              <pre style={{ margin: 0, fontFamily: DS.mono, fontSize: 11, color: DS.text2, whiteSpace: "pre-wrap" as const, wordBreak: "break-all" as const }}>
                                {JSON.stringify(r.pricingBreakdown, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <QuoteCreateModal
          onClose={() => { setShowCreate(false); setQuoteRequestForModal(null); }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] });
            qc.invalidateQueries({ queryKey: ["admin", "quotation", "requests"] });
            setQuoteRequestForModal(null);
          }}
          quoteRequest={quoteRequestForModal}
        />
      )}
      {transitionQuote && (
        <TransitionModal
          quote={transitionQuote}
          onClose={() => setTransitionQuote(null)}
          onSuccess={(status, note, action) => transitionMutation.mutate({ id: transitionQuote.id, status, note, action })}
          loading={transitionMutation.isPending}
        />
      )}
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

function TransitionModal({ quote, onClose, onSuccess, loading }: { quote: Quote; onClose: () => void; onSuccess: (status: string, note: string, action: string) => void; loading: boolean }) {
  const nextActions = WORKFLOW_ACTIONS[quote.status] ?? [];
  const [selectedAction, setSelectedAction] = useState(nextActions[0] || null);
  const [note, setNote] = useState("");

  const inputStyle = {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${DS.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    color: DS.text,
    fontSize: 13,
    outline: "none",
    fontFamily: DS.body
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", border: `1px solid ${DS.blue}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={20} style={{ color: DS.blue }} />
              </div>
              <div>
                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>Cập nhật giai đoạn</h3>
                <p style={{ color: DS.text4, fontSize: 11, margin: 0 }}>{quote.quoteNumber} · {quote.title}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={20} /></button>
          </div>

          {/* Timeline Visualization */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, padding: "0 10px", position: "relative" }}>
             <div style={{ position: "absolute", top: 12, left: 30, right: 30, height: 2, background: DS.border, zIndex: 0 }} />
             {STATUS_STEPS.map((s, i) => {
                const isActive = s === quote.status;
                const isPast = STATUS_STEPS.indexOf(quote.status) > i;
                const cfg = STATUS_CFG[s] || { color: DS.text4 };
                return (
                    <div key={s} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ 
                            width: 24, height: 24, borderRadius: "50%", 
                            background: isActive ? DS.blue : isPast ? DS.green : DS.bg,
                            border: `2px solid ${isActive ? DS.blue : isPast ? DS.green : DS.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.3s"
                        }}>
                            {isPast && <Check size={12} style={{ color: "#fff" }} />}
                            {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                        </div>
                        <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? DS.text : DS.text5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {STATUS_CFG[s]?.label ?? s}
                        </span>
                    </div>
                );
             })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>BƯỚC TIẾP THEO KHẢ DỤNG</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {nextActions.length > 0 ? (
                  nextActions.map(act => (
                    <button
                      key={act.next}
                      onClick={() => setSelectedAction(act)}
                      style={{
                        padding: "10px 16px", borderRadius: 12, cursor: "pointer",
                        background: selectedAction?.next === act.next ? "rgba(59,130,246,0.15)" : DS.bg,
                        border: `1px solid ${selectedAction?.next === act.next ? DS.blue : DS.border}`,
                        color: selectedAction?.next === act.next ? DS.blue : DS.text,
                        fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                        display: "flex", alignItems: "center", gap: 8
                      }}>
                      {selectedAction?.next === act.next ? <CheckCircle size={14} /> : <div style={{ width: 14 }} />}
                      {act.label}
                    </button>
                  ))
                ) : (
                  <div style={{ width: "100%", padding: 16, textAlign: "center", color: DS.text4, fontSize: 13, background: DS.bg, borderRadius: 12, border: `1px dashed ${DS.border}` }}>
                    Báo giá này đã hoàn tất quy trình
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>GHI CHÚ (NHẬT KÝ)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập nội dung trao đổi hoặc lý do chuyển giai đoạn..."
                style={{ ...inputStyle, minHeight: 100, resize: "none" }}
              />
            </div>

            <button
              onClick={() => selectedAction && onSuccess(selectedAction.next, note, selectedAction.action)}
              disabled={!selectedAction || loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: !selectedAction ? DS.text4 : DS.blue,
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: !selectedAction ? "not-allowed" : "pointer",
                marginTop: 8, transition: "all 0.2s",
                boxShadow: selectedAction ? "0 8px 16px rgba(59,130,246,0.25)" : "none"
              }}>
              {loading ? "Đang xử lý..." : "Xác nhận cập nhật"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
