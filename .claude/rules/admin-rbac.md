# Admin RBAC — Source of Truth

> **Version**: 4.0.0 · Updated: 2026-04-09
> **Source**: `src/lib/auth/roles.ts` + `src/lib/auth/permissions.ts` + `src/app/store/authStore.ts` + `src/app/admin/members/page.tsx` (1,988L) + `src/app/admin/departments/page.tsx` (1,052L)
> **Note**: `FE/` and `DESIGN LOOPS/` were archived (commit `38fa12e`).
> **Status**: ⚠️ 2 HỆ THỐNG PHÂN QUYỀN — (1) Zustand store (client-side) và (2) BE API (7 roles + department permissions, DB-backed).
> **v4.0 CHANGE**: Department System — mỗi member thuộc 1 department, mỗi department có Trưởng phòng. CEO gán permissions cho từng department tab. Admin dashboard access hoàn toàn dựa trên department-level permissions. Xem Section 2 + Section 12.

---

## Tổng quan

Có **hai hệ thống phân quyền** trong codebase:

| | Zustand (client-side) | BE Production (Next.js) |
|---|---|---|
| **File** | `src/app/store/authStore.ts` | `src/lib/auth/roles.ts` + `src/lib/auth/permissions.ts` |
| **Mô hình** | Role → hardcoded tab list | Role + Department + individual permission grants |
| **Admin tabs** | 23 tabs, hardcoded per role | Dynamic — từng tab là permission riêng |
| **Tab visibility** | `getAccessibleTabs(role)` → array | `canAccessTab(user, tabId)` → boolean |
| **API gating** | None | `requirePermissionFast()` per route |
| **Design reference** | Members page (1,988L) | Departments page (1,052L) |

---

## 0. Department System (v4.0 — NEW)

> **Source**: `src/app/admin/departments/page.tsx` (1,052L) + `src/lib/auth/roles.ts`

### 0.1 Mô hình dữ liệu

```typescript
// Department (Prisma model)
interface Department {
  id: string;           // "engineering" | "design" | "media" | "marketing" | "sales" | "finance" | "hr" | "management"
  name: string;         // "Phòng Kỹ thuật"
  shortName: string;    // "IT"
  color: string;        // "#3B82F6" — màu đại diện
  description: string; // Mô tả phòng ban
  mission: string;      // Sứ mệnh phòng ban
  headId: string;      // TeamMember.id — Trưởng phòng (1 người duy nhất)
  memberIds: string[];  // TeamMember[].id — thành viên thuộc phòng ban
}

// Mỗi member có 2 lớp phân quyền:
// Layer 1: System Role (ceo/super_admin/admin/hr/pm/media/qa/member)
// Layer 2: Department Permissions (CEO gán permissions cho từng department tab)
```

### 0.2 8 Phòng ban chuẩn

| ID | Tên | Màu | Ghi chú |
|----|-----|------|---------|
| `engineering` | Phòng Kỹ thuật (IT) | `#3B82F6` | Dev, QA, DevOps |
| `design` | Phòng Thiết kế | `#8B5CF6` | UI/UX, Graphic |
| `media` | Phòng Media | `#EC4899` | Content, video, social |
| `marketing` | Phòng Marketing | `#F59E0B` | SEO, SEM, brand |
| `sales` | Phòng Kinh doanh | `#22C55E` | Sales, quotation |
| `finance` | Phòng Tài chính | `#14B8A6` | Kế toán, LP, thu nhập |
| `hr` | Phòng Nhân sự | `#6366F1` | Tuyển dụng, onboarding |
| `management` | Ban Quản lý | `#EAB308` | CEO, super_admin |

### 0.3 Trưởng phòng (Department Head)

```
Mỗi phòng ban có ĐÚNG 1 Trưởng phòng:
  → Trưởng phòng = member có role cao nhất trong phòng (CEO chỉ định)
  → Trưởng phòng KHÔNG thay đổi system role (giữ nguyên pm/media/qa/member)
  → Trưởng phòng có thêm quyền cấp department:
      • Xem dashboard của phòng mình
      • Gán task cho member cùng phòng
      • Không thể gán permissions (chỉ CEO gán)
  → Avatar hiển thị Crown icon (👑) trong Department page
```

### 0.4 Admin Dashboard Access — Permission-based (KHÔNG còn hardcoded tab list)

> **Thay đổi lớn v4.0**: Từ trước mỗi role có 1 danh sách tabs cố định. **Bây giờ** mỗi tab là 1 permission riêng, CEO gán permissions cho từng member.

```typescript
// Từng admin tab = 1 permission riêng biệt
type AdminTab =
  | "overview" | "orders" | "members" | "departments" | "projects"
  | "services" | "media" | "quotation" | "portfolio" | "projects_completed"
  | "academy" | "blog" | "revenue" | "clients" | "lp" | "lp_manage"
  | "income_tax" | "web_packages" | "effects" | "notification_center"
  | "settings" | "quests_events" | "leaderboard_admin" | "analytics"
  | "figma_demos" | "kanban" | "revenue_split" | "off_system_payments";

// SessionUser chứa permissions cho FE
interface SessionUser {
  // ... existing fields
  tabPermissions: string[];     // ["orders", "members", "revenue", ...]
  departmentPermissions: Record<string, string[]>; // { "engineering": ["projects", "kanban", "lp"], ... }
}

// Sidebar visibility check
canAccessTab(user: SessionUser, tabId: string): boolean
  → isCeo(user) || isSuperAdmin(user) → true (all tabs)
  → isAdmin(user) → true (all tabs)
  → tabPermissions.includes(tabId) → true
  → departmentPermissions[user.department]?.includes(tabId) → true
  → else → false
```

### 0.5 CEO gán Permissions như thế nào

```
CEO → /admin/settings → Tab "Phân quyền"
  │
  ├── Chọn member từ danh sách
  │     → System Role: member / media / qa / pm (1 cái)
  │     → Department: chọn phòng ban member thuộc về
  │
  ├── Gán Tab Permissions (tích chọn từng tab):
  │     → Overview luôn có (default)
  │     → Orders, Revenue, Clients, Projects, Media...
  │     → Phòng nào có quyền nào → CEO tích vào
  │
  └── Submit → Lưu vào DB → Refresh session → Member thấy tabs mới
```

### 0.6 Default Permissions khi tạo member mới

```typescript
// Mỗi system role có default tab permissions
const DEFAULT_TAB_PERMISSIONS: Record<string, string[]> = {
  ceo: ["*"],                        // Tất cả tabs
  super_admin: ["*"],               // Tất cả tabs
  admin: ["*"],                      // Tất cả tabs
  hr: ["members", "overview", "notification_center", "quests_events"],
  project_manager: ["orders", "clients", "quotation", "services", "revenue", "projects", "departments", "notification_center", "leaderboard_admin", "lp_manage", "quests_events", "academy", "blog", "lp"],
  media: ["media", "blog", "orders", "projects", "clients", "academy", "services", "leaderboard_admin", "quests_events", "overview", "portfolio", "revenue"],
  qa: ["projects", "notification_center", "orders", "clients", "members", "academy", "leaderboard_admin", "overview", "lp"],
  member: ["overview", "notification_center", "leaderboard_admin", "academy", "quests_events"],
};

// Department bonus permissions
const DEPT_BONUS_PERMISSIONS: Record<string, string[]> = {
  engineering: ["kanban", "lp"],
  design: ["figma_demos", "portfolio"],
  media: ["media", "blog"],
  marketing: ["blog", "projects"],
  sales: ["orders", "clients", "quotation", "revenue"],
  finance: ["revenue", "lp", "lp_manage", "income_tax", "revenue_split", "off_system_payments"],
  hr: ["members", "departments"],
  management: ["*"],
};
```

### 0.7 Prisma Models

```prisma
// Phòng ban — Admin/CEO CRUD
model Department {
  id          String   @id @default(cuid())
  key         String   @unique   // "engineering" | "design" | "media" ...
  name        String              // "Phòng Kỹ thuật"
  shortName   String              // "IT"
  color       String   @default("#3B82F6")
  description String?
  mission     String?
  headId      String?   // TeamMember.id — nullable (CEO chưa chỉ định)
  members     TeamMember[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// TeamMember bổ sung department
model TeamMember {
  // ... existing fields
  departmentId String?              // FK → Department.id (nullable: CEO không thuộc phòng nào)
  department   Department? @relation(fields: [departmentId], references: [id])

  // Permissions (CEO gán)
  tabPermissions String[]           // ["orders", "revenue", ...] — rỗng = default theo role
  isDeptHead      Boolean @default(false) // Trưởng phòng
}

// Audit log cho việc gán permissions
model PermissionAudit {
  id           String   @id @default(cuid())
  targetUserId String              // Member được gán/quyền
  grantedBy    String              // UserId người gán (CEO/super_admin)
  permission   String              // Tab ID hoặc "dept_head"
  department   String?             // Department ID (nếu gán dept)
  action       String              // "grant" | "revoke" | "set_dept_head"
  createdAt    DateTime @default(now())
}
```

### 0.8 API Routes — Department + Permission Management

| Route | Method | Mô tả | Ai gọi |
|-------|--------|--------|--------|
| `GET /api/admin/departments` | GET | List all departments + members | Departments page |
| `POST /api/admin/departments` | POST | Create department | Admin/CEO |
| `PUT /api/admin/departments/[id]` | PUT | Update department | Admin/CEO |
| `DELETE /api/admin/departments/[id]` | DELETE | Delete department (chỉ khi rỗng) | Admin/CEO |
| `PUT /api/admin/departments/[id]/head` | PUT | Set/change department head | CEO only |
| `PUT /api/admin/departments/[id]/members` | PUT | Bulk assign members to dept | Admin/CEO |
| `GET /api/admin/permissions` | GET | Get member's current permissions | Settings page |
| `PUT /api/admin/permissions/[memberId]` | PUT | CEO gán permissions cho member | CEO only |
| `POST /api/admin/permissions/audit` | POST | Log permission change | System |

### 0.9 Department → Admin Tab Mapping (RBAC)

| Department | Tab Permissions mặc định (CEO gán thêm được) |
|-----------|---------------------------------------------|
| `engineering` | overview, projects, kanban, lp, lp_manage, members, notification_center, academy, leaderboard_admin, quests_events |
| `design` | overview, projects, portfolio, figma_demos, members, notification_center, academy, leaderboard_admin, quests_events |
| `media` | overview, media, blog, academy, members, notification_center, leaderboard_admin, quests_events, orders, projects, clients |
| `marketing` | overview, blog, academy, clients, services, notification_center, leaderboard_admin, quests_events, orders, projects |
| `sales` | overview, orders, clients, quotation, services, revenue, notification_center, leaderboard_admin, quests_events, academy, blog, lp, lp_manage, projects, members, departments |
| `finance` | overview, revenue, lp, lp_manage, income_tax, web_packages, orders, notification_center, leaderboard_admin, quests_events, revenue_split, off_system_payments |
| `hr` | overview, members, departments, notification_center, leaderboard_admin, quests_events, academy, lp_manage |
| `management` | **TẤT CẢ tabs** (như admin) |

### 0.10 Department Head Permissions (bonus trên base role)

```typescript
// Ngoài tab permissions, Trưởng phòng có thêm:
const DEPT_HEAD_BONUS: string[] = [
  "department_overview",   // Xem dashboard chi tiết phòng mình
  "assign_tasks",         // Gán task cho member cùng phòng
  "view_dept_lp",         // Xem LP của member cùng phòng
];

// Kiểm tra dept head
isDeptHead(user: SessionUser, departmentId: string): boolean
  → user.isDeptHead === true
  → user.departmentId === departmentId
  → member.memberId trong Department.memberIds của phòng đó
```

### 0.11 Department Page UI (departments/page.tsx — 1,052L)

> ✅ **Đã implement** — Full UI với mock data

```
/admin/departments
  ├── KPI: tổng phòng ban, tổng nhân sự, TB/phòng, trưởng phòng
  ├── Department selector (bên trái)
  │     ├── Dept card: icon, name, member count, head avatar, color
  │     └── Active state highlight
  ├── DeptDetail (bên phải)
  │     ├── Header: name, description, mission, "Phân công" button
  │     ├── KPI grid: chiến dịch, reach, velocity...
  │     ├── OrgChart (3 modes: tree ≤8 / grid 9-24 / squads 25+)
  │     ├── Sidebar: head info + team stats + rank distribution
  │     └── MemberList: paginated (12/page) + search + rank filter + sort
  └── AssignModal: bulk assign members + set department head
```

**OrgChart 3 modes:**
- **Tree** (≤8 sub-members): Head ở trên → avatar grid bên dưới
- **Grid** (9-24 sub-members): Head card → compact avatar grid
- **Squad** (25+ sub-members): Head banner → collapsible squads by role category

**Department Head hiển thị:** Crown icon (👑) + amber border + `TRƯỞNG` badge

---

## 1. BE RBAC System (Production — Source of Truth)

### 1.1 Role Hierarchy (v4.0 — có thêm `hr`)

> Lower number = higher privilege. `hr` nằm giữa `admin` và `pm`.

```typescript
// src/lib/auth/roles.ts
const ROLE_LEVEL: Record<string, number> = {
  ceo:              -1,  // Special — bypasses everything, approves onboarding, gán permissions
  super_admin:        0,  // Can manage all roles + permissions
  admin:              1,  // Full operational access
  hr:                 2,  // HR: create/edit members — NO delete, no LP award, no approval
  project_manager:     3,  // Projects + orders + clients + revenue
  media:               4,  // Media + blog + social posts + academy
  qa:                  5,  // QA + testing + bug tracking
  member:               6,  // Basic access + default tags (kanban, order-basic)
};
```

| Role | Level | Admin Dashboard Access | Key Responsibilities |
|------|-------|----------------------|---------------------|
| `ceo` | -1 | **TẤT CẢ** | Approves onboarding, assigns all permissions, manages departments |
| `super_admin` | 0 | **TẤT CẢ** | System config, manages roles/permissions |
| `admin` | 1 | **TẤT CẢ** | Operations management, day-to-day running |
| `hr` | 2 | Members + Departments + Notifications | Tạo hồ sơ nhân viên, quản lý onboarding (không xóa, không duyệt) |
| `project_manager` | 3 | PM tabs (CEO gán thêm được) | Orders, clients, quotation, services, projects, revenue |
| `media` | 4 | Media tabs (CEO gán thêm được) | Media bookings, blog posts, social posts, academy |
| `qa` | 5 | QA tabs (CEO gán thêm được) | Bug tracking, testing, standups |
| `member` | 6 | Base tabs (CEO gán thêm được) | Kanban + order-basic (default for ALL members) |
| `client` | — | Customer Portal | No admin access |

### 1.2 Hai lớp phân quyền — Role + Department Permissions

```
Layer 1: System Role — 1 cái (CEO gán khi onboarding)
  → quyết định baseline access (member/qa/media/pm/hr/admin)
  → HR lấy base từ đây để gán tab permissions

Layer 2: Tab Permissions (KHÔNG còn hardcoded per role)
  → TỪNG TAB = 1 permission riêng
  → CEO gán cho từng member (bảng trong Settings)
  → tabPermissions[]: ["orders", "revenue", "members", ...]
  → departmentPermissions{}: { "engineering": ["kanban", "lp"], ... }

Layer 3: Department Head (bonus, không phải role thay thế)
  → Trưởng phòng giữ nguyên system role
  → Thêm quyền dept-level: xem LP phòng mình, gán task trong phòng
```

### 1.3 Permission Flow (5-layer defense v4.0)

```
Layer 1: Middleware (Edge)
  └─ Block unauthenticated users

Layer 2: Admin Layout (Server Component)
  └─ Check session → redirect if no tabs accessible

Layer 3: Sidebar Visibility (canAccessTab)
  └─ tabPermissions.includes(tabId) || departmentPermissions[dept].includes(tabId)

Layer 4: API Routes
  └─ requirePermission(resource, action)
     └─ isCeo || isSuperAdmin → bypass
     └─ hasPermission(session.permissions, resource, action)
        └─ Throw AuthError(403)

Layer 5: UI Components
  └─ <PermissionGate tabId="orders"> → hide/show buttons
```

### 1.4 Session User (v4.0)

```typescript
interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;                    // primary system role
  roles: string[];                  // all active roles
  avatar: string | null;
  accountType: "staff" | "customer";
  teamMemberId: string | null;
  roleLevel: number;                // from ROLE_LEVEL
  departmentId: string | null;      // NEW v4.0 — Department.id
  departmentKey: string | null;     // NEW v4.0 — "engineering" | "design" | ...
  isDeptHead: boolean;              // NEW v4.0 — Trưởng phòng
  tabPermissions: string[];         // NEW v4.0 — explicit tab grants
  departmentPermissions: Record<string, string[]>; // NEW v4.0
  permissions: UserPermission[];     // from DB (BE resources)
  rank?: string;                   // TeamMember.rank
  availableLp?: number;
  lockedLp?: number;
}
```

### 1.5 canAccessTab (v4.0)

```typescript
import { isCeo, isSuperAdmin, isAdmin } from "@/lib/auth/roles";

function canAccessTab(user: SessionUser, tabId: string): boolean {
  if (isCeo(user) || isSuperAdmin(user) || isAdmin(user)) return true;
  if (user.tabPermissions.includes(tabId)) return true;
  if (user.tabPermissions.includes("*")) return true;
  if (user.departmentId && user.departmentPermissions[user.departmentId]?.includes(tabId)) return true;
  // Dept head bonus: xem dashboard phòng mình
  if (user.isDeptHead) {
    const deptDefault = DEPT_BONUS_PERMISSIONS[user.departmentKey ?? ""] ?? [];
    if (deptDefault.includes(tabId)) return true;
  }
  return false;
}
```

### 1.6 canAccessNav (legacy — vẫn dùng cho nav paths)

```typescript
// src/lib/auth/roles.ts
export function canAccessNav(userRole: string, navPath: string): boolean {
  const roleLevel = ROLE_LEVEL[userRole] ?? 99;
  const config = NAV_PERMISSIONS[navPath];
  if (!config) return true; // unknown nav = allow (server will block)
  if (config.minRoleLevel !== undefined && roleLevel <= config.minRoleLevel) return true;
  return false;
}
```

---

## 2. Client-Side RBAC (Zustand + API v4.0)

> Production uses BE API for all server ops. Zustand handles client-side tab visibility + department display.

### 2.1 Role Model (7 roles + hr)

```typescript
// src/app/store/authStore.ts
type UserRole =
  | "admin"            // level 0-1: super_admin + admin → all tabs
  | "hr"               // level 2: HR → members/departments/notification
  | "project_manager"   // level 3: PM → CEO-gated tabs
  | "media"            // level 4: Media → CEO-gated tabs
  | "qa"               // level 5: QA → CEO-gated tabs
  | "member"           // level 6: Basic → CEO-gated tabs
  | "client"           // customer accountType
  | "guest";          // unauthenticated

type AdminTab =
  | "overview" | "orders" | "members" | "departments" | "projects"
  | "services" | "media" | "quotation" | "portfolio" | "projects_completed"
  | "academy" | "blog" | "revenue" | "clients" | "lp" | "lp_manage"
  | "income_tax" | "web_packages"
  | "effects" | "notification_center" | "settings"
  | "quests_events" | "leaderboard_admin" | "analytics"
  | "figma_demos" | "kanban" | "revenue_split" | "off_system_payments";
```

### 2.2 Per-Role Base Tab Access (CEO GÁN THÊM được — NOT hardcoded)

```typescript
// Baseline tabs khi tạo member (CEO gán thêm hoặc bớt sau đó)
const ROLE_BASE_TABS: Record<string, string[]> = {
  admin:     ["*"],                                // all tabs
  hr:        ["members", "departments", "overview", "notification_center", "quests_events", "academy", "lp_manage"],
  project_manager: ["overview","orders","clients","quotation","services","revenue","projects","members","departments","notification_center","leaderboard_admin","lp_manage","quests_events","academy","blog","lp","portfolio","projects_completed"],
  media:     ["overview","media","blog","orders","projects","clients","academy","services","leaderboard_admin","quests_events","portfolio","revenue"],
  qa:        ["overview","projects","notification_center","orders","clients","members","academy","leaderboard_admin","lp"],
  member:    ["overview","notification_center","leaderboard_admin","academy","quests_events"],
  client:    [],
  guest:     [],
};

// Department bonus — tự động thêm nếu member thuộc phòng đó
const DEPT_TAB_BONUS: Record<string, string[]> = {
  engineering: ["kanban","lp"],
  design:     ["figma_demos","portfolio"],
  media:      ["media","blog"],
  marketing:  ["blog","projects"],
  sales:      ["orders","clients","quotation","revenue"],
  finance:    ["revenue","lp","lp_manage","income_tax","revenue_split","off_system_payments"],
  hr:         ["members","departments"],
  management: ["*"],
};

getAccessibleTabs(role, departmentKey?): string[] | "all"
  → role === "ceo" || role === "admin" → "all"
  → base = ROLE_BASE_TABS[role] ?? []
  → if (departmentKey && DEPT_TAB_BONUS[departmentKey]) → [...base, ...DEPT_TAB_BONUS[departmentKey]]
  → return dedup(base + deptBonus)
```

### 2.3 roleLevel → UserRole Mapping

```typescript
// mapRoleLevelToUserRole(roleLevel, accountType)
roleLevel ≤ 1 + staff → "admin"
roleLevel 2           → "hr"
roleLevel 3           → "project_manager"
roleLevel 4           → "media"
roleLevel 5           → "qa"
roleLevel 6           → "member"
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
| **C1** | Role names | `admin/hr/pm/media/qa/member/client/guest` | `ceo/super_admin/admin/hr/pm/media/qa/member` | Zustand maps roleLevel → UserRole; v4: `hr` level 2 |
| **C2** | `canEdit()` | `role === "admin"` | `isAdmin(session)` | Zustand: HR không edit; BE: `admin` (level 1) edit members |
| **C3** | Members page | MembersTab (1,988L) | `admin/members/page.tsx` | ✅ **Already implemented** |
| **C4** | LP system | Staff LP: `lpBalance` | Staff LP: `availableLp` + `lockedLp` | API returns different field names |
| **C5** | Tab list | Hardcoded per role | **Dynamic** — CEO gán từng tab | v4.0: tabPermissions[] replaces hardcoded lists |

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

---

## 9. Project Roles (v3.0)

### 9.1 ProjectRole Keys

Project-level roles for TeamMembers assigned to Order projects:

| Key | Label | Color | Ai gán |
|-----|-------|-------|--------|
| `pm` | Project Manager | `#EC4899` | CEO/Admin |
| `designer` | Designer | `#8B5CF6` | Admin, PM |
| `dev` | Developer | `#3B82F6` | Admin, PM |
| `qa` | QA Engineer | `#22C55E` | Admin, PM |
| `seo` | SEO Specialist | `#F59E0B` | Admin, PM |

**Model:** `ProjectRole` (seeded, `key` unique), `ProjectMember.projectRoleKey → ProjectRole.key`

### 9.2 Admin Tabs mới

| Tab | RBAC | API Resource |
|-----|------|-------------|
| `projects/[id]/kanban` | pm, admin | task-kanban |
| `customer_websites` | admin | customer-websites |
| `handover` | pm, admin | handover |

---

## 10. TaskKanban vs Task (Distinction)

| | `Task` (Epic/Backlog) | `TaskKanban` |
|---|------|---------|
| Container | Backlog (LP budget) | Order project |
| Use case | Sprint planning, epic grouping | Real-time task board per project |
| UI | `/admin/projects` (JIRA-like) | `/admin/projects/[orderId]/kanban` |
| LP award | On merge to main | On column → "done" |
| Roles | PM/Admin | PM/Admin creates, Dev moves |

`Task` is for sprint/PM planning. `TaskKanban` is for live project tracking.

---

## 11. API Resources mới (v3.0)

| Resource | Permissions | Description |
|----------|-------------|-------------|
| `task-kanban` | read, create, update, delete | Task-level Kanban per order |
| `project-members` | read, create, update, delete | Assign member to project with role |
| `handover` | read, create, update | HandoverPackage per order |
| `customer-websites` | read, create, update, delete | Domain purchase + eKYC |
| `notifications` | read, create | AdminNotification CRUD |
| `events-stream` | read | SSE real-time notifications |
