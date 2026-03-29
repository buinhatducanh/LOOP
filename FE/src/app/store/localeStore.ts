/**
 * LOOP Solutions — Locale Store
 * Zustand store quản lý current locale + i18n helpers
 */
import { create } from 'zustand';

export const SUPPORTED_LOCALES = ['vi', 'en', 'ja', 'ko', 'zh'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  vi: '🇻🇳',
  en: '🇺🇸',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
};

// ── Wizard Step Labels — 8 steps × 5 locale ───────────────────────────────────

export const WIZARD_STEP_LABELS: Record<Locale, string[]> = {
  vi: ['Dịch vụ', 'Gói', 'Tính năng', 'Team', 'Lịch', 'Thêm', 'Xem lại', 'Thanh toán'],
  en: ['Services', 'Package', 'Features', 'Team', 'Schedule', 'Add-ons', 'Review', 'Payment'],
  ja: ['サービス', 'パッケージ', '機能', 'チーム', 'スケジュール', 'オプション', '確認', 'お支払い'],
  ko: ['서비스', '패키지', '기능', '팀', '일정', '추가', '검토', '결제'],
  zh: ['服务', '套餐', '功能', '团队', '日程', '附加', '审核', '支付'],
};

// ── Order Status Labels — 6 status × 5 locale ─────────────────────────────────

export type OrderStatusCode =
  | 'pending_payment'
  | 'paid'
  | 'in_progress'
  | 'demo_ready'
  | 'client_review'
  | 'done'
  | 'cancelled';

export const ORDER_STATUS_LABELS: Record<Locale, Record<OrderStatusCode, string>> = {
  vi: {
    pending_payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    in_progress: 'Đang thực hiện',
    demo_ready: '⚡ Demo sẵn sàng',
    client_review: 'Khách hàng đánh giá',
    done: '✓ Hoàn thành',
    cancelled: '✕ Đã hủy',
  },
  en: {
    pending_payment: 'Pending Payment',
    paid: 'Paid',
    in_progress: 'In Progress',
    demo_ready: '⚡ Demo Ready',
    client_review: 'Client Review',
    done: '✓ Completed',
    cancelled: '✕ Cancelled',
  },
  ja: {
    pending_payment: '支払い待ち',
    paid: '支払済み',
    in_progress: '進行中',
    demo_ready: '⚡ デモ準備完了',
    client_review: 'クライアント確認',
    done: '✓ 完了',
    cancelled: '✕ キャンセル',
  },
  ko: {
    pending_payment: '결제 대기',
    paid: '결제 완료',
    in_progress: '진행 중',
    demo_ready: '⚡ 데모 준비 완료',
    client_review: '클라이언트 검토',
    done: '✓ 완료',
    cancelled: '✕ 취소됨',
  },
  zh: {
    pending_payment: '待支付',
    paid: '已支付',
    in_progress: '进行中',
    demo_ready: '⚡ Demo 就绪',
    client_review: '客户审核',
    done: '✓ 已完成',
    cancelled: '✕ 已取消',
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Get status label in current locale */
export function getOrderStatusLabel(status: OrderStatusCode, locale: Locale): string {
  return ORDER_STATUS_LABELS[locale]?.[status] ?? ORDER_STATUS_LABELS.vi[status] ?? status;
}

/** Validate locale string, return 'vi' as default */
export function normalizeLocale(locale: string | null | undefined): Locale {
  if (locale && SUPPORTED_LOCALES.includes(locale as Locale)) {
    return locale as Locale;
  }
  return 'vi';
}

// ── Store ───────────────────────────────────────────────────────────────────────

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: normalizeLocale(
    typeof window !== 'undefined' ? localStorage.getItem('loop_locale') ?? 'vi' : 'vi'
  ),
  setLocale: (locale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('loop_locale', locale);
    }
    set({ locale });
  },
}));
