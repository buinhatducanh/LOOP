"use client";

import { useAdminAuth } from "@/app/[locale]/admin/components/admin-auth-provider";
import { useRouter } from "next/navigation";
import { ROLE_LEVEL, getRoleDisplayName } from "@/lib/auth/roles";
import { useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PermissionAction = "create" | "read" | "update" | "delete" | "export" | "approve";

interface PermissionGuardProps {
  /**
   * Client-side role level check. User level ≤ minRoleLevel → allowed.
   * 0=super_admin, 1=admin, 2=pm, 3=media, 4=qa, 5=member
   */
  minRoleLevel?: number;
  /**
   * Granular resource + action check (OR logic: any match = allowed).
   * Uses the user's cached permissions from the session.
   */
  permissions?: Array<{ resource: string; actions: PermissionAction[] }>;
  /**
   * Require ALL of the given permissions (AND logic).
   */
  requireAll?: boolean;
  /** Render children normally */
  children: React.ReactNode;
  /** Render fallback when no permission (null = hide) */
  fallback?: React.ReactNode;
  /** Redirect to a "no access" page instead of hiding */
  redirect?: boolean;
  /** Custom denied UI (takes priority over fallback) */
  denied?: React.ReactNode;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parsePermission(raw: string | string[] | undefined): PermissionAction[] {
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw]) as PermissionAction[];
}

/**
 * Check a user's permissions array for a specific resource+action.
 * Supports wildcard ("*" matches everything).
 */
function checkPermission(
  permissions: Array<{ resource: string; action: string; scope?: string | null }> | undefined,
  resource: string,
  action: PermissionAction
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some(
    (p) =>
      (p.resource === "*" && p.action === "*") ||
      (p.resource === "*" && p.action === action) ||
      (p.resource === resource && p.action === "*") ||
      (p.resource === resource && p.action === action)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PermissionGuard({
  minRoleLevel,
  permissions: permDefs,
  requireAll = false,
  children,
  fallback = null,
  denied,
  redirect = false,
}: PermissionGuardProps) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  const allowed = useMemo(() => {
    if (loading || !user) return false;

    // Check role level
    if (minRoleLevel !== undefined) {
      const userLevel = ROLE_LEVEL[user.role] ?? 99;
      if (userLevel > minRoleLevel) return false;
    }

    // Check granular permissions
    if (permDefs && permDefs.length > 0) {
      const perms = (user as any).permissions as Array<{
        resource: string;
        action: string;
        scope?: string | null;
      }> | undefined;

      if (requireAll) {
        // AND: every definition must have at least one matching permission
        return permDefs.every(({ resource, actions }) =>
          actions.some((action) => checkPermission(perms, resource, action))
        );
      } else {
        // OR: any definition having a match is enough
        return permDefs.some(({ resource, actions }) =>
          actions.some((action) => checkPermission(perms, resource, action))
        );
      }
    }

    return true;
  }, [loading, user, minRoleLevel, permDefs, requireAll]);

  if (loading || !user) return <>{fallback}</>;

  if (!allowed) {
    if (denied) return <>{denied}</>;
    if (redirect) return <AccessDenied onBack={() => router.back()} />;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ─── Denied UI ────────────────────────────────────────────────────────────────

interface AccessDeniedProps {
  onBack?: () => void;
  message?: string;
}

export function AccessDenied({
  onBack,
  message = "Bạn không có quyền truy cập trang này. Liên hệ quản trị viên để được cấp quyền.",
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
        <div className="mb-3 text-4xl">🔒</div>
        <h2 className="mb-2 text-lg font-bold text-white">Không có quyền truy cập</h2>
        <p className="mb-4 text-sm text-slate-400">{message}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onBack ?? (() => router.back())}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ← Quay lại
          </button>
          <button
            onClick={() => router.push("/vi/admin")}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role-level shortcuts ─────────────────────────────────────────────────────

/** Requires CEO or super_admin (level ≤ 0) */
export function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={0}>{children}</PermissionGuard>;
}

/** Requires admin or higher (level ≤ 1) */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={1}>{children}</PermissionGuard>;
}

/** Requires project_manager or higher (level ≤ 2) */
export function ManagerPlus({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={2}>{children}</PermissionGuard>;
}

/** Requires media or higher (level ≤ 3) */
export function MediaPlus({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={3}>{children}</PermissionGuard>;
}

/** Requires qa or higher (level ≤ 4) */
export function QAPlus({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={4}>{children}</PermissionGuard>;
}

/** Requires authenticated (level ≤ 5) */
export function StaffOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={5}>{children}</PermissionGuard>;
}

// ─── Granular permission shortcuts ────────────────────────────────────────────

/** Requires read permission on a resource (hides if no read) */
export function CanRead({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["read"] }]} fallback={fallback ?? null}>
      {children}
    </PermissionGuard>
  );
}

/** Requires create permission on a resource */
export function CanCreate({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["create"] }]} fallback={fallback ?? null}>
      {children}
    </PermissionGuard>
  );
}

/** Requires update permission on a resource */
export function CanUpdate({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["update"] }]} fallback={fallback ?? null}>
      {children}
    </PermissionGuard>
  );
}

/** Requires delete permission on a resource */
export function CanDelete({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["delete"] }]} fallback={fallback ?? null}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Combines minRoleLevel + permission checks with AND logic.
 * Useful for sensitive actions that need both role + specific permission.
 */
export function RequireBoth({
  minRoleLevel,
  permissions,
  children,
  fallback,
  denied,
}: {
  minRoleLevel: number;
  permissions: Array<{ resource: string; actions: PermissionAction[] }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  denied?: React.ReactNode;
}) {
  return (
    <PermissionGuard
      minRoleLevel={minRoleLevel}
      permissions={permissions}
      requireAll={true}
      fallback={fallback}
      denied={denied}
    >
      {children}
    </PermissionGuard>
  );
}
