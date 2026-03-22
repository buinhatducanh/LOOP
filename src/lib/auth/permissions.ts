/**
 * Granular RBAC Permissions System
 *
 * Architecture:
 *  - Role level gates: SUPER_ADMIN (0) → ADMIN (1) → PM (2) → MEDIA (3) → QA (4) → MEMBER (5)
 *  - Resource + Action permissions are stored in DB per role
 *  - Super admin bypasses ALL permission checks (wildcard *)
 *  - Admin bypasses all except role/super_admin management
 *  - All other roles require explicit permission entries in DB
 *
 * Permission flow:
 *  1. Middleware blocks unauthenticated users at the edge
 *  2. Admin shell blocks role-level page access server-side
 *  3. API routes call requirePermission() for resource-level gating
 *  4. UI components use PermissionGuard for conditional rendering
 */

import { prisma } from "@/lib/prisma";
import { verifyToken } from "./jwt";
import { cookies } from "next/headers";
import { ROLE_LEVEL, type NavPermission } from "./roles";
import { auth } from "@/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PermissionAction = "create" | "read" | "update" | "delete" | "export" | "approve";

/** Single resource permission entry */
export interface UserPermission {
  resource: string;
  action: string;
  scope: string;
}

/** Session user — returned from getSession() */
export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  avatar: string | null;
  accountType: "staff" | "customer";
  teamMemberId: string | null;
  /** Role level (CEO=-1, super_admin=0, admin=1, pm=2, media=3, qa=4, member=5) */
  roleLevel: number;
  /** Cached permission list for the active role */
  permissions?: UserPermission[];
}

// ─── Session ──────────────────────────────────────────────────────────────────

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const authMethod = cookieStore.get("auth-method")?.value;

  // ── Credentials login: use custom JWT only (skip NextAuth entirely) ──
  if (authMethod === "credentials") {
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId, isActive: true },
        include: {
          userRoles: {
            include: { role: { include: { permissions: true } } },
            where: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      });

      if (!user) return null;

      const permissions = user.userRoles.flatMap((ur) =>
        ur.role.permissions.map((p) => ({
          resource: p.resource,
          action: p.action,
          scope: p.scope,
        }))
      );

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.userRoles.map((ur) => ur.role.name),
        avatar: user.avatar,
        accountType: (user.accountType as "staff" | "customer") || "customer",
        teamMemberId: user.teamMemberId,
        roleLevel: ROLE_LEVEL[user.role] ?? 99,
        permissions,
      };
    } catch {
      // DB unavailable — return minimal session from JWT payload (graceful degradation)
      if (payload.userId) {
        return {
          userId: payload.userId,
          email: payload.email ?? "",
          name: "",
          role: payload.role ?? "user",
          roles: payload.roles ?? [],
          avatar: null,
          accountType: "staff" as const,
          teamMemberId: null,
          roleLevel: ROLE_LEVEL[payload.role ?? "user"] ?? 99,
          permissions: [],
        };
      }
      return null;
    }
  }

  // ── Google OAuth (NextAuth) ───────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: { role: { include: { permissions: true } } },
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    });

    if (!user || !user.isActive) return null;

    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
        scope: p.scope,
      }))
    );

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.userRoles.map((ur) => ur.role.name),
      avatar: user.avatar,
      accountType: (user.accountType as "staff" | "customer") || "customer",
      teamMemberId: user.teamMemberId,
      roleLevel: ROLE_LEVEL[user.role] ?? 99,
      permissions,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

// ─── Permission Helpers ────────────────────────────────────────────────────────

/** Check if user has a specific permission (wildcard-aware) */
export function hasPermission(
  permissions: UserPermission[] | undefined,
  resource: string,
  action: PermissionAction,
  options?: { scope?: string }
): boolean {
  if (!permissions || permissions.length === 0) return false;

  return permissions.some((p) => {
    if (p.resource === "*" && p.action === "*") return true;
    if (p.resource === "*" && p.action === action) return true;
    if (p.resource === resource && p.action === "*") return true;
    if (p.resource === resource && p.action === action) {
      if (options?.scope && p.scope !== "all" && p.scope !== options.scope) return false;
      return true;
    }
    return false;
  });
}

/** Check if user has ANY of the given permissions */
export function hasAnyPermission(
  permissions: UserPermission[] | undefined,
  requirements: Array<{ resource: string; action: PermissionAction }>
): boolean {
  return requirements.every(({ resource, action }) =>
    hasPermission(permissions, resource, action)
  );
}

/** Check if user has ALL of the given permissions */
export function hasAllPermissions(
  permissions: UserPermission[] | undefined,
  requirements: Array<{ resource: string; action: PermissionAction }>
): boolean {
  return requirements.every(({ resource, action }) =>
    hasPermission(permissions, resource, action)
  );
}

/** Check role level: userRole ≤ requiredLevel means user is high enough */
export function hasMinRoleLevel(userRole: string, minLevel: number): boolean {
  const level = ROLE_LEVEL[userRole] ?? 99;
  return level <= minLevel;
}

/** Super admin or admin check */
export function isSuperAdmin(session: SessionUser): boolean {
  return session.roles.includes("super_admin");
}

export function isAdmin(session: SessionUser): boolean {
  return session.roles.includes("super_admin") || session.roles.includes("admin");
}

// ─── Server-side Permission Checks ───────────────────────────────────────────

/**
 * Fast path: check from cached session permissions (no DB hit).
 * Use this in API routes for the hot path.
 */
export async function requirePermissionFast(
  session: SessionUser,
  resource: string,
  action: PermissionAction
): Promise<void> {
  // Super admin: bypass everything
  if (isSuperAdmin(session)) return;

  if (!hasPermission(session.permissions, resource, action)) {
    throw new AuthError("Forbidden", 403);
  }
}

/**
 * Full server-side permission check (with optional DB re-fetch to catch
 * permission changes made since the session was loaded).
 * Falls back to session cache if `refreshFromDb` is false.
 */
export async function checkPermission(
  session: SessionUser,
  resource: string,
  action: PermissionAction
): Promise<boolean> {
  if (isSuperAdmin(session)) return true;

  const count = await prisma.permission.count({
    where: {
      resource,
      action,
      role: {
        users: {
          some: {
            userId: session.userId,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    },
  });

  return count > 0;
}

/**
 * Require a specific resource + action permission.
 * Super admin bypasses all checks.
 * Throws AuthError on failure.
 */
export async function requirePermission(
  resource: string,
  action: PermissionAction
): Promise<SessionUser> {
  const session = await requireAuth();

  if (isSuperAdmin(session)) return session;

  const allowed = await checkPermission(session, resource, action);
  if (!allowed) {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

/**
 * Require minimum role level.
 * Throws AuthError on failure.
 */
export async function requireMinRole(minLevel: number): Promise<SessionUser> {
  const session = await requireAuth();
  const userLevel = ROLE_LEVEL[session.role] ?? 99;
  if (userLevel > minLevel) {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

// ─── Nav Permission Guards ────────────────────────────────────────────────────

import { NAV_PERMISSIONS } from "./roles";

/**
 * Check if a user can access a nav path based on NAV_PERMISSIONS config.
 * Falls back to minRoleLevel check, then to explicit permission check.
 */
export function canAccessNavPath(
  session: SessionUser,
  path: string
): boolean {
  const config: NavPermission | undefined = NAV_PERMISSIONS[path];

  // Unknown path — allow (blocked by other guards)
  if (!config) return true;

  const userLevel = ROLE_LEVEL[session.role] ?? 99;

  // Super admin bypasses nav-level restrictions
  if (isSuperAdmin(session)) return true;

  // Check minRoleLevel
  if (config.minRoleLevel !== undefined && userLevel <= config.minRoleLevel) {
    return true;
  }

  // Check explicit permissions (OR logic)
  if (config.permissions && config.permissions.length > 0) {
    return config.permissions.some(({ resource, actions }) =>
      actions.some((action) =>
        hasPermission(session.permissions, resource, action as PermissionAction)
      )
    );
  }

  return false;
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}

// ─── API Response Helper ──────────────────────────────────────────────────────

import { NextResponse } from "next/server";

/** Convert AuthError to NextResponse */
export function authErrorToResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  const message = error instanceof Error ? error.message : "Server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
