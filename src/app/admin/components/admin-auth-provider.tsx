"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { ROLE_LEVEL } from "@/lib/auth/roles";

// ─── Types (aligned with the [locale] version) ─────────────────────────────────

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
  permissions: UserPermission[];
}

interface AdminAuthContextType {
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
  const router = useRouter();

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

  // Hydrate on mount
  useEffect(() => {
    setHydrated(true);
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic session refresh
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(fetchMe, 60_000);
    return () => clearInterval(interval);
  }, [hydrated, fetchMe]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
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
  };

  const logout = async () => {
    await Promise.allSettled([
      nextAuthSignOut({ redirect: false }),
      fetch("/api/admin/auth/logout", { method: "POST" }),
    ]);
    setUser(null);
    router.push("/vi/login");
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

// ─── Client-side permission helpers ─────────────────────────────────────────────

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

export function hasAnyPermission(
  permissions: UserPermission[],
  requirements: Array<{ resource: string; action: string }>
): boolean {
  return requirements.some(({ resource, action }) =>
    hasPermission(permissions, resource, action)
  );
}

export function hasAllPermissions(
  permissions: UserPermission[],
  requirements: Array<{ resource: string; action: string }>
): boolean {
  return requirements.every(({ resource, action }) =>
    hasPermission(permissions, resource, action)
  );
}
