# Admin RBAC — Source of Truth

> **Version**: 3.0.0 · Updated: 2026-04-04
> **Source**: `src/lib/auth/roles.ts` + `src/lib/auth/permissions.ts` + `src/app/store/authStore.ts` + `src/app/admin/members/page.tsx` (1,988L)
> **Note**: `FE/` and `DESIGN LOOPS/` were archived (commit `38fa12e`).
> **Status**: ⚠️ 2 HỆ THỐNG PHÂN QUYỀN — (1) Zustand store (7 roles, client-side) và (2) BE API (7 roles, DB-backed). Xem Section 2.
> **NEW (v3.0)**: Member Onboarding CEO Approval Workflow + Access Tags. Xem Section 8.

---

## Tổng quan

Có **hai hệ thống phân quyền hoàn toàn khác nhau** trong codebase:

| | FE Mock (Vite) | BE Production (Next.js) |
|---|---|---|
| **File** | `FE/src/app/store/authStore.ts` | `src/lib/auth/roles.ts` + `src/lib/auth/permissions.ts` |
| **Mô hình** | Simple role-only (5 roles) | Full RBAC (7 roles + granular permissions in DB) |
| **Admin tabs** | 23 tabs, hardcoded | 50+ nav items, DB-backed + fallback configs |
| **Tab visibility** | `getAccessibleTabs(role, dept)` → array | `canAccessNav(role, path)` → boolean + `NAV_PERMISSIONS` |
| **API gating** | None (mock) | `requirePermissionFast()` per route |
| **Design reference** | MembersTab đầy đủ (1,300L) | Members page (40L, cần wire) |

**Lưu ý**: Hệ thống BE mạnh hơn nhiều. FE chỉ là mock để demo UI.

---

## 1. BE RBAC System (Production — Source of Truth)

### 1.1 Role Hierarchy

> Lower number = higher privilege. Each role = a business domain owner.

```typescript
// src/lib/auth/roles.ts
const ROLE_LEVEL: Record<string, number> = {
  ceo:              -1,  // Special — bypasses everything, approves member onboarding
  super_admin:        0,  // Can manage all roles + permissions
  admin:              1,  // Full operational access
  project_manager:     2,  // Projects + orders + clients + revenue
  media:               3,  // Media + blog + social posts + academy
  qa:                  4,  // QA + testing + bug tracking
  member:               5,  // Basic access + default tags (kanban, order-basic)
};
```

| Role | Level | Dashboard Access | Key Responsibilities |
|------|-------|----------------|---------------------|
| `ceo` | -1 | All | Approves all member onboarding + role assignments |
| `super_admin` | 0 | All | System config, manages roles/permissions |
| `admin` | 1 | All | Operations management, day-to-day running |
| `project_manager` | 2 | PM tabs | Orders, clients, quotation, services, projects, revenue |
| `media` | 3 | Media tabs | Media bookings, blog posts, social posts, academy |
| `qa` | 4 | QA tabs | Bug tracking, testing, standups |
| `member` | 5 | Member tabs | Kanban + order-basic (default for ALL members) |
| `client` | — | Customer Portal | No admin access |

### 1.2 Granular Permission Model

```typescript
// Every permission is { resource, action, scope }
// Stored in DB: Role → Permission entries

type PermissionAction = "create" | "read" | "update" | "delete" | "export" | "approve";

interface UserPermission {
  resource: string;  // e.g. "orders", "team", "lp-awards"
  action: string;     // e.g. "create", "read", "update"
  scope: string;      // e.g. "all", "own", specific ID
}
```

**Wildcard rules** (in `hasPermission()`):
```typescript
// */*  → super admin (bypass everything)
resource/*  → all actions on that resource
*/action   → that action on all resources
```

### 1.3 Permission Flow (4-layer defense)

```
Layer 1: Middleware (Edge)
  └─ Block unauthenticated users

Layer 2: Admin Layout (Server Component)
  └─ Check session + role → redirect if unauthorized

Layer 3: API Routes
  └─ requirePermission(resource, action)
     └─ isSuperAdmin || isAdmin → bypass
     └─ hasPermission(permissions, resource, action)
        └─ Throw AuthError(403) if denied

Layer 4: UI Components
  └─ <PermissionGate> or usePermission() → hide/show buttons
```

### 1.4 Navigation Permissions (NAV_PERMISSIONS)

> Maps URL paths → permission requirements. Used for sidebar visibility.

```typescript
// src/lib/auth/roles.ts — NAV_PERMISSIONS
// Format: path → { label, minRoleLevel?, permissions? }

"/admin": { minRoleLevel: 5, label: { vi: "Dashboard" } }  // member+ can see

"/admin/content/team": {
  minRoleLevel: 1,  // admin (level 1) and above
  permissions: [{ resource: "team", actions: ["read","create","update","delete"] }]
}

"/admin/sales/orders": {
  minRoleLevel: 3,  // project_manager and above
  permissions: [{ resource: "orders", actions: ["read","update","approve"] }]
}

// Special pages
"/admin/system/roles": { minRoleLevel: 1, permissions: ["roles"] }  // admin only
"/admin/figma-demos": { minRoleLevel: 3, permissions: ["figma-demos"] }
```

**Sidebar visibility check:**
```typescript
canAccessNav(userRole, navPath): boolean
  → roleLevel = ROLE_LEVEL[userRole] ?? 99
  → config = NAV_PERMISSIONS[navPath]
  → if config.minRoleLevel && roleLevel <= minRoleLevel → ALLOW
  → else → DENY (unknown paths are allowed by default)
```

### 1.5 Session User (from getSession / getSessionFromBearer)

```typescript
interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;                    // primary role
  roles: string[];                  // all active roles (multi-role support)
  avatar: string | null;
  accountType: "staff" | "customer";
  teamMemberId: string | null;
  roleLevel: number;                // from ROLE_LEVEL
  permissions: UserPermission[];     // from DB (includes wildcard resolution)
  rank?: string;                   // TeamMember.rank
  availableLp?: number;
  lockedLp?: number;
}
```

### 1.6 API Permission Helpers

```typescript
// src/lib/auth/permissions.ts

// Fast path (no DB hit)
requirePermissionFast(session, resource, action): void
  → if isSuperAdmin(session) || isAdmin(session) → return (pass)
  → if hasPermission(session.permissions, resource, action) → return (pass)
  → throw AuthError("Forbidden", 403)

// Full path (optional DB refresh)
checkPermission(session, resource, action): Promise<boolean>
  → same logic, optional refresh from DB

// Super admin check
isSuperAdmin(session): boolean
isAdmin(session): boolean  // super_admin OR admin
  → session.roles.includes("super_admin") || session.roles.includes("admin")

// Role level check
hasMinRoleLevel(userRole, minLevel): boolean
hasAnyPermission(permissions, requirements): boolean  // every
hasAllPermissions(permissions, requirements): boolean   // every
```

---

## 2. Client-Side RBAC (Zustand)

> Production uses BE API RBAC for all server operations. This Zustand store handles client-side tab visibility and role mapping.

### 2.1 Role Model (7 roles, maps 1:1 with BE roleLevel)

```typescript
// src/app/store/authStore.ts
type UserRole =
  | "admin"            // level 0-1: super_admin + admin
  | "project_manager"   // level 2: PM — orders, clients, projects, revenue
  | "media"            // level 3: Media — blog, media, social posts
  | "qa"               // level 4: QA — testing, bug tracking
  | "member"           // level 5: Basic staff — kanban, order-basic
  | "client"           // customer accountType
  | "guest";          // unauthenticated

type AdminTab =
  | "overview" | "orders" | "members" | "departments" | "projects"
  | "services" | "media" | "quotation" | "portfolio" | "projects_completed"
  | "academy" | "blog" | "revenue" | "clients" | "lp" | "lp_manage"
  | "income_tax" | "web_packages"
  | "effects" | "notification_center" | "settings"
  | "quests_events" | "leaderboard_admin" | "analytics";
```

### 2.2 Per-Role Tab Access

```typescript
// Each role gets its own domain dashboard — no department grouping
const ADMIN_TABS   = "all";                            // 23 tabs
const PM_TABS      = ["overview","orders","clients","quotation","services","revenue","projects","members","departments","notification_center","leaderboard_admin","lp_manage","quests_events","academy","blog","lp"];
const MEDIA_TABS   = ["media","blog","orders","projects","clients","notification_center","academy","services","leaderboard_admin","quests_events","overview","portfolio","revenue"];
const QA_TABS      = ["projects","notification_center","orders","clients","members","academy","leaderboard_admin","overview","lp"];
const MEMBER_TABS  = ["overview","notification_center","leaderboard_admin","academy","quests_events"];

getAccessibleTabs(role, department?): AdminTab[] | "all"
  → admin           → "all"
  → project_manager → PM_TABS
  → media           → MEDIA_TABS
  → qa              → QA_TABS
  → member          → MEMBER_TABS
  → client/guest    → []
```

### 2.3 roleLevel → UserRole Mapping

```typescript
// mapRoleLevelToUserRole(roleLevel, accountType)
roleLevel 0-1 + staff → "admin"
roleLevel 2           → "project_manager"
roleLevel 3           → "media"
roleLevel 4           → "qa"
roleLevel 5           → "member"
any + customer        → "client"
```

### 2.3 Members Page (src/app/admin/members/page.tsx — 1,988L)

> ✅ **Already implemented** — Members page is fully built (1,988 lines).

Key components:

```typescript
// Features:
MemberFormModal     // Add/Edit member with 3 sections: Info / Rank & LP / Skills
MemberDetailModal   // Full member profile (banner, XP bar, skills, missions)
LPAwardModal        // Award/Deduct LP with preset amounts + live preview
BulkLPModal         // Bulk LP for selected members
DeleteConfirmModal  // Delete with confirmation

// Table columns:
[checkbox] [member info + avatar] [rank+level+XP bar] [LP balance] [missions+topSkill] [join date] [status badge] [actions]

// View modes: Table + Grid
// Filters: rank, team (Alpha/Sigma/Omega/All), status (active/inactive/on-leave/probation)
// Sort: name, level, lpBalance, missions, rank
// Bulk actions: Bulk LP Award
// RBAC: canEdit(role) → role === "admin" || role === "manager"
```

**Member status types:**
```typescript
type MemberStatus = "active" | "inactive" | "on-leave" | "probation";
```

**Rank config (same as loop-business-logic.md):**
- Platinum color: `#14B8A6` (teal)
- Diamond: Level 115+ uncapped
- Same 7 ranks: iron → diamond

---

## 3. Auth Flow Comparison

### BE Auth (Production)

```
1. Login (credentials or Google OAuth)
   └─ POST /api/admin/auth/login → returns JWT + user
   └─ JWT stored in HttpOnly cookie
   └─ FE stores JWT in localStorage + sends as Bearer header

2. Session hydration
   └─ /api/admin/auth/me → enriches JWT with DB data
   └─ Session includes: permissions[], roles[], rank, LP

3. Every API call
   └─ requireAuth() → extracts session from Bearer or cookie
   └─ requirePermission(resource, action) → checks session.permissions

4. Middleware
   └─ Edge: blocks unauthenticated
   └─ Admin layout: redirect if unauthorized
```

### Client Auth (Zustand + API)

```
1. loginAs(demoUser) → sets Zustand store directly (demo mode)
2. login(email, password) → calls POST /api/admin/auth/login → JWT
3. fetchSession() → calls GET /api/admin/auth/me → enriches store
```

---

## 4. ⚠️ CONFLICTS — Zustand vs BE API RBAC

| # | Aspekt | Zustand Store | BE API | Notes |
|---|--------|--------------|--------|-------|
| **C1** | Role names | `admin/manager/staff/client/guest` | `ceo/super_admin/admin/project_manager/media/qa/member` | Client store maps to API roleLevel |
| **C2** | `canEdit()` | `role === "admin" \|\| role === "manager"` | `isAdmin()` | Zustand: manager can edit; BE: `project_manager` (level 2) is NOT admin |
| **C3** | Members page | MembersTab (1,988L) | `admin/members/page.tsx` | ✅ **Already implemented** |
| **C4** | LP system | Staff LP: `lpBalance` | Staff LP: `availableLp` + `lockedLp` | API returns different field names |

---

## 5. Permission Naming Conventions

### Resource names (BE — stored in DB)

```
// Content management
home-sliders, landing-pages, services, projects, team,
expertises, testimonials, messages

// Sales
orders, web-templates, service-attributes, addon-services,
customer-points, lp-redemptions, packages, hosting-plans,
domain-prices, deployment-items, pricing-features, quote-requests,
sales-leads, quotes

// System
users, roles, audit-log, settings, websites, points

// Project management
figma-demos, env-files, lp-awards, blog-posts,
standups, deployments, social-posts, handover

// Education
edu (all EDU module)

// LOOP-specific
backlogs, tasks, git-commits, quest, event, rank-effect
```

### FE Tab IDs (mock — for admin dashboard)

```
overview · orders · members · departments · projects
services · media · quotation · portfolio · projects_completed
academy · blog · revenue · analytics · clients
lp · lp_manage · income_tax · web_packages
effects · notification_center · settings · quests_events
leaderboard_admin · analytics
```

### Mapping (when wiring FE → BE)

| FE Tab ID | BE Resource | Notes |
|-----------|-----------|-------|
| `orders` | `orders` | Direct match |
| `members` | `team` | Different names |
| `lp` | `lp-awards` | Different names |
| `lp_manage` | `lp-redemptions` | Different names |
| `blog` | `blog-posts` | Different names |
| `academy` | `edu` | Module-level |
| `effects` | `rank-effect` | New resource |
| `quests_events` | `quest` + `event` | Multiple resources |
| `projects` | `backlogs` or `figma-demos` | Depends on tab focus |

---

## 6. Security Rules

### 6.1 NEVER do

- ❌ `return 200` after auth failure — always throw `AuthError`
- ❌ Check `req.headers["x-user-role"]` alone — use session from `requireAuth()`
- ❌ Store sensitive data in localStorage (FE: `demoToken` is OK for mock only)
- ❌ Skip permission checks in API routes with comment "internal use only"
- ❌ Grant `super_admin` or `ceo` role without explicit approval

### 6.2 ALWAYS do

- ✅ Use `requirePermission(resource, action)` in every admin API route
- ✅ Use `hasMinRoleLevel(role, minLevel)` for page-level access
- ✅ Throw `AuthError("Unauthorized", 401)` for missing session
- ✅ Throw `AuthError("Forbidden", 403)` for insufficient permissions
- ✅ Log failed auth attempts (without sensitive data)
- ✅ Use `handleError()` in catch blocks (not raw NextResponse)

### 6.3 API Route Template

```typescript
import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    requirePermissionFast(session, "orders", "read");

    // ... logic ...
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
```

---

## 7. Members Page — Done ✅

> `src/app/admin/members/page.tsx` — 1,988 lines. All CRUD wired: POST/PUT/DELETE `/api/admin/team` + POST `/api/admin/lp-transactions`.

### API endpoints used:

1. **MemberFormModal** — Add/Edit với 3 tab (Info / Rank & LP / Skills)
2. **MemberDetailModal** — Full profile view với banner + missions
3. **LPAwardModal** — Award/Deduct LP
4. **BulkLPModal** — Bulk operations on selected members
5. **Table + Grid view modes** — với sort + filter
6. **Delete confirmation modal** — với safety check
7. **Search** — by name, role, email
8. **Filters** — by rank, team (Alpha/Sigma/Omega), status
9. **API wiring** — `GET /api/admin/team` + `POST/PUT/DELETE`

### API endpoints needed:

```
GET  /api/admin/team              → list members (with filters)
GET  /api/admin/team/:id         → single member
POST /api/admin/team            → create member
PUT  /api/admin/team/:id         → update member
DELETE /api/admin/team/:id       → delete member
POST /api/admin/team/:id/lp      → award/deduct LP (calls LP service)
```

### Permission check for members:

```typescript
// CRUD operations
requirePermissionFast(session, "team", "read");   // view
requirePermissionFast(session, "team", "create"); // add
requirePermissionFast(session, "team", "update"); // edit
requirePermissionFast(session, "team", "delete"); // delete

// LP management
requirePermissionFast(session, "lp-awards", "create"); // award LP
requirePermissionFast(session, "lp-redemptions", "update"); // deduct LP
```

---

## 8. Member Onboarding — CEO Approval Workflow (v3.0)

> **Status**: Phase 1 planned — Data Model + Seed
> **Owner**: HR + CEO

### 8.1 Luồng tổng quan

```
[HR tạo hồ sơ]
       ↓
[Nhân viên nhận email đăng ký]
       ↓
[Nhân viên đăng ký → status: PENDING]
       ↓
[CEO nhận notification → Duyệt trong Admin Members Tab]
       ↓                    ↓
              ┌──────────┴──────────┐
        [APPROVED]            [REJECTED]
              ↓                    ↓
   → Gán role + tags       → Gửi email từ chối
   → Gửi email chào mừng   → Account deactive
   → Gửi notification HR
```

**Mỗi nhân viên có 2 lớp quyền:**

| Layer | Ví dụ | Ai gán |
|-------|--------|--------|
| **System Role** (1 cái) | member, media, qa, pm | CEO duyệt |
| **Access Tags** (nhiều cái) | `blog-post`, `project-content`, `salary`, `kanban` | CEO gán kèm |

### 8.2 Default Tags (cho mọi member)

| Tag | Label | Ai có |
|-----|-------|--------|
| `kanban` | Kanban Board | **TẤT CẢ** member (không revoke được) |
| `order-basic` | Xem đơn hàng | **TẤT CẢ** member |

### 8.3 Access Tags chi tiết

| Tag | Label | Ai gán |
|-----|-------|--------|
| `blog-post` | Quản trị bài viết | CEO → cho SEO, Media |
| `project-content` | Nội dung dự án | CEO → cho SEO, Designer |
| `seo-content` | Nội dung SEO | CEO → cho SEO Specialist |
| `media-content` | Nội dung Media | CEO → cho Media team |
| `order-manage` | Quản lý đơn hàng | CEO → cho PM |
| `salary` | Xem lương | CEO/Admin only (không gán cho member) |
| `lp-manage` | Quản lý LP | CEO → cho Admin |
| `finance-view` | Xem tài chính | CEO → cho Kế toán |
| `hr-manage` | Quản lý nhân sự | CEO → cho HR |

### 8.4 Data Models

```prisma
// Member onboarding request — HR tạo, CEO duyệt
model MemberRequest {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  department    String   // engineering/design/media/marketing/sales/finance/hr/management
  proposedRole  String   // member/media/qa/project_manager
  proposedTags  String[] // ["blog-post", "kanban"]
  status        String   @default("pending") // pending/approved/rejected
  rejectReason  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  approvedBy    String?  // userId của người duyệt
  approvedAt    DateTime?
}

// Tags tự do — HR/Admin tạo, CEO gán cho member
model AccessTag {
  id          String   @id @default(cuid())
  slug        String   @unique  // "blog-post", "kanban", "salary"
  label       String            // "Quản trị bài viết"
  description String?
  color       String   @default("#3B82F6")
  createdAt   DateTime @default(now())
}

// UserRoleApproval — ghi nhận ai duyệt role cho ai (audit trail)
model UserRoleApproval {
  id         String   @id @default(cuid())
  userId     String
  roleId     String
  approvedBy String   // userId người duyệt (CEO/super_admin)
  approvedAt DateTime @default(now())
  notes      String?
  @@unique([userId, roleId])
}
```

### 8.5 API Routes

| Route | Method | Mô tả | Ai gọi |
|-------|--------|--------|--------|
| `POST /api/admin/team/members/pending` | POST | HR tạo request | HR Tab |
| `GET /api/admin/team/members/pending` | GET | CEO xem danh sách chờ duyệt | CEO Dashboard |
| `POST /api/admin/team/members/pending/:id/approve` | POST | CEO duyệt + gán role + tags | CEO Action |
| `POST /api/admin/team/members/pending/:id/reject` | POST | CEO từ chối + lý do | CEO Action |
| `GET /api/admin/access-tags` | GET | List all tags | Members Tab |
| `POST /api/admin/access-tags` | POST | HR/Admin tạo tag mới | Admin |

### 8.6 Luồng HR (Chi tiết)

```
1. HR → Members Tab → [+ Thêm nhân viên]
   → Nhập: name, email, department, proposedRole, proposedTags
   → System: tạo User (isActive: false) + MemberRequest (pending)
   → Gửi email invite link với token

2. Nhân viên → email → link /register-with-token?token=xxx
   → Đặt password
   → Account: isActive = true (nhưng chờ duyệt)

3. CEO → Notification "3 nhân viên chờ duyệt"
   → Click → Approval Modal
   → Gán final role + final tags
   → Submit
   → System:
     a. UserRoleApproval tạo record
     b. TeamMember.requestStatus = "approved"
     c. TeamMember.accessTags = [selected tags + default kanban + order-basic]
     d. Gửi email chào mừng
     e. Notification cho HR
```

### 8.7 Permission Check mới

```typescript
// src/lib/auth/permissions.ts

// Check access tag (bổ sung cho role-level permissions)
export function hasAccessTag(user: SessionUser, tag: string): boolean {
  if (isSuperAdmin(user) || isAdmin(user)) return true;
  // Default tags: kanban + order-basic luôn có cho mọi member
  if (tag === "kanban" || tag === "order-basic") return true;
  return user.accessTags?.includes(tag) ?? false;
}
```

### 8.8 Phases triển khai

| Phase | Nội dung | Priority |
|-------|---------|---------|
| P2-A | Data models (MemberRequest, AccessTag, UserRoleApproval) | HIGH |
| P2-B | API Routes + CEO Approval UI | HIGH |
| P2-C | HR Invite Flow + Email templates | MEDIUM |
