/**
 * useRealtimeNotifications — SSE consumer for admin realtime updates
 *
 * Connects to GET /api/admin/events/stream and dispatches incoming
 * events into the Zustand loopStore so the UI reacts instantly
 * (new orders, LP changes, quest completions, system alerts).
 *
 * Usage:
 *   const { connected, lastEvent, error } = useRealtimeNotifications()
 *
 * Events handled:
 *   connected  → { userId, role, connectedAt }
 *   ping       → heartbeat, { ts }
 *   notification → { id, type, title, body, priority, category, link }
 *   lp_change  → { memberId, memberName, delta, newBalance }
 *   order_new  → { orderId, orderNumber, customerName, status, totalAmount }
 *   quest_complete → { userId, questId, title, lpReward, xpReward }
 *   system_alert → { id, severity, title, message }
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLoopStore, type AdminNotification } from '../app/store/loopStore';

const SSE_URL = '/api/admin/events/stream';
const MAX_RECONNECT = 5;
const RECONNECT_DELAY_MS = 3000;

export interface SseConnectedEvent {
  userId: string;
  role: string;
  connectedAt: string;
}

export interface SseNotificationEvent {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  category: string;
  link?: string;
  color?: string;
}

export interface SseLpChangeEvent {
  memberId: string;
  memberName: string;
  delta: number;
  newBalance: number;
}

export interface SseOrderNewEvent {
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
}

export interface SseQuestCompleteEvent {
  userId: string;
  questId: string;
  title: string;
  lpReward: number;
  xpReward: number;
}

export interface SseSystemAlertEvent {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
}

export type SseEvent =
  | { type: 'connected'; data: SseConnectedEvent }
  | { type: 'ping'; data: { ts: string } }
  | { type: 'notification'; data: SseNotificationEvent }
  | { type: 'lp_change'; data: SseLpChangeEvent }
  | { type: 'order_new'; data: SseOrderNewEvent }
  | { type: 'quest_complete'; data: SseQuestCompleteEvent }
  | { type: 'system_alert'; data: SseSystemAlertEvent };

interface UseRealtimeNotificationsOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Called for every incoming SSE event */
  onEvent?: (event: SseEvent) => void;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { autoConnect = true, onEvent } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<SseEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const esRef = useRef<EventSource | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmounted = useRef(false);

  const { addAdminNotification } = useLoopStore();

  const NOTIF_COLORS: Record<string, string> = {
    order: '#3B82F6',
    finance: '#22C55E',
    team: '#818CF8',
    client: '#06B6D4',
    media: '#F59E0B',
    system: '#94A3B8',
    quest: '#E0115F',
    lp: '#FFD700',
  };

  const dispatchEvent = useCallback((event: SseEvent) => {
    setLastEvent(event);
    setEventCount(c => c + 1);
    onEvent?.(event);

    switch (event.type) {
      case 'notification': {
        const ne = event.data;
        const notif: AdminNotification = {
          id: ne.id,
          userId: '',
          type: ne.type,
          title: ne.title,
          body: ne.body,
          link: ne.link,
          read: false,
          priority: ne.priority,
          category: ne.category,
          department: undefined,
          time: 'Vừa xong',
          color: ne.color ?? NOTIF_COLORS[ne.category] ?? '#818CF8',
          archived: false,
          assignedTo: undefined,
          relatedOrderId: undefined,
          timestamp: Date.now(),
        };
        addAdminNotification(notif);
        break;
      }
      case 'order_new': {
        const oe = event.data;
        const notif: AdminNotification = {
          id: `sse-order-${oe.orderId}`,
          userId: '',
          type: 'new_order',
          title: `Đơn hàng mới #${oe.orderNumber}`,
          body: `Khách hàng ${oe.customerName} vừa đặt đơn ${oe.totalAmount.toLocaleString('vi-VN')} VNĐ`,
          link: `/admin?order=${oe.orderId}`,
          read: false,
          priority: 'high',
          category: 'order',
          department: undefined,
          time: 'Vừa xong',
          color: NOTIF_COLORS.order,
          archived: false,
          assignedTo: undefined,
          relatedOrderId: oe.orderId,
          timestamp: Date.now(),
        };
        addAdminNotification(notif);
        break;
      }
      case 'lp_change': {
        const le = event.data;
        const notif: AdminNotification = {
          id: `sse-lp-${le.memberId}-${Date.now()}`,
          userId: '',
          type: 'lp',
          title: `LP thay đổi — ${le.memberName}`,
          body: `${le.delta >= 0 ? '+' : ''}${le.delta.toLocaleString('vi-VN')} LP · Số dư mới: ${le.newBalance.toLocaleString('vi-VN')}`,
          link: `/admin?tab=leaderboard_admin`,
          read: false,
          priority: 'normal',
          category: 'team',
          department: undefined,
          time: 'Vừa xong',
          color: NOTIF_COLORS.lp,
          archived: false,
          assignedTo: undefined,
          relatedOrderId: undefined,
          timestamp: Date.now(),
        };
        addAdminNotification(notif);
        break;
      }
      case 'quest_complete': {
        const qe = event.data;
        const notif: AdminNotification = {
          id: `sse-quest-${qe.questId}-${Date.now()}`,
          userId: '',
          type: 'review',
          title: `Quest hoàn thành`,
          body: `${qe.title} — Thưởng: ${qe.lpReward} LP + ${qe.xpReward} XP`,
          link: `/admin?tab=quests_events`,
          read: false,
          priority: 'normal',
          category: 'team',
          department: undefined,
          time: 'Vừa xong',
          color: NOTIF_COLORS.quest,
          archived: false,
          assignedTo: undefined,
          relatedOrderId: undefined,
          timestamp: Date.now(),
        };
        addAdminNotification(notif);
        break;
      }
      case 'system_alert': {
        const se = event.data;
        const notif: AdminNotification = {
          id: `sse-alert-${se.id}`,
          userId: '',
          type: 'system',
          title: se.title,
          body: se.message,
          link: undefined,
          read: false,
          priority: se.severity === 'critical' ? 'urgent' : se.severity === 'warning' ? 'high' : 'normal',
          category: 'system',
          department: undefined,
          time: 'Vừa xong',
          color: se.severity === 'critical' ? '#EF4444' : se.severity === 'warning' ? '#F59E0B' : '#94A3B8',
          archived: false,
          assignedTo: undefined,
          relatedOrderId: undefined,
          timestamp: Date.now(),
        };
        addAdminNotification(notif);
        break;
      }
    }
  }, [addAdminNotification, onEvent]);

  const connect = useCallback(() => {
    if (isUnmounted.current) return;
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    try {
      const es = new EventSource(SSE_URL);
      esRef.current = es;

      es.addEventListener('connected', (e: MessageEvent) => {
        if (isUnmounted.current) return;
        try {
          const data = JSON.parse(e.data) as SseConnectedEvent;
          dispatchEvent({ type: 'connected', data });
          setConnected(true);
          setError(null);
          reconnectCount.current = 0;
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('ping', (e: MessageEvent) => {
        if (isUnmounted.current) return;
        try {
          dispatchEvent({ type: 'ping', data: JSON.parse(e.data) });
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('notification', (e: MessageEvent) => {
        if (isUnmounted.current) return;
        try {
          dispatchEvent({ type: 'notification', data: JSON.parse(e.data) as SseNotificationEvent });
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('lp_change', (e: MessageEvent) => {
        if (isUnmounted.current) return;
        try {
          dispatchEvent({ type: 'lp_change', data: JSON.parse(e.data) as SseLpChangeEvent });
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('order_new', (e: MessageEvent) => {
        if (isUnmounted.current) return;
        try {
          dispatchEvent({ type: 'order_new', data: JSON.parse(e.data) as SseOrderNewEvent });
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('quest_complete', (e: MessageEvent) => {
        if (isUnmounted.current) return;
        try {
          dispatchEvent({ type: 'quest_complete', data: JSON.parse(e.data) as SseQuestCompleteEvent });
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('system_alert', (e: MessageEvent) => {
        if (isUnmounted.current) return;
        try {
          dispatchEvent({ type: 'system_alert', data: JSON.parse(e.data) as SseSystemAlertEvent });
        } catch { /* ignore parse errors */ }
      });

      // Generic error listener (SSE errors come here)
      es.onerror = () => {
        if (isUnmounted.current) return;
        setConnected(false);

        if (reconnectCount.current < MAX_RECONNECT) {
          reconnectCount.current += 1;
          reconnectTimer.current = setTimeout(() => {
            if (!isUnmounted.current) connect();
          }, RECONNECT_DELAY_MS);
        } else {
          setError('Mất kết nối realtime. Vui lòng tải lại trang.');
        }
      };
    } catch (err) {
      setError('Không thể kết nối SSE');
      setConnected(false);
    }
  }, [dispatchEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    isUnmounted.current = false;
    if (autoConnect) connect();
    return () => {
      isUnmounted.current = true;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    connected,
    error,
    lastEvent,
    eventCount,
    connect,
    disconnect,
  };
}
