/**
 * Auth Store — Role-based access control for LOOP Solutions
 * Roles: admin | manager | staff | client | guest
 *
 * Session persistence: After real login/register, token is saved to localStorage.
 * On app init, App.tsx calls fetchSession() to restore the session.
 * Demo shortcuts (loginAs) bypass API and set state directly — for dev only.
 */
import { create } from 'zustand';
import { DS } from '../components/layout/ds';
import {
  apiClient,
  setAuthToken,
  clearAuthToken,
  hasStoredSession,
  type SessionUser,
} from '../../lib/api/client';

export type UserRole = 'admin' | 'manager' | 'staff' | 'client' | 'guest';

export interface AuthUser {
  id: string;
  name: string;
  shortName: string;
  email: string;
  avatar: string;
  role: UserRole;
  department?: string; // for manager/staff: 'engineering'|'design'|'media'|'marketing'|'sales'|'finance'|'hr'
  rank?: string;
  rankColor?: string;
  lpBalance: number;
  level: number;
}

function toAuthUser(u: SessionUser): AuthUser {
  const nameParts = (u.name ?? "User").split(" ");
  const shortName = nameParts[nameParts.length - 1] || nameParts[0] || "User";
  const role = u.role === "super_admin" ? "admin"
    : (u.role === "project_manager" ? "manager" : u.role === "member" ? "staff"
    : (u.role === "client" || u.accountType === "customer" ? "client" : "staff")) as UserRole;
  return {
    id: u.userId,
    name: u.name ?? "User",
    shortName,
    email: u.email ?? "",
    avatar: u.avatar ?? "",
    role,
    department: u.department,
    rank: u.rank,
    rankColor: u.rankColor,
    lpBalance: u.lpBalance ?? 0,
    level: u.level ?? 1,
  };
}

// ── Permission matrix ────────────────────────────────────────────────────
export type AdminTab =
  | 'overview' | 'orders' | 'members' | 'departments' | 'projects'
  | 'services' | 'media' | 'quotation' | 'portfolio' | 'projects_completed' | 'academy' | 'blog'
  | 'revenue' | 'clients' | 'lp' | 'lp_manage' | 'income_tax' | 'web_packages'
  | 'effects' | 'notification_center' | 'settings' | 'quests_events' | 'leaderboard_admin' | 'analytics';

const DEPT_TABS: Record<string, AdminTab[]> = {
  engineering: ['overview', 'orders', 'projects', 'members', 'notification_center'],
  design: ['overview', 'orders', 'projects', 'portfolio', 'members', 'notification_center'],
  media: ['overview', 'media', 'orders', 'projects', 'members', 'notification_center'],
  marketing: ['overview', 'blog', 'academy', 'clients', 'services', 'notification_center'],
  sales: ['overview', 'orders', 'clients', 'quotation', 'services', 'revenue', 'notification_center'],
  finance: ['overview', 'revenue', 'lp', 'lp_manage', 'income_tax', 'web_packages', 'orders', 'notification_center'],
  hr: ['overview', 'members', 'departments', 'notification_center'],
  management: ['overview', 'orders', 'members', 'departments', 'projects', 'revenue', 'clients', 'notification_center', 'quests_events'],
};

const STAFF_TABS: AdminTab[] = ['overview', 'projects', 'notification_center'];

export function getAccessibleTabs(role: UserRole, department?: string): AdminTab[] | 'all' {
  if (role === 'admin') return 'all';
  if (role === 'manager' && department) return DEPT_TABS[department] ?? STAFF_TABS;
  if (role === 'staff') return STAFF_TABS;
  return [];
}

export function canAccessTab(role: UserRole, department: string | undefined, tab: AdminTab): boolean {
  const tabs = getAccessibleTabs(role, department);
  if (tabs === 'all') return true;
  return tabs.includes(tab);
}

export function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

// ── Preset users for demo ─────────────────���──────────────────────────────
export const DEMO_USERS: Record<string, AuthUser> = {
  admin: {
    id: 'u-admin', name: 'Akira Sato', shortName: 'Akira', email: 'akira@loop.vn',
    avatar: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=80&h=80&crop=faces',
    role: 'admin', department: 'management', rank: 'diamond', rankColor: '#818CF8', lpBalance: 180000, level: 99,
  },
  manager_media: {
    id: 'u-mgr-media', name: 'Haru Tanaka', shortName: 'Haru', email: 'haru@loop.vn',
    avatar: 'https://images.unsplash.com/photo-1612192279155-f7fab0a4f377?auto=format&fit=crop&w=80&h=80&crop=faces',
    role: 'manager', department: 'media', rank: 'ruby', rankColor: '#EF4444', lpBalance: 45000, level: 72,
  },
  manager_marketing: {
    id: 'u-mgr-mkt', name: 'Yuna Park', shortName: 'Yuna', email: 'yuna@loop.vn',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&crop=faces',
    role: 'manager', department: 'marketing', rank: 'gold', rankColor: '#F59E0B', lpBalance: 65000, level: 69,
  },
  staff: {
    id: 'u-staff', name: 'Ryo Hashimoto', shortName: 'Ryo', email: 'ryo@loop.vn',
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&h=80&crop=faces',
    role: 'staff', department: 'engineering', rank: 'silver', rankColor: '#94A3B8', lpBalance: 8500, level: 28,
  },
  client: {
    id: 'u-client', name: 'Nguyễn Minh Tuấn', shortName: 'Minh Tuấn', email: 'minhtuan@techviet.vn',
    avatar: 'https://images.unsplash.com/photo-1746105625407-5d49d69a2a47?auto=format&fit=crop&w=80&h=80&crop=faces',
    role: 'client', lpBalance: 15200, level: 12,
  },
};

// ── Quest Types ──────────────────────────────────────────────────────────
export type QuestFrequency = 'daily' | 'weekly' | 'monthly' | 'one_time' | 'event';
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'expired';

export interface Quest {
  id: string;
  title: string;
  description: string;
  lpReward: number;
  xpReward: number;
  frequency: QuestFrequency;
  category: 'engagement' | 'project' | 'social' | 'learning' | 'achievement';
  icon: string;
  color: string;
  target: number;       // e.g., 1 for one-time, 5 for "complete 5 tasks"
  progress: number;
  status: QuestStatus;
  expiresAt?: string;
  forRoles: UserRole[];
}

export interface CompanyEvent {
  id: string;
  title: string;
  description: string;
  type: 'seasonal' | 'milestone' | 'competition' | 'celebration' | 'training';
  startDate: string;
  endDate: string;
  lpBonus: number;       // bonus LP multiplier or flat
  quests: string[];      // quest IDs linked to this event
  participants: number;
  maxParticipants: number;
  color: string;
  icon: string;
  active: boolean;
  rewards: { rank: number; label: string; lp: number }[];
}

// ── Initial Quests ───────────────────────────────────────────────────────
const INIT_QUESTS: Quest[] = [
  // Daily
  { id: 'q-daily-1', title: 'Điểm danh hằng ngày', description: 'Đăng nhập vào hệ thống mỗi ngày', lpReward: 50, xpReward: 10, frequency: 'daily', category: 'engagement', icon: '☀️', color: '#F59E0B', target: 1, progress: 0, status: 'available', forRoles: ['admin', 'manager', 'staff', 'client'] },
  { id: 'q-daily-2', title: 'Gửi 1 tin nhắn', description: 'Nhắn tin với khách hàng hoặc đồng đội', lpReward: 30, xpReward: 5, frequency: 'daily', category: 'social', icon: '💬', color: DS.blue, target: 1, progress: 0, status: 'available', forRoles: ['admin', 'manager', 'staff'] },
  { id: 'q-daily-3', title: 'Xem 1 bài blog', description: 'Đọc hoặc xem 1 bài viết trong Blog', lpReward: 20, xpReward: 5, frequency: 'daily', category: 'learning', icon: '📖', color: DS.cyan, target: 1, progress: 0, status: 'available', forRoles: ['admin', 'manager', 'staff', 'client'] },
  // Weekly
  { id: 'q-week-1', title: 'Hoàn thành 3 task Kanban', description: 'Di chuyển 3 task sang cột "Done"', lpReward: 200, xpReward: 50, frequency: 'weekly', category: 'project', icon: '✅', color: DS.green, target: 3, progress: 1, status: 'in_progress', forRoles: ['admin', 'manager', 'staff'] },
  { id: 'q-week-2', title: 'Viết 1 blog post', description: 'Đăng 1 bài viết lên blog công ty', lpReward: 300, xpReward: 80, frequency: 'weekly', category: 'social', icon: '✍️', color: DS.purple, target: 1, progress: 0, status: 'available', forRoles: ['admin', 'manager', 'staff'] },
  { id: 'q-week-3', title: 'Hoàn thành 1 khóa học', description: 'Complete 1 course trong Academy', lpReward: 500, xpReward: 100, frequency: 'weekly', category: 'learning', icon: '🎓', color: '#818CF8', target: 1, progress: 0, status: 'available', forRoles: ['admin', 'manager', 'staff', 'client'] },
  // Monthly
  { id: 'q-month-1', title: 'Đánh giá 360°', description: 'Hoàn thành đánh giá đồng nghiệp tháng', lpReward: 1000, xpReward: 200, frequency: 'monthly', category: 'social', icon: '🌟', color: '#EF4444', target: 1, progress: 0, status: 'available', forRoles: ['admin', 'manager', 'staff'] },
  { id: 'q-month-2', title: 'Giới thiệu 1 khách hàng', description: 'Referral thành công 1 KH mới', lpReward: 2000, xpReward: 500, frequency: 'monthly', category: 'achievement', icon: '🤝', color: DS.amber, target: 1, progress: 0, status: 'available', forRoles: ['admin', 'manager', 'staff', 'client'] },
  // One-time achievements
  { id: 'q-ach-1', title: 'First Blood', description: 'Hoàn thành đơn hàng đầu tiên', lpReward: 500, xpReward: 100, frequency: 'one_time', category: 'achievement', icon: '🏆', color: '#F59E0B', target: 1, progress: 1, status: 'completed', forRoles: ['admin', 'manager', 'staff'] },
  { id: 'q-ach-2', title: 'Streak Master', description: 'Điểm danh liên tục 30 ngày', lpReward: 3000, xpReward: 500, frequency: 'one_time', category: 'achievement', icon: '🔥', color: '#EF4444', target: 30, progress: 12, status: 'in_progress', forRoles: ['admin', 'manager', 'staff', 'client'] },
  // Client quests
  { id: 'q-cli-1', title: 'Đặt dịch vụ đầu tiên', description: 'Book 1 dịch vụ bất kỳ tại LOOP', lpReward: 500, xpReward: 100, frequency: 'one_time', category: 'achievement', icon: '🚀', color: DS.blue, target: 1, progress: 0, status: 'available', forRoles: ['client'] },
  { id: 'q-cli-2', title: 'Đánh giá dịch vụ', description: 'Để lại 1 review sau khi hoàn thành dự án', lpReward: 200, xpReward: 50, frequency: 'one_time', category: 'social', icon: '⭐', color: '#F59E0B', target: 1, progress: 0, status: 'available', forRoles: ['client'] },
];

const INIT_EVENTS: CompanyEvent[] = [
  {
    id: 'ev-1', title: 'LOOP Spring Festival 2026', description: 'Sự kiện mùa xuân — Hoàn thành quest đặc biệt để nhận LP x2 và phần quà hấp dẫn!',
    type: 'seasonal', startDate: '2026-03-20', endDate: '2026-04-20', lpBonus: 2,
    quests: ['q-daily-1', 'q-week-1'], participants: 18, maxParticipants: 27,
    color: '#22C55E', icon: '🌸', active: true,
    rewards: [{ rank: 1, label: 'Top 1 — Vàng', lp: 10000 }, { rank: 2, label: 'Top 2 — Bạc', lp: 5000 }, { rank: 3, label: 'Top 3 — Đồng', lp: 2500 }],
  },
  {
    id: 'ev-2', title: 'Hackathon Internal Q1', description: 'Build 1 internal tool trong 48h. Team 2-4 người. Demo trước toàn bộ công ty.',
    type: 'competition', startDate: '2026-04-05', endDate: '2026-04-07', lpBonus: 3,
    quests: [], participants: 12, maxParticipants: 20,
    color: '#818CF8', icon: '⚡', active: true,
    rewards: [{ rank: 1, label: 'Quán quân', lp: 20000 }, { rank: 2, label: 'Á quân', lp: 10000 }, { rank: 3, label: 'Hạng 3', lp: 5000 }],
  },
  {
    id: 'ev-3', title: 'LOOP Anniversary — 2 năm', description: 'Kỷ niệm 2 năm thành lập. Party + mini game + tất cả LP x2 trong tuần!',
    type: 'celebration', startDate: '2026-05-15', endDate: '2026-05-22', lpBonus: 2,
    quests: [], participants: 0, maxParticipants: 50,
    color: '#F59E0B', icon: '🎂', active: false,
    rewards: [{ rank: 1, label: 'MVP Member', lp: 15000 }],
  },
];

// ── Daily check-in streak ────────────────────────────────────────────────
interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth actions — real API
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: { name: string; email: string; password: string; company?: string }) => Promise<void>;
  loginWithGoogle: () => void;
  loginAs: (user: AuthUser) => void; // demo-only
  logout: () => Promise<void>;
  fetchSession: () => Promise<void>;
  setLoading: (v: boolean) => void;

  // Quest/Event data
  quests: Quest[];
  events: CompanyEvent[];
  dailyStreak: number;
  lastCheckIn: string | null;

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

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  quests: INIT_QUESTS,
  events: INIT_EVENTS,
  dailyStreak: 12,
  lastCheckIn: null,

  // ── Real login via credentials ─────────────────────────────────────────
  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.login(email, password, rememberMe);
      setAuthToken(res.token, rememberMe);
      const user = toAuthUser(res.user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Real register ──────────────────────────────────────────────────────
  register: async ({ name, email, password, company }) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.register({ name, email, password, company });
      setAuthToken(res.token, true);
      const user = toAuthUser(res.user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Google OAuth — redirect to BE endpoint ──────────────────────────────
  loginWithGoogle: () => {
    localStorage.setItem("loop_auth_redirect", window.location.href);
    apiClient.googleSignIn();
  },

  // ── Hydrate session from stored token on init ───────────────────────────
  fetchSession: async () => {
    if (!hasStoredSession()) return;
    set({ isLoading: true });
    try {
      const res = await apiClient.getSession();
      const user = toAuthUser(res.data);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearAuthToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loginAs: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: async () => {
    try { await apiClient.logout(); } catch { /* ignore */ }
    clearAuthToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (v) => set({ isLoading: v }),

  checkIn: () => {
    const today = new Date().toDateString();
    const { lastCheckIn, dailyStreak, quests } = get();
    if (lastCheckIn === today) return;
    const newStreak = lastCheckIn === new Date(Date.now() - 86400000).toDateString() ? dailyStreak + 1 : 1;
    set({
      lastCheckIn: today,
      dailyStreak: newStreak,
      quests: quests.map(q => q.id === 'q-daily-1' ? { ...q, progress: 1, status: 'completed' as QuestStatus } : q),
    });
  },

  updateQuestProgress: (questId, progress) => set(s => ({
    quests: s.quests.map(q => q.id === questId ? {
      ...q,
      progress: Math.min(progress, q.target),
      status: progress >= q.target ? 'completed' as QuestStatus : 'in_progress' as QuestStatus,
    } : q),
  })),

  completeQuest: (questId) => set(s => ({
    quests: s.quests.map(q => q.id === questId ? { ...q, progress: q.target, status: 'completed' as QuestStatus } : q),
  })),

  addQuest: (quest) => set(s => ({ quests: [quest, ...s.quests] })),
  updateQuest: (id, data) => set(s => ({ quests: s.quests.map(q => q.id === id ? { ...q, ...data } : q) })),
  deleteQuest: (id) => set(s => ({ quests: s.quests.filter(q => q.id !== id) })),

  addEvent: (event) => set(s => ({ events: [event, ...s.events] })),
  updateEvent: (id, data) => set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...data } : e) })),
  deleteEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),
  joinEvent: (id) => set(s => ({ events: s.events.map(e => e.id === id ? { ...e, participants: Math.min(e.participants + 1, e.maxParticipants) } : e) })),

  getQuestsForRole: (role) => get().quests.filter(q => q.forRoles.includes(role)),
  getActiveEvents: () => get().events.filter(e => e.active),
}));