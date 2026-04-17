/**
 * Edge Middleware — LOOP Solutions
 *
 * SPLIT AUTH ARCHITECTURE (Option C):
 *
 * Two completely separate auth flows:
 *
 * 1) Staff auth:
 *    POST /api/admin/auth/login
 *    → HttpOnly cookie "loop-staff-token"
 *    → localStorage "loop-staff-token"
 *    → Access: /admin/*, /api/admin/*
 *
 * 2) Customer auth:
 *    POST /api/auth/login  (or NextAuth OAuth)
 *    → HttpOnly cookie "loop-customer-token"
 *    → localStorage "loop-customer-token"
 *    → Access: /khach-hang/*, /api/portal/*
 *
 * Middleware routing:
 *   /admin/*    → checkAdminAccess()   — staff only
 *   /khach-hang/* → checkCustomerAccess() — customer only
 *   /api/admin/* → staff token required (API routes verify server-side)
 *   /api/portal/* → customer token required
 *   /api/auth/*  → public
 *   /api/v1/*    → public (read-only public APIs)
 *
 * i18n: everything else (/vi/*, /en/*, etc.) passes through to App Router.
 */

import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  checkCustomerAccess,
  getAccountType,
} from "./lib/auth/edge";

// Supported locale prefixes (extracted from routing.ts)
const LOCALE_PREFIXES = routing.locales as unknown as string[];

export async function middleware(req: NextRequest) {
  // Normalize: remove trailing slash to prevent redirect loops (e.g. /admin/login/ → /admin/login)
  let { pathname } = req.nextUrl;
  if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

 // ─── 0) Canonical domain redirect: non-www → www.loops.vn ───────────────────
 // loop.vn / loops.vn / www.loop.vn → redirect to www.loops.vn
 // Needed for PWA CORS: non-www redirects at DNS level have no CORS headers.
 // www.loops.vn is canonical — manifest.json served with proper CORS here.
 const _host = req.headers.get("host") ?? "";
 const _nonCanonical = [
 "loop.vn",
 "www.loop.vn",
 "loops.vn",
 "loop.vn:443",
 "www.loop.vn:443",
 "loops.vn:443",
 ];
 if (_nonCanonical.includes(_host)) {
 const _url = req.nextUrl.clone();
 _url.host = "www.loops.vn";
 _url.protocol = "https";
 return NextResponse.redirect(_url);
 }
 // www.loops.vn → serve normally (CORS headers set below)

 // ─── 1a) manifest.json / manifest.webmanifest — add CORS headers ────────
 // Required for cross-origin PWA install (e.g. www.loops.vn vs loop.vn)
 if (pathname === "/manifest.json" || pathname === "/manifest.webmanifest") {
 const origin = req.headers.get("origin");
 const allowedOrigins = [
 "https://loops.vn",
 "https://www.loops.vn",
 "https://loop.vn",
 "https://www.loop.vn",
 ];
 const corsOrigin = allowedOrigins.includes(origin ?? "") ? origin : allowedOrigins[0];
 const response = NextResponse.next();
 response.headers.set("Access-Control-Allow-Origin", corsOrigin ?? "*");
 response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
 response.headers.set("Access-Control-Allow-Headers", "Content-Type");
 response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
 return response;
 }

 // ─── 1b) Other static assets + sitemap + robots ──────────────────────────
 if (
 pathname === "/favicon.ico" ||
 pathname === "/favicon.svg" ||
 pathname === "/robots.txt" ||
 pathname === "/sitemap.xml" ||
 pathname.startsWith("/images/") ||
 pathname.startsWith("/fonts/") ||
 pathname.startsWith("/assets/") ||
 pathname.startsWith("/loop-logo") ||
 pathname.startsWith("/icon-") ||
 pathname === "/loop-logo.png" ||
 pathname === "/loop-logo.webp" ||
 pathname === "/og-cover.svg" ||
 pathname === "/og-home.svg" ||
 pathname === "/logo.png"
 ) {
 return NextResponse.next();
 }

  // ─── 2) /admin/* — Staff-only routes ──────────────────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // /admin/login is always public — no auth required
    if (pathname === "/admin/login") {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-pathname", pathname);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // ── Pass through to client-side AuthGuard for all admin routes ────────────
    // AuthGuard reads localStorage (not HttpOnly cookie) so it always sees
    // the token after login. Middleware's cookie-based check can miss the
    // token on soft navigations (sidebar Link clicks) due to cookie sync
    // delay — causing spurious redirects to /admin/login.
    //
    // Security boundary: if a CUSTOMER token tries to access admin, block it
    // at the edge (can't be faked client-side).
    const accountType = getAccountType(req);
    if (accountType === "customer") {
      const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "vi";
      return NextResponse.redirect(new URL(`/${locale}/khach-hang`, req.url));
    }

    // Let AuthGuard handle unauthenticated / forbidden staff — it reads
    // localStorage token and redirects to /admin/login if needed.
    return NextResponse.next();
  }

  // ─── 3a) /khach-hang/* — Customer-only routes (no locale prefix) ──────────
  if (pathname === "/khach-hang" || pathname.startsWith("/khach-hang/")) {
    const result = checkCustomerAccess(req, pathname);

    if (!result.allowed) {
      if (result.reason === "staff_forbidden") {
        // Staff trying to access customer portal → redirect to admin
        return NextResponse.redirect(new URL("/admin/overview", req.url));
      }
      // Not authenticated → redirect to login (locale-aware)
      const locale =
        req.cookies.get("NEXT_LOCALE")?.value ?? routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/dang-nhap`, req.url));
    }

    return NextResponse.next();
  }

  // ─── 3b) /{locale}/khach-hang/* — Customer-only routes (locale-prefixed) ──
  // Staff trying to access via /vi/khach-hang, /en/khach-hang, etc.
  for (const locale of LOCALE_PREFIXES) {
    const prefixed = `/${locale}/khach-hang`;
    if (pathname === prefixed || pathname.startsWith(`${prefixed}/`)) {
      const accountType = getAccountType(req);
      if (accountType === "staff") {
        // Staff trying to access customer portal → redirect to admin
        return NextResponse.redirect(new URL("/admin/overview", req.url));
      }
      // Allow customers and unauthenticated through — page-level guard handles auth
      return NextResponse.next();
    }
  }

  // ─── 4) /api/* routes — pass through to API handlers ──────────────────────
  // API routes themselves verify tokens server-side with full jwt.verify().
  // We only need to check for extreme cases here (e.g. staff trying portal API).
  if (pathname.startsWith("/api/")) {
    // /api/admin/* requires staff token (belt-and-suspenders — API also checks)
    if (pathname.startsWith("/api/admin/")) {
      const accountType = getAccountType(req);
      // Reject customer tokens at the edge
      if (accountType === "customer") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // If no token at all, let the API return 401 (not our job to redirect)
      return NextResponse.next();
    }

    // /api/portal/* requires customer token
    if (pathname.startsWith("/api/portal/")) {
      const accountType = getAccountType(req);
      if (accountType === "staff") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!accountType) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    // All other /api/* pass through (auth, v1, webhooks, etc.)
    return NextResponse.next();
  }

  // ─── 5) i18n locale-prefixed routes → pass through ───────────────────────
  // E.g. /vi/about, /en/services → let Next.js App Router handle
  const firstSegment = pathname.split("/")[1];
  if (LOCALE_PREFIXES.includes(firstSegment)) {
    return NextResponse.next();
  }

  // ─── 6) Root /{locale} bare paths → pass through ─────────────────────────
  // E.g. /vi, /en, /ja, /ko, /zh → pass through to app/layout
  if (LOCALE_PREFIXES.includes(firstSegment) && pathname.split("/").length === 2) {
    return NextResponse.next();
  }

  // ─── 7) Redirect everything else to locale-prefixed path ──────────────────
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
    "/((?!api/|_next/static|_next/image|assets/|loop-logo|logo.png|favicon.ico|favicon.svg|og-cover.svg|og-home.svg).*)",
  ],
};
