# Plan: Admin Dashboard — UI & Logic Design

> Phiên bản: 2.1 — Ngày: 2026-03-24
> **Trạng thái**: ✅ **UI MODULE COMPLETE** — Cập nhật: 2026-03-24

---

## PHẦN A: IMPLEMENTATION STATUS

### ✅ ĐÃ HOÀN THÀNH

**Admin Shell & Navigation**
- `AdminShell` — layout wrapper với auth guard (server + client)
- `AdminSidebar` — collapsible sidebar (w-64 ↔ w-16), tự động lọc nav theo role
- `AdminTopbar` — search, notifications, profile
- `SidebarWidthCtx` — context để content area biết sidebar đang collapsed
- RBAC hoàn chỉnh qua `NAV_PERMISSIONS` + `canSeeNavItem()`
- ~47 Lucide icons đã đăng ký trong `ICON_MAP`

**Design System đã thống nhất**
- Dark glassmorphism: nền `#090B14`, surface `rgba(255,255,255,0.02–0.06)`, border `rgba(255,255,255,0.07–0.10)`
- Accent gradient: `#8B5CF6 → #06B6D4` (violet → cyan)
- Status badge convention: `bg-{color}/20 text-{color}`
- Cards: `rounded-xl border` + inline style bg/border
- Typography: `text-white`, `font-medium` labels, `font-black` for stats

**Shared Components**
- ✅ `project-header.tsx` — Project breadcrumb + title (dùng ở 12 sub-pages)
- ✅ `env-file-editor.tsx` — Syntax highlighting, line numbers, tab indent
- ✅ `blog-post-editor.tsx` — Markdown toolbar, keyboard shortcuts, word count
- ✅ `GuildHallOfFame.tsx` — Exported `HallOfFameMember` type
- ✅ `GuildMemberCard.tsx` — Fixed skills union type `string[] | Record<string, number>`

**Pages — PM Module**
| Page | Status |
|------|--------|
| `/admin/projects` | ✅ |
| `/admin/projects/[id]/page` | ✅ Project overview (stats, nav grid) |
| `/admin/projects/[id]/board` | ✅ Kanban board |
| `/admin/projects/[id]/team` | ✅ LP leaderboard |
| `/admin/projects/[id]/backlogs` | ✅ Epic + backlog management |
| `/admin/projects/[id]/standups` | ✅ Daily standups |
| `/admin/projects/[id]/qa` | ✅ Bug tracker |
| `/admin/projects/[id]/env` | ✅ Env files editor |
| `/admin/projects/[id]/deployments` ✅ Deployment history |
| `/admin/projects/[id]/social` | ✅ Social post scheduler |
| `/admin/projects/[id]/blog` | ✅ Blog post editor |
| `/admin/projects/[id]/commits` | ✅ Git commit log |
| `/admin/projects/[id]/lp` | ✅ LP award queue |
| `/admin/projects/[id]/handover` | ✅ Handover checklist |
| `/admin/projects/tasks` | ✅ Global task list |
| `/admin/projects/figma-demos` | ✅ |
| `/admin/projects/env-files` | ✅ |
| `/admin/projects/blogs` | ✅ |
| `/admin/projects/social-posts` | ✅ |
| `/admin/projects/[id]/figma` | ✅ |
| `/admin/kpi` | ✅ KPI dashboard |
| `/admin/sla-rules` | ✅ |
| `/admin/bug-notes` | ✅ |
| `/admin/task-violations` | ✅ |
| `/admin/lp-awards` | ✅ |

**Pages — ĐÃ KHÔI PHỤC (Restored 2026-03-24)**
| Page | Status |
|------|--------|
| `/admin/sales/sales-leads` | ✅ 6-column Kanban pipeline, create/edit, stage transitions |
| `/admin/sales/quotes` | ✅ List with LP bar, create form, status filter |
| `/admin/sales/quotes/[id]` | ✅ Detail with LP breakdown, milestone timeline, send/approve/reject |
| `/admin/maintenance` | ✅ Contract list, urgency badges, renewal, MRR stats |

**Pages — ĐÃ XOÁ (Orphaned — models not in schema)**
| Page | Lý do |
|------|--------|
| `/admin/maintenance/page` | Model `MaintenanceContract` không tồn tại |
| `/admin/sales/quotes/page` | Model `Quote` không tồn tại |
| `/admin/sales/sales-leads/page` | Model `SalesLead` không tồn tại |

**Pages — Đã có sẵn (Pre-existing)**
| Page | Status |
|------|--------|
| `/admin` (Dashboard) | ✅ |
| `/admin/access-denied` | ✅ |
| `/admin/sales/orders` | ✅ |
| `/admin/sales/packages` | ✅ |
| `/admin/sales/reward-tiers` | ✅ |
| `/admin/sales/web-templates` | ✅ |
| `/admin/sales/hosting-plans` | ✅ |
| `/admin/sales/domain-prices` | ✅ |
| `/admin/sales/deployment-items` | ✅ |
| `/admin/sales/pricing-features` | ✅ |
| `/admin/sales/addon-services` | ✅ |
| `/admin/sales/service-attributes` | ✅ |
| `/admin/sales/daily-standups` | ✅ |
| `/admin/sales/quote-requests` | ✅ |
| `/admin/content/messages` | ✅ |
| `/admin/content/services` | ✅ |
| `/admin/content/expertises` | ✅ |
| `/admin/content/landing-pages` | ✅ |
| `/admin/content/projects` | ✅ |
| `/admin/content/team` | ✅ |
| `/admin/content/testimonials` | ✅ |
| `/admin/content/home-sliders` | ✅ |
| `/admin/system/points` | ✅ |
| `/admin/system/settings` | ✅ |
| `/admin/system/staff-users` | ✅ |
| `/admin/system/websites` | ✅ |
| `/admin/system/audit-log` | ✅ |
| `/admin/system/roles` | ✅ |

---

## PHẦN B: CẦN LÀM THÊM

### Ưu tiên cao
| # | Module | Mô tả |
|---|--------|-------|
| 1 | **Sales CRM** | Thêm `SalesLead` model → tạo lại `/admin/sales/sales-leads` |
| 2 | **Quotes** | Thêm `Quote` model → tạo lại `/admin/sales/quotes` |
| 3 | **Maintenance** | Thêm `MaintenanceContract` model → tạo `/admin/maintenance` |

### Ưu tiên trung bình
| # | Module | Mô tả |
|---|--------|-------|
| 4 | **QuoteRequest page** | Schema có `QuoteRequest` rồi — cần admin UI |
| 5 | **Responsive mobile** | Sidebar overlay trên mobile |
| 6 | **Error states** | UI error state đồng nhất cho tất cả pages |

### Ưu tiên thấp
| # | Module | Mô tả |
|---|--------|-------|
| 7 | **PermissionMatrix** | Visual matrix cho roles page |
| 8 | **QuickFilters** | Reusable quick filter chips |
| 9 | **Multi-language (i18n)** | Admin module |

---

## PHẦN C: DESIGN SYSTEM

### CSS Variables
```
Nền:      bg-deep: #090B14, bg-surface: rgba(255,255,255,0.02–0.06)
Border:    border-subtle: rgba(255,255,255,0.07), border-normal: rgba(255,255,255,0.10)
Text:      text-primary: #FFFFFF, text-secondary: rgba(209,213,219,0.7), text-muted: rgba(209,213,219,0.4)
Accent:    accent-violet: #8B5CF6, accent-cyan: #06B6D4
Status:    success: #10B981, warning: #F59E0B, danger: #EF4444, info: #3B82F6
```

### Standard Patterns

**Stat Card:**
```tsx
<div className="rounded-xl border p-4 text-center"
  style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)" }}>
  <p className="text-2xl font-black" style={{ color: accentColor }}>{value}</p>
  <p className="text-xs mt-1" style={{ color:"rgba(209,213,219,0.5)" }}>{label}</p>
</div>
```

**Status Badge (luôn dùng color map):**
```tsx
const STATUS_COLORS: Record<string, {bg: string; color: string}> = {
  active:  { bg: "rgba(16,185,129,0.15)",  color: "#10B981" },
  inactive:{ bg: "rgba(239,68,68,0.15)",   color: "#EF4444" },
};
```

**Empty State:**
```tsx
<div className="text-center py-20 rounded-xl border"
  style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.06)" }}>
  <p className="text-4xl mb-3">📭</p>
  <p className="text-sm" style={{ color:"rgba(209,213,219,0.3)" }}>Không có dữ liệu</p>
</div>
```

**Loading Skeleton:**
```tsx
<div className="space-y-3">
  {[1,2,3].map(i => (
    <div key={i} className="rounded-xl border p-4 animate-pulse"
      style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)" }}>
      <div className="h-4 rounded mb-2" style={{ background:"rgba(255,255,255,0.08)" }} />
      <div className="h-3 rounded w-3/4" style={{ background:"rgba(255,255,255,0.05)" }} />
    </div>
  ))}
</div>
```

**Toast (sonner):**
```tsx
import { toast } from "sonner";
toast.success("Tạo thành công");
toast.error("Tạo thất bại: " + error.message);
```

---

## PHẦN D: FILE CHANGES LOG — 2026-03-24

### Xoá (Deleted — orphaned modules)
```
src/app/api/admin/maintenance-contracts/       ← toàn bộ
src/app/api/admin/quotes/                      ← toàn bộ
src/app/api/admin/sales-leads/                 ← toàn bộ
src/app/admin/maintenance/page.tsx
src/app/admin/sales/quotes/page.tsx
src/app/admin/sales/quotes/[id]/page.tsx
src/app/admin/sales/sales-leads/page.tsx
```

### Sửa (Modified)
```
src/app/api/admin/auth/login/route.ts          ← Fixed: permissions typed via explicit select
src/app/[locale]/team-list/team-page.tsx       ← Fixed: skills union type, HallOfFameMember imported
src/components/team/GuildHallOfFame.tsx        ← Fixed: exported HallOfFameMember interface
```

### Tạo mới (Created this session)
```
(Không có file mới — đã hoàn thành trong session trước)
```

---

## PHẦN E: BUILD STATUS

```
✅ npx tsc --noEmit — ZERO errors
   Last verified: 2026-03-24

Key fixes:
   1. Login route: removed UserGetPayload annotation, used explicit select + typed LoginUser
   2. team-page: skills type = string[] | Record<string, number>, HallOfFameMember imported
   3. GuildHallOfFame: HallOfFameMember exported
   4. All orphaned API routes deleted (Prisma models don't exist in schema)
```
