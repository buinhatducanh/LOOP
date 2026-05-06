"use client";

/**
 * Notification Center Admin Page — LOOP Solutions
 * Route: /admin/notification_center
 *
 * Full-featured notification management with:
 * 6 category filters · priority filter · department filter
 * read filter · archived inbox · search · bulk actions · pagination
 *
 * NO mock data — all data from API.
 */
import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";

import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
 RefreshCw, CheckCheck, Trash2, MessageSquare, Zap, AlertTriangle,
 Search, X, Check, Archive, Eye, ChevronRight, ChevronLeft, Bell,
 ChevronDown,
 ShoppingCart, DollarSign, Users, Camera, Settings, Building2,
 ArrowUpRight, BarChart3, Star,
} from "lucide-react";

const PAGE_SIZE = 20;

// ── Types ──────────────────────────────────────────────────────────────────

type Notification = {
 id: string;
 title: string;
 body: string;
 type: string;
 priority: "urgent" | "high" | "normal" | "low";
 category: string;
 department?: string;
 assignedTo?: string;
 relatedOrderId?: string;
 read: boolean;
 archived: boolean;
 createdAt: string;
 time: string;
 color: string;
};

type ApiNotification = {
 id: string;
 type: string;
 title: string;
 message: string;
 link?: string | null;
 priority: string;
 isRead: boolean;
 createdAt: string;
};

// ── Configs ──────────────────────────────────────────────────────────────

const CATEGORIES = [
 { id: "all", label: "Tất cả", icon: <Bell size={13} />, color: DS.text3 },
 { id: "order", label: "Đơn hàng", icon: <ShoppingCart size={13} />, color: DS.blue },
 { id: "finance", label: "Tài chính", icon: <DollarSign size={13} />, color: DS.green },
 { id: "team", label: "Đội ngũ", icon: <Users size={13} />, color: DS.purple },
 { id: "client", label: "Khách hàng", icon: <MessageSquare size={13} />, color: DS.cyan },
 { id: "media", label: "Media", icon: <Camera size={13} />, color: "#F59E0B" },
 { id: "system", label: "Hệ thống", icon: <Settings size={13} />, color: DS.text4 },
];

const DEPARTMENTS = [
 { id: "all", label: "Tất cả phòng ban" },
 { id: "engineering", label: "Engineering" },
 { id: "design", label: "Design" },
 { id: "media", label: "Media" },
 { id: "marketing", label: "Marketing" },
 { id: "sales", label: "Sales" },
 { id: "finance", label: "Finance" },
 { id: "hr", label: "HR" },
 { id: "management", label: "Management" },
];

const PRIORITIES = [
 { id: "all", label: "Tất cả", color: DS.text3 },
 { id: "urgent", label: "Khẩn cấp", color: DS.red },
 { id: "high", label: "Cao", color: DS.amber },
 { id: "normal", label: "Bình thường", color: DS.blue },
 { id: "low", label: "Thấp", color: DS.text4 },
];

const PRIORITY_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
 urgent: { label: "KHẨN", color: DS.red, icon: <AlertTriangle size={10} /> },
 high: { label: "CAO", color: DS.amber, icon: <ArrowUpRight size={10} /> },
 normal: { label: "BT", color: DS.blue, icon: <Check size={10} /> },
 low: { label: "THẤP", color: DS.text4, icon: <ChevronDown size={10} /> },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
 new_order: <ShoppingCart size={14} />,
 payment: <DollarSign size={14} />,
 payment_received: <DollarSign size={14} />,
 client_message: <MessageSquare size={14} />,
 demo_approved: <CheckCheck size={14} />,
 demo_ready: <CheckCheck size={14} />,
 system: <BarChart3 size={14} />,
 task: <Bell size={14} />,
 task_assigned: <Bell size={14} />,
 task_in_review: <Bell size={14} />,
 task_done: <Bell size={14} />,
 lp: <Zap size={14} />,
 lp_award: <Zap size={14} />,
 review: <Star size={14} />,
 media_booking: <Camera size={14} />,
 media_delivery: <Camera size={14} />,
 escalation: <AlertTriangle size={14} />,
 order_created: <ShoppingCart size={14} />,
 new_client_message: <MessageSquare size={14} />,
 client_feedback: <MessageSquare size={14} />,
};

// ── Mappers (matching SSE hook logic) ───────────────────────────────────

function colorByType(type: string): string {
 const map: Record<string, string> = {
 new_order: "#818CF8",
 payment_received: "#22C55E",
 design_request: "#F59E0B",
 demo_ready: "#3B82F6",
  demo_feedback: "#8B5CF6",
 design_approved: "#22C55E",
 task_assigned: "#3B82F6",
 task_in_review: "#F59E0B",
 task_done: "#22C55E",
 project_delivered: "#EC4899",
 handover_pending: "#EC4899",
 domain_purchase: "#14B8A6",
 ekyc_submitted: "#14B8A6",
 website_configured: "#22C55E",
 system: "#94A3B8",
 lp: "#FFD700",
 lp_award: "#FFD700",
 task: "#22C55E",
 escalation: "#EF4444",
 media_booking: "#F59E0B",
 client_message: "#818CF8",
 new_client_message: "#818CF8",
 review: "#FFD700",
 order_created: "#818CF8",
 default: "#94A3B8",
 };
 return map[type] ?? map.default;
}

function departmentByType(type: string): string {
 const map: Record<string, string> = {
 new_order: "sales",
 order_created: "sales",
 payment_received: "finance",
 design_request: "design",
 demo_ready: "design",
 demo_feedback: "design",
 design_approved: "design",
 task_assigned: "engineering",
 task_in_review: "engineering",
 task_done: "engineering",
 project_delivered: "engineering",
 handover_pending: "engineering",
 domain_purchase: "engineering",
 ekyc_submitted: "engineering",
 website_configured: "engineering",
 member_joined: "hr",
 member_left: "hr",
 };
 return map[type] ?? "management";
}

function categoryByType(type: string): string {
 const map: Record<string, string> = {
 new_order: "order",
 order_created: "order",
 payment_received: "finance",
 payment: "finance",
 design_request: "order",
 demo_ready: "client",
 demo_approved: "client",
 demo_feedback: "client",
 design_approved: "order",
 task_assigned: "team",
 task_in_review: "team",
 task_done: "team",
 project_delivered: "order",
 handover_pending: "order",
 domain_purchase: "finance",
 ekyc_submitted: "finance",
 website_configured: "order",
 lp: "team",
 lp_award: "team",
 task: "team",
 escalation: "system",
 media_booking: "media",
 media_delivery: "media",
 client_message: "client",
 new_client_message: "client",
 client_feedback: "client",
 review: "client",
 member_joined: "team",
 member_left: "team",
 system: "system",
 quest_completed: "team",
 event_started: "team",
 lp_redemption: "team",
 };
 return map[type] ?? "system";
}

function formatRelativeTime(date: Date): string {
 const diff = Date.now() - date.getTime();
 const seconds = Math.floor(diff / 1000);
 const minutes = Math.floor(seconds / 60);
 const hours = Math.floor(minutes / 60);
 if (seconds < 60) return "Vừa xong";
 if (minutes < 60) return `${minutes} phút trước`;
 if (hours < 24) return `${hours} giờ trước`;
 return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function apiToNotification(n: ApiNotification): Notification {
 return {
 id: n.id,
 type: n.type,
  title: n.title,
 body: n.message,
 priority: (n.priority ?? "normal") as Notification["priority"],
 category: categoryByType(n.type),
 department: departmentByType(n.type),
 relatedOrderId: undefined,
 assignedTo: undefined,
 read: n.isRead,
 archived: false,
 createdAt: new Date(n.createdAt).toISOString(),
 time: formatRelativeTime(new Date(n.createdAt)),
 color: colorByType(n.type),
 };
}

// ── Formatters ───────────────────────────────────────────────────────────

const rgba = (hex: string, a: number) => {
 const h = hex.replace("#", "");
 return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Main Component ───────────────────────────────────────────────────────

export default function NotificationCenterPage() {
 const qc = useQueryClient();

 const [search, setSearch] = useState("");
 const [category, setCategory] = useState("all");
 const [department, setDepartment] = useState("all");
 const [priority, setPriority] = useState("all");
 const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
 const [showArchived, setShowArchived] = useState(false);
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
 const [page, setPage] = useState(0);
 const [expandedId, setExpandedId] = useState<string | null>(null);

 // Fetch notifications from API
 const { data, isFetching, isLoading } = useQuery({
 queryKey: ["admin", "notifications"],
 queryFn: () => adminApi.get<{ data: ApiNotification[] }>("/api/admin/notifications", { params: {} }),
  refetchInterval: 60_000, // poll every 60s as backup to SSE
 });

 const rawNotifications: ApiNotification[] = data?.data ?? [];
 const notifications = useMemo(() => rawNotifications.map(apiToNotification), [rawNotifications]);

 // ── API Actions ────────────────────────────────────────────────────────

 const markRead = useCallback(async (id: string) => {
 try {
 await adminApi.patch(`/api/admin/notifications/${id}`, {});
 qc.setQueryData<{ data: ApiNotification[] }>(["admin", "notifications"], (old) => {
 if (!old) return old;
 return {
 ...old,
 data: old.data.map(n => n.id === id ? { ...n, isRead: true } : n),
 };
 });
 } catch { /* non-fatal */ }
 }, [qc]);

 const archiveNotif = useCallback(async (id: string) => {
 try {
 await adminApi.post("/api/admin/notifications/bulk-action", { action: "archive", ids: [id] });
 qc.setQueryData<{ data: ApiNotification[] }>(["admin", "notifications"], (old) => {
 if (!old) return old;
 return {
 ...old,
 data: old.data.map(n => n.id === id ? { ...n, isRead: true } : n),
 };
 });
 } catch { /* non-fatal */ }
 }, [qc]);

 const deleteNotif = useCallback(async (id: string) => {
 try {
 await adminApi.delete(`/api/admin/notifications/${id}`);
 qc.setQueryData<{ data: ApiNotification[] }>(["admin", "notifications"], (old) => {
 if (!old) return old;
 return { ...old, data: old.data.filter(n => n.id !== id) };
 });
 } catch { /* non-fatal */ }
 }, [qc]);

 const bulkRead = useCallback(async (ids: string[]) => {
  try {
 await adminApi.post("/api/admin/notifications/bulk-action", { action: "markRead", ids });
 qc.setQueryData<{ data: ApiNotification[] }>(["admin", "notifications"], (old) => {
 if (!old) return old;
 return {
 ...old,
 data: old.data.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n),
 };
 });
 setSelectedIds(new Set());
 } catch { /* non-fatal */ }
 }, [qc]);

 const bulkArchive = useCallback(async (ids: string[]) => {
 try {
 await adminApi.post("/api/admin/notifications/bulk-action", { action: "archive", ids });
 qc.setQueryData<{ data: ApiNotification[] }>(["admin", "notifications"], (old) => {
 if (!old) return old;
 return {
 ...old,
 data: old.data.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n),
 };
 });
 setSelectedIds(new Set());
 } catch { /* non-fatal */ }
 }, [qc]);

 const bulkDelete = useCallback(async (ids: string[]) => {
 try {
 await Promise.allSettled(ids.map(id => adminApi.delete(`/api/admin/notifications/${id}`)));
 qc.setQueryData<{ data: ApiNotification[] }>(["admin", "notifications"], (old) => {
 if (!old) return old;
 return { ...old, data: old.data.filter(n => !ids.includes(n.id)) };
 });
 setSelectedIds(new Set());
 } catch { /* non-fatal */ }
 }, [qc]);

 const markAllRead = useCallback(async () => {
 const ids = notifications.filter(n => !n.read && !n.archived).map(n => n.id);
 if (ids.length === 0) return;
 await bulkRead(ids);
 }, [notifications, bulkRead]);

 // ── Filtered & paginated ───────────────────────────────────────────
 const filtered = useMemo(() => {
 return notifications.filter(n => {
 if (!showArchived && n.archived) return false;
 if (showArchived && !n.archived) return false;
 if (category !== "all" && n.category !== category) return false;
 if (department !== "all" && n.department !== department) return false;
 if (priority !== "all" && n.priority !== priority) return false;
 if (readFilter === "unread" && n.read) return false;
  if (readFilter === "read" && !n.read) return false;
 if (search) {
 const q = search.toLowerCase();
 return n.title.toLowerCase().includes(q)
 || n.body.toLowerCase().includes(q)
 || (n.department ?? "").toLowerCase().includes(q)
 || (n.assignedTo ?? "").toLowerCase().includes(q)
 || (n.relatedOrderId ?? "").toLowerCase().includes(q);
 }
 return true;
 }).sort((a, b) => {
 const pOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
 if (!a.read && b.read) return -1;
 if (a.read && !b.read) return 1;
 const pDiff = (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
 if (pDiff !== 0) return pDiff;
 return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 });
 }, [notifications, search, category, department, priority, readFilter, showArchived]);

 const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
 const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

 const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
 const urgentCount = notifications.filter(n => !n.read && n.priority === "urgent" && !n.archived).length;

 // Category counts
 const catCounts = useMemo(() => {
 const counts: Record<string, number> = {};
 notifications.filter(n => !n.archived).forEach(n => {
 counts[n.category] = (counts[n.category] ?? 0) + 1;
 if (!n.read) counts[`${n.category}_unread`] = (counts[`${n.category}_unread`] ?? 0) + 1;
 });
 counts["all"] = notifications.filter(n => !n.archived).length;
 counts["all_unread"] = unreadCount;
 return counts;
 }, [notifications, unreadCount]);

 // ── Handlers ────────────────────────────────────────────────────────
 const toggleSelect = (id: string) => {
 setSelectedIds(prev => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id); else next.add(id);
 return next;
 });
 };
 const selectAll = () => {
 if (selectedIds.size === pageItems.length) setSelectedIds(new Set());
 else setSelectedIds(new Set(pageItems.map(n => n.id)));
 };
 const clearSelection = () => setSelectedIds(new Set());

 const handleBulkRead = () => { void bulkRead([...selectedIds]); };
 const handleBulkArchive = () => { void bulkArchive([...selectedIds]); };
 const handleBulkDelete = () => { void bulkDelete([...selectedIds]); };

 // Reset page when filters change
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const handleFilterChange = (setter: (v: any) => void) => (v: any) => { setter(v); setPage(0); };

 return (
 <div style={{ padding: "var(--admin-padding, 2rem)", minHeight: "100vh", background: DS.bgCosmic, display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`
        :root { --admin-padding: 2rem; }
        @media (max-width: 640px) { :root { --admin-padding: 1rem; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
 {/* Header */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
 <div>
 <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
 Trung tâm thông báo
 </h2>
 <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
 {unreadCount} chưa đọc · {notifications.filter(n => !n.archived).length} tổng
 {urgentCount > 0 && <span style={{ color: DS.red, fontWeight: 700 }}> · {urgentCount} khẩn cấp</span>}
 </p>
 </div>
 <div style={{ display: "flex", gap: "0.5rem" }}>
 <button onClick={() => setShowArchived(!showArchived)}
 style={{
 display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
 background: showArchived ? rgba(DS.purple, 0.1) : "rgba(255,255,255,0.03)",
 border: `1px solid ${showArchived ? rgba(DS.purple, 0.3) : DS.border}`,
 color: showArchived ? DS.purple : DS.text4, cursor: "pointer", fontSize: 11, borderRadius: 8,
 }}>
 <Archive size={12} /> {showArchived ? "Hộp chính" : "Lưu trữ"}
 </button>
 <button onClick={() => void markAllRead()}
 style={{
 display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
 background: rgba(DS.blue, 0.08), border: `1px solid ${rgba(DS.blue, 0.2)}`,
 color: DS.blue, cursor: "pointer", fontSize: 11, borderRadius: 8,
 }}>
  <Eye size={12} /> Đọc hết
 </button>
 <button onClick={() => qc.invalidateQueries({ queryKey: ["admin", "notifications"] })}
 style={{
 display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
 background: DS.bgCard, border: `1px solid ${DS.border}`,
 color: DS.text3, cursor: "pointer", fontSize: 11, borderRadius: 8,
 }}>
 <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} /> Làm mới
 </button>
 </div>
 </div>

 {/* Category tabs */}
 <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
 {CATEGORIES.map(cat => {
 const count = catCounts[cat.id] ?? 0;
 const unread = catCounts[`${cat.id}_unread`] ?? 0;
 const isActive = category === cat.id;
 return (
 <button key={cat.id} onClick={() => handleFilterChange(setCategory)(cat.id)}
 style={{
 display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
 borderRadius: 10, cursor: "pointer", fontSize: 12, flexShrink: 0, whiteSpace: "nowrap",
 background: isActive ? rgba(cat.color, 0.1) : "transparent",
 border: `1px solid ${isActive ? rgba(cat.color, 0.3) : "transparent"}`,
 color: isActive ? cat.color : DS.text4,
 transition: "all 0.15s",
 }}>
 {cat.icon}
 <span>{cat.label}</span>
 {count > 0 && (
 <span style={{
 fontSize: 9, fontFamily: DS.mono,
 background: rgba(cat.color, isActive ? 0.2 : 0.08),
 padding: "1px 5px", borderRadius: 6,
 color: isActive ? cat.color : DS.text5,
 }}>
 {count}
 </span>
 )}
 {unread > 0 && !isActive && (
 <span style={{ width: 6, height: 6, borderRadius: 3, background: cat.color, boxShadow: `0 0 4px ${cat.color}`, flexShrink: 0 }} />
 )}
 </button>
 );
 })}
 </div>

 {/* Search + Filters row */}
 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
 {/* Search */}
 <div style={{
 display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, flex: 1, minWidth: 200,
 background: DS.bgCard, border: `1px solid ${DS.border}`,
 }}>
 <Search size={14} style={{ color: DS.text5, flexShrink: 0 }} />
 <input value={search} onChange={e => { handleFilterChange(setSearch)(e.target.value); }}
 placeholder="Tìm thông báo, đơn hàng, phòng ban, người phụ trách..."
 style={{ background: "none", border: "none", outline: "none", color: DS.text, fontSize: 12, flex: 1, fontFamily: DS.body }} />
 {search && (
 <button onClick={() => handleFilterChange(setSearch)("")} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5, flexShrink: 0 }}>
 <X size={12} />
 </button>
 )}
 </div>

 {/* Priority */}
 <div style={{ display: "flex", gap: 4 }}>
 {PRIORITIES.map(p => (
 <button key={p.id} onClick={() => handleFilterChange(setPriority)(p.id)}
 style={{
 padding: "5px 10px", borderRadius: 7, fontSize: 10, fontFamily: DS.mono, cursor: "pointer",
 background: priority === p.id ? rgba(p.color, 0.12) : "transparent",
 border: `1px solid ${priority === p.id ? rgba(p.color, 0.3) : DS.border}`,
 color: priority === p.id ? p.color : DS.text5,
 }}>
 {p.label}
 </button>
 ))}
 </div>

 {/* Read filter */}
 <div style={{ display: "flex", gap: 4 }}>
 {([
 { id: "all" as const, label: "Tất cả" },
 { id: "unread" as const, label: "Chưa đọc" },
 { id: "read" as const, label: "Đã đọc" },
 ]).map(f => (
 <button key={f.id} onClick={() => handleFilterChange(setReadFilter)(f.id)}
 style={{
 padding: "5px 10px", borderRadius: 7, fontSize: 10, fontFamily: DS.mono, cursor: "pointer",
 background: readFilter === f.id ? rgba(DS.cyan, 0.1) : "transparent",
 border: `1px solid ${readFilter === f.id ? rgba(DS.cyan, 0.3) : DS.border}`,
 color: readFilter === f.id ? DS.cyan : DS.text5,
 }}>
 {f.label}
 </button>
 ))}
 </div>

 {/* Department */}
 <select value={department} onChange={e => handleFilterChange(setDepartment)(e.target.value)}
 style={{
 padding: "5px 10px", borderRadius: 7, fontSize: 11, fontFamily: DS.mono,
 background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3,
 cursor: "pointer", outline: "none",
 }}>
 {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
 </select>
 </div>

 {/* Bulk actions bar */}
 <AnimatePresence>
 {selectedIds.size > 0 && (
 <motion.div
 style={{
 display: "flex", alignItems: "center", gap: "0.75rem", padding: "10px 16px", borderRadius: 10,
 background: rgba(DS.blue, 0.06), border: `1px solid ${rgba(DS.blue, 0.15)}`,
 }}
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}>
 <span style={{ color: DS.blue, fontSize: 12, fontWeight: 600 }}>
 {selectedIds.size} đã chọn
 </span>
 <div style={{ flex: 1 }} />
 <button onClick={handleBulkRead} style={{
 display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
 background: rgba(DS.green, 0.08), border: `1px solid ${rgba(DS.green, 0.2)}`,
 color: DS.green, cursor: "pointer", fontSize: 11,
 }}>
 <Eye size={12} /> Đọc
 </button>
 <button onClick={handleBulkArchive} style={{
 display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
 background: rgba(DS.purple, 0.08), border: `1px solid ${rgba(DS.purple, 0.2)}`,
 color: DS.purple, cursor: "pointer", fontSize: 11,
 }}>
 <Archive size={12} /> Lưu trữ
 </button>
 <button onClick={handleBulkDelete} style={{
 display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
 background: rgba(DS.red, 0.08), border: `1px solid ${rgba(DS.red, 0.2)}`,
 color: DS.red, cursor: "pointer", fontSize: 11,
 }}>
 <Trash2 size={12} /> Xóa
  </button>
 <button onClick={clearSelection} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4 }}>
 <X size={14} />
 </button>
 </motion.div>
  )}
 </AnimatePresence>

 {/* Select all row */}
 {pageItems.length > 0 && (
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 8 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <button onClick={selectAll}
 style={{
 width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
 background: selectedIds.size === pageItems.length ? DS.blue : "transparent",
 border: selectedIds.size === pageItems.length ? "none" : `1.5px solid ${DS.border}`,
 cursor: "pointer",
 }}>
 {selectedIds.size === pageItems.length && <Check size={11} style={{ color: "#fff" }} />}
 </button>
 <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
 Chọn tất cả · Trang {page + 1}/{Math.max(1, totalPages)} · {filtered.length} kết quả
 </span>
 </div>
 </div>
 )}

  {/* Notification list */}
  <div style={{ overflowX: "auto", paddingBottom: 10 }} className="hide-scrollbar">
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minWidth: 450 }}>
 {isLoading ? (
 <div style={{
 textAlign: "center", padding: "4rem", borderRadius: 12,
 background: DS.bgCard, border: `1px solid ${DS.border}`,
 }}>
 <RefreshCw size={32} style={{ color: DS.text5, marginBottom: 12, animation: "spin 1s linear infinite" }} className="animate-spin" />
 <div style={{ color: DS.text3, fontSize: 14 }}>Đang tải thông báo...</div>
 </div>
 ) : pageItems.length === 0 ? (
 <div style={{
 textAlign: "center", padding: "4rem", borderRadius: 12,
 background: DS.bgCard, border: `1px solid ${DS.border}`,
 }}>
 <Bell size={40} style={{ color: DS.text5, marginBottom: 12, opacity: 0.3 }} />
 <div style={{ color: DS.text3, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
 {showArchived ? "Không có thông báo lưu trữ" : "Không có thông báo nào"}
 </div>
 <div style={{ color: DS.text5, fontSize: 12 }}>
 {search ? "Thử từ khóa khác hoặc bỏ bộ lọc" : "Tất cả đã xử lý xong!"}
 </div>
 </div>
 ) : pageItems.map((n, i) => {
 const pb = PRIORITY_BADGE[n.priority];
 const isSelected = selectedIds.has(n.id);
 const isExpanded = expandedId === n.id;

 return (
 <motion.div
 key={n.id}
 style={{
 borderRadius: 12, overflow: "hidden",
 background: n.read ? DS.bgCard : rgba(n.color ?? DS.blue, 0.03),
 border: isSelected
 ? `1.5px solid ${rgba(DS.blue, 0.5)}`
 : `1px solid ${n.read ? DS.border : rgba(n.color ?? DS.blue, 0.15)}`,
 }}
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.02 }}>
 {/* Main row */}
 <div
 style={{
 display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.75rem",
 cursor: "pointer",
 }}
 onClick={() => { void markRead(n.id); setExpandedId(isExpanded ? null : n.id); }}>
 {/* Checkbox */}
 <button onClick={e => { e.stopPropagation(); toggleSelect(n.id); }}
 style={{
 width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
 display: "flex", alignItems: "center", justifyContent: "center",
 background: isSelected ? DS.blue : "transparent",
 border: isSelected ? "none" : `1.5px solid ${DS.border}`,
 cursor: "pointer",
 }}>
 {isSelected && <Check size={10} style={{ color: "#fff" }} />}
 </button>

 {/* Icon */}
 <div style={{
 width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginTop: 2,
 display: "flex", alignItems: "center", justifyContent: "center",
 background: rgba(n.color ?? DS.blue, 0.1),
 border: `1px solid ${rgba(n.color ?? DS.blue, 0.2)}`,
 color: n.color ?? DS.blue,
 }}>
 {TYPE_ICON[n.type] ?? <Bell size={14} />}
 </div>

 {/* Content */}
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: 2 }}>
 {!n.read && (
 <motion.span style={{
 width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
 background: n.color ?? DS.blue,
 boxShadow: `0 0 4px ${n.color ?? DS.blue}`,
 }}
 animate={{ scale: [1, 1.3, 1] }}
 transition={{ duration: 1.5, repeat: Infinity }} />
 )}
 <span style={{
 color: n.read ? DS.text3 : DS.text, fontSize: 12, fontWeight: n.read ? 500 : 700,
 }}>
 {n.title}
 </span>
 {n.priority !== "normal" && (
 <span style={{
 display: "flex", alignItems: "center", gap: 2, padding: "2px 6px",
 background: rgba(pb.color, 0.1), color: pb.color,
 fontSize: 8, fontFamily: DS.mono, fontWeight: 700, borderRadius: 4,
 }}>
 {pb.icon} {pb.label}
 </span>
 )}
 </div>
 <div style={{
 color: DS.text4, fontSize: 11, lineHeight: 1.5,
 overflow: "hidden", textOverflow: "ellipsis",
 whiteSpace: isExpanded ? "normal" : "nowrap",
 }}>
 {n.body}
 </div>
 {/* Meta */}
 <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
 <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{n.time}</span>
 {n.department && (
 <span style={{
 display: "flex", alignItems: "center", gap: 4, padding: "2px 6px",
 background: "rgba(255,255,255,0.03)", fontSize: 9, fontFamily: DS.mono,
 color: DS.text5, borderRadius: 4, border: `1px solid ${rgba(DS.border, 0.5)}`,
 }}>
 <Building2 size={8} /> {n.department}
 </span>
 )}
 {n.assignedTo && (
 <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
 <Users size={8} style={{ display: "inline" }} /> {n.assignedTo}
 </span>
 )}
 {n.relatedOrderId && (
 <span style={{ color: DS.blue, fontSize: 9, fontFamily: DS.mono }}>
 {n.relatedOrderId}
 </span>
 )}
 </div>
 </div>

 {/* Actions */}
 <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
 <button onClick={e => { e.stopPropagation(); void archiveNotif(n.id); }}
 title="Lưu trữ"
 style={{
 width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
 background: "transparent", border: "none", cursor: "pointer", color: DS.text5,
 }}
 onMouseEnter={e => { e.currentTarget.style.background = rgba(DS.purple, 0.1); e.currentTarget.style.color = DS.purple; }}
 onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = DS.text5; }}>
 <Archive size={12} />
 </button>
 <button onClick={e => { e.stopPropagation(); void deleteNotif(n.id); }}
 title="Xóa"
 style={{
 width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
 background: "transparent", border: "none", cursor: "pointer", color: DS.text5,
 }}
 onMouseEnter={e => { e.currentTarget.style.background = rgba(DS.red, 0.1); e.currentTarget.style.color = DS.red; }}
 onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = DS.text5; }}>
 <Trash2 size={12} />
 </button>
  </div>
 </div>

 {/* Expanded detail */}
 <AnimatePresence>
 {isExpanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
 style={{ overflow: "hidden" }}>
 <div style={{ padding: "0 12px 12px 64px", borderTop: `1px solid ${rgba(DS.border, 0.5)}` }}>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
 <div>
 <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LOẠI</div>
 <div style={{ color: DS.text3, fontSize: 11 }}>{n.type.replace(/_/g, " ")}</div>
 </div>
 <div>
 <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>DANH MỤC</div>
 <div style={{ color: DS.text3, fontSize: 11 }}>{n.category}</div>
 </div>
 <div>
 <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>ĐỘ ƯU TIÊN</div>
 <div style={{ color: pb.color, fontSize: 11, fontWeight: 600 }}>{pb.label}</div>
 </div>
 <div>
 <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>PHÒNG BAN</div>
 <div style={{ color: DS.text3, fontSize: 11 }}>{n.department ?? "—"}</div>
 </div>
 </div>
 {n.relatedOrderId && (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "0.5rem" }}>
 <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Liên quan:</span>
 <span style={{
 padding: "2px 8px", borderRadius: 4,
 background: rgba(DS.blue, 0.08), color: DS.blue,
 fontSize: 10, fontFamily: DS.mono,
 }}>
 {n.relatedOrderId}
 </span>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
 })}
  </div>
  </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", paddingTop: "0.5rem" }}>
  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
 style={{
 width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
 background: page === 0 ? rgba(DS.bgCard, 0.05) : rgba(DS.bgCard, 0.1),
 border: `1px solid ${DS.border}`, cursor: page === 0 ? "not-allowed" : "pointer",
 color: page === 0 ? DS.text5 : DS.text3,
 }}>
 <ChevronLeft size={14} />
 </button>

 {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
 let pageNum: number;
 if (totalPages <= 7) pageNum = i;
 else if (page < 3) pageNum = i;
 else if (page > totalPages - 4) pageNum = totalPages - 7 + i;
 else pageNum = page - 3 + i;
 return (
 <button key={pageNum} onClick={() => setPage(pageNum)}
 style={{
 width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
 background: page === pageNum ? GRD.primary : rgba(DS.bgCard, 0.08),
 border: page === pageNum ? "none" : `1px solid ${DS.border}`,
 color: page === pageNum ? "#fff" : DS.text4,
 cursor: "pointer", fontSize: 11, fontFamily: DS.mono,
 }}>
 {pageNum + 1}
 </button>
  );
 })}

 <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
 style={{
 width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
 background: page >= totalPages - 1 ? rgba(DS.bgCard, 0.05) : rgba(DS.bgCard, 0.1),
 border: `1px solid ${DS.border}`, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
 color: page >= totalPages - 1 ? DS.text5 : DS.text3,
 }}>
 <ChevronRight size={14} />
  </button>

 <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginLeft: 8 }}>
 {filtered.length} thông báo
 </span>
 </div>
 )}
 </div>
 );
}
