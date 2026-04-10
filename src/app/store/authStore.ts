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
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
import { apiClient, adminApi, type ApiErrorResponse } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * 7 staff roles + 2 client/guest roles.
 * Maps 1-to-1 with BE role levels (roleLevel 0-5) and accountType.
 */
export type UserRole =
  | "admin"           // level 0-1: super_admin + admin
  | "hr"              // level 2: HR — add members only, no delete/approve/lp
  | "project_manager" // level 3: PM, orders + projects management
  | "media"           // level 4: blog, media, social posts
  | "qa"              // level 5: QA, testing, standups
  | "member"          // level 6: basic staff, own tasks + standups
  | "client"          // customer accountType
  | "guest";          // unauthenticated

export interface AuthUser {
  id: string;
  name: string;
  shortName: string;
  email: string;
  avatar: string;
  role: UserRole;
  accountType: "staff" | "customer"; // Split auth: determines which portal they belong to
  _department?: string;
  departmentKey?: string;       // NEW v4.0: "engineering" | "design" | ...
  isDeptHead?: boolean;          // NEW v4.0: Trưởng phòng
  tabPermissions?: string[];    // NEW v4.0: CEO-granted tab permissions
  rank?: string;
  rankColor?: string;
  lpBalance: number;
  level: number;
  beRoleLevel?: number; // original BE role level (0-6)
  teamMemberId?: string | null;
  accessTags?: string[];
  isOnboarded?: boolean;
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
  _department?: string;
  departmentKey?: string;       // NEW v4.0: "engineering" | "design" | ...
  isDeptHead?: boolean;         // NEW v4.0: Trưởng phòng
  tabPermissions?: string[];   // NEW v4.0: CEO-granted tab permissions
  rank?: string;
  rankColor?: string;
  lpBalance?: number;
  level?: number;
  accessTags?: string[];
  isOnboarded?: boolean;
}

export type AdminTab =
  | "overview" | "orders" | "members" | "departments" | "projects"
  | "services" | "media" | "quotation" | "portfolio" | "projects_completed"
  | "academy" | "blog" | "revenue" | "clients" | "lp" | "lp_manage"
  | "income_tax" | "web_packages" | "domain_prices" | "addon_services" | "pricing" | "effects" | "notification_center"
  | "settings" | "quests_events" | "leaderboard_admin" | "analytics"
  | "figma-demos" | "kanban"
  | "revenue_split" | "off_system_payments"
  | "*"; // wildcard: all tabs (ceo/super_admin/admin)

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
  /** Set by BE on daily-login quest completion */
  lpEarned?: number;
  xpEarned?: number;
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
  { id: "q-daily-1", title: "Điểm danh hằng ngày", description: "Đăng nhập vào hệ thống mỗi ngày", lpReward: 50, xpReward: 10, frequency: "daily", category: "engagement", icon: "☀️", color: DS.blue, target: 1, progress: 0, status: "available", forRoles: ["admin", "project_manager", "media", "qa", "member", "client"] },
  { id: "q-daily-2", title: "Gửi 1 tin nhắn", description: "Nhắn tin với khách hàng hoặc đồng đội", lpReward: 30, xpReward: 5, frequency: "daily", category: "social", icon: "💬", color: DS.blue, target: 1, progress: 0, status: "available", forRoles: ["admin", "project_manager", "media", "qa", "member"] },
  { id: "q-daily-3", title: "Xem 1 bài blog", description: "Đọc hoặc xem 1 bài viết trong Blog", lpReward: 20, xpReward: 5, frequency: "daily", category: "learning", icon: "📖", color: DS.cyan, target: 1, progress: 0, status: "available", forRoles: ["admin", "project_manager", "media", "qa", "member", "client"] },
  // Weekly
  { id: "q-week-1", title: "Hoàn thành 3 task Kanban", description: "Di chuyển 3 task sang cột 'Done'", lpReward: 200, xpReward: 50, frequency: "weekly", category: "project", icon: "✅", color: DS.green, target: 3, progress: 1, status: "in_progress", forRoles: ["admin", "project_manager", "media", "qa"] },
  { id: "q-week-2", title: "Viết 1 blog post", description: "Đăng 1 bài viết lên blog công ty", lpReward: 300, xpReward: 80, frequency: "weekly", category: "social", icon: "✍️", color: DS.purple, target: 1, progress: 0, status: "available", forRoles: ["admin", "project_manager", "media"] },
  { id: "q-week-3", title: "Hoàn thành 1 khóa học", description: "Complete 1 course trong Academy", lpReward: 500, xpReward: 100, frequency: "weekly", category: "learning", icon: "🎓", color: "#818CF8", target: 1, progress: 0, status: "available", forRoles: ["admin", "project_manager", "media", "qa", "member", "client"] },
  // Monthly
  { id: "q-month-1", title: "Đánh giá 360°", description: "Hoàn thành đánh giá đồng nghiệp tháng", lpReward: 1000, xpReward: 200, frequency: "monthly", category: "social", icon: "🌟", color: DS.red, target: 1, progress: 0, status: "available", forRoles: ["admin", "project_manager"] },
  { id: "q-month-2", title: "Giới thiệu 1 khách hàng", description: "Referral thành công 1 KH mới", lpReward: 2000, xpReward: 500, frequency: "monthly", category: "achievement", icon: "🤝", color: DS.amber, target: 1, progress: 0, status: "available", forRoles: ["admin", "project_manager", "media", "qa", "member", "client"] },
  // One-time achievements
  { id: "q-ach-1", title: "First Blood", description: "Hoàn thành đơn hàng đầu tiên", lpReward: 500, xpReward: 100, frequency: "one_time", category: "achievement", icon: "🏆", color: DS.amber, target: 1, progress: 1, status: "completed", forRoles: ["admin", "project_manager"] },
  { id: "q-ach-2", title: "Streak Master", description: "Điểm danh liên tục 30 ngày", lpReward: 3000, xpReward: 500, frequency: "one_time", category: "achievement", icon: "🔥", color: DS.red, target: 30, progress: 12, status: "in_progress", forRoles: ["admin", "project_manager", "media", "qa", "member", "client"] },
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

// ── RBAC — Per-Role Admin Tab Access (v4.0) ────────────────────────────────────

/**
 * 8 role-specific tab sets. Each role sees only the tabs it needs.
 *
 * CEO / super_admin / admin: all tabs (bypass)
 * HR (level 2): members, departments, notification, quests, academy, lp_manage
 * Project Manager (level 3): orders, clients, quotation, services, revenue,
 *   projects, members, departments, notification_center, leaderboard_admin, lp_manage, quests_events
 * Media (level 4): media, blog, orders, projects, clients, notification_center,
 *   academy, services, leaderboard_admin, quests_events
 * QA (level 5): projects, notification_center, orders, clients, members,
 *   academy, leaderboard_admin
 * Member (level 6): overview, notification_center, leaderboard_admin,
 *   academy (learn), quests_events
 *
 * v4.0: CEO gán từng tab permission riêng cho từng member.
 * Baseline tabs ở đây là default — CEO gán thêm/bớt từ Settings.
 * Department bonus: tự động thêm dept tabs khi member thuộc phòng ban.
 *
 * Client (customer accountType): redirected to /khach-hang, no admin tabs
 * Guest: no access
 */

const HR_TABS: AdminTab[] = [
  "overview", "members", "departments", "notification_center",
  "quests_events", "academy", "lp_manage",
];

const PM_TABS: AdminTab[] = [
  "overview", "orders", "clients", "quotation", "services", "revenue",
  "projects", "members", "departments", "notification_center",
  "leaderboard_admin", "lp_manage", "quests_events",
  "academy", "blog", "lp", "figma-demos",
  "revenue_split", "off_system_payments",
];

const MEDIA_TABS: AdminTab[] = [
  "media", "blog", "orders", "projects", "clients", "notification_center",
  "academy", "services", "leaderboard_admin", "quests_events",
  "overview", "portfolio", "revenue", "figma-demos",
];

const QA_TABS: AdminTab[] = [
  "projects", "notification_center", "orders", "clients", "members",
  "academy", "leaderboard_admin", "overview", "lp", "figma-demos",
];

const MEMBER_TABS: AdminTab[] = [
  "overview", "notification_center", "leaderboard_admin",
  "academy", "quests_events",
];

// Department bonus tab grants (tự động thêm khi member thuộc phòng ban)
export const DEPT_TAB_BONUS: Record<string, AdminTab[]> = {
  engineering: ["kanban", "lp"],
  design:     ["figma-demos", "portfolio"],
  media:      ["media", "blog"],
  marketing:  ["blog", "projects"],
  sales:      ["orders", "clients", "quotation", "revenue"],
  finance:    ["revenue", "lp", "lp_manage", "income_tax", "revenue_split", "off_system_payments"],
  hr:         ["members", "departments"],
  management: ["*"],
};

export function getAccessibleTabs(role: UserRole, _departmentKey?: string): AdminTab[] | "all" {
  if (role === "admin") return "all";
  if (role === "hr") return HR_TABS;
  if (role === "project_manager") return PM_TABS;
  if (role === "media") return MEDIA_TABS;
  if (role === "qa") return QA_TABS;
  if (role === "member") return MEMBER_TABS;
  if (role === "client") return []; // redirected to customer portal
  return []; // guest
}

/**
 * Check if user can access a specific admin tab (v4.0).
 * Supports: role bypass, explicit tab list, department bonus.
 */
export function canAccessTab(
  role: UserRole,
  departmentKey: string | undefined,
  tab: AdminTab,
  userTabPermissions?: string[],
): boolean {
  if (role === "admin") return true;
  // CEO/super_admin are mapped to "admin" in FE UserRole
  const tabs = getAccessibleTabs(role, departmentKey);
  if (tabs === "all") return true;
  if (tabs.includes(tab)) return true;
  // Department bonus tabs
  if (departmentKey && DEPT_TAB_BONUS[departmentKey]?.includes(tab)) return true;
  // Explicit CEO-granted tab permissions (from session)
  if (userTabPermissions?.includes(tab)) return true;
  return false;
}

export function canEdit(role: UserRole): boolean {
  // admin+ can add members (HR); member+ cannot edit
  return role === "admin" || role === "hr";
}

/** Map BE roleLevel → FE UserRole (1-to-1) */
export function mapRoleLevelToUserRole(
  roleLevel: number,
  accountType: "staff" | "customer"
): UserRole {
  if (accountType === "customer") return "client";
  if (roleLevel <= 1) return "admin";  // ceo=-1, super_admin=0, admin=1
  if (roleLevel === 2) return "hr";              // hr
  if (roleLevel === 3) return "project_manager";  // pm
  if (roleLevel === 4) return "media";           // media
  if (roleLevel === 5) return "qa";             // qa
  if (roleLevel === 6) return "member";         // member
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
  accountType: "staff" | "customer" | null; // Split auth: Option C
  _department?: string;
  departmentKey?: string;    // v4.0: "engineering" | "design" | ...
  isDeptHead?: boolean;      // v4.0: Trưởng phòng
  tabPermissions?: string[]; // v4.0: CEO-granted explicit tab permissions
  accessibleTabs: AdminTab[] | "all";

  /** R2: Server-session verified flag — set true after /me returns 200. Prevents stale cache. */
  sessionHydrated: boolean;
  /** R2: UTC ms timestamp when the HttpOnly cookie token expires (15 min from login). */
  tokenExpiry: number | null;

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

  // Quest actions (production uses BE API; these are for demo/local fallback)
  checkIn: () => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;

  // Helpers
  getQuestsForRole: (role: UserRole) => Quest[];
  getActiveEvents: () => CompanyEvent[];
}

// ── Private helpers ─────────────────────────────────────────────────────────────

function extractShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
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
    accountType: session.accountType,
    _department: session._department,
    departmentKey: session.departmentKey,     // v4.0
    isDeptHead: session.isDeptHead,           // v4.0
    tabPermissions: session.tabPermissions,   // v4.0
    rank: session.rank,
    rankColor: session.rankColor,
    lpBalance: session.lpBalance ?? 0,
    level: session.level ?? 1,
    beRoleLevel: session.roleLevel,
    isOnboarded: session.isOnboarded,
    teamMemberId: session.teamMemberId,
    accessTags: session.accessTags,
  };
}

// ── Store ───────────────────────────────────────────────────────────────────────

const PERSIST_KEY = "loop-auth";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Session (default: logged out)
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      role: "guest",
      accountType: null,
      _department: undefined,
      accessibleTabs: [],
      sessionHydrated: false, // R2: not yet verified by server
      tokenExpiry: null,      // R2: no token expiry yet

      // Gamification (NOT persisted — re-fetched from BE on each session)
      quests: INIT_QUESTS,
      events: INIT_EVENTS,
      dailyStreak: 0,
      lastCheckIn: null,

      login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<{ user: EnrichedSession; token: string } | ApiErrorResponse>(
        "/api/admin/auth/login",
        { email, password },
        { throwOnError: false, withCredentials: true }
      );

      if ("error" in res) {
        set({ isLoading: false, error: res.error });
        return false;
      }

      // Update store immediately from login response (no extra /me call)
      const successPayload = res as { user: EnrichedSession; token: string };
      const session = successPayload.user;

      // Persist JWT token in localStorage — split auth: Option C
      // Staff token: "loop-staff-token" | Customer token: "loop-customer-token"
      // Use the accountType from the API response to store in the correct key.
      // This ensures /api/portal/* calls find the correct token for customers.
      if (typeof window !== "undefined" && successPayload.token) {
        try {
          const tokenKey = session.accountType === "customer"
            ? "loop-customer-token"
            : "loop-staff-token";
          localStorage.setItem(tokenKey, successPayload.token);
        } catch {
          // Storage unavailable (private browsing, quota) — cookie will still work
        }
      }

      const authUser = sessionToAuthUser(session);
      const role = mapRoleLevelToUserRole(session.roleLevel, session.accountType);

      set({
        user: authUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        role,
        accountType: session.accountType,
        _department: session._department,
        departmentKey: session.departmentKey,     // v4.0
        isDeptHead: session.isDeptHead,           // v4.0
        tabPermissions: session.tabPermissions,   // v4.0
        accessibleTabs: getAccessibleTabs(role, session.departmentKey),
        sessionHydrated: true,       // R2: login payload IS the server session — mark hydrated
        tokenExpiry: Date.now() + 15 * 60 * 1000, // R2: access token TTL = 15 min
      });
      return true;
    } catch (err) {
      const isAbort = err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
      const message = isAbort
        ? "Yêu cầu bị timeout. Vui lòng thử lại sau."
        : err instanceof Error ? err.message : "Đăng nhập thất bại";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  loginAs: (user) => {
    const role = user.role;
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      role,
      accountType: user.accountType,
      _department: user._department,
      departmentKey: user.departmentKey,       // v4.0
      isDeptHead: user.isDeptHead,             // v4.0
      tabPermissions: user.tabPermissions,     // v4.0
      accessibleTabs: getAccessibleTabs(role, user.departmentKey),
      sessionHydrated: true,    // R2: programmatic login — trust the caller
      tokenExpiry: Date.now() + 15 * 60 * 1000, // R2: default 15-min TTL
    });
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true });

    // Read both tokens so we can clear the right one based on accountType
    const store = useAuthStore.getState();
    const isStaff = store.accountType === "staff";
    const tokenKey = isStaff ? "loop-staff-token" : "loop-customer-token";
    const token =
      typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;

    try {
      const doLogout = async () => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/admin/auth/logout", {
          method: "POST",
          headers,
          credentials: "include",
        });
        return res.json();
      };

      const timeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8_000)
      );
      await Promise.race([doLogout(), timeout]);
    } catch {
      // Ignore network errors — always clear session client-side
    } finally {
      // ── Clear all auth storage (triệt để) ───────────────────────────────
      if (typeof window !== "undefined") {
        // localStorage tokens
        localStorage.removeItem("loop-staff-token");
        localStorage.removeItem("loop-customer-token");
        localStorage.removeItem("loop-staff-email"); // remembered email
        // Zustand persist key
        localStorage.removeItem("loop-auth");
      }

      // ── Clear React Query cache ────────────────────────────────────────
      // Import động để tránh circular import và SSR issues
      if (typeof window !== "undefined") {
        try {
          const { QueryClient } = await import("@tanstack/react-query");
          const qc = new QueryClient();
          qc.clear();
        } catch {
          // Non-fatal — cache will expire on next load anyway
        }
      }

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        role: "guest",
        accountType: null,
        _department: undefined,
        departmentKey: undefined,
        isDeptHead: undefined,
        tabPermissions: undefined,
        accessibleTabs: [],
        sessionHydrated: false,
        tokenExpiry: null,
      });
    }
  },

  fetchSession: async (): Promise<void> => {
    try {
      const res = await adminApi.get<{ user: EnrichedSession } | ApiErrorResponse>(
        "/api/admin/auth/me",
        { throwOnError: false }
      );

      if ("error" in res || !("user" in res)) {
        // R2: /me failed → clear session + mark NOT hydrated
        set({
          isAuthenticated: false, user: null, role: "guest",
          accountType: null, accessibleTabs: [], sessionHydrated: true,
        });
        return;
      }

      const session = res.user;
      const authUser = sessionToAuthUser(session);
      const role = mapRoleLevelToUserRole(session.roleLevel, session.accountType);

      // R2: sync token expiry on every successful /me response
      set({
        user: authUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        role,
        accountType: session.accountType,
        _department: session._department,
        departmentKey: session.departmentKey,     // v4.0
        isDeptHead: session.isDeptHead,           // v4.0
        tabPermissions: session.tabPermissions,   // v4.0
        accessibleTabs: getAccessibleTabs(role, session.departmentKey),
        sessionHydrated: true,         // R2: server confirmed valid session
        tokenExpiry: Date.now() + 15 * 60 * 1000, // R2: refresh expiry on each /me
      });
    } catch (err) {
      if (err instanceof Error) {
        console.warn("[AuthStore] fetchSession failed:", err.message);
      }
      // R2: on error → keep cached auth but mark NOT hydrated (will retry)
      set({ sessionHydrated: true });
    }
  },

  setLoading: (v) => set({ isLoading: v }),

  clearError: () => set({ error: null }),

  // ── Quest actions ──────────────────────────────────────────────────────────

  /**
   * Daily check-in quest — marks q-daily-1 as complete.
   * Async fire-and-forget: calls BE to award LP + XP; errors handled silently.
   * Callers do NOT need to await — state is updated optimistically on the FE.
   */
  checkIn: async () => {
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

    // Call BE to award LP + XP for staff (silent — FE state already updated optimistically)
    const dailyQuest = quests.find((q) => q.id === "q-daily-1");
    try {
      const res = await apiClient.post<{
        data: { lpEarned: number; xpEarned: number; loginStreak: number };
      }>("/api/admin/quests/daily-login", { questId: dailyQuest?.id });
      // Update quest with actual rewards from BE
      set((s) => ({
        quests: s.quests.map((q) =>
          q.id === "q-daily-1"
            ? { ...q, lpEarned: res.data.lpEarned, xpEarned: res.data.xpEarned }
            : q
        ),
      }));
    } catch {
      // Silently ignore — FE state already reflects successful check-in
    }
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

  // ── Helpers ──────────────────────────────────────────────────────────────

  getQuestsForRole: (role) => get().quests.filter((q) => q.forRoles.includes(role)),

  getActiveEvents: () => get().events.filter((e) => e.active),
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        accountType: state.accountType,
        _department: state._department,
        accessibleTabs: state.accessibleTabs,
        sessionHydrated: state.sessionHydrated, // R2: preserve hydration state
        tokenExpiry: state.tokenExpiry,        // R2: preserve token expiry
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          (state as unknown as { _rehydrated: boolean })._rehydrated = true;
        }
      },
    }
  )
);

// ── Selector hooks ─────────────────────────────────────────────────────────────

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useRole = () => useAuthStore((s) => s.role);
export const useAccessibleTabs = () => useAuthStore((s) => s.accessibleTabs);
export { useShallow };
