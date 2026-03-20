/**
 * Edge-compatible authentication utilities.
 *
 * These functions run in the Edge Runtime (Vercel Edge Middleware, Cloudflare Workers).
 * They avoid Node.js-specific APIs (crypto, Buffer, fs, etc.).
 *
 * For full server-side auth (role lookups, session DB checks), use
 * the Node.js-only functions in src/lib/auth/permissions.ts instead.
 */

import { NextRequest } from "next/server";

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ROLE_LEVEL: Record<string, number> = {
  ceo: -1,
  super_admin: 0,
  admin: 1,
  project_manager: 2,
  media: 3,
  qa: 4,
  member: 5,
} as const;

export const PATH_ROLE_REQUIREMENTS: Record<string, number> = {
  "/admin": 5,
  "/admin/content/home-sliders": 2,
  "/admin/content/landing-pages": 2,
  "/admin/content/services": 2,
  "/admin/content/expertises": 2,
  "/admin/content/team": 1,
  "/admin/content/projects": 3,
  "/admin/content/testimonials": 3,
  "/admin/content/messages": 4,
  "/admin/sales/orders": 3,
  "/admin/sales/web-templates": 2,
  "/admin/sales/service-attributes": 2,
  "/admin/sales/addon-services": 2,
  "/admin/sales/reward-tiers": 2,
  "/admin/sales/packages": 2,
  "/admin/sales/pricing-features": 2,
  "/admin/sales/quote-requests": 3,
  "/admin/system/staff-users": 1,
  "/admin/system/roles": 1,
  "/admin/system/points": 2,
  "/admin/system/websites": 3,
  "/admin/system/audit-log": 1,
  "/admin/system/settings": 1,
} as const;

export const PUBLIC_PATHS = [
  "/api/auth/",
  "/api/admin/auth/",
  "/api/health",
  "/api/contact",
  "/api/search",
  "/api/services",
  "/api/projects",
  "/api/team",
  "/api/testimonials",
  "/api/pricing",
  "/api/v1/",
] as const;

export const PUBLIC_PREFIXES = ["/login", "/register"] as const;

// ─── Cookie Keys ────────────────────────────────────────────────────────────────

export const COOKIES = {
  AUTH_TOKEN: "auth-token",
  NEXT_AUTH_SESSION: "next-auth.session-token",
  NEXT_AUTH_CSRF: "__Host-next-auth.csrf-token",
  AUTH_METHOD: "auth-method",
} as const;

// ─── Edge-safe JWT decode ─────────────────────────────────────────────────────

/**
 * Decode a JWT payload WITHOUT verifying the signature.
 *
 * ⚠️  WARNING: This only decodes the payload. It does NOT verify the signature.
 *     Use this ONLY for extracting non-sensitive metadata (role, userId).
 *     For verifying tokens, use the Node.js `jwt.verify()` in API routes.
 *
 * This works in Edge Runtime because it uses the native TextDecoder API
 * instead of Node's `Buffer`.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Base64url → Base64 → UTF-8 using native browser APIs
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    // Use native TextDecoder (Edge-compatible) instead of Node's Buffer
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ─── Auth check (Edge-compatible) ───────────────────────────────────────────────

/**
 * Check if a request has any auth token present (JWT or NextAuth session).
 * This is fast (no DB call) and suitable for Edge Middleware.
 *
 * Returns: { authenticated: boolean, method: "jwt" | "nextauth" | null }
 */
export function getAuthStatus(req: NextRequest): {
  authenticated: boolean;
  method: "jwt" | "nextauth" | null;
} {
  const authToken = req.cookies.get(COOKIES.AUTH_TOKEN)?.value;
  const nextAuthToken = req.cookies.get(COOKIES.NEXT_AUTH_SESSION)?.value;
  const csrfToken = req.cookies.get(COOKIES.NEXT_AUTH_CSRF)?.value;

  if (authToken) {
    return { authenticated: true, method: "jwt" };
  }
  if (nextAuthToken || csrfToken) {
    return { authenticated: true, method: "nextauth" };
  }
  return { authenticated: false, method: null };
}

// ─── Role extraction (Edge-compatible) ─────────────────────────────────────────

/**
 * Get the user's role level from the JWT auth token.
 * Returns 99 (lowest) if no valid token is found.
 *
 * This runs in Edge and does NOT hit the database.
 */
export function getUserRoleLevel(req: NextRequest): number {
  const authToken = req.cookies.get(COOKIES.AUTH_TOKEN)?.value;
  if (!authToken) return 99;

  const payload = decodeJwtPayload(authToken);
  if (!payload?.userId) return 99;

  const role = String(payload.role ?? "");
  return ROLE_LEVEL[role] ?? 99;
}

/**
 * Check if a request path is public (no auth required).
 */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

/**
 * Get the minimum role level required for a given admin path.
 */
export function getRequiredLevel(pathname: string): number {
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
  return 5; // Default: all authenticated staff can access
}

/**
 * Full Edge-compatible auth check for admin routes.
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
export function checkAdminAccess(req: NextRequest, pathname: string): {
  allowed: boolean;
  reason?: string;
} {
  // Public paths are always allowed
  if (isPublicPath(pathname)) {
    return { allowed: true };
  }

  const { authenticated, method } = getAuthStatus(req);

  if (!authenticated) {
    return { allowed: false, reason: "unauthenticated" };
  }

  // For routes requiring a specific role level
  const requiredLevel = getRequiredLevel(pathname);
  if (requiredLevel < 5) {
    const userLevel = getUserRoleLevel(req);
    if (userLevel > requiredLevel) {
      return { allowed: false, reason: "forbidden" };
    }
  }

  return { allowed: true };
}
