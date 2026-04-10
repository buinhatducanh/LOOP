"use client";

/**
 * Audit Log Admin Page — /admin/audit-log
 * Read-only audit trail. RBAC: ceo + super_admin only.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Calendar, Activity, User, Database, Search, Filter,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string | null; avatar: string | null } | null;
};

type UserOption = { id: string; name: string | null; email: string | null };

// ── Config ────────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  create:   { label: "Tạo",     color: DS.green,        bg: "rgba(124,181,160,0.12)" },
  update:   { label: "Cập nhật", color: DS.cosmicBlue,  bg: "rgba(79,125,243,0.12)" },
  delete:   { label: "Xóa",     color: DS.red,          bg: "rgba(204,51,68,0.12)" },
  read:     { label: "Xem",      color: DS.text4,         bg: "rgba(148,163,184,0.12)" },
  login:    { label: "Đăng nhập", color: DS.cosmicPurple, bg: "rgba(107,61,245,0.12)" },
  logout:   { label: "Đăng xuất", color: DS.gold,        bg: "rgba(230,199,95,0.12)" },
  approve:  { label: "Duyệt",    color: DS.green,        bg: "rgba(124,181,160,0.12)" },
  reject:   { label: "Từ chối",  color: DS.red,          bg: "rgba(204,51,68,0.12)" },
  upload:   { label: "Upload",   color: DS.cosmicCyan,   bg: "rgba(98,197,235,0.12)" },
};

const COMMON_ACTIONS = ["create", "update", "delete", "read", "login", "logout", "approve", "reject", "upload"];
const COMMON_RESOURCES = [
  "team", "orders", "contracts", "invoices", "expenses", "blog-posts",
  "projects", "services", "notifications", "quests", "lp-awards",
  "lp-transactions", "settings", "users", "roles",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTimestamp(d: string | null) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return date.toLocaleString("vi-VN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

function fmtDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${DS.border}`,
    borderRadius: 8,
    padding: "0.4rem 0.75rem",
    color: DS.text,
    fontSize: 12,
    fontFamily: DS.body,
    outline: "none",
    boxSizing: "border-box",
  };
}

// ── Action Badge ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action.toLowerCase()] ?? {
    label: action,
    color: DS.text4,
    bg: "rgba(148,163,184,0.12)",
  };
  return (
    <span style={{
      color: cfg.color, background: cfg.bg,
      borderRadius: 6, padding: "2px 8px",
      fontSize: 10, fontWeight: 600,
      fontFamily: DS.mono, letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Expanded Row ─────────────────────────────────────────────────────────────

function ExpandedRow({ log }: { log: AuditLog }) {
  return (
    <tr>
      <td colSpan={7} style={{ padding: "0.75rem 1rem", background: `${DS.bg}90` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {log.oldValues && Object.keys(log.oldValues).length > 0 && (
            <div>
              <div style={{
                color: DS.text4, fontSize: 10, fontWeight: 700,
                fontFamily: DS.mono, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: "0.375rem",
              }}>
                Giá trị cũ
              </div>
              <pre style={{
                background: DS.bg, border: `1px solid ${DS.border}`,
                borderRadius: 6, padding: "0.5rem 0.75rem",
                color: DS.red, fontSize: 11,
                fontFamily: DS.mono,
                overflow: "auto", maxHeight: 120,
                margin: 0,
              }}>
                {JSON.stringify(log.oldValues, null, 2)}
              </pre>
            </div>
          )}
          {log.newValues && Object.keys(log.newValues).length > 0 && (
            <div>
              <div style={{
                color: DS.text4, fontSize: 10, fontWeight: 700,
                fontFamily: DS.mono, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: "0.375rem",
              }}>
                Giá trị mới
              </div>
              <pre style={{
                background: DS.bg, border: `1px solid ${DS.border}`,
                borderRadius: 6, padding: "0.5rem 0.75rem",
                color: DS.green, fontSize: 11,
                fontFamily: DS.mono,
                overflow: "auto", maxHeight: 120,
                margin: 0,
              }}>
                {JSON.stringify(log.newValues, null, 2)}
              </pre>
            </div>
          )}
          {!log.oldValues && !log.newValues && (
            <div style={{ color: DS.text4, fontSize: 12, fontStyle: "italic" }}>
              Không có chi tiết thay đổi
            </div>
          )}
        </div>
        {log.ipAddress && (
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: "0.5rem" }}>
            IP: {log.ipAddress}
            {log.userAgent && (
              <span style={{ marginLeft: "1rem", color: DS.text4 }}>
                UA: {log.userAgent.slice(0, 80)}{log.userAgent.length > 80 ? "…" : ""}
              </span>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log, isExpanded, onToggle }: {
  log: AuditLog;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails = (log.oldValues || log.newValues || log.ipAddress);

  return (
    <>
      <tr style={{
        borderBottom: `1px solid ${DS.border}`,
        transition: "background 0.1s",
        cursor: hasDetails ? "pointer" : "default",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        onClick={hasDetails ? onToggle : undefined}
      >
        <td style={{ padding: "0.75rem 1rem" }}>
          <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
            {fmtTimestamp(log.createdAt)}
          </span>
        </td>
        <td style={{ padding: "0.75rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: `${DS.cosmicPurple}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: DS.cosmicPurple,
              flexShrink: 0,
            }}>
              {log.user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <div style={{ color: DS.text2, fontSize: 12, fontWeight: 600 }}>
                {log.user?.name ?? log.userId?.slice(0, 8) ?? "—"}
              </div>
              {log.user?.email && (
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                  {log.user.email}
                </div>
              )}
            </div>
          </div>
        </td>
        <td style={{ padding: "0.75rem 1rem" }}>
          <ActionBadge action={log.action} />
        </td>
        <td style={{ padding: "0.75rem 1rem" }}>
          <span style={{
            color: DS.text3, fontSize: 12, fontWeight: 500,
            fontFamily: DS.mono,
          }}>
            {log.resource}
          </span>
        </td>
        <td style={{ padding: "0.75rem 1rem" }}>
          <span style={{
            color: DS.text4, fontSize: 11, fontFamily: DS.mono,
            maxWidth: 100, display: "block",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
            title={log.resourceId ?? ""}
          >
            {log.resourceId
              ? log.resourceId.length > 20
                ? log.resourceId.slice(0, 20) + "…"
                : log.resourceId
              : "—"}
          </span>
        </td>
        <td style={{ padding: "0.75rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {hasDetails && (
              <span style={{ color: DS.text4, fontSize: 11 }}>
                {isExpanded ? "Thu gọn" : "Xem chi tiết"}
              </span>
            )}
            {hasDetails && (
              isExpanded
                ? <ChevronUp size={13} style={{ color: DS.text4 }} />
                : <ChevronDown size={13} style={{ color: DS.text4 }} />
            )}
          </div>
        </td>
      </tr>
      {isExpanded && <ExpandedRow log={log} />}
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [page, setPage] = useState(1);

  // Filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return fmtDateInput(d);
  });
  const [toDate, setToDate] = useState(fmtDateInput(new Date()));
  const [userFilter, setUserFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log", page, fromDate, toDate, userFilter, resourceFilter, actionFilter],
    queryFn: () => {
      const params: Record<string, string | number> = { limit: 50, page };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (userFilter) params.userId = userFilter;
      if (resourceFilter) params.resource = resourceFilter;
      if (actionFilter) params.action = actionFilter;
      return adminApi.get<{
        data: AuditLog[];
        pagination: { total: number; page: number; totalPages: number };
      }>("/api/admin/audit-log", { params });
    },
  });

  // Users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ["admin", "audit-log-users"],
    queryFn: () => adminApi.get<{ data: UserOption[] }>("/api/admin/team", { params: { limit: 200 } }),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };
  const users = usersData?.data ?? [];

  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const eventsToday = logs.filter(l => l.createdAt?.startsWith(today)).length +
    (isLoading ? 0 : 0); // We'll compute from full dataset
  const eventsThisWeek = logs.filter(l => {
    const d = l.createdAt?.slice(0, 10);
    return d && d >= weekAgo && d <= today;
  }).length;

  // Most active user (from current page — approximate)
  const userCountMap = new Map<string, number>();
  for (const log of logs) {
    if (log.userId) userCountMap.set(log.userId, (userCountMap.get(log.userId) ?? 0) + 1);
  }
  const mostActiveEntry = [...userCountMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostActiveUser = mostActiveEntry
    ? users.find(u => u.id === mostActiveEntry[0])?.name ?? mostActiveEntry[0].slice(0, 8)
    : "—";

  // Most accessed resource
  const resourceCountMap = new Map<string, number>();
  for (const log of logs) {
    resourceCountMap.set(log.resource, (resourceCountMap.get(log.resource) ?? 0) + 1);
  }
  const mostAccessedEntry = [...resourceCountMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostAccessed = mostAccessedEntry?.[0] ?? "—";

  const toggleExpand = (id: string) =>
    setExpandedId(prev => prev === id ? null : id);

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: DS.text, fontSize: "1.4rem", fontWeight: 800, fontFamily: DS.heading }}>
            Nhật ký hệ thống
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 2 }}>
            Theo dõi mọi thao tác — chỉ CEO &amp; Super Admin được xem
          </p>
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            background: showFilters ? `${DS.cosmicPurple}20` : DS.bgCard,
            border: `1px solid ${showFilters ? DS.cosmicPurple : DS.border}`,
            borderRadius: 8, padding: "0.4rem 1rem",
            color: showFilters ? DS.cosmicPurple : DS.text3,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: DS.body, display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Filter size={14} />
          {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
        <StatCard
          label="Sự kiện hôm nay"
          value={eventsToday}
          color={DS.pink}
          icon={<Calendar size={14} />}
          loading={isLoading}
        />
        <StatCard
          label="Sự kiện tuần này"
          value={eventsThisWeek}
          color={DS.cosmicBlue}
          icon={<Activity size={14} />}
          loading={isLoading}
        />
        <StatCard
          label="Người hoạt động nhiều nhất"
          value={mostActiveUser}
          color={DS.cosmicPurple}
          icon={<User size={14} />}
          loading={isLoading}
          isText
        />
        <StatCard
          label="Resource được truy cập nhiều nhất"
          value={mostAccessed}
          color={DS.gold}
          icon={<Database size={14} />}
          loading={isLoading}
          isText
        />
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", marginBottom: "1rem" }}
          >
            <div style={{
              background: DS.bgCard, border: `1px solid ${DS.border}`,
              borderRadius: 12, padding: "1rem",
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.75rem",
            }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => { setFromDate(e.target.value); setPage(1); }}
                  style={inputStyle()}
                />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => { setToDate(e.target.value); setPage(1); }}
                  style={inputStyle()}
                />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  Người dùng
                </label>
                <select
                  value={userFilter}
                  onChange={e => { setUserFilter(e.target.value); setPage(1); }}
                  style={{ ...inputStyle() }}
                >
                  <option value="">Tất cả</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email ?? u.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  Resource
                </label>
                <select
                  value={resourceFilter}
                  onChange={e => { setResourceFilter(e.target.value); setPage(1); }}
                  style={{ ...inputStyle() }}
                >
                  <option value="">Tất cả</option>
                  {COMMON_RESOURCES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>
                  Thao tác
                </label>
                <select
                  value={actionFilter}
                  onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                  style={{ ...inputStyle() }}
                >
                  <option value="">Tất cả</option>
                  {COMMON_ACTIONS.map(a => (
                    <option key={a} value={a}>
                      {(ACTION_CONFIG[a] ?? { label: a }).label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
              {["Thời gian", "Người dùng", "Hành động", "Resource", "Resource ID", ""].map(h => (
                <th key={h} style={{
                  padding: "0.625rem 1rem",
                  textAlign: "left",
                  color: DS.text4, fontSize: 11, fontWeight: 600,
                  fontFamily: DS.mono, letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>
                  Đang tải nhật ký...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>
                  Không có bản ghi nào
                </td>
              </tr>
            ) : logs.map(log => (
              <LogRow
                key={log.id}
                log={log}
                isExpanded={expandedId === log.id}
                onToggle={() => toggleExpand(log.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <span style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            Trang {pagination.page} / {pagination.totalPages} — {pagination.total} bản ghi
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                background: "transparent",
                border: `1px solid ${DS.border}`,
                borderRadius: 6, padding: "4px 8px",
                color: DS.text3, cursor: page <= 1 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              style={{
                background: "transparent",
                border: `1px solid ${DS.border}`,
                borderRadius: 6, padding: "4px 8px",
                color: DS.text3, cursor: page >= pagination.totalPages ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, color, icon, loading, isText = false,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
  loading: boolean;
  isText?: boolean;
}) {
  return (
    <div style={{
      background: DS.bgCard, border: `1px solid ${DS.border}`,
      borderRadius: 10, padding: "0.75rem 1rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{
          color: DS.text4, fontSize: 10,
          fontFamily: DS.mono, letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{
        color: isText ? DS.text2 : color,
        fontSize: isText ? "0.85rem" : "1.4rem",
        fontWeight: 700, fontFamily: DS.heading,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {loading ? "—" : value}
      </div>
    </div>
  );
}
