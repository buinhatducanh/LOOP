"use client";

/**
 * Audit Log Admin Page — /admin/audit_log
 * Read-only — shows system activity log
 * RBAC: ceo + super_admin only (roleLevel ≤ 0)
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Search, Activity, User, FileText, ShoppingCart,
  Settings, Shield, Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuditLog = {
  id: string;
  userId: string;
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

type AuditRow = AuditLog & { _expanded?: boolean };

// ── Config ────────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  create:  { label: "Tạo",    color: DS.green,       bg: "rgba(124,181,160,0.12)" },
  update:  { label: "Sửa",    color: DS.cosmicBlue,  bg: "rgba(79,125,243,0.12)" },
  delete:  { label: "Xóa",    color: DS.red,          bg: "rgba(204,51,68,0.12)" },
  read:    { label: "Xem",    color: DS.text4,        bg: "rgba(148,163,184,0.12)" },
  login:   { label: "Đăng nhập", color: DS.cosmicPurple, bg: "rgba(107,61,245,0.12)" },
  logout:  { label: "Đăng xuất", color: DS.lavender,  bg: "rgba(176,124,198,0.12)" },
};

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  orders:       <ShoppingCart size={12} />,
  team:         <User size={12} />,
  "blog-posts": <FileText size={12} />,
  services:     <Zap size={12} />,
  projects:     <Activity size={12} />,
  settings:     <Settings size={12} />,
  "lp-awards":  <Zap size={12} />,
  "audit-logs": <Shield size={12} />,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTs(d: string): string {
  try {
    return new Date(d).toLocaleString("vi-VN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return d; }
}

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: DS.text4, bg: "rgba(148,163,184,0.12)" };
  return (
    <span style={{
      color: cfg.color, background: cfg.bg,
      borderRadius: 6, padding: "2px 8px",
      fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.04em",
    }}>
      {cfg.label}
    </span>
  );
}

function ResourcePill({ resource }: { resource: string }) {
  return (
    <span style={{
      color: DS.text3, background: `${DS.cosmicPurple}20`,
      borderRadius: 6, padding: "2px 8px",
      fontSize: 11, fontWeight: 600, fontFamily: DS.mono,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {RESOURCE_ICONS[resource] ?? null}
      {resource}
    </span>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${DS.border}`,
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    color: DS.text,
    fontSize: 13,
    fontFamily: DS.body,
    outline: "none",
    boxSizing: "border-box",
  };
}

function tinyBtn(color: string): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${color}40`,
    borderRadius: 6,
    padding: "4px 6px",
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
  };
}

// ── Diff View ────────────────────────────────────────────────────────────────

function DiffView({ old: oldVal, new: newVal }: { old: Record<string, unknown> | null; new: Record<string, unknown> | null }) {
  if (!oldVal && !newVal) return null;

  const allKeys = [...new Set([...Object.keys(oldVal ?? {}), ...Object.keys(newVal ?? {})])];
  const changes: { key: string; from: unknown; to: unknown }[] = [];

  for (const key of allKeys) {
    const from = oldVal?.[key];
    const to = newVal?.[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ key, from, to });
    }
  }

  if (changes.length === 0) return null;

  return (
    <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {changes.map(({ key, from, to }) => (
        <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, textAlign: "right", paddingRight: 6 }}>
            {key}
          </span>
          <span style={{
            background: `${DS.red}20`, color: DS.red,
            borderRadius: 4, padding: "1px 6px",
            fontSize: 11, fontFamily: DS.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {from == null ? "—" : JSON.stringify(from)}
          </span>
          <span style={{
            background: `${DS.green}20`, color: DS.green,
            borderRadius: 4, padding: "1px 6px",
            fontSize: 11, fontFamily: DS.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {to == null ? "—" : JSON.stringify(to)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const RESOURCES = [
  "orders", "team", "blog-posts", "services", "projects",
  "lp-awards", "settings", "notifications", "figma-demos",
];
const ACTIONS = ["create", "update", "delete", "read", "login", "logout"];

export default function AuditLogPage() {
  const [userIdFilter, setUserIdFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log", userIdFilter, resourceFilter, actionFilter, fromDate, toDate, page],
    queryFn: () => {
      const params: Record<string, string | number> = { limit: 50, page };
      if (userIdFilter) params.userId = userIdFilter;
      if (resourceFilter) params.resource = resourceFilter;
      if (actionFilter) params.action = actionFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      return adminApi.get<{
        data: AuditLog[];
        pagination: { total: number; page: number; totalPages: number };
      }>("/api/admin/audit-log", { params });
    },
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const today = new Date().toDateString();
  const todayCount = logs.filter(l => new Date(l.createdAt).toDateString() === today).length;
  const thisWeekCount = Math.min(logs.length, 7); // simplified

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: DS.text, fontSize: "1.4rem", fontWeight: 800, fontFamily: DS.heading }}>
            Nhật ký hoạt động
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 2 }}>
            Read-only — chỉ CEO & Super Admin được xem
          </p>
        </div>
        <div style={{
          background: `${DS.cosmicPurple}15`, border: `1px solid ${DS.cosmicPurple}40`,
          borderRadius: 10, padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: 8,
        }}>
          <Shield size={16} color={DS.cosmicPurple} />
          <span style={{ color: DS.cosmicPurple, fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
            Chỉ Super Admin
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Hôm nay", value: isLoading ? "—" : todayCount, color: DS.pink },
          { label: "Tổng sự kiện", value: isLoading ? "—" : pagination.total, color: DS.text },
          { label: "Trang hiện tại", value: `${pagination.page}/${pagination.totalPages}`, color: DS.text4 },
          { label: "Đã lọc", value: (resourceFilter || actionFilter || fromDate || toDate || userIdFilter) ? "Có" : "Tất cả", color: DS.text4 },
        ].map(s => (
          <div key={s.label} style={{
            background: DS.bgCard, border: `1px solid ${DS.border}`,
            borderRadius: 10, padding: "0.75rem 1rem",
          }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ color: s.color, fontSize: "1.4rem", fontWeight: 700, fontFamily: DS.heading }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`,
        borderRadius: 12, padding: "1rem", marginBottom: "1rem",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
              Người dùng
            </label>
            <input
              value={userIdFilter}
              onChange={e => { setUserIdFilter(e.target.value); setPage(1); }}
              placeholder="User ID..."
              style={inputStyle()}
            />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
              Resource
            </label>
            <select value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(1); }}
              style={inputStyle()}>
              <option value="">Tất cả</option>
              {RESOURCES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
              Action
            </label>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              style={inputStyle()}>
              <option value="">Tất cả</option>
              {ACTIONS.map(a => (
                <option key={a} value={a}>{(ACTION_CONFIG[a] ?? { label: a }).label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <button
              onClick={() => {
                setUserIdFilter(""); setResourceFilter(""); setActionFilter("");
                setFromDate(""); setToDate(""); setPage(1);
              }}
              style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "0.5rem 0.75rem", color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.body, flex: 1 }}
            >
              Reset
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
              Từ ngày
            </label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} style={inputStyle()} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
              Đến ngày
            </label>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} style={inputStyle()} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
              {["Thời gian", "Người dùng", "Hành động", "Resource", "Resource ID", ""].map(h => (
                <th key={h} style={{
                  padding: "0.625rem 1rem", textAlign: "left",
                  color: DS.text4, fontSize: 11, fontWeight: 600,
                  fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase",
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
            ) : logs.map(log => {
              const isExpanded = expanded.has(log.id);
              return (
                <>
                  <tr key={log.id} style={{ borderBottom: `1px solid ${DS.border}`, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "0.6rem 1rem" }}>
                      <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        {fmtTs(log.createdAt)}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: `${DS.cosmicPurple}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: DS.cosmicPurple, fontFamily: DS.heading,
                        }}>
                          {log.user?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div style={{ color: DS.text2, fontSize: 12, fontWeight: 600 }}>
                            {log.user?.name ?? log.userId.slice(0, 8)}
                          </div>
                          {log.user?.email && (
                            <div style={{ color: DS.text4, fontSize: 10 }}>{log.user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.6rem 1rem" }}><ActionBadge action={log.action} /></td>
                    <td style={{ padding: "0.6rem 1rem" }}><ResourcePill resource={log.resource} /></td>
                    <td style={{ padding: "0.6rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.resourceId ?? "—"}
                        </span>
                        {log.resourceId && (
                          <button
                            onClick={() => navigator.clipboard.writeText(log.resourceId ?? "")}
                            style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4, fontSize: 11, padding: 0 }}
                            title="Copy ID"
                          >
                            ⎘
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "0.6rem 1rem" }}>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {log.oldValues || log.newValues ? (
                          <button onClick={() => toggleExpand(log.id)}
                            style={{ ...tinyBtn(DS.cosmicPurple), color: DS.cosmicPurple }}>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        ) : null}
                        {log.ipAddress && (
                          <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                            {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${log.id}-diff`}>
                      <td colSpan={6} style={{ padding: "0.75rem 1rem", background: `${DS.bg}50` }}>
                        <DiffView old={log.oldValues ?? null} new={log.newValues ?? null} />
                        {!log.oldValues && !log.newValues && (
                          <span style={{ color: DS.text4, fontSize: 12 }}>Không có dữ liệu thay đổi chi tiết</span>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
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
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ ...tinyBtn(DS.border), color: DS.text3, cursor: page <= 1 ? "not-allowed" : "pointer" }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              style={{ ...tinyBtn(DS.border), color: DS.text3, cursor: page >= pagination.totalPages ? "not-allowed" : "pointer" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
