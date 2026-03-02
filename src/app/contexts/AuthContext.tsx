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
    email: "admin@nexaweb.io",
    password: "admin123",
    role: "admin",
    avatar: "AD",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Demo User",
    email: "demo@nexaweb.io",
    password: "demo123",
    role: "user",
    avatar: "DU",
    createdAt: "2024-03-15",
  },
];

const USERS_KEY = "nexaweb_users";
const SESSION_KEY = "nexaweb_session";

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
    initUsers();
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      return { success: false, message: "Invalid email or password." };
    }
    const { password: _pw, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return { success: true, message: "Logged in successfully!" };
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
