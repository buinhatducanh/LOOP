"use client";

/**
 * Sales Commission Page — LOOP Solutions
 * Route: /admin/commission
 * Wire: GET /api/staff/commission
 *
 * Shows staff their own sales commission:
 * - Summary: pending LP, completed LP, total LP
 * - Pending: orders/enrollments where salesRepId is set but commission not yet credited
 * - Completed: commission events (credited LP from orders/enrollments)
 *
 * Commission rules:
 * - Direct: 10% of main service price (basePrice) → LP
 * - Addon: 5% of addon prices → LP
 * - Formula: LP = Math.round(amount × pct / 100_000)
 * - Only credited when order/enrollment is completed
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
 TrendingUp, Clock, CheckCircle2, ShoppingCart, BookOpen,
 RefreshCw, AlertCircle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface PendingDetail {
 type: "order" | "enrollment";
 referenceId: string;
 orderNumber?: string;
 customerName?: string;
 courseName?: string;
 status?: string;
 createdAt?: string;
 enrolledAt?: string;
 pendingLp: number;
}

interface CompletedEvent {
 id: string;
 salesRepId: string;
 referenceType: string;
 referenceId: string;
 directLp: number;
 addonLp: number;
 totalLp: number;
 paidAt: string;
 order?: { id: string; orderNumber: string; customerName: string; status: string } | null;
}

interface CommissionSummary {
 pendingLp: number;
 completedLp: number;
 totalLp: number;
 pendingCount: number;
 completedCount: number;
}

interface CommissionResponse {
 summary: CommissionSummary;
 pendingDetails: PendingDetail[];
 completedEvents: CompletedEvent[];
}

// ─── Formatters ─────────────────────────────────────────────────────────────────

const fmtLP = (n: number) =>
 n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M LP` :
 n >= 1_000 ? `${(n / 1_000).toFixed(1)}K LP` :
 `${n} LP`;

const fmtDate = (d: string | undefined) => {
 if (!d) return "—";
 return new Date(d).toLocaleDateString("vi-VN", {
 day: "2-digit",
 month: "2-digit",
 year: "numeric",
 });
};

// ─── Summary Cards ─────────────────────────────────────────────────────────────────

function SummaryCard({
 label,
 value,
 subtext,
 icon: Icon,
 color,
 bg,
}: {
 label: string;
 value: string;
 subtext?: string;
 icon: React.ElementType;
 color: string;
 bg: string;
}) {
 return (
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 style={{
 background: DS.bgCard,
 border: `1px solid ${DS.border}`,
 borderRadius: 12,
 padding: "20px 24px",
 display: "flex",
 flexDirection: "column",
 gap: 8,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
 <span style={{ color: DS.text3, fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 {label}
 </span>
 <div style={{
 width: 36,
 height: 36,
 borderRadius: 8,
 background: bg,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 }}>
 <Icon size={18} style={{ color }} />
 </div>
 </div>
 <div style={{ color: color, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
  {value}
 </div>
 {subtext && (
 <div style={{ color: DS.text4, fontSize: 12 }}>
 {subtext}
 </div>
 )}
 </motion.div>
 );
}

// ─── Order Status Badge ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
 pending: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
 paid_partial: { bg: "rgba(59,130,246,0.15)", color: "#3B82F6" },
 contracted: { bg: "rgba(59,130,246,0.15)", color: "#3B82F6" },
 designing: { bg: "rgba(168,85,247,0.15)", color: "#A855F7" },
 developing: { bg: "rgba(59,130,246,0.15)", color: "#3B82F6" },
 reviewing: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
 delivered: { bg: "rgba(34,197,94,0.15)", color: "#22C55E" },
 completed: { bg: "rgba(34,197,94,0.15)", color: "#22C55E" },
 active: { bg: "rgba(34,197,94,0.15)", color: "#22C55E" },
 cancelled: { bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
};

function StatusBadge({ status }: { status: string }) {
 const s = STATUS_COLORS[status] ?? { bg: "rgba(148,163,184,0.15)", color: "#94A3B8" };
 return (
 <span style={{
 padding: "2px 10px",
 borderRadius: 20,
 fontSize: 11,
 fontWeight: 600,
 background: s.bg,
 color: s.color,
 textTransform: "capitalize",
 }}>
 {status.replace(/_/g, " ")}
 </span>
 );
}

// ─── Pending Table ─────────────────────────────────────────────────────────────────

function PendingTable({ items }: { items: PendingDetail[] }) {
 if (items.length === 0) {
 return (
 <div style={{
 padding: "60px 24px",
 textAlign: "center",
 color: DS.text4,
 fontSize: 14,
 }}>
 <CheckCircle2 size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
 <p>Không có hoa hồng đang chờ</p>
  <p style={{ fontSize: 12, marginTop: 4 }}>
 Hoa hồng sẽ hiển thị khi đơn hàng/khóa học của bạn hoàn thành
 </p>
 </div>
 );
 }

 return (
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Loại
 </th>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Mã / Tên
 </th>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Trạng thái
 </th>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Ngày tạo
 </th>
 <th style={{ padding: "12px 16px", textAlign: "right", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 LP Chờ
 </th>
 </tr>
 </thead>
 <tbody>
 {items.map((item, i) => (
 <motion.tr
 key={`${item.type}-${item.referenceId}`}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.04 }}
 style={{ borderBottom: `1px solid ${DS.border}22` }}
 >
 <td style={{ padding: "14px 16px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <div style={{
 width: 28,
 height: 28,
 borderRadius: 6,
 background: item.type === "order"
 ? "rgba(59,130,246,0.15)"
 : "rgba(168,85,247,0.15)",
  display: "flex",
 alignItems: "center",
 justifyContent: "center",
 }}>
 {item.type === "order"
 ? <ShoppingCart size={14} style={{ color: "#3B82F6" }} />
 : <BookOpen size={14} style={{ color: "#A855F7" }} />
 }
 </div>
 <span style={{ fontSize: 12, color: DS.text3, textTransform: "capitalize" }}>
 {item.type === "order" ? "Web" : "Khóa học"}
 </span>
 </div>
 </td>
 <td style={{ padding: "14px 16px" }}>
 <div>
 {item.type === "order"
 ? <>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>
 {item.orderNumber ?? item.referenceId}
 </div>
 <div style={{ color: DS.text4, fontSize: 12 }}>
 {item.customerName ?? "—"}
 </div>
 </>
 : <>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>
 {item.courseName ?? "Khóa học"}
 </div>
 <div style={{ color: DS.text4, fontSize: 12 }}>
 {item.enrolledAt ? `Đăng ký: ${fmtDate(item.enrolledAt)}` : "—"}
 </div>
 </>
 }
  </div>
 </td>
 <td style={{ padding: "14px 16px" }}>
 {item.status ? <StatusBadge status={item.status} /> : "—"}
 </td>
 <td style={{ padding: "14px 16px", color: DS.text4, fontSize: 13 }}>
 {item.type === "order" ? fmtDate(item.createdAt) : fmtDate(item.enrolledAt)}
 </td>
 <td style={{ padding: "14px 16px", textAlign: "right" }}>
 <span style={{
 color: DS.text3,
 fontSize: 14,
 fontWeight: 700,
 fontFamily: "var(--font-dm-sans)",
 }}>
 {fmtLP(item.pendingLp)}
 </span>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}

// ─── Completed Table ─────────────────────────────────────────────────────────────────

function CompletedTable({ events }: { events: CompletedEvent[] }) {
 if (events.length === 0) {
 return (
 <div style={{
 padding: "60px 24px",
 textAlign: "center",
 color: DS.text4,
 fontSize: 14,
 }}>
 <TrendingUp size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
 <p>Chưa có hoa hồng nào được nhận</p>
 <p style={{ fontSize: 12, marginTop: 4 }}>
 Hoa hồng sẽ được ghi nhận khi đơn hàng hoàn thành
 </p>
 </div>
 );
 }

 return (
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Loại
 </th>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Mã đơn
 </th>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Khách hàng
 </th>
 <th style={{ padding: "12px 16px", textAlign: "right", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Direct (10%)
 </th>
 <th style={{ padding: "12px 16px", textAlign: "right", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Addon (5%)
 </th>
 <th style={{ padding: "12px 16px", textAlign: "right", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Tổng LP
 </th>
 <th style={{ padding: "12px 16px", textAlign: "right", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
 Ngày nhận
 </th>
 </tr>
 </thead>
 <tbody>
 {events.map((e, i) => (
 <motion.tr
 key={e.id}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.04 }}
 style={{ borderBottom: `1px solid ${DS.border}22` }}
 >
 <td style={{ padding: "14px 16px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <div style={{
 width: 28,
 height: 28,
 borderRadius: 6,
 background: "rgba(34,197,94,0.15)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 }}>
 {e.referenceType === "order"
 ? <ShoppingCart size={14} style={{ color: "#22C55E" }} />
 : <BookOpen size={14} style={{ color: "#22C55E" }} />
 }
 </div>
 <span style={{ fontSize: 12, color: DS.text3, textTransform: "capitalize" }}>
 {e.referenceType === "order" ? "Web" : "Khóa học"}
 </span>
 </div>
 </td>
 <td style={{ padding: "14px 16px", color: DS.text2, fontSize: 13, fontWeight: 600 }}>
 {e.order?.orderNumber ?? e.referenceId.slice(0, 12)}
 </td>
 <td style={{ padding: "14px 16px", color: DS.text3, fontSize: 13 }}>
 {e.order?.customerName ?? "—"}
 </td>
 <td style={{ padding: "14px 16px", textAlign: "right", color: DS.text3, fontSize: 13 }}>
 {fmtLP(e.directLp)}
 </td>
 <td style={{ padding: "14px 16px", textAlign: "right", color: DS.text3, fontSize: 13 }}>
 {e.addonLp > 0 ? fmtLP(e.addonLp) : "—"}
 </td>
 <td style={{ padding: "14px 16px", textAlign: "right" }}>
 <span style={{
 color: "#22C55E",
 fontSize: 14,
 fontWeight: 700,
 fontFamily: "var(--font-dm-sans)",
 }}>
 +{fmtLP(e.totalLp)}
 </span>
 </td>
 <td style={{ padding: "14px 16px", textAlign: "right", color: DS.text4, fontSize: 12 }}>
 {fmtDate(e.paidAt)}
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CommissionPage() {
 const [activeTab, setActiveTab] = useState<"pending" | "completed">("completed");

 const { data, isLoading, isError, error, refetch, isFetching } = useQuery<CommissionResponse>({
 queryKey: ["staff-commission"],
 queryFn: () => adminApi.get("/api/staff/commission"),
 staleTime: 60_000,
 retry: 1,
 });

 const summary = data?.summary;
 const pendingItems = data?.pendingDetails ?? [];
 const completedEvents = data?.completedEvents ?? [];

 return (
 <div style={{ padding: "32px 32px 48px" }}>
 {/* Header */}
 <div style={{ marginBottom: 28 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
 <div style={{
 width: 36,
 height: 36,
 borderRadius: 8,
 background: "rgba(236,72,153,0.15)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 }}>
 <TrendingUp size={18} style={{ color: DS.pink }} />
 </div>
 <h1 style={{ color: DS.text, fontSize: 22, fontWeight: 700, margin: 0 }}>
 Hoa hồng Sales
 </h1>
 </div>
 <p style={{ color: DS.text4, fontSize: 13, marginLeft: 48 }}>
 Hoa hồng được ghi nhận khi đơn hàng/khóa học hoàn thành (10% main + 5% addon)
 </p>
 </div>

 {/* Error state */}
 <AnimatePresence>
 {isError && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 exit={{ opacity: 0, height: 0 }}
 style={{
 background: "rgba(239,68,68,0.1)",
 border: "1px solid rgba(239,68,68,0.3)",
 borderRadius: 10,
 padding: "14px 18px",
 marginBottom: 24,
 display: "flex",
 alignItems: "center",
 gap: 10,
 color: "#EF4444",
 fontSize: 13,
 }}
 >
 <AlertCircle size={16} />
 <span>{error instanceof Error ? error.message : "Tải dữ liệu thất bại"}</span>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Loading skeleton */}
 {isLoading ? (
 <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
 {[0, 1, 2].map((i) => (
 <div
 key={i}
 style={{
 background: DS.bgCard,
 border: `1px solid ${DS.border}`,
 borderRadius: 12,
 padding: "20px 24px",
 height: 100,
 animation: "pulse 1.5s infinite",
 }}
 />
 ))}
 </div>
 <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 24, height: 300 }} />
 </div>
 ) : (
 <>
 {/* Summary Cards */}
 <div style={{
 display: "grid",
 gridTemplateColumns: "repeat(3, 1fr)",
 gap: 16,
 marginBottom: 28,
 }}>
 <SummaryCard
 label="Đang chờ"
 value={summary ? fmtLP(summary.pendingLp) : "—"}
 subtext={summary ? `${summary.pendingCount} đơn hàng/khóa học chờ` : undefined}
 icon={Clock}
 color="#F59E0B"
 bg="rgba(245,158,11,0.15)"
 />
 <SummaryCard
 label="Đã nhận"
 value={summary ? fmtLP(summary.completedLp) : "—"}
 subtext={summary ? `${summary.completedCount} hoa hồng` : undefined}
 icon={CheckCircle2}
 color="#22C55E"
 bg="rgba(34,197,94,0.15)"
 />
 <SummaryCard
 label="Tổng cộng"
 value={summary ? fmtLP(summary.totalLp) : "—"}
 subtext={summary ? `Tổng hoa hồng tích lũy` : undefined}
 icon={TrendingUp}
 color={DS.pink}
 bg="rgba(236,72,153,0.15)"
 />
 </div>

 {/* Commission Details */}
 <div style={{
 background: DS.bgCard,
 border: `1px solid ${DS.border}`,
 borderRadius: 12,
 overflow: "hidden",
 }}>
 {/* Tabs */}
 <div style={{
 display: "flex",
 borderBottom: `1px solid ${DS.border}`,
 padding: "0 8px",
 }}>
 {([
 ["pending", "Đang chờ", summary?.pendingCount ?? 0],
 ["completed", "Đã nhận", summary?.completedCount ?? 0],
 ] as const).map(([tab, label, count]) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 style={{
 padding: "14px 20px",
 background: "none",
 border: "none",
 cursor: "pointer",
 fontSize: 13,
  fontWeight: 600,
 color: activeTab === tab ? DS.pink : DS.text4,
 borderBottom: activeTab === tab ? `2px solid ${DS.pink}` : "2px solid transparent",
 marginBottom: -1,
 display: "flex",
 alignItems: "center",
 gap: 8,
 transition: "color 0.2s, border-color 0.2s",
 }}
 >
 {label}
 <span style={{
 padding: "1px 7px",
 borderRadius: 10,
 fontSize: 11,
 fontWeight: 700,
 background: activeTab === tab ? "rgba(236,72,153,0.15)" : "rgba(148,163,184,0.12)",
 color: activeTab === tab ? DS.pink : DS.text4,
 }}>
 {count}
 </span>
 </button>
 ))}

 {/* Refresh */}
 <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 8px" }}>
 <button
 onClick={() => refetch()}
 disabled={isFetching}
 title="Làm mới"
 style={{
 background: "none",
 border: "none",
 cursor: isFetching ? "wait" : "pointer",
 color: DS.text4,
 display: "flex",
 alignItems: "center",
 padding: 6,
 borderRadius: 6,
 }}
 >
 <RefreshCw
 size={15}
 style={{
 animation: isFetching ? "spin 1s linear infinite" : "none",
 }}
 />
 </button>
 </div>
 </div>

 {/* Tab Content */}
 <AnimatePresence mode="wait">
 {activeTab === "pending" ? (
 <motion.div
 key="pending"
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.2 }}
 >
 <PendingTable items={pendingItems} />
 </motion.div>
 ) : (
 <motion.div
 key="completed"
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.2 }}
 >
 <CompletedTable events={completedEvents} />
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </>
 )}

 {/* Keyframe animations */}
 <style>{`
 @keyframes pulse {
 0%, 100% { opacity: 1; }
 50% { opacity: 0.5; }
 }
 @keyframes spin {
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
 }
 `}</style>
 </div>
 );
}
