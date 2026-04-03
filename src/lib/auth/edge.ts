/**
 * Edge-compatible authentication utilities.
 *
 * These functions run in the Edge Runtime (Vercel Edge Middleware, Cloudflare Workers).
 * They avoid Node.js-specific APIs (crypto, Buffer, fs, etc.).
 *
 * For full server-side auth (role lookups, session DB checks), use
 * the Node.js-only functions in src/lib/auth/permissions.ts instead.
 *
 * JWT Strategy:
 *   - Edge Middleware routing: decode-only (no env access in middleware)
 *   - API routes / actual auth: use verifyAuthToken() with full jose signature verification
 */

import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Role level hierarchy (lower = more privileged).
 *
 *   -1 = CEO          (top-level access)
 *    0 = super_admin
 *    1 = admin
 *    2 = project_manager
 *    3 = media
 *    4 = qa
 *    5 = member       (any authenticated staff)
 *   99 = unauthenticated (fallback)
 *
 * Route requirements use this scale: a user can access routes
 * where userLevel <= requiredLevel (i.e. more-privileged users
 * can access less-privileged routes).
 */
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

export const PUBLIC_PREFIXES = ["/vi/dang-nhap", "/en/dang-nhap", "/ja/dang-nhap", "/ko/dang-nhap", "/zh/dang-nhap"] as const;

// ─── Cookie Keys ───────────────────────────────────────────────────────────────

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
 * instead of Node's Buffer.
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
 * Higher level value = less privileged.
 *
 *   0-4  → specific roles (super_admin, admin, project_manager, media, qa)
 *   5    → any authenticated member
 *   99   → no valid token
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
 *
 * Role check logic:
 *   - Routes at levels 0-4: require a specific privileged role.
 *     userLevel must be <= requiredLevel (e.g. admin(1) can access level-2 routes).
 *   - Routes at level 5: require only that the user is authenticated (any staff role).
 *     Role-level check is skipped since all staff are level-5 or lower.
 *   - Routes at level 99 (no token): always denied.
 *
 * ⚠️  Edge role checks are best-effort. Every API route that performs sensitive
 *     operations MUST re-verify the token with full server-side jwt.verify().
 */
export function checkAdminAccess(req: NextRequest, pathname: string): {
  allowed: boolean;
  reason?: string;
} {
  // Public paths are always allowed
  if (isPublicPath(pathname)) {
    return { allowed: true };
  }

  const { authenticated } = getAuthStatus(req);

  if (!authenticated) {
    return { allowed: false, reason: "unauthenticated" };
  }

  const requiredLevel = getRequiredLevel(pathname);

  /*
   * Routes with requiredLevel >= 5: any authenticated user qualifies.
   * We skip the role check here because ROLE_LEVEL values for actual roles
   * are all <= 5, so all real users can access level-5 routes regardless.
   * (getRequiredLevel returns 5 as the default for unlisted paths, meaning
   * "any staff member" — not a restricted role.)
   *
   * Routes with requiredLevel < 5: enforce role hierarchy.
   * A user can access the route if their level is <= the required level
   * (i.e. more-privileged users can access less-privileged routes).
   */
  if (requiredLevel < 5) {
    const userLevel = getUserRoleLevel(req);
    if (userLevel > requiredLevel) {
      return { allowed: false, reason: "forbidden" };
    }
  }

  return { allowed: true };
}

// ─── Full JWT signature verification (Node.js / Edge) ──────────────────────────

/**
 * Verify a JWT with full cryptographic signature check using `jose`.
 * Works in both Edge Runtime and Node.js.
 *
 * Returns the verified payload or null if invalid/expired.
 *
 * ⚠️  NOTE: Edge Middleware cannot access process.env at some runtimes.
 *     If JWT_SECRET is unavailable, this falls back to decode-only
 *     (same security posture as before). API routes always have env access.
 */
export async function verifyAuthToken(
  token: string
): Promise<Record<string, unknown> | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fallback: no secret available (Edge Middleware at some runtimes)
    // Log warning server-side only
    return decodeJwtPayload(token);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
