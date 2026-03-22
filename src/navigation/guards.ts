/**
 * Auth Guards — Client & Server
 *
 * Provides permission-checking functions used by:
 *   - Middleware (edge-compatible — see middleware-auth.ts)
 *   - AdminShell (client-side sidebar and route guards)
 *   - Server components (optional server-side page guards)
 *
 * Three-layer auth defense:
 *   1. Edge middleware    → blocks unauthenticated users
 *   2. AdminShell guard  → blocks client-side auth bypass
 *   3. Server/API guards → blocks API-level access violations
 *
 * Permission checking uses NAV_PERMISSIONS from @/lib/auth/roles as the
 * single source of truth. NAV_PERMISSIONS maps admin paths → { minRoleLevel, permissions[] }.
 */

import { ROLE_LEVEL } from "@/lib/auth/roles";
import { NAV_PERMISSIONS } from "@/lib/auth/roles";
import type { NavPermission } from "@/lib/auth/roles";
import { getLoginRedirectUrl } from "./utils";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Auth user shape — compatible with AdminUser from admin-auth-provider.tsx.
 * Permissions are stored as UserPermission[] (resource + action + scope).
 */
export interface AuthUser {
  role: string;
  roleLevel: number;
  /** Granular permissions from DB (resource + action + scope) */
  permissions: Array<{ resource: string; action: string; scope: string }>;
}

/** Result of a route access check */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: "unauthenticated" | "insufficient_role" | "insufficient_permission";
  redirectUrl?: string;
}

// ─── Permission helpers ────────────────────────────────────────────────────────

/**
 * Check if user has a specific permission (wildcard-aware).
 * Mirrors hasPermission() from @/lib/auth/permissions but works on client side.
 */
function userHasPermission(
  userPermissions: AuthUser["permissions"],
  resource: string,
  actions: string[]
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return userPermissions.some(
    (p) =>
      (p.resource === "*" && p.action === "*") ||
      (p.resource === "*" && actions.includes(p.action)) ||
      (p.resource === resource && p.action === "*") ||
      (p.resource === resource && actions.includes(p.action))
  );
}

/**
 * Check if user is super_admin (bypasses all permission checks).
 */
function isSuperAdmin(user: AuthUser): boolean {
  return user.role === "ceo" || user.role === "super_admin";
}

// ─── Client-side guard helpers ────────────────────────────────────────────────

/**
 * Check if a user can access a given admin path.
 * Used by AdminShell and sidebar for client-side access control.
 *
 * Access rule (all must pass OR user is super_admin):
 *   - No user → unauthenticated (redirect to login)
 *   - userRoleLevel > minRoleLevel → insufficient_role (redirect to access-denied)
 *   - Permission check fails → insufficient_permission (redirect to access-denied)
 *
 * @param user - AuthUser from useAdminAuth()
 * @param path - Admin path e.g. "/admin/content/home-sliders"
 */
export function canAccessAdminPath(
  user: AuthUser | null,
  path: string
): AccessCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: "unauthenticated",
      redirectUrl: getLoginRedirectUrl(path),
    };
  }

  // Super admin bypasses all checks
  if (isSuperAdmin(user)) {
    return { allowed: true };
  }

  // Look up nav permission config from NAV_PERMISSIONS (single source of truth)
  const navConfig: NavPermission | undefined = (NAV_PERMISSIONS as Record<string, NavPermission>)[path];
  if (!navConfig) {
    // Unknown path — allow (edge middleware will block if truly unauthorized)
    return { allowed: true };
  }

  // Role level check
  if (user.roleLevel > (navConfig.minRoleLevel ?? 0)) {
    return {
      allowed: false,
      reason: "insufficient_role",
      redirectUrl: "/admin/access-denied",
    };
  }

  // Permission check (OR logic — any matching permission allows access)
  if (navConfig.permissions && navConfig.permissions.length > 0) {
    const hasPermission = navConfig.permissions.some(({ resource, actions }) =>
      userHasPermission(user.permissions, resource, actions)
    );
    if (!hasPermission) {
      return {
        allowed: false,
        reason: "insufficient_permission",
        redirectUrl: "/admin/access-denied",
      };
    }
  }

  return { allowed: true };
}

/**
 * Check if a user can see a nav item in the sidebar.
 * Uses same rules as canAccessAdminPath() but returns boolean.
 */
export function canSeeNavItem(user: AuthUser | null, path: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  const navConfig: NavPermission | undefined = (NAV_PERMISSIONS as Record<string, NavPermission>)[path];
  if (!navConfig) return true;

  // Role level check
  if (user.roleLevel > (navConfig.minRoleLevel ?? 0)) return false;

  // Permission check
  if (navConfig.permissions && navConfig.permissions.length > 0) {
    return navConfig.permissions.some(({ resource, actions }) =>
      userHasPermission(user.permissions, resource, actions)
    );
  }

  return true;
}

/**
 * Get sidebar navigation paths visible to this user.
 * Returns standalone items + grouped items by admin path.
 */
export function getVisibleNavItems(user: AuthUser | null): {
  standalone: string[];
  byGroup: Record<string, string[]>;
} {
  if (!user) {
    return { standalone: [], byGroup: { content: [], sales: [], system: [] } };
  }

  const navPaths = Object.keys(NAV_PERMISSIONS as Record<string, NavPermission>);
  const allowed = navPaths.filter((path) => canSeeNavItem(user, path));

  // Determine group from path structure
  const byGroup: Record<string, string[]> = { content: [], sales: [], system: [] };
  const standalone: string[] = [];

  for (const path of allowed) {
    if (path === "/admin") {
      standalone.unshift("/admin");
      continue;
    }
    if (path === "/admin/access-denied") continue;

    if (path.startsWith("/admin/content/")) {
      byGroup.content.push(path);
    } else if (path.startsWith("/admin/sales/")) {
      byGroup.sales.push(path);
    } else if (path.startsWith("/admin/system/")) {
      byGroup.system.push(path);
    }
  }

  return { standalone, byGroup };
}

// ─── Role helpers (re-exported for convenience) ───────────────────────────────

export { ROLE_LEVEL };
