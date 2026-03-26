# Permission Matrix

> **Reference:** `src/lib/auth/roles.ts` + `src/lib/auth/permissions.ts`
> **Updated:** 2026-03-26

---

## Role Hierarchy

```
CEO (-1) → SUPER_ADMIN (0) → ADMIN (1) → PROJECT_MANAGER (2) → MEDIA (3) → QA (4) → MEMBER (5)
```

Higher roles always inherit lower role permissions.

| Level | Role | Display (VI) | Notes |
|-------|------|-------------|-------|
| -1 | CEO | CEO / Founder | Full access |
| 0 | super_admin | Quản trị tối cao | Full access, manages roles |
| 1 | admin | Quản trị viên | Content + system management |
| 2 | project_manager | Trưởng nhóm / PM | Project & team management |
| 3 | media | Media / Marketing | Social, blog, testimonials |
| 4 | qa | QA / Tester | QA tasks, bug notes |
| 5 | member | Thành viên | Basic access (standups, own tasks) |

---

## Permission Model

Each role has **granular permissions** stored in DB:

```typescript
{
  resource: string;  // e.g. "orders", "tasks"
  action: string;    // "create" | "read" | "update" | "delete" | "export" | "approve"
  scope: string;     // "all" | "own" | comma-separated IDs
}
```

### Wildcard (Super Admin Bypass)

`super_admin` has `resource: "*", action: "*"` — bypasses ALL permission checks.

### Permission Actions

| Action | Description |
|--------|-------------|
| `create` | Create new records |
| `read` | View records |
| `update` | Modify existing records |
| `delete` | Remove records |
| `export` | Export data (CSV, PDF) |
| `approve` | Approve/reject records (quotes, LP awards, etc.) |

---

## Role × Resource × Action Matrix

| Resource | admin | project_manager | media | qa | member |
|----------|-------|----------------|-------|----|--------|
| **Dashboard** | read | read | read | read | read |
| **Content** ||||||
| `home-sliders` | CRUD | CRUD | — | — | — |
| `landing-pages` | CRUD | CRUD | — | — | — |
| `services` | CRUD | CRUD | — | — | — |
| `projects` | CRUD | CRUD | CRUD | — | — |
| `team` | CRUD | CRUD | — | — | — |
| `expertises` | CRUD | CRUD | — | — | — |
| `testimonials` | CRUD | CRUD | CRUD | — | — |
| `messages` | read/update/del | — | — | — | — |
| `blog-posts` | CRUD | CRUD | CRUD | — | — |
| **Sales** ||||||
| `orders` | read/update/approve | read/update | — | — | — |
| `web-templates` | CRUD | CRUD | — | — | — |
| `service-attributes` | CRUD | CRUD | — | — | — |
| `addon-services` | CRUD | CRUD | — | — | — |
| `reward-tiers` | CRUD | read | — | — | — |
| `packages` | CRUD | CRUD | — | — | — |
| `hosting-plans` | CRUD | CRUD | — | — | — |
| `domain-prices` | CRUD | CRUD | — | — | — |
| `deployment-items` | CRUD | CRUD | — | — | — |
| `pricing-features` | CRUD | CRUD | — | — | — |
| `quote-requests` | read/update/approve | read/update | — | — | — |
| `sales-leads` | CRUD | CRUD | — | — | — |
| `quotes` | CRUD | CRUD | — | — | — |
| `customer-points` | read/update | read/update | — | — | — |
| `lp-redemptions` | read/update | read/update | — | — | — |
| **JIRA-like PM** ||||||
| `projects` | CRUD | CRUD/read/update | — | — | — |
| `backlogs` | CRUD | CRUD | — | — | — |
| `tasks` | CRUD | CRUD | — | read | read/update (own) |
| `bug-notes` | CRUD | CRUD | — | CRUD | — |
| `figma-demos` | CRUD | CRUD | CRUD | — | — |
| `env-files` | CRUD | read | — | — | — |
| `git-commits` | read | read | — | — | — |
| `deployments` | CRUD | CRUD | — | — | — |
| `social-posts` | CRUD | CRUD | CRUD | — | — |
| `handover` | read/create | read/create | — | — | — |
| `standups` | CRUD | CRUD | — | — | CRUD (create own) |
| `lp-awards` | CRUD + approve/reject | read/approve/reject | — | — | — |
| **System** ||||||
| `users` | CRUD | — | — | — | — |
| `roles` | CRUD | — | — | — | — |
| `audit-log` | read/export | — | — | — | — |
| `settings` | read/update | — | — | — | — |
| `websites` | CRUD | read/update | — | — | — |
| `points` | CRUD | CRUD | — | — | — |
| **Education** ||||||
| `edu` | read | read | — | — | — |
| `edu-instructors` | CRUD | CRUD | — | — | — |
| `edu-courses` | CRUD | CRUD | — | — | — |
| `edu-enrollments` | CRUD | CRUD | — | — | — |
| `edu-attendance` | CRUD | — | — | — | CRUD (own) |
| `edu-feedback` | read/update | read/update | — | — | — |

---

## Navigation Access (minRoleLevel)

| Admin Path | minRoleLevel | VI Label |
|------------|-------------|---------|
| `/admin` (dashboard) | 5 (all staff) | Dashboard |
| `/admin/content/team` | 1 (admin+) | Đội ngũ |
| `/admin/content/services` | 2 (PM+) | Dịch vụ |
| `/admin/content/projects` | 3 (media+) | Dự án |
| `/admin/content/messages` | 4 (QA+) | Tin nhắn |
| `/admin/system/staff-users` | 1 (admin+) | Người dùng |
| `/admin/system/roles` | 1 (admin+) | Phân quyền |
| `/admin/projects/[id]/qa` | 4 (QA+) | QA |
| `/admin/projects/[id]/standups` | 5 (member+) | Standups |

---

## Code Usage

### Check Permission in API Route

```typescript
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const session = await requirePermission("orders", "read");
    const orders = await prisma.order.findMany({ ... });
    return ok(orders);
  } catch (err) {
    return handleError(err);
  }
}
```

### Check Permission in UI (Client)

```typescript
import { hasPermission } from "@/lib/auth/permissions";

// In component
const canDelete = hasPermission(session.user.permissions, "orders", "delete");

{canDelete && <DeleteButton />}
```

### Require Minimum Role

```typescript
import { requireMinRole } from "@/lib/auth/permissions";

// Admin only
const session = await requireMinRole(1); // admin level
```

### Fast Permission Check (No DB Hit)

```typescript
import { requirePermissionFast } from "@/lib/auth/permissions";

// Uses cached session permissions — faster for hot path
await requirePermissionFast(session, "orders", "read");
```

### Check Role Level

```typescript
import { hasMinRoleLevel } from "@/lib/auth/permissions";

if (hasMinRoleLevel(session.role, 2)) {
  // PM or higher
}
```

---

## Common Patterns

### Admin CRUD Endpoint Pattern

```typescript
// GET /api/admin/orders
export async function GET(req: Request) {
  try {
    const session = await requirePermission("orders", "read");
    const { page = 1, limit = 20 } = req.query;
    const [data, total] = await Promise.all([
      prisma.order.findMany({ take: limit, skip: (page - 1) * limit, ... }),
      prisma.order.count(),
    ]);
    return list(data, buildPagination(page, limit, total));
  } catch (err) { return handleError(err); }
}

// POST /api/admin/orders
export async function POST(req: Request) {
  try {
    const session = await requirePermission("orders", "create");
    const body = await req.json();
    const order = await prisma.order.create({ data: body });
    return ok(order, 201);
  } catch (err) { return handleError(err); }
}
```

### Ownership Check (scope: "own")

```typescript
const session = await requirePermission("tasks", "read");
if (session.permissions?.some(p => p.resource === "tasks" && p.action === "read" && p.scope === "own")) {
  // Can only see own tasks
  where.assigneeId = session.userId;
}
```

---

## Seeded Default Roles

On first run, these roles are seeded:

| Role | Level | Permissions |
|------|-------|-------------|
| ceo | -1 | `*:*` (all) |
| super_admin | 0 | `*:*` (all) |
| admin | 1 | Full content + system |
| project_manager | 2 | Projects + team + sales |
| media | 3 | Social, blog, testimonials |
| qa | 4 | Tasks (QA section) |
| member | 5 | Own standups + tasks |
