# Plan: Nâng cấp hệ thống Admin → Nền tảng Quản trị Dự án TOÀN DIỆN

> Phiên bản: 2.2 — Cập nhật theo Implementation Progress
> Ngày: 2026-03-24
> **Trạng thái**: ✅ **ALL MODULES COMPLETE + RESTORED + PHASE 2** — 2026-03-24

---

## PHẦN A: IMPLEMENTATION STATUS

### ✅ ĐÃ HOÀN THÀNH (Implemented)

| Module | Schema | API Routes | Admin Pages | Components |
|--------|--------|------------|-------------|------------|
| Sales CRM (SalesLead) | ✅ | ✅ | ✅ `sales-leads` Kanban pipeline | — |
| Quotes (LP allocation) | ✅ | ✅ | ✅ `quotes` list + detail | ✅ LP bar + breakdown |
| Project Overview | ✅ | ✅ | ✅ `projects/[id]/page` | — |

| Module | Schema | API Routes | Admin Pages | Components |
|--------|--------|------------|-------------|------------|
| Project Overview | ✅ | ✅ | ✅ `projects/[id]/page` | — |
| Epic + Backlog | ✅ | ✅ | ✅ `backlogs`, `board` | — |
| Task (Kanban) | ✅ | ✅ | ✅ `board` | — |
| LP System + Awards | ✅ | ✅ | ✅ `team`, `lp` | — |
| Daily Standups | ✅ | ✅ | ✅ `standups` | — |
| SLA Rules + Violations | ✅ | ✅ | ✅ `sla-rules`, `task-violations` | ✅ SLA countdown badges |
| Bug Notes (QA) | ✅ | ✅ | ✅ `qa` | ✅ BugNoteCard |
| Git Commits | ✅ | ✅ | ✅ `commits` | — |
| Figma Demos | ✅ | ✅ | ✅ `figma-demos` | ✅ FigmaDemoCard |
| Env Files | ✅ | ✅ | ✅ `env` | ✅ EnvFileEditor (syntax highlight) |
| Blog Posts | ✅ | ✅ | ✅ `blog` | ✅ BlogPostEditor (markdown toolbar) |
| Social Posts | ✅ | ✅ | ✅ `social` | — |
| Deployments | ✅ | ✅ | ✅ `deployments` | ✅ DeploymentTimeline |
| Handover Packages | ✅ | ✅ | ✅ `handover` | ✅ HandoverChecklist |
| KPI Dashboard | ✅ | — | ✅ `kpi` | ✅ Charts |

### ✅ ĐÃ KHÔI PHỤC (Restored 2026-03-24)

| Module | Schema | API Routes | Admin Pages |
|--------|--------|------------|-------------|
| `SalesLead` | ✅ | ✅ `/api/admin/sales-leads` | ✅ `/admin/sales/sales-leads` (6-column Kanban pipeline) |
| `Quote` | ✅ | ✅ `/api/admin/quotes` | ✅ `/admin/sales/quotes` + detail with LP breakdown |
| `MaintenanceContract` | ✅ | ✅ `/api/admin/maintenance-contracts` | ✅ `/admin/maintenance` (list + renewal + MRR stats) |

### ⚠️ ĐÃ XOÁ TRƯỚC ĐÓ — ĐÃ KHÔI PHỤC RỒI

> Các module này từng bị xoá vì model không tồn tại trong schema. Bây giờ đã được khôi phục đầy đủ.

- `src/app/api/admin/sales-leads/` — **Khôi phục**: SalesLead model + CRUD + Kanban pipeline
- `src/app/api/admin/quotes/` — **Khôi phục**: Quote model + CRUD + LP allocation + approve flow
- `src/app/api/admin/maintenance-contracts/` — **Khôi phục**: MaintenanceContract model + CRUD + renew
- `src/app/admin/sales/quotes/page.tsx` + `[id]/page.tsx` — **Khôi phục**
- `src/app/admin/sales/sales-leads/page.tsx` — **Khôi phục**
- `src/app/admin/maintenance/page.tsx` — **Khôi phục**

### 🔲 CHƯA LÀM (Not Yet Implemented)

| Module | Ghi chú |
|--------|---------|
| P22: Inngest Email Notifications | ✅ Đã tích hợp: `resend` package + `src/lib/email/sender.ts` (5 email templates: standup reminder, SLA violation, SLA warning, social publish, LP monthly report) + wired vào Inngest functions |
| P23: KPI Dashboard Widgets nâng cao | ✅ KPI dashboard nâng cấp: LP velocity bar chart, violation trend bar chart, Project Health RAG Board (Green/Amber/Red) |
| GSC Integration (SEO) | ✅ `/api/admin/gsc/` (GET list + POST import/upsert), page `/admin/projects/gsc`, model `GscMetric` added to schema |
| QuoteRequest (schema) | ✅ API + page đã có từ trước: `/admin/sales/quote-requests` + `/api/admin/quote-requests` |
| Customer Portal | ✅ Model `ProjectPortalToken`, API `/api/portal/[token]` + generate, page `/portal/[token]` — public client-facing progress tracker |

---

## PHẦN B: KEY FILES — IMPLEMENTATION LOG

### Database (Prisma)
```
prisma/schema.prisma — Các model PM đã có:
  ✅ ProjectMember, Epic, Backlog, Task, TaskTag, TaskViolation
  ✅ BugNote, GitCommit, LpAward, FigmaDemo
  ✅ EnvFile, EnvFileHistory, BlogPost
  ✅ SocialPost, Deployment, HandoverPackage, DailyStandup, SlaRule
  ✅ SalesLead, Quote, MaintenanceContract — đã restore đầy đủ API + pages
  ✅ GscMetric — model mới: impressions, clicks, CTR, position per project/page
  ✅ ProjectPortalToken — model mới: token-based client portal access
```

### API Routes
```
src/app/api/admin/
  ✅ /projects/[id]/board/           — Kanban CRUD
  ✅ /projects/[id]/team/             — LP summary + awards
  ✅ /projects/[id]/backlogs/         — Epic + Backlog CRUD
  ✅ /projects/[id]/standups/         — Daily standup CRUD
  ✅ /projects/[id]/qa/               — Bug notes CRUD
  ✅ /projects/[id]/env/              — Env file CRUD
  ✅ /projects/[id]/deployments/      — Deployment CRUD
  ✅ /projects/[id]/social/          — Social post CRUD
  ✅ /projects/[id]/blog/            — Blog post CRUD
  ✅ /projects/[id]/commits/         — Git commit tracking
  ✅ /projects/[id]/lp/              — LP award management
  ✅ /projects/[id]/handover/        — Handover package CRUD
  ✅ /figma-demos/                   — Figma demo CRUD
  ✅ /lp-summary/[projectId]/         — LP summary stats
  ✅ /daily-standups/                 — Daily standup CRUD
  ✅ /sla-rules/                     — SLA rule CRUD
  ✅ /bug-notes/                     — Bug note CRUD
  ✅ /task-violations/               — Violation tracking
  ✅ /maintenance-contracts/         — Full CRUD + renew endpoint
  ✅ /quotes/                        — Full CRUD + approve endpoint
  ✅ /sales-leads/                   — Full CRUD + Kanban grouping
```

### Admin Pages
```
src/app/admin/projects/[id]/
  ✅ page.tsx              — Project overview (stats, nav grid)
  ✅ board/page.tsx        — Kanban board
  ✅ team/page.tsx         — LP leaderboard
  ✅ backlogs/page.tsx     — Epic + backlog management
  ✅ standups/page.tsx     — Daily standups
  ✅ qa/page.tsx           — Bug tracker
  ✅ env/page.tsx          — Env files editor
  ✅ deployments/page.tsx  — Deployment history
  ✅ social/page.tsx       — Social post scheduler
  ✅ blog/page.tsx        — Blog post editor
  ✅ commits/page.tsx      — Git commit log
  ✅ lp/page.tsx          — LP award queue
  ✅ handover/page.tsx     — Handover checklist
src/app/admin/
  ✅ projects/page.tsx     — Project list
  ✅ projects/tasks/page.tsx — Global task list
  ✅ projects/figma-demos/page.tsx
  ✅ projects/env-files/page.tsx
  ✅ projects/blogs/page.tsx
  ✅ projects/gsc/page.tsx — GSC SEO: import metrics, filter, CTR/position display
  ✅ projects/social-posts/page.tsx
  ✅ projects/[id]/... (12 sub-pages)
  ✅ sla-rules/page.tsx
  ✅ bug-notes/page.tsx
  ✅ task-violations/page.tsx
  ✅ kpi/page.tsx — Base + LP velocity chart + violation trend + RAG board
  ✅ projects/gsc/page.tsx — GSC SEO metrics: impressions, clicks, CTR, position
  ✅ lp-awards/page.tsx
  ✅ maintenance/page.tsx — Full: list + create modal + renew + status + MRR stats
  ✅ sales/quotes/page.tsx + [id]/page.tsx — Full: list + detail + LP breakdown
  ✅ sales/sales-leads/page.tsx — Full: Kanban pipeline (6-stage)
```

### Components
```
src/components/admin/editors/
  ✅ env-file-editor.tsx   — Syntax highlighting, line numbers, tab indent
  ✅ blog-post-editor.tsx  — Markdown toolbar, keyboard shortcuts, word count

src/components/admin/shared/
  ✅ project-header.tsx    — Reusable project breadcrumb + title

src/components/team/
  ✅ GuildHallOfFame.tsx  — Fixed: exported HallOfFameMember
  ✅ GuildMemberCard.tsx   — Fixed: skills union type
```

---

## PHẦN C: NEXT STEPS

### ✅ ĐÃ HOÀN THÀNH TRONG SESSION NÀY (2026-03-24)
- **P22 Inngest Email**: `src/lib/email/sender.ts` (7 templates), wired vào Inngest: contact confirmation, admin notification, order confirmation, standup reminder, SLA violation, SLA warning, LP monthly report
- **P23 KPI Advanced**: LP velocity chart, violation trend chart, RAG board → `src/app/admin/kpi/page.tsx`
- **GSC Integration**: `GscMetric` model + `/api/admin/gsc` + `/admin/projects/gsc`
- **QuoteRequest**: API + page đã có sẵn
- **Customer Portal**: `ProjectPortalToken` model + `/api/portal/[token]` + `/portal/[token]` (public page)

### Ưu tiên thấp (Low Priority — còn lại)
1. **Multi-language** (i18n) cho toàn bộ admin module
2. **Real-time** — WebSocket cho Kanban board collaboration
3. **Resend API key** — Cần verify `RESEND_API_KEY` có quyền gửi từ domain `loop.vn`

---

## PHẦN D: TECHNICAL NOTES

### Prisma 7 Strict Mode Issues Fixed
- `role.permissions` yêu cầu explicit `select` — đã fix trong `login/route.ts`
- `QuoteRequest` thay vì `Quote` — model đúng trong schema
- `projectId` vs `orderId` — PM module dùng `projectId` (FK đến `Order.id`)
- `Epic.title` (not `Epic.name`) — trong schema là `title`, `Backlog.name`
- `Task.assignee` → `TeamMember` (direct FK, không có nested `member`)
- `HandoverPackage.items` → JSON array (không có `completedSections`)

### Naming Convention
- PM models (Epic, Backlog, Task, etc.) → `projectId` (FK đến `Order.id`)
- Pre-existing models → `orderId`
- `TeamMember` không có `userId` — resolve qua `User.teamMemberId`

### Code Quality
- Debug `console.log` statements removed from `team/[id]/route.ts` và `upload/route.ts`
- Remaining `console.log` in API routes are intentional business-event logs (deploy, social publish, maintenance renew, blog publish)

### Auth & Permissions
- `requirePermission(resource, action)` pattern xuyên suốt
- `ProjectHeader` component chấp nhận cả `orderId` và `projectId` (backwards compat)

### Email / Inngest
- Resend SDK (`npm install resend`) — `RESEND_API_KEY` đã có trong `.env.local`
- Single Inngest client (`id: "loop"`) — all functions registered in `src/app/api/inngest/route.ts`
- `src/lib/email/sender.ts` — 7 templates: contact confirmation, admin notification, order confirmation, standup reminder, SLA violation, SLA warning, social publish, LP monthly report

### Deployment
- `Deployment.deployHookUrl` field — configurable per-deployment webhook URL (Vercel/GitHub Actions)
- `/api/admin/deployments/[id]/trigger` — calls hook if configured, simulates success otherwise

### Customer Portal
- `ProjectPortalToken` model — token-based access, no login required for clients
- Token generation: `POST /api/portal/[token]/generate` (admin-only)
- Portal URL: `/portal/{uuid}` — public, no auth required
- Admin UI: `/admin/projects/[id]` — "Client Portal" section with Generate + Copy buttons
- Admin API: `GET/POST/DELETE /api/admin/portal?projectId=xxx`

---

## PHẦN E: TYPE SCRIPT CLEAN BUILD

```
✅ npx tsc --noEmit — ZERO errors (2026-03-24)
   - Login route: permissions typed via explicit select
   - team-page: skills union type fixed
   - GuildHallOfFame: HallOfFameMember exported
   - Orphaned API routes deleted (no Prisma models)
   - GscMetric model: prisma generate + schema validate ✓
   - ProjectPortalToken model: prisma generate + schema validate ✓
   - Email sender: 7 email templates (contact confirmation, admin contact notification, order confirmation, standup reminder, SLA violation, SLA warning, social publish, LP monthly report)
   - Inngest jobs/functions: all TODOs resolved — emails wired for contact + order confirmation
   - Deployment trigger: deployHookUrl field added, real webhook calls implemented
   - Customer Portal: /portal/[token] page + API + generate endpoint
   - KPI dashboard: LP velocity, violation trend, RAG board widgets added
   - Portal link button: added to project overview page with Generate + Copy UI
   - prisma db push: gsc_metrics, project_portal_tokens, deploy_hook_url fields synced ✓
```
