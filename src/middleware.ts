import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// ─── Role level map ─────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<string, number> = {
  ceo: -1,
  super_admin: 0,
  admin: 1,
  project_manager: 2,
  media: 3,
  qa: 4,
  member: 5,
};

// ─── Min role level per admin path ─────────────────────────────────────────
// Paths MUST match the actual folder structure under src/app/admin/
// content/* → /admin/content/{name}   sales/* → /admin/sales/{name}   system/* → /admin/system/{name}

const PATH_ROLE_REQUIREMENTS: Record<string, number> = {
  // Dashboard: all staff
  "/admin": 5,
  // Content  → src/app/admin/content/{name}/page.tsx
  "/admin/content/home-sliders": 2,
  "/admin/content/landing-pages": 2,
  "/admin/content/services": 2,
  "/admin/content/expertises": 2,
  "/admin/content/team": 1,
  "/admin/content/projects": 3,
  "/admin/content/testimonials": 3,
  "/admin/content/messages": 4,
  // Sales  → src/app/admin/sales/{name}/page.tsx
  "/admin/sales/orders": 3,
  "/admin/sales/web-templates": 2,
  "/admin/sales/service-attributes": 2,
  "/admin/sales/addon-services": 2,
  "/admin/sales/reward-tiers": 2,
  "/admin/sales/packages": 2,
  "/admin/sales/pricing-features": 2,
  "/admin/sales/quote-requests": 3,
  // System  → src/app/admin/system/{name}/page.tsx
  "/admin/system/staff-users": 1,
  "/admin/system/roles": 1,
  "/admin/system/points": 2,
  "/admin/system/websites": 3,
  "/admin/system/audit-log": 1,
  "/admin/system/settings": 1,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  const authToken = req.cookies.get("auth-token")?.value;
  if (authToken) {
    try {
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
  // NextAuth session → skip DB check in edge for performance
  return 99;
}

function getRequiredLevel(pathname: string): number {
  // Exact match first
  if (PATH_ROLE_REQUIREMENTS[pathname] !== undefined) {
    return PATH_ROLE_REQUIREMENTS[pathname];
  }
  // Prefix match (e.g. /admin/users → /admin/)
  for (const [prefix, level] of Object.entries(PATH_ROLE_REQUIREMENTS)) {
    if (prefix.endsWith("/") && pathname.startsWith(prefix)) {
      return level;
    }
  }
  // Default: all authenticated staff can access
  return 5;
}

// ─── Middleware ────────────────────────────────────────────────────────────

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin API routes ─────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    if (isPublicApiPath(pathname)) {
      return NextResponse.next();
    }
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requiredLevel = getRequiredLevel(pathname.replace("/api/admin", ""));
    if (requiredLevel < 5) {
      const userLevel = await getUserRoleLevel(req);
      if (userLevel > requiredLevel) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // ── Admin page routes (/admin/* — no locale) ─────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // ── Redirect old flat admin paths → new grouped paths ──
    const OLD_TO_NEW: Record<string, string> = {
      "/admin/home-sliders":     "/admin/content/home-sliders",
      "/admin/landing-pages":    "/admin/content/landing-pages",
      "/admin/services":         "/admin/content/services",
      "/admin/expertises":       "/admin/content/expertises",
      "/admin/team":             "/admin/content/team",
      "/admin/projects":         "/admin/content/projects",
      "/admin/testimonials":     "/admin/content/testimonials",
      "/admin/messages":         "/admin/content/messages",
      "/admin/orders":           "/admin/sales/orders",
      "/admin/web-templates":    "/admin/sales/web-templates",
      "/admin/service-attributes": "/admin/sales/service-attributes",
      "/admin/addon-services":   "/admin/sales/addon-services",
      "/admin/reward-tiers":     "/admin/sales/reward-tiers",
      "/admin/packages":         "/admin/sales/packages",
      "/admin/hosting-plans":    "/admin/sales/hosting-plans",
      "/admin/domain-prices":    "/admin/sales/domain-prices",
      "/admin/deployment-items": "/admin/sales/deployment-items",
      "/admin/pricing-features": "/admin/sales/pricing-features",
      "/admin/quote-requests":   "/admin/sales/quote-requests",
      "/admin/staff-users":      "/admin/system/staff-users",
      "/admin/roles":            "/admin/system/roles",
      "/admin/points":          "/admin/system/points",
      "/admin/websites":        "/admin/system/websites",
      "/admin/audit-log":      "/admin/system/audit-log",
      "/admin/settings":        "/admin/system/settings",
    };

    const oldBase = Object.keys(OLD_TO_NEW).find(
      (k) => pathname === k || pathname.startsWith(k + "/")
    );
    if (oldBase) {
      const suffix = pathname.slice(oldBase.length);
      return NextResponse.redirect(
        new URL(`${OLD_TO_NEW[oldBase]}${suffix}`, req.url),
        308
      );
    }

    if (!isAuthenticated(req)) {
      const loginUrl = new URL("/vi/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const requiredLevel = getRequiredLevel(pathname);
    if (requiredLevel < 5) {
      const userLevel = await getUserRoleLevel(req);
      if (userLevel > requiredLevel) {
        const deniedUrl = new URL("/admin/access-denied", req.url);
        return NextResponse.redirect(deniedUrl);
      }
    }
    return NextResponse.next();
  }

  // ── Admin routes WITH locale prefix (e.g. /vi/admin, /en/admin) ────
  // intlMiddleware may pass these through; catch them here first
  for (const locale of routing.locales) {
    const adminPath = `/${locale}/admin`;
    const adminRoot = `/${locale}/admin/`;
    if (pathname === adminPath || pathname.startsWith(adminRoot)) {
      // Strip locale prefix to get the real admin path
      const realPath = pathname.replace(`/${locale}`, "") || "/admin";
      if (!isAuthenticated(req)) {
        const loginUrl = new URL("/vi/login", req.url);
        loginUrl.searchParams.set("redirect", realPath);
        return NextResponse.redirect(loginUrl);
      }
      const requiredLevel = getRequiredLevel(realPath);
      if (requiredLevel < 5) {
        const userLevel = await getUserRoleLevel(req);
        if (userLevel > requiredLevel) {
          const deniedUrl = new URL("/admin/access-denied", req.url);
          return NextResponse.redirect(deniedUrl);
        }
      }
      // Redirect to the canonical no-locale admin URL
      return NextResponse.redirect(new URL(realPath, req.url));
    }
  }

  // ── All other routes: i18n ────────────────────────────────────────
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
