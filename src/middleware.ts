import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// ─── Role level map (duplicated here to avoid import issues in edge runtime) ───

const ROLE_LEVEL: Record<string, number> = {
  ceo: -1,
  super_admin: 0,
  admin: 1,
  project_manager: 2,
  media: 3,
  qa: 4,
  member: 5,
};

// ─── Min role level per admin path ──────────────────────────────────────────────
//  Lower number = higher privilege.
//  User's role level must be ≤ path's required level to enter.

const PATH_ROLE_REQUIREMENTS: Record<string, number> = {
  // Dashboard: all staff
  "/vi/admin": 5,
  "/en/admin": 5,
  // Content: PM level (2) and above
  "/vi/admin/home-sliders": 2,
  "/en/admin/home-sliders": 2,
  "/vi/admin/landing-pages": 2,
  "/en/admin/landing-pages": 2,
  "/vi/admin/services": 2,
  "/en/admin/services": 2,
  "/vi/admin/expertises": 2,
  "/en/admin/expertises": 2,
  // Content: media level (3) and above
  "/vi/admin/projects": 3,
  "/en/admin/projects": 3,
  "/vi/admin/testimonials": 3,
  "/en/admin/testimonials": 3,
  // Sales: media level (3) and above
  "/vi/admin/orders": 3,
  "/en/admin/orders": 3,
  "/vi/admin/web-templates": 2,
  "/en/admin/web-templates": 2,
  "/vi/admin/service-attributes": 2,
  "/en/admin/service-attributes": 2,
  "/vi/admin/addon-services": 2,
  "/en/admin/addon-services": 2,
  "/vi/admin/reward-tiers": 2,
  "/en/admin/reward-tiers": 2,
  "/vi/admin/packages": 2,
  "/en/admin/packages": 2,
  "/vi/admin/pricing-features": 2,
  "/en/admin/pricing-features": 2,
  "/vi/admin/quote-requests": 3,
  "/en/admin/quote-requests": 3,
  "/vi/admin/websites": 3,
  "/en/admin/websites": 3,
  "/vi/admin/points": 2,
  "/en/admin/points": 2,
  // Messages: QA level (4) and above
  "/vi/admin/messages": 4,
  "/en/admin/messages": 4,
  // System: admin level (1) and above
  "/vi/admin/users": 1,
  "/en/admin/users": 1,
  "/vi/admin/roles": 1,
  "/en/admin/roles": 1,
  "/vi/admin/audit-log": 1,
  "/en/admin/audit-log": 1,
  "/vi/admin/settings": 1,
  "/en/admin/settings": 1,
  // Generic /admin prefix (fallback)
  "/vi/admin/": 1,
  "/en/admin/": 1,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAuthenticated(req: NextRequest): boolean {
  const nextAuthSessionToken = req.cookies.get("next-auth.session-token");
  const nextAuthCsrfToken = req.cookies.get("__Host-next-auth.csrf-token");
  const authToken = req.cookies.get("auth-token");
  return !!(nextAuthSessionToken || authToken || nextAuthCsrfToken);
}

function isPublicApiPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/admin/auth/") ||
    pathname === "/api/admin/auth/seed-roles"
  );
}

async function getUserRoleLevel(req: NextRequest): Promise<number> {
  // Try custom JWT
  const authToken = req.cookies.get("auth-token")?.value;
  if (authToken) {
    try {
      // Simple verify without full signature check for edge
      const payload = JSON.parse(
        Buffer.from(authToken.split(".")[1] ?? "", "base64").toString()
      );
      if (payload.userId) {
        return ROLE_LEVEL[payload.role] ?? 99;
      }
    } catch {
      // fall through
    }
  }

  // NextAuth session → check DB for fresh role (uncommon in edge but handled)
  // Skip DB check in edge for performance; let the shell handle full auth
  return 99;
}

function getRequiredLevel(pathname: string): number {
  // Exact match first
  if (PATH_ROLE_REQUIREMENTS[pathname] !== undefined) {
    return PATH_ROLE_REQUIREMENTS[pathname];
  }
  // Prefix match (e.g. /vi/admin/users → /vi/admin/)
  for (const [prefix, level] of Object.entries(PATH_ROLE_REQUIREMENTS)) {
    if (prefix.endsWith("/") && pathname.startsWith(prefix)) {
      return level;
    }
  }
  // Default: admin level (1)
  return 1;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin API routes ─────────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    // Allow public auth endpoints
    if (isPublicApiPath(pathname)) {
      return NextResponse.next();
    }

    // Auth check
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-level check for admin API routes
    const requiredLevel = getRequiredLevel(pathname.replace("/api/admin", ""));
    if (requiredLevel < 5) {
      const userLevel = await getUserRoleLevel(req);
      if (userLevel > requiredLevel) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  }

  // ── Admin page routes ────────────────────────────────────────────────────
  const adminPattern = /^\/(vi|en)\/admin/;
  if (adminPattern.test(pathname)) {
    if (!isAuthenticated(req)) {
      const locale = pathname.split("/")[1];
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-level page guard
    const requiredLevel = getRequiredLevel(pathname);
    if (requiredLevel < 5) {
      const userLevel = await getUserRoleLevel(req);
      if (userLevel > requiredLevel) {
        const locale = pathname.split("/")[1];
        const deniedUrl = new URL(`/${locale}/admin/access-denied`, req.url);
        return NextResponse.redirect(deniedUrl);
      }
    }

    return intlMiddleware(req);
  }

  // ── /admin (without locale) ───────────────────────────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAuthenticated(req)) {
      const loginUrl = new URL("/vi/login", req.url);
      loginUrl.searchParams.set("redirect", "/vi/admin");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL("/vi/admin", req.url));
  }

  // ── All other routes: i18n ────────────────────────────────────────────────
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
