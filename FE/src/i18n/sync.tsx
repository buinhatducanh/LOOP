/**
 * FE i18n — Synchronous Translation Context
 *
 * All 5 locale JSON files are imported statically at module level.
 * Vite bundles them eagerly — no dynamic imports, no async,
 * no Suspense, no loading flash.  t() is always synchronous.
 *
 * Usage:
 *   <I18nProvider locale="vi">
 *     <App />
 *   </I18nProvider>
 *
 *   const { t } = useI18n();
 *   t("navigation.home")  // "Trang chủ"
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale } from '../app/store/localeStore';

// ── Message type ─────────────────────────────────────────────────────────────

export type Messages = typeof import('./messages/vi.json');

// ── Static imports — available immediately when module is evaluated ──────
// Vite/ESBuild handles these synchronously; no await needed.

import viMessages from './messages/vi.json';
import enMessages from './messages/en.json';
import jaMessages from './messages/ja.json';
import koMessages from './messages/ko.json';
import zhMessages from './messages/zh.json';

// ── Message accessor ─────────────────────────────────────────────────────────

function getMessages(locale: Locale): Messages {
  switch (locale) {
    case 'vi': return viMessages;
    case 'en': return enMessages;
    case 'ja': return jaMessages;
    case 'ko': return koMessages; // Korean
    case 'zh': return zhMessages;
    default: return viMessages;
  }
}

// ── Key path resolution ───────────────────────────────────────────────────────

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
  const value = getNestedValue(messages, key);
  if (value !== null) return value;

  // Fallback to VI
  if (locale !== 'vi') {
    const viValue = getNestedValue(viMessages, key);
    if (viValue !== null) return viValue;
  }

  return key;
}

// ── Context ───────────────────────────────────────────────────────────────

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'vi',
  setLocale: () => {},
  t: (key) => key,
});

// ── Provider ──────────────────────────────────────────────────────────────

export interface I18nProviderProps {
  locale: Locale;
  children: React.ReactNode;
  onLocaleChange?: (locale: Locale) => void;
}

export function I18nProvider({ locale, children, onLocaleChange }: I18nProviderProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);

  useEffect(() => {
    if (locale !== currentLocale) {
      setCurrentLocale(locale);
    }
  }, [locale, currentLocale]);

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
    <I18nContext.Provider value={{ locale: currentLocale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
