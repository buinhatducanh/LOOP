/**
 * Shared plain utility functions for navigation.
 *
 * These are pure functions with NO React dependencies — safe for both
 * client components AND Edge Runtime (middleware).
 *
 * DO NOT import from this file:
 *   - next-intl navigation hooks (useRouter, usePathname, Link)
 *   - next/navigation hooks
 *   - any React components or hooks
 */

import { routing } from "@/i18n/routing";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Supported locale values */
type Locale = "vi" | "en";

/** Minimal request-like object for locale detection (Edge-compatible) */
export interface LocaleRequest {
  cookies?: { get?: (name: string) => { value: string } | null | undefined };
  headers?: { get?: (name: string) => string | null | undefined };
}

// ─── Locale helpers ───────────────────────────────────────────────────────────

/**
 * Extract locale from a pathname.
 * e.g. "/vi/admin/dashboard" → "vi", "/admin" → routing.defaultLocale
 */
export function getLocaleFromPathname(pathname: string): string {
  const match = pathname.match(/^\/(vi|en)\/?/);
  return match ? match[1] : routing.defaultLocale;
}

/**
 * Get locale from a Next.js Request (Edge-compatible).
 *
 * Priority:
 *   1. `Next-Locale` cookie (set by next-intl when user switches locale)
 *   2. `Accept-Language` header (browser preference)
 *   3. `routing.defaultLocale` fallback
 *
 * This ensures admin redirects preserve the user's chosen locale even when
 * the current path has no locale prefix (e.g. /admin → /vi/login, not /defaultLocale/login).
 */
export function getLocaleFromRequest(
  pathname: string,
  request?: LocaleRequest
): Locale {
  // 1. Extract from pathname if present
  const fromPathname = getLocaleFromPathname(pathname);
  if ((routing.locales as readonly string[]).includes(fromPathname)) {
    return fromPathname as Locale;
  }

  // 2. Read Next-Locale cookie (set by next-intl)
  if (request?.cookies) {
    const nextLocale = request.cookies.get?.("NEXT_LOCALE")?.value;
    if (nextLocale && (routing.locales as readonly string[]).includes(nextLocale)) {
      return nextLocale as Locale;
    }
  }

  // 3. Read Accept-Language header
  if (request?.headers) {
    const acceptLanguage = request.headers.get?.("accept-language");
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(",")[0]?.split(";")[0]?.trim().toLowerCase();
      if (preferred) {
        // "en-US" → "en", "vi" → "vi"
        const lang = preferred.split("-")[0];
        if ((routing.locales as readonly string[]).includes(lang)) {
          return lang as Locale;
        }
      }
    }
  }

  // 4. Fallback to default locale
  return routing.defaultLocale as Locale;
}

/**
 * Build a locale-aware login redirect URL.
 * Preserves the user's current locale instead of hardcoding "vi".
 *
 * @param currentPath - The path that triggered the redirect (e.g. "/admin")
 * @param request     - Optional request for enhanced locale detection
 */
export function getLoginRedirectUrl(
  currentPath: string,
  request?: LocaleRequest
): string {
  const locale = getLocaleFromRequest(currentPath, request);
  const redirectParam = currentPath
    ? `?redirect=${encodeURIComponent(currentPath)}`
    : "";
  return `/${locale}/login${redirectParam}`;
}

/**
 * Build a locale-aware access-denied redirect URL.
 */
export function getAccessDeniedRedirect(
  currentPath: string,
  request?: LocaleRequest
): string {
  const locale = getLocaleFromRequest(currentPath, request);
  return `/${locale}/admin/access-denied`;
}

/**
 * Build a login URL for middleware redirects.
 * Preserves the locale from the current pathname.
 *
 * Accepts an optional NextRequest for enhanced locale detection
 * (Next-Locale cookie / Accept-Language header).
 */
export function buildLoginUrl(
  pathname: string,
  req?: LocaleRequest
): string {
  const locale = getLocaleFromRequest(pathname, req);
  const redirectParam = pathname
    ? `?redirect=${encodeURIComponent(pathname)}`
    : "";
  return `/${locale}/login${redirectParam}`;
}
