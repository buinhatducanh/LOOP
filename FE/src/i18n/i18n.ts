/**
 * FE i18n — Lightweight translation system for LOOP Frontend
 * Supports 5 locales: vi, en, ja, ko, zh
 *
 * Architecture:
 * - Translation JSON files in src/i18n/messages/{locale}.json
 * - Lazy-loaded per locale to minimize bundle size
 * - CJK fonts (ja/ko/zh) lazy-loaded via src/i18n/fonts.ts
 * - Integrates with existing localeStore.ts for current locale
 */

import type { Locale } from '../app/store/localeStore';
import viMessagesRaw from './messages/vi.json';

// ── Message file type ──────────────────────────────────────────────────────────
// (Re-exported from sync.tsx for consumers that need it — avoid duplication here)

type Messages = typeof import('./messages/vi.json');

// ── Translation cache ─────────────────────────────────────────────────────────
// Cache loaded messages per locale to avoid re-importing

const messagesCache: Partial<Record<Locale, Messages>> = {};

/**
 * Load translation messages for a locale.
 * Files are lazy-imported to support code splitting.
 */
async function loadMessages(locale: Locale): Promise<Messages> {
  if (messagesCache[locale]) {
    return messagesCache[locale]!;
  }

  switch (locale) {
    case 'vi':
      messagesCache[locale] = await import('./messages/vi.json');
      break;
    case 'en':
      messagesCache[locale] = await import('./messages/en.json');
      break;
    case 'ja':
      messagesCache[locale] = await import('./messages/ja.json');
      break;
    case 'ko':
      messagesCache[locale] = await import('./messages/ko.json');
      break;
    case 'zh':
      messagesCache[locale] = await import('./messages/zh.json');
      break;
    default:
      messagesCache[locale] = await import('./messages/vi.json');
  }

  return messagesCache[locale]!;
}

// ── Key path resolution ────────────────────────────────────────────────────────
// Supports nested paths like "navigation.home" or "footer.ctaTitle"

function getNestedValue(obj: unknown, path: string): string | null {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : null;
}

// ── Public i18n API ───────────────────────────────────────────────────────────

/**
 * Get a translation by key path.
 *
 * @param key - Dot-notation key, e.g. "navigation.home", "footer.getInTouch"
 * @param locale - Current locale
 * @param fallback - Fallback string if key not found (defaults to key itself)
 * @returns Translated string or fallback
 *
 * @example
 * t("navigation.home", "vi")          // "Trang chủ"
 * t("navigation.home", "en")          // "Home"
 * t("footer.getInTouch", "ja")        // "お問い合わせ"
 * t("common.notFound", locale)         // "Không tìm thấy" (vi) / "Not Found" (en)
 */
export async function t(
  key: string,
  locale: Locale,
  fallback?: string
): Promise<string> {
  const messages = await loadMessages(locale);
  const value = getNestedValue(messages, key);

  if (value != null) {
    return value;
  }

  // Fallback to VI if not found in requested locale
  if (locale !== 'vi') {
    const viMessages = await loadMessages('vi');
    const viValue = getNestedValue(viMessages, key);
    if (viValue != null) {
      return viValue;
    }
  }

  return fallback ?? key;
}

// ── Sync translation (synchronous) ─────────────────────────────────────────────
const VI_MESSAGES: Messages = viMessagesRaw;

/**
 * Synchronous translation — uses VI messages only.
 * Use this only for SSR or when async is not feasible.
 * Prefer `t()` for client-side translations.
 */
export function tSync(key: string, fallback?: string): string {
  const value = getNestedValue(VI_MESSAGES, key);
  return value ?? fallback ?? key;
}

// ── Batch translation ───────────────────────────────────────────────────────────

/**
 * Get all translations for a namespace.
 *
 * @param namespace - e.g. "navigation", "footer", "common"
 * @param locale - Current locale
 * @returns The namespace object or empty object
 *
 * @example
 * const nav = await namespace("navigation", "en");
 * nav.home  // "Home"
 * nav.login // "Login"
 */
export async function namespace<T = Record<string, unknown>>(
  namespace: string,
  locale: Locale
): Promise<T> {
  const messages = await loadMessages(locale);
  const ns = getNestedValue(messages, namespace);

  if (ns != null && typeof ns === 'object') {
    return ns as T;
  }

  // Fallback to VI
  if (locale !== 'vi') {
    const viMessages = await loadMessages('vi');
    const viNs = getNestedValue(viMessages, namespace);
    if (viNs != null && typeof viNs === 'object') {
      return viNs as T;
    }
  }

  return {} as T;
}

// ── Locale detection helpers ───────────────────────────────────────────────────

export const SUPPORTED_LOCALES = ['vi', 'en', 'ja', 'ko', 'zh'] as const;

/**
 * Check if a locale string is supported.
 */
export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get locale from Accept-Language header (browser).
 * Returns the best matching supported locale.
 */
export function detectLocaleFromBrowser(): Locale {
  if (typeof navigator === 'undefined') return 'vi';

  const browserLangs = navigator.languages ?? [navigator.language];
  const supported = [...SUPPORTED_LOCALES];

  for (const browserLang of browserLangs) {
    // Try exact match first (e.g. "ja-JP")
    if (supported.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
    // Try language prefix (e.g. "ja" from "ja-JP")
    const prefix = browserLang.split('-')[0];
    if (prefix && supported.includes(prefix as Locale)) {
      return prefix as Locale;
    }
  }

  return 'vi';
}

/**
 * Get locale from path prefix.
 * Returns null if path doesn't start with a locale.
 *
 * @example
 * getLocaleFromPath("/en/services")  // "en"
 * getLocaleFromPath("/ja/blog")      // "ja"
 * getLocaleFromPath("/api/data")    // null
 */
export function getLocaleFromPath(pathname: string): Locale | null {
  if (!pathname) return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const first = segments[0];
  if (first && isSupportedLocale(first)) {
    return first as Locale;
  }
  return null;
}

/**
 * Add locale prefix to a path.
 *
 * @example
 * addLocalePrefix("/services", "en")  // "/en/services"
 * addLocalePrefix("/blog", "ja")       // "/ja/blog"
 * addLocalePrefix("/contact", "vi")   // "/vi/contact"
 */
export function addLocalePrefix(path: string, locale: Locale): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${cleanPath}`;
}

/**
 * Remove locale prefix from a path.
 *
 * @example
 * removeLocalePrefix("/en/services")  // "/services"
 * removeLocalePrefix("/vi/blog")       // "/blog"
 */
export function removeLocalePrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && isSupportedLocale(segments[0])) {
    return '/' + segments.slice(1).join('/');
  }
  return path;
}
