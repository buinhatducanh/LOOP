/**
 * Auth Store — Zustand + Real API
 *
 * Migrated from Figma OLD FE authStore.ts.
 * Replaces mock DEMO_USERS with real `/api/admin/auth/login` API call.
 *
 * Session enrichment: role, department, lpBalance, rank, rankColor, level
 * come from the `/api/admin/auth/me` response enriched with LP/TeamMember data.
 *
 * RBAC mapping:
 *  Figma role  → Next.js role system
 *  admin       → roleLevel ≤ 1 (super_admin, admin)
 *  manager     → roleLevel = 2 (pm) with department
 *  staff       → roleLevel 3-4 (media, qa)
 *  client      → roleLevel = 5 (member), accountType = customer
 */

import { create } from "zustand";
import { apiClient, type ApiErrorResponse } from "@/lib/api/client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "staff" | "client" | "guest";

export interface AuthUser {
  id: string;
  name: string;
  shortName: string;
  email: string;
  avatar: string;
  role: UserRole;
  department?: string;
  rank?: string;
  rankColor?: string;
  lpBalance: number;
  level: number;
}

/** Enriched session from /api/admin/auth/me + LP data */
export interface EnrichedSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  avatar: string | null;
  accountType: "staff" | "customer";
  teamMemberId: string | null;
  roleLevel: number;
  // Enriched fields
  department?: string;
  rank?: string;
  rankColor?: string;
  lpBalance?: number;
  level?: number;
}

export type AdminTab =
  | "overview" | "orders" | "members" | "departments" | "projects"
  | "services" | "media" | "quotation" | "portfolio" | "projects_completed"
  | "academy" | "blog" | "revenue" | "clients" | "lp" | "lp_manage"
  | "income_tax" | "web_packages" | "effects" | "notification_center"
  | "settings" | "quests_events" | "leaderboard_admin" | "analytics";

// ── RBAC tab mapping ──────────────────────────────────────────────────────────

const DEPT_TABS: Record<string, AdminTab[]> = {
  engineering: ["overview", "orders", "projects", "members", "notification_center"],
  design: ["overview", "orders", "projects", "portfolio", "members", "notification_center"],
  media: ["overview", "media", "orders", "projects", "members", "notification_center"],
  marketing: ["overview", "blog", "academy", "clients", "services", "notification_center"],
  sales: ["overview", "orders", "clients", "quotation", "services", "revenue", "notification_center"],
  finance: ["overview", "revenue", "lp", "lp_manage", "income_tax", "web_packages", "orders", "notification_center"],
  hr: ["overview", "members", "departments", "notification_center"],
  management: [
    "overview", "orders", "members", "departments", "projects", "revenue", "clients",
    "notification_center", "quests_events",
  ],
};

const STAFF_TABS: AdminTab[] = ["overview", "projects", "notification_center"];

export function getAccessibleTabs(
  role: UserRole,
  department?: string
): AdminTab[] | "all" {
  if (role === "admin") return "all";
  if (role === "manager" && department) return DEPT_TABS[department] ?? STAFF_TABS;
  if (role === "staff") return STAFF_TABS;
  return [];
}

export function canAccessTab(
  role: UserRole,
  department: string | undefined,
  tab: AdminTab
): boolean {
  const tabs = getAccessibleTabs(role, department);
  if (tabs === "all") return true;
  return tabs.includes(tab);
}

export function canEdit(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

/** Map Next.js roleLevel → Figma UserRole */
export function mapRoleLevelToUserRole(
  roleLevel: number,
  accountType: "staff" | "customer"
): UserRole {
  if (accountType === "customer") return "client";
  if (roleLevel <= 1) return "admin";
  if (roleLevel === 2) return "manager";
  if (roleLevel <= 4) return "staff";
  return "guest";
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface AuthStore {
  // Session state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchSession: () => Promise<void>;
  setLoading: (v: boolean) => void;
  clearError: () => void;

  // RBAC helpers (derived from state)
  role: UserRole;
  department?: string;
  accessibleTabs: AdminTab[] | "all";
}

// ── Private helpers ───────────────────────────────────────────────────────────

function extractShortName(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function sessionToAuthUser(session: EnrichedSession): AuthUser {
  const role = mapRoleLevelToUserRole(session.roleLevel, session.accountType);
  return {
    id: session.userId,
    name: session.name || session.email,
    shortName: extractShortName(session.name || session.email),
    email: session.email,
    avatar:
      session.avatar ??
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.name || session.email)}`,
    role,
    department: session.department,
    rank: session.rank,
    rankColor: session.rankColor,
    lpBalance: session.lpBalance ?? 0,
    level: session.level ?? 1,
  };
}

// ── Store creation ────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: "guest",
  department: undefined,
  accessibleTabs: [],

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // Step 1: Call login API
      const res = await apiClient.post<{ data: { token: string } } | ApiErrorResponse>(
        "/api/admin/auth/login",
        { email, password },
        { throwOnError: false }
      );

      if ("error" in res) {
        set({ isLoading: false, error: res.error });
        return false;
      }

      // Step 2: Fetch enriched session (includes LP, rank, team member data)
      await get().fetchSession();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      await apiClient.post("/api/admin/auth/logout", undefined, { throwOnError: false });
    } catch {
      // Ignore logout errors — clear local state regardless
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        role: "guest",
        department: undefined,
        accessibleTabs: [],
      });
    }
  },

  fetchSession: async (): Promise<void> => {
    try {
      const res = await apiClient.get<{ data: EnrichedSession } | ApiErrorResponse>(
        "/api/admin/auth/me",
        { throwOnError: false }
      );

      if ("error" in res) {
        set({ isAuthenticated: false, user: null, role: "guest", accessibleTabs: [] });
        return;
      }

      const session = res.data;
      const authUser = sessionToAuthUser(session);
      const role = mapRoleLevelToUserRole(session.roleLevel, session.accountType);

      set({
        user: authUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        role,
        department: session.department,
        accessibleTabs: getAccessibleTabs(role, session.department),
      });
    } catch {
      // Network / parse error
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  setLoading: (v) => set({ isLoading: v }),

  clearError: () => set({ error: null }),
}));

// ── Selector hooks ─────────────────────────────────────────────────────────────

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useRole = () => useAuthStore((s) => s.role);
export const useAccessibleTabs = () => useAuthStore((s) => s.accessibleTabs);
