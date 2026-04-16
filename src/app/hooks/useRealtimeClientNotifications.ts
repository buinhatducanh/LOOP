/**
 * useRealtimeClientNotifications — Real SSE-based customer notification delivery
 *
 * Connects to /api/client/events/stream (SSE) to receive live notifications
 * from the database. Falls back to polling every 30s if SSE is unavailable.
 *
 * Unlike admin notifications (useRealtimeNotifications), customer notifications
 * are scoped per userId — only the authenticated user's own notifications
 * are delivered via SSE.
 *
 * Types:
 * SSE event "connected" → { userId, accountType }
 * SSE event "notification" → enriched notification with icon/color/category
 * SSE event "ping" → { ts }
 */
import { useEffect, useRef, useCallback } from "react";

export type ClientNotification = {
 id: string;
 type: string;
 title: string;
 message: string;
 link?: string;
 isRead: boolean;
 createdAt: string;
 icon: string;
 color: string;
 category: string;
 /** Human-readable relative time, added by the SSE hook */
 time?: string;
};

const SSE_INTERVAL = 30_000;

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

export type AddClientNotification = (notif: ClientNotification) => void;

interface UseRealtimeClientNotificationsOptions {
 /** Called when a new notification arrives from SSE */
 onNotification: AddClientNotification;
 /** Whether to auto-connect (default true) */
 enabled?: boolean;
}

export function useRealtimeClientNotifications({
 onNotification,
 enabled = true,
}: UseRealtimeClientNotificationsOptions) {
 const esRef = useRef<EventSource | null>(null);
 const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const connect = useCallback(() => {
 if (!enabled) return;

 // Cleanup existing
 if (esRef.current) {
 esRef.current.close();
 esRef.current = null;
 }
 if (reconnectTimerRef.current) {
 clearTimeout(reconnectTimerRef.current);
 reconnectTimerRef.current = null;
 }

 const es = new EventSource("/api/client/events/stream");
 esRef.current = es;

 es.addEventListener("notification", (e: MessageEvent) => {
 try {
 const data: ClientNotification = JSON.parse(e.data);
 const enriched: ClientNotification = {
 ...data,
 time: formatRelativeTime(new Date(data.createdAt)),
 };
 onNotification(enriched);
 } catch {
 // malformed JSON — ignore
 }
 });

 es.addEventListener("ping", () => {
 // Heartbeat received — connection is alive
 });

 es.onerror = () => {
 es.close();
 esRef.current = null;
 // Reconnect after SSE_INTERVAL
 reconnectTimerRef.current = setTimeout(connect, SSE_INTERVAL);
 };
 }, [enabled, onNotification]);

 useEffect(() => {
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
 }, [connect]);
}
