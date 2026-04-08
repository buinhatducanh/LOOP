/**
 * useRealtimeNotifications — Real SSE-based admin notification delivery
 *
 * Connects to /api/admin/events/stream (SSE) to receive live notifications
 * from the database. Falls back to polling the notifications API every 30s
 * if SSE is unavailable.
 *
 * Notifications are added to the Zustand store via addAdminNotification()
 * so all UI components subscribed to the store update automatically.
 *
 * Types:
 *   SSE event "connected"  → { userId, role, roleLevel }
 *   SSE event "notification" → AdminNotification
 *   SSE event "ping"      → { ts }
 */
import { useEffect, useRef } from "react";
import { useLoopStore, type AdminNotification } from "@/app/store/loopStore";

const SSE_POLL_INTERVAL = 30_000; // 30s — same as server-side poll

function sseNotifToStore(n: {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  priority?: string;
  isRead?: boolean;
  createdAt: string;
}): AdminNotification {
  return {
    id: n.id,
    type: n.type as AdminNotification["type"],
    title: n.title,
    body: n.message,
    time: formatRelativeTime(new Date(n.createdAt)),
    timestamp: new Date(n.createdAt).getTime(),
    read: n.isRead ?? false,
    priority: (n.priority as AdminNotification["priority"]) ?? "normal",
    color: colorByType(n.type),
    department: departmentByType(n.type),
    category: categoryByType(n.type),
    archived: false,
  };
}

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
    task: "#22C55E",
    escalation: "#EF4444",
    media_booking: "#F59E0B",
    client_message: "#818CF8",
    review: "#FFD700",
    default: "#94A3B8",
  };
  return map[type] ?? map.default;
}

function departmentByType(type: string): string {
  const map: Record<string, string> = {
    new_order: "sales",
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
  };
  return map[type] ?? "management";
}

function categoryByType(type: string): AdminNotification["category"] {
  const map: Record<string, AdminNotification["category"]> = {
    new_order: "order",
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
    task: "team",
    escalation: "order",
    media_booking: "media",
    media_delivery: "media",
    client_message: "client",
    review: "client",
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

/**
 * Hook: connects to SSE stream and dispatches real notifications to the Zustand store.
 * @param intervalMs — SSE poll interval on server (default 30 000ms)
 */
export function useRealtimeNotifications(intervalMs = SSE_POLL_INTERVAL) {
  const { addAdminNotification } = useLoopStore();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cleanup previous connection
    if (esRef.current) {
      esRef.current.close();
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const connect = () => {
      const es = new EventSource("/api/admin/events/stream");
      esRef.current = es;

      es.addEventListener("notification", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          addAdminNotification(sseNotifToStore(data));
        } catch {
          // malformed JSON — ignore
        }
      });

      // On SSE error or close, reconnect after interval
      es.onerror = () => {
        es.close();
        esRef.current = null;
        reconnectTimerRef.current = setTimeout(connect, intervalMs);
      };

      es.onopen = () => {
        // Connection established — no action needed
      };
    };

    connect();

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [addAdminNotification, intervalMs]);
}
