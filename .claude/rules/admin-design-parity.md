# Admin Dashboard Design Parity

> **Version**: 2.0.0 · **Updated**: 2026-04-04
> **Source**: `src/components/admin/AdminSidebar.tsx` + `src/app/admin/*/page.tsx`
> **Note**: `FE/` and `DESIGN LOOPS/` were archived (commit `38fa12e`).

---

## Tổng quan

Một codebase admin dashboard — `src/app/admin/` + `src/components/admin/`:

| | Production (Next.js) |
|---|---|
| **Sidebar** | `src/components/admin/AdminSidebar.tsx` (260px) |
| **Topbar** | `src/components/admin/AdminTopbar.tsx` |
| **Admin pages** | 28 pages in `src/app/admin/[tab]/page.tsx` |
| **State** | React Query + Zustand `authStore` (API-backed) |
| **Real-time** | `useRealtimeNotifications` hook |
| **Design tokens** | `src/components/layout/ds.ts` → `@/lib/design-tokens` |

---

## Design Token Map

```typescript
// import { DS, GRD } from '@/lib/design-tokens'

DS.bg          // '#020617'
DS.bgCard      // '#0F172A'
DS.blue        // '#3B82F6'
DS.purple      // '#818CF8'
DS.cyan        // '#14B8A6'
DS.green       // '#22C55E'
DS.amber       // '#F59E0B'
DS.red         // '#EF4444'
DS.text        // '#FFFFFF'
```

---

## Sidebar Layout

```typescript
// Sidebar width: 260px (hardcoded in layout.tsx)
// Groups: 4 (QUẢN LÝ · SẢN PHẨM · TÀI CHÍNH · HỆ THỐNG)
// Logo: SVG hexagon ∞ mark với GRD.primary
// Badge: useAuthStore + canAccessTab(role, dept, tabId)
// usePathname() để highlight active tab
```

---

## Admin Pages (28 routes)

```
/admin/page.tsx              → redirect /admin
/admin/overview/page.tsx      → KPI overview (P2-1: hardcoded → compute from API)
/admin/analytics/page.tsx
/admin/members/page.tsx       → Member CRUD (1,988L)
/admin/leaderboard_admin/page.tsx
/admin/departments/page.tsx
/admin/effects/page.tsx       → ⚠️ READ-ONLY — driven by code
/admin/income_tax/page.tsx
/admin/clients/page.tsx
/admin/orders/page.tsx
/admin/quotation/page.tsx
/admin/revenue/page.tsx
/admin/academy/page.tsx
/admin/blog/page.tsx
/admin/portfolio/page.tsx
/admin/services/page.tsx
/admin/web_packages/page.tsx
/admin/media/page.tsx
/admin/projects/page.tsx
/admin/projects_completed/page.tsx
/admin/lp/page.tsx
/admin/lp_manage/page.tsx
/admin/quests_events/page.tsx
/admin/notification_center/page.tsx
/admin/settings/page.tsx
```

---

## Motion Rules

```typescript
// ✅ Sidebar hover: CSS transition-all
whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}

// ✅ Notification badge: scale animation
animate={{ scale: [1, 1.15, 1] }}

// ✅ Page entrance: opacity + y
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

// ❌ KHÔNG BAO GIỜ:
whileHover={{ borderColor: DS.blue }}
// Thay bằng: CSS transition trên element
```

---

## Role-Based Tab Visibility

```typescript
// src/app/store/authStore.ts — getAccessibleTabs(role, department)

type AdminTab =
  'overview' | 'orders' | 'members' | 'departments' | 'projects'
  | 'services' | 'media' | 'quotation' | 'portfolio' | 'projects_completed'
  | 'academy' | 'blog' | 'revenue' | 'clients' | 'lp' | 'lp_manage'
  | 'income_tax' | 'web_packages' | 'effects' | 'notification_center'
  | 'settings' | 'quests_events' | 'leaderboard_admin' | 'analytics';
```

---

## Fonts & Typography

```typescript
// Heading: Cinzel
fontFamily: "'Cinzel', serif"

// Mono: JetBrains Mono
fontFamily: "'JetBrains Mono', monospace"

// Body: Inter
fontFamily: "'Inter', 'Noto Serif JP', sans-serif"
```

---

## P2 Tasks — Admin Dashboard

| # | File | Mô tả | Priority |
|---|------|--------|---------|
| P2-1 | `src/app/admin/overview/page.tsx` | Hardcoded KPIs → compute from API | HIGH |
| P2-2 | `src/app/admin/members/page.tsx` | Already done (1,988L) ✅ | — |
| P2-10 | Admin layout | Sidebar width: 224px (FE) vs 260px (BE) → BE 260px ✅ | DONE |
| P2-11 | Admin layout | Admin pages cần `useI18n()` labels thay hardcoded | MEDIUM |
| P2-12 | BE overview | Activity feed wired to real data | MEDIUM |

---

## RBAC Reference

> ⚠️ Hai hệ thống RBAC khác nhau. Xem chi tiết: `admin-rbac.md`

**Quick reference:**
- BE production: `src/lib/auth/permissions.ts` — 7 roles, granular DB permissions
- Zustand: `src/app/store/authStore.ts` — 5 roles (admin/manager/staff/client/guest), client-side tabs
