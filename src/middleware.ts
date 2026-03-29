/**
 * Edge Middleware — LOOP Solutions
 * Handles i18n locale routing and admin auth.
 *
 * i18n routing strategy: subdirectory (/vi, /en)
 * - First visit: detect locale from Accept-Language → redirect to /{locale}
 * - Return visit: use locale from cookie (persisted by locale switcher)
 * - /api/*, /admin/*, /auth/* → pass through (no locale prefix)
 * - /vi/*, /en/* → pass through to app
 * - /* (no locale) → redirect to /{defaultLocale} or detected locale
 */

import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { checkAdminAccess } from "./lib/auth/edge";

// Supported locale prefixes (extracted from routing.ts)
const LOCALE_PREFIXES = routing.locales as unknown as string[];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── 1) API routes → pass through ──────────────────────────────────────────
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // ─── 2) Admin page auth ────────────────────────────────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // /admin/login is always public — skip auth check to avoid redirect loop
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const result = checkAdminAccess(req, pathname);
    if (!result.allowed) {
      if (result.reason === "unauthenticated") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ─── 3) Static assets + manifest + sitemap + robots ──────────────────────
  if (
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/")
  ) {
    return NextResponse.next();
  }

  // ─── 4) i18n locale-prefixed routes → pass through ────────────────────────
  // E.g. /vi/about, /en/services → let Next.js App Router handle
  const firstSegment = pathname.split("/")[1];
  if (LOCALE_PREFIXES.includes(firstSegment)) {
    return NextResponse.next();
  }

  // ─── 5) Root /{locale} bare paths → pass through ─────────────────────────
  // E.g. /vi, /en, /ja, /ko, /zh → pass through to app/layout
  if (LOCALE_PREFIXES.includes(firstSegment) && pathname.split("/").length === 2) {
    return NextResponse.next();
  }

  // ─── 6) Redirect to locale-prefixed path ───────────────────────────────────
  // E.g. /about → /vi/about
  // Priority: cookie → Accept-Language → default (vi)
  const locale =
    req.cookies.get("NEXT_LOCALE")?.value ??
    detectAcceptLanguage(req) ??
    routing.defaultLocale;

  const redirectPath = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(new URL(redirectPath, req.url));
}

/**
 * Detect locale from Accept-Language header.
 * Matches against supported locales.
 */
function detectAcceptLanguage(req: NextRequest): string | undefined {
  const acceptLanguage = req.headers.get("Accept-Language");
  if (!acceptLanguage) return undefined;

  // Parse Accept-Language: "en-US,en;q=0.9,vi;q=0.8"
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of languages) {
    if (LOCALE_PREFIXES.includes(code)) {
      return code;
    }
  }
  return undefined;
}

export const config = {
  matcher: [
    // Exclude API routes, static files, and Next.js internals
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
  ],
};
