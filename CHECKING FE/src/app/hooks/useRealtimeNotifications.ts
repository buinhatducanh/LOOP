/**
 * useRealtimeNotifications — Simulate live admin notifications via setInterval
 * Gắn hook này ở bất kỳ trang admin-level nào để tạo cảm giác real-time
 */
import { useEffect, useRef } from 'react';
import { useLoopStore } from '../store/loopStore';
import { DS } from '../components/layout/ds';
import type { AdminNotification } from '../store/loopStore';

type NotifTemplate = Omit<AdminNotification, 'id' | 'timestamp'>;

const LIVE_POOL: NotifTemplate[] = [
  {
    type: 'new_order', title: '📦 Đơn mới — MindfulTech 120M VNĐ',
    body: 'Phạm Gia Bảo (MindfulTech VN) xác nhận đơn SaaS Dashboard. Chờ thanh toán.',
    time: 'Vừa xong', read: false, color: DS.purple, priority: 'high',
    department: 'sales', category: 'order', archived: false,
  },
  {
    type: 'payment', title: '💳 Thanh toán — GreenTech 68M VNĐ',
    body: 'Ngô Minh Hưng (GreenTech JSC) đã thanh toán đủ INV-2611. Dự án sẵn sàng khởi động.',
    time: 'Vừa xong', read: false, color: DS.green, priority: 'high',
    department: 'finance', category: 'finance', archived: false,
  },
  {
    type: 'client_message', title: '💬 Phản hồi demo — EduViet',
    body: 'Ngô Thị Lan (EduViet): "Demo website rất đẹp! Chỉ cần chỉnh màu button CTA."',
    time: 'Vừa xong', read: false, color: DS.blue, priority: 'normal',
    department: 'design', category: 'client', archived: false,
  },
  {
    type: 'lp', title: '⚡ Kai Tanaka lên Level 9',
    body: 'Kai Tanaka vừa đạt Level 9 · Iron Rank. Tiếp tục phát huy!',
    time: 'Vừa xong', read: false, color: DS.amber, priority: 'low',
    department: 'management', category: 'team', archived: false,
  },
  {
    type: 'media_booking', title: '📸 Booking media — Café Artisanal',
    body: 'Trần Đình Hoàng (Café Artisanal) đặt lịch chụp ảnh sản phẩm 2 buổi. Gói Basic 8.5M.',
    time: 'Vừa xong', read: false, color: DS.amber, priority: 'normal',
    department: 'media', category: 'media', archived: false,
  },
  {
    type: 'system', title: '📊 Cập nhật LP Season III',
    body: 'Hệ thống vừa cộng LP tuần 12. Tổng LP phát hành tăng thêm 8,200 điểm.',
    time: 'Vừa xong', read: false, color: DS.cyan, priority: 'normal',
    department: 'management', category: 'system', archived: false,
  },
  {
    type: 'task', title: '✅ Task hoàn thành — Design System v2',
    body: 'Mei Lin đã hoàn thành task "Design System v2 Documentation". +500 LP được ghi nhận.',
    time: 'Vừa xong', read: false, color: DS.green, priority: 'normal',
    department: 'design', category: 'team', archived: false,
  },
  {
    type: 'escalation', title: '🔴 Escalation — FintechPro yêu cầu khẩn',
    body: 'Lê Văn Khoa (FintechPro) báo cáo lỗi hiển thị chart trên mobile. Cần xử lý trước 5h chiều.',
    time: 'Vừa xong', read: false, color: DS.red, priority: 'urgent',
    department: 'engineering', category: 'client', archived: false,
  },
  {
    type: 'review', title: '⭐ Review 5 sao — VNRetail',
    body: 'Nguyễn Minh Tuấn (VNRetail) để lại review 5 sao: "Đội ngũ chuyên nghiệp, hiệu quả!"',
    time: 'Vừa xong', read: false, color: DS.amber, priority: 'low',
    department: 'sales', category: 'client', archived: false,
  },
];

let poolIndex = 0;

/**
 * Call this hook in a component that should receive live notifications.
 * @param intervalMs - milliseconds between notifications (default 28 000)
 */
export function useRealtimeNotifications(intervalMs = 28_000) {
  const { addAdminNotification } = useLoopStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const template = LIVE_POOL[poolIndex % LIVE_POOL.length];
      poolIndex++;
      const notif: AdminNotification = {
        ...template,
        id: `live_${Date.now()}_${poolIndex}`,
        timestamp: Date.now(),
        time: 'Vừa xong',
      };
      addAdminNotification(notif);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [addAdminNotification, intervalMs]);
}
