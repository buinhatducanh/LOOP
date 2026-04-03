/**
 * Server-side admin i18n utility
 *
 * For use in Server Components outside [locale] routing.
 * Reads locale from cookies() or defaults to "vi".
 *
 * Usage:
 *   import { getAdminTranslations } from "@/i18n/admin/admin-t";
 *   const t = await getAdminTranslations();
 *   t("sidebar.nav.overview")  → "Tổng quan"
 */

import { cookies } from "next/headers";
import type { Metadata } from "next";

import viMessages from "./messages/vi.json";
import enMessages from "./messages/en.json";

type Messages = typeof viMessages;
type Locale = "vi" | "en";

const MESSAGES: Record<Locale, Messages> = { vi: viMessages, en: enMessages };

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;
  for (const key of keys) {
    if (result == null || typeof result !== "object") return path;
    result = (result as Record<string, unknown>)[key];
  }
  return typeof result === "string" ? result : path;
}

export async function getAdminTranslations(locale?: Locale) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  const activeLocale: Locale =
    locale ?? (savedLocale === "vi" || savedLocale === "en" ? savedLocale : "vi");

  const messages = MESSAGES[activeLocale] ?? MESSAGES.vi;

  return {
    locale: activeLocale,
    t: (key: string, params?: Record<string, string | number>): string => {
      const text = getNestedValue(messages, key);
      if (!params) return text;
      return text.replace(/\{(\w+)\}/g, (_, k) =>
        params[k] !== undefined ? String(params[k]) : `{${k}}`
      );
    },
  };
}

// Re-export locale metadata helper for admin pages
export async function getAdminLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  return savedLocale === "vi" || savedLocale === "en" ? savedLocale : "vi";
}
