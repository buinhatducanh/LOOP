/**
 * Seed RBAC — Full role + permission bootstrap.
 * POST /api/admin/auth/seed-roles
 *
 * Run this once after schema migration to set up all system roles
 * and their granular permissions.
 *
 * Permission matrix:
 *  Role             │ Dashboard │ Content │ Orders │ System │ Notes
 * ──────────────────┼───────────┼─────────┼────────┼────────┼────────────────────
 *  CEO              │ ✓ all     │ ✓ all   │ ✓ all  │ ✓ all  │ Full wildcard
 *  super_admin      │ ✓ all     │ ✓ all   │ ✓ all  │ ✓ all  │ Full wildcard
 *  admin            │ read      │ CRUD    │ read   │ read+  │ No role/user delete
 *  project_manager  │ read      │ CRUD*   │ read+  │ —      │ Own team + projects
 *  media            │ read      │ CRU     │ —      │ —      │ Content only
 *  qa               │ read      │ RU      │ —      │ —      │ Read + approve tests
 *  member           │ read      │ —       │ —      │ —      │ Dashboard only
 *
 * Resource mapping to admin paths:
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
 *   service-attributes → /admin/service-attributes
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
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMinRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

// ─── Role definitions ──────────────────────────────────────────────────────────

const ROLE_DEFS = [
  { name: "ceo",            displayName: "CEO / Founder",      level: -1, isSystem: true, color: "yellow" },
  { name: "super_admin",    displayName: "Quản trị tối cao",   level:  0, isSystem: true, color: "red"    },
  { name: "admin",         displayName: "Quản trị viên",      level:  1, isSystem: true, color: "indigo" },
  { name: "project_manager",displayName: "Trưởng nhóm / PM",   level:  2, isSystem: true, color: "amber"  },
  { name: "media",          displayName: "Media / Marketing",  level:  3, isSystem: true, color: "pink"   },
  { name: "qa",             displayName: "QA / Tester",        level:  4, isSystem: true, color: "cyan"   },
  { name: "member",         displayName: "Thành viên",         level:  5, isSystem: true, color: "slate"  },
];

// ─── Permission matrix ──────────────────────────────────────────────────────────

const PERMISSIONS: Array<{ role: string; resource: string; action: string }> = [
  // ── CEO: Full wildcard ──────────────────────────────────────────────────────
  { role: "ceo",         resource: "*",             action: "*"         },

  // ── Super Admin: Full wildcard ──────────────────────────────────────────────
  { role: "super_admin", resource: "*",             action: "*"         },

  // ── Admin: Full content + sales access, limited system ─────────────────────
  // Dashboard
  { role: "admin", resource: "dashboard",         action: "read"       },
  // Content
  { role: "admin", resource: "home-sliders",       action: "create"     },
  { role: "admin", resource: "home-sliders",       action: "read"       },
  { role: "admin", resource: "home-sliders",       action: "update"     },
  { role: "admin", resource: "home-sliders",       action: "delete"     },
  { role: "admin", resource: "landing-pages",       action: "create"     },
  { role: "admin", resource: "landing-pages",       action: "read"       },
  { role: "admin", resource: "landing-pages",       action: "update"     },
  { role: "admin", resource: "landing-pages",       action: "delete"     },
  { role: "admin", resource: "services",            action: "create"     },
  { role: "admin", resource: "services",            action: "read"       },
  { role: "admin", resource: "services",            action: "update"     },
  { role: "admin", resource: "services",            action: "delete"     },
  { role: "admin", resource: "projects",            action: "create"     },
  { role: "admin", resource: "projects",            action: "read"       },
  { role: "admin", resource: "projects",            action: "update"     },
  { role: "admin", resource: "projects",            action: "delete"     },
  { role: "admin", resource: "team",               action: "create"     },
  { role: "admin", resource: "team",               action: "read"       },
  { role: "admin", resource: "team",               action: "update"     },
  { role: "admin", resource: "team",               action: "delete"     },
  { role: "admin", resource: "expertises",         action: "create"     },
  { role: "admin", resource: "expertises",         action: "read"       },
  { role: "admin", resource: "expertises",         action: "update"     },
  { role: "admin", resource: "expertises",         action: "delete"     },
  { role: "admin", resource: "testimonials",       action: "create"     },
  { role: "admin", resource: "testimonials",       action: "read"       },
  { role: "admin", resource: "testimonials",       action: "update"     },
  { role: "admin", resource: "testimonials",       action: "delete"     },
  { role: "admin", resource: "messages",           action: "read"       },
  { role: "admin", resource: "messages",           action: "update"     },
  { role: "admin", resource: "messages",           action: "delete"     },
  // Sales
  { role: "admin", resource: "orders",             action: "read"       },
  { role: "admin", resource: "orders",             action: "update"     },
  { role: "admin", resource: "orders",             action: "approve"    },
  { role: "admin", resource: "web-templates",      action: "create"     },
  { role: "admin", resource: "web-templates",      action: "read"       },
  { role: "admin", resource: "web-templates",      action: "update"     },
  { role: "admin", resource: "web-templates",      action: "delete"     },
  { role: "admin", resource: "service-attributes", action: "create"     },
  { role: "admin", resource: "service-attributes", action: "read"       },
  { role: "admin", resource: "service-attributes", action: "update"     },
  { role: "admin", resource: "service-attributes", action: "delete"     },
  { role: "admin", resource: "addon-services",     action: "create"     },
  { role: "admin", resource: "addon-services",     action: "read"       },
  { role: "admin", resource: "addon-services",     action: "update"     },
  { role: "admin", resource: "addon-services",     action: "delete"     },
  { role: "admin", resource: "reward-tiers",       action: "create"     },
  { role: "admin", resource: "reward-tiers",       action: "read"       },
  { role: "admin", resource: "reward-tiers",       action: "update"     },
  { role: "admin", resource: "reward-tiers",       action: "delete"     },
  { role: "admin", resource: "packages",           action: "read"       },
  { role: "admin", resource: "packages",           action: "create"     },
  { role: "admin", resource: "packages",           action: "update"     },
  { role: "admin", resource: "packages",           action: "delete"     },
  { role: "admin", resource: "pricing-features",   action: "read"       },
  { role: "admin", resource: "pricing-features",   action: "create"     },
  { role: "admin", resource: "pricing-features",   action: "update"     },
  { role: "admin", resource: "pricing-features",   action: "delete"     },
  { role: "admin", resource: "quote-requests",     action: "read"       },
  { role: "admin", resource: "quote-requests",     action: "update"     },
  { role: "admin", resource: "quote-requests",     action: "approve"    },
  { role: "admin", resource: "websites",            action: "read"       },
  { role: "admin", resource: "websites",            action: "update"     },
  // System (read + limited write, no role deletion for safety)
  { role: "admin", resource: "users",              action: "read"       },
  { role: "admin", resource: "users",              action: "create"     },
  { role: "admin", resource: "users",              action: "update"     },
  { role: "admin", resource: "roles",              action: "read"       },
  { role: "admin", resource: "audit-log",          action: "read"       },
  { role: "admin", resource: "audit-log",           action: "export"     },
  { role: "admin", resource: "settings",           action: "read"       },
  { role: "admin", resource: "settings",           action: "update"     },
  { role: "admin", resource: "points",             action: "read"       },
  { role: "admin", resource: "points",             action: "update"     },

  // ── Project Manager: Projects + team management ─────────────────────────────
  { role: "project_manager", resource: "dashboard",         action: "read"       },
  { role: "project_manager", resource: "projects",         action: "create"     },
  { role: "project_manager", resource: "projects",         action: "read"       },
  { role: "project_manager", resource: "projects",         action: "update"     },
  { role: "project_manager", resource: "team",              action: "read"       },
  { role: "project_manager", resource: "team",              action: "update"     },
  { role: "project_manager", resource: "services",          action: "read"       },
  { role: "project_manager", resource: "home-sliders",      action: "read"       },
  { role: "project_manager", resource: "landing-pages",     action: "read"       },
  { role: "project_manager", resource: "expertises",       action: "read"       },
  { role: "project_manager", resource: "orders",           action: "read"       },
  { role: "project_manager", resource: "orders",           action: "update"     },
  { role: "project_manager", resource: "quote-requests",   action: "read"       },
  { role: "project_manager", resource: "websites",          action: "read"       },

  // ── Media / Marketing: Content creation + marketing ─────────────────────────
  { role: "media", resource: "dashboard",         action: "read"       },
  { role: "media", resource: "home-sliders",      action: "create"     },
  { role: "media", resource: "home-sliders",      action: "read"       },
  { role: "media", resource: "home-sliders",      action: "update"     },
  { role: "media", resource: "landing-pages",     action: "create"     },
  { role: "media", resource: "landing-pages",     action: "read"       },
  { role: "media", resource: "landing-pages",     action: "update"     },
  { role: "media", resource: "services",          action: "read"       },
  { role: "media", resource: "services",          action: "update"     },
  { role: "media", resource: "projects",          action: "read"       },
  { role: "media", resource: "projects",          action: "update"     },
  { role: "media", resource: "expertises",        action: "read"       },
  { role: "media", resource: "testimonials",      action: "read"       },
  { role: "media", resource: "testimonials",      action: "create"     },
  { role: "media", resource: "testimonials",      action: "update"     },
  { role: "media", resource: "messages",          action: "read"       },

  // ── QA: Read + update content, approve ────────────────────────────────────
  { role: "qa", resource: "dashboard",     action: "read"  },
  { role: "qa", resource: "home-sliders",  action: "read"  },
  { role: "qa", resource: "home-sliders",  action: "update" },
  { role: "qa", resource: "landing-pages", action: "read"  },
  { role: "qa", resource: "landing-pages", action: "update" },
  { role: "qa", resource: "services",      action: "read"  },
  { role: "qa", resource: "services",      action: "update" },
  { role: "qa", resource: "projects",      action: "read"  },
  { role: "qa", resource: "projects",      action: "update" },
  { role: "qa", resource: "expertises",    action: "read"  },
  { role: "qa", resource: "testimonials",   action: "read"  },
  { role: "qa", resource: "messages",      action: "read"  },
  { role: "qa", resource: "messages",      action: "update" },
  { role: "qa", resource: "orders",        action: "read"  },
  { role: "qa", resource: "orders",        action: "approve" },

  // EDU permissions (PM: CRUD, QA/Member: read-only)
  { role: "project_manager", resource: "edu", action: "read"  },
  { role: "project_manager", resource: "edu", action: "create" },
  { role: "project_manager", resource: "edu", action: "update" },
  { role: "project_manager", resource: "edu", action: "delete" },
  { role: "qa",        resource: "edu", action: "read" },
  { role: "member",    resource: "edu", action: "read" },

  // ── Member: Dashboard only (read) ───────────────────────────────────────────
  { role: "member", resource: "dashboard", action: "read" },
];

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST() {
  try {
    // Only super_admin (level 0) can reset the entire RBAC system.
    // requireAuth() alone is insufficient — any authenticated user would qualify.
    await requireMinRole(0);

    // 1. Upsert all system roles
    const roleIds: Record<string, string> = {};
    for (const def of ROLE_DEFS) {
      const role = await prisma.role.upsert({
        where: { name: def.name },
        update: {
          displayName: def.displayName,
          level: def.level,
          isSystem: def.isSystem,
          color: def.color,
        },
        create: {
          name: def.name,
          displayName: def.displayName,
          level: def.level,
          isSystem: def.isSystem,
          color: def.color,
        },
      });
      roleIds[def.name] = role.id;
    }

    // 2. Clear existing permissions for system roles
    const systemRoleIds = Object.values(roleIds);
    await prisma.permission.deleteMany({
      where: { roleId: { in: systemRoleIds } },
    });

    // 3. Insert fresh permissions
    const permData = PERMISSIONS.filter((p) => roleIds[p.role]).map((p) => ({
      roleId: roleIds[p.role],
      resource: p.resource,
      action: p.action,
      scope: "all",
    }));

    if (permData.length > 0) {
      await prisma.permission.createMany({ data: permData });
    }

    // 4. Re-fetch to get permission count per role
    const roles = await prisma.role.findMany({
      where: { name: { in: Object.keys(roleIds) } },
      include: { _count: { select: { permissions: true } } },
      orderBy: { level: "asc" },
    });

    return NextResponse.json({
      message: "Roles & permissions seeded successfully",
      roles: roles.map((r) => ({
        name: r.name,
        displayName: r.displayName,
        level: r.level,
        permissionCount: r._count.permissions,
      })),
    });
  } catch (error) {
    // Use handleError — avoid manual status code classification which
    // misroutes third-party errors with common message strings.
    const { handleError } = await import("@/lib/api/response");
    return handleError(error);
  }
}

export async function GET() {
  // Only super_admin (level 0) can see the full RBAC blueprint.
  // Public exposure leaks role names, levels, and user counts.
  await requireMinRole(0);
  const roles = await prisma.role.findMany({
    select: {
      name: true,
      displayName: true,
      level: true,
      isSystem: true,
      _count: { select: { permissions: true, users: true } },
    },
    orderBy: { level: "asc" },
  });

  return NextResponse.json({ data: roles });
}
