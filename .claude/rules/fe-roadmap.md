# FE Roadmap — LOOP Solutions (FE-First)

> **Gốc rễ:** Thiết kế từ folder FE mock → kết nối BE thật
> **Nguyên tắc:** Giao diện tuyệt đối giữ nguyên — chỉ thay mock data bằng API thật
> **Mục tiêu:** 100% FE mock hoạt động với backend LOOP thật
> **Cập nhật:** 2026-03-28

---

## 1. Hiện trạng

### FE Mock (`d:/LOOP_COMPANY/LOOP/FE/`)
- **Trạng thái:** UI hoàn chỉnh, 100% giao diện theo thiết kế cyberpunk/zen
- **Data:** Tất cả hard-coded trong Zustand stores (`loopStore.ts`, `authStore.ts`) và `memberData.ts`
- **Auth:** Demo users (admin, manager, staff, client) — không có kết nối thật
- **Backend:** Chưa kết nối — cần tạo API client layer

### BE Next.js (`d:/LOOP_COMPANY/LOOP/`)
- **Trạng thái:** API-only, 200 route files, 357+ HTTP methods
- **Database:** 60+ Prisma models, PostgreSQL/Neon
- **Public APIs:** v1 endpoints với i18n `?lang=` support
- **Admin APIs:** Đầy đủ CRUD cho Orders, Services, Projects, Team, Blog, Courses, LP
- **Thiếu:** RankEffect, Quest/Event models + một số endpoint gaming

---

## 2. Design Principles

1. **Giao diện tuyệt đối giữ nguyên** — không đổi 1 pixel UI
2. **Contract-first** — FE chỉ tích hợp khi BE contract đã chốt
3. **Fallback-safe** — FE mock data giữ lại làm fallback khi API lỗi
4. **Phased integration** — theo luồng nghiệp vụ, không rewrite toàn bộ
5. **Performance-first** — pagination, caching, lazy loading từ đầu

---

## 2.1 Phase Status Tracker (Single Source of Truth)

> Cập nhật tracker này vào cuối mỗi tuần để toàn team nhìn cùng một trạng thái roadmap.

| Phase | Status | Owner | Planned Window | Actual Window | Notes |
|---|---|---|---|---|---|
| F0 Infrastructure | in_progress | FE Lead | Tuần F0 |  | Auth + API client đã khởi động |
| F1 Public Pages | pending | FE Team | Tuần F1 |  | |
| F2 Booking/Orders | pending | FE+BE | Tuần F2 |  | |
| F3 Team/Effects | pending | FE+BE | Tuần F3 |  | |
| F4 Academy | pending | FE+BE | Tuần F4 |  | |
| F5 Customer Portal | pending | FE+BE | Tuần F5 |  | |
| F6 Admin 23 tabs | pending | FE+BE | Tuần F6 |  | |
| F7 Realtime/Polish | pending | FE+BE | Tuần F7 |  | |
| F8 Scale Hardening | pending | FE+BE+DevOps | Tuần F8 |  | |

### Quy tắc cập nhật tracker (mỗi tuần)

- Chỉ dùng 4 trạng thái: `pending | in_progress | blocked | completed`.
- Mỗi phase phải có đúng 1 owner chịu trách nhiệm cập nhật.
- Nếu phase bị `blocked` > 2 ngày: bắt buộc mở risk record + escalation.
- Mọi thay đổi status phải đồng bộ vào:
  - `fe-phase-status-log.md` (append log entry)
  - `fe-weekly-status-report.md`
  - `fe-risk-register-template.md`
  - `fe-master-index.md` (nếu có đổi sequence/priority)

---

## 3. Luồng nghiệp vụ LOOP (Business Flow)

```
[PUBLIC] ─────────────────────────────────────────────────────────────
│
├─ Landing (/ )                    → HomeSlider, Testimonial, KPI
├─ Services (/dich-vu)             → 4 dịch vụ + pricing tiers
│  └─ Service Detail (/dich-vu/:id)
├─ Portfolio (/du-an)             → 6 dự án + filter theo category
│  └─ Project Detail (/du-an/:id)  → Challenge/Solution/Result + metrics
├─ Blog (/blog)                    → Blog posts list
│  └─ Blog Detail (/blog/:id)
├─ Contact (/lien-he)               → Form liên hệ → ContactMessage
├─ Booking Wizard (/dat-lich)     → 8 bước → Quote → Order
│   Step 1: Chọn dịch vụ
│   Step 2: Chọn gói (Starter/Business/Enterprise ×1/×2.2/×3.8)
│   Step 3: Tính năng tùy chọn
│   Step 4: Nhân sự phụ trách
│   Step 5: Lịch hẹn tương tác
│   Step 6: Dịch vụ thêm (hosting, bảo trì...)
│   Step 7: Review đơn hàng
│   Step 8: Thanh toán (VNĐ + LP discount ≤20%)
│
[CUSTOMER PORTAL] /khach-hang ────────────────────────────────────────
│ Tổng quan | Dự án | Khóa học | Hóa đơn | Ví LP | Giới thiệu | Hỗ trợ | Cài đặt
│
├─ Order flow: pending_payment → paid → in_progress → demo_ready → client_review → done
├─ Academy enrollment: Free Trial → VNĐ/LP+VNĐ/LP → Video Gate 35% → Certificate
└─ LP: balance + history + redeem (max 20% discount, 1000LP=500K VND)

[TEAM / MEMBER] (/doi-ngu, /member/:id) ──────────────────────────────
│ 27 thành viên | Rank Iron→Diamond | LP | Mission Logs | Skills Radar
│
├─ Rank effects: 10 effects (particle glow, border gradient, shimmer, aura...)
├─ EffectsTab (admin): global toggle + CRUD + per-rank + per-member override
└─ HallOfFame: MVP Legend, Bug Slayer, Top Performer

[ADMIN DASHBOARD] (/admin) ───────────────────────────────────────────
│ 23 tabs theo department (engineering/design/media/marketing/sales/finance/hr/management)
│
├─ QUẢN LÝ: Tổng quan | Đơn hàng | Thành viên | Kanban
├─ SẢN PHẨM: Dịch vụ | Báo giá | Portfolio | Dự án xong | Học viện | Blog
├─ TÀI CHÍNH: Doanh thu | Khách hàng | LP
└─ HỆ THỐNG: Hiệu ứng | Thông báo | Cài đặt | Quests&Events | Leaderboard | Analytics
```

---

## 4. API Contract Checklist

### Public Content APIs
- [ ] `GET /api/v1/services?lang={locale}` → ServicesPage + ServiceDetailPage
- [ ] `GET /api/v1/projects?lang={locale}` → PortfolioPage + ProjectDetailPage
- [ ] `GET /api/v1/team?lang={locale}` → Home.tsx (27 members)
- [ ] `GET /api/v1/testimonials?lang={locale}` → LandingPage testimonials
- [ ] `GET /api/v1/pricing?lang={locale}` → BookingWizardPage (pricing config)
- [ ] `GET /api/v1/blog?lang={locale}` → BlogPage + BlogDetailPage
- [ ] `POST /api/contact` → ContactPage form submission

### Auth APIs
- [ ] `POST /api/admin/auth/login` → AuthPage
- [ ] `GET /api/admin/auth/me` → Navbar user info + auth guards
- [ ] `POST /api/admin/auth/logout` → AuthPage logout

### Booking & Order APIs
- [ ] `GET /api/pricing/config` → Wizard step 1–8 data (services, packages, features, extras)
- [ ] `POST /api/pricing/calculate` → Wizard real-time price calculation
- [ ] `POST /api/quote` → Submit wizard → create Order
- [ ] `GET /api/admin/orders` → Admin OrdersTab + CustomerDashboard orders
- [ ] `GET /api/admin/orders/[id]` → OrderDetailPanel
- [ ] `PUT /api/admin/orders/[id]` → Update order
- [ ] `POST /api/admin/orders/[id]/transition` → Advance order status
- [ ] `POST /api/admin/orders/[id]/demo` → Send demo (masked URL)
- [ ] `GET /api/orders/[id]/messages` → Order chat
- [ ] `POST /api/orders/[id]/messages` → Send message

### Team & Member APIs
- [ ] `GET /api/v1/team?lang={locale}` → Home.tsx
- [ ] `GET /api/v1/team/[id]` → MemberDetailPage
- [ ] `GET /api/admin/team` → MembersTab list
- [ ] `POST /api/admin/team` → MembersTab create
- [ ] `PUT /api/admin/team/[id]` → MembersTab update (kể cả i18n fields)
- [ ] `DELETE /api/admin/team/[id]` → MembersTab delete

### Effects & LP APIs
- [ ] `GET /api/effects` → Effects data (FE seed)
- [ ] `POST /api/admin/effects` → EffectsTab create
- [ ] `PUT /api/admin/effects/[id]` → EffectsTab update
- [ ] `DELETE /api/admin/effects/[id]` → EffectsTab delete
- [ ] `PUT /api/admin/effects/global-toggle` → Global enable/disable
- [ ] `GET /api/admin/lp` → LPManagementTab
- [ ] `GET /api/admin/lp-transactions` → LP history
- [ ] `POST /api/admin/lp-awards` → Award LP
- [ ] `GET /api/admin/lp-summary/[projectId]` → LP summary per project
- [ ] `GET /api/customer/lp` → CustomerDashboard LP balance
- [ ] `POST /api/customer/lp/redeem` → Redeem LP for discount

### Quest & Event APIs
- [ ] `GET /api/quests` → Customer quests list
- [ ] `GET /api/events` → Active events
- [ ] `POST /api/admin/quests` → QuestEventsTab create
- [ ] `PUT /api/admin/quests/[id]` → QuestEventsTab update
- [ ] `DELETE /api/admin/quests/[id]` → QuestEventsTab delete
- [ ] `POST /api/admin/events` → Create event
- [ ] `PUT /api/admin/events/[id]` → Update event
- [ ] `POST /api/quests/[id]/claim` → Claim LP reward

### Academy APIs
- [ ] `GET /api/v1/courses?lang={locale}` → AcademyPage
- [ ] `GET /api/v1/courses/[id]?lang={locale}` → CourseDetailPage
- [ ] `GET /api/admin/edu/courses` → AcademyTab courses view
- [ ] `POST /api/admin/edu/courses` → AcademyTab create course
- [ ] `PUT /api/admin/edu/courses/[id]` → AcademyTab update course
- [ ] `DELETE /api/admin/edu/courses/[id]` → AcademyTab delete course
- [ ] `GET /api/admin/edu/enrollments` → AcademyTab students view
- [ ] `GET /api/admin/edu/enrollments/[id]` → Student detail modal
- [ ] `POST /api/academy/enroll` → CourseDetailPage enrollment
- [ ] `GET /api/academy/progress/[courseId]` → CoursePlayer progress
- [ ] `POST /api/academy/lessons/[id]/complete` → Mark lesson complete (Video Gate check)
- [ ] `GET /api/academy/certificate/[courseId]` → Certificate eligibility

### Dashboard & Analytics
- [ ] `GET /api/admin/dashboard` → Admin overview KPIs
- [ ] `GET /api/admin/dashboard/charts` → Revenue charts
- [ ] `GET /api/admin/clients` → ClientsTab CRM
- [ ] `GET /api/admin/revenue` → RevenueTab
- [ ] `GET /api/admin/analytics` → AnalyticsTab

### Misc
- [ ] `GET /api/admin/notifications` → NotificationCenter
- [ ] `PUT /api/admin/notifications/[id]/read` → Mark read
- [ ] `GET /api/admin/figma-demos` → Demo links management
- [ ] `POST /api/admin/figma-demos/[id]/approve` → Approve demo
- [ ] `POST /api/admin/figma-demos/[id]/reject` → Reject demo

---

## 5. Phase Breakdown

### Phase F0 — Infrastructure (Foundation)
**Tuần F0**

Mục tiêu: Hạ tầng kết nối FE ↔ BE, auth, API client layer.

- [ ] Tạo API client (`src/api/client.ts`): fetch wrapper, auth header, error mapping
- [ ] Tạo service files theo domain: `auth.service.ts`, `services.service.ts`, `team.service.ts`, v.v.
- [ ] Auth flow: kết nối `POST /api/admin/auth/login` → `GET /api/admin/auth/me` → Navbar user state
- [ ] Auth guard: bảo vệ `/admin`, `/khach-hang`, `/dang-nhap`
- [ ] Persist auth: localStorage token → Authorization header
- [ ] Demo users fallback: giữ DEMO_USERS trong authStore làm fallback khi BE offline
- [ ] Lint + type-check + build pass

**Exit criteria:** Auth flow hoạt động end-to-end với BE thật. `/admin` bảo vệ bởi real JWT.

---

### Phase F1 — Public Pages (Content APIs)
**Tuần F1**

Mục tiêu: Landing, Services, Portfolio, Blog, Contact dùng API thật.

**P0:**
- [ ] `GET /api/v1/services?lang=` → ServicesPage + ServiceDetailPage
- [ ] `GET /api/v1/projects?lang=` → PortfolioPage + ProjectDetailPage
- [ ] `GET /api/v1/testimonials?lang=` → LandingPage testimonials
- [ ] `POST /api/contact` → ContactPage form
- [ ] Loading/empty/error states đầy đủ cho tất cả pages

**P1:**
- [ ] `GET /api/v1/blog?lang=` → BlogPage + BlogDetailPage
- [ ] `GET /api/v1/home-sliders` → LandingPage hero sliders
- [ ] `GET /api/v1/home-video` → LandingPage video section

**P2:**
- [ ] i18n param đồng nhất từ Navbar locale switcher

**Exit criteria:** 100% public pages dùng API thật. Không còn mock data trên production.

---

### Phase F2 — Booking Wizard + Orders
**Tuần F2**

Mục tiêu: Wizard 8 bước tạo order thật + Order lifecycle hoàn chỉnh.

**P0:**
- [ ] `GET /api/pricing/config` → Wizard load tất cả config (services, packages, features, extras)
- [ ] `POST /api/pricing/calculate` → Real-time pricing (base × multiplier + extras + tax)
- [ ] LP discount: `1,000 LP = 500,000 VNĐ`, max 20% discount
- [ ] `POST /api/quote` → Submit wizard → create Order
- [ ] Wizard summary: hiển thị breakdown giá chính xác

**P1:**
- [ ] `GET /api/admin/orders` → Admin OrdersTab list
- [ ] `PUT /api/admin/orders/[id]/transition` → Status pipeline
- [ ] `POST /api/admin/orders/[id]/demo` → Send demo → masked URL → customer notification
- [ ] Order chat: `GET/POST /api/orders/[id]/messages`
- [ ] CustomerDashboard: orders tab dùng API thật

**Exit criteria:** Wizard tạo được order thật trong DB. Admin thấy order mới, advance được status.

---

### Phase F3 — Team + Effects + Rank System
**Tuần F3**

Mục tiêu: 27 thành viên + Rank effects hoạt động từ BE.

**P0:**
- [ ] `GET /api/v1/team?lang=` → Home.tsx (27 members, filter, sort, rank strip)
- [ ] `GET /api/v1/team/[id]` → MemberDetailPage
- [ ] Rank system: Iron(1-14) → Bronze(15-34) → Silver(35-54) → Gold(55-74) → Platinum(75-84) → Ruby(85-94) → Diamond(95+)
- [ ] HUDPanel: skills radar (SVG), mission logs, rank history từ BE
- [ ] HallOfFame: MVP/BugSlayer/TopPerformer từ BE query

**P1:**
- [ ] `GET /api/admin/team` → MembersTab list với full data
- [ ] `POST/PUT/DELETE /api/admin/team` → MembersTab CRUD
- [ ] MembersTab translate tab: EN/JA/KO/ZH name/role/bio fields
- [ ] LP display: `GET /api/customer/lp` → MemberCard + Navbar LP badge

**P2:**
- [ ] EffectsTab: global toggle (on/off) + CRUD 10 effects + per-rank + per-member override
- [ ] MemberCard VFX: effects được apply từ BE `userEquippedEffects`

**Exit criteria:** Team page + Member detail + EffectsTab hoạt động từ BE. Rank effects render đúng.

---

### Phase F4 — Academy
**Tuần F4**

Mục tiêu: Academy flow từ enrollment đến certificate.

**P0:**
- [ ] `GET /api/v1/courses?lang=` → AcademyPage (7 courses)
- [ ] `GET /api/v1/courses/[id]?lang=` → CourseDetailPage
- [ ] FreeTrialModal: xem preview không cần enroll
- [ ] PaymentModal: VNĐ / LP+VNĐ / LP toàn phần
- [ ] `POST /api/academy/enroll` → Enrollment flow

**P1:**
- [ ] CoursePlayer: Video Gate ≥35% → unlock next lesson
- [ ] `POST /api/academy/lessons/[id]/complete` → mark lesson + check gate
- [ ] Code Exercise panel (FE giữ nguyên, kết nối submit endpoint)
- [ ] Comments section mỗi bài học

**P2:**
- [ ] `GET /api/academy/certificate/[courseId]` → Certificate display
- [ ] AcademyTab: admin CRUD courses + student progress + video stats + gate config
- [ ] LP reward khi hoàn thành khóa

**Exit criteria:** Student có thể enroll → học (Video Gate) → nhận certificate.

---

### Phase F5 — Customer Portal + LP Economy
**Tuần F5**

Mục tiêu: Customer dashboard 100% từ BE, LP economy hoàn chỉnh.

**P0:**
- [ ] CustomerDashboard overview: KPIs, recent orders, LP balance từ BE
- [ ] Orders tab: full order history + status + demo links
- [ ] LP tab: balance + history + redeem (→ Order discount)
- [ ] `POST /api/customer/lp/redeem` → Apply LP discount vào wizard/quote

**P1:**
- [ ] Invoices tab: payment history + status
- [ ] Academy tab: enrolled courses + progress
- [ ] Referral tab: mã giới thiệu + stats

**P2:**
- [ ] QuestsTab: quests list + claim rewards
- [ ] Events display: active events + join
- [ ] Support tab: chat với PM

---

### Phase F6 — Admin Full Integration
**Tuần F6**

Mục tiêu: 23 admin tabs 100% wired to BE APIs.

**Priority order:**
1. OrdersTab (highest business impact)
2. MembersTab (27 members + i18n)
3. ServicesTab + PortfolioTab
4. AcademyTab (courses + students + videos)
5. EffectsTab + LPManagementTab
6. QuestEventsTab
7. RevenueTab + ClientsTab + AnalyticsTab
8. BlogTab
9. QuotationTab (pricing wizard config)
10. Remaining tabs (Kanban, IncomeTax, WebPackages, Departments, NotificationCenter, Settings, Leaderboard, Overview)

**Exit criteria:** Admin dashboard hoạt động hoàn chỉnh với BE, RBAC enforced.

---

### Phase F7 — Real-time + Quest/Events + Polish
**Tuần F7**

- Quest system BE integration (Quest + CompanyEvent + QuestParticipant models)
- Realtime notifications: SSE/WebSocket cho admin dashboard
- Leaderboard: LP ranking từ BE
- AnalyticsTab: charts từ BE API
- Performance audit + bundle optimization
- Regression test + go-live

---

### Phase F8 — Scale Hardening (Operations)
**Tuần F8**

Mục tiêu: chuẩn hóa vận hành scale để hệ thống tăng tải vẫn ổn định.

**P0:**
- [ ] Bật scale-readiness gate cho tất cả feature P0/P1 (retry + cache + async + monitoring)
- [ ] Chuẩn hóa cache policy cho public list + dashboard endpoints
- [ ] Chuẩn hóa async jobs cho tác vụ nặng (analytics/report/media/notification fanout)
- [ ] Thiết lập SLO baseline: p95, error rate, queue backlog
- [ ] Thiết lập release monitoring checklist 0-24h sau deploy

**P1:**
- [ ] Dashboard vận hành: latency/error/queue snapshots theo domain
- [ ] Tài liệu incident quick play cho auth/order/queue backlog
- [ ] Capacity planning theo số liệu thực tế (không estimate cảm tính)

**P2:**
- [ ] Tạo kế hoạch tách service theo strangler pattern cho domain có bottleneck rõ

**Exit criteria:**
- Scale runbook active
- SLO baseline stable 2 tuần liên tiếp
- Release không có blocker incident do performance/regression

---

## 6. BE Gaps — Models cần tạo

### Priority 1: Effects System
```prisma
model RankEffect {
  id          String   @id @default(cuid())
  name        String
  description String
  type        String   // particle, glow, border, aura, trail, shimmer
  rarity      String   // common, rare, epic, legendary
  icon        String
  color       String
  minRank     String   // iron, bronze, silver, gold, platinum, ruby, diamond
  minLevel    Int
  maxLevel    Int?
  isEnabled   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Priority 2: Quest & Event System
```prisma
model Quest {
  id          String   @id @default(cuid())
  title       String
  description String
  lpReward    Int
  xpReward    Int
  frequency   String   // daily, weekly, monthly, one_time, event
  category    String   // engagement, project, social, learning, achievement
  icon        String
  color       String
  target      Int
  forRoles    String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CompanyEvent {
  id          String   @id @default(cuid())
  title       String
  description String
  type        String
  startDate   DateTime
  endDate     DateTime
  lpBonus     Int
  color       String
  icon        String
  isActive    Boolean  @default(true)
  participants QuestParticipant[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model QuestParticipant {
  id        String       @id @default(cuid())
  userId    String
  eventId   String
  joinedAt  DateTime     @default(now())
  event     CompanyEvent @relation(...)
}
```

---

## 7. Tech Debt & Known Issues

| # | Issue | Impact | Priority |
|---|---|---|---|
| 1 | BE thiếu RankEffect model | EffectsTab chưa có BE | P0 |
| 2 | BE thiếu Quest/CompanyEvent models | Quest system chưa có BE | P0 |
| 3 | `/api/services` vs `/api/v1/services` — 2 version | Cần unify contract | P1 |
| 4 | Wizard pricing config endpoint chưa chuẩn | Wizard chưa có real pricing | P0 |
| 5 | DemoViewer masked URL logic chưa rõ BE | Demo links trong OrdersTab | P1 |
| 6 | Video Gate logic (35%) chưa có BE endpoint | Academy Video Gate | P0 |
| 7 | Academy: enrollment + progress + certificate chưa đầy đủ | Academy flow | P0 |

---

## 8. Quick Start Commands

```bash
# Start BE (Next.js API, port 3000)
cd d:/LOOP_COMPANY/LOOP && npm run dev

# Start FE (Vite, port 5173/5174)
cd d:/LOOP_COMPANY/LOOP/FE && npm run dev

# BE type check
cd d:/LOOP_COMPANY/LOOP && npx tsc --noEmit

# FE lint
cd d:/LOOP_COMPANY/LOOP/FE && npx eslint src/

# FE type check
cd d:/LOOP_COMPANY/LOOP/FE && npx tsc --noEmit
```

---

## 9. Liên kết

- `docs/API-CONTRACT.md` — BE API contracts
- `.claude/rules/fe-delivery-process.md` — Delivery process chuẩn
- `.claude/rules/fe-i18n-implementation-plan.md` — i18n plan
- `.claude/rules/fe-architecture-microservices.md` — Architecture overview
