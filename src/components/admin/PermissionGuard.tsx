"use client";

import { useAdminAuth } from "@/app/admin/components/admin-auth-provider";
import { useRouter } from "next/navigation";
import { ROLE_LEVEL } from "@/lib/auth/roles";
import { useMemo } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

type PermissionAction = "create" | "read" | "update" | "delete" | "export" | "approve";

interface PermissionGuardProps {
  minRoleLevel?: number;
  permissions?: Array<{ resource: string; actions: PermissionAction[] }>;
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  denied?: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function checkPermission(
  perms: Array<{ resource: string; action: string }> | undefined,
  resource: string,
  action: PermissionAction
): boolean {
  if (!perms || perms.length === 0) return false;
  return perms.some(
    (p) =>
      (p.resource === "*" && p.action === "*") ||
      (p.resource === "*" && p.action === action) ||
      (p.resource === resource && p.action === "*") ||
      (p.resource === resource && p.action === action)
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function PermissionGuard({
  minRoleLevel,
  permissions: permDefs,
  requireAll = false,
  children,
  fallback = null,
  denied,
}: PermissionGuardProps) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  const allowed = useMemo(() => {
    if (loading || !user) return false;
    if (minRoleLevel !== undefined) {
      const userLevel = ROLE_LEVEL[user.role] ?? 99;
      if (userLevel > minRoleLevel) return false;
    }
    if (permDefs && permDefs.length > 0) {
      const perms = (user as unknown as { permissions?: Array<{ resource: string; action: string }> }).permissions;
      if (requireAll) {
        return permDefs.every(({ resource, actions }) =>
          actions.some((action) => checkPermission(perms, resource, action))
        );
      }
      return permDefs.some(({ resource, actions }) =>
        actions.some((action) => checkPermission(perms, resource, action))
      );
    }
    return true;
  }, [loading, user, minRoleLevel, permDefs, requireAll]);

  if (loading || !user) return <>{fallback}</>;

  if (!allowed) {
    if (denied) return <>{denied}</>;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <div className="mb-3 text-4xl">🔒</div>
          <h2 className="mb-2 text-lg font-bold text-white">Không có quyền truy cập</h2>
          <p className="mb-4 text-sm text-slate-400">
            Bạn không có quyền truy cập trang này. Liên hệ quản trị viên để được cấp quyền.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              ← Quay lại
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Về Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Shortcuts ──────────────────────────────────────────────────────────

export function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={0}>{children}</PermissionGuard>;
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={1}>{children}</PermissionGuard>;
}

export function ManagerPlus({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={2}>{children}</PermissionGuard>;
}

export function MediaPlus({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={3}>{children}</PermissionGuard>;
}

export function QAPlus({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={4}>{children}</PermissionGuard>;
}

export function StaffOnly({ children }: { children: React.ReactNode }) {
  return <PermissionGuard minRoleLevel={5}>{children}</PermissionGuard>;
}

export function CanRead({
  resource,
  children,
  fallback = null,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["read"] } fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanCreate({
  resource,
  children,
  fallback = null,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["create"] } fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanUpdate({
  resource,
  children,
  fallback = null,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["update"] } fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanDelete({
  resource,
  children,
  fallback = null,
}: {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permissions={[{ resource, actions: ["delete"] } fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function RequireBoth({
  minRoleLevel,
  permissions: perms,
  children,
  fallback = null,
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
      permissions={perms}
      requireAll
      fallback={fallback}
      denied={denied}
    >
      {children}
    </PermissionGuard>
  );
}
