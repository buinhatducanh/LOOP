"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  FolderKanban,
  ShoppingCart,
  MessageSquare,
  Users,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  new: "bg-blue-500/20 text-blue-400",
  read: "bg-slate-500/20 text-slate-400",
  replied: "bg-green-500/20 text-green-400",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setRecentMessages(data.recentMessages || []);
      })
      .catch(console.error)
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
      </div>
    );
  }

  const statCards = [
    {
      label: "Dịch vụ",
      value: stats?.totalServices || 0,
      icon: Globe,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Dự án",
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Đơn hàng",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "from-green-500 to-green-600",
      badge: stats?.pendingOrders ? `${stats.pendingOrders} chờ xử lý` : undefined,
    },
    {
      label: "Tin nhắn",
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      color: "from-orange-500 to-orange-600",
      badge: stats?.newMessages ? `${stats.newMessages} mới` : undefined,
    },
    {
      label: "Người dùng",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Chờ xử lý",
      value: stats?.pendingOrders || 0,
      icon: AlertCircle,
      color: "from-yellow-500 to-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Tổng quan hệ thống LOOP</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color}`}
              >
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

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-white">Đơn hàng gần đây</h2>
            <a href="/admin/orders" className="text-sm text-blue-400 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="divide-y divide-slate-800">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Chưa có đơn hàng nào
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{order.customerName}</p>
                    <p className="text-xs text-slate-400">
                      {order.orderNumber} - {order.package.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[order.status] || "bg-slate-700 text-slate-300"}`}
                    >
                      {order.status}
                    </span>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
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
            <a href="/admin/messages" className="text-sm text-blue-400 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="divide-y divide-slate-800">
            {recentMessages.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Chưa có tin nhắn nào
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{msg.name}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[msg.status] || "bg-slate-700 text-slate-300"}`}
                    >
                      {msg.status}
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
    </div>
  );
}
