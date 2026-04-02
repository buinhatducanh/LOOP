/**
 * Locale Store — Zustand-based i18n state for LOOP FE
 * Manages current locale (vi/en/ja/ko/zh), localStorage persistence,
 * and the t() translation function.
 */
import { create } from 'zustand';

export type Locale = 'vi' | 'en' | 'ja' | 'ko' | 'zh';

const LOCALE_STORAGE_KEY = 'loop_locale';

// ─── Locale messages (statically imported) ────────────────────────────────
import viMessages from '../i18n/locales/vi.json';
import enMessages from '../i18n/locales/en.json';
import jaMessages from '../i18n/locales/ja.json';
import koMessages from '../i18n/locales/ko.json';
import zhMessages from '../i18n/locales/zh.json';

export type Messages = typeof viMessages;

const MESSAGES: Record<Locale, Messages> = {
  vi: viMessages,
  en: enMessages,
  ja: jaMessages,
  ko: koMessages,
  zh: zhMessages,
};

export const SUPPORTED_LOCALES: Locale[] = ['vi', 'en', 'ja', 'ko', 'zh'];

// ─── Simple dot-notation lookup ──────────────────────────────────────────────
function getValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

// ─── Rehydrate from localStorage (SSR-safe) ───────────────────────────────
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'vi';
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  const browser = navigator.language.split('-')[0] as Locale;
  return SUPPORTED_LOCALES.includes(browser) ? browser : 'vi';
}

// ─── State shape ───────────────────────────────────────────────────────────
interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a dot-notation key, replacing {param} placeholders */
  t: (key: string, params?: Record<string, string | number>) => string;
}

// ─── Store ─────────────────────────────────────────────────────────────────
export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: 'vi', // Will be overwritten by rehydrate on mount
  setLocale: (locale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    set({ locale });
  },
  t: (key: string, params?: Record<string, string | number>): string => {
    const { locale } = get();
    // Fallback chain: requested → en → vi
    let value =
      getValue(MESSAGES[locale], key) ??
      getValue(enMessages, key) ??
      getValue(viMessages, key);
    if (value === undefined) return key; // fallback to key itself
    if (!params) return value;
    // Replace {param} placeholders
    return value.replace(/\{(\w+)\}/g, (_, name) =>
      String(params[name] ?? `{${name}}`)
    );
  },
}));

// ─── Bootstrap: rehydrate locale on first load ─────────────────────────────
let hydrated = false;
export function hydrateLocale(): void {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  const locale = getInitialLocale();
  useLocaleStore.setState({ locale });
  if (locale !== 'vi') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

// ─── Re-export locale info ─────────────────────────────────────────────────
export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'VN',
  en: 'EN',
  ja: 'JA',
  ko: 'KO',
  zh: 'ZH',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  vi: '🇻🇳',
  en: '🇬🇧',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
};
