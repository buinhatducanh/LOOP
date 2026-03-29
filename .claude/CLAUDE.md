# LOOP Solutions — Claude Code Context

> Project: LOOP Solutions Agency Platform — FE (Vite/React) + BE (Next.js 15 API)
> Last Updated: 2026-03-29
> Language: Vietnamese (code comments, docs), English (variable names, function names)
> Status: Phase F0 ✅ completed | Phase F1 ✅ completed | Phase F2 ✅ completed — Wizard wired BE APIs, ORDER_STATUS_LABELS 6×5 locale, WIZARD_STEP_LABELS 8×5 locale. 5-locale smoke test PASSED.

---

## Tổng quan dự án

### Hai codebase song song

| | FE Mock | BE API |
|---|---|---|
| **Thư mục** | `d:/LOOP_COMPANY/LOOP/FE/` | `d:/LOOP_COMPANY/LOOP/` |
| **Framework** | Vite + React 18 + Tailwind v4 | Next.js 15 + Prisma 7 + PostgreSQL/Neon |
| **Port dev** | `5173` / `5174` | `3000` |
| **Trạng thái** | Mock UI hoàn chỉnh, 0 BE connection | 200 route files, 357+ HTTP methods |
| **Phong cách** | Gaming/Cyberpunk dark theme | Professional agency website |
| **i18n** | Hard-coded VI/EN | 5 ngôn ngữ (VI/EN/JA/KO/ZH) |

### Mục tiêu hiện tại
Kết nối FE mock với BE thật theo nghiệp vụ LOOP — giữ nguyên 100% giao diện FE, thay mock data bằng API thật từ BE.

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
- `GET /api/v1/pricing?lang=`
- `GET /api/v1/blog?lang=` → BlogPost list

### Admin APIs (key)
- `GET/POST /api/admin/services` → Service CRUD
- `GET/POST /api/admin/projects` → Project CRUD
- `GET/POST /api/admin/team` → TeamMember CRUD
- `GET/POST /api/admin/orders` → Order CRUD
- `GET/POST /api/admin/blog-posts` → BlogPost CRUD
- `GET/POST /api/admin/edu/courses` → Course CRUD
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

**⚠️ MISSING in BE (cần tạo):**
- `RankEffect` model — hiệu ứng theo rank (effectsTab)
- `MemberEffectOverride` — override hiệu ứng theo member
- `Quest` / `CompanyEvent` models — quest + event system
- `QuestParticipant` — ai tham gia event nào

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

### Phase F1 — Public Pages 🔄
Landing, Services, Portfolio, Blog, Contact — kết nối public APIs.

### Phase F2 — Booking Wizard + Orders
Wizard 8 bước + Order lifecycle.

### Phase F3 — Team + Effects
27 members + Rank effects system.

### Phase F4 — Academy
Courses + Enrollment + Video Gate.

### Phase F5 — Customer Portal
Customer dashboard + LP wallet + quests.

### Phase F6 — Admin CMS
23 admin tabs — 100% wired to BE APIs.

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
```

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
