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
import { verifyAccessToken } from "./token";
import { verifyToken } from "./jwt"; // backward compat wrapper — tokens signed with old jwt.ts still work
import { cookies, headers } from "next/headers";
import { ROLE_LEVEL, type NavPermission, DEPT_TAB_BONUS, DEFAULT_PERMISSIONS } from "./roles";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

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
  /** Session ID — links to RefreshToken DB row for revocation */
  sessionId?: string | null;
  /** Cached permission list for the active role */
  permissions?: UserPermission[];
  /** Team member rank (from TeamMember.rank) */
  rank?: string;
  /** Available LP balance */
  availableLp?: number;
  /** Locked LP */
  lockedLp?: number;
  /** Access tags (e.g. kanban, blog-post) from TeamMember */
  accessTags?: string[];
  /** Admin tab permissions (CEO-assigned per member) */
  tabPermissions?: string[];
  /** Department-level tab bonus permissions */
  departmentPermissions?: Record<string, string[]>;
  /** Department.id the member belongs to */
  departmentId?: string | null;
  /** Department.key (e.g. "engineering") the member belongs to */
  departmentKey?: string | null;
  /** Whether member is department head */
  isDeptHead?: boolean;
  /** Whether customer has completed onboarding profile */
  isOnboarded?: boolean;
}

/** RANK → display color map */
export const RANK_COLORS: Record<string, string> = {
  iron: "#9CA3AF",
  bronze: "#CD7F32",
  silver: "#CBD5E1",
  gold: "#FFD700",
  platinum: "#14B8A6",
  ruby: "#EF4444",
  diamond: "#818CF8",
};

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Get session from Authorization: Bearer <token> header.
 * Used by FE API client (FE stores JWT in localStorage, sends as Bearer).
 * Falls back to cookie-based session if no Bearer token is present.
 *
 * Backward compatibility:
 *   - New tokens (signed with token.ts / jose): verified with verifyAccessToken()
 *   - Old tokens (signed with jwt.ts / jsonwebtoken): verified with verifyToken()
 */
export async function getSessionFromBearer(
  bearerToken: string | null
): Promise<SessionUser | null> {
  if (!bearerToken) return null;

  // ── Try new token format first (jose / token.ts) ──────────────────────────
  let payload: Record<string, unknown> | null = null;
  let isNewToken = false;

  try {
    const newPayload = await verifyAccessToken(bearerToken);
    if (newPayload?.sub) {
      payload = newPayload as unknown as Record<string, unknown>;
      isNewToken = true;
    }
  } catch {
    // Not a new token — fall through to old jwt.ts verification
  }

  // ── Fall back to old token format (jsonwebtoken / jwt.ts) ──────────────────
  if (!isNewToken) {
    const oldPayload = verifyToken(bearerToken);
    if (!oldPayload || !oldPayload.userId) return null;
    payload = oldPayload as unknown as Record<string, unknown>;
  }

  const userId = (payload?.sub as string | undefined) ?? (payload?.userId as string | undefined);
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        userRoles: {
          include: { role: { include: { permissions: true } } },
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
        teamMember: {
          select: {
            rank: true, availableLp: true, lockedLp: true, accessTags: true,
            departmentId: true,
            memberDepartments: { select: { isDeptHead: true } },
            tabPermissions: true,
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

    const effectiveRoleLevel = user.userRoles.length > 0
      ? Math.min(...user.userRoles.map((ur) => ur.role.level ?? 99))
      : ROLE_LEVEL[user.role] ?? 99;
    const accountType: "staff" | "customer" = effectiveRoleLevel <= 5 ? "staff" : "customer";

    const teamMember = user.teamMember;
    const departmentId = teamMember?.departmentId ?? null;
    const departmentKey = departmentId
      ? (await prisma.department.findUnique({ where: { id: departmentId }, select: { key: true } }))?.key ?? null
      : null;

    // Build dept bonus tabs (auto-granted based on member's department)
    const departmentPermissions: Record<string, string[]> = {};
    if (departmentKey && DEPT_TAB_BONUS[departmentKey]) {
      departmentPermissions[departmentKey] = DEPT_TAB_BONUS[departmentKey];
    }

    return {
      userId,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.userRoles.map((ur) => ur.role.name),
      avatar: user.avatar,
      accountType,
      teamMemberId: user.teamMemberId,
      roleLevel: effectiveRoleLevel,
      permissions,
      rank: teamMember?.rank,
      availableLp: teamMember?.availableLp,
      lockedLp: teamMember?.lockedLp,
      accessTags: teamMember?.accessTags ?? [],
      isOnboarded: user.isOnboarded,
      departmentId,
      departmentKey,
      isDeptHead: (teamMember?.memberDepartments ?? []).some((md: any) => md.isDeptHead) ?? false,
      departmentPermissions,
      tabPermissions: teamMember?.tabPermissions ?? [],
    };
  } catch {
    // DB unavailable — derive from JWT payload
    const fallbackRoleLevel =
      (payload?.rl as number | undefined) ??
      (payload?.roleLevel as number | undefined) ??
      ROLE_LEVEL[(payload?.rol as string | undefined) ?? (payload?.role as string | undefined) ?? ""] ??
      99;
    return {
      userId,
      email: (payload?.eml as string | undefined) ?? (payload?.email as string | undefined) ?? "",
      name: (payload?.nam as string | undefined) ?? "",
      role: (payload?.rol as string | undefined) ?? (payload?.role as string | undefined) ?? "user",
      roles: (payload?.rls as string[] | undefined) ?? (payload?.roles as string[] | undefined) ?? [],
      avatar: null,
      accountType: fallbackRoleLevel <= 5 ? "staff" : "customer",
      teamMemberId: (payload?.sid as string | undefined) ?? null,
      roleLevel: fallbackRoleLevel,
      permissions: [],
      accessTags: (payload?.ats as string[] | undefined) ?? [],
      isOnboarded: payload?.onb as boolean | undefined,
      departmentId: (payload?.did as string | undefined) ?? null,
      departmentKey: (payload?.dk as string | undefined) ?? null,
      departmentPermissions: {},
      tabPermissions: (payload?.tbp as string[] | undefined) ?? [],
    };
  }
}

/**
 * Get session from cookies (server-side, e.g., SSR, API routes with HttpOnly cookies).
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const authMethod = cookieStore.get("auth-method")?.value;

  // ── Credentials login: use custom JWT only (skip NextAuth entirely) ──
  if (authMethod === "credentials" || authMethod === "google") {
    // Match AdminLayout behavior: try loop-staff-token first (set by login),
    // then auth-token (legacy). This prevents 401 on /me when auth-token is
    // missing but loop-staff-token exists (e.g. cookie domain/path mismatch).
    const token =
      cookieStore.get("loop-staff-token")?.value ??
      cookieStore.get("auth-token")?.value ??
      null;
    if (!token) return null;

    // ── Try new token format (jose / token.ts) ──────────────────────────────────
    let payload: Record<string, unknown> | null = null;
    let isNewToken = false;

    try {
      const newPayload = await verifyAccessToken(token);
      if (newPayload?.sub) {
        payload = newPayload as unknown as Record<string, unknown>;
        isNewToken = true;
      }
    } catch {
      // fall through to old jwt.ts
    }

    // ── Fall back to old token format (jsonwebtoken) ────────────────────────────
    if (!isNewToken) {
      const oldPayload = verifyToken(token);
      if (!oldPayload) return null;
      payload = oldPayload as unknown as Record<string, unknown>;
    }

    const userId =
      (payload?.sub as string | undefined) ??
      (payload?.userId as string | undefined);
    if (!userId) return null;

    const sessionId = isNewToken
      ? (payload?.sid as string | undefined) ?? null
      : null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId, isActive: true },
        include: {
          userRoles: {
            include: { role: { include: { permissions: true } } },
            where: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
          teamMember: {
            select: {
              rank: true, availableLp: true, lockedLp: true, accessTags: true,
              departmentId: true,
              memberDepartments: { select: { isDeptHead: true } },
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

      const effectiveRoleLevel = user.userRoles.length > 0
        ? Math.min(...user.userRoles.map((ur) => ur.role.level ?? 99))
        : ROLE_LEVEL[user.role] ?? 99;
      const accountType: "staff" | "customer" = effectiveRoleLevel <= 5 ? "staff" : "customer";

      const teamMember = user.teamMember;
      const departmentId = teamMember?.departmentId ?? null;
      const departmentKey = departmentId
        ? (await prisma.department.findUnique({ where: { id: departmentId }, select: { key: true } }))?.key ?? null
        : null;

      const departmentPermissions: Record<string, string[]> = {};
      if (departmentKey && DEPT_TAB_BONUS[departmentKey]) {
        departmentPermissions[departmentKey] = DEPT_TAB_BONUS[departmentKey];
      }

      return {
        userId,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.userRoles.map((ur) => ur.role.name),
        avatar: user.avatar,
        accountType,
        teamMemberId: user.teamMemberId,
        roleLevel: effectiveRoleLevel,
        sessionId,
        permissions,
        rank: teamMember?.rank,
        availableLp: teamMember?.availableLp,
        lockedLp: teamMember?.lockedLp,
        accessTags: teamMember?.accessTags ?? [],
        isOnboarded: user.isOnboarded,
        departmentId,
        departmentKey,
        isDeptHead: (teamMember?.memberDepartments ?? []).some((md: any) => md.isDeptHead) ?? false,
        departmentPermissions,
        tabPermissions: user.teamMemberId
          ? (await prisma.teamMember.findUnique({
              where: { id: user.teamMemberId },
              select: { tabPermissions: true },
            }))?.tabPermissions ?? []
          : [],
      };
    } catch {
      // DB unavailable — derive from JWT payload
      const fallbackRoleLevel =
        (payload?.rl as number | undefined) ??
        (payload?.roleLevel as number | undefined) ??
        ROLE_LEVEL[(payload?.rol as string | undefined) ?? (payload?.role as string | undefined) ?? ""] ??
        99;
      return {
        userId,
        email: (payload?.eml as string | undefined) ?? (payload?.email as string | undefined) ?? "",
        name: (payload?.nam as string | undefined) ?? "",
        role: (payload?.rol as string | undefined) ?? (payload?.role as string | undefined) ?? "user",
        roles: (payload?.rls as string[] | undefined) ?? (payload?.roles as string[] | undefined) ?? [],
        avatar: null,
        accountType: fallbackRoleLevel <= 5 ? "staff" : "customer",
        teamMemberId: null,
        roleLevel: fallbackRoleLevel,
        sessionId,
        permissions: [],
        accessTags: (payload?.ats as string[] | undefined) ?? [],
        isOnboarded: payload?.onb as boolean | undefined,
      };
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
        teamMember: {
          select: {
            rank: true, availableLp: true, lockedLp: true, accessTags: true,
            departmentId: true,
            memberDepartments: { select: { isDeptHead: true } },
            tabPermissions: true,
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

    // Derive accountType from roleLevel: ≤ 5 = staff (LOOP employee), otherwise = customer
    const effectiveRoleLevel = user.userRoles.length > 0
      ? Math.min(...user.userRoles.map((ur) => ur.role.level ?? 99))
      : ROLE_LEVEL[user.role] ?? 99;
    const accountType: "staff" | "customer" = effectiveRoleLevel <= 5 ? "staff" : "customer";

    const teamMember = user.teamMember;
    const departmentId = teamMember?.departmentId ?? null;
    const departmentKey = departmentId
      ? (await prisma.department.findUnique({ where: { id: departmentId }, select: { key: true } }))?.key ?? null
      : null;

    const departmentPermissions: Record<string, string[]> = {};
    if (departmentKey && DEPT_TAB_BONUS[departmentKey]) {
      departmentPermissions[departmentKey] = DEPT_TAB_BONUS[departmentKey];
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.userRoles.map((ur) => ur.role.name),
      avatar: user.avatar,
      accountType,
      teamMemberId: user.teamMemberId,
      roleLevel: effectiveRoleLevel,
      permissions,
      rank: teamMember?.rank,
      availableLp: teamMember?.availableLp,
      lockedLp: teamMember?.lockedLp,
      accessTags: teamMember?.accessTags ?? [],
      isOnboarded: user.isOnboarded,
      departmentId,
      departmentKey,
      isDeptHead: (teamMember?.memberDepartments ?? []).some((md: any) => md.isDeptHead) ?? false,
      departmentPermissions,
      tabPermissions: teamMember?.tabPermissions ?? [],
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req?: NextRequest): Promise<SessionUser> {
  // Priority 1: Authorization header (FE API client sends Bearer token)
  let bearer: string | null = null;

  if (req) {
    bearer = req.headers.get("Authorization");
  } else {
    // Fallback: read headers from Next.js request context for routes that call requireAuth() without req
    const h = await headers();
    bearer = h.get("authorization") ?? h.get("Authorization");
  }

  // Priority 1: Authorization header (FE API client sends Bearer token)
  // Only use if token is present AND valid — fall through to cookie if token is
  // absent or expired/invalid so cookie-based sessions (Google OAuth) still work.
  if (bearer?.startsWith("Bearer ")) {
    const session = await getSessionFromBearer(bearer.slice(7));
    if (session) return session;
    // Token present but invalid/expired → fall through to cookie below
  }

  // Priority 2: cookie-based session (covers:
  //   a) no Bearer header at all
  //   b) Bearer was present but expired/invalid → now try cookie
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
  // "any" = at least ONE requirement is satisfied (OR semantics)
  return requirements.some(({ resource, action }) =>
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
  // Super admin + admin: bypass permission matrix for operational routes
  if (isSuperAdmin(session) || isAdmin(session)) return;

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
  if (isSuperAdmin(session) || isAdmin(session)) return true;

  // 1. Check DB Permission table first (source of truth)
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

  if (count > 0) return true;

  // 2. Fallback: check static DEFAULT_PERMISSIONS for all user roles
  //    This covers roles (e.g. "hr") that exist in ROLE_LEVEL but may not have
  //    Permission rows seeded in the DB yet.
  for (const roleName of session.roles) {
    const defaults = DEFAULT_PERMISSIONS[roleName];
    if (!defaults) continue;
    const match = defaults.some(
      (p) => (p.resource === "*" || p.resource === resource) && (p.actions.includes("*") || p.actions.includes(action))
    );
    if (match) return true;
  }

  // 3. Also check session.role (User.role scalar) as fallback
  const scalarDefaults = DEFAULT_PERMISSIONS[session.role];
  if (scalarDefaults) {
    const match = scalarDefaults.some(
      (p) => (p.resource === "*" || p.resource === resource) && (p.actions.includes("*") || p.actions.includes(action))
    );
    if (match) return true;
  }

  return false;
}

/**
 * Require a specific resource + action permission.
 * Super admin bypasses all checks.
 * Throws AuthError on failure.
 *
 * @param resource - e.g. "orders", "team", "services"
 * @param action - e.g. "read", "create", "update", "delete"
 * @param req - optional NextRequest; if provided, reads Authorization: Bearer header first
 */
export async function requirePermission(
  resource: string,
  action: PermissionAction,
  req?: NextRequest
): Promise<SessionUser> {
  const session = await requireAuth(req);

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
export async function requireMinRole(minLevel: number, req?: NextRequest): Promise<SessionUser> {
  const session = await requireAuth(req);
  const userLevel = ROLE_LEVEL[session.role] ?? 99;
  if (userLevel > minLevel) {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

// ─── API Route Helpers (reads from NextRequest) ────────────────────────────────

/**
 * Require permission from an incoming NextRequest.
 * Shorthand for `requirePermission(resource, action, req)`.
 * Use this in API routes that receive FE API calls with Bearer token in header.
 */
export async function requirePermissionFromRequest(
  req: NextRequest,
  resource: string,
  action: PermissionAction
): Promise<SessionUser> {
  return requirePermission(resource, action, req);
}

/**
 * Get session from a NextRequest (reads Bearer header first, then cookies).
 * Does NOT throw — returns null if not authenticated.
 */
export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionUser | null> {
  const bearer = req.headers.get("Authorization");
  if (bearer?.startsWith("Bearer ")) {
    return getSessionFromBearer(bearer.slice(7));
  }
  return getSession();
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
