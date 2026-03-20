"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { signIn as nextSignIn } from "next-auth/react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin" | "user";
  avatar: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: "admin" | "user"; message: string }>;
  logout: () => void;
  signIn: (provider?: string) => void;
  refreshUser: () => Promise<void>;
}

// Normalise any privileged role to "admin" for display / routing
function normaliseRole(role: string): "admin" | "user" {
  return role === "admin" || role === "super_admin" || role === "ceo" ? "admin" : "user";
}

function normaliseUserRole(role: string): User["role"] {
  if (role === "admin" || role === "super_admin" || role === "ceo") return "admin";
  return "user";
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Guard to skip fetchMe after logout and during SSR
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchMe = useCallback(async () => {
    if (isLoggingOut) return;
    try {
      const res = await fetch("/api/admin/auth/me");
      if (res.status === 401) { setUser(null); return; }
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser({
            id: data.user.id || "",
            name: data.user.name || "",
            email: data.user.email || "",
            role: normaliseUserRole(data.user.role),
            avatar: data.user.avatar ||
              (data.user.name || "").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "AD",
            createdAt: new Date().toISOString().split("T")[0],
          });
        }
      }
    } catch {
      // Network/server errors — leave user state unchanged
    }
  }, [isLoggingOut]);

  // Hydrate user from cookie on mount (persists login across page reloads)
  useEffect(() => {
    fetchMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.error || "Lỗi server." };
      if (data.user) {
        const role = normaliseRole(data.user.role);
        const u: User = {
          id: data.user.id || "",
          name: data.user.name || "",
          email: data.user.email || "",
          role: normaliseUserRole(data.user.role),
          avatar: data.user.avatar || "AD",
          createdAt: new Date().toISOString().split("T")[0],
        };
        setUser(u);
        return { success: true, role, message: "Đăng nhập thành công!" };
      }
      return { success: true, message: "Đăng nhập thành công!" };
    } catch {
      return { success: false, message: "Lỗi kết nối." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggingOut(true);
    fetch("/api/admin/auth/logout", { method: "POST" }).finally(() => {
      window.location.href = "/";
    });
  }, []);

  const signIn = useCallback((provider = "google") => {
    nextSignIn(provider, { callbackUrl: "/vi/admin" });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin: !!user && user.role === "admin", login, logout, signIn, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
