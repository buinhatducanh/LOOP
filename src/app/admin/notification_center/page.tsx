"use client";

/**
 * Notification Center Admin Page — LOOP Solutions
 * Route: /admin/notification_center
 * Wire: /api/admin/notifications
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Bell, RefreshCw, CheckCheck, Trash2, MessageSquare, Zap, AlertTriangle, Info } from "lucide-react";

const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  info:     { icon: <Info size={14} />, color: DS.blue, bg: "rgba(59,130,246,0.1)" },
  warning:  { icon: <AlertTriangle size={14} />, color: DS.amber, bg: "rgba(245,158,11,0.1)" },
  success:  { icon: <CheckCheck size={14} />, color: DS.green, bg: "rgba(34,197,94,0.1)" },
  lp:       { icon: <Zap size={14} />, color: DS.purple, bg: "rgba(139,92,246,0.1)" },
  message:  { icon: <MessageSquare size={14} />, color: DS.cyan, bg: "rgba(6,182,212,0.1)" },
};

const TYPE_DEFAULT = { icon: <Bell size={14} />, color: DS.text4, bg: "rgba(100,116,139,0.1)" };

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" }); }
  catch { return String(d); }
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

function NotificationItem({ n, onMarkRead, onDelete }: {
  n: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_ICONS[n.type] ?? TYPE_DEFAULT;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: n.isRead ? DS.bg : DS.bgCard,
        border: `1px solid ${n.isRead ? DS.border : `${cfg.color}30`}`,
        borderRadius: 10,
        padding: "0.875rem 1rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        transition: "all 0.15s",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
        color: cfg.color,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ color: DS.text, fontWeight: n.isRead ? 400 : 700, fontSize: 13, marginBottom: 2 }}>
            {n.title}
          </div>
          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, flexShrink: 0 }}>
            {fmtDate(n.createdAt)}
          </div>
        </div>
        <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.5 }}>{n.message}</div>
        {n.type && (
          <span style={{ display: "inline-block", marginTop: 6, background: cfg.bg, color: cfg.color, padding: "1px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>
            {n.type}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {!n.isRead && (
          <button
            onClick={() => onMarkRead(n.id)}
            style={{ padding: "4px 8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, color: DS.green, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}
            title="Mark as read"
          >
            <CheckCheck size={11} />
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: DS.red, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationCenterPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "notifications", unreadOnly],
    queryFn: () =>
      adminApi.get<{ data: Notification[]; pagination: { total: number } }>("/api/admin/notifications", {
        params: { limit: 50, ...(unreadOnly ? { unread: "true" } : {}) },
      }),
  });

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Trung tâm thông báo
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {notifications.length} thông báo · {unreadCount} chưa đọc
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            style={{
              padding: "6px 14px",
              background: unreadOnly ? "rgba(59,130,246,0.1)" : DS.bgCard,
              border: `1px solid ${unreadOnly ? "rgba(59,130,246,0.4)" : DS.border}`,
              borderRadius: 10,
              color: unreadOnly ? DS.blue : DS.text3,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: DS.mono,
              fontWeight: unreadOnly ? 600 : 400,
            }}
          >
            Chỉ chưa đọc
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "notifications"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      {/* Unread indicator */}
      {unreadCount > 0 && (
        <div style={{
          background: `${DS.blue}10`,
          border: `1px solid ${DS.blue}30`,
          borderRadius: 10,
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: DS.blue,
          fontSize: 12,
          fontFamily: DS.mono,
        }}>
          <Bell size={14} />
          <span>Bạn có <strong>{unreadCount}</strong> thông báo chưa đọc</span>
        </div>
      )}

      {/* Notification list */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          background: DS.bgCard,
          border: `1px solid ${DS.border}`,
          borderRadius: 12,
          textAlign: "center",
          padding: "4rem",
          color: DS.text4,
        }}>
          <Bell size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>Không có thông báo nào</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Mọi thứ đã được cập nhật!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {notifications.map(n => (
            <NotificationItem
              key={n.id}
              n={n}
              onMarkRead={() => {/* mark read mutation */}}
              onDelete={() => {/* delete mutation */}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
