"use client";

/**
 * AdminI18nProvider — Admin i18n context
 *
 * Provides translated strings for admin sidebar and pages.
 * OUTSIDE [locale] routing — reads locale from browser cookie.
 *
 * Usage:
 *   const t = useAdminTranslations();
 *   t("sidebar.nav.overview")  → "Tổng quan"
 *   t("common.save")          → "Lưu"
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import viMessages from "./messages/vi.json";
import enMessages from "./messages/en.json";
import jaMessages from "./messages/ja.json";
import koMessages from "./messages/ko.json";
import zhMessages from "./messages/zh.json";

type Messages = typeof viMessages;
type Locale = "vi" | "en" | "ja" | "ko" | "zh";

const MESSAGES: Record<Locale, Messages> = {
  vi: viMessages,
  en: enMessages,
  ja: jaMessages,
  ko: koMessages,
  zh: zhMessages,
};

interface AdminI18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;
  for (const key of keys) {
    if (result == null || typeof result !== "object") return path;
    result = (result as Record<string, unknown>)[key];
  }
  return typeof result === "string" ? result : path;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from cookie on mount (client-only)
  useEffect(() => {
    try {
      const match = document.cookie.match(
        new RegExp("(^| )NEXT_LOCALE=([^;]+)")
      );
      const saved = match?.[2] as Locale | undefined;
      const allLocales: Locale[] = ["vi", "en", "ja", "ko", "zh"];
      if (saved && allLocales.includes(saved)) {
        setLocaleState(saved);
      } else {
        // fallback: try localStorage
        const stored = localStorage.getItem("NEXT_LOCALE") as Locale | null;
        if (stored && allLocales.includes(stored)) setLocaleState(stored);
      }
    } catch {
      // SSR or cookies unavailable
    }
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000`;
      localStorage.setItem("NEXT_LOCALE", l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (!isHydrated) return key;
      const messages = MESSAGES[locale] ?? MESSAGES.vi;
      const text = getNestedValue(messages, key);
      return interpolate(text, params);
    },
    [locale, isHydrated]
  );

  return (
    <AdminI18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminTranslations(): AdminI18nContextValue {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) {
    // Safe fallback for SSR / outside provider
    return {
      locale: "vi",
      setLocale: () => {},
      t: (key: string) => key,
    };
  }
  return ctx;
}
