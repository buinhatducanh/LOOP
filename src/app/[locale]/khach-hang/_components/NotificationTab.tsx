"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Bell, CheckCheck, Clock, ChevronRight } from "lucide-react";

type Notification = {
 id: string;
 type: string;
 title: string;
 message: string;
 isRead: boolean;
 createdAt: string;
 link?: string;
};

type PageData = { data: Notification[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

export function NotificationTab() {
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const [loading, setLoading] = useState(true);
 const [total, setTotal] = useState(0);
 const [unread, setUnread] = useState(0);

 const load = async () => {
 try {
 const res = await apiClient.get<{ data: PageData }>("/api/client/notifications", { params: { page: 1, limit: 50 }, throwOnError: false });
 if (!("error" in res)) {
 const d = (res as unknown as { data: PageData }).data;
 setNotifications(d.data ?? []);
 setTotal(d.pagination?.total ?? 0);
 setUnread(d.data.filter((n) => !n.isRead).length);
 }
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { load(); }, []);

 const markRead = async (id: string) => {
 await apiClient.patch(`/api/client/notifications/${id}`, { isRead: true }, { throwOnError: false });
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
 setUnread(prev => Math.max(0, prev - 1));
 };

 const markAllRead = async () => {
 await apiClient.post("/api/client/notifications/read-all", {}, { throwOnError: false });
 setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
 setUnread(0);
 };

 const PRIORITY_COLORS: Record<string, string> = {
 urgent: "#EF4444",
 high: "#F59E0B",
 normal: "#3B82F6",
 low: "#6B7280",
 };

 const TYPE_ICONS: Record<string, string> = {
 order_update: "📦",
 demo_ready: "🎨",
 design_approved: "✅",
 payment_received: "💳",
 project_delivered: "🚀",
 task_assigned: "📋",
 system: "⚙️",
 };

 if (loading) {
 return <div style={{ color: DS.text4, textAlign: "center", padding: "3rem" }}>Đang tải...</div>;
 }

 if (notifications.length === 0) {
 return (
 <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
 <Bell size={40} style={{ color: DS.text4, margin: "0 auto 1rem" }} />
 <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "0.5rem" }}>Không có thông báo nào</h3>
 <p style={{ color: DS.text3, fontSize: "0.875rem" }}>Bạn sẽ nhận thông báo về đơn hàng và dự án tại đây.</p>
 </div>
 );
 }

 return (
 <div>
 {/* Header */}
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
 <div>
 <span style={{ color: DS.text3, fontSize: "0.8125rem" }}>{total} thông báo</span>
 {unread > 0 && (
 <span style={{ marginLeft: "0.5rem", padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.15)", color: "#EF4444", fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
 {unread} chưa đọc
 </span>
 )}
 </div>
 {unread > 0 && (
 <button
 onClick={markAllRead}
 style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: DS.blue, padding: "0.375rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.75rem" }}
  >
 <CheckCheck size={13} /> Đánh dấu tất cả đã đọc
 </button>
 )}
 </div>

 {/* List */}
 <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
 {notifications.map((n) => (
 <div
 key={n.id}
 onClick={() => !n.isRead && markRead(n.id)}
 style={{
 padding: "0.875rem 1rem",
 borderRadius: "0.875rem",
 background: n.isRead ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.7)",
 border: `1px solid ${n.isRead ? DS.border : "rgba(59,130,246,0.2)"}`,
 cursor: n.isRead ? "default" : "pointer",
 opacity: n.isRead ? 0.75 : 1,
 transition: "all 0.15s",
 }}
 >
 <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
 <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{TYPE_ICONS[n.type] ?? "🔔"}</span>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
 <div style={{ color: DS.text, fontWeight: 600, fontSize: "0.875rem" }}>{n.title}</div>
 <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
 <Clock size={10} />
 {new Date(n.createdAt).toLocaleDateString("vi-VN")}
 </div>
 </div>
 <div style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.4 }}>{n.message}</div>
 {!n.isRead && (
 <div style={{ marginTop: "0.375rem", width: 6, height: 6, borderRadius: "50%", background: DS.pink, display: "inline-block" }} />
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
