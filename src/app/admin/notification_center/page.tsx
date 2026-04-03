"use client";

/**
 * Notification Center Admin Page — LOOP Solutions
 * Route: /admin/notification_center
 *
 * Full-featured notification management with:
 * 6 category filters · priority filter · department filter
 * read filter · archived inbox · search · bulk actions · pagination
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Bell, RefreshCw, CheckCheck, Trash2, MessageSquare, Zap, AlertTriangle,
  Info, Search, X, Check, Archive, Eye, EyeOff,
  ChevronDown, ChevronLeft, ChevronRight,
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

// ── Mock data ────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Đơn hàng mới #ORD-2605", body: "FinCorp Vietnam vừa đặt dịch vụ Website Development trị giá 180M VNĐ. Cần phân công PM trong 24h.", type: "new_order", priority: "urgent", category: "order", department: "sales", relatedOrderId: "ORD-2605", read: false, archived: false, createdAt: "2026-04-04T10:30:00", time: "10:30 hôm nay", color: DS.blue },
  { id: "n2", title: "Thanh toán thành công", body: "VNRetail JSC đã thanh toán 175M VNĐ cho đơn hàng VNRetail Platform v3. Đơn hàng chuyển sang trạng thái paid.", type: "payment", priority: "high", category: "finance", department: "finance", read: false, archived: false, createdAt: "2026-04-04T09:15:00", time: "09:15 hôm nay", color: DS.green },
  { id: "n3", title: "Khách hàng nhắn tin mới", body: "HealthTech VN phản hồi về demo MedApp: cần chỉnh sửa 3 mục trong dashboard. PM Akira đã nhận và đang xử lý.", type: "client_message", priority: "high", category: "client", department: "engineering", relatedOrderId: "ORD-2599", read: false, archived: false, createdAt: "2026-04-04T08:45:00", time: "08:45 hôm nay", color: DS.cyan },
  { id: "n4", title: "Demo đã gửi — FinDash Enterprise", body: "Demo bản mới nhất đã được gửi đến FinCorp Vietnam qua email. Chờ phản hồi trong 48h.", type: "demo_approved", priority: "normal", category: "order", department: "engineering", relatedOrderId: "ORD-2603", read: false, archived: false, createdAt: "2026-04-03T17:20:00", time: "17:20 hôm qua", color: DS.purple },
  { id: "n5", title: "Thưởng LP Q1/2026 đã phê duyệt", body: "Akira Sato nhận 10,000 LP thưởng KPI Q1/2026 — Đạt 140% target. Thưởng đã được cộng vào tài khoản.", type: "lp", priority: "normal", category: "team", department: "hr", read: true, archived: false, createdAt: "2026-04-03T16:00:00", time: "16:00 hôm qua", color: DS.amber },
  { id: "n6", title: "Media booking mới — HealthTech VN", body: "Yêu cầu chụp ảnh sản phẩm + video quảng cáo 30s. Budget: 25M VNĐ. Deadline: 15/04/2026.", type: "media_booking", priority: "high", category: "media", department: "media", read: false, archived: false, createdAt: "2026-04-03T14:30:00", time: "14:30 hôm qua", color: DS.amber },
  { id: "n7", title: "Nhiệm vụ mới: Code review LOOP OS v2.1", body: "Ryo Hashimoto được assign task LOOP OS sprint 12. Due: 05/04/2026. Estimated LP reward: 2,400.", type: "task", priority: "normal", category: "team", department: "engineering", read: true, archived: false, createdAt: "2026-04-03T11:00:00", time: "11:00 hôm qua", color: DS.blue },
  { id: "n8", title: "Escalation: VNRetail Platform — lỗi thanh toán", body: "Khách hàng phản ánh lỗi thanh toán Stripe không hoạt động. Cần kiểm tra trong 2h.", type: "escalation", priority: "urgent", category: "system", department: "engineering", relatedOrderId: "ORD-2602", read: false, archived: false, createdAt: "2026-04-03T10:00:00", time: "10:00 hôm qua", color: DS.red },
  { id: "n9", title: "Blog post mới: 'Xu hướng UX 2026'", body: "Mei Lin vừa publish blog post mới. 3 backlink từ partner sites đã được xác nhận.", type: "review", priority: "low", category: "team", department: "marketing", read: true, archived: false, createdAt: "2026-04-02T16:00:00", time: "16:00 ngày 02/04", color: DS.purple },
  { id: "n10", title: "Media delivery: EduViet Foundation", body: "Hoàn thành bàn giao 12 video + 24 banner assets. File đã upload lên Google Drive.", type: "media_delivery", priority: "normal", category: "media", department: "media", read: true, archived: false, createdAt: "2026-04-02T15:30:00", time: "15:30 ngày 02/04", color: DS.cyan },
  { id: "n11", title: "Đơn hàng cũ #ORD-2585 đã hủy", body: "StartupHub VN yêu cầu hủy đơn Landing Page. Đã refund 25M VNĐ. LP reward không được áp dụng.", type: "system", priority: "low", category: "system", department: "sales", read: true, archived: false, createdAt: "2026-04-01T09:00:00", time: "09:00 ngày 01/04", color: DS.text4 },
];

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
  client_message: <MessageSquare size={14} />,
  demo_approved: <CheckCheck size={14} />,
  system: <BarChart3 size={14} />,
  task: <Bell size={14} />,
  lp: <Zap size={14} />,
  review: <Star size={14} />,
  media_booking: <Camera size={14} />,
  media_delivery: <Camera size={14} />,
  escalation: <AlertTriangle size={14} />,
};

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

  // Local state for notifications (mirrors BE DB)
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  // Fetch from API
  const { data, isFetching } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => adminApi.get<{ data: Notification[] }>("/api/admin/notifications", { params: {} }),
  });

  const apiNotifications = data?.data ?? [];

  // Use API data if available, fallback to local mock
  const allNotifs = apiNotifications.length > 0 ? apiNotifications : notifications;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const archiveNotif = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));
  };
  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const bulkRead = (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    setSelectedIds(new Set());
  };
  const bulkArchive = (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, archived: true } : n));
    setSelectedIds(new Set());
  };
  const bulkDelete = (ids: string[]) => {
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    setSelectedIds(new Set());
  };

  // ── Filtered & paginated ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return allNotifs.filter(n => {
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
  }, [allNotifs, search, category, department, priority, readFilter, showArchived]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const unreadCount = allNotifs.filter(n => !n.read && !n.archived).length;
  const urgentCount = allNotifs.filter(n => !n.read && n.priority === "urgent" && !n.archived).length;

  // Category counts
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allNotifs.filter(n => !n.archived).forEach(n => {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
      if (!n.read) counts[`${n.category}_unread`] = (counts[`${n.category}_unread`] ?? 0) + 1;
    });
    counts["all"] = allNotifs.filter(n => !n.archived).length;
    counts["all_unread"] = unreadCount;
    return counts;
  }, [allNotifs, unreadCount]);

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

  const handleBulkRead = () => { bulkRead([...selectedIds]); };
  const handleBulkArchive = () => { bulkArchive([...selectedIds]); };
  const handleBulkDelete = () => { bulkDelete([...selectedIds]); };

  // Reset page when filters change
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFilterChange = (setter: (v: any) => void) => (v: any) => { setter(v); setPage(0); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Trung tâm thông báo
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {unreadCount} chưa đọc · {allNotifs.filter(n => !n.archived).length} tổng
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
          <button onClick={markAllRead}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={selectAll}
            style={{
              width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
              background: selectedIds.size === pageItems.length && pageItems.length > 0 ? DS.blue : "transparent",
              border: selectedIds.size === pageItems.length && pageItems.length > 0 ? "none" : `1.5px solid ${DS.border}`,
              cursor: "pointer",
            }}>
            {selectedIds.size === pageItems.length && pageItems.length > 0 && <Check size={11} style={{ color: "#fff" }} />}
          </button>
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
            Chọn tất cả · Trang {page + 1}/{Math.max(1, totalPages)} · {filtered.length} kết quả
          </span>
        </div>
      </div>

      {/* Notification list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {pageItems.length === 0 ? (
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
          const ncfg = { color: TYPE_ICON[n.type] ? DS.blue : DS.text4 };

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
                onClick={() => { markRead(n.id); setExpandedId(isExpanded ? null : n.id); }}>
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
                  <button onClick={e => { e.stopPropagation(); archiveNotif(n.id); }}
                    title="Lưu trữ"
                    style={{
                      width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "none", cursor: "pointer", color: DS.text5,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = rgba(DS.purple, 0.1); e.currentTarget.style.color = DS.purple; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = DS.text5; }}>
                    <Archive size={12} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
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
