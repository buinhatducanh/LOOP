"use client";

/**
 * Quotation Admin Page — LOOP Solutions
 * Route: /admin/quotation
 * Wire: /api/admin/quotes, /api/admin/quote-requests
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { FileText, RefreshCw, Plus, Check, Clock, XCircle, X, AlertTriangle } from "lucide-react";

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
  draft:     { label: "Nháp", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  pending:   { label: "Chờ duyệt", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  approved:  { label: "Đã duyệt", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  sent:      { label: "Đã gửi", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  signed:    { label: "Đã ký", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  rejected:  { label: "Từ chối", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
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
  companyName?: string;
  phone?: string;
  service?: string;
  message?: string;
  status: string;
  createdAt: string;
};

const WORKFLOW_ACTIONS: Record<string, Record<string, string>> = {
  draft:     { next: "pending", label: "Gửi duyệt" },
  pending:   { next: "approved", label: "Duyệt" },
  approved:  { next: "sent", label: "Gửi khách" },
  sent:      { next: "signed", label: "Đã ký" },
};

function QuoteCreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useAdminTranslations();
  const [form, setForm] = useState({
    title: "", customerName: "", customerEmail: "", companyName: "",
    phone: "", totalAmount: "", validUntil: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("quotation.errTitleRequired"));
    setSaving(true); setError("");
    try {
      await adminApi.post("/api/admin/quotes", {
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{t("quotation.formTitle")}</h3>
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

  const workflowMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
      await adminApi.put(`/api/admin/quotes/${id}`, { status: nextStatus });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] });
    },
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  return (
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
                  {quotes.map(q => {
                    const cfg = STATUS_CFG[q.status] ?? { label: q.status, color: DS.text4, bg: "transparent" };
                    const nextAction = WORKFLOW_ACTIONS[q.status];
                    return (
                      <tr key={q.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{q.quoteNumber}</td>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13 }}>{q.title}</td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>
                          <div>{q.salesLead?.customerName ?? "—"}</div>
                          {q.salesLead?.companyName && <div style={{ color: DS.text5, fontSize: 11 }}>{q.salesLead.companyName}</div>}
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(q.totalAmount)}</td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(q.validUntil)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{t(`quotation.status${q.status.charAt(0).toUpperCase() + q.status.slice(1)}` as `quotation.status${string}`)}</span>
                          {nextAction && (
                            <button
                              onClick={() => workflowMutation.mutate({ id: q.id, nextStatus: nextAction.next })}
                              disabled={workflowMutation.isPending}
                              style={{ marginLeft: 6, padding: "2px 8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, color: DS.blue, cursor: "pointer", fontSize: 10, fontFamily: DS.mono }}
                            >
                              {t(`quotation.action${nextAction.label.charAt(0).toUpperCase() + nextAction.label.slice(1).replace(/\s/g, "")}` as `quotation.action${string}`)}
                            </button>
                          )}
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
                    {[t("quotation.colCustomer"), t("quotation.colEmail"), t("quotation.colCompany"), t("quotation.colService"), t("quotation.colDate"), t("quotation.colStatus")].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                      <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 600 }}>{r.customerName}</td>
                      <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>{r.customerEmail}</td>
                      <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{r.companyName ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{r.service ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(r.createdAt)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: STATUS_CFG[r.status]?.bg ?? "transparent", color: STATUS_CFG[r.status]?.color ?? DS.text4, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                          {t(`quotation.status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}` as `quotation.status${string}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <QuoteCreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] }); }}
        />
      )}
    </div>
  );
}
