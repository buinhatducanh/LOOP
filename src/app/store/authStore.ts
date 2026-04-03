/**
 * Auth Store — Role-based access control for LOOP Solutions
 *
 * Merged from:
 * - BE: API-based login/logout/session (real JWT integration)
 * - FE: Quest/Event/LP gamification system
 *
 * Roles: admin | manager | staff | client | guest
 */
import { create } from "zustand";
import { apiClient, type ApiErrorResponse } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";

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

// ── Quest / Event Types (from FE gamification system) ────────────────────────────

export type QuestFrequency = "daily" | "weekly" | "monthly" | "one_time" | "event";
export type QuestStatus = "available" | "in_progress" | "completed" | "expired";

export interface Quest {
  id: string;
  title: string;
  description: string;
  lpReward: number;
  xpReward: number;
  frequency: QuestFrequency;
  category: "engagement" | "project" | "social" | "learning" | "achievement";
  icon: string;
  color: string;
  target: number;
  progress: number;
  status: QuestStatus;
  expiresAt?: string;
  forRoles: UserRole[];
}

export interface CompanyEvent {
  id: string;
  title: string;
  description: string;
  type: "seasonal" | "milestone" | "competition" | "celebration" | "training";
  startDate: string;
  endDate: string;
  lpBonus: number;
  quests: string[];
  participants: number;
  maxParticipants: number;
  color: string;
  icon: string;
  active: boolean;
  rewards: { rank: number; label: string; lp: number }[];
}

// ── Initial Quests (from FE) ───────────────────────────────────────────────────

const INIT_QUESTS: Quest[] = [
  // Daily
  { id: "q-daily-1", title: "Điểm danh hằng ngày", description: "Đăng nhập vào hệ thống mỗi ngày", lpReward: 50, xpReward: 10, frequency: "daily", category: "engagement", icon: "☀️", color: DS.blue, target: 1, progress: 0, status: "available", forRoles: ["admin", "manager", "staff", "client"] },
  { id: "q-daily-2", title: "Gửi 1 tin nhắn", description: "Nhắn tin với khách hàng hoặc đồng đội", lpReward: 30, xpReward: 5, frequency: "daily", category: "social", icon: "💬", color: DS.blue, target: 1, progress: 0, status: "available", forRoles: ["admin", "manager", "staff"] },
  { id: "q-daily-3", title: "Xem 1 bài blog", description: "Đọc hoặc xem 1 bài viết trong Blog", lpReward: 20, xpReward: 5, frequency: "daily", category: "learning", icon: "📖", color: DS.cyan, target: 1, progress: 0, status: "available", forRoles: ["admin", "manager", "staff", "client"] },
  // Weekly
  { id: "q-week-1", title: "Hoàn thành 3 task Kanban", description: "Di chuyển 3 task sang cột 'Done'", lpReward: 200, xpReward: 50, frequency: "weekly", category: "project", icon: "✅", color: DS.green, target: 3, progress: 1, status: "in_progress", forRoles: ["admin", "manager", "staff"] },
  { id: "q-week-2", title: "Viết 1 blog post", description: "Đăng 1 bài viết lên blog công ty", lpReward: 300, xpReward: 80, frequency: "weekly", category: "social", icon: "✍️", color: DS.purple, target: 1, progress: 0, status: "available", forRoles: ["admin", "manager", "staff"] },
  { id: "q-week-3", title: "Hoàn thành 1 khóa học", description: "Complete 1 course trong Academy", lpReward: 500, xpReward: 100, frequency: "weekly", category: "learning", icon: "🎓", color: "#818CF8", target: 1, progress: 0, status: "available", forRoles: ["admin", "manager", "staff", "client"] },
  // Monthly
  { id: "q-month-1", title: "Đánh giá 360°", description: "Hoàn thành đánh giá đồng nghiệp tháng", lpReward: 1000, xpReward: 200, frequency: "monthly", category: "social", icon: "🌟", color: DS.red, target: 1, progress: 0, status: "available", forRoles: ["admin", "manager", "staff"] },
  { id: "q-month-2", title: "Giới thiệu 1 khách hàng", description: "Referral thành công 1 KH mới", lpReward: 2000, xpReward: 500, frequency: "monthly", category: "achievement", icon: "🤝", color: DS.amber, target: 1, progress: 0, status: "available", forRoles: ["admin", "manager", "staff", "client"] },
  // One-time achievements
  { id: "q-ach-1", title: "First Blood", description: "Hoàn thành đơn hàng đầu tiên", lpReward: 500, xpReward: 100, frequency: "one_time", category: "achievement", icon: "🏆", color: DS.amber, target: 1, progress: 1, status: "completed", forRoles: ["admin", "manager", "staff"] },
  { id: "q-ach-2", title: "Streak Master", description: "Điểm danh liên tục 30 ngày", lpReward: 3000, xpReward: 500, frequency: "one_time", category: "achievement", icon: "🔥", color: DS.red, target: 30, progress: 12, status: "in_progress", forRoles: ["admin", "manager", "staff", "client"] },
  // Client quests
  { id: "q-cli-1", title: "Đặt dịch vụ đầu tiên", description: "Book 1 dịch vụ bất kỳ tại LOOP", lpReward: 500, xpReward: 100, frequency: "one_time", category: "achievement", icon: "🚀", color: DS.blue, target: 1, progress: 0, status: "available", forRoles: ["client"] },
  { id: "q-cli-2", title: "Đánh giá dịch vụ", description: "Để lại 1 review sau khi hoàn thành dự án", lpReward: 200, xpReward: 50, frequency: "one_time", category: "social", icon: "⭐", color: DS.amber, target: 1, progress: 0, status: "available", forRoles: ["client"] },
];

const INIT_EVENTS: CompanyEvent[] = [
  {
    id: "ev-1", title: "LOOP Spring Festival 2026",
    description: "Sự kiện mùa xuân — Hoàn thành quest đặc biệt để nhận LP x2 và phần quà hấp dẫn!",
    type: "seasonal", startDate: "2026-03-20", endDate: "2026-04-20", lpBonus: 2,
    quests: ["q-daily-1", "q-week-1"], participants: 18, maxParticipants: 27,
    color: DS.green, icon: "🌸", active: true,
    rewards: [
      { rank: 1, label: "Top 1 — Vàng", lp: 10000 },
      { rank: 2, label: "Top 2 — Bạc", lp: 5000 },
      { rank: 3, label: "Top 3 — Đồng", lp: 2500 },
    ],
  },
  {
    id: "ev-2", title: "Hackathon Internal Q1",
    description: "Build 1 internal tool trong 48h. Team 2-4 người. Demo trước toàn bộ công ty.",
    type: "competition", startDate: "2026-04-05", endDate: "2026-04-07", lpBonus: 3,
    quests: [], participants: 12, maxParticipants: 20,
    color: DS.purple, icon: "⚡", active: true,
    rewards: [
      { rank: 1, label: "Quán quân", lp: 20000 },
      { rank: 2, label: "Á quân", lp: 10000 },
      { rank: 3, label: "Hạng 3", lp: 5000 },
    ],
  },
  {
    id: "ev-3", title: "LOOP Anniversary — 2 năm",
    description: "Kỷ niệm 2 năm thành lập. Party + mini game + tất cả LP x2 trong tuần!",
    type: "celebration", startDate: "2026-05-15", endDate: "2026-05-22", lpBonus: 2,
    quests: [], participants: 0, maxParticipants: 50,
    color: DS.amber, icon: "🎂", active: false,
    rewards: [{ rank: 1, label: "MVP Member", lp: 15000 }],
  },
];

// ── RBAC ───────────────────────────────────────────────────────────────────────

const DEPT_TABS: Record<string, AdminTab[]> = {
  engineering: ["overview", "orders", "projects", "members", "notification_center"],
  design: ["overview", "orders", "projects", "portfolio", "members", "notification_center"],
  media: ["overview", "media", "orders", "projects", "members", "notification_center"],
  marketing: ["overview", "blog", "academy", "clients", "services", "notification_center"],
  sales: ["overview", "orders", "clients", "quotation", "services", "revenue", "notification_center"],
  finance: ["overview", "revenue", "lp", "lp_manage", "income_tax", "web_packages", "orders", "notification_center"],
  hr: ["overview", "members", "departments", "notification_center"],
  management: ["overview", "orders", "members", "departments", "projects", "revenue", "clients", "notification_center", "quests_events"],
};

const STAFF_TABS: AdminTab[] = ["overview", "projects", "notification_center"];

export function getAccessibleTabs(role: UserRole, department?: string): AdminTab[] | "all" {
  if (role === "admin") return "all";
  if (role === "manager" && department) return DEPT_TABS[department] ?? STAFF_TABS;
  if (role === "staff") return STAFF_TABS;
  return [];
}

export function canAccessTab(role: UserRole, department: string | undefined, tab: AdminTab): boolean {
  const tabs = getAccessibleTabs(role, department);
  if (tabs === "all") return true;
  return tabs.includes(tab);
}

export function canEdit(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

/** Map Next.js roleLevel → UserRole */
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

// ── Store Interface ─────────────────────────────────────────────────────────────

interface AuthStore {
  // Session state (BE API-based)
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  role: UserRole;
  department?: string;
  accessibleTabs: AdminTab[] | "all";

  // Gamification (from FE)
  quests: Quest[];
  events: CompanyEvent[];
  dailyStreak: number;
  lastCheckIn: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  loginAs: (user: AuthUser) => void;
  logout: () => Promise<void>;
  fetchSession: () => Promise<void>;
  setLoading: (v: boolean) => void;
  clearError: () => void;

  // Quest actions
  checkIn: () => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  addQuest: (quest: Quest) => void;
  updateQuest: (id: string, data: Partial<Quest>) => void;
  deleteQuest: (id: string) => void;

  // Event actions
  addEvent: (event: CompanyEvent) => void;
  updateEvent: (id: string, data: Partial<CompanyEvent>) => void;
  deleteEvent: (id: string) => void;
  joinEvent: (id: string) => void;

  // Helpers
  getQuestsForRole: (role: UserRole) => Quest[];
  getActiveEvents: () => CompanyEvent[];
}

// ── Private helpers ─────────────────────────────────────────────────────────────

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

// ── Store ───────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Session (default: logged out)
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: "guest",
  department: undefined,
  accessibleTabs: [],

  // Gamification
  quests: INIT_QUESTS,
  events: INIT_EVENTS,
  dailyStreak: 0,
  lastCheckIn: null,

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<{ data: { token: string } } | ApiErrorResponse>(
        "/api/admin/auth/login",
        { email, password },
        { throwOnError: false }
      );

      if ("error" in res) {
        set({ isLoading: false, error: res.error });
        return false;
      }

      await get().fetchSession();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  loginAs: (user) => {
    const role = user.role ?? mapRoleLevelToUserRole(2, "staff");
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      role,
      department: user.department,
      accessibleTabs: getAccessibleTabs(role, user.department),
    });
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      await apiClient.post("/api/admin/auth/logout", undefined, { throwOnError: false });
    } catch {
      // Ignore
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
      const res = await apiClient.get<{ user: EnrichedSession } | ApiErrorResponse>(
        "/api/admin/auth/me",
        { throwOnError: false }
      );

      if ("error" in res || !("user" in res)) {
        set({ isAuthenticated: false, user: null, role: "guest", accessibleTabs: [] });
        return;
      }

      const session = res.user;
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
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  setLoading: (v) => set({ isLoading: v }),

  clearError: () => set({ error: null }),

  // ── Quest actions ──────────────────────────────────────────────────────────

  checkIn: () => {
    const today = new Date().toDateString();
    const { lastCheckIn, dailyStreak, quests } = get();
    if (lastCheckIn === today) return;
    const newStreak =
      lastCheckIn === new Date(Date.now() - 86400000).toDateString()
        ? dailyStreak + 1
        : 1;
    set({
      lastCheckIn: today,
      dailyStreak: newStreak,
      quests: quests.map((q) =>
        q.id === "q-daily-1" ? { ...q, progress: 1, status: "completed" as QuestStatus } : q
      ),
    });
  },

  updateQuestProgress: (questId, progress) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? {
              ...q,
              progress: Math.min(progress, q.target),
              status:
                progress >= q.target ? ("completed" as QuestStatus) : ("in_progress" as QuestStatus),
            }
          : q
      ),
    })),

  completeQuest: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId ? { ...q, progress: q.target, status: "completed" as QuestStatus } : q
      ),
    })),

  addQuest: (quest) => set((s) => ({ quests: [quest, ...s.quests] })),

  updateQuest: (id, data) =>
    set((s) => ({ quests: s.quests.map((q) => (q.id === id ? { ...q, ...data } : q)) })),

  deleteQuest: (id) => set((s) => ({ quests: s.quests.filter((q) => q.id !== id) })),

  // ── Event actions ─────────────────────────────────────────────────────────

  addEvent: (event) => set((s) => ({ events: [event, ...s.events] })),

  updateEvent: (id, data) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...data } : e)) })),

  deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  joinEvent: (id) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.id === id
          ? { ...e, participants: Math.min(e.participants + 1, e.maxParticipants) }
          : e
      ),
    })),

  getQuestsForRole: (role) => get().quests.filter((q) => q.forRoles.includes(role)),

  getActiveEvents: () => get().events.filter((e) => e.active),
}));

// ── Selector hooks ─────────────────────────────────────────────────────────────

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useRole = () => useAuthStore((s) => s.role);
export const useAccessibleTabs = () => useAuthStore((s) => s.accessibleTabs);
