# LOOP Solutions — Claude Code Context

> Project: LOOP Solutions Agency Platform — Next.js 15 Production
> Last Updated: 2026-04-04
> Language: Vietnamese (code comments, docs), English (variable names, function names)
> Status: ALL 8 PHASES COMPLETE ✅ (F0–F8) + Fi + Fs + R-seed ✅ — 224 route files, 99 models, ~90 i18n columns, 5 locales; infrastructure: slo.ts(221L) + logger.ts(265L) + scaleGate.ts(552L) + capacity.ts(377L) + Inngest (8 functions, 396L); cache: Cache-Control on 6 v1 GETs; idempotency: IdempotencyKey model + withIdempotency() on 6 mutations; observability: logger.withSLO() on 14 endpoints; rate-limit: applyRateLimit() on 5 public + auth/login; scale gate: 0 blocking, 4 non-critical warnings; 4/4 admin translate tabs ✅ (MembersTab done 2026-03-31); process docs: CompanyProcessPage ✅ v3.1.0 + loop-business-logic.md ✅ (24 discrepancies fixed); **RESTRUCTURE ✅ (2026-04-04): removed FE/ + DESIGN LOOPS/ (56K lines dead code), fixed logo.png middleware, deleted 10 duplicate directories/files**; remaining: JA/KO/ZH translation (MEDIUM), ChatWidget→real API (P2). Build ✅ tsc ✅ lint ✅.
> CI/CD: GitHub connected to Vercel, auto-deploy on push. Domain: loops.vn (production).

---

## ⚠️ CRITICAL — Production Codebase Only

```
/src/   ✅ PRODUCTION — Next.js 15, live at loops.vn
```

All development happens in `/src/`. **FE/** and **DESIGN LOOPS/** prototype folders were archived (see `git log 38fa12e`) — not present in this repo.

### KHÔNG BAO GIỜ làm:

- ❌ Copy/paste code từ archive branches vào `src/`
- ❌ Import từ prototype folders (không còn trong repo)
- ❌ Dùng mock data files trong production pages

### CHỈ dùng:

- `src/app/` — production pages
- `src/components/` — production shared components
- `src/lib/` — production business logic
- `src/app/api/admin/*` — production API endpoints

---

## Rules

> Khi implement feature mới hoặc viết docs liên quan đến nghiệp vụ, ĐỌC file này TRƯỚC:

| File | Mục đích |
|------|-----------|
| `.claude/rules/loop-business-logic.md` | **Source of truth** cho tất cả business facts đã verify vs code. LP rates, rank levels, order statuses, kanban columns, quest system. |
| `.claude/rules/api-conventions.md` | API response shapes, HTTP status codes, endpoint naming, pagination |
| `.claude/rules/code-style.md` | TypeScript conventions, naming, async/await, null handling |
| `.claude/rules/database.md` | Prisma conventions, indexes, transactions |
| `.claude/rules/error-handling.md` | Error classes, handleError(), retry logic |
| `.claude/rules/security.md` | Auth, input validation, rate limiting |
| `.claude/rules/fe-be-parity.md` | FE mock vs BE production — BE luôn thắng |
| `.claude/rules/admin-design-parity.md` | Admin Dashboard parity: FE AdminDashboard vs BE AdminSidebar + pages. Sidebar width, tab labels, layout shell. P2 tasks cho admin. |
| `.claude/rules/admin-rbac.md` | **⚠️ 2 hệ thống RBAC khác nhau**: (1) FE mock — 5 roles (admin/manager/staff/client/guest), (2) BE production — 7 roles + granular DB permissions. Role mapping, security rules, wire plan cho Members page. Đọc TRƯỚC khi sửa auth hoặc permissions. |
| `.claude/rules/go-live-phase2.md` | P2 deferred tasks (non-blocking) |

---

## Tổng quan dự án

### Codebase duy nhất

> **2026-04-04**: FE/ và DESIGN LOOPS/ đã được archive khỏi repo. Chỉ còn `/src/` là production.

```
/src/   ✅ PRODUCTION — Next.js 15 + Prisma 7 + PostgreSQL/Neon
```

| Metric | Value |
|---|---|
| **Route files** | 224 API routes |
| **Models** | 99 Prisma models |
| **i18n columns** | ~90 columns, 5 locales (VI/EN/JA/KO/ZH) |
| **Seed data** | 28 members, LP economy, quests, events |
| **Dev port** | `3000` |
| **Production** | loops.vn (Vercel + Neon PostgreSQL) |

### Hạ tầng Production

| | |
|---|---|
| **Hosting** | Vercel (Next.js SSR + static) |
| **Domain** | `loops.vn` (production) |
| **Git** | GitHub connected → Vercel auto-deploy |
| **Database** | Neon (PostgreSQL) |
| **CI** | `.github/workflows/ci.yml` — lint + typecheck + build + test |
| **Deploy tự động** | Push `develop` → Preview URL · Push `main`/tag → loops.vn |
| **Env vars** | Vercel Dashboard → Settings → Environment Variables |
| **Vercel project** | `prj_T3kS2kTcAF38IuhMtqGRRlINOSR5` · `team_zgpVFIa6a7Y9QE4H4yTHe3Bv` | |

### Mục tiêu hiện tại
All 8 phases hoàn thành. Remaining: JA/KO/ZH professional translation (MEDIUM), I18N-RUNBOOK done ✅. Deferred P2: JSON Translation migration, SupportedLocale model, TTFB audit, GSC verify, bundle opt. Chi tiết: `docs/FE-BE-INTEGRATION-STATUS.md`.

---

## Kiến trúc hệ thống LOOP

### Luồng người dùng (User Flow)

```
Khách hàng tiềm năng
    ├── /               → LandingPage (hero, dịch vụ, portfolio, testimonial)
    ├── /dich-vu        → ServicesPage (4 dịch vụ: Web, App/SaaS, Dashboard, SEO)
    │   └── /dich-vu/:id → ServiceDetailPage
    ├── /du-an          → PortfolioPage (6 dự án hoàn thành)
    │   └── /du-an/:id  → ProjectDetailPage (challenge/solution/result + metrics)
    ├── /doi-ngu        → Home.tsx (27 thành viên, rank Iron→Diamond, HUD overlay)
    │   └── /member/:id → MemberDetailPage
    ├── /hoc-vien       → AcademyPage (7 khóa học)
    │   └── /hoc-vien/:id → CourseDetailPage (Video Gate 35%, Code Exercise, Certificate)
    ├── /blog           → BlogPage
    │   └── /blog/:id   → BlogDetailPage
    ├── /lien-he        → ContactPage (form liên hệ)
    ├── /dat-lich       → BookingWizardPage (8 bước báo giá)
    └── /dang-nhap      → AuthPage

Khách hàng đã đặt hàng
    └── /khach-hang     → CustomerDashboard (8 tabs: tổng quan, dự án, khóa học, hóa đơn, ví LP, giới thiệu, hỗ trợ, cài đặt)

Nhân viên LOOP
    └── /admin          → AdminDashboard (23 tabs theo phòng ban)

Onboarding (lần đầu)
    └── /               → OnboardingPage (5-slide intro, localStorage skip tracking)
```

---

## Hệ thống nghiệp vụ LOOP

### 1. LP Economy (Điểm thưởng nội bộ)

**Kiếm LP:**
- Hoàn thành task/quest nội bộ (nhân viên)
- Hoàn thành khóa học (học viên)
- Mua dịch vụ (khách hàng nhận LP reward)
- Giới thiệu bạn bè (referral)

**Dùng LP:**
- Giảm giá dịch vụ: tối đa 20%, rate `1,000 LP = 500,000 VNĐ`
- Mua khóa học (toàn phần hoặc LP+VNĐ)
- Đổi thưởng nội bộ

**Rank System (nhân viên):**
| Rank | Màu | Level | Hiệu ứng |
|---|---|---|---|
| Iron | #9CA3AF | 1–14 | Particle Glow |
| Bronze | #CD7F32 | 15–34 | Border Gradient |
| Silver | #C0C0C0 | 35–54 | Silver Shimmer |
| Gold | #FFD700 | 55–74 | Gold Aura + Neon Pulse (Lv.60+) |
| Platinum | #E5E4E2 | 75–84 | Platinum Trail + Matrix Rain (Lv.80+) |
| Ruby | #E0115F | 85–94 | Ruby Fire Particles |
| Diamond | #7DD3FC | 95+ | Diamond Holographic + Cosmic Badge (Lv.100+) |

**Admin Effects Tab:**
- Global toggle bật/tắt toàn bộ hiệu ứng
- CRUD hiệu ứng: name, description, type, rarity, unlock conditions
- 3 views: danh sách, theo rank, theo thành viên

### 2. Order Lifecycle

```
pending_payment → paid → in_progress → demo_ready → client_review → done
```
- **Wizard 8 bước:** Chọn dịch vụ → Gói (×1/×2.2/×3.8) → Tính năng → Nhân sự → Lịch hẹn → Extras → Review → Thanh toán (VNĐ + LP)
- **Admin Orders Tab:** CRUD, gán PM, send demo (masked URL), chat với khách, advance status
- **Customer Dashboard:** Theo dõi order, xem demo qua DemoViewer, chat với PM

### 3. Academy Flow

- **Free trial:** Xem trước miễn phí (FreeTrialModal)
- **Enrollment:** VNĐ / LP+VNĐ / LP toàn phần (PaymentModal)
- **CoursePlayer:**
  - Video Gate: phải xem ≥35% mới mở bài tiếp
  - Code Exercise: editor + output trực tiếp
  - Comments: bình luận mỗi bài
  - Certificate khi hoàn thành 100% + LP reward

### 4. Quest & Event System

**13 Quests theo frequency:**
- Daily: Điểm danh, gửi tin nhắn, xem blog
- Weekly: Hoàn thành 3 task, viết blog, hoàn thành 1 khóa
- Monthly: Đánh giá 360°, giới thiệu 1 KH
- One-time: First Blood, Streak Master 30 ngày
- Client: Đặt dịch vụ đầu tiên, đánh giá

**3 Events:**
- Spring Festival 2026 (seasonal, active)
- Hackathon Internal Q1 (competition, active)
- LOOP Anniversary (celebration, inactive)

---

## Thiết kế hệ thống FE

### Tech Stack
- **React 18 + TypeScript** (strict, no `any`)
- **Vite 6** (build tool)
- **Tailwind CSS v4** (utility-first, CSS variables for design tokens)
- **Motion** (Framer Motion) — longhand properties only (backgroundColor, borderColor)
- **Zustand** (global state: loopStore + authStore)
- **React Router v7** (Data Router)

### Design System (`src/app/components/layout/ds.ts`)
```
DS: bg=#020617, bgCard=#0F172A, blue=#3B82F6, purple=#818CF8, text3=#94A3B8
Fonts: Cinzel (heading), Inter (body), JetBrains Mono (code)
```

### Quy tắc CSS quan trọng
- ✅ Dùng `rgba()` thay vì Tailwind opacity classes: `rgba(59,130,246,0.15)`
- ✅ Longhand properties trong motion: `backgroundColor`, `borderColor`
- ❌ Không dùng shorthand: `background`, `border` trong `whileHover/animate/initial`
- ❌ Không dùng Recharts/D3 — chỉ dùng Pure SVG cho charts
- ✅ `DemoViewer.tsx` — KHÔNG CHỈNH SỬA (file đã edit thủ công)

---

## Cấu trúc thư mục FE

```
src/
├── app/
│   ├── [locale]/                  # Public pages (/{locale}/...)
│   │   ├── page.tsx               # Landing page
│   │   ├── services/              # Services listing + detail
│   │   ├── portfolio/             # Portfolio listing + detail
│   │   ├── blog/                  # Blog listing + detail
│   │   ├── academy/               # Academy listing + course detail
│   │   ├── team/                  # Team listing + member detail
│   │   ├── khach-hang/            # Customer dashboard (8 tabs)
│   │   ├── dang-nhap/             # Login
│   │   ├── dat-lich/              # Booking wizard
│   │   └── components/            # SiteHeader, SiteFooter (shared)
│   ├── admin/                     # Admin dashboard (23 tabs)
│   │   ├── layout.tsx             # Dark admin shell (React Query + auth)
│   │   ├── overview/page.tsx
│   │   ├── members/page.tsx       # Member CRUD (1,988L)
│   │   ├── orders/page.tsx
│   │   ├── academy/page.tsx
│   │   ├── effects/page.tsx       # ⚠️ READ-ONLY — driven by code
│   │   ├── quest_events/page.tsx
│   │   └── ... (20 more sections)
│   ├── api/                        # API routes
│   │   ├── v1/                    # Public read-only (localized, cached)
│   │   ├── admin/                 # Protected CRUD (requirePermission)
│   │   ├── academy/               # Education API
│   │   └── auth/                  # JWT auth
│   └── (root)                     # Onboarding, feed.xml
├── components/
│   ├── ui/                         # 49 Shadcn/ui base components
│   ├── admin/                      # AdminSidebar, AdminTopbar, SessionInit
│   ├── landing/                    # Page client components (OnboardingClient, etc.)
│   └── layout/                     # ds.ts (design tokens)
├── lib/
│   ├── auth/                       # JWT, permissions, RBAC
│   ├── api/                        # Response helpers (ok, list, handleError)
│   ├── services/                   # Business logic (commerce, gamification, etc.)
│   ├── jobs/                       # Inngest background jobs (8 functions)
│   ├── pricing/                    # Quote calculator, order lifecycle
│   └── ...                         # analytics, cache, logger, slo, etc.
├── i18n/messages/                  # i18n JSON (5 locales — VI/EN/JA/KO/ZH)
├── store/                           # Zustand (authStore, loopStore, audioStore)
├── styles/                          # globals.css, figma-theme.css
└── middleware.ts                    # i18n routing + admin auth + logo.png static
```

---

## API Endpoints (key)

### Public APIs (v1)
- `GET /api/v1/services?lang=` → Service list
- `GET /api/v1/projects?lang=` → Project list
- `GET /api/v1/team?lang=` → TeamMember list
- `GET /api/v1/testimonials?lang=`
- `GET /api/v1/pricing?lang=` → ❌ NOT implemented — FE uses `/api/pricing/config?lang=`
- `GET /api/v1/blog?lang=` → ❌ NOT implemented — FE uses `/api/blog-posts?lang=` (DB-backed)
- `GET /api/v1/courses?lang=` → Academy course list
- `GET /api/v1/courses/[id]?lang=` → Academy course detail + curriculum

### Student/Client Academy APIs
- `GET /api/academy/enroll` → List user enrollments
- `POST /api/academy/enroll` → Enroll in course (vnd/mixed/lp)
- `POST /api/academy/lessons/[id]/complete` → Mark lesson complete (Video Gate 35%)
- `GET /api/academy/progress/[courseId]` → Load saved progress
- `GET /api/academy/certificate/[courseId]` → Certificate eligibility

### Admin APIs (key)
- `GET/POST /api/admin/services` → Service CRUD
- `GET/POST /api/admin/projects` → Project CRUD
- `GET/POST /api/admin/team` → TeamMember CRUD
- `GET/POST /api/admin/orders` → Order CRUD
- `GET/POST /api/admin/blog-posts` → BlogPost CRUD
- `GET/POST /api/admin/edu/courses` → Course CRUD
- `PUT/DELETE /api/admin/edu/courses/[id]` → Course update/delete
- `GET/POST /api/admin/edu/enrollments` → Enrollment CRUD
- `GET/POST /api/admin/lp-awards` → LP awards
- `GET/POST /api/admin/lp-transactions` → LP transactions
- `GET/POST /api/admin/lp-redemptions` → LP redemptions
- `GET/POST /api/admin/figma-demos` → Demo links
- `GET/POST /api/admin/quote` → Pricing wizard
- `GET /api/admin/dashboard` → KPI overview
- `GET /api/admin/dashboard/charts` → Analytics charts

### Auth
- `POST /api/admin/auth/login` → JWT login
- `GET /api/admin/auth/me` → Current user
- `POST /api/admin/auth/logout` → Logout

---

## Prisma Models (key)

| Model | Dùng ở |
|---|---|
| Service | ServicesPage, ServiceDetailPage |
| Project | PortfolioPage, ProjectDetailPage |
| TeamMember | Home.tsx (27 members), MemberDetailPage |
| Expertise | Team member specialties |
| BlogPost | BlogPage, BlogDetailPage |
| Testimonial | LandingPage testimonials |
| HomeSlider | LandingPage hero sliders |
| HomeVideo | LandingPage video section |
| PricingPlan | BookingWizardPage (pricing config) |
| Order | CustomerDashboard, OrdersTab, Order lifecycle |
| OrderStatusHistory | OrderTab tracking |
| FigmaDemo | DemoViewer masked URLs |
| Quote | BookingWizardPage submit |
| QuoteRequest | Wizard 8-step |
| Payment | CustomerDashboard invoices |
| ServicePackage | Wizard step 2 (packages) |
| Feature | Wizard step 3 (add-on features) |
| AddonService | Wizard step 6 |
| InfrastructureTier | Wizard pricing |
| FeatureGroup | Wizard pricing |
| FeatureVariant | Wizard pricing |
| CustomerPoint | LP balance |
| PointTransaction | LP history |
| PointActivity | LP activity log |
| LpAward | LP awards (admin) |
| LpTransfer | LP transfers |
| Course | AcademyPage, CourseDetailPage |
| Lesson | CoursePlayer |
| Instructor | AcademyPage |
| Enrollment | Academy enrollment + progress |
| StudentProgress | Video Gate 35% tracking |
| Attendance | Course attendance |
| Feedback | Course feedback |
| EduPayment | Academy payment |
| Notification | AdminNotifications, ClientNotifications |
| SalesLead | ClientsTab CRM |
| Task | KanbanBoard |
| Epic | KanbanBoard epics |
| Backlog | KanbanBoard backlogs |
| BlogPost | Blog content |
| RankEffect | EffectsTab CRUD + per-rank display |
| MemberEffectOverride | Member card effects (Akira, Ryo, Vũ Trọng overrides) |
| Quest | QuestEventsTab CRUD |
| CompanyEvent | QuestEventsTab CRUD |
| QuestParticipant | Quest participation tracking (15 team members) |
| User (Team) | User accounts for team members (QuestParticipant FK) |

---

## Admin RBAC

### Role Hierarchy
`admin > manager > staff > client > guest`

### Department Tabs
| Department | Tabs |
|---|---|
| engineering | overview, orders, projects, members, notification_center |
| design | overview, orders, projects, portfolio, members, notification_center |
| media | overview, media, orders, projects, members, notification_center |
| marketing | overview, blog, academy, clients, services, notification_center |
| sales | overview, orders, clients, quotation, services, revenue, notification_center |
| finance | overview, revenue, lp, lp_manage, income_tax, web_packages, orders, notification_center |
| hr | overview, members, departments, notification_center |
| management | overview, orders, members, departments, projects, revenue, clients, notification_center, quests_events |
| admin | **TẤT CẢ 23 tabs** |

### 23 Admin Tabs
`overview | orders | members | departments | projects | services | media | quotation | portfolio | projects_completed | academy | blog | revenue | clients | lp | lp_manage | income_tax | web_packages | effects | notification_center | settings | quests_events | leaderboard_admin | analytics`

---

## Phase Roadmap (FE-first)

### Phase F0 — Infrastructure (Foundation) ✅
Thiết lập hạ tầng kết nối FE → BE, auth, routing.

### Phase F1 — Public Pages ✅
Landing, Services, Portfolio, Blog, Contact — kết nối public APIs.

### Phase F2 — Booking Wizard + Orders ✅
Wizard 8 bước + Order lifecycle.

### Phase F3 — Team + Effects ✅
27 members + Rank effects system.

### Phase F4 — Academy ✅
Courses + Enrollment + Video Gate. BE endpoints: `courses/[id]`, `enroll`, `lessons/[id]/complete`, `progress`, `certificate`, admin `PUT/DELETE`. Academy seed: 6 instructors, 7 courses, lessons, enrollments. PaymentModal→enroll API, CoursePlayer→completeLesson API, AcademyTab→CRUD.

### Phase F5 — Customer Portal ✅
Customer dashboard + LP wallet + quests.

### Phase F6 — Admin CMS ✅
23 admin tabs — 100% wired to BE APIs. 4/4 translate tabs (Services/Portfolio/Blog/Members) via `TranslationEditor`.

### Phase F7 — Realtime/Polish ✅
SSE notifications, AnalyticsTab wired, AdminLeaderboardTab fixed (CUID memberId), seed quests/events.

### Phase F8 — Scale Hardening ✅
SLO/logger/scaleGate/capacity + Inngest 8 functions + Cache-Control + IdempotencyKey + Rate-limit.

### Fi — I18n Remediation ✅
Navbar/Footer wired useI18n(), LocaleSwitcher cookie, error page hardcoded (Next.js limitation).

### Fs — SEO/PWA/Geo ✅
Dynamic OG via /api/og, geo tags, JSON-LD (Organization+WebSite), manifest linked, theme_color fixed.

### R-seed — Unified Demo Data ✅
28 members, LP economy, quests/events, orders, rank effects — BE seed + FE fallback sync.

---

## Development Workflow

```bash
# Start dev server (port 3000)
cd d:/LOOP_COMPANY/LOOP && npm run dev

# Quality gates
npm run lint
npx tsc --noEmit

# Deploy via Vercel CLI (manual, no GitHub Actions needed)
npx vercel --prod=false          # Preview
npx vercel --prod               # Production (loops.vn)
```

## CI/CD Pipeline

```
GitHub push (develop)  ──→  CI (lint + typecheck + build)  ──→  Vercel Preview
GitHub push (main)    ──→  CI (lint + typecheck + build)  ──→  loops.vn
```

| Trigger | Môi trường | URL |
|---|---|---|
| Push `develop` | Preview | Vercel auto-assign |
| Push `main` | Production | `loops.vn` |
| Pull Request | Preview (temp) | Vercel auto-assign |

> **Không cần `deploy.yml`** — Vercel tự nhận webhook từ GitHub. Chỉ cần thêm Environment Variables trong Vercel Dashboard → Settings → Environment Variables. CI workflow nằm ở `.github/workflows/ci.yml`.

---

## Communication Style

- Vietnamese cho docs, comments, giao tiếp người dùng
- English cho code, variable names, function names
- Ngắn gọn, thực tế, có action

---

## Available Slash Commands

- `/audit` — API Consistency Audit
- `/docs` — Documentation Helper
- `/plan` — Check LOOP Plan Progress
- `/review` — Code Review
