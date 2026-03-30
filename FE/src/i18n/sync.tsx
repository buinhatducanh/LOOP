/**
 * FE i18n — Synchronous Translation Context
 *
 * Provides a synchronous translation API backed by a React Context.
 * Translation messages are loaded eagerly into context on mount,
 * enabling synchronous use in JSX without async/await.
 *
 * Usage:
 *   // Wrap app with I18nProvider in App.tsx:
 *   <I18nProvider locale="vi">
 *     <App />
 *   </I18nProvider>
 *
 *   // Use in components:
 *   import { useI18n } from '@/i18n/sync';
 *   const { t } = useI18n();
 *   t("navigation.home")  // "Trang chủ" (synchronous!)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale } from '../app/store/localeStore';

// ── Message type ─────────────────────────────────────────────────────────────

export type Messages = typeof import('./messages/vi.json');

// ── Context ────────────────────────────────────────────────────────────────

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages | null;
  isLoading: boolean;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ── Load messages ─────────────────────────────────────────────────────────

// Pre-load all 5 locale messages at module level for synchronous access
// This adds ~20KB to initial bundle but enables instant synchronous translations

let viMessages: Messages | null = null;
let enMessages: Messages | null = null;
let jaMessages: Messages | null = null;
let koMessages: Messages | null = null;
let zhMessages: Messages | null = null;

async function loadAllMessages(): Promise<void> {
  [viMessages, enMessages, jaMessages, koMessages, zhMessages] = await Promise.all([
    import('./messages/vi.json'),
    import('./messages/en.json'),
    import('./messages/ja.json'),
    import('./messages/ko.json'),
    import('./messages/zh.json'),
  ]);
}

// Start loading in background (non-blocking)
loadAllMessages().catch(console.error);

function getMessages(locale: Locale): Messages | null {
  switch (locale) {
    case 'vi': return viMessages;
    case 'en': return enMessages;
    case 'ja': return jaMessages;
    case 'ko': return koMessages;
    case 'zh': return zhMessages;
    default: return viMessages;
  }
}

// ── Key path resolution ────────────────────────────────────────────────

function getNestedValue(obj: unknown, path: string): string | null {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : null;
}

function resolveKey(key: string, locale: Locale): string {
  const messages = getMessages(locale);
  if (!messages) return key;

  const value = getNestedValue(messages, key);
  if (value !== null) return value;

  // Fallback to VI
  if (locale !== 'vi' && viMessages) {
    const viValue = getNestedValue(viMessages, key);
    if (viValue !== null) return viValue;
  }

  return key;
}

// ── Provider ────────────────────────────────────────────────────────────

export interface I18nProviderProps {
  locale: Locale;
  children: React.ReactNode;
  onLocaleChange?: (locale: Locale) => void;
}

export function I18nProvider({ locale, children, onLocaleChange }: I18nProviderProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [messages, setMessages] = useState<Messages | null>(viMessages);
  const [isLoading] = useState(false);

  // Sync locale to messages when it changes
  useEffect(() => {
    const msgs = getMessages(currentLocale);
    if (msgs) {
      setMessages(msgs);
    }
  }, [currentLocale]);

  // When locale prop changes, sync
  useEffect(() => {
    if (locale !== currentLocale) {
      setCurrentLocale(locale);
      const msgs = getMessages(locale);
      if (msgs) setMessages(msgs);
    }
  }, [locale]);

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setCurrentLocale(newLocale);
    onLocaleChange?.(newLocale);
  }, [onLocaleChange]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const value = resolveKey(key, currentLocale);
      return value !== key ? value : (fallback ?? key);
    },
    [currentLocale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale: currentLocale,
        setLocale: handleSetLocale,
        messages,
        isLoading,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback: use VI messages directly (for components outside provider)
    return {
      locale: 'vi',
      setLocale: () => {},
      messages: viMessages,
      isLoading: false,
      t: (key: string, fallback?: string) => {
        const value = getNestedValue(viMessages, key);
        return value ?? fallback ?? key;
      },
    };
  }
  return ctx;
}

// ── Simple namespace hook ──────────────────────────────────────────────

/**
 * Get all translations for a namespace as a flat object.
 * Re-renders when locale changes.
 *
 * @example
 * const nav = useNamespace("navigation");
 * nav.home  // "Trang chủ" / "Home" / ...
 * nav.login // "Đăng nhập" / "Login" / ...
 */
export function useNamespace<T = Record<string, string>>(namespace: string): T {
  const locale = useI18n().locale;
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Re-render when messages load
    if (!messages) {
      const id = setInterval(() => {
        const msgs = getMessages(locale);
        if (msgs) {
          forceUpdate(n => n + 1);
        }
      }, 50);
      return () => clearInterval(id);
    }
  }, []);

  if (!messages) return {} as T;
  const ns = getNestedValue(messages, namespace);
  return (ns && typeof ns === 'object' ? ns : {}) as T;
}
