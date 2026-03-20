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

const PATH_ROLE_REQUIREMENTS: Record<string, number> = {
  // Dashboard: all staff
  "/admin": 5,
  // Content: PM level (2) and above
  "/admin/home-sliders": 2,
  "/admin/landing-pages": 2,
  "/admin/services": 2,
  "/admin/expertises": 2,
  "/admin/team": 1,
  // Content: media level (3) and above
  "/admin/projects": 3,
  "/admin/testimonials": 3,
  // Sales: media level (3) and above
  "/admin/orders": 3,
  "/admin/web-templates": 2,
  "/admin/service-attributes": 2,
  "/admin/addon-services": 2,
  "/admin/reward-tiers": 2,
  "/admin/packages": 2,
  "/admin/pricing-features": 2,
  "/admin/quote-requests": 3,
  "/admin/websites": 3,
  "/admin/points": 2,
  // Messages: QA level (4) and above
  "/admin/messages": 4,
  // System: admin level (1) and above
  "/admin/users": 1,
  "/admin/roles": 1,
  "/admin/audit-log": 1,
  "/admin/settings": 1,
  // Unknown admin routes: fallback to level 5 (all staff)
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
    if (!isAuthenticated(req)) {
      const loginUrl = new URL("/login", req.url);
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
