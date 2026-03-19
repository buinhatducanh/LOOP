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
 * Permission resources map to admin routes:
 *   dashboard        → /admin
 *   home-sliders     → /admin/home-sliders
 *   landing-pages    → /admin/landing-pages
 *   services         → /admin/services
 *   projects         → /admin/projects
 *   team             → /admin/team
 *   expertises       → /admin/expertises
 *   testimonials     → /admin/testimonials
 *   messages         → /admin/messages
 *   orders           → /admin/orders
 *   web-templates    → /admin/web-templates
 *   service-attrs    → /admin/service-attributes
 *   addon-services   → /admin/addon-services
 *   reward-tiers     → /admin/reward-tiers
 *   packages         → /admin/packages
 *   pricing-features → /admin/pricing-features
 *   quote-requests   → /admin/quote-requests
 *   users            → /admin/users
 *   roles            → /admin/roles
 *   audit-log        → /admin/audit-log
 *   settings         → /admin/settings
 *   websites         → /admin/websites
 *   points           → /admin/points
 *   content          → aggregate for content-only roles (home-sliders + landing-pages + services + projects + team + expertises + testimonials)
 */

// ─── Role Definitions ──────────────────────────────────────────────────────────

export const ROLE_LEVEL: Record<string, number> = {
  // Special
  ceo: -1,
  super_admin: 0,
  // Staff
  admin: 1,
  project_manager: 2,
  media: 3,
  qa: 4,
  member: 5,
};

export const ROLE_DISPLAY_NAMES: Record<string, { vi: string; en: string }> = {
  ceo: { vi: "CEO / Founder", en: "CEO / Founder" },
  super_admin: { vi: "Quản trị tối cao", en: "Super Admin" },
  admin: { vi: "Quản trị viên", en: "Administrator" },
  project_manager: { vi: "Trưởng nhóm / PM", en: "Project Manager" },
  media: { vi: "Media / Marketing", en: "Media" },
  qa: { vi: "QA / Tester", en: "QA / Tester" },
  member: { vi: "Thành viên", en: "Member" },
};

export const ROLE_COLORS: Record<string, string> = {
  ceo: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  super_admin: "text-red-400 bg-red-500/15 border-red-500/30",
  admin: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
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
  { name: "project_manager", level: 2 },
  { name: "media", level: 3 },
  { name: "qa", level: 4 },
  { name: "member", level: 5 },
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
  "/admin/home-sliders": {
    label: { vi: "Trang chủ (Slider)", en: "Home Sliders" },
    minRoleLevel: 2,
    permissions: [{ resource: "home-sliders", actions: ["read", "create", "update", "delete"] }],
    icon: "Image",
  },
  "/admin/landing-pages": {
    label: { vi: "Landing Pages", en: "Landing Pages" },
    minRoleLevel: 2,
    permissions: [{ resource: "landing-pages", actions: ["read", "create", "update", "delete"] }],
    icon: "LayoutTemplate",
  },
  "/admin/services": {
    label: { vi: "Dịch vụ", en: "Services" },
    minRoleLevel: 2,
    permissions: [{ resource: "services", actions: ["read", "create", "update", "delete"] }],
    icon: "Globe",
  },
  "/admin/projects": {
    label: { vi: "Dự án", en: "Projects" },
    minRoleLevel: 3,
    permissions: [{ resource: "projects", actions: ["read", "create", "update", "delete"] }],
    icon: "FolderKanban",
  },
  "/admin/team": {
    label: { vi: "Đội ngũ", en: "Team" },
    minRoleLevel: 1,
    permissions: [{ resource: "team", actions: ["read", "create", "update", "delete"] }],
    icon: "UsersRound",
  },
  "/admin/expertises": {
    label: { vi: "Kỹ năng", en: "Expertises" },
    minRoleLevel: 2,
    permissions: [{ resource: "expertises", actions: ["read", "create", "update", "delete"] }],
    icon: "Wrench",
  },
  "/admin/testimonials": {
    label: { vi: "Đánh giá", en: "Testimonials" },
    minRoleLevel: 3,
    permissions: [{ resource: "testimonials", actions: ["read", "create", "update", "delete"] }],
    icon: "Star",
  },

  // ── Kinh doanh ─────────────────────────────────────────────────────────────
  "/admin/orders": {
    label: { vi: "Đơn hàng", en: "Orders" },
    minRoleLevel: 3,
    permissions: [{ resource: "orders", actions: ["read", "update", "approve"] }],
    icon: "ShoppingCart",
  },
  "/admin/web-templates": {
    label: { vi: "Kho Giao Diện", en: "Web Templates" },
    minRoleLevel: 2,
    permissions: [{ resource: "web-templates", actions: ["read", "create", "update", "delete"] }],
    icon: "Layout",
  },
  "/admin/service-attributes": {
    label: { vi: "Kho Tính Năng", en: "Service Attributes" },
    minRoleLevel: 2,
    permissions: [{ resource: "service-attributes", actions: ["read", "create", "update", "delete"] }],
    icon: "Tag",
  },
  "/admin/addon-services": {
    label: { vi: "Dịch vụ Rời", en: "Addon Services" },
    minRoleLevel: 2,
    permissions: [{ resource: "addon-services", actions: ["read", "create", "update", "delete"] }],
    icon: "Puzzle",
  },
  "/admin/reward-tiers": {
    label: { vi: "XP & Rewards", en: "XP & Rewards" },
    minRoleLevel: 2,
    permissions: [{ resource: "reward-tiers", actions: ["read", "create", "update", "delete"] }],
    icon: "Gift",
  },
  "/admin/packages": {
    label: { vi: "Gói dịch vụ", en: "Service Packages" },
    minRoleLevel: 2,
    permissions: [{ resource: "packages", actions: ["read", "create", "update", "delete"] }],
    icon: "Package",
  },
  "/admin/pricing-features": {
    label: { vi: "Báo giá tính năng", en: "Pricing Features" },
    minRoleLevel: 2,
    permissions: [{ resource: "pricing-features", actions: ["read", "create", "update", "delete"] }],
    icon: "Calculator",
  },
  "/admin/quote-requests": {
    label: { vi: "Yêu cầu báo giá", en: "Quote Requests" },
    minRoleLevel: 3,
    permissions: [{ resource: "quote-requests", actions: ["read", "update", "approve"] }],
    icon: "FileQuestion",
  },
  "/admin/messages": {
    label: { vi: "Tin nhắn", en: "Messages" },
    minRoleLevel: 4,
    permissions: [{ resource: "messages", actions: ["read", "update", "delete"] }],
    icon: "MessageSquare",
  },

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  "/admin/users": {
    label: { vi: "Người dùng", en: "Users" },
    minRoleLevel: 1,
    permissions: [{ resource: "users", actions: ["read", "create", "update", "delete"] }],
    icon: "Users",
  },
  "/admin/roles": {
    label: { vi: "Phân quyền", en: "Roles" },
    minRoleLevel: 1,
    permissions: [{ resource: "roles", actions: ["read", "create", "update", "delete"] }],
    icon: "ShieldCheck",
  },
  "/admin/audit-log": {
    label: { vi: "Nhật ký", en: "Audit Log" },
    minRoleLevel: 1,
    permissions: [{ resource: "audit-log", actions: ["read", "export"] }],
    icon: "ClipboardList",
  },
  "/admin/settings": {
    label: { vi: "Cài đặt", en: "Settings" },
    minRoleLevel: 1,
    permissions: [{ resource: "settings", actions: ["read", "update"] }],
    icon: "Settings",
  },
  "/admin/websites": {
    label: { vi: "Websites", en: "Websites" },
    minRoleLevel: 3,
    permissions: [{ resource: "websites", actions: ["read", "update"] }],
    icon: "Globe",
  },
  "/admin/points": {
    label: { vi: "Điểm thưởng", en: "Points" },
    minRoleLevel: 2,
    permissions: [{ resource: "points", actions: ["read", "update"] }],
    icon: "Star",
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
