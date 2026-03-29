/**
 * LOOP Solutions — Notifications API Service
 *
 * BE endpoints:
 * GET  /api/admin/notifications            → notification list
 * PUT  /api/admin/notifications/[id]/read  → mark as read
 * DELETE /api/admin/notifications/[id]    → delete notification
 */
import { api } from './client';
import type { AdminNotification as StoreNotification } from '../app/store/loopStore';

// ── BE response type ──────────────────────────────────────────────────────────
interface BeNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  category: string;
  department?: string;
  createdAt: string;
}

// ── Map BE → FE store shape ───────────────────────────────────────────────────
function getCatColor(cat: string): string {
  switch (cat) {
    case 'order': return '#3B82F6';
    case 'finance': return '#10B981';
    case 'team': return '#8B5CF6';
    case 'client': return '#06B6D4';
    case 'media': return '#F59E0B';
    case 'system': return '#94A3B8';
    default: return '#818CF8';
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins}ph trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

function mapNotification(be: BeNotification): StoreNotification {
  return {
    id: be.id,
    userId: be.userId,
    type: be.type,
    title: be.title,
    body: be.message,
    link: be.link ?? '',
    read: be.isRead,
    priority: be.priority,
    category: be.category,
    department: be.department,
    createdAt: be.createdAt,
    time: timeAgo(be.createdAt),
    color: getCatColor(be.category),
    archived: false,
    assignedTo: '',
    relatedOrderId: '',
  };
}

export const notificationsService = {
  /**
   * GET /api/admin/notifications?page=1&limit=20&unread=true|false
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }): Promise<{ data: StoreNotification[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    if (params?.unread !== undefined) q.set('unread', String(params.unread));
    const qs = q.toString();
    const path = `/admin/notifications${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeNotification[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(path);
    return { data: res.data.map(mapNotification), pagination: res.pagination };
  },

  /**
   * PUT /api/admin/notifications/[id]/read
   */
  markRead: async (id: string): Promise<void> => {
    await api.put(`/admin/notifications/${id}/read`, {});
  },

  /**
   * DELETE /api/admin/notifications/[id]
   */
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/admin/notifications/${id}`);
  },
};
