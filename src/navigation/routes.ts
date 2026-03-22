/**
 * Navigation Route Registry — Source of Truth
 *
 * All routes in the application are defined here as a single source of truth.
 * Adding a route = add one entry. Navigation utilities and middleware
 * automatically stay in sync.
 *
 * Role hierarchy (lower = more powerful):
 *   ceo(-1) > super_admin(0) > admin(1) > project_manager(2) >
 *   media(3) > qa(4) > member(5)
 *
 * Access rule: userRoleLevel <= minRoleLevel → ALLOWED
 *   e.g. admin(1) can access routes with minRoleLevel=1 or 2 (less privileged)
 */

import { routing } from "@/i18n/routing";

// ─── Role Level ────────────────────────────────────────────────────────────────

export const ROLE_LEVEL: Record<string, number> = {
  ceo: -1,
  super_admin: 0,
  admin: 1,
  project_manager: 2,
  media: 3,
  qa: 4,
  member: 5,
};

export type RoleKey = keyof typeof ROLE_LEVEL;
export type RoleLevelValue = (typeof ROLE_LEVEL)[keyof typeof ROLE_LEVEL];

// ─── Admin Nav Groups ─────────────────────────────────────────────────────────

export type AdminNavGroup = "content" | "sales" | "system";

// ─── Route Scope ───────────────────────────────────────────────────────────────

export type RouteScope = "public" | "auth" | "admin";

// ─── Route Config ─────────────────────────────────────────────────────────────

export interface RouteConfig {
  /** Absolute path (no locale prefix for admin routes) */
  path: string;
  /** Route scope */
  scope: RouteScope;
  /** Minimum role level for admin routes */
  minRoleLevel?: number;
  /** i18n label key (matches translation files) */
  labelKey: string;
  /** Lucide icon name */
  icon?: string;
  /** Nav group (determines sidebar section) */
  navGroup?: AdminNavGroup;
}

export interface AdminRouteConfig extends RouteConfig {
  scope: "admin";
  minRoleLevel: number;
}

// ─── Admin Routes Registry ────────────────────────────────────────────────────
// All admin routes must be registered here.
// Route configs are consumed by: sidebar, middleware, guards.

export const ADMIN_ROUTES = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboard: {
    path: "/admin",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.member,
    labelKey: "nav.admin.dashboard",
    icon: "LayoutDashboard",
    navGroup: undefined,
  },
  "access-denied": {
    path: "/admin/access-denied",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.member,
    labelKey: "nav.admin.accessDenied",
    icon: "Lock",
    navGroup: undefined,
  },

  // ── Content ─────────────────────────────────────────────────────────────
  "content/home-sliders": {
    path: "/admin/content/home-sliders",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    labelKey: "nav.admin.content.homeSliders",
    icon: "Image",
    navGroup: "content" as AdminNavGroup,
  },
  "content/landing-pages": {
    path: "/admin/content/landing-pages",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    labelKey: "nav.admin.content.landingPages",
    icon: "LayoutTemplate",
    navGroup: "content" as AdminNavGroup,
  },
  "content/services": {
    path: "/admin/content/services",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.content.services",
    icon: "Globe",
    navGroup: "content" as AdminNavGroup,
  },
  "content/expertises": {
    path: "/admin/content/expertises",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.content.expertises",
    icon: "Wrench",
    navGroup: "content" as AdminNavGroup,
  },
  "content/team": {
    path: "/admin/content/team",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    labelKey: "nav.admin.content.team",
    icon: "UsersRound",
    navGroup: "content" as AdminNavGroup,
  },
  "content/projects": {
    path: "/admin/content/projects",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    labelKey: "nav.admin.content.projects",
    icon: "FolderKanban",
    navGroup: "content" as AdminNavGroup,
  },
  "content/testimonials": {
    path: "/admin/content/testimonials",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    labelKey: "nav.admin.content.testimonials",
    icon: "Star",
    navGroup: "content" as AdminNavGroup,
  },
  "content/messages": {
    path: "/admin/content/messages",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.member,
    labelKey: "nav.admin.content.messages",
    icon: "MessageSquare",
    navGroup: "content" as AdminNavGroup,
  },

  // ── Sales ────────────────────────────────────────────────────────────────
  "sales/orders": {
    path: "/admin/sales/orders",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    labelKey: "nav.admin.sales.orders",
    icon: "ShoppingCart",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/web-templates": {
    path: "/admin/sales/web-templates",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.webTemplates",
    icon: "Layout",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/service-attributes": {
    path: "/admin/sales/service-attributes",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.serviceAttributes",
    icon: "Tag",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/addon-services": {
    path: "/admin/sales/addon-services",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.addonServices",
    icon: "Puzzle",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/reward-tiers": {
    path: "/admin/sales/reward-tiers",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.rewardTiers",
    icon: "Gift",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/packages": {
    path: "/admin/sales/packages",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.packages",
    icon: "Package",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/hosting-plans": {
    path: "/admin/sales/hosting-plans",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.hostingPlans",
    icon: "Server",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/domain-prices": {
    path: "/admin/sales/domain-prices",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.domainPrices",
    icon: "Globe",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/deployment-items": {
    path: "/admin/sales/deployment-items",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.deploymentItems",
    icon: "FileText",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/pricing-features": {
    path: "/admin/sales/pricing-features",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.sales.pricingFeatures",
    icon: "Calculator",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/quote-requests": {
    path: "/admin/sales/quote-requests",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    labelKey: "nav.admin.sales.quoteRequests",
    icon: "FileQuestion",
    navGroup: "sales" as AdminNavGroup,
  },

  // ── System ──────────────────────────────────────────────────────────────
  "system/staff-users": {
    path: "/admin/system/staff-users",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    labelKey: "nav.admin.system.staffUsers",
    icon: "Users",
    navGroup: "system" as AdminNavGroup,
  },
  "system/roles": {
    path: "/admin/system/roles",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    labelKey: "nav.admin.system.roles",
    icon: "ShieldCheck",
    navGroup: "system" as AdminNavGroup,
  },
  "system/points": {
    path: "/admin/system/points",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    labelKey: "nav.admin.system.points",
    icon: "Coins",
    navGroup: "system" as AdminNavGroup,
  },
  "system/websites": {
    path: "/admin/system/websites",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    labelKey: "nav.admin.system.websites",
    icon: "Monitor",
    navGroup: "system" as AdminNavGroup,
  },
  "system/audit-log": {
    path: "/admin/system/audit-log",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    labelKey: "nav.admin.system.auditLog",
    icon: "ClipboardList",
    navGroup: "system" as AdminNavGroup,
  },
  "system/settings": {
    path: "/admin/system/settings",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    labelKey: "nav.admin.system.settings",
    icon: "Settings",
    navGroup: "system" as AdminNavGroup,
  },
} as const satisfies Record<string, AdminRouteConfig>;

// ─── All admin route path → key map ─────────────────────────────────────────

/** Fast O(1) lookup: path → route key */
export const ADMIN_PATH_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(ADMIN_ROUTES).map(([key, config]) => [config.path, key])
);

// ─── Public Auth Routes ───────────────────────────────────────────────────────

export const AUTH_ROUTES = ["/account"] as const;

/** Paths that should NOT redirect to login when authenticated */
export const PUBLIC_ROUTE_PATHS = [
  "/login",
  "/register",
  ...routing.locales.map((l) => `/${l}`),
  ...routing.locales.flatMap((l) => [
    `/${l}/login`,
    `/${l}/register`,
    `/${l}/about`,
    `/${l}/services`,
    `/${l}/portfolio`,
    `/${l}/pricing`,
    `/${l}/contact`,
    `/${l}/team-list`,
    `/${l}/blog`,
  ]),
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get admin route config by path.
 * Returns undefined for unknown paths (server guard will handle).
 */
export function getAdminRouteConfig(path: string): AdminRouteConfig | undefined {
  const key = ADMIN_PATH_TO_KEY[path];
  if (key) return (ADMIN_ROUTES as Record<string, AdminRouteConfig>)[key];

  // Prefix match: /admin/content/services → /admin/content/services
  for (const [, config] of Object.entries(ADMIN_ROUTES)) {
    if (config.path !== "/admin" && path.startsWith(config.path + "/")) {
      return config;
    }
  }

  // Fallback to dashboard for /admin/*
  if (path.startsWith("/admin")) {
    return ADMIN_ROUTES.dashboard;
  }

  return undefined;
}

/**
 * Filter admin routes accessible to a user.
 * Used by sidebar to show only permitted nav items.
 */
export function filterAccessibleAdminRoutes(userRoleLevel: number): AdminRouteConfig[] {
  return Object.values(ADMIN_ROUTES).filter(
    (route) => userRoleLevel <= route.minRoleLevel
  );
}

/**
 * Group filtered routes by nav group.
 * Used by sidebar to render grouped navigation.
 */
export function groupAdminRoutesByNavGroup(
  routes: AdminRouteConfig[]
): Record<AdminNavGroup, AdminRouteConfig[]> {
  return routes.reduce(
    (acc, route) => {
      if (route.navGroup) {
        acc[route.navGroup].push(route);
      }
      return acc;
    },
    { content: [], sales: [], system: [] } as Record<AdminNavGroup, AdminRouteConfig[]>
  );
}
