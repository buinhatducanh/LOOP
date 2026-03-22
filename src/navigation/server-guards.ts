/**
 * Server-side Auth Guards
 *
 * For use in Server Components and Route Handlers where getSession() is available.
 * Provides early redirect before any client code runs.
 *
 * These are used alongside (not replacing) edge middleware guards.
 * Defense-in-depth: edge blocks most, server catches edge bypasses.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/permissions";
import { ROLE_LEVEL } from "@/lib/auth/roles";
import type { NavPermission } from "@/lib/auth/roles";
import { NAV_PERMISSIONS } from "@/lib/auth/roles";

// ─── Admin page guards ─────────────────────────────────────────────────────────

/**
 * Require admin authentication for a server component page.
 * Redirects to /{locale}/login if not authenticated.
 *
 * Usage:
 *   // In a server component page file:
 *   export default async function Page() {
 *     await requireAdmin();
 *     return <AdminPage />;
 *   }
 */
export async function requireAdmin(): Promise<void> {
  try {
    await requireAuth();
  } catch {
    // requireAuth throws AuthError — redirect to login
    // We can't know the user's locale here, so use default
    redirect("/vi/login");
  }
}

/**
 * Require minimum role level for a server component page.
 * Redirects to /{locale}/login if not authenticated,
 * or /admin/access-denied if role is insufficient.
 *
 * @param minRoleLevel - Maximum role level value allowed (lower = more powerful).
 *                       e.g. ROLE_LEVEL.admin (1) allows roles ceo, super_admin, admin only.
 */
export async function requireAdminRole(minRoleLevel: number): Promise<void> {
  try {
    const session = await requireAuth();
    const userLevel = ROLE_LEVEL[session.role] ?? 99;
    if (userLevel > minRoleLevel) {
      redirect("/vi/admin/access-denied");
    }
  } catch {
    redirect("/vi/login");
  }
}

/**
 * Require access to a specific admin path (role level + permissions check).
 * Uses NAV_PERMISSIONS as the source of truth.
 *
 * @param path - Admin path e.g. "/admin/content/home-sliders"
 * @param locale - Current locale for redirect (default "vi")
 */
export async function requireAdminPath(
  path: string,
  locale = "vi"
): Promise<void> {
  try {
    const session = await requireAuth();

    // Super admin bypasses all checks
    if (session.role === "ceo" || session.role === "super_admin") {
      return;
    }

    const navConfig: NavPermission | undefined = (NAV_PERMISSIONS as Record<string, NavPermission>)[path];

    // Unknown path — allow (edge middleware handles blocking)
    if (!navConfig) return;

    // Role level check
    const userLevel = ROLE_LEVEL[session.role] ?? 99;
    if (userLevel > (navConfig.minRoleLevel ?? 0)) {
      redirect(`/${locale}/admin/access-denied`);
    }

    // Permission check (OR logic)
    if (navConfig.permissions && navConfig.permissions.length > 0) {
      const userPerms = session.permissions ?? [];
      const hasPermission = navConfig.permissions.some(({ resource, actions }) =>
        userPerms.some(
          (p) =>
            (p.resource === "*" && p.action === "*") ||
            (p.resource === "*" && actions.includes(p.action)) ||
            (p.resource === resource && p.action === "*") ||
            (p.resource === resource && actions.includes(p.action))
        )
      );
      if (!hasPermission) {
        redirect(`/${locale}/admin/access-denied`);
      }
    }
  } catch {
    redirect(`/${locale}/login`);
  }
}
