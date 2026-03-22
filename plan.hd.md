# 🔄 KẾ HOẠCH CẢI THIỆN HỆ THỐNG ĐIỀU HƯỚNG & AUTH — LOOP

> **Ngày**: 2026-03-22 | **Framework**: Next.js 15 App Router + next-intl v4 + NextAuth v5
> **Trạng thái**: ⚠️ ĐÃ VALIDATE — nhiều phần ĐÃ IMPLEMENT, cần cập nhật plan

---

## 0. VALIDATION RESULTS (2026-03-22)

> ⚠️ **Phát hiện quan trọng**: Phần lớn infrastructure đã được implement. Plan ban đầu dựa trên giả định sai. Dưới đây là kết quả so sánh thực tế vs kế hoạch.

### 0.1 Infrastructure — ĐÃ CÓ ĐẦY ĐỦ ✅

| File plan | File thực tế | Trạng thái |
|-----------|-------------|------------|
| `navigation/routes.ts` | ✅ `src/navigation/routes.ts` | Đầy đủ 26 routes |
| `navigation/router.ts` | ✅ `src/navigation/router.tsx` | `NavLink` + `useAppRouter()` |
| `navigation/guards.ts` | ✅ `src/navigation/guards.ts` | `canAccessAdminPath()`, `canSeeNavItem()` |
| `navigation/middleware-auth.ts` | ✅ `src/navigation/middleware-auth.ts` | `checkEdgeAuth()`, `stripLocaleFromAdmin()`, `LEGACY_ADMIN_REDIRECTS` |
| `navigation/utils.ts` | ✅ `src/navigation/utils.ts` | `getLoginRedirectUrl()`, `buildLoginUrl()` |
| `navigation/types.ts` | ✅ `src/navigation/types.ts` | Re-export types + constants |

### 0.2 Issues đã ĐƯỢC SỬA rồi ✅

| # | Issue trong plan | Thực tế | Ghi chú |
|---|-----------------|---------|---------|
| #1 | Hai hệ thống auth song song | ✅ **CHỈ CÓ 1 HỆ** | `src/contexts/AuthContext.tsx` **KHÔNG TỒN TẠI**. Chỉ có `AdminAuthProvider` |
| #2 | Login page dùng sai hệ thống | ✅ **ĐÃ ĐÚNG** | `login-page.tsx` dùng `useAdminAuth()` |
| #3 | Logout không xóa `auth-method` | ✅ **ĐÃ SỬA** | `logout/route.ts` xóa cả 2 cookies |
| #4 | `account/page.tsx` navigate sai | ✅ **ĐÃ SỬA** | Dùng `useAdminAuth().logout()` |
| #9 | `nextSignOut()` không có tác dụng | ✅ **ĐÃ SỬA** | Không còn `nextSignOut()` ở đâu |
| #11 | `canAccessNav` chỉ dùng role string | ✅ **ĐÃ SỬA** | `filterAccessibleAdminRoutes(user.roleLevel)` — đúng |

### 0.3 Issues còn TỒN TẠI cần sửa ⚠️

| # | Mức | Vấn đề | Vị trí | Trạng thái |
|---|-----|--------|--------|------------|
| A | 🔴 | **`SessionProvider` thừa trong `admin/layout.tsx`** | `src/app/admin/layout.tsx` | ✅ **ĐÃ SỬA** (2026-03-22) |
| B | 🔴 | **`window.location.href` trong logout** | `admin-auth-provider.tsx:107` | ✅ **ĐÃ SỬA** (2026-03-22) |
| C | 🟠 | **Hardcoded `vi` fallback trong logout** | `admin-auth-provider.tsx:106` | ✅ **ĐÃ SỬA** (2026-03-22) → `routing.defaultLocale` |
| D | 🟠 | **`router.push("/admin")` trong AdminShell LoginForm** | `admin-shell.tsx:126` | ✅ **ĐÃ SỬA** (2026-03-22) |
| E | 🟠 | **`login-page.tsx` dùng `window.location.href`** | `login-page.tsx:38` | ✅ **ĐÃ SỬA** (2026-03-22) |
| F | 🟡 | **`canAccessAdminPath` chưa check permissions** | `guards.ts:75` | ✅ **ĐÃ SỬA** (2026-03-22) — dùng `NAV_PERMISSIONS` |
| G | 🟡 | **Edge `buildLoginUrl` dùng `defaultLocale`** | `middleware-auth.ts:104` | ✅ **ĐÃ SỬA** (2026-03-22) — đọc `NEXT_LOCALE` cookie + `Accept-Language` |
| H | 🟡 | **`AdminAuthProvider` vị trí không rõ ràng** | root layout | ✅ **ĐÃ VERIFY** — tại `src/app/layout.tsx` |
| I | 🟡 | **28 admin pages đều `"use client"`** | `src/app/admin/*/page.tsx` | ⬜ Chưa làm (low priority) |
| J | 🟡 | **Google Sign-In hardcoded `/vi` callback** | `login-page.tsx:95` | ✅ **ĐÃ SỬA** (2026-03-22) → `window.location.origin` |
| K | 🟡 | **Không có server-side guard cho admin layout** | `admin/layout.tsx` | ✅ **ĐÃ THÊM** (2026-03-22) — `requireAdmin()` call |

### 0.4 Plan cần CẬP NHẬT — Các bước thực tế

Vì infrastructure đã có, các Phase trong plan gốc cần được thay đổi:

```
Plan gốc:
  Phase 1: Tạo navigation/ infrastructure  ← ĐÃ XONG ✅
  Phase 2: Hợp nhất auth                    ← ĐÃ XONG ✅ (chỉ có 1 hệ)
  Phase 3: Refactor Admin Shell & Sidebar    ← ĐÃ XONG ✅
  Phase 4: Middleware refactor              ← ĐÃ XONG ✅
  Phase 5: Server-side guards               ← CẦN LÀM

Cần thay = New Priority Order:
  New P1: Xóa SessionProvider + Fix window.location.href logout  ← CRITICAL
  New P2: Fix login-page.tsx + AdminShell router.push           ← HIGH
  New P3: Thêm permission check vào canAccessAdminPath         ← MEDIUM
  New P4: Verify AdminAuthProvider location + Edge login URL     ← LOW
```

---

## 1. BỐI CẢNH & VẤN ĐỀ HIỆN TẠI (CẬP NHẬT)

### 1.0 Sơ đồ luồng điều hướng hiện tại

```
Browser Request
      │
      ▼
src/middleware.ts (Edge) ───────────────────────────────────────┐
  ├─ /{locale}/admin/*  → strip locale → /admin/*               │
  ├─ /admin/*           → auth check → role check → page|redirect│
  ├─ /api/admin/*       → auth check → API hoặc 401              │
  └─ *                  → next-intl middleware → locale layout    │
                                                          ┌───────┘
                                                          ▼
                                             Admin Layout hoặc Public Layout
```

### 1.2 Tổng hợp 12 lỗi nghiêm trọng được phát hiện

| # | Mức | Vấn đề | Vị trí |
|---|-----|--------|--------|
| 1 | 🔴 | **Hai hệ thống auth chạy song song** — `AdminAuthContext` (7 vai trò, full permissions) ≠ `AuthContext` (3 vai trò, rút gọn) | `contexts/AuthContext.tsx` + `admin-auth-provider.tsx` |
| 2 | 🔴 | **Login page dùng sai hệ thống** — `login-page.tsx` import `useAuth()` từ `AuthContext` nhưng login qua `/api/admin/auth/login` → `AdminAuthContext` | `src/app/[locale]/login/page.tsx` |
| 3 | 🔴 | **`logout` không xóa `auth-method` cookie** — sau logout, cookie `auth-method` vẫn còn → có thể gây lỗi session | `src/app/api/admin/auth/logout/route.ts` |
| 4 | 🔴 | **`account/page.tsx` navigate sai** — `router.replace("/login")` không có locale prefix → 404 hoặc loop vì `localePrefix: 'always'` | `src/app/[locale]/account/page.tsx` |
| 5 | 🟠 | **Hardcoded locale `vi` trong middleware** — redirect luôn về `/vi/login` không quan tâm ngôn ngữ người dùng | `src/middleware.ts` |
| 6 | 🟠 | **Admin sidebar dùng hardcoded path** — dùng `next/link` + path cứng `/admin/*` thay vì dùng nav utility | `admin-sidebar.tsx` |
| 7 | 🟠 | **Hard redirect `window.location.href`** — cả admin logout và admin shell đều dùng `window.location.href` thay vì router | `admin-auth-provider.tsx`, `admin-shell.tsx` |
| 8 | 🟠 | **`AdminAuthProvider` dư thừa `SessionProvider`** — credentials login không dùng NextAuth session, `SessionProvider` không cần thiết | `src/app/admin/layout.tsx` |
| 9 | 🟠 | **`nextSignOut()` không có tác dụng cho credentials** — logout gọi `nextSignOut()` nhưng credentials user không có NextAuth session → no-op | `admin-auth-provider.tsx` |
| 10 | 🟡 | **Không có server-side guard cho admin pages** — 25 admin pages đều là `"use client"`, không có `redirect()` server-side | `src/app/admin/*/page.tsx` |
| 11 | 🟡 | **`canAccessNav` chỉ dùng `role` string** — bỏ qua `permissions` array từ DB, nav item có thể sai | `admin-sidebar.tsx` |
| 12 | 🟡 | **`getSession()` graceful degradation leak minimal session** — DB chết → trả session không có permissions, user bị coi là authenticated nhưng không có quyền gì | `src/lib/auth/permissions.ts` |

---

## 2. MỤC TIÊU THIẾT KẾ (CẬP NHẬT)

### Nguyên tắc kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    DESIGN GOALS                          │
├─────────────────────────────────────────────────────────┤
│ 1. MỘT HỆ THỐNG AUTH DUY NHẤT                           │
│    ✅ Đã hoàn thành — chỉ có AdminAuthProvider         │
│ 2. NAV UTILITY TẬP TRUNG                               │
│    ✅ Đã hoàn thành — 6 files trong src/navigation/   │
│ 3. AUTH GUARD 3 LỚP NHẤT QUÁN                          │
│    ⚠️ Cần hoàn thiện — edge + client OK, server thiếu │
│ 4. ROUTE CONFIG KHAI BÁO                                │
│    ✅ Đã hoàn thành — 26 routes trong ADMIN_ROUTES     │
│ 5. DỄ MỞ RỘNG                                           │
│    ✅ Đã hoàn thành — thêm route chỉ cần 1 khai báo   │
└─────────────────────────────────────────────────────────┘

🎯 MỤC TIÊU CÒN LẠI:
  → Xóa SessionProvider thừa
  → Thay window.location.href bằng client-side router
  → Hoàn thiện permission-level guard
  → Verify edge login URL locale handling
```

---

## 3. KIẾN TRÚC ĐỀ XUẤT (CẬP NHẬT)

> Phần lớn đã được implement. Chỉ highlight những gì cần thay đổi.

### 3.1 Cấu trúc thư mục — Trạng thái thực tế

```
src/navigation/                    ✅ ĐÃ TỒN TẠI
├── routes.ts                      ✅ 26 routes, ROLE_LEVEL, filterAccessibleAdminRoutes()
├── router.tsx                     ✅ NavLink, useAppRouter()
├── guards.ts                      ✅ canAccessAdminPath, canSeeNavItem
├── middleware-auth.ts             ✅ checkEdgeAuth, stripLocaleFromAdmin
├── utils.ts                       ✅ getLoginRedirectUrl, buildLoginUrl
└── types.ts                       ✅ Re-export all types

src/
├── contexts/                       ⚠️ KHÔNG TỒN TẠI — AuthContext đã được xóa
├── app/admin/layout.tsx           🔴 CẦN SỬA — SessionProvider thừa
└── app/admin/components/
    ├── admin-auth-provider.tsx     🔴 CẦN SỬA — window.location.href trong logout
    ├── admin-shell.tsx             🟠 CẦN SỬA — intl router cho admin route
    └── admin-sidebar.tsx            ✅ ĐANG DÙNG nav utilities đúng cách
```

```
src/
├── navigation/
│   ├── routes.ts              ← ĐỊNH NGHĨA TẤT CẢ ROUTES (SOURCE OF TRUTH)
│   ├── router.ts              ← Navigation helpers (navigate, redirect, getLocaleRedirect)
│   ├── guards.ts              ← Auth guards (withAuth, withRole, withPermission)
│   ├── middleware-auth.ts     ← Edge auth logic (tách từ middleware.ts)
│   └── types.ts               ← Navigation types
├── contexts/
│   └── AuthContext.tsx         ← ⭐ HỢP NHẤT: XÓA AuthContext rút gọn,
│                                  CHUYỂN sang dùng AdminAuthContext
├── middleware.ts              ← ⭐ REFACTOR: gọi navigation/middleware-auth.ts
└── i18n/routing.ts            ← Giữ nguyên (next-intl wrappers)

src/app/
├── admin/
│   ├── layout.tsx              ← ⭐ REFACTOR: bỏ SessionProvider thừa
│   ├── components/
│   │   ├── admin-shell.tsx     ← ⭐ REFACTOR: dùng nav/router.ts
│   │   ├── admin-sidebar.tsx    ← ⭐ REFACTOR: dùng nav/routes.ts
│   │   └── admin-auth-provider.tsx ← ⭐ REFACTOR: dùng nav/router.ts
│   └── ...                     ← 25 admin pages (xem 3.5)
└── [locale]/
    ├── layout.tsx
    ├── login/page.tsx           ← ⭐ REFACTOR: dùng useAdminAuth() + nav/router.ts
    └── account/page.tsx        ← ⭐ REFACTOR: dùng nav/router.ts
```

### 3.2 Route Definitions — `src/navigation/routes.ts` ✅ ĐÃ IMPLEMENT

```typescript
// ✅ ĐÃ TỒN TẠI TẠI: src/navigation/routes.ts
// 26 routes đầy đủ với role levels và nav groups
// ⚠️ NOTE: Không có `requiredPermissions` field như trong plan gốc
//   → Role-level check chỉ dùng minRoleLevel
//   → Permission-level guard cần bổ sung
```

<details>
<summary>Xem code hiện tại của routes.ts</summary>

```typescript
// src/navigation/routes.ts — TRÍCH ĐOẠN

export const ROLE_LEVEL: Record<string, number> = {
  ceo: -1, super_admin: 0, admin: 1, project_manager: 2,
  media: 3, qa: 4, member: 5,
};

export interface RouteConfig {
  path: string;
  scope: RouteScope;
  minRoleLevel?: number;       // ← Chỉ có role level, KHÔNG có requiredPermissions
  labelKey: string;
  icon?: string;
  navGroup?: AdminNavGroup;
}

export const ADMIN_ROUTES = {
  // 26 entries — đầy đủ
} as const satisfies Record<string, AdminRouteConfig>;

// ✅ filterAccessibleAdminRoutes(userRoleLevel) — role-level only
// ✅ groupAdminRoutesByNavGroup(routes) — đúng
// ⚠️ KHÔNG CÓ: requiredPermissions check
```

</details>

### 3.2b Missing: `requiredPermissions` Field

**Plan gốc** định nghĩa `requiredPermissions: string[]` trong `RouteConfig`, nhưng **thực tế** `routes.ts` chỉ có `minRoleLevel`. Điều này có ý nghĩa quan trọng:

```
Thực tế hiện tại:
  → Route check chỉ dùng role level (admin vs member)
  → 2 người cùng role sẽ thấy TẤT CẢ nav items
  → Không phân biệt quyền "xem" vs "sửa" vs "xóa"

Plan gốc muốn:
  → Route check dùng permissions array
  → Nav items ẩn nếu user không có permission cụ thể
  → Ví dụ: "member" role có thể thấy nav nhưng không có quyền vào route
```

**Recommendation**: Thêm `requiredPermissions?: string[]` vào `RouteConfig` và `filterAccessibleAdminRoutes()`. Tuy nhiên, đây là **medium priority** — hệ thống hiện tại hoạt động đúng với role-level.

```typescript
// ============================================================
// SOURCE OF TRUTH cho TẤT CẢ routes trong ứng dụng
// ============================================================

import { defineRoutes } from "@/i18n/routing";

// ── Role Levels ───────────────────────────────────────────
export const ROLE_LEVEL = {
  ceo: -1,
  super_admin: 0,
  admin: 1,
  project_manager: 2,
  media: 3,
  qa: 4,
  member: 5,
} as const;

export type RoleKey = keyof typeof ROLE_LEVEL;
export type RoleLevel = (typeof ROLE_LEVEL)[keyof typeof ROLE_LEVEL];

// ── Permission Definitions ─────────────────────────────────
export const PERMISSIONS = {
  // Content
  MANAGE_HOME_SLIDERS: "content:home_sliders:manage",
  MANAGE_LANDING_PAGES: "content:landing_pages:manage",
  MANAGE_SERVICES: "content:services:manage",
  MANAGE_EXPERTISES: "content:expertises:manage",
  MANAGE_TEAM: "content:team:manage",
  MANAGE_PROJECTS: "content:projects:manage",
  MANAGE_TESTIMONIALS: "content:testimonials:manage",
  MANAGE_MESSAGES: "content:messages:manage",
  // Sales
  MANAGE_ORDERS: "sales:orders:manage",
  MANAGE_WEB_TEMPLATES: "sales:web_templates:manage",
  MANAGE_SERVICE_ATTRS: "sales:service_attributes:manage",
  MANAGE_ADDON_SERVICES: "sales:addon_services:manage",
  MANAGE_REWARD_TIERS: "sales:reward_tiers:manage",
  MANAGE_PACKAGES: "sales:packages:manage",
  MANAGE_HOSTING: "sales:hosting_plans:manage",
  MANAGE_DOMAINS: "sales:domain_prices:manage",
  MANAGE_DEPLOYMENT: "sales:deployment_items:manage",
  MANAGE_PRICING_FEATURES: "sales:pricing_features:manage",
  MANAGE_QUOTE_REQUESTS: "sales:quote_requests:manage",
  // System
  MANAGE_STAFF_USERS: "system:staff_users:manage",
  MANAGE_ROLES: "system:roles:manage",
  MANAGE_POINTS: "system:points:manage",
  MANAGE_WEBSITES: "system:websites:manage",
  MANAGE_AUDIT_LOG: "system:audit_log:read",
  MANAGE_SETTINGS: "system:settings:manage",
} as const;

// ── Route Types ────────────────────────────────────────────
export type RouteScope = "public" | "auth" | "admin";

export interface RouteConfig {
  /** Vị trí route (không có locale prefix cho admin) */
  path: string;
  /** Phạm vi: public = ai cũng vào, auth = cần login, admin = cần admin role */
  scope: RouteScope;
  /** Role tối thiểu để truy cập (admin scope) */
  minRoleLevel?: RoleLevel;
  /** Permissions cần thiết (OR logic — chỉ cần 1 trong số) */
  requiredPermissions?: string[];
  /** Redirect path khi không có quyền */
  accessDeniedPath?: string;
  /** Label i18n key */
  labelKey: string;
  /** Icon component name (Lucide) */
  icon?: string;
  /** Nhóm nav (admin sidebar) */
  navGroup?: AdminNavGroup;
}

export type AdminNavGroup =
  | "content"
  | "sales"
  | "system";

// ── Route Registry ─────────────────────────────────────────

export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/services",
  "/portfolio",
  "/pricing",
  "/contact",
  "/team-list",
  "/blog",
  "/[slug]",
] as const;

export const AUTH_ROUTES = ["/account"] as const;

export const ADMIN_ROUTES = {
  dashboard: {
    path: "/admin",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.member,
    labelKey: "nav.admin.dashboard",
    icon: "LayoutDashboard",
    navGroup: undefined,
  },
  "content/home-sliders": {
    path: "/admin/content/home-sliders",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_HOME_SLIDERS],
    labelKey: "nav.admin.content.homeSliders",
    icon: "Image",
    navGroup: "content" as AdminNavGroup,
  },
  "content/landing-pages": {
    path: "/admin/content/landing-pages",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_LANDING_PAGES],
    labelKey: "nav.admin.content.landingPages",
    icon: "FileText",
    navGroup: "content" as AdminNavGroup,
  },
  "content/services": {
    path: "/admin/content/services",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    requiredPermissions: [PERMISSIONS.MANAGE_SERVICES],
    labelKey: "nav.admin.content.services",
    icon: "Briefcase",
    navGroup: "content" as AdminNavGroup,
  },
  "content/expertises": {
    path: "/admin/content/expertises",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    requiredPermissions: [PERMISSIONS.MANAGE_EXPERTISES],
    labelKey: "nav.admin.content.expertises",
    icon: "Zap",
    navGroup: "content" as AdminNavGroup,
  },
  "content/team": {
    path: "/admin/content/team",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    requiredPermissions: [PERMISSIONS.MANAGE_TEAM],
    labelKey: "nav.admin.content.team",
    icon: "Users",
    navGroup: "content" as AdminNavGroup,
  },
  "content/projects": {
    path: "/admin/content/projects",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    requiredPermissions: [PERMISSIONS.MANAGE_PROJECTS],
    labelKey: "nav.admin.content.projects",
    icon: "FolderOpen",
    navGroup: "content" as AdminNavGroup,
  },
  "content/testimonials": {
    path: "/admin/content/testimonials",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.media,
    requiredPermissions: [PERMISSIONS.MANAGE_TESTIMONIALS],
    labelKey: "nav.admin.content.testimonials",
    icon: "MessageSquare",
    navGroup: "content" as AdminNavGroup,
  },
  "content/messages": {
    path: "/admin/content/messages",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.member,
    requiredPermissions: [PERMISSIONS.MANAGE_MESSAGES],
    labelKey: "nav.admin.content.messages",
    icon: "Mail",
    navGroup: "content" as AdminNavGroup,
  },
  "sales/orders": {
    path: "/admin/sales/orders",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.project_manager,
    requiredPermissions: [PERMISSIONS.MANAGE_ORDERS],
    labelKey: "nav.admin.sales.orders",
    icon: "ShoppingCart",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/web-templates": {
    path: "/admin/sales/web-templates",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_WEB_TEMPLATES],
    labelKey: "nav.admin.sales.webTemplates",
    icon: "Monitor",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/service-attributes": {
    path: "/admin/sales/service-attributes",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_SERVICE_ATTRS],
    labelKey: "nav.admin.sales.serviceAttributes",
    icon: "Settings2",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/addon-services": {
    path: "/admin/sales/addon-services",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_ADDON_SERVICES],
    labelKey: "nav.admin.sales.addonServices",
    icon: "PackagePlus",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/reward-tiers": {
    path: "/admin/sales/reward-tiers",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_REWARD_TIERS],
    labelKey: "nav.admin.sales.rewardTiers",
    icon: "Gift",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/packages": {
    path: "/admin/sales/packages",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_PACKAGES],
    labelKey: "nav.admin.sales.packages",
    icon: "Box",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/hosting-plans": {
    path: "/admin/sales/hosting-plans",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_HOSTING],
    labelKey: "nav.admin.sales.hostingPlans",
    icon: "Server",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/domain-prices": {
    path: "/admin/sales/domain-prices",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_DOMAINS],
    labelKey: "nav.admin.sales.domainPrices",
    icon: "Globe",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/deployment-items": {
    path: "/admin/sales/deployment-items",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_DEPLOYMENT],
    labelKey: "nav.admin.sales.deploymentItems",
    icon: "Rocket",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/pricing-features": {
    path: "/admin/sales/pricing-features",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_PRICING_FEATURES],
    labelKey: "nav.admin.sales.pricingFeatures",
    icon: "DollarSign",
    navGroup: "sales" as AdminNavGroup,
  },
  "sales/quote-requests": {
    path: "/admin/sales/quote-requests",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.member,
    requiredPermissions: [PERMISSIONS.MANAGE_QUOTE_REQUESTS],
    labelKey: "nav.admin.sales.quoteRequests",
    icon: "FileSpreadsheet",
    navGroup: "sales" as AdminNavGroup,
  },
  "system/staff-users": {
    path: "/admin/system/staff-users",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_STAFF_USERS],
    labelKey: "nav.admin.system.staffUsers",
    icon: "UserCog",
    navGroup: "system" as AdminNavGroup,
  },
  "system/roles": {
    path: "/admin/system/roles",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.super_admin,
    requiredPermissions: [PERMISSIONS.MANAGE_ROLES],
    labelKey: "nav.admin.system.roles",
    icon: "Shield",
    navGroup: "system" as AdminNavGroup,
  },
  "system/points": {
    path: "/admin/system/points",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_POINTS],
    labelKey: "nav.admin.system.points",
    icon: "Star",
    navGroup: "system" as AdminNavGroup,
  },
  "system/websites": {
    path: "/admin/system/websites",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_WEBSITES],
    labelKey: "nav.admin.system.websites",
    icon: "Globe2",
    navGroup: "system" as AdminNavGroup,
  },
  "system/audit-log": {
    path: "/admin/system/audit-log",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.admin,
    requiredPermissions: [PERMISSIONS.MANAGE_AUDIT_LOG],
    labelKey: "nav.admin.system.auditLog",
    icon: "ScrollText",
    navGroup: "system" as AdminNavGroup,
  },
  "system/settings": {
    path: "/admin/system/settings",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.super_admin,
    requiredPermissions: [PERMISSIONS.MANAGE_SETTINGS],
    labelKey: "nav.admin.system.settings",
    icon: "Settings",
    navGroup: "system" as AdminNavGroup,
  },
  "access-denied": {
    path: "/admin/access-denied",
    scope: "admin" as const,
    minRoleLevel: ROLE_LEVEL.member,
    labelKey: "nav.admin.accessDenied",
    icon: "Lock",
    navGroup: undefined,
  },
} as const satisfies Record<string, RouteConfig>;

// ── Helper: Tìm route config từ path ────────────────────
export function findRouteConfig(path: string): RouteConfig | undefined {
  return Object.values(ADMIN_ROUTES).find((r) => r.path === path);
}

// ── Helper: Lọc nav items theo user ────────────────────────
export function filterAccessibleRoutes(user: {
  roleLevel: number;
  permissions: string[];
}): RouteConfig[] {
  return Object.values(ADMIN_ROUTES).filter((route) => {
    if (route.scope !== "admin") return false;
    if (route.minRoleLevel !== undefined && user.roleLevel > route.minRoleLevel)
      return false;
    if (route.requiredPermissions) {
      const hasPermission = route.requiredPermissions.some((p) =>
        user.permissions.includes(p)
      );
      if (!hasPermission) return false;
    }
    return true;
  });
}

// ── Helper: Nhóm nav items ─────────────────────────────────
export function groupRoutesByNavGroup(
  routes: RouteConfig[]
): Record<AdminNavGroup, RouteConfig[]> {
  return routes.reduce(
    (acc, route) => {
      if (route.navGroup) {
        acc[route.navGroup].push(route);
      }
      return acc;
    },
    { content: [], sales: [], system: [] } as Record<AdminNavGroup, RouteConfig[]>
  );
}
```

### 3.3 Navigation Router — `src/navigation/router.tsx` ✅ ĐÃ IMPLEMENT

```typescript
// ✅ ĐÃ TỒN TẠI TẠI: src/navigation/router.tsx
// ⚠️ NOTE: Plan gốc gọi file là router.ts nhưng thực tế là router.tsx
// ⚠️ ISSUE: navigate() cho admin routes dùng nextRouter.push()
//   nhưng plan gốc muốn dùng window.location.href
//   Thực tế: dùng nextRouter.push() cho admin là ĐÚNG
```

### 3.4 Auth Guards — `src/navigation/guards.ts` ✅ ĐÃ IMPLEMENT (PHẦN LỚN)

```typescript
// ✅ ĐÃ TỒN TẠI TẠI: src/navigation/guards.ts
// ⚠️ NOTE: Plan gốc muốn server-side guards (requireSession, requireAdmin)
//   nhưng thực tế guards.ts chỉ có client-side functions
// ⚠️ ISSUE CẦN SỬA: canAccessAdminPath() chưa check permissions array
//   → Có TODO comment: "// TODO: Permission-level check when permission registry is added"
```

### 3.5 Middleware Auth — `src/navigation/middleware-auth.ts` ✅ ĐÃ IMPLEMENT

```typescript
// ✅ ĐÃ TỒN TẠI TẠI: src/navigation/middleware-auth.ts
// ⚠️ ISSUE CẦN SỬA: buildLoginUrl("/admin") dùng defaultLocale
//   → Nếu defaultLocale ≠ "vi" → redirect sai
```

### 3.6 Refactored Middleware — `src/middleware.ts` ✅ ĐÃ IMPLEMENT

```typescript
// ✅ ĐÃ TỒN TẠI TẠI: src/middleware.ts
// Hoàn toàn clean — 62 lines so với ~210 lines plan gốc
// Sử dụng: intlMiddleware + checkEdgeAuth + stripLocaleFromAdmin
```

### 3.7 Cấu trúc thực tế của `admin-auth-provider.tsx`

```typescript
// src/app/admin/components/admin-auth-provider.tsx — ACTUAL STATE

export function AdminAuthProvider({ children }) {
  // ...
  const logout = useCallback(async () => {
    await Promise.allSettled([
      fetch("/api/admin/auth/logout", { method: "POST" }),
    ]);
    setUser(null);
    const locale = window.location.pathname.match(/^\/(vi|en)/)?.[1] ?? "vi";
    window.location.href = `/${locale}/login`;  // 🔴 ISSUE B: full-page reload
  }, []);
}

// ⚠️ Nên dùng: useAppRouter().navigate() hoặc useRouter().push()
```

---

## 4. CÁC BƯỚC THỰC HIỆN CHI TIẾT (CẬP NHẬT)

> **Thứ tự ưu tiên mới** — dựa trên kết quả validation

---

### New Phase 1: Critical — Xóa `SessionProvider` + Fix `window.location.href`

**Mục tiêu**: Loại bỏ 2 vấn đề critical ngay

#### B1.1: Xóa `SessionProvider` khỏi `admin/layout.tsx`

**File**: `src/app/admin/layout.tsx`

```typescript
// TRƯỚC:
import { SessionProvider } from "next-auth/react";
<SessionProvider>
  <AdminShell>{children}</AdminShell>
  <AdminToaster />
</SessionProvider>

// SAU:
// Admin auth hoàn toàn dùng custom JWT qua cookies
// AdminAuthProvider được wrap ở root layout hoặc layout.tsx (cần verify)
<AdminShell>{children}</AdminShell>
<AdminToaster />
```

**Lưu ý**: Cần verify `AdminAuthProvider` được wrap ở đâu trong root layout trước khi xóa `SessionProvider`.

#### B1.2: Sửa `AdminAuthProvider.logout()`

**File**: `src/app/admin/components/admin-auth-provider.tsx`

```typescript
// TRƯỚC (line 100-108):
const logout = useCallback(async () => {
  await Promise.allSettled([fetch("/api/admin/auth/logout", { method: "POST" })]);
  setUser(null);
  const locale = window.location.pathname.match(/^\/(vi|en)/)?.[1] ?? "vi";
  window.location.href = `/${locale}/login`;  // 🔴 full-page reload
}, []);

// SAU: Dùng useRouter từ next/navigation
import { useRouter as useNextRouter } from "next/navigation";

export function AdminAuthProvider({ children }) {
  const nextRouter = useNextRouter();
  // ...

  const logout = useCallback(async () => {
    await Promise.allSettled([fetch("/api/admin/auth/logout", { method: "POST" })]);
    setUser(null);
    const locale = window.location.pathname.match(/^\/(vi|en)/)?.[1] ?? routing.defaultLocale;
    nextRouter.push(`/${locale}/login`);  // ✅ client-side navigation
  }, [nextRouter]);
}
```

> ⚠️ **Cẩn thận**: `useRouter` phải được gọi bên trong component (không phải callback). Cần tách `logout` ra để dùng `router` từ hook scope, hoặc dùng `window.location.assign()` như fallback.

#### B1.3: Sửa `login-page.tsx` redirect

**File**: `src/app/[locale]/login/login-page.tsx`

```typescript
// TRƯỚC (line 37-38):
} else {
  const destination = redirectTo || "/admin";
  window.location.href = destination;  // 🔴 full-page reload
}

// SAU:
import { useRouter as useNextRouter } from "next/navigation";

} else {
  const destination = redirectTo || "/admin";
  const nextRouter = useRouter(); // ← cần import trước
  nextRouter.push(destination);
}
```

---

### New Phase 2: High Priority — Router consistency

#### B2.1: Sửa `AdminShell` LoginForm redirect

**File**: `src/app/admin/components/admin-shell.tsx`

```typescript
// TRƯỚC (line 126):
router.push("/admin");  // ← dùng intl router cho admin route

// SAU:
// Import useRouter từ next/navigation
import { useRouter as useNextAdminRouter } from "next/navigation";
// Trong LoginForm component:
const adminRouter = useNextAdminRouter();
adminRouter.push("/admin");  // ✅
```

#### B2.2: Fix hardcoded `vi` fallback

**File**: `src/app/admin/components/admin-auth-provider.tsx`

```typescript
// TRƯỚC:
const locale = window.location.pathname.match(/^\/(vi|en)/)?.[1] ?? "vi";

// SAU:
import { routing } from "@/i18n/routing";
const locale = window.location.pathname.match(/^\/(vi|en)/)?.[1] ?? routing.defaultLocale;
```

---

### New Phase 3: Medium Priority — Permission-level guard

#### B3.1: Thêm `requiredPermissions` vào `RouteConfig`

**File**: `src/navigation/routes.ts`

```typescript
// Thêm vào RouteConfig interface:
export interface RouteConfig {
  path: string;
  scope: RouteScope;
  minRoleLevel?: number;
  /** Permissions cần thiết (OR logic) — nếu có, user cần ÍT NHẤT 1 permission */
  requiredPermissions?: string[];
  labelKey: string;
  icon?: string;
  navGroup?: AdminNavGroup;
}

// Thêm vào ADMIN_ROUTES (ví dụ):
"content/home-sliders": {
  path: "/admin/content/home-sliders",
  scope: "admin" as const,
  minRoleLevel: ROLE_LEVEL.admin,
  requiredPermissions: ["content:home_sliders:manage"],
  labelKey: "nav.admin.content.homeSliders",
  icon: "Image",
  navGroup: "content",
},
```

#### B3.2: Update `filterAccessibleAdminRoutes()`

**File**: `src/navigation/routes.ts`

```typescript
// TRƯỚC:
export function filterAccessibleAdminRoutes(userRoleLevel: number): AdminRouteConfig[] {
  return Object.values(ADMIN_ROUTES).filter(
    (route) => userRoleLevel <= route.minRoleLevel
  );
}

// SAU:
export function filterAccessibleAdminRoutes(
  userRoleLevel: number,
  userPermissions: string[] = []
): AdminRouteConfig[] {
  return Object.values(ADMIN_ROUTES).filter((route) => {
    // Role check
    if (userRoleLevel > route.minRoleLevel) return false;
    // Permission check (nếu route yêu cầu)
    if (route.requiredPermissions?.length) {
      const hasPermission = route.requiredPermissions.some((p) =>
        userPermissions.includes(p)
      );
      if (!hasPermission) return false;
    }
    return true;
  });
}
```

#### B3.3: Update `canAccessAdminPath()` guard

**File**: `src/navigation/guards.ts`

```typescript
// Thêm permission check
export function canAccessAdminPath(
  user: AuthUser | null,
  path: string
): AccessCheckResult {
  if (!user) return { allowed: false, reason: "unauthenticated", redirectUrl: getLoginRedirectUrl(path) };
  const route = getAdminRouteConfig(path);
  if (!route || route.scope !== "admin") return { allowed: true };

  if (user.roleLevel > route.minRoleLevel) {
    return { allowed: false, reason: "insufficient_role", redirectUrl: "/admin/access-denied" };
  }

  // ✅ Thêm permission check
  if (route.requiredPermissions?.length) {
    const hasPermission = route.requiredPermissions.some((p) =>
      user.permissions.some((up) => up.resource === p.split(":")[0] && up.action === p.split(":")[1])
    );
    if (!hasPermission) {
      return { allowed: false, reason: "insufficient_permission", redirectUrl: "/admin/access-denied" };
    }
  }

  return { allowed: true };
}
```

#### B3.4: Update `admin-sidebar.tsx` nav filter

**File**: `src/app/admin/components/admin-sidebar.tsx`

```typescript
// TRƯỚC (line 94):
const accessible = filterAccessibleAdminRoutes(user.roleLevel);

// SAU: Truyền cả permissions
const accessible = filterAccessibleAdminRoutes(
  user.roleLevel,
  user.permissions.map((p) => `${p.resource}:${p.action}`)
);
```

---

### New Phase 4: Low Priority — Cleanup & Verification

#### B4.1: Verify `AdminAuthProvider` vị trí

Cần xác định `AdminAuthProvider` được wrap ở đâu trong root layout. Nếu không có → thêm vào `src/app/layout.tsx`.

#### B4.2: Fix edge `buildLoginUrl` locale fallback

**File**: `src/navigation/middleware-auth.ts`

```typescript
// Khi pathname không có locale prefix (e.g. /admin):
// current: dùng routing.defaultLocale
// better: nên dùng request headers Accept-Language hoặc cookie preference
export function buildLoginUrl(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  return `/${locale}/login${pathname ? `?redirect=${encodeURIComponent(pathname)}` : ""}`;
}
```

#### B4.3: Xóa `login-page.tsx` Google Sign-In hardcoded URL

**File**: `src/app/[locale]/login/login-page.tsx`

```typescript
// TRƯỚC (line 95):
onClick={() => signIn("google", { callbackUrl: `${window.location.origin}/vi` })}

// SAU:
onClick={() => signIn("google", { callbackUrl: `${window.location.origin}` })}
// → Next-intl middleware sẽ redirect về đúng locale
```

#### B4.4: Server-side guard (optional)

Nếu muốn defense-in-depth hoàn chỉnh, tạo server component wrapper:

```typescript
// src/navigation/server-guards.ts
export async function requireAdminSession(minRoleLevel = 5): Promise<SessionUser> {
  // Gọi server-side auth
  const session = await getSession();
  if (!session?.user) redirect("/vi/login");
  if (session.user.roleLevel > minRoleLevel) redirect("/admin/access-denied");
  return session.user;
}
```

---

## 5. MỞ RỘNG TRONG TƯƠNG LAI (CẬP NHẬT)

> Phần này đã chính xác với thực tế. Chỉ cần xóa TODO comment.

### Thêm route mới ✅ (đã hoạt động)

```typescript
// Chỉ cần thêm vào ADMIN_ROUTES trong routes.ts
"content/case-studies": {
  path: "/admin/content/case-studies",
  scope: "admin" as const,
  minRoleLevel: ROLE_LEVEL.media,
  requiredPermissions: ["content:case_studies:manage"],  // ← Sau khi add B3.1
  labelKey: "nav.admin.content.caseStudies",
  icon: "BookOpen",
  navGroup: "content",
},
// → Sidebar tự động hiển thị nếu user có quyền
// → Middleware tự động check auth
// → Không cần sửa file nào khác
```

### Thêm role mới ✅ (đã hoạt động)

```typescript
// Chỉ cần thêm vào ROLE_LEVEL trong routes.ts
export const ROLE_LEVEL = {
  // ... existing
  intern: 6,  // ← Thêm mới
};
// → Tất cả nav items dùng minRoleLevel tự động áp dụng
```

### Thêm permission mới

```typescript
// Cần thêm requiredPermissions field (Phase 3)
// Sau đó gán vào bất kỳ route nào trong ADMIN_ROUTES
```

### Thêm locale mới ✅ (đã hoạt động)

```typescript
// Chỉ cần cập nhật routing.ts (next-intl)
locales: ['vi', 'en', 'ja'],  // ← Thêm 'ja'
// → Navigation utility tự động hỗ trợ locale mới
```

### Thêm route group mới

```typescript
// Thêm group trong AdminNavGroup type
export type AdminNavGroup = "content" | "sales" | "system" | "reports";
// → Sidebar tự động render group mới
// ⚠️ Cần cập nhật GROUP_LABELS trong admin-sidebar.tsx
```

### Thêm route mới

```typescript
// Chỉ cần thêm vào ADMIN_ROUTES trong routes.ts
"content/case-studies": {
  path: "/admin/content/case-studies",
  scope: "admin",
  minRoleLevel: ROLE_LEVEL.media,
  requiredPermissions: ["content:case_studies:manage"],
  labelKey: "nav.admin.content.caseStudies",
  icon: "BookOpen",
  navGroup: "content",
},
// → Sidebar tự động hiển thị nếu user có quyền
// → Middleware tự động check auth
// → Không cần sửa file nào khác
```

### Thêm role mới

```typescript
// Chỉ cần thêm vào ROLE_LEVEL trong routes.ts
export const ROLE_LEVEL = {
  // ... existing
  intern: 6,  // ← Thêm mới
} as const;
// → Tất cả nav items dùng minRoleLevel tự động áp dụng
```

### Thêm permission mới

```typescript
// Chỉ cần thêm vào PERMISSIONS trong routes.ts
ANALYTICS_VIEW: "analytics:view:read",
// → Gán vào bất kỳ route nào trong ADMIN_ROUTES
```

### Thêm locale mới

```typescript
// Chỉ cần cập nhật routing.ts (next-intl)
locales: ['vi', 'en', 'ja'],  // ← Thêm 'ja'
// → Navigation utility tự động hỗ trợ locale mới
```

### Thêm route group mới

```typescript
// Thêm group trong AdminNavGroup type
export type AdminNavGroup = "content" | "sales" | "system" | "reports";
// → Sidebar tự động render group mới
```

---

## 6. SO SÁNH TRƯỚC & SAU (CẬP NHẬT 2026-03-22)

| Tiêu chí | **Trước (plan gốc)** | **Thực tế (sau validation)** | **Sau implement** |
|---------|---------------------|---------------------------|----------------|
| Auth systems | 2 (AdminAuth + AuthContext) | ✅ 1 (chỉ AdminAuthProvider) | ✅ |
| Navigation utilities | 0 files | ✅ 6 files trong `src/navigation/` | ✅ |
| Locale-aware redirects | Hardcoded `vi` | ✅ `getLoginRedirectUrl()` tự động | ✅ |
| Logout cookies | Thiếu `auth-method` | ✅ Xóa cả 2 cookies | ✅ |
| Sidebar logic | `canAccessNav(role)` string | ✅ `filterAccessibleAdminRoutes()` | ✅ |
| Permission check | Role-only | ⚠️ Role-only, chưa có permissions | ✅ **Đã thêm** |
| Route definition | 25 files rải rác | ✅ 1 registry trong `routes.ts` | ✅ |
| Extension time | 30+ phút/file | ✅ 1 khai báo | ✅ |
| Middleware LOC | ~210 lines | ✅ ~62 lines | ✅ |
| Admin layout | SessionProvider thừa | ⚠️ Vẫn có | ✅ **Đã xóa** |
| Logout navigation | `window.location.href` | ⚠️ Vẫn dùng | ✅ **Đã sửa** |
| Login navigation | `window.location.href` | ⚠️ Vẫn dùng | ✅ **Đã sửa** |
| Hardcoded `vi` fallback | Nhiều chỗ | ⚠️ Vẫn dùng | ✅ **Đã sửa** |
| Google OAuth callback | Hardcoded `/vi` | ⚠️ Vẫn dùng | ✅ **Đã sửa** |
| Edge login locale | `defaultLocale` | ⚠️ Có thể sai locale | ✅ **Đã sửa** |
| Server-side guard | Không có | ⚠️ Chỉ client | ✅ **Đã thêm** |
| TypeScript errors | 61 lỗi trong test + admin pages | ⚠️ Pre-existing | ✅ **0 lỗi** |

---

## 7. DEPENDENCIES & RISKS (CẬP NHẬT)

### Dependencies ✅ KHÔNG CÓ
- `next-intl` v4 — đã dùng
- `next-auth` v5 — đã dùng
- **Không cần thêm package nào**

### Migration Risks

| Rủi ro | Mức | Mitigation |
|--------|-----|-----------|
| Xóa SessionProvider → breaking auth | 🔴 Cao | Verify AdminAuthProvider wrap trước |
| window.location.href → router redirect | 🟠 Trung | Chỉ ảnh hưởng logout/login redirect |
| Permission guard change | 🟡 Thấp | Backward compatible nếu giữ role-only fallback |

### Rollback Plan
- Git branch riêng cho New Phase 1
- Test flow: login → admin nav → logout → public nav → login redirect
- Test với cả credentials + Google OAuth

---

## 8. CHECKLIST HOÀN THÀNH (CẬP NHẬT 2026-03-22)

```
✅ ĐÃ XONG — Navigation Infrastructure (từ plan gốc)
  ✅ B1.1: src/navigation/routes.ts — 26 routes, ROLE_LEVEL
  ✅ B1.2: ADMIN_ROUTES registry đầy đủ
  ✅ B1.3: filterAccessibleAdminRoutes() hoạt động
  ✅ B1.4: NavLink + useAppRouter() hoạt động
  ✅ B1.5: getLoginRedirectUrl() hoạt động

✅ ĐÃ XONG — Auth System Unification (từ plan gốc)
  ✅ B2.1: login-page.tsx dùng useAdminAuth()
  ✅ B2.2: account/page.tsx dùng useAdminAuth()
  ✅ B2.3: contexts/AuthContext.tsx KHÔNG TỒN TẠI
  ✅ B2.4: logout API xóa cả 2 cookies
  ✅ B2.5: Không có nextSignOut() ở đâu

✅ ĐÃ XONG — Admin Shell & Sidebar Refactor (từ plan gốc)
  ✅ B3.1: Sidebar dùng nav utilities (filterAccessibleAdminRoutes)
  ✅ B3.2: AdminShell dùng canAccessAdminPath()
  ✅ B3.3: SessionProvider ĐÃ XÓA (2026-03-22)

✅ ĐÃ XONG — Middleware Refactor (từ plan gốc)
  ✅ B4.1-B4.3: Middleware gọn + locale-aware

🟡 NEW PHASE 1 — CRITICAL (ĐÃ IMPLEMENT 2026-03-22)
  ✅ N1.1: Verify AdminAuthProvider vị trí — tại root layout (src/app/layout.tsx)
  ✅ N1.2: Xóa SessionProvider khỏi admin/layout.tsx
  ✅ N1.3: Sửa AdminAuthProvider.logout() — router.push() thay window.location.href
  ✅ N1.4: Sửa login-page.tsx redirect — router.push() thay window.location.href

🟡 NEW PHASE 2 — HIGH PRIORITY (ĐÃ IMPLEMENT 2026-03-22)
  ✅ N2.1: Sửa AdminShell LoginForm — dùng nextRouter trong component
  ✅ N2.2: Fix hardcoded "vi" fallback → routing.defaultLocale trong logout

🟡 NEW PHASE 3 — MEDIUM PRIORITY (ĐÃ IMPLEMENT 2026-03-22)
  ✅ N3.1: Dùng NAV_PERMISSIONS từ roles.ts — đã có đủ permissions
  ✅ N3.2: guards.ts dùng NAV_PERMISSIONS trực tiếp (bỏ filterAccessibleAdminRoutes role-only)
  ✅ N3.3: canAccessAdminPath() — thêm permission check (OR logic)
  ✅ N3.4: admin-sidebar.tsx — dùng canSeeNavItem() + NAV_PERMISSIONS

🟡 NEW PHASE 4 — LOW PRIORITY (ĐÃ IMPLEMENT 2026-03-22)
  ✅ N4.2: Fix edge buildLoginUrl locale fallback — getLocaleFromRequest() đọc `NEXT_LOCALE` cookie + `Accept-Language` header
  ✅ N4.4: Server-side guard — `requireAdmin()` trong admin/layout.tsx + `server-guards.ts` mới

## 9. BONUS — TypeScript Error Cleanup (2026-03-22)

> 0 TypeScript errors trong toàn bộ codebase sau khi fix.

### 9.1 Test files
- **`src/lib/rate-limit.test.ts`**: `limiter.consume(Request)` → `limiter.consume(ip: string)` — phù hợp với `RateLimiter.consume(ip: string)` trong `rate-limit.ts`
- **`src/lib/json-ld.test.ts`**: `member.worksFor` / `post.mainEntityOfPage` → thêm `!` (non-null assertion)

### 9.2 Admin CRUD component + pages
- **`src/components/admin/admin-crud-list.tsx`**: Mở rộng `ColumnDef<T>` hỗ trợ cả `key` (simple) lẫn `accessor` + `cell` (custom render). Thêm `cell` prop với signature `({ row, value }) => ReactNode`.
- **`src/app/admin/content/projects/page.tsx`**: `accessorKey` → `key` + custom `cell`
- **`src/app/admin/content/team/page.tsx`**: `accessorKey` → `key` + custom `cell`
- **`src/app/admin/content/testimonials/page.tsx`**: `accessorKey` → `key` + custom `cell`
- **`src/app/admin/sales/orders/page.tsx`**: `accessorKey` → `key` + custom `cell`
- **`src/app/admin/system/roles/page.tsx`**: `accessorKey` → `key` + custom `cell`
- **`src/app/admin/content/home-sliders/page.tsx`**: xóa `required` không hợp lệ trong `image` formField type

### 9.3 Action type fix
- Thêm `title?: string` vào `Action.view` và `Action.edit` vì các pages dùng `title` prop

---

## 10. FINAL — E2E Tests (CHƯA TEST)
  ☐ Login flow (credentials)
  ☐ Login flow (Google OAuth)
  ☐ Admin navigation (all roles)
  ☐ Public navigation (all locales)
  ☐ Logout (cookies cleared + router redirect)
  ☐ Access denied → redirects correctly
  ☐ Locale switching → redirects preserve locale
  ☐ Server guard: unauthenticated → redirect to /vi/login
  ☐ Edge guard: unauthenticated → redirect preserving locale
```
