"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  getAllUsers: () => StoredUser[];
  deleteUser: (id: string) => void;
  updateUserRole: (id: string, role: "admin" | "user") => void;
}

export interface StoredUser extends User {
  password: string;
}

const DEFAULT_USERS: StoredUser[] = [
  {
    id: "1",
    name: "Admin",
    email: "admin@loop.io",
    password: "admin123",
    role: "admin",
    avatar: "AD",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Demo User",
    email: "demo@loop.io",
    password: "demo123",
    role: "user",
    avatar: "DU",
    createdAt: "2024-03-15",
  },
];

const USERS_KEY = "loop_users";
const SESSION_KEY = "loop_session";

function initUsers(): StoredUser[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(stored);
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session from cookie first
    fetch("/api/admin/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          const sessionUser: User = {
            id: data.user.id,
            name: data.user.name || "",
            email: data.user.email,
            role: data.user.role === "admin" ? "admin" : "user",
            avatar: data.user.avatar || "AD",
            createdAt: new Date().toISOString().split("T")[0],
          };
          setUser(sessionUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        } else {
          // Fallback to localStorage session
          const session = localStorage.getItem(SESSION_KEY);
          if (session) {
            try {
              setUser(JSON.parse(session) as User);
            } catch {
              localStorage.removeItem(SESSION_KEY);
            }
          }
        }
      })
      .catch(() => {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
          try {
            setUser(JSON.parse(session) as User);
          } catch {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      });
  }, []);

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
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
      return { success: true, message: "Đăng nhập thành công!" };
    } catch {
      return { success: false, message: "Lỗi kết nối. Vui lòng thử lại." };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "Email already registered." };
    }
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const newUser: StoredUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: "user",
      avatar: initials,
      createdAt: new Date().toISOString().split("T")[0],
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { password: _pw, ...safeUser } = newUser;
    setUser(safeUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return { success: true, message: "Account created successfully!" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
  };

  const getAllUsers = (): StoredUser[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  };

  const deleteUser = (id: string) => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const updated = users.filter((u) => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  const updateUserRole = (id: string, role: "admin" | "user") => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const updated = users.map((u) => (u.id === id ? { ...u, role } : u));
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        getAllUsers,
        deleteUser,
        updateUserRole,
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
