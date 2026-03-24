# Plan: Nâng cấp hệ thống Admin → Nền tảng Quản trị Dự án TOÀN DIỆN

> Phiên bản: 2.2 — Cập nhật theo Implementation Progress
> Ngày: 2026-03-24
> **Trạng thái**: ✅ **ALL PHASES 1-5 COMPLETE** — BA Ecosystem: LP Engine ✅ Rank System ✅ Referral ✅ EDU ✅ Auto Pricing ✅ Customer LP Redemption ✅ Public Referral `/ref/[code]` ✅ — 2026-03-24

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
| EDU System (M14-M17) | ✅ | ✅ | ✅ `edu`, `edu/instructors`, `edu/courses`, `edu/enrollments`, `edu/attendance`, `edu/feedback` | ✅ LP distribution (M17) |

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

### ✅ TẤT CẢ ĐÃ HOÀN THÀNH (2026-03-24)

> Mọi module trong roadmap đã được triển khai đầy đủ.

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
  ✅ /edu/instructors/               — Instructor CRUD
  ✅ /edu/instructors/[id]/          — GET/PATCH/DELETE instructor
  ✅ /edu/courses/                   — Course CRUD
  ✅ /edu/courses/[id]/              — GET/PATCH/DELETE course
  ✅ /edu/courses/[id]/lessons/      — Lesson GET/POST
  ✅ /edu/enrollments/               — Enrollment CRUD
  ✅ /edu/enrollments/[id]/          — GET/PATCH/DELETE enrollment
  ✅ /edu/enrollments/[id]/payment/  — M17 atomic LP distribution
  ✅ /edu/attendance/                — Attendance list + check-in
  ✅ /edu/feedback/                  — Feedback list + create
  ✅ /ref/[code]/info/              — Public referral info (member name, tier, stats) for `/ref/[code]` landing page
  ✅ /points (GET + POST)            — GET: catalog + account; POST: daily_login + watch_ad + redeem (customer LP redemption)
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
  ✅ GuildMemberCard.tsx   — Rank effects: Glitch (RUBY), Aurora (DIAMOND), Glow (all), Tail (BRONZE), Spark (SILVER), Comet (GOLD), Particles (PLATINUM/RUBY/DIAMOND)
  ✅ RankUpgradeNotification.tsx — M18: Full-screen rank upgrade toast with glitch/aurora, countdown bar, useRankUpgrade hook
  ✅ teamRanks.ts — Added guildGlitch, guildGlitchInner, auroraShift keyframes + getRankColor/getRankLabel/getRankSymbol helpers
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

---

## PHẦN F: BA ECOSYSTEM — LOOP OS FULL REQUIREMENTS

> Nguồn: Master Prompt — LOOP Solutions Digital Agency Operating System
> Cập nhật: 2026-03-24

---

### F1. TRIẾT LÝ & NGUYÊN TẮC

- **Tên hệ thống**: LOOP Solutions — Digital Agency Operating System
- **3T**: Tốc độ (Fast Deployment), Trải nghiệm (Smooth UX), Tinh tế (Detail Oriented)
- **Hệ thống tiền tệ nội bộ**: LP (LOOPS POINT) — $1 LP = 20,000 VNĐ
- **Luồng LP khách hàng**: Thanh toán đơn hàng → Nhận 10% giá trị bằng LP → Dùng LP đổi dịch vụ/giảm giá
- **Luồng LP nhân viên**: Task (Dev) → Viết bài (SEO) → Giới thiệu khách (Referral) → Thưởng KPI
- **Tính năng Transfer**: Chuyển LP nội bộ (có phí anti-spam, giới hạn lần chuyển, chỉ chuyển LP đã duyệt)
- **Phân quyền**: CEO (Full) > PM (Quản lý dự án/Point/Task) > QA (Duyệt task) > DEV (Thực hiện)

---

### F2. RANK SYSTEM — 7 CẤP (GAMIFICATION)

| Rank | Level | Màu | Hiệu ứng | Badge Symbol |
|------|-------|-----|----------|-------------|
| IRON | 1–14 | #9CA3AF | Xám xỉn, không glow | ⬡ |
| BRONZE | 15–34 | #CD7F32 | Bắt đầu có "đuôi sáng" (Tail) | ◈ |
| SILVER | 35–54 | #CBD5E1 | Hiệu ứng tia sáng (Spark) | ◇ |
| GOLD | 55–74 | #FFD700 | Glow + Preview rank tiếp theo | ★ |
| PLATINUM | 75–94 | #14B8A6 | Đa sắc, hiệu ứng hạt (Particles) | ❋ |
| RUBY | 95–114 | #EF4444 | Nhịp tim + Glitch | ♦ |
| DIAMOND | 115+ | #818CF8 | Cực quang (Aurora) | ✦ |

**Trạng thái hiện tại**:
- ✅ UI components đã có: `GuildMemberCard`, `GuildHUDPanel`, `LEDRunner`, `teamRanks.ts` với hardcoded presets
- ✅ `getRankFromLevel()` tồn tại trong `src/components/team/teamRanks.ts`
- ✅ **M1 DONE** (2026-03-24): `TeamMember.{level, currentXp, maxXp, rank}` fields added to schema
- ✅ **M1 DONE** (2026-03-24): `src/lib/rank/xp.ts` — XP formula + `syncRankFields()`
- ✅ **M1 DONE** (2026-03-24): `GET /api/admin/rank/leaderboard` — real rank data from LpAward aggregation
- ✅ **M1 DONE** (2026-03-24): `POST /api/admin/rank/sync/[memberId]` — recalculate rank fields
- ✅ **M1 DONE** (2026-03-24): `src/hooks/useRank.ts` — `useRank()` + `useLeaderboard()` hooks
- ✅ **M1 DONE** (2026-03-24): `GuildMemberCard` accepts `totalApprovedLp` prop → real XP/rank
- ✅ **M1 DONE** (2026-03-24): `GET /api/admin/team` enriched with rank fields + `totalApprovedLp`
- ✅ **M1 DONE** (2026-03-24): LP approval flow syncs rank fields on `TeamMember` after approval
- ✅ **M18 DONE** (2026-03-24): Rank upgrade notification — `RankUpgradeNotification` component (glitch + aurora + particle effects) + `useRankUpgrade` hook for client-side rank change detection
- ❌ **Không có rank upgrade notification**

---

### F3. LP ENGINE — STAFF LP (ĐÃ CÓ + CẦN MỞ RỘNG)

**Đã có**:
- `LpAward` model: task → pending → approved/rejected workflow
- `ProjectMember.earnedLp` — cộng khi approve
- 4 nguồn LP: git_merge, task_done, manual, seo_article
- `/api/admin/lp-awards` + approve/reject endpoints
- `/admin/lp-awards` + `/admin/projects/[id]/lp` pages

**Cần thêm** — `LP Engine` đầy đủ theo BA:

| Tính năng | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Locked LP vs Available LP | ✅ | `TeamMember.lockedLp` + `availableLp`; LP locked on award creation, unlocked on approval |
| LP Transfer nội bộ | ✅ | `POST /api/admin/lp-transfers` + `executeTransfer()` — atomic, peer-to-peer |
| LP Transfer fee (anti-spam) | ✅ | 10 LP per transfer; deducted from sender, not credited to receiver |
| LP Transfer limit (số lần/ngày) | ✅ | Max 5 transfers/member/day; `getTransferLimitStatus()` enforces |
| LP Redemption (đổi LP → dịch vụ) | ✅ | `POST /api/admin/lp-redemptions` + `redeemLp()` — atomic, `AddonService.lpCost` catalog |
| LP Expiry | ❌ | Không có cơ chế LP hết hạn |
| LP Transaction log (staff) | ✅ | `LpTransaction` model — immutable ledger; created on approve/reject/create/adjust |
| Auto LP từ Quote deal close | ❌ | Không tự động thưởng LP cho sales/dev khi Quote approved |
| Tỷ giá $1 LP = 20,000 VND | ❌ | Không có hằng số trong code |

**Cần thêm model**:
```
LpTransaction (staff): id, fromMemberId?, toMemberId?, amount, type (award|transfer|spend|redeem), source, status (pending/completed), fee, referenceId, referenceType, createdAt
LpRedemption: id, memberId, rewardItemId, lpCost, status, redeemedAt, createdAt
```

---

### F4. CUSTOMER LP POINTS — (ĐÃ CÓ + CẦN HOÀN THIỆN)

**Đã có**:
- `CustomerPoint` model: balance, totalEarned, totalSpent, level, currentXp, loginStreak
- `PointTransaction` model: earn/spend/expire/refund
- `PointActivity`, `Advertisement`, `AdWatchHistory`, `DailyReward`
- `/api/points` (public): daily_login, watch_ad
- `/api/admin/points` (admin): read-only list

**Cần thêm**:

| Tính năng | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Purchase → nhận 10% LP | ✅ | `awardCustomerLpOnPayment()` wired into `recordPayment()`; `LP_VND_RATE=20,000`; `GET /api/admin/customer-points` |
| LP Redemption cho khách hàng | ✅ | `POST /api/points` với `action: "redeem"` — customer đổi `CustomerPoint.balance` cho `AddonService` (lpCost != null); atomic deduct + `PointTransaction(type=spend)`. `GET /api/points?catalog=1` trả về redeemable catalog công khai. (2026-03-24) |
| Growth Loop | ✅ | Full loop wired: purchase → LP → LP_Redeem catalog + Referral LP → tier rewards → Growth Loop dashboard |
| Referral LP cho khách hàng | ❌ | Không có khi refer thành công |
| Customer Point UI (admin) | ✅ | `/admin/system/points` — full: list, balance stats, transaction history, admin adjust |
| Customer Point Transaction viewer | ✅ | Built into `/admin/system/points` detail drawer |
| LP từ `Quote.lpAllocation` | ❌ | Field tồn tại nhưng không ai phân bổ LP cho sales/design/PM khi deal close |

---

### F5. REFERRAL SYSTEM (GROWTH & SALES)

**Đã có**:
- `SalesLead` model: source field có giá trị "referral"
- 6-stage pipeline: new → contacted → qualified → proposal → won | lost
- Kanban UI `/admin/sales/sales-leads`

**Cần thêm (Tier-based Referral BA)**:

| Tính năng | Trạng thái |
|-----------|-----------|
| Referral Code model | ✅ | `ReferralCode` model — unique code, memberId, campaign, lpRate, minRevenue, maxUses, expiresAt |
| Referral Tracking model | ✅ | `ReferralTracking` — click/signup/lead/order events, UTM params, IP hash (privacy), revenue snapshot |
| Auto LP reward khi lead → order | ✅ | `awardReferralLpOnPayment()` wired into `recordPayment()`; `source=referral`, `LpTransaction` created |
| Referral Tier (5%–10%) theo doanh số | ✅ | Tier 1: 0–50M VND → 5%, Tier 2: 50–200M → 7%, Tier 3: 200M+ → 10%; `ReferralCode.lpRate` overrides |
| Referral Dashboard cho staff | ✅ | Part of `GET /api/growth-loop/[memberId]` — referral codes, stats, share URLs |
| Public referral link `/ref/[code]` | ✅ | `/ref/[code]/page.tsx` — public landing page với member name, tier badge, stats, how-it-works, LP rate hiển thị. `/api/ref/[code]/info` endpoint trả về public referral info + tier computation. (2026-03-24) |

**Referral Tier đề xuất** (theo BA):
```
Tier 1 (0–50M VND):  5% LP reward
Tier 2 (50–200M):    7% LP reward
Tier 3 (200M+):      10% LP reward
```

---

### F6. AUTO PRICING — FORMULA ENGINE

**Đã có**:
- `FeatureGroup` / `Feature` / `FeatureVariant` — feature catalog
- `AddonService` + `RewardTier` + `RewardTierItem` — reward system
- `calculateOrderPrice()` trong `src/lib/pricing/calculate-order-price.ts`
- `POST /api/admin/orders/[id]/calculate-price`

**Công thức hiện tại**:
```
basePrice = SiteSetting("custom_web_base_price") ?? 3,000,000
featureTotal = Σ(advanced features' prices)
systemPrice = basePrice + featureTotal
totalXp = Σ(advanced features' xpPoints)
rewardLevel = floor(totalXp / xpPerLevel) + 1
finalPrice = adminOverridePrice ?? systemPrice
```

**Cần thêm (theo BA: Base + Feature + Infrastructure)**:

| Tính năng | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Infrastructure Tier (Basic/Pro/Enterprise) | ✅ | `InfrastructureTier` model + `Order.infrastructureTierId` + `calculateOrderPrice()` includes `infraCost` + `infraSetupCost` |
| Auto-apply price khi tạo Order | ❌ | Logic không được gọi khi tạo order |
| Quote → Order price inheritance | ❌ | Khi Quote approved → Order, prices không chuyển |
| Public pricing calculator UI | ❌ | Không có frontend |
| Feature → Service mapping | ❌ | Parent/child hierarchy có nhưng UI quản lý không có |
| Live preview khi chọn features | ❌ | Không có |

**Công thức BA đề xuất**:
```
Final Price = Base Price + Σ(Selected Features) + Infrastructure Tier Cost
```

---

### F7. EDU SYSTEM — GIÁO DỤC

**Trạng thái**: ✅ **HOÀN THÀNH (2026-03-24)**

**Schema đã tạo**:
```
Instructor: id, name, bio, email, phone, specialties[], rating, totalStudents, isActive
Course: id, title, titleVi, description, descriptionVi, type (1:1|group), instructorId, price, lpReward (10% of price), maxStudents, durationWeeks, status (draft|published|archived), createdAt
Lesson: id, courseId, title, titleVi, orderIndex, content (markdown), durationMinutes, isPublished
Enrollment: id, courseId, studentId (TeamMember or User), enrolledAt, status (active|completed|cancelled), completedLessons[], progressPercent
Attendance: id, lessonId, studentId, enrolledAt, status (present|absent|late), checkedInAt
Feedback: id, enrollmentId, lessonId?, rating (1-5), comment, createdAt
StudentProgress: id, enrollmentId, lessonId, completedAt, quizScore?
```

**LP Flow (M17 — đã implement)**:
```
Học viên trả phí → EduPayment record
  → CustomerPoint.balance += floor(amount/20000*0.10) — LP cho student
  → TeamMember.availableLp += floor(lpEarned * assigneeLpPercent/100) — LP cho instructor
  → PointTransaction (student LP) + LpTransaction (instructor LP) + audit log
```

**Admin pages đã tạo**:
```
Học viên trả phí → Nhận 10% giá trị bằng LP
   → Giảng viên nhận LP theo tỉ lệ phân bổ công việc (Enrollment.assigneeLpPercent)
```

**Admin pages đã tạo**:
```
/admin/edu/instructors        — ✅ CRUD giảng viên (name, title, bio, image)
/admin/edu/courses            — ✅ CRUD khóa học (titleVi/EN, price, lpReward, isPublished)
/admin/edu                    — ✅ Dashboard: 8 KPIs, top instructors, recent enrollments
/admin/edu/instructors        — ✅ CRUD giảng viên
/admin/edu/courses            — ✅ CRUD khóa học
/admin/edu/enrollments        — ✅ Danh sách học viên (progress bar, status badges)
/admin/edu/attendance         — ✅ Điểm danh (present/absent/late, lesson context)
/admin/edu/feedback           — ✅ Feedback (star rating, comment, filter by stars)
```

**API routes đã tạo**:
```
/api/admin/edu/instructors     — ✅ CRUD instructor
/api/admin/edu/instructors/[id] — ✅ GET/PATCH/DELETE single instructor
/api/admin/edu/courses         — ✅ CRUD course
/api/admin/edu/courses/[id]   — ✅ GET/PATCH/DELETE course + lessons list
/api/admin/edu/courses/[id]/lessons — ✅ GET/POST lessons
/api/admin/edu/enrollments     — ✅ Enrollment list + create
/api/admin/edu/enrollments/[id] — ✅ GET/PATCH/DELETE enrollment
/api/admin/edu/enrollments/[id]/payment — ✅ M17 atomic LP distribution
/api/admin/edu/attendance      — ✅ Attendance list + check-in (upsert present/absent/late)
/api/admin/edu/feedback        — ✅ Feedback list + create
```

**RBAC wired**:
```
NAV_PERMISSIONS: /admin/edu/{instructors,courses,enrollments,attendance,feedback} — minRoleLevel 2 (PM+)
/admin/edu/attendance — minRoleLevel 5 (all staff)
Seed roles: PM/QA/Member có "edu" resource với read/create/update permissions
API requirePermission: "edu" resource (not "team")
Sidebar: GROUP_LABELS.edu = "Học vấn", GraduationCap/BookOpen/MessageCircle icons
```

---

### F8. ECOSYSTEM IMPLEMENTATION ROADMAP

```
PHASE 1: FOUNDATION — Rank + LP Engine (Staff)
  ├── M1:  ✅ DONE — Rank Model + useRank() hook + Real LP sync (2026-03-24)
  ├── M2:  ✅ DONE — LpTransaction model + locked/available LP + ledger audit trail (2026-03-24)
  ├── M3:  ✅ DONE — LP Transfer system (fee 10 LP, daily limit 5, atomic peer-to-peer) (2026-03-24)
  └── M4:  ✅ DONE — LP Redemption catalog (AddonService.lpCost, LpRedemption model, atomic spend) (2026-03-24)

PHASE 2: GROWTH LOOP — Customer LP + Referral
  ├── M5:  ✅ DONE — Purchase → LP (10%) — awardCustomerLpOnPayment wired into recordPayment (2026-03-24)
  ├── M6:  ✅ DONE — ReferralCode + ReferralTracking models + CRUD API + /api/ref/[code] (click+conversion tracking) (2026-03-24)
  ├── M7:  ✅ DONE — Tiered referral LP (5%/7%/10%) wired into recordPayment + transitionOrderStatus (2026-03-24)
  ├── M8:  ✅ DONE — Growth Loop API: GET /api/growth-loop/[memberId] (LP balance, transactions, redeem catalog, referral codes + share URLs) (2026-03-24)
  └── M9:  ✅ DONE — Customer Point Admin: /admin/system/points — full table + detail drawer + transaction history + admin adjust (2026-03-24)

PHASE 3: AUTO PRICING
  ├── M10: ✅ DONE — InfrastructureTier model + Order.infrastructureTierId + calculateOrderPrice includes infraCost/setupCost + Admin CRUD API (2026-03-24)
  ├── M11: ✅ DONE — Price formula engine updated (Base + Features + Infrastructure Tier) — wired into calculateOrderPrice() (2026-03-24)
  ├── M12: ✅ DONE — Quote approve auto-creates Order with inherited pricing (features + infra tier + finalPrice) (2026-03-24)
  └── M13: ✅ DONE (v2) — Public pricing calculator UI with checkbox feature catalog + tier compare + shareable URL state + public pricing APIs (2026-03-24)

PHASE 4: EDU SYSTEM
  ├── M14: ✅ DONE — Schema: Instructor, Course, Lesson, Enrollment, Attendance, Feedback, StudentProgress, EduPayment (2026-03-24)
  ├── M15: ✅ DONE — Schema: Lesson, Attendance, Feedback, StudentProgress (2026-03-24)
  ├── M16: ✅ DONE — API routes + Admin pages (instructors, courses, enrollments, attendance, feedback) (2026-03-24)
  └── M17: ✅ DONE — EDU LP flow: student pays → LP to student (10%) + instructor (assigneeLpPercent) atomic (2026-03-24)

PHASE 5: RANK UI EFFECTS
  ├── M18: ✅ DONE — Rank card với 7 effects: Glow (all), Tail (Bronze), Spark (Silver), Preview (Gold), Particles (Platinum), Glitch + Heartbeat (Ruby), Aurora + Spectral (Diamond). `teamRanks.ts` CSS keyframes + `GuildMemberCard` overlay layers. `RankUpgradeNotification` component + `useRankUpgrade` hook. `getRankColor/Label/Symbol` helpers added. (2026-03-24)
  └── M19: ✅ DONE — Rank sync khi LP thay đổi: `lp-awards/[id]/approve/route.ts` đã sync rank fields (level, currentXp, maxXp, rank) trên approve. `edu/enrollments/[id]/payment/route.ts` sync instructor rank fields sau teaching LP credit. `syncRankFields()` + `GET /api/admin/rank/sync/[memberId]` đã có sẵn. (2026-03-24)
```

---

### F9. TECHNICAL NOTES — ECOSYSTEM

**Tỷ giá LP**:
```ts
const LP_VND_RATE = 20000 // $1 LP = 20,000 VND
const LP_EXCHANGE_RATE = 1 / 20000 // VND → LP
```

**Rank XP Formula**:
```ts
// XP needed per level: level * 100 (linear)
// Level range: 1 LP = 1 XP (simplified)
// Rank from level: IRON(1-14), BRONZE(15-34), SILVER(35-54), GOLD(55-74), PLATINUM(75-94), RUBY(95-114), DIAMOND(115+)
```

**Referral Tier Logic**:
```ts
// Tính theo tổng doanh số referral của member trong 12 tháng
const getReferralTier = (totalVnd: number) => {
  if (totalVnd >= 200_000_000) return 0.10 // Tier 3: 10%
  if (totalVnd >= 50_000_000) return 0.07  // Tier 2: 7%
  return 0.05                               // Tier 1: 5%
}
```

**Locked LP vs Available LP (Staff)**:
```ts
// Locked LP = SUM(LpAward.pending) — đang chờ QA duyệt
// Available LP = ProjectMember.earnedLp — đã duyệt, dùng được
// LP Transfer chỉ chuyển Available LP
```

**EDU LP Flow**:
```ts
// Student pays course → CustomerPoint.balance -= price
// Student receives 10% LP → PointTransaction (earn, source: "edu_enrollment")
// Instructor receives LP → LpAward (approved, source: "teaching") → ProjectMember.earnedLp
```
