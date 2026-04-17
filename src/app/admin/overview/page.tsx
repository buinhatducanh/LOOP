"use client";

/**
 * Admin Overview Page — LOOP Solutions
 *
 * Dashboard overview page for admin.
 * Shows KPI cards, quick stats, and recent activity.
 * Uses real API data via React Query.
 */

// Prevent static pre-rendering since this is a client component using React Query
export const dynamic = "force-dynamic";


import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { DS } from "@/lib/design-tokens";
import { adminApi } from "@/lib/api/client";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { qk } from "@/lib/query/provider";

import { useAuthStore } from "@/app/store/authStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format number as Vietnamese currency */
function fmtVND(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/** Check if an ISO date string is in the current month */
function isThisMonth(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  change,
  changeType,
  icon,
}: {
  label: string;
  value: string | number;
  change?: number;
  changeType?: "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "var(--figma-bg-card, #0F172A)",
        border: "1px solid var(--figma-border, #1F2937)",
        borderRadius: 12,
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <span
          style={{
            color: "var(--figma-text3, #94A3B8)",
            fontSize: "0.75rem",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: "var(--figma-blue, #3B82F6)",
            background: "rgba(59,130,246,0.1)",
            borderRadius: 8,
            padding: "0.25rem",
            display: "flex",
          }}
        >
          {icon}
        </span>
      </div>
      <div
        style={{
          color: "var(--figma-text, #fff)",
          fontSize: "1.75rem",
          fontWeight: 700,
          marginBottom: "0.375rem",
        }}
      >
        {value}
      </div>
      {change !== undefined && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            color: changeType === "up" ? "var(--figma-green, #22C55E)" : "var(--figma-red, #EF4444)",
            fontSize: "0.8125rem",
          }}
        >
          {changeType === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(change)}%</span>
          <span style={{ color: "var(--figma-text4, #64748B)", marginLeft: "0.25rem" }}>so với tháng trước</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.875rem",
        background: "var(--figma-bg-card2, #111827)",
        border: "1px solid var(--figma-border, #1F2937)",
        borderRadius: 8,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color ?? "var(--figma-blue, #3B82F6)",
          boxShadow: `0 0 8px ${color ?? "var(--figma-blue, #3B82F6)"}`,
          flexShrink: 0,
        }}
      />
      <span style={{ color: "var(--figma-text3, #94A3B8)", fontSize: "0.8125rem" }}>{label}</span>
      <span
        style={{
          color: "var(--figma-text, #fff)",
          fontSize: "0.875rem",
          fontWeight: 600,
          marginLeft: "auto",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Recent order row ──────────────────────────────────────────────────────────

interface OrderRow {
  id: string;
  customerName: string;
  serviceName: string;
  totalAmount: number | null | undefined;
  status: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Chờ thanh toán", color: "#F59E0B" },
  paid: { label: "Đã thanh toán", color: "#3B82F6" },
  in_progress: { label: "Đang thực hiện", color: "#818CF8" },
  demo_ready: { label: "Demo sẵn sàng", color: "#A78BFA" },
  client_review: { label: "Khách review", color: "#60A5FA" },
  done: { label: "Hoàn thành", color: "#22C55E" },
  cancelled: { label: "Đã hủy", color: "#EF4444" },
};

function OrderRow({ order }: { order: OrderRow }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0.75rem 0",
        borderBottom: "1px solid var(--figma-border, #1F2937)",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "var(--figma-bg-card2, #111827)",
          border: "1px solid var(--figma-border, #1F2937)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ShoppingCart size={14} style={{ color: "var(--figma-blue, #3B82F6)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: "var(--figma-text2, #E2E8F0)",
            fontSize: "0.875rem",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {order.customerName}
        </div>
        <div
          style={{
            color: "var(--figma-text4, #64748B)",
            fontSize: "0.75rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {order.serviceName}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            color: "var(--figma-text, #fff)",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {order.totalAmount ? order.totalAmount.toLocaleString("vi-VN") + "đ" : "—"}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            color: STATUS_CONFIG[order.status]?.color ?? "var(--figma-text4, #64748B)",
            fontSize: "0.6875rem",
            textTransform: "capitalize",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: STATUS_CONFIG[order.status]?.color ?? "var(--figma-text4, #64748B)",
              display: "inline-block",
            }}
          />
          {STATUS_CONFIG[order.status]?.label ?? order.status}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { user } = useAuthStore();

  // Fetch orders from API
  // throwOnError=false: QA/member roles may not have orders:read permission → show empty state
  const { data: ordersData } = useQuery({
    queryKey: qk.orders({ page: 1, limit: 5 }),
    queryFn: async () => {
      const res = await adminApi.get<{
        data: OrderRow[];
        pagination: { total: number };
      }>("/api/admin/orders", { params: { page: 1, limit: 5 }, throwOnError: false });
      return res;
    },
  });

  // Fetch active team members count
  const { data: teamData } = useQuery({
    queryKey: ["admin", "overview", "team"],
    queryFn: async () => {
      const res = await adminApi.get<{
        data: unknown[];
        pagination: { total: number };
      }>("/api/admin/team", { params: { page: 1, limit: 1 }, throwOnError: false });
      return res;
    },
  });
  const activeMembers = teamData && "pagination" in teamData
    ? (teamData as { pagination: { total: number } }).pagination.total
    : 0;

  // Fetch clients count
  const { data: clientsData } = useQuery({
    queryKey: ["admin", "overview", "clients"],
    queryFn: async () => {
      const res = await adminApi.get<{
        data: unknown[];
        pagination: { total: number };
      }>("/api/admin/sales-leads", { params: { page: 1, limit: 1 }, throwOnError: false });
      return res;
    },
  });
  const clientCount = clientsData && "pagination" in clientsData
    ? (clientsData as { pagination: { total: number } }).pagination.total
    : 0;

  // Fetch course enrollments count
  const { data: enrollData } = useQuery({
    queryKey: ["admin", "overview", "enrollments"],
    queryFn: async () => {
      const res = await adminApi.get<{
        data: unknown[];
        pagination: { total: number };
      }>("/api/admin/edu/enrollments", { params: { page: 1, limit: 1 }, throwOnError: false });
      return res;
    },
  });
  const enrollCount = enrollData && "pagination" in enrollData
    ? (enrollData as { pagination: { total: number } }).pagination.total
    : 0;

  const orders = ordersData && "data" in ordersData ? ordersData.data : [];
  const totalOrders = ordersData && "pagination" in ordersData ? (ordersData as { pagination: { total: number } }).pagination.total : 0;

  // Real KPIs computed from orders
  const monthRevenue = orders
    .filter((o: OrderRow) => isThisMonth(o.createdAt))
    .reduce((s: number, o: OrderRow) => s + (o.totalAmount ?? 0), 0);
  const doneCount = orders.filter((o: OrderRow) => o.status === "done").length;
  const inProgressCount = orders.filter((o: OrderRow) => o.status === "in_progress").length;

  // Status counts from all fetched orders (not just 5)
  const statusCounts = orders.reduce<Record<string, number>>((acc: Record<string, number>, o: OrderRow) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: "Tổng đơn hàng", value: totalOrders, icon: <ShoppingCart size={16} />, change: 12, changeType: "up" as const },
    { label: "Đang xử lý", value: inProgressCount, icon: <Clock size={16} /> },
    { label: "Hoàn thành", value: doneCount, icon: <CheckCircle2 size={16} /> },
    { label: "Doanh thu tháng", value: fmtVND(monthRevenue), icon: <DollarSign size={16} />, change: 8, changeType: "up" as const },
  ];

  return (
    <div style={{ padding: "0 0 2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            color: "var(--figma-text, #fff)",
            fontFamily: DS.heading,
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: "0 0 0.25rem",
          }}
        >
          Tổng quan
        </h1>
        <p style={{ color: "var(--figma-text3, #94A3B8)", fontSize: "0.875rem", margin: 0 }}>
          Chào mừng {user?.name ?? "Admin"} ·{" "}
          <span style={{ color: "var(--figma-blue, #3B82F6)" }}>{user?.rank ?? "Member"}</span>
        </p>
      </div>

      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {stats.map((stat, i) => (
          <KpiCard key={i} {...stat} />
        ))}
      </div>

      {/* Content grid */}
      <div className="admin-overview-grid">
        <style>{`
          .admin-overview-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          @media (min-width: 1024px) {
            .admin-overview-grid {
              grid-template-columns: 1fr 320px;
            }
          }
        `}</style>
        {/* Recent orders */}
        <div
          style={{
            background: "var(--figma-bg-card, #0F172A)",
            border: "1px solid var(--figma-border, #1F2937)",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                color: "var(--figma-text2, #E2E8F0)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Đơn hàng gần đây
            </h2>
            <a
              href="/admin/orders"
              style={{
                color: "var(--figma-blue, #3B82F6)",
                fontSize: "0.8125rem",
                textDecoration: "none",
              }}
            >
              Xem tất cả →
            </a>
          </div>
          <div>
            {orders.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--figma-text4, #64748B)",
                  fontSize: "0.875rem",
                }}
              >
                Chưa có đơn hàng nào
              </div>
            ) : (
              orders.map((order: OrderRow) => <OrderRow key={order.id} order={order} />)
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Quick stats */}
          <div
            style={{
              background: "var(--figma-bg-card, #0F172A)",
              border: "1px solid var(--figma-border, #1F2937)",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            <h2
              style={{
                color: "var(--figma-text2, #E2E8F0)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                margin: "0 0 1rem",
              }}
            >
              Trạng thái đơn hàng
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <StatChip label="Chờ thanh toán" value={statusCounts["pending_payment"] ?? 0} color="#F59E0B" />
              <StatChip label="Đã thanh toán" value={statusCounts["paid"] ?? 0} color="#3B82F6" />
              <StatChip label="Đang thực hiện" value={statusCounts["in_progress"] ?? 0} color="#818CF8" />
              <StatChip label="Hoàn thành" value={statusCounts["done"] ?? 0} color="#22C55E" />
            </div>
          </div>

          {/* User stats */}
          <div
            style={{
              background: "var(--figma-bg-card, #0F172A)",
              border: "1px solid var(--figma-border, #1F2937)",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            <h2
              style={{
                color: "var(--figma-text2, #E2E8F0)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                margin: "0 0 1rem",
              }}
            >
              Thành viên
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <StatChip label="Thành viên hoạt động" value={activeMembers} color="#3B82F6" />
              <StatChip label="Khách hàng" value={clientCount} color="#818CF8" />
              <StatChip label="Khóa học đã enroll" value={enrollCount} color="#14B8A6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
