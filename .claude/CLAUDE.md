# LOOP Solutions — Claude Code Context

> Project: LOOP Solutions Agency Platform — FE (Vite/React) + BE (Next.js 15 API)
> Last Updated: 2026-04-03
> Language: Vietnamese (code comments, docs), English (variable names, function names)
> Status: ALL 8 PHASES COMPLETE ✅ (F0–F8) + Fi + Fs + R-seed ✅ — 224 route files, 99 models, ~90 i18n columns, 5 locales; infrastructure: slo.ts(221L) + logger.ts(265L) + scaleGate.ts(552L) + capacity.ts(377L) + Inngest (8 functions, 396L); cache: Cache-Control on 6 v1 GETs; idempotency: IdempotencyKey model + withIdempotency() on 6 mutations; observability: logger.withSLO() on 14 endpoints; rate-limit: applyRateLimit() on 5 public + auth/login; scale gate: 0 blocking, 4 non-critical warnings; 4/4 admin translate tabs ✅ (MembersTab done 2026-03-31); process docs: CompanyProcessPage ✅ v3.1.0 + loop-business-logic.md ✅ (24 discrepancies fixed); remaining: JA/KO/ZH translation (MEDIUM), I18N-RUNBOOK (MEDIUM), JSON migration (P2). Build ✅ tsc ✅ lint ✅.
> CI/CD: GitHub connected to Vercel, auto-deploy on push. Domain: loops.vn (production).

---

## ⚠️ CRITICAL — Prototype vs Production

```
/src/                    ✅ PRODUCTION — Next.js 15, live at loops.vn
/FE/                    ⚠️ PROTOTYPE — Vite mock, NOT connected to production
/DESIGN LOOPS/          ⚠️ PROTOTYPE — Design reference, NOT connected to production
```

### KHÔNG BAO GIỜ làm:

- ❌ Copy/paste code từ `FE/` hoặc `DESIGN LOOPS/` vào `src/` — sẽ break production
- ❌ Import components từ `FE/` hoặc `DESIGN LOOPS/` vào `src/`
- ❌ Dùng mock data files (`src/data/*`) trong production pages
- ❌ Chỉnh sửa production code dựa trên logic từ prototype folders

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

### Hai codebase song song

| | FE Mock | BE API |
|---|---|---|
| **Thư mục** | `d:/LOOP_COMPANY/LOOP/FE/` | `d:/LOOP_COMPANY/LOOP/` |
| **Framework** | Vite + React 18 + Tailwind v4 | Next.js 15 + Prisma 7 + PostgreSQL/Neon |
| **Port dev** | `5173` / `5174` | `3000` |
| **Trạng thái** | FE mock → BE thật, all 8 phases done | 224 route files, 99 models, seed đầy đủ (28 members, LP economy, quests, events) |
| **Phong cách** | Gaming/Cyberpunk dark theme | Professional agency website |
| **i18n** | useLocaleStore → 5 locale | 5 ngôn ngữ (VI/EN/JA/KO/ZH) |

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
FE/src/
├── app/
│   ├── App.tsx                     # Entry: RouterProvider + OnboardingPage overlay
│   ├── routes.ts                   # 21 routes (public + auth + dashboards)
│   ├── Home.tsx                    # Team page (/doi-ngu) — MemberCard grid, HUD, HallOfFame
│   ├── MemberDetailPage.tsx         # Member detail (/member/:id)
│   ├── LOOP_OPERATIONS_DOC.tsx     # Full system documentation (JSdoc comment)
│   ├── pages/
│   │   ├── LandingPage.tsx         # Public home (/)
│   │   ├── ServicesPage.tsx        # Services list
│   │   ├── ServiceDetailPage.tsx   # Service detail
│   │   ├── PortfolioPage.tsx       # Portfolio list
│   │   ├── ProjectDetailPage.tsx   # Project detail
│   │   ├── BlogPage.tsx            # Blog list
│   │   ├── BlogDetailPage.tsx      # Blog detail
│   │   ├── AcademyPage.tsx         # Academy list
│   │   ├── CourseDetailPage.tsx    # Course player (Video Gate, Code Exercise, Certificate)
│   │   ├── BookingWizardPage.tsx   # 8-step pricing wizard
│   │   ├── MediaBookingPage.tsx   # Media booking
│   │   ├── ContactPage.tsx         # Contact form
│   │   ├── AuthPage.tsx            # Login/Register
│   │   ├── AdminDashboard.tsx     # Admin portal (23 tabs)
│   │   ├── CustomerDashboard.tsx   # Customer portal (8 tabs)
│   │   ├── StaffPortal.tsx         # Staff portal
│   │   ├── LeaderboardPage.tsx    # LP leaderboard
│   │   ├── CompanyProcessPage.tsx # Company process
│   │   └── OnboardingPage.tsx     # 5-slide onboarding (localStorage skip)
│   ├── components/
│   │   ├── admin/                  # 21 admin tab components
│   │   │   ├── OverviewTab (inline in AdminDashboard)
│   │   │   ├── OrdersTab.tsx       # Order pipeline + chat + send demo
│   │   │   ├── MembersTab.tsx      # CRUD 27 members + rank/LP + translate tab
│   │   │   ├── ServicesTab.tsx      # Service CRUD + demo links
│   │   │   ├── PortfolioTab.tsx    # Portfolio CRUD + demo links
│   │   │   ├── AcademyTab.tsx      # Courses + students + videos tabs
│   │   │   ├── BlogTab.tsx          # Blog CRUD
│   │   │   ├── EffectsTab.tsx       # Rank effects CRUD + global toggle
│   │   │   ├── LPManagementTab.tsx  # LP distribution + transactions
│   │   │   ├── QuestEventsTab.tsx  # Quests + Events CRUD
│   │   │   ├── QuotationTab.tsx    # Wizard 8-step config
│   │   │   ├── RevenueTab.tsx      # Revenue charts
│   │   │   ├── ClientsTab.tsx       # CRM
│   │   │   ├── KanbanBoard.tsx     # Task kanban
│   │   │   ├── ProjectsCompletedTab.tsx
│   │   │   ├── WebPackagesTab.tsx
│   │   │   ├── IncomeTaxTab.tsx
│   │   │   ├── AdminLeaderboardTab.tsx
│   │   │   ├── AnalyticsTab.tsx
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── DepartmentsTab.tsx
│   │   ├── customer/
│   │   │   ├── EffectsInventoryTab.tsx  # Customer equips effects
│   │   │   └── QuestsTab.tsx           # Customer quests list
│   │   ├── team/
│   │   │   ├── memberData.ts         # 27 members + RANKS config
│   │   │   ├── MemberCard.tsx        # Card với rank effects (particles, glow, aura...)
│   │   │   ├── HUDPanel.tsx           # HUD overlay (radar chart, stats, missions)
│   │   │   ├── HallOfFame.tsx        # MVP/BugSlayer/TopPerformer showcase
│   │   │   ├── RoleFilters.tsx        # 9 role filter buttons
│   │   │   └── SearchSortBar.tsx      # Search + sort dropdown
│   │   ├── layout/
│   │   │   ├── ds.ts              # Design tokens (DS, GRD, NAV_LINKS)
│   │   │   ├── Navbar.tsx          # Navbar (auth state, user menu, search)
│   │   │   ├── Footer.tsx           # Footer + CTA
│   │   │   └── PublicLayout.tsx    # Navbar + Outlet + Footer
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   └── ui/                    # 45 Radix UI components (shadcn-style)
│   ├── store/
│   │   ├── loopStore.ts            # Zustand: orders, services, portfolio, effects, notifs
│   │   └── authStore.ts            # Zustand: auth, quests, events, dailyStreak
│   └── hooks/
│       └── useRealtimeNotifications.ts  # Simulated live notifications (setInterval)
├── styles/
│   ├── index.css                  # @import fonts + tailwind + theme
│   ├── fonts.css                  # Google Fonts: Cinzel, Inter, JetBrains Mono, Noto Serif JP
│   ├── tailwind.css              # Tailwind v4 config + CSS variables
│   └── theme.css                 # Scrollbar zen styles
└── assets/
    └── 3de9c8bfb537946e3dd01b9dbae9004d9c921471.png  # Logo image
```

---

## BE API hiện có (từ Next.js)

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

## BE Prisma Models (key)

| Model | Mục đích FE |
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

## Admin RBAC (từ authStore.ts)

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
Courses + Enrollment + Video Gate. BE endpoints: `courses/[id]`, `enroll`, `lessons/[id]/complete`, `progress`, `certificate`, admin `PUT/DELETE`. Academy seed: 6 instructors, 7 courses, lessons, enrollments. FE wiring: PaymentModal→enroll API, CoursePlayer→completeLesson API, AcademyTab→CRUD.

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
# Start BE (port 3000)
cd d:/LOOP_COMPANY/LOOP && npm run dev

# Start FE (port 5173/5174)
cd d:/LOOP_COMPANY/LOOP/FE && npm run dev

# Quality gates
npm run lint    # FE: cd FE && npx eslint src/
npx tsc --noEmit  # BE type check

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
