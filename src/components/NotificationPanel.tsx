"use client";

/**
 * NotificationPanel — Extracted from SiteHeader for lazy loading (next/dynamic).
 * Fetches and displays latest notifications. Reads auth state internally.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

// ── Helpers ────────────────────────────────────────────────────────────────────

import { rgba } from "@/components/ui/utils";

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  locale: string;
  onClose: () => void;
  /** Initial unread count passed from SiteHeader so badge doesn't flash from 0 */
  initialCount: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  time?: string;
  isRead: boolean;
  link?: string;
  type?: string;
  priority?: string;
}

export default function NotificationPanel({ locale, onClose, initialCount }: NotificationPanelProps) {
  const router = useRouter();
  const accountType = useAuthStore(s => s.accountType);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(initialCount);

  // Fetch notifications on mount
  useEffect(() => {
    const authStore = useAuthStore.getState();
    const tokenKey = authStore.accountType === "customer" ? "loop-customer-token" : "loop-staff-token";
    const token = localStorage.getItem(tokenKey);

    fetch("/api/notifications?limit=10", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.items) {
          setNotifications(data.items);
          const unread = data.items.filter((n: NotificationItem) => !n.isRead).length;
          setNotifCount(unread);
        }
      })
      .catch(() => { /* silent fail */ })
      .finally(() => setLoading(false));
  }, []);

  // Mark single as read + navigate
  const markAsRead = useCallback(async (id: string, link?: string) => {
    const authStore = useAuthStore.getState();
    const tokenKey = authStore.accountType === "customer" ? "loop-customer-token" : "loop-staff-token";
    const token = localStorage.getItem(tokenKey);

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setNotifCount(prev => Math.max(0, prev - 1));

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch { /* silent fail */ }

    if (link) {
      onClose();
      router.push(link);
    }
  }, [onClose, router]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const authStore = useAuthStore.getState();
    const tokenKey = authStore.accountType === "customer" ? "loop-customer-token" : "loop-staff-token";
    const token = localStorage.getItem(tokenKey);

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setNotifCount(0);

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ all: true }),
      });
    } catch { /* silent fail */ }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      style={{
        position: "absolute", top: "calc(100% + 8px)", right: 0,
        width: 380,
        maxHeight: 480,
        background: rgba(DS.bgCosmic, 0.98),
        border: `1px solid ${rgba(DS.pink, 0.2)}`,
        borderRadius: 16,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 20px rgba(236,72,153,0.08)",
        overflow: "hidden", zIndex: 110,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${DS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={14} style={{ color: DS.pink }} />
          <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>Thông báo</span>
          {accountType === "customer" && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(59,130,246,0.12)", color: DS.blue, fontFamily: DS.mono }}>Khách hàng</span>
          )}
          {accountType === "staff" && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(139,92,246,0.12)", color: DS.cosmicPurple, fontFamily: DS.mono }}>Quản trị</span>
          )}
        </div>
        {notifCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: DS.blue, fontSize: 11, fontFamily: DS.mono,
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >
            <CheckCheck size={11} /> Đọc hết
          </button>
        )}
      </div>

      {/* Notification List */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <div style={{ color: DS.text4, fontSize: 12 }}>Đang tải...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <Bell size={32} style={{ color: DS.text5, margin: "0 auto 0.5rem", opacity: 0.3 }} />
            <div style={{ color: DS.text4, fontSize: 12 }}>Không có thông báo nào</div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id, n.link)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 14px",
                cursor: "pointer",
                background: n.isRead ? "transparent" : "rgba(236,72,153,0.04)",
                borderBottom: `1px solid ${DS.border}`,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(236,72,153,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.isRead ? "transparent" : "rgba(236,72,153,0.04)"; }}
            >
              {/* Icon */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "rgba(236,72,153,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bell size={14} style={{ color: DS.pink }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  {!n.isRead && (
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: DS.pink, boxShadow: `0 0 4px ${DS.pink}`,
                      flexShrink: 0,
                    }} />
                  )}
                  <span style={{
                    color: n.isRead ? DS.text3 : DS.text,
                    fontSize: 12, fontWeight: n.isRead ? 500 : 700,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {n.title}
                  </span>
                </div>
                {n.message && (
                  <div style={{
                    color: DS.text4, fontSize: 11, lineHeight: 1.4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {n.message}
                  </div>
                )}
                {n.time && (
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>
                    {n.time}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight size={12} style={{ color: DS.text5, flexShrink: 0, marginTop: 2 }} />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: "10px 16px",
          borderTop: `1px solid ${DS.border}`,
          textAlign: "center",
        }}>
          <button
            onClick={() => {
              onClose();
              if (accountType === "customer") {
                router.push(`/${locale}/khach-hang?tab=notifications`);
              } else {
                router.push("/admin/notification_center");
              }
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: DS.pink, fontSize: 11, fontFamily: DS.mono,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            Xem tất cả thông báo →
          </button>
        </div>
      )}
    </motion.div>
  );
}
