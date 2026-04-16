/**
 * RBAC System — Role definitions and permission checks
 *
 * Role hierarchy (lower = more powerful):
 *   CEO > SUPER_ADMIN > ADMIN > PROJECT_MANAGER > MEDIA > QA > MEMBER
 *
 * All permissions are stored in the database (Permission table) and checked
 * at three levels:
 *   1. Middleware  — blocks unauthenticated users
 *   2. Admin shell — blocks role-level page access
 *   3. API routes  — blocks resource+action level access
 *   4. UI          — hides/show nav items and action buttons
 *
 * Permission resources map to admin routes (grouped paths):
 *   dashboard        → /admin
 *   home-sliders     → /admin/content/home-sliders
 *   landing-pages    → /admin/content/landing-pages
 *   services         → /admin/content/services
 *   projects         → /admin/content/projects
 *   team             → /admin/content/team
 *   expertises       → /admin/content/expertises
 *   testimonials     → /admin/content/testimonials
 *   messages         → /admin/content/messages
 *   orders           → /admin/sales/orders
 *   web-templates    → /admin/sales/web-templates
 *   service-attrs    → /admin/sales/service-attributes
 *   addon-services   → /admin/sales/addon-services
 *   reward-tiers     → /admin/sales/reward-tiers
 *   packages         → /admin/sales/packages
 *   hosting-plans    → /admin/sales/hosting-plans
 *   domain-prices    → /admin/sales/domain-prices
 *   deployment-items  → /admin/sales/deployment-items
 *   pricing-features → /admin/sales/pricing-features
 *   quote-requests   → /admin/sales/quote-requests
 *   users            → /admin/system/staff-users
 *   roles            → /admin/system/roles
 *   audit-log        → /admin/audit_log
 *   settings         → /admin/system/settings
 *   websites         → /admin/system/websites
 *   points           → /admin/system/points
 */

// ─── Role Definitions ──────────────────────────────────────────────────────────

export const ROLE_LEVEL: Record<string, number> = {
  // Special
  ceo: -1,
  super_admin: 0,
  // Staff
  admin: 1,
  hr: 2,                  // HR: create members only — no delete/approve/lp-award
  project_manager: 3,
  media: 4,
  qa: 5,
  member: 6,
};

export const ROLE_DISPLAY_NAMES: Record<string, { vi: string; en: string }> = {
  ceo: { vi: "CEO / Founder", en: "CEO / Founder" },
  super_admin: { vi: "Quản trị tối cao", en: "Super Admin" },
  admin: { vi: "Quản trị viên", en: "Administrator" },
  hr: { vi: "Nhân sự (HR)", en: "HR" },
  project_manager: { vi: "Trưởng nhóm / PM", en: "Project Manager" },
  media: { vi: "Media / Marketing", en: "Media" },
  qa: { vi: "QA / Tester", en: "QA / Tester" },
  member: { vi: "Thành viên", en: "Member" },
};

export const ROLE_COLORS: Record<string, string> = {
  ceo: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  super_admin: "text-red-400 bg-red-500/15 border-red-500/30",
  admin: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
  hr: "text-purple-400 bg-purple-500/15 border-purple-500/30",
  project_manager: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  media: "text-pink-400 bg-pink-500/15 border-pink-500/30",
  qa: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
  member: "text-slate-400 bg-slate-500/15 border-slate-500/30",
};

/** Ordered list of all system roles (by level) */
export const ALL_ROLES = [
  { name: "ceo", level: -1 },
  { name: "super_admin", level: 0 },
  { name: "admin", level: 1 },
  { name: "hr", level: 2 },
  { name: "project_manager", level: 3 },
  { name: "media", level: 4 },
  { name: "qa", level: 5 },
  { name: "member", level: 6 },
] as const;

// ─── Navigation Permission Config ──────────────────────────────────────────────

export interface NavPermission {
  /** Label shown in sidebar */
  label: { vi: string; en: string };
  /** Minimum role level to see this nav item. 0 = super_admin only, 5 = visible to all */
  minRoleLevel?: number;
  /**
   * Specific permissions required (OR logic — any one match allows access).
   * Maps to Permission.resource and Permission.action in DB.
   */
  permissions?: Array<{ resource: string; actions: string[] }>;
  /** Icon component name (lucide-react) */
  icon?: string;
}

/** Maps admin paths to their permission requirements */
export const NAV_PERMISSIONS: Record<string, NavPermission> = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  "/admin": {
    label: { vi: "Dashboard", en: "Dashboard" },
    minRoleLevel: 5,
    icon: "LayoutDashboard",
  },

  // ── Nội dung ────────────────────────────────────────────────────────────────
  "/admin/content/home-sliders": {
    label: { vi: "Trang chủ (Slider)", en: "Home Sliders" },
    minRoleLevel: 2,
    permissions: [{ resource: "home-sliders", actions: ["read", "create", "update", "delete"] }],
    icon: "Image",
  },
  "/admin/content/landing-pages": {
    label: { vi: "Landing Pages", en: "Landing Pages" },
    minRoleLevel: 2,
    permissions: [{ resource: "landing-pages", actions: ["read", "create", "update", "delete"] }],
    icon: "LayoutTemplate",
  },
  "/admin/content/services": {
    label: { vi: "Dịch vụ", en: "Services" },
    minRoleLevel: 2,
    permissions: [{ resource: "services", actions: ["read", "create", "update", "delete"] }],
    icon: "Globe",
  },
  "/admin/content/projects": {
    label: { vi: "Dự án", en: "Projects" },
    minRoleLevel: 3,
    permissions: [{ resource: "projects", actions: ["read", "create", "update", "delete"] }],
    icon: "FolderKanban",
  },
  "/admin/content/team": {
    label: { vi: "Đội ngũ", en: "Team" },
    minRoleLevel: 1,
    permissions: [{ resource: "team", actions: ["read", "create", "update", "delete"] }],
    icon: "UsersRound",
  },
  "/admin/content/expertises": {
    label: { vi: "Kỹ năng", en: "Expertises" },
    minRoleLevel: 2,
    permissions: [{ resource: "expertises", actions: ["read", "create", "update", "delete"] }],
    icon: "Wrench",
  },
  "/admin/content/testimonials": {
    label: { vi: "Đánh giá", en: "Testimonials" },
    minRoleLevel: 3,
    permissions: [{ resource: "testimonials", actions: ["read", "create", "update", "delete"] }],
    icon: "Star",
  },
  "/admin/content/messages": {
    label: { vi: "Tin nhắn", en: "Messages" },
    minRoleLevel: 4,
    permissions: [{ resource: "messages", actions: ["read", "update", "delete"] }],
    icon: "MessageSquare",
  },

  // ── Kinh doanh ─────────────────────────────────────────────────────────────
  "/admin/sales/orders": {
    label: { vi: "Đơn hàng", en: "Orders" },
    minRoleLevel: 3,
    // P1-15 FIX: added create/delete; removed phantom "approve" (no route checks it)
    permissions: [{ resource: "orders", actions: ["read", "create", "update", "delete"] }],
    icon: "ShoppingCart",
  },
  "/admin/sales/web-templates": {
    label: { vi: "Kho Giao Diện", en: "Web Templates" },
    minRoleLevel: 2,
    permissions: [{ resource: "web-templates", actions: ["read", "create", "update", "delete"] }],
    icon: "Layout",
  },
  "/admin/sales/service-attributes": {
    label: { vi: "Kho Tính Năng", en: "Service Attributes" },
    minRoleLevel: 2,
    permissions: [{ resource: "service-attributes", actions: ["read", "create", "update", "delete"] }],
    icon: "Tag",
  },
  "/admin/sales/addon-services": {
    label: { vi: "Dịch vụ Rời", en: "Addon Services" },
    minRoleLevel: 2,
    permissions: [{ resource: "addon-services", actions: ["read", "create", "update", "delete"] }],
    icon: "Puzzle",
  },
  "/admin/sales/customer-points": {
    label: { vi: "Điểm Khách hàng", en: "Customer Points" },
    minRoleLevel: 2,
    permissions: [{ resource: "customer-points", actions: ["read", "update"] }],
    icon: "Star",
  },
  "/admin/sales/lp-redemptions": {
    label: { vi: "Đổi LP", en: "LP Redemptions" },
    minRoleLevel: 2,
    permissions: [{ resource: "lp-redemptions", actions: ["read", "update"] }],
    icon: "Gift",
  },
  "/admin/sales/packages": {
    label: { vi: "Gói dịch vụ", en: "Service Packages" },
    minRoleLevel: 2,
    permissions: [{ resource: "packages", actions: ["read", "create", "update", "delete"] }],
    icon: "Package",
  },
  "/admin/sales/hosting-plans": {
    label: { vi: "Hosting Plans", en: "Hosting Plans" },
    minRoleLevel: 2,
    permissions: [{ resource: "hosting-plans", actions: ["read", "create", "update", "delete"] }],
    icon: "Server",
  },
  "/admin/sales/domain-prices": {
    label: { vi: "Domain Prices", en: "Domain Prices" },
    minRoleLevel: 2,
    permissions: [{ resource: "domain-prices", actions: ["read", "create", "update", "delete"] }],
    icon: "Globe",
  },
  "/admin/sales/deployment-items": {
    label: { vi: "Deployment Items", en: "Deployment Items" },
    minRoleLevel: 2,
    permissions: [{ resource: "deployment-items", actions: ["read", "create", "update", "delete"] }],
    icon: "FileText",
  },
  "/admin/sales/pricing-features": {
    label: { vi: "Báo giá tính năng", en: "Pricing Features" },
    minRoleLevel: 2,
    permissions: [{ resource: "pricing-features", actions: ["read", "create", "update", "delete"] }],
    icon: "Calculator",
  },
  "/admin/sales/quote-requests": {
    label: { vi: "Yêu cầu báo giá", en: "Quote Requests" },
    minRoleLevel: 3,
    permissions: [{ resource: "quote-requests", actions: ["read", "update", "approve"] }],
    icon: "FileQuestion",
  },
  "/admin/sales/sales-leads": {
    label: { vi: "Sales Leads", en: "Sales Leads" },
    minRoleLevel: 2,
    permissions: [{ resource: "sales-leads", actions: ["read", "create", "update", "delete"] }],
    icon: "TrendingUp",
  },
  "/admin/sales/quotes": {
    label: { vi: "Báo giá", en: "Quotes" },
    minRoleLevel: 2,
    permissions: [{ resource: "quotes", actions: ["read", "create", "update", "approve"] }],
    icon: "FileText",
  },
  "/admin/maintenance": {
    label: { vi: "Bảo trì", en: "Maintenance" },
    minRoleLevel: 2,
    permissions: [{ resource: "projects", actions: ["read", "update"] }],
    icon: "Wrench",
  },
  "/admin/projects/gsc": {
    label: { vi: "SEO / GSC", en: "SEO / GSC" },
    minRoleLevel: 2,
    permissions: [{ resource: "projects", actions: ["read", "update"] }],
    icon: "TrendingUp",
  },

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  "/admin/system/staff-users": {
    label: { vi: "Người dùng", en: "Users" },
    minRoleLevel: 1,
    permissions: [{ resource: "users", actions: ["read", "create", "update", "delete"] }],
    icon: "Users",
  },
  "/admin/system/roles": {
    label: { vi: "Phân quyền", en: "Roles" },
    minRoleLevel: 1,
    permissions: [{ resource: "roles", actions: ["read", "create", "update", "delete"] }],
    icon: "ShieldCheck",
  },
  "/admin/audit_log": {
    label: { vi: "Nhật ký", en: "Audit Log" },
    minRoleLevel: 1,
    permissions: [{ resource: "audit-log", actions: ["read", "export"] }],
    icon: "ClipboardList",
  },
  "/admin/system/settings": {
    label: { vi: "Cài đặt", en: "Settings" },
    minRoleLevel: 1,
    permissions: [{ resource: "settings", actions: ["read", "update"] }],
    icon: "Settings",
  },
  "/admin/system/websites": {
    label: { vi: "Websites", en: "Websites" },
    minRoleLevel: 3,
    permissions: [{ resource: "websites", actions: ["read", "update"] }],
    icon: "Globe",
  },
  "/admin/system/points": {
    label: { vi: "Điểm thưởng", en: "Points" },
    minRoleLevel: 2,
    permissions: [{ resource: "points", actions: ["read", "update"] }],
    icon: "Star",
  },

  // ── Dự án (JIRA-like) ──────────────────────────────────────────────
  "/admin/projects": {
    label: { vi: "Dự án", en: "Projects" },
    minRoleLevel: 2,
    permissions: [{ resource: "projects", actions: ["read", "create", "update"] }],
    icon: "FolderKanban",
  },
  "/admin/projects/[id]": {
    label: { vi: "Chi tiết dự án", en: "Project Detail" },
    minRoleLevel: 2,
    permissions: [{ resource: "projects", actions: ["read", "update"] }],
    icon: "FolderKanban",
  },
  "/admin/projects/[id]/board": {
    label: { vi: "Bảng Kanban", en: "Board" },
    minRoleLevel: 2,
    permissions: [{ resource: "projects", actions: ["read", "update"] }],
    icon: "LayoutDashboard",
  },
  "/admin/projects/[id]/backlogs": {
    label: { vi: "Backlogs", en: "Backlogs" },
    minRoleLevel: 2,
    permissions: [{ resource: "backlogs", actions: ["read", "create", "update"] }],
    icon: "Layers",
  },
  "/admin/projects/[id]/team": {
    label: { vi: "Thành viên", en: "Team" },
    minRoleLevel: 2,
    permissions: [{ resource: "projects", actions: ["read", "update"] }],
    icon: "UsersRound",
  },
  "/admin/projects/[id]/figma": {
    label: { vi: "Figma Demos", en: "Figma Demos" },
    minRoleLevel: 2,
    permissions: [{ resource: "figma_demos", actions: ["read", "create", "update"] }],
    icon: "Figma",
  },
  "/admin/projects/[id]/env": {
    label: { vi: "Env Files", en: "Env Files" },
    minRoleLevel: 2,
    permissions: [{ resource: "env-files", actions: ["read"] }],
    icon: "Lock",
  },
  "/admin/projects/[id]/commits": {
    label: { vi: "Git Commits", en: "Git Commits" },
    minRoleLevel: 2,
    permissions: [{ resource: "git-commits", actions: ["read"] }],
    icon: "Activity",
  },
  "/admin/projects/[id]/lp": {
    label: { vi: "LP Awards", en: "LP Awards" },
    minRoleLevel: 2,
    permissions: [{ resource: "lp-awards", actions: ["read", "approve", "reject"] }],
    icon: "Coins",
  },
  "/admin/projects/[id]/blog": {
    label: { vi: "Blog Posts", en: "Blog Posts" },
    minRoleLevel: 3,
    permissions: [{ resource: "blog-posts", actions: ["read", "create", "update"] }],
    icon: "FileText",
  },
  "/admin/projects/[id]/standups": {
    label: { vi: "Standups", en: "Standups" },
    minRoleLevel: 5,
    permissions: [{ resource: "standups", actions: ["read", "create"] }],
    icon: "CalendarCheck",
  },
  "/admin/projects/[id]/qa": {
    label: { vi: "QA", en: "QA" },
    minRoleLevel: 4,
    permissions: [{ resource: "tasks", actions: ["read"] }],
    icon: "Bug",
  },
  "/admin/projects/[id]/deployments": {
    label: { vi: "Deployments", en: "Deployments" },
    minRoleLevel: 2,
    permissions: [{ resource: "deployments", actions: ["read", "create", "update"] }],
    icon: "Rocket",
  },
  "/admin/projects/[id]/social": {
    label: { vi: "Social Posts", en: "Social Posts" },
    minRoleLevel: 3,
    permissions: [{ resource: "social-posts", actions: ["read", "create", "update"] }],
    icon: "Share2",
  },
  "/admin/projects/[id]/handover": {
    label: { vi: "Handover", en: "Handover" },
    minRoleLevel: 2,
    permissions: [{ resource: "handover", actions: ["read", "create"] }],
    icon: "FileCheck",
  },
  "/admin/my-tasks": {
    label: { vi: "Công việc của tôi", en: "My Tasks" },
    minRoleLevel: 5,
    permissions: [{ resource: "tasks", actions: ["read", "update"] }],
    icon: "CheckSquare",
  },
  "/admin/figma_demos": {
    label: { vi: "Figma Demos", en: "Figma Demos" },
    minRoleLevel: 3,
    permissions: [{ resource: "figma_demos", actions: ["read", "create", "update"] }],
    icon: "Figma",
  },
  "/admin/env-files": {
    label: { vi: "Env Files", en: "Env Files" },
    minRoleLevel: 2,
    permissions: [{ resource: "env-files", actions: ["read"] }],
    icon: "Lock",
  },
  "/admin/lp-awards": {
    label: { vi: "LP Awards", en: "LP Awards" },
    minRoleLevel: 2,
    permissions: [{ resource: "lp-awards", actions: ["read", "create", "approve", "reject"] }],
    icon: "Coins",
  },
  "/admin/blog-posts": {
    label: { vi: "Blog Posts", en: "Blog Posts" },
    minRoleLevel: 3,
    permissions: [{ resource: "blog-posts", actions: ["read", "create", "update", "delete"] }],
    icon: "FileText",
  },

  // ── EDU ────────────────────────────────────────────────────────────────
  "/admin/edu": {
    label: { vi: "Học vấn", en: "Education" },
    minRoleLevel: 2,
    permissions: [{ resource: "edu", actions: ["read"] }],
    icon: "GraduationCap",
  },
  "/admin/edu/instructors": {
    label: { vi: "Giảng viên", en: "Instructors" },
    minRoleLevel: 2,
    permissions: [{ resource: "edu", actions: ["read", "create", "update"] }],
    icon: "GraduationCap",
  },
  "/admin/edu/courses": {
    label: { vi: "Khóa học", en: "Courses" },
    minRoleLevel: 2,
    permissions: [{ resource: "edu", actions: ["read", "create", "update"] }],
    icon: "BookOpen",
  },
  "/admin/edu/enrollments": {
    label: { vi: "Ghi danh", en: "Enrollments" },
    minRoleLevel: 2,
    permissions: [{ resource: "edu", actions: ["read", "create", "update"] }],
    icon: "Users",
  },
  "/admin/edu/attendance": {
    label: { vi: "Điểm danh", en: "Attendance" },
    minRoleLevel: 5,
    permissions: [{ resource: "edu", actions: ["read", "update"] }],
    icon: "CheckSquare",
  },
  "/admin/edu/feedback": {
    label: { vi: "Phản hồi", en: "Feedback" },
    minRoleLevel: 2,
    permissions: [{ resource: "edu", actions: ["read", "update"] }],
    icon: "MessageCircle",
  },
};

// ─── Permission helpers ─────────────────────────────────────────────────────────

/**
 * Check if a user's role level is high enough to access a nav item.
 * Returns true for unknown paths (they'll be blocked by server auth).
 */
export function canAccessNav(userRole: string, navPath: string): boolean {
  const roleLevel = ROLE_LEVEL[userRole] ?? 99;
  const config = NAV_PERMISSIONS[navPath];

  if (!config) return true; // unknown nav = allow (server will block)

  if (config.minRoleLevel !== undefined && roleLevel <= config.minRoleLevel) {
    return true;
  }

  return false;
}

/**
 * Get the minimum role level required for a nav path.
 * Returns 0 (super_admin) for unknown paths.
 */
export function getNavMinLevel(navPath: string): number {
  return NAV_PERMISSIONS[navPath]?.minRoleLevel ?? 0;
}

/**
 * Get role display name in Vietnamese
 */
export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role]?.vi ?? role;
}

/**
 * Check if role is a known staff role (defined in ROLE_LEVEL)
 */
export function isStaffRole(role: string): boolean {
  return ROLE_LEVEL[role] !== undefined;
}

/**
 * Get the role level number
 */
export function getRoleLevel(role: string): number {
  return ROLE_LEVEL[role] ?? 99;
}

/**
 * Format role level as a label (e.g. "Cấp 1" / "Level 1")
 */
export function getRoleLevelLabel(level: number): { vi: string; en: string } {
  if (level <= 0) return { vi: "Quản trị tối cao", en: "Super Admin" };
  return { vi: `Cấp ${level}`, en: `Level ${level}` };
}

// ─── Department System (v4.0) ─────────────────────────────────────────────────

export interface Department {
  key: string;          // "engineering" | "design" | "media" | ...
  name: string;         // "Phòng Kỹ thuật"
  shortName: string;    // "IT"
  color: string;        // "#3B82F6"
}

export const DEPARTMENTS: Department[] = [
  { key: "engineering", name: "Phòng Kỹ thuật (IT)", shortName: "IT",    color: "#3B82F6" },
  { key: "design",      name: "Phòng Thiết kế",       shortName: "Design", color: "#8B5CF6" },
  { key: "media",       name: "Phòng Media",           shortName: "MDI",   color: "#EC4899" },
  { key: "marketing",   name: "Phòng Marketing",       shortName: "MKT",   color: "#F59E0B" },
  { key: "sales",       name: "Phòng Kinh doanh",      shortName: "SLS",   color: "#22C55E" },
  { key: "finance",     name: "Phòng Tài chính",       shortName: "FIN",   color: "#14B8A6" },
  { key: "hr",          name: "Phòng Nhân sự",         shortName: "HR",    color: "#6366F1" },
  { key: "management",  name: "Ban Quản lý",           shortName: "MGT",    color: "#EAB308" },
];

export const DEPT_COLORS: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map(d => [d.key, d.color])
);

// ─── Tab Permissions (v4.0) ────────────────────────────────────────────────────

/**
 * 28 admin tabs — each tab = 1 permission grant.
 * CEO assigns tab permissions to individual members.
 * ceo / super_admin / admin automatically get all tabs.
 * Special values: "*" = all tabs, dept_head bonus tabs.
 */
export type AdminTab =
  | "overview" | "orders" | "members" | "departments" | "projects"
  | "services" | "media" | "quotation" | "portfolio" | "projects_completed"
  | "academy" | "blog" | "revenue" | "clients" | "lp" | "lp_manage"
  | "income_tax" | "web_packages" | "effects" | "notification_center"
  | "settings" | "quests_events" | "leaderboard_admin" | "analytics"
  | "figma_demos" | "kanban" | "revenue_split" | "off_system_payments"
  | "*"; // wildcard: all tabs (ceo/super_admin/admin)

/** Baseline tab permissions per system role (CEO gán thêm/bớt sau đó) */
export const ROLE_BASE_TABS: Record<string, AdminTab[]> = {
  admin:            ["*"], // all tabs
  hr:               ["members", "departments", "overview", "notification_center", "quests_events", "academy", "lp_manage"],
  project_manager:  ["overview","orders","clients","quotation","services","revenue","projects","members","departments","notification_center","leaderboard_admin","lp_manage","quests_events","academy","blog","lp","portfolio","projects_completed"],
  media:            ["overview","media","blog","orders","projects","clients","academy","services","leaderboard_admin","quests_events","portfolio","revenue"],
  qa:               ["overview","projects","notification_center","orders","clients","members","academy","leaderboard_admin","lp"],
  member:           ["overview","notification_center","leaderboard_admin","academy","quests_events"],
  client:           [],
  guest:            [],
};

/** Automatic tab bonus when member belongs to a department */
export const DEPT_TAB_BONUS: Record<string, AdminTab[]> = {
  engineering: ["kanban", "lp"],
  design:     ["figma_demos", "portfolio"],
  media:      ["media", "blog"],
  marketing:  ["blog", "projects"],
  sales:      ["orders", "clients", "quotation", "revenue"],
  finance:    ["revenue", "lp", "lp_manage", "income_tax", "revenue_split", "off_system_payments"],
  hr:         ["members", "departments"],
  management: ["*"],
};

/** Dept head bonus permissions (bonus trên base role) */
export const DEPT_HEAD_BONUS: string[] = [
  "department_overview",
  "assign_tasks",
  "view_dept_lp",
];

/**
 * Check if a session user can access an admin tab.
 * Checks: ceo/super_admin/admin bypass, explicit tab grant, dept bonus.
 */
export function canAccessTab(
  tabPermissions: string[],
  departmentKey: string | null,
  isDeptHead: boolean,
  tabId: string,
): boolean {
  // ceo / super_admin / admin bypass
  if (tabPermissions.includes("*")) return true;

  // Explicit tab grant
  if (tabPermissions.includes(tabId)) return true;

  // Department bonus
  if (departmentKey && DEPT_TAB_BONUS[departmentKey]?.includes(tabId as AdminTab)) return true;

  // Dept head bonus
  if (isDeptHead && DEPT_HEAD_BONUS.includes(tabId as AdminTab)) return true;

  return false;
}

/** Build all accessible tabs for a user (for sidebar rendering) */
export function getAccessibleTabs(
  role: string,
  tabPermissions: string[],
  departmentKey: string | null,
  _isDeptHead: boolean,
): AdminTab[] {
  if (role === "ceo" || role === "super_admin" || role === "admin") return ["*"];

  const base = ROLE_BASE_TABS[role] ?? [];
  if (base.includes("*")) return ["*"];

  const deptBonus = departmentKey ? (DEPT_TAB_BONUS[departmentKey] ?? []) : [];
  const allTabs = [...new Set([...base, ...deptBonus])];
  return allTabs as AdminTab[];
}

// ─── Role Predicate Helpers ─────────────────────────────────────────────────────

/** Check if role is CEO */
export function isCeo(role: string): boolean {
  return role === "ceo";
}

/** Check if role is super_admin (level 0) */
export function isSuperAdminRole(role: string): boolean {
  return role === "super_admin";
}

/** Check if role is admin (level 0 or 1) */
export function isAdminRole(role: string): boolean {
  return role === "super_admin" || role === "admin";
}

/** Check if role is hr (level 2) */
export function isHRRole(role: string): boolean {
  return role === "hr";
}

/** Check if role is project_manager (level 3) */
export function isPMRole(role: string): boolean {
  return role === "project_manager";
}

/** Check if role is media (level 4) */
export function isMediaRole(role: string): boolean {
  return role === "media";
}

/** Check if role is qa (level 5) */
export function isQARole(role: string): boolean {
  return role === "qa";
}

/** Check if role is member (level 6) */
export function isMemberRole(role: string): boolean {
  return role === "member";
}

/**
 * Check if a role is a privileged system role (CEO or super_admin).
 * Used for operations that bypass normal permission checks.
 */
export function isPrivilegedRole(role: string): boolean {
  return role === "ceo" || role === "super_admin";
}

// ─── Default Access Tags per Role ───────────────────────────────────────────────

/**
 * Default access tags automatically granted to all members in each role.
 * CEO assigns additional tags individually during onboarding.
 * Tags "kanban" and "order-basic" are system defaults — cannot be revoked.
 */
export const DEFAULT_ACCESS_TAGS: Record<string, string[]> = {
  ceo: [],
  super_admin: ["kanban", "order-basic", "blog-post", "seo-content", "media-content", "order-manage", "salary", "lp-manage", "finance-view", "hr-manage"],
  admin: ["kanban", "order-basic", "blog-post", "seo-content", "media-content", "order-manage", "lp-manage"],
  hr:    ["kanban", "order-basic", "hr-manage", "members", "departments"],
  project_manager: ["kanban", "order-basic", "order-manage"],
  media: ["kanban", "order-basic", "blog-post", "media-content"],
  qa: ["kanban", "order-basic"],
  member: ["kanban", "order-basic"],
  client: [],
  guest: [],
};

// ─── Default Permissions per Role (static, DB can override) ────────────────────

/**
 * Static permission defaults per role.
 * These are embedded in tokens for fast edge checks.
 * DB-based Permission table takes precedence in requirePermission().
 */
export const DEFAULT_PERMISSIONS: Record<string, Array<{ resource: string; actions: string[] }>> = {
  ceo: [{ resource: "*", actions: ["*"] }],
  super_admin: [{ resource: "*", actions: ["*"] }],
  admin: [
    { resource: "team", actions: ["read", "create", "update", "delete"] },
    // P1-9 FIX: added orders:create and orders:delete (previously missing)
    { resource: "orders", actions: ["read", "create", "update", "delete", "approve"] },
    { resource: "lp-awards", actions: ["read", "create", "update", "approve"] },
    { resource: "lp-redemptions", actions: ["read", "update"] },
    { resource: "blog-posts", actions: ["read", "create", "update", "delete"] },
    { resource: "services", actions: ["read", "create", "update", "delete"] },
    { resource: "projects", actions: ["read", "create", "update"] },
    { resource: "edu", actions: ["read", "create", "update"] },
    { resource: "audit-log", actions: ["read", "export"] },
    { resource: "settings", actions: ["read", "update"] },
    { resource: "roles", actions: ["read", "create", "update", "delete"] },
  ],
  hr: [
    // HR: full member management (read/create/update) — no delete, no LP awards
    { resource: "team", actions: ["read", "create", "update"] },
    { resource: "departments", actions: ["read", "update"] },
    { resource: "lp-awards", actions: ["read"] },
    { resource: "edu", actions: ["read"] },
  ],
  project_manager: [
    // P1-9 FIX: added orders:create (previously missing — only read/update existed)
    { resource: "orders", actions: ["read", "create", "update"] },
    { resource: "quotes", actions: ["read", "create", "update"] },
    { resource: "clients", actions: ["read", "create", "update"] },
    { resource: "projects", actions: ["read", "create", "update"] },
    { resource: "figma_demos", actions: ["read", "create", "update"] },
    { resource: "lp-awards", actions: ["read", "create"] },
    { resource: "edu", actions: ["read"] },
  ],
  media: [
    { resource: "blog-posts", actions: ["read", "create", "update"] },
    { resource: "social-posts", actions: ["read", "create", "update"] },
    { resource: "edu", actions: ["read", "create", "update"] },
    { resource: "projects", actions: ["read"] },
    { resource: "orders", actions: ["read"] },
  ],
  qa: [
    { resource: "tasks", actions: ["read", "update"] },
    { resource: "standups", actions: ["read", "create"] },
    { resource: "projects", actions: ["read"] },
    { resource: "edu", actions: ["read"] },
  ],
  member: [
    { resource: "standups", actions: ["read", "create"] },
    { resource: "edu", actions: ["read"] },
    { resource: "tasks", actions: ["read", "update"] },
  ],
};

// ─── Middleware Path Helpers (Edge-compatible) ───────────────────────────────────

export const PUBLIC_PATHS = [
  "/api/auth/",
  "/api/admin/auth/",
  "/api/health",
  "/api/contact",
  "/api/search",
  "/api/services",
  "/api/projects",
  "/api/team",
  "/api/testimonials",
  "/api/pricing",
  "/api/v1/",
] as const;

export const PUBLIC_LOGIN_PATHS = [
  "/vi/dang-nhap",
  "/en/dang-nhap",
  "/ja/dang-nhap",
  "/ko/dang-nhap",
  "/zh/dang-nhap",
] as const;

/**
 * Check if a request path is public (no auth required at edge).
 */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
  if (PUBLIC_LOGIN_PATHS.some((p) => pathname.startsWith(p))) return true;
  return false;
}

/** Get minimum role level for an admin path (lower = more privileged) */
export function getRequiredLevel(pathname: string): number {
  const config = NAV_PERMISSIONS[pathname];
  if (config?.minRoleLevel !== undefined) return config.minRoleLevel;
  // Prefix match for dynamic paths like /admin/projects/[id]
  for (const [prefix, cfg] of Object.entries(NAV_PERMISSIONS)) {
    if (prefix.endsWith("/") && pathname.startsWith(prefix)) {
      return cfg.minRoleLevel ?? 5;
    }
  }
  return 5; // Default: any authenticated staff
}

/** Cookie key constants (used by middleware and auth routes) */
export const AUTH_COOKIES = {
  ACCESS_TOKEN: "auth-token",
  REFRESH_TOKEN: "refresh-token",
  AUTH_METHOD: "auth-method",
  LOGGED_IN: "auth-logged-in",
} as const;
