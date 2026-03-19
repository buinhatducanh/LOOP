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
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  avatar: string | null;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with NextAuth session
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // User is signed in via NextAuth (Google)
      const adminUser: AdminUser = {
        userId: session.user.id || "",
        email: session.user.email || "",
        name: session.user.name || "",
        role: session.user.role === "admin" ? "admin" : "user",
        roles: session.user.role === "admin" ? ["admin"] : ["user"],
        avatar: session.user.image || null,
      };
      setUser(adminUser);
      setLoading(false);
    } else if (status === "unauthenticated") {
      // Try custom auth fallback
      fetchUser();
    }
  }, [session, status, fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.error };

    setUser(data.user);
    return {};
  };

  const logout = async () => {
    // Sign out from both NextAuth and custom auth
    await Promise.allSettled([
      nextAuthSignOut({ redirect: false }),
      fetch("/api/admin/auth/logout", { method: "POST" }),
    ]);
    setUser(null);
    router.push("/login");
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
