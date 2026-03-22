import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { checkEdgeAuth, stripLocaleFromAdmin, LEGACY_ADMIN_REDIRECTS } from "./navigation/middleware-auth";
import { getLocaleFromPathname } from "./navigation/utils";

// ─── i18n middleware ───────────────────────────────────────────────────────────

const intlMiddleware = createMiddleware(routing);

// ─── Middleware ────────────────────────────────────────────────────────────────

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Strip locale prefix from admin routes ─────────────────────────────
  // e.g. /vi/admin/dashboard → /admin/dashboard
  // This prevents /admin ↔ /vi/admin loops with localePrefix:'always'
  const stripped = stripLocaleFromAdmin(pathname);
  if (stripped) {
    return NextResponse.redirect(new URL(stripped, req.url), 308);
  }

  // ── 2. Admin API routes ─────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    // Public auth routes (login, me) bypass auth check
    if (pathname.startsWith("/api/admin/auth/login") || pathname.startsWith("/api/admin/auth/me")) {
      return NextResponse.next();
    }
    // All other admin API routes require authentication (handled per-route in API handlers)
    return NextResponse.next();
  }

  // ── 3. Admin page routes (no locale prefix) ─────────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {

    // 3a. Legacy flat path → new grouped path redirects
    for (const [oldPath, newPath] of Object.entries(LEGACY_ADMIN_REDIRECTS)) {
      if (pathname === oldPath || pathname.startsWith(oldPath + "/")) {
        const suffix = pathname.slice(oldPath.length);
        return NextResponse.redirect(new URL(`${newPath}${suffix}`, req.url), 308);
      }
    }

    // 3b. Edge auth check (auth status + role level)
    const authResult = checkEdgeAuth(pathname, req);
    if (!authResult.allowed) {
      if (authResult.redirectUrl) {
        return NextResponse.redirect(new URL(authResult.redirectUrl, req.url));
      }
      if (authResult.reason === "unauthenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  }

  // ── 4. All other routes: i18n routing ───────────────────────────────────
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/",
    "/(vi|en)/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
