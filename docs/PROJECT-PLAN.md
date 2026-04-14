# LOOP Solutions — Dự án Hoàn Chỉnh: Kế Hoạch & Quy Tắc

> **Document này là NGUỒN SỰ THẬT DUY NHẤT cho toàn bộ dự án.**
> Cập nhật ngay khi có thay đổi. Không được phép contradict với file này.

---
> **⚡ TỐI THƯỢNG SPRINT HIỆN TẠI (PHASE 1 - CỐT LÕI):** Băng giá mọi tính năng Gamification mới. Đóng băng kế hoạch (Deferred) Mobile App và SaaS B2B. Tập trung 100% hỏa lực vào luồng Kanban (Admin) và dọn dẹp dòng tiền Off-system (Cap Limit LP) trên Web trước khi đi tiếp.
---

## MỤC LỤC

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Quy Tắc Vàng (Non-Negotiable)](#2-quy-tắc-vàng-non-negotiable)
3. [Cấu Trúc Thư Mục Mục Tiêu](#3-cấu-trúc-thư-mục-mục-tiêu)
4. [Design Tokens — Nguồn Sự Thật Duy Nhất](#4-design-tokens--nguồn-sự-thật-duy-nhất)
5. [Database & Data Layer](#5-database--data-layer)
6. [Giai Đoạn Thực Hiện](#6-giai-đoạn-thực-hiện)
7. [Quy Tắc Mỗi Trang](#7-quy-tắc-mỗi-trang)
8. [Hardcode Checklist](#8-hardcode-checklist)
9. [i18n Quy Tắc](#9-i18n-quy-tắc)
10. [API Layer Quy Tắc](#10-api-layer-quy-tắc)
11. [Admin Dashboard Quy Tắc](#11-admin-dashboard-quy-tắc)
12. [Hoàn Thành & Duyệt Tiêu Chuẩn](#12-hoàn-thành--duyệt-tiêu-chuẩn)

---

## 1. Tổng Quan Kiến Trúc

```
LOOP_COMPANY/
├── LOOP/                          ← THƯ MỤC LÀM VIỆC CHÍNH (BE + Next.js App)
│   ├── src/
│   │   ├── app/                   ← Next.js App Router (pages, API routes)
│   │   ├── components/            ← Shared components
│   │   ├── lib/                   ← Core business logic, API client, design tokens
│   │   ├── store/                 ← Zustand stores (auth đã migrate, NO business data)
│   │   ├── i18n/                  ← i18n config + messages
│   │   ├── data/                  ← TYPE EXPORTS ONLY — no data values
│   │   └── generated/             ← Prisma generated client
│   ├── prisma/
│   │   ├── schema.prisma          ← Database schema (60+ models)
│   │   └── seed.ts                ← SEED tất cả data vào DB
│   └── docs/                      ← Project docs
│
└── DESIGN LOOPS/                  ← 📖 THƯ MỤC CHỈ ĐỌC — KHÔNG THAO TÁC
    └── (tất cả files)              ← Reference UI/UX, không được sửa
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.1.9 (App Router, TypeScript) |
| Database | PostgreSQL via Neon.tech |
| ORM | Prisma 7.4.2 |
| Auth | NextAuth v5 Beta + Google OAuth |
| State (Client) | Zustand v5 |
| State (Server) | React Query v5 (TanStack Query) |
| Background Jobs | Inngest v4 |
| Cache | Upstash Redis |
| i18n | next-intl v3 (5 locales: vi, en, ja, ko, zh) |
| CSS | Tailwind CSS v4 |
| CMS | Sanity.io |
| Email | Resend |

---

## 2. Quy Tắc Vàng (Non-Negotiable)

### 2.1 KHÔNG BAO GIỜ Hardcode

> ⚠️ **Tuyệt đối cấm hardcode. Mọi giá trị phải đến từ: ENV vars, DB, hoặc i18n messages.**

```typescript
// ❌ SAI — hardcoded
const url = "https://loop.vn";
const name = "VNRetail JSC";
const price = 350_000_000;
const color = "#3B82F6";

// ✅ ĐÚNG — từ env
const url = process.env.NEXT_PUBLIC_SITE_URL;

// ✅ ĐÚNG — từ DB (Prisma)
const service = await prisma.service.findUnique({ where: { id } });

// ✅ ĐÚNG — từ i18n
const t = useTranslations("Services");
const title = t("title");
```

### 2.2 Design Tokens — Một Nguồn Duy Nhất

> **Tất cả styles phải dùng `DS`, `GRD`, `GLOW` từ `@/lib/design-tokens`.**
> Không được hardcode màu hex trực tiếp trong JSX.

```typescript
// ❌ SAI
style={{ color: "#3B82F6", background: "#0F172A" }}

// ✅ ĐÚNG
import { DS } from "@/lib/design-tokens";
style={{ color: DS.blue, background: DS.bgCard }}
```

### 2.3 Auth Store — Đã Migrate, Không Rollback

> **`src/app/store/authStore.ts` đã migrate sang real API.**
> Không quay lại mock users (`DEMO_USERS`). Mọi user phải đến từ DB.

### 2.4 Không Thao Tác DESIGN LOOPS

> **Cấm tuyệt đối:** Tạo, sửa, xóa bất kỳ file nào trong `d:/LOOP_COMPANY/DESIGN LOOPS/`.
> Chỉ đọc để reference UI/UX.

### 2.5 Mỗi Trang = Một Route File

> **Mỗi trang phải là một route file riêng trong `src/app/[locale]/` hoặc `src/app/admin/`**.
> Không gộp nhiều pages vào một file component lớn (trừ khi là shared component).

### 2.6 Query Keys Chuẩn Hóa

> **Tất cả React Query keys phải dùng `qk` từ `@/lib/query/provider`.**
> Không hardcode query keys dạng string.

```typescript
// ❌ SAI
queryKey: ["orders", page, limit]

// ✅ ĐÚNG
import { qk } from "@/lib/query/provider";
queryKey: qk.orders({ page, limit })
```

---

## 3. Cấu Trúc Thư Mục Mục Tiêu

```
src/
├── app/
│   ├── [locale]/                  ← Public pages (i18n)
│   │   ├── page.tsx              ← Landing page (Home)
│   │   ├── services/
│   │   │   ├── page.tsx          ← Services listing
│   │   │   └── [slug]/page.tsx   ← Service detail
│   │   ├── portfolio/
│   │   │   ├── page.tsx          ← Portfolio listing
│   │   │   └── [slug]/page.tsx   ← Project detail
│   │   ├── team/
│   │   │   ├── page.tsx          ← Guild Hall (27 members)
│   │   │   └── [slug]/page.tsx   ← Member detail
│   │   ├── bang-xep-hang/
│   │   │   └── page.tsx          ← Leaderboard
│   │   ├── hoc-vien/
│   │   │   ├── page.tsx          ← Academy listing
│   │   │   └── [slug]/page.tsx   ← Course detail
│   │   ├── blog/
│   │   │   ├── page.tsx          ← Blog listing
│   │   │   └── [slug]/page.tsx   ← Post detail
│   │   ├── media/
│   │   │   └── page.tsx          ← Media services
│   │   ├── pricing/
│   │   │   └── page.tsx          ← Pricing plans
│   │   ├── booking/
│   │   │   └── page.tsx          ← 8-step booking wizard
│   │   ├── contact/
│   │   │   └── page.tsx          ← Contact form
│   │   ├── about/
│   │   │   └── page.tsx          ← About page
│   │   └── khach-hang/
│   │       └── page.tsx          ← Customer portal
│   │
│   ├── admin/                    ← Admin dashboard
│   │   ├── layout.tsx            ← Admin layout (sidebar + topbar)
│   │   ├── login/
│   │   │   └── page.tsx          ← Admin login
│   │   ├── overview/
│   │   │   └── page.tsx          ← KPI dashboard
│   │   ├── orders/
│   │   │   └── page.tsx          ← Order management
│   │   ├── members/
│   │   │   └── page.tsx          ← Team members CRUD
│   │   ├── departments/
│   │   │   └── page.tsx          ← Department management
│   │   ├── projects/
│   │   │   └── page.tsx          ← Project Kanban board
│   │   ├── services/
│   │   │   └── page.tsx          ← Services CRUD
│   │   ├── media/
│   │   │   └── page.tsx          ← Media booking management
│   │   ├── quotation/
│   │   │   └── page.tsx          ← Quotation wizard config
│   │   ├── portfolio/
│   │   │   └── page.tsx          ← Portfolio CRUD
│   │   ├── academy/
│   │   │   └── page.tsx          ← Academy management
│   │   ├── blog/
│   │   │   └── page.tsx          ← Blog management
│   │   ├── revenue/
│   │   │   └── page.tsx          ← Revenue analytics
│   │   ├── clients/
│   │   │   └── page.tsx          ← CRM clients
│   │   ├── lp/
│   │   │   └── page.tsx          ← LP overview
│   │   ├── lp_manage/
│   │   │   └── page.tsx          ← LP awards/redemptions
│   │   ├── effects/
│   │   │   └── page.tsx          ← Rank VFX effects
│   │   ├── notification_center/
│   │   │   └── page.tsx          ← Notifications
│   │   ├── quests_events/
│   │   │   └── page.tsx          ← Quests & events
│   │   ├── leaderboard_admin/
│   │   │   └── page.tsx          ← Leaderboard config
│   │   └── analytics/
│   │       └── page.tsx          ← Analytics dashboard
│   │
│   └── api/                       ← API routes (130+)
│       ├── admin/                 ← Admin CRUD (80+)
│       ├── auth/                  ← NextAuth handlers
│       └── public/                ← Public endpoints
│
├── components/
│   ├── landing/                   ← Landing page section components
│   │   ├── HeroSection.tsx
│   │   ├── StatsSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── LPSystemSection.tsx
│   │   └── CTASection.tsx
│   ├── team/                     ← Guild Hall components
│   │   ├── MemberCard.tsx
│   │   ├── HUDPanel.tsx
│   │   ├── HallOfFame.tsx
│   │   └── SearchSortBar.tsx
│   ├── admin/                    ← Admin shared components
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminTopbar.tsx
│   │   ├── AdminTable.tsx
│   │   ├── AdminModal.tsx
│   │   └── StatusBadge.tsx
│   └── ui/                       ← Shared UI primitives
│
├── lib/
│   ├── design-tokens.ts          ← ⚠️ NGUỒN SỰ THẬT DUY NHẤT cho colors/fonts
│   ├── api/
│   │   ├── client.ts             ← apiClient + adminApi
│   │   └── response.ts           ← API response helpers
│   ├── query/
│   │   └── provider.tsx          ← React Query setup + qk keys factory
│   ├── db/
│   │   └── queries.ts           ← Reusable Prisma queries
│   ├── services/                 ← Business logic services
│   │   ├── portfolio.ts
│   │   ├── team.ts
│   │   ├── orders.ts
│   │   ├── academy.ts
│   │   └── lp.ts
│   ├── auth/
│   │   ├── session.ts           ← Session helpers
│   │   └── permissions.ts       ← RBAC helpers
│   ├── email/
│   │   └── sender.ts
│   ├── jobs/
│   │   └── functions.ts         ← Inngest job functions
│   └── utils/
│       ├── format.ts             ← formatVND, formatDate
│       └── cn.ts                 ← className merger (clsx + twMerge)
│
├── store/
│   ├── authStore.ts              ← ✅ Auth + RBAC (đã migrate)
│   └── uiStore.ts                ← UI state only (sidebar, modals, toasts)
│
├── i18n/
│   ├── request.ts               ← Locale extraction
│   └── routing.ts               ← Locale routing config
│
└── messages/                     ← i18n translation files
    ├── vi.json
    ├── en.json
    ├── ja.json
    ├── ko.json
    └── zh.json
```

---

## 4. Design Tokens — Nguồn Sự Thật Duy Nhất

### 4.1 File Gốc

```
src/lib/design-tokens.ts
```

### 4.2 Danh Sách Tokens

```typescript
// Backgrounds
DS.bg        = "#020617"    // Main background
DS.bgCard    = "#0F172A"    // Card background
DS.bgCard2   = "#111827"    // Card variant 2
DS.bgCard3   = "#0D1526"    // Card variant 3

// Borders
DS.border    = "#1F2937"
DS.border2   = "#374151"

// Colors
DS.blue      = "#3B82F6"
DS.blueDark  = "#1D4ED8"
DS.purple    = "#818CF8"
DS.cyan      = "#14B8A6"
DS.green     = "#22C55E"
DS.amber     = "#F59E0B"
DS.red       = "#EF4444"

// Text
DS.text      = "#FFFFFF"
DS.text2     = "#E2E8F0"
DS.text3     = "#94A3B8"
DS.text4     = "#64748B"
DS.text5     = "#475569"

// Fonts
DS.mono      = "'JetBrains Mono', monospace"
DS.heading   = "'Cinzel', serif"
DS.body      = "'Inter', 'Noto Serif JP', sans-serif"

// Gradients
GRD.primary  = "linear-gradient(135deg, #1D4ED8, #818CF8)"
GRD.blue     = "linear-gradient(135deg, #1D4ED8, #3B82F6)"
GRD.purple   = "linear-gradient(135deg, #818CF8, #7DD3FC)"
// ... etc

// Glows
GLOW.blue    = "0 0 20px rgba(59,130,246,0.4)"
GLOW.purple  = "0 0 20px rgba(129,140,248,0.4)"
GLOW.cyan    = "0 0 20px rgba(20,184,166,0.4)"
GLOW.card    = "0 8px 32px rgba(0,0,0,0.4)"
```

### 4.3 Quy Tắc Sử Dụng

```typescript
// ✅ Dùng import từ lib
import { DS, GRD, GLOW } from "@/lib/design-tokens";

// ✅ Dùng inline style với DS
<div style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>

// ✅ Dùng inline style với GRD cho gradients
<button style={{ background: GRD.primary }}>

// ✅ Dùng DS cho Tailwind arbitrary values
className="bg-[#020617]"

// ❌ KHÔNG hardcode trong JSX
style={{ color: "#3B82F6" }}
```

---

## 5. Database & Data Layer

### 5.1 Prisma Schema

> **Schema tại `prisma/schema.prisma` là nguồn sự thật cho cấu trúc data.**
> Mọi model phải được định nghĩa trong schema trước khi code.

### 5.2 Seed Data

> ⚠️ **Effects = CODE, Không Phải DB**
>
> Rank visual effects (particles, glow, box-shadow animations) được **set cứng trong code**
> tại `src/components/landing/guild/guildMemberData.ts`.
>
> DB tables `RankEffect` + `MemberEffectOverride` được **giữ lại trong schema.prisma**
> cho tương lai nhưng UI **KHÔNG đọc** từ đó.
>
> - Muốn đổi effect → sửa `guildMemberData.ts`
> - Muốn thêm rank mới → thêm vào `RANKS` config + `BOX_SHADOW_ANIM`
> - seed functions effects đã bị comment out trong `prisma/seed.ts`

**File:** `prisma/seed.ts`

Seed phải bao gồm:

| # | Data | Model | Số lượng |
|---|------|-------|----------|
| 1 | 27 team members | `TeamMember` | 27 |
| 2 | 4 services | `Service` | 4 |
| 3 | 6 portfolio projects | `Portfolio` hoặc `Project` | 6 |
| 4 | 4 pricing plans | `PricingPlan` | 4 |
| 5 | 7 ranks | `RankEffect` | 7 |
| 6 | 12 rank effects | `RankEffect` | 12 |
| 7 | 13 quests | `Quest` | 13 |
| 8 | 3 company events | `CompanyEvent` | 3 |
| 9 | Roles & permissions | `Role`, `Permission` | đầy đủ |
| 10 | Landing page content | `HomeSlider`, `Testimonial` | đầy đủ |

### 5.3 No Business Data in Stores

> **`src/app/store/` chỉ chứa UI state và auth state.**
> **KHÔNG chứa business data** như orders, portfolio, services, members.

```typescript
// ✅ ĐÚNG — Store chỉ chứa UI state
interface UIStore {
  sidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
}

// ❌ SAI — Business data không được trong store
const orders = [{ id: 'ORD-2601', clientName: '...', ... }]
```

### 5.4 Business Data → React Query

```typescript
// ✅ ĐÚNG — Dùng React Query để fetch business data
const { data: orders } = useQuery({
  queryKey: qk.orders({ page: 1, limit: 20 }),
  queryFn: () => adminApi.get("/api/admin/orders", { params: { page: 1, limit: 20 } }),
});

// ❌ SAI — Business data hardcoded trong component
const orders = [{ id: 'ORD-2601', ... }];
```

---

## 6. Giai Đoạn Thực Hiện

### GIAI ĐOẠN 1 — Nền Tảng (Foundation)
**Trạng thái:** 🔄 Sẽ làm
**Thứ tự:** 1

| # | Công việc | File | Kiểm tra |
|---|-----------|------|----------|
| 1.1 | Seed đầy đủ vào DB | `prisma/seed.ts` | DB có data thật |
| 1.2 | Externalize hardcoded URLs → env | `.env.example`, `src/lib/design-tokens.ts` | Không còn `loop.vn` hardcoded |
| 1.3 | Thống nhất design tokens | `src/lib/design-tokens.ts` | Mọi file dùng DS/GRD |
| 1.4 | Tạo `qk` query keys factory | `src/lib/query/provider.tsx` | Tất cả query dùng `qk.*` |
| 1.5 | Verify env vars đầy đủ | `.env.example` vs code usage | Không thiếu biến |
| 1.6 | Xóa data values khỏi `src/data/mockData.ts` | `src/data/mockData.ts` | Chỉ còn TYPE exports |

### GIAI ĐOẠN 2 — Trang Chủ & Dịch Vụ
**Trạng thái:** 📋 Sẽ làm
**Thứ tự:** 2

| # | Trang | Route | Data source | Kiểm tra |
|---|-------|-------|------------|----------|
| 2.1 | Landing Page | `/` | `Service`, `HomeSlider`, DB | Có animation, stats, services grid |
| 2.2 | Services Listing | `/services` | `Service` model | Grid 4 services |
| 2.3 | Service Detail | `/services/[slug]` | `Service` + `ServiceAttribute` | Dynamic content |
| 2.4 | Pricing | `/pricing` | `PricingPlan` + `PricingComparisonFeature` | Table comparison |
| 2.5 | Booking Wizard | `/booking` | Quote API | 8-step wizard hoạt động |

### GIAI ĐOẠN 3 — Portfolio & Dự Án
**Trạng thái:** 📋 Sẽ làm
**Thứ tự:** 3

| # | Trang | Route | Data source |
|---|-------|-------|------------|
| 3.1 | Portfolio | `/du-an` | `Project` model (portfolio) |
| 3.2 | Project Detail | `/du-an/[slug]` | `Project` + `Testimonial` |
| 3.3 | Customer Portal | `/khach-hang` | `Order`, `CustomerPoint` (auth-gated) |

### GIAI ĐOẠN 4 — Team & Gamification (CORE)
**Trạng thái:** 📋 Sẽ làm
**Thứ tự:** 4

| # | Trang | Route | Data source |
|---|-------|-------|------------|
| 4.1 | Guild Hall (Team) | `/team` | `TeamMember` (27 members) |
| 4.2 | Member Detail | `/member/[slug]` | `TeamMember` + `LpTransaction` |
| 4.3 | Leaderboard | `/bang-xep-hang` | `TeamMember` + `LpRedemption` |

### GIAI ĐOẠN 5 — Admin Dashboard
**Trạng thái:** 📋 Sẽ làm
**Thứ tự:** 5

> **Mỗi tab = 1 route file riêng trong `src/app/admin/[tab]/`.**
> Không gộp nhiều tabs vào 1 file.

| # | Tab | Route | Priority |
|---|-----|-------|----------|
| 5.1 | Overview | `/admin/overview` | HIGH |
| 5.2 | Orders | `/admin/orders` | HIGH |
| 5.3 | Members | `/admin/members` | HIGH |
| 5.4 | Projects (Kanban) | `/admin/projects` | HIGH |
| 5.5 | Clients | `/admin/clients` | MEDIUM |
| 5.6 | Services | `/admin/services` | MEDIUM |
| 5.7 | Academy | `/admin/academy` | MEDIUM |
| 5.8 | Blog | `/admin/blog` | MEDIUM |
| 5.9 | LP | `/admin/lp` | MEDIUM |
| 5.10 | Revenue | `/admin/revenue` | LOW |
| 5.11 | Media | `/admin/media` | LOW |
| 5.12 | Effects | `/admin/effects` | LOW |
| 5.13 | Notification Center | `/admin/notification_center` | LOW |
| 5.14 | Quests & Events | `/admin/quests_events` | LOW |

### GIAI ĐOẠN 6 — Academy & Blog
**Trạng thái:** 📋 Sẽ làm
**Thứ tự:** 6

| # | Trang | Route |
|---|-------|-------|
| 6.1 | Academy | `/hoc-vien` |
| 6.2 | Course Detail | `/hoc-vien/[slug]` |
| 6.3 | Blog | `/blog` |
| 6.4 | Blog Detail | `/blog/[slug]` |

### GIAI ĐOẠN 7 — Media, Contact, About
**Trạng thái:** 📋 Sẽ làm
**Thứ tự:** 7

| # | Trang | Route |
|---|-------|-------|
| 7.1 | Media | `/media` |
| 7.2 | Contact | `/contact` (→ `ContactMessage` model) |
| 7.3 | About | `/about` |

### GIAI ĐOẠN 8 — Cleanup & Polish
**Trạng thái:** 📋 Sẽ làm
**Thứ tự:** 8

| # | Công việc |
|---|-----------|
| 8.1 | Verify tất cả env vars trong `.env.example` |
| 8.2 | i18n — đảm bảo đầy đủ cho 5 locales |
| 8.3 | Xóa `src/data/mockData.ts` (data values) |
| 8.4 | Final test tất cả pages |
| 8.5 | Update README + docs |

---

## 7. Quy Tắc Mỗi Trang

### 7.1 Trước Khi Code Một Trang

```
1. ✅ Xác định route (file path trong src/app/[locale]/ hoặc src/app/admin/)
2. ✅ Xác định data source (model nào trong schema.prisma?)
3. ✅ Kiểm tra API route đã có chưa (src/app/api/)
4. ✅ Kiểm tra i18n keys đã có chưa (messages/*.json)
5. ✅ So sánh với DESIGN LOOPS (file nào chứa UI tương tự?)
6. ✅ Xác định components cần tách (shared vs page-specific)
```

### 7.2 Cấu Trúc Một Page

```typescript
// src/app/[locale]/example/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/provider";
import { apiClient } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";

// ── Types ─────────────────────────────────────────────
type Props = { params: Promise<{ locale: string }> };
type PageData = { /* ... */ };

// ── Sub-components ─────────────────────────────────────
// (tách thành file riêng nếu > 50 lines hoặc dùng ở > 1 chỗ)

// ── Main Page ──────────────────────────────────────────
export default function ExamplePage({ params }: Props) {
  const t = useTranslations("Example");

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: qk.example({ /* params */ }),
    queryFn: () => apiClient.get<{ data: PageData[] }>("/api/example"),
  });

  return (
    <main style={{ background: DS.bg, color: DS.text }}>
      {/* ... */}
    </main>
  );
}
```

### 7.3 Tách Component

```typescript
// Tách khi:
// - Component > 50 lines
// - Component dùng ở > 1 page
// - Component có logic phức tạp (state, effects)

// src/components/landing/ServicesSection.tsx
// src/components/admin/AdminTable.tsx

// KHÔNG tách khi:
// - Component < 20 lines
// - Component chỉ dùng trong 1 page và không có logic phức tạp
```

---

## 8. Hardcode Checklist

### ❌ Nghiêm Cấm — Hardcoded Values

```typescript
// 1. URLs
const url = "https://loop.vn";           // → process.env.NEXT_PUBLIC_SITE_URL
const api = "http://localhost:3000";      // → process.env.NEXT_PUBLIC_API_BASE_URL

// 2. Company/Client Names
const name = "VNRetail JSC";              // → từ DB
const company = "FinCorp Vietnam";          // → từ DB

// 3. Prices/Amounts
const price = 350_000_000;                // → từ DB hoặc t()
const lp = 8750;                          // → từ DB

// 4. Colors (trong JSX inline)
style={{ color: "#3B82F6" }}              // → DS.blue
style={{ background: "#0F172A" }}         // → DS.bgCard

// 5. Dates
const date = "10/03/2026";                // → new Date().toLocaleDateString("vi-VN")

// 6. Avatar URLs
const avatar = "https://images.unsplash.com/..." // → từ DB hoặc DiceBear fallback

// 7. Status Labels
const status = "Đang thực hiện";          // → t() translation key

// 8. Mock Data Objects
const orders = [{ id: 'ORD-2601', ... }]; // → useQuery từ API

// 9. Demo URLs
const demoUrl = "https://demo.vercel.store"; // → từ DB hoặc null

// 10. Team Member Names/Bios
const member = { name: "Akira Sato", ... }; // → từ DB TeamMember
```

### ✅ Cho Phép — Những Thứ Này Không Phải Hardcode

```typescript
// 1. Design tokens (từ DS/GRD/GLOW — đã được approve)
style={{ color: DS.blue }}

// 2. Animation durations, easing
transition={{ duration: 0.4 }}

// 3. Responsive breakpoints (CSS)
className="grid grid-cols-1 md:grid-cols-2"

// 4. CSS dimensions không liên quan data
padding: "1.5rem"
gap: "1rem"

// 5. Constant arrays trong code (không phải data)
const STATUS_FLOW = ["pending", "paid", "done"];

// 6. Enum values
type OrderStatus = "pending_payment" | "paid" | "in_progress" | ...;
```

---

## 9. i18n Quy Tắc

### 9.1 Nguồn Sự Thật

**File:** `src/messages/vi.json` (Vietnamese = default)

### 9.2 Cấu Trúc Translation Keys

```json
{
  "PageName": {
    "title": "Tiêu đề trang",
    "description": "Mô tả",
    "action": "Hành động",
    "empty": "Không có dữ liệu",
    "loading": "Đang tải...",
    "error": "Có lỗi xảy ra",
    "success": "Thành công"
  },
  "Order": {
    "status": {
      "pending_payment": "Chờ thanh toán",
      "paid": "Đã thanh toán",
      "in_progress": "Đang thực hiện",
      "demo_ready": "Demo sẵn sàng",
      "client_review": "Khách review",
      "done": "Hoàn thành",
      "cancelled": "Đã hủy"
    }
  },
  "Rank": {
    "iron": "Sắt",
    "bronze": "Đồng",
    "silver": "Bạc",
    "gold": "Vàng",
    "platinum": "Bạch Kim",
    "ruby": "Hồng Ngọc",
    "diamond": "Kim Cương"
  }
}
```

### 9.3 Quy Tắc i18n

```typescript
// ✅ Dùng useTranslations cho user-facing text
const t = useTranslations("PageName");
<h1>{t("title")}</h1>

// ✅ Dùng interpolation cho dynamic values
{t("welcome", { name: user.name })}
{t("orderCount", { count: orders.length })}

// ✅ Dùng t() cho status labels
<span>{t(`Order.status.${order.status}`)}</span>

// ✅ Metadata (title, description) dùng generateMetadata
export async function generateMetadata({ params }) {
  const t = await getTranslations("Seo");
  return { title: t("homeTitle"), description: t("homeDesc") };
}

// ❌ KHÔNG hardcode text
<h1>Chào mừng đến với LOOP</h1>

// ❌ KHÔNG dùng i18n cho code values
// (status enum values giữ nguyên, chỉ label là i18n)
```

### 9.4 Các Locales Được Hỗ Trợ

| Locale | Code | Trạng thái |
|--------|------|------------|
| Vietnamese | `vi` | Default — phải đầy đủ |
| English | `en` | Translate đầy đủ |
| Japanese | `ja` | Translate đầy đủ |
| Korean | `ko` | Translate đầy đủ |
| Chinese | `zh` | Translate đầy đủ |

---

## 10. API Layer Quy Tắc

### 10.1 API Client

```typescript
// Public API (no auth)
import { apiClient } from "@/lib/api/client";
apiClient.get("/api/services");

// Admin API (auth required)
import { adminApi } from "@/lib/api/client";
adminApi.get("/api/admin/orders");
adminApi.post("/api/admin/services", payload);
adminApi.put(`/api/admin/services/${id}`, payload);
adminApi.delete(`/api/admin/services/${id}`);
```

### 10.2 Response Shape

```typescript
// Success — Single
{ "data": { "id": "...", ... } }

// Success — List with pagination
{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "error": "Error message", "code": "ERROR_CODE" }
```

### 10.3 Tạo API Route Mới

```typescript
// src/app/api/admin/[resource]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canEdit } from "@/app/store/authStore";
import { prisma } from "@/lib/prisma";

// GET /api/admin/[resource]
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  const [data, total] = await Promise.all([
    prisma.resource.findMany({ skip: (page - 1) * limit, take: limit }),
    prisma.resource.count(),
  ]);

  return NextResponse.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/admin/[resource]
export async function POST(req: NextRequest) {
  // ... tạo mới
}

// PUT /api/admin/[resource]/[id]
// DELETE /api/admin/[resource]/[id]
```

---

## 11. Admin Dashboard Quy Tắc

### 11.1 Admin Layout

```
src/app/admin/layout.tsx
├── AdminSidebar          ← Navigation, collapsible
├── AdminTopbar           ← Search, notifications, user menu
└── <Outlet />            ← Current tab content
```

### 11.2 Sidebar — RBAC Gated

```typescript
// Chỉ hiện tabs user có quyền truy cập
const accessibleTabs = getAccessibleTabs(role, department);

{accessibleTabs.map(tab => (
  <SidebarItem key={tab} tab={tab} />
))}
```

### 11.3 Mỗi Tab = Route Riêng

```
src/app/admin/orders/page.tsx     ← KHÔNG phải AdminDashboard tab
src/app/admin/members/page.tsx   ← Mỗi cái là route độc lập
```

### 11.4 Table Pattern

```typescript
// Tất cả admin list pages dùng shared pattern:
1. useQuery → fetch data
2. Loading state (spinner)
3. Empty state (no data message)
4. Table with: columns, rows, pagination
5. Row actions: view, edit, delete
6. Bulk actions: select + bulk delete/archive
7. Filters: search, status filter, date range
```

### 11.5 Status Colors — Chuẩn Hóa

```typescript
const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "Chờ thanh toán", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  paid:            { label: "Đã thanh toán",    color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  in_progress:    { label: "Đang thực hiện",   color: "#818CF8", bg: "rgba(129,140,248,0.1)" },
  demo_ready:      { label: "Demo sẵn sàng",    color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  client_review:  { label: "Khách review",       color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  done:            { label: "Hoàn thành",        color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  cancelled:       { label: "Đã hủy",           color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};
```

---

## 12. Hoàn Thành & Duyệt Tiêu Chuẩn

### 12.1 Checklist Trước Khi Đánh Dấu Hoàn Thành

```
□ Trang đã được code theo cấu trúc route đúng
□ Tất cả data đến từ DB/API (không hardcode)
□ Tất cả styles dùng DS/GRD/GLOW (không hardcode màu)
□ i18n keys đầy đủ cho 5 locales
□ Loading state có spinner
□ Empty state có message
□ Error state có message + retry
□ Responsive (mobile-first)
□ Animation mượt (Framer Motion)
□ Accessible (keyboard nav, ARIA labels)
□ No TypeScript errors
□ No ESLint errors
□ Test thủ công — trang load đúng, data hiển thị
```

### 12.2 Priority Definitions

| Priority | Ý nghĩa |
|----------|---------|
| **HIGH** | Core business — phải hoàn thành trước |
| **MEDIUM** | Cần thiết nhưng có thể tạm deferred |
| **LOW** | Nice-to-have — làm cuối |

### 12.3 Decision Log

> **Mọi architectural decision phải được ghi lại trong phần này.**

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-02 | Dùng Next.js app làm BE chính | Đã có Prisma + 130+ API routes |
| 2026-04-02 | DESIGN LOOPS là reference-only | Tránh conflict, giữ nguyên design source |
| 2026-04-02 | Auth store đã migrate sang real API | Không rollback |
| 2026-04-02 | Business data dùng React Query | Zustand chỉ cho UI state |
| 2026-04-02 | Seed 27 members trước | Team page là core gamification |
| 2026-04-02 | **Effects = CODE, NOT DB** | Effects cố định theo rank trong `guildMemberData.ts`. DB RankEffect + MemberEffectOverride tables kept for future but UI does NOT read them. Seed functions commented out. See §5.2. |
| 2026-04-02 | **Admin Effects tab = dead** | API routes `/api/admin/rank-effects/*` và `/api/admin/team/*/effects/*` là dead code — UI không dùng. Sẽ xóa khi làm Admin tab. |

---

## Quick Reference Card

```
╔══════════════════════════════════════════════════════════════════╗
║                    QUY TẮC NHANH                               ║
╠══════════════════════════════════════════════════════════════════╣
║ ✅ Dùng: DS.blue, DS.bgCard từ @/lib/design-tokens            ║
║ ❌ Tránh: "#3B82F6", "#0F172A" hardcoded                      ║
║ ✅ Dùng: useTranslations("Page") → t("key")                   ║
║ ❌ Tránh: Hardcoded text "Tiêu đề"                             ║
║ ✅ Dùng: useQuery + qk.orders() → API                          ║
║ ❌ Tránh: const orders = [{ id: 'ORD-1' }]                     ║
║ ✅ Dùng: process.env.NEXT_PUBLIC_SITE_URL                      ║
║ ❌ Tránh: "https://loop.vn" hardcoded                          ║
║ ✅ Mỗi trang = 1 route file riêng                             ║
║ ❌ Tránh: Gộp nhiều pages trong 1 file lớn                   ║
║ ✅ Design LOOPS: CHỈ ĐỌC, không bao giờ sửa                    ║
╚══════════════════════════════════════════════════════════════════╝
```
