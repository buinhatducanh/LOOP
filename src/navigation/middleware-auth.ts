/**
 * Edge Authentication Logic
 *
 * This module runs in the Edge Runtime (Vercel Edge Middleware).
 * It contains all auth-related logic that needs to be at the edge:
 *   - Cookie-based session detection (JWT + NextAuth)
 *   - Role-level route guards for admin paths
 *   - Locale-aware redirect URLs
 *
 * ⚠️  IMPORTANT: Edge auth is best-effort. The actual auth decision
 *     (token verification, permission checks) always happens in API routes
 *     using server-side jwt.verify() with full signature validation.
 */

import { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { ROLE_LEVEL, getAdminRouteConfig } from "./routes";
import { getLocaleFromPathname, buildLoginUrl } from "./utils";
import { decodeJwtPayload } from "@/lib/auth/edge";

// ─── Cookie Keys ───────────────────────────────────────────────────────────────

export const AUTH_COOKIES = {
  AUTH_TOKEN: "auth-token",
  AUTH_METHOD: "auth-method",
  NEXT_AUTH_SESSION: "next-auth.session-token",
  NEXT_AUTH_CSRF: "__Host-next-auth.csrf-token",
} as const;

// ─── Auth Status ───────────────────────────────────────────────────────────────

export type AuthMethod = "jwt" | "nextauth" | null;

export interface AuthStatus {
  authenticated: boolean;
  method: AuthMethod;
}

/**
 * Check if the request has any valid auth token (JWT or NextAuth session).
 * Fast, no DB call — suitable for Edge.
 */
export function getAuthStatus(req: NextRequest): AuthStatus {
  const authToken = req.cookies.get(AUTH_COOKIES.AUTH_TOKEN)?.value;
  const nextAuthToken = req.cookies.get(AUTH_COOKIES.NEXT_AUTH_SESSION)?.value;
  const csrfToken = req.cookies.get(AUTH_COOKIES.NEXT_AUTH_CSRF)?.value;

  if (authToken) return { authenticated: true, method: "jwt" };
  if (nextAuthToken || csrfToken) return { authenticated: true, method: "nextauth" };
  return { authenticated: false, method: null };
}

/**
 * Get user's role level from JWT token at the edge.
 * Returns 99 (unauthenticated) if no valid JWT is found.
 *
 * NOTE: This decodes WITHOUT signature verification (appropriate for routing
 * decisions at the edge — actual verification happens server-side).
 */
export function getEdgeUserRoleLevel(req: NextRequest): number {
  const authToken = req.cookies.get(AUTH_COOKIES.AUTH_TOKEN)?.value;
  if (!authToken) return 99;

  const payload = decodeJwtPayload(authToken);
  if (!payload?.userId) return 99;

  const role = String(payload.role ?? "");
  return ROLE_LEVEL[role] ?? 99;
}

// ─── Edge Auth Check ──────────────────────────────────────────────────────────

export interface EdgeAuthResult {
  allowed: boolean;
  reason?: string;
  redirectUrl?: string;
}

/**
 * Main edge auth check for a given request pathname.
 * Returns whether the request is allowed and why.
 */
export function checkEdgeAuth(pathname: string, req: NextRequest): EdgeAuthResult {
  // ── Static / public paths: always allow ───────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") || // any file extension
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/admin/auth/") ||
    pathname === "/api/health"
  ) {
    return { allowed: true };
  }

  // ── Admin routes ───────────────────────────────────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const authStatus = getAuthStatus(req);

    if (!authStatus.authenticated) {
      return {
        allowed: false,
        reason: "unauthenticated",
        redirectUrl: buildLoginUrl(pathname, req),
      };
    }

    // For JWT auth: check role level
    // NextAuth sessions are trusted at the edge (session verified by NextAuth itself)
    if (authStatus.method === "jwt") {
      const route = getAdminRouteConfig(pathname);
      if (route && route.minRoleLevel < 5) {
        // Only enforce role check for routes requiring specific roles
        const userRoleLevel = getEdgeUserRoleLevel(req);
        if (userRoleLevel > route.minRoleLevel) {
          return {
            allowed: false,
            reason: "insufficient_role",
            redirectUrl: "/admin/access-denied",
          };
        }
      }
    }

    return { allowed: true };
  }

  // ── Public locale routes: always allow ─────────────────────────────────
  return { allowed: true };
}

// ─── Locale helpers for middleware ────────────────────────────────────────────

// Re-export for convenience in edge/middleware context
export { getLocaleFromPathname as getLocaleFromRequest } from "./utils";

/**
 * Strip locale prefix from admin routes.
 * e.g. /vi/admin/dashboard → /admin/dashboard
 *
 * Returns the stripped path, or null if not a locale-prefixed admin route.
 */
export function stripLocaleFromAdmin(pathname: string): string | null {
  for (const locale of routing.locales) {
    const adminWithLocale = `/${locale}/admin`;
    if (pathname === adminWithLocale || pathname.startsWith(adminWithLocale + "/")) {
      return pathname.replace(`/${locale}`, "");
    }
  }
  return null;
}

/**
 * Map of legacy flat admin paths → new grouped paths.
 * Used by middleware for backward compatibility redirects.
 */
export const LEGACY_ADMIN_REDIRECTS: Record<string, string> = {
  "/admin/home-sliders":      "/admin/content/home-sliders",
  "/admin/landing-pages":     "/admin/content/landing-pages",
  "/admin/services":          "/admin/content/services",
  "/admin/expertises":        "/admin/content/expertises",
  "/admin/team":              "/admin/content/team",
  "/admin/projects":          "/admin/content/projects",
  "/admin/testimonials":      "/admin/content/testimonials",
  "/admin/messages":          "/admin/content/messages",
  "/admin/orders":            "/admin/sales/orders",
  "/admin/web-templates":     "/admin/sales/web-templates",
  "/admin/service-attributes": "/admin/sales/service-attributes",
  "/admin/addon-services":    "/admin/sales/addon-services",
  "/admin/reward-tiers":      "/admin/sales/reward-tiers",
  "/admin/packages":          "/admin/sales/packages",
  "/admin/hosting-plans":     "/admin/sales/hosting-plans",
  "/admin/domain-prices":     "/admin/sales/domain-prices",
  "/admin/deployment-items":  "/admin/sales/deployment-items",
  "/admin/pricing-features":  "/admin/sales/pricing-features",
  "/admin/quote-requests":    "/admin/sales/quote-requests",
  "/admin/staff-users":       "/admin/system/staff-users",
  "/admin/roles":             "/admin/system/roles",
  "/admin/points":            "/admin/system/points",
  "/admin/websites":          "/admin/system/websites",
  "/admin/audit-log":         "/admin/system/audit-log",
  "/admin/settings":          "/admin/system/settings",
};
