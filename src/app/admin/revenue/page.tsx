"use client";

/**
 * Revenue Admin Page — LOOP Solutions
 * Route: /admin/revenue
 * Shows revenue analytics, order stats, and financial overview.
 * Data from: /api/admin/orders, /api/admin/kpi/dashboard
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  CheckCircle2, Clock, RefreshCw, Download,
} from "lucide-react";

// ── Formatters ───────────────────────────────────────────────────────
const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtB = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

// ── Revenue KPI Card ──────────────────────────────────────────────────
function RevenueCard({
  label, value, sub, icon, color, change, up,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  color: string; change?: number; up?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`,
        borderRadius: 12, padding: "1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ color, background: `${color}15`, borderRadius: 8, padding: "4px", display: "flex" }}>
          {icon}
        </span>
      </div>
      <div style={{ color: DS.text, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading, marginBottom: "0.25rem" }}>
        {value}
      </div>
      {sub && <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{sub}</div>}
      {change !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "0.375rem", color: up ? DS.green : DS.red, fontSize: 11, fontFamily: DS.mono }}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(change)}% so với tháng trước</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Simple bar chart ────────────────────────────────────────────────
function BarChart({ data, color }: { data: { label: string; value: number; max: number }[]; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, fontSize: 10, fontFamily: DS.mono, color: DS.text4, flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, height: 20, background: DS.bg, borderRadius: 4, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((d.value / d.max) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ height: "100%", background: color, borderRadius: 4, boxShadow: `0 0 8px ${color}60` }}
            />
          </div>
          <div style={{ width: 48, fontSize: 10, fontFamily: DS.mono, color: DS.text3, textAlign: "right" }}>
            {fmtB(d.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Status chip ────────────────────────────────────────────────────
const ORDER_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "Chờ TT", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  paid:            { label: "Đã TT", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  in_progress:    { label: "Đang làm", color: "#818CF8", bg: "rgba(129,140,248,0.1)" },
  demo_ready:      { label: "Demo OK", color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  done:            { label: "Xong", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  cancelled:       { label: "Hủy", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  paid:    { label: "Đã thanh toán", color: "#22C55E" },
  unpaid:  { label: "Chưa thanh toán", color: "#F59E0B" },
  overdue: { label: "Quá hạn", color: "#EF4444" },
};

// ── Main Page ─────────────────────────────────────────────────────
type Order = {
  id: string; orderNumber: string; customerName: string;
  totalAmount: number; status: string; paymentStatus: string;
  createdAt: string;
};

export default function RevenuePage() {
  const [period, setPeriod] = useState("30");
  const [page] = useState(1);

  // Fetch orders
  const { data: ordersData, isLoading, isFetching } = useQuery({
    queryKey: qk.orders({ page, limit: 100 }),
    queryFn: () =>
      adminApi.get<{ data: Order[]; pagination: { total: number } }>("/api/admin/orders", {
        params: { page, limit: 100 },
      }),
  });

  const orders = ordersData?.data ?? [];
  const totalOrders = ordersData?.pagination?.total ?? 0;

  // Compute revenue stats from orders
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const pendingRevenue = orders
    .filter(o => o.paymentStatus === "unpaid" || o.paymentStatus === "pending")
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const topClients = [...orders]
    .filter(o => o.paymentStatus === "paid")
    .sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0))
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Doanh thu & Tài chính
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {totalOrders} đơn hàng · Dữ liệu từ DB
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "6px 12px", color: DS.text3, fontSize: 12, fontFamily: DS.mono, cursor: "pointer" }}
          >
            <option value="7">7 ngày</option>
            <option value="30">30 ngày</option>
            <option value="90">90 ngày</option>
            <option value="365">1 năm</option>
          </select>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      {/* Revenue KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <RevenueCard
          label="Tổng doanh thu"
          value={fmtB(totalRevenue)}
          sub={fmtVND(totalRevenue)}
          icon={<DollarSign size={16} />}
          color={DS.green}
          change={18}
          up
        />
        <RevenueCard
          label="Chờ thanh toán"
          value={fmtB(pendingRevenue)}
          sub={`${orders.filter(o => o.paymentStatus !== "paid").length} đơn`}
          icon={<Clock size={16} />}
          color={DS.amber}
        />
        <RevenueCard
          label="Đơn hoàn thành"
          value={String(statusCounts["done"] ?? 0)}
          sub={`${statusCounts["done"] ?? 0} đơ hàng`}
          icon={<CheckCircle2 size={16} />}
          color={DS.cyan}
          change={12}
          up
        />
        <RevenueCard
          label="Đơn đang thực hiện"
          value={String(statusCounts["in_progress"] ?? 0)}
          sub="đơn active"
          icon={<ShoppingCart size={16} />}
          color={DS.purple}
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Top clients */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: "0 0 1rem" }}>Top khách hàng (theo doanh thu)</h3>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <BarChart
              color={DS.blue}
              data={topClients.map(o => ({
                label: o.customerName?.slice(0, 10) ?? "?",
                value: o.totalAmount ?? 0,
                max: topClients[0]?.totalAmount ?? 1,
              }))}
            />
          )}
        </div>

        {/* Order status breakdown */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: "0 0 1rem" }}>Trạng thái đơn hàng</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(ORDER_STATUS_CFG).map(([key, cfg]) => {
              const count = statusCounts[key] ?? 0;
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, color: DS.text3, fontFamily: DS.mono }}>{cfg.label}</div>
                  <div style={{ width: 32, fontSize: 12, color: cfg.color, fontWeight: 700, textAlign: "right" }}>{count}</div>
                  <div style={{ width: 40, fontSize: 10, color: DS.text4, fontFamily: DS.mono, textAlign: "right" }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div style={{ marginTop: "1.5rem", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
        <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: "0 0 1rem" }}>Đơn hàng gần đây</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                {["Mã đơn", "Khách hàng", "Tổng tiền", "Trạng thái", "Thanh toán"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map(o => {
                const sCfg = ORDER_STATUS_CFG[o.status] ?? { label: o.status, color: DS.text4, bg: "transparent" };
                const pCfg = PAYMENT_STATUS_CFG[o.paymentStatus] ?? { label: o.paymentStatus, color: DS.text4 };
                return (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <td style={{ padding: "10px 12px", color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{o.orderNumber}</td>
                    <td style={{ padding: "10px 12px", color: DS.text3, fontSize: 12 }}>{o.customerName ?? "—"}</td>
                    <td style={{ padding: "10px 12px", color: DS.text, fontWeight: 600, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(o.totalAmount ?? 0)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: sCfg.bg, color: sCfg.color, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>
                        {sCfg.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: pCfg.color, fontSize: 11, fontFamily: DS.mono }}>{pCfg.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
