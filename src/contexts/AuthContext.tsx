"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "@/i18n/routing";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  signIn: (provider?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Sync NextAuth session with our User state
  useEffect(() => {
    if (session?.user) {
      const sessionUser: User = {
        id: session.user.id || "",
        name: session.user.name || "",
        email: session.user.email || "",
        role: (session.user.role as "admin" | "user") || "user",
        avatar: session.user.image || session.user.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "AD",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUser(sessionUser);
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [session, status]);

  // Check custom auth for admin routes (fallback for email/password login)
  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");
    if (!isAdminRoute) return;

    // Only check custom auth if not using NextAuth session
    if (status === "loading") return;

    fetch("/api/admin/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user && !session) {
          const sessionUser: User = {
            id: data.user.id,
            name: data.user.name || "",
            email: data.user.email,
            role: data.user.role === "admin" ? "admin" : "user",
            avatar: data.user.avatar || "AD",
            createdAt: new Date().toISOString().split("T")[0],
          };
          setUser(sessionUser);
        }
      })
      .catch(() => {
        // Network error - user stays null (not authenticated)
      });
  }, [pathname, session, status]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || "Email hoặc mật khẩu không đúng." };
      }
      const loggedInUser: User = {
        id: data.user.id,
        name: data.user.name || "",
        email: data.user.email,
        role: data.user.role === "admin" ? "admin" : "user",
        avatar: data.user.avatar || data.user.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "AD",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUser(loggedInUser);
      return { success: true, message: "Đăng nhập thành công!" };
    } catch {
      return { success: false, message: "Lỗi kết nối. Vui lòng thử lại." };
    }
  };

  const logout = () => {
    setUser(null);
    // Sign out from NextAuth
    nextAuthSignOut({ callbackUrl: "/" });
    // Also clear custom auth
    fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
  };

  const signIn = (provider: string = "google") => {
    nextAuthSignIn(provider, { callbackUrl: "/admin" });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout,
        signIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
