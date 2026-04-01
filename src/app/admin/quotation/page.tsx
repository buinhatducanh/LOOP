"use client";

/**
 * Quotation Admin Page — LOOP Solutions
 * Route: /admin/quotation
 * Wire: /api/admin/quotes, /api/admin/quote-requests
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { FileText, RefreshCw, Plus, Check, Clock, XCircle } from "lucide-react";

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

export default function QuotationPage() {
  const [tab, setTab] = useState<"quotes" | "requests">("quotes");
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Báo giá
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {quotes.length} báo giá · {requests.length} yêu cầu
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => tab === "quotes" ? qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] }) : qc.invalidateQueries({ queryKey: ["admin", "quotation", "requests"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={quotesFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.blue, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
            <Plus size={13} /> Tạo báo giá
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tổng báo giá</span>
            <FileText size={14} style={{ color: DS.blue }} />
          </div>
          <div style={{ color: DS.text, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(totalQuoteValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtVND(totalQuoteValue)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Đã ký</span>
            <Check size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(approvedValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{approvedQuotes.length} báo giá</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Chờ duyệt</span>
            <Clock size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(pendingValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{pendingQuotes.length} báo giá</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Yêu cầu mới</span>
            <XCircle size={14} style={{ color: DS.purple }} />
          </div>
          <div style={{ color: DS.purple, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{requests.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>từ khách hàng</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {([["quotes", "Báo giá"], ["requests", "Yêu cầu"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? DS.blue : "transparent"}`,
              color: tab === t ? DS.blue : DS.text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {label}
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
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có báo giá</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Mã BG", "Tiêu đề", "Khách hàng", "Giá trị", "Hạn", "Trạng thái"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => {
                    const cfg = STATUS_CFG[q.status] ?? { label: q.status, color: DS.text4, bg: "transparent" };
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
                          <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{cfg.label}</span>
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
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có yêu cầu báo giá</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Khách hàng", "Email", "Công ty", "Dịch vụ", "Ngày", "Trạng thái"].map(h => (
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
                          {r.status}
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
    </div>
  );
}
