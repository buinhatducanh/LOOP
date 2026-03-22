"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ROLE_LEVEL } from "@/lib/auth/roles";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserPermission {
  resource: string;
  action: string;
  scope: string;
}

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  avatar: string | null;
  roleLevel: number;
  /** Cached granular permissions from the session */
  permissions: UserPermission[];
}

export interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────────

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const router = useNextRouter();

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const level = ROLE_LEVEL[data.user.role] ?? 99;
          setUser({
            ...data.user,
            roleLevel: level,
            permissions: data.user.permissions ?? [],
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate from server session on mount
  useEffect(() => {
    setHydrated(true);
    // Skip fetch if user is already set (e.g., after login — we already have the user from login response)
    // This avoids the ~2.5s redundant /api/admin/auth/me call after login
    if (!user) {
      fetchMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic session refresh every 60 seconds
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(fetchMe, 60_000);
    return () => clearInterval(interval);
  }, [hydrated, fetchMe]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Đăng nhập thất bại" };
    const level = ROLE_LEVEL[data.user?.role] ?? 99;
    setUser({ ...data.user, roleLevel: level, permissions: data.user.permissions ?? [] });
    return {};
  }, []);

  const logout = useCallback(async () => {
    await Promise.allSettled([
      fetch("/api/admin/auth/logout", { method: "POST" }),
    ]);
    setUser(null);
    // Detect locale from current URL for locale-aware redirect
    const locale = window.location.pathname.match(/^\/(vi|en)/)?.[1] ?? routing.defaultLocale;
    // Use client-side router instead of window.location.href
    router.push(`/${locale}/login`);
  }, [router]);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be inside AdminAuthProvider");
  return ctx;
}

// ─── Permission helpers (client-side) ──────────────────────────────────────────

/**
 * Check if the current user has a specific permission (wildcard-aware).
 * Use this inside client components where you can't call server functions.
 */
export function hasPermission(
  permissions: UserPermission[],
  resource: string,
  action: string
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

/**
 * Check if the current user has any of the given permissions (OR logic).
 */
export function hasAnyPermission(
  permissions: UserPermission[],
  requirements: Array<{ resource: string; action: string }>
): boolean {
  return requirements.some(({ resource, action }) =>
    hasPermission(permissions, resource, action)
  );
}

/**
 * Check if the current user has ALL of the given permissions (AND logic).
 */
export function hasAllPermissions(
  permissions: UserPermission[],
  requirements: Array<{ resource: string; action: string }>
): boolean {
  return requirements.every(({ resource, action }) =>
    hasPermission(permissions, resource, action)
  );
}
