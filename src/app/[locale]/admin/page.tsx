"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Globe,
  FolderKanban,
  ShoppingCart,
  MessageSquare,
  Users,
  AlertCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface DashboardStats {
  totalServices: number;
  totalProjects: number;
  totalOrders: number;
  totalMessages: number;
  totalUsers: number;
  newMessages: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
  package: { title: string };
}

interface RecentMessage {
  id: string;
  name: string;
  email: string;
  service: string | null;
  message: string;
  status: string;
  createdAt: string;
}

interface ChartData {
  ordersByStatus: Array<{ status: string; count: number }>;
  monthlyTrend: Array<{ month: string; orders: number; revenue: number }>;
  messagesByStatus: Array<{ status: string; count: number }>;
  messageTrend: Array<{ month: string; messages: number }>;
  paymentBreakdown: Array<{ status: string; count: number; amount: number }>;
}

// ─── Constants ──────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-indigo-500/20 text-indigo-400",
  processing: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  new: "bg-blue-500/20 text-blue-400",
  read: "bg-slate-500/20 text-slate-400",
  replied: "bg-green-500/20 text-green-400",
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thực hiện",
  processing: "Đang xử lý",
  review: "Chờ review",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  new: "Mới",
  read: "Đã đọc",
  replied: "Đã trả lời",
  archived: "Lưu trữ",
  unpaid: "Chưa TT",
  partial: "TT một phần",
  paid: "Đã TT",
  refunded: "Hoàn tiền",
};

const barColors: Record<string, string> = {
  pending: "#EAB308",
  confirmed: "#3B82F6",
  in_progress: "#6366F1",
  review: "#A855F7",
  completed: "#22C55E",
  cancelled: "#EF4444",
  new: "#3B82F6",
  read: "#64748B",
  replied: "#22C55E",
  archived: "#F59E0B",
  unpaid: "#EF4444",
  partial: "#F59E0B",
  paid: "#22C55E",
  refunded: "#64748B",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

const formatShortPrice = (price: number) => {
  if (price >= 1_000_000_000) return (price / 1_000_000_000).toFixed(1) + " tỷ";
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(1) + " tr";
  if (price >= 1_000) return (price / 1_000).toFixed(0) + "k";
  return String(price);
};

// ─── Main Page ──────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/dashboard").then((r) => r.json()),
      fetch("/api/admin/dashboard/charts").then((r) => r.json()),
    ])
      .then(([dashData, chartData]) => {
        setStats(dashData.stats);
        setRecentOrders(dashData.recentOrders || []);
        setRecentMessages(dashData.recentMessages || []);
        setCharts(chartData);
      })
      .catch(() => toast.error("Lỗi kết nối"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Dịch vụ", value: stats?.totalServices || 0, icon: Globe, color: "from-blue-500 to-blue-600" },
    { label: "Dự án", value: stats?.totalProjects || 0, icon: FolderKanban, color: "from-indigo-500 to-indigo-600" },
    { label: "Đơn hàng", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "from-green-500 to-green-600", badge: stats?.pendingOrders ? `${stats.pendingOrders} chờ xử lý` : undefined },
    { label: "Tin nhắn", value: stats?.totalMessages || 0, icon: MessageSquare, color: "from-orange-500 to-orange-600", badge: stats?.newMessages ? `${stats.newMessages} mới` : undefined },
    { label: "Người dùng", value: stats?.totalUsers || 0, icon: Users, color: "from-purple-500 to-purple-600" },
    { label: "Chờ xử lý", value: stats?.pendingOrders || 0, icon: AlertCircle, color: "from-yellow-500 to-yellow-600" },
  ];

  // Calculate total revenue
  const totalRevenue = charts?.paymentBreakdown?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const paidRevenue = charts?.paymentBreakdown?.find((p) => p.status === "paid")?.amount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">Tổng quan hệ thống LOOP</p>
        </div>
        {totalRevenue > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Tổng doanh thu</p>
            <p className="text-xl font-bold text-green-400">{formatShortPrice(totalRevenue)}</p>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color}`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            {card.badge && (
              <span className="mt-2 inline-block rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-400">
                {card.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {charts && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Trend Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-blue-400" />
              <h2 className="font-semibold text-white">Đơn hàng theo tháng</h2>
            </div>
            <SimpleBarChart
              data={charts.monthlyTrend}
              dataKey="orders"
              color="#3B82F6"
              labelKey="month"
            />
          </div>

          {/* Revenue Trend */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-green-400" />
              <h2 className="font-semibold text-white">Doanh thu theo tháng</h2>
            </div>
            <SimpleBarChart
              data={charts.monthlyTrend}
              dataKey="revenue"
              color="#22C55E"
              labelKey="month"
              formatValue={formatShortPrice}
            />
          </div>

          {/* Order Status Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={18} className="text-indigo-400" />
              <h2 className="font-semibold text-white">Đơn hàng theo trạng thái</h2>
            </div>
            <HorizontalBars data={charts.ordersByStatus} />
          </div>

          {/* Messages Trend */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-orange-400" />
              <h2 className="font-semibold text-white">Tin nhắn theo tháng</h2>
            </div>
            <SimpleBarChart
              data={charts.messageTrend}
              dataKey="messages"
              color="#F97316"
              labelKey="month"
            />
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-white">Đơn hàng gần đây</h2>
            <a href="/vi/admin/orders" className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
              Xem tất cả <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="divide-y divide-slate-800">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">Chưa có đơn hàng nào</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{order.customerName}</p>
                    <p className="text-xs text-slate-400">{order.orderNumber} - {order.package.title}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[order.status] || "bg-slate-700 text-slate-300"}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    {order.totalAmount && (
                      <p className="mt-0.5 text-xs font-mono text-green-400">{formatShortPrice(order.totalAmount)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-white">Tin nhắn gần đây</h2>
            <a href="/vi/admin/messages" className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
              Xem tất cả <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="divide-y divide-slate-800">
            {recentMessages.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">Chưa có tin nhắn nào</div>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{msg.name}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[msg.status] || "bg-slate-700 text-slate-300"}`}>
                      {statusLabels[msg.status] || msg.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{msg.email}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-300">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      {charts && charts.paymentBreakdown.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-emerald-400" />
            <h2 className="font-semibold text-white">Tình trạng thanh toán</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {charts.paymentBreakdown.map((p) => (
              <div key={p.status} className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  barColors[p.status] ? "" : "bg-slate-700 text-slate-300"
                }`} style={{ backgroundColor: barColors[p.status] + "33", color: barColors[p.status] }}>
                  {statusLabels[p.status] || p.status}
                </span>
                <p className="mt-2 text-2xl font-bold text-white">{p.count}</p>
                <p className="text-xs font-mono text-slate-400">{formatShortPrice(p.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple Bar Chart (CSS-based, no recharts needed) ───────────

function SimpleBarChart({
  data,
  dataKey,
  color,
  labelKey,
  formatValue,
}: {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  color: string;
  labelKey: string;
  formatValue?: (v: number) => string;
}) {
  const values = data.map((d) => (d[dataKey] as number) || 0);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => {
        const value = (d[dataKey] as number) || 0;
        const height = Math.max((value / max) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-400">
              {formatValue ? formatValue(value) : value}
            </span>
            <div className="w-full relative" style={{ height: "120px" }}>
              <div
                className="absolute bottom-0 w-full rounded-t transition-all duration-500"
                style={{ height: `${height}%`, backgroundColor: color, opacity: 0.8 }}
              />
            </div>
            <span className="text-[10px] text-slate-500 truncate w-full text-center">
              {String(d[labelKey]).split("/")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Horizontal Bars ────────────────────────────────────────────

function HorizontalBars({ data }: { data: Array<{ status: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0) {
    return <p className="text-center text-sm text-slate-500 py-8">Chưa có dữ liệu</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = total > 0 ? ((d.count / total) * 100).toFixed(0) : "0";
        return (
          <div key={d.status}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300">{statusLabels[d.status] || d.status}</span>
              <span className="text-xs text-slate-400">{d.count} ({pct}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  backgroundColor: barColors[d.status] || "#64748B",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

