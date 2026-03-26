# LOOP Company Website — Claude Code Context

> **Project:** LOOP Agency Website (Next.js 15 + Prisma 7 + PostgreSQL/Neon)
> **Last Updated:** 2026-03-26
> **Language:** Vietnamese (code comments, docs), English (variable names)

---

## 🎯 Project Overview

Full-stack Next.js website for LOOP digital agency. Monorepo pattern with:
- **Frontend:** Next.js 15 App Router, React 18, Tailwind v4, Radix UI, Framer Motion, next-intl (i18n)
- **Backend:** Next.js Route Handlers, Prisma 7 ORM, PostgreSQL (Neon)
- **Auth:** Dual — JWT credentials + NextAuth v5 Google OAuth
- **CMS:** Sanity 5
- **Jobs:** Inngest (background jobs)
- **Email:** Resend
- **CDN:** Cloudinary
- **Monitoring:** Sentry, Upstash Redis (rate limiting)

---

## 📁 Project Structure

```
loop-website/
├── src/
│   ├── app/
│   │   ├── api/              # API Route Handlers (150+ endpoints)
│   │   │   ├── admin/        # Protected admin API
│   │   │   ├── auth/         # NextAuth Google OAuth
│   │   │   ├── v1/           # Public v1 API contract
│   │   │   ├── webhooks/     # GitHub, Vercel webhooks
│   │   │   └── inngest/      # Background jobs
│   │   ├── [locale]/         # Public pages (vi/en)
│   │   └── admin/            # Admin/CMS pages
│   ├── components/
│   │   ├── ui/               # Base UI (Radix primitives)
│   │   ├── admin/            # Admin components + AdminCrudList
│   │   ├── cards/            # PricingCard, ProjectCard, ServiceCard
│   │   └── shared/           # Navbar, Footer, HeroBanner, etc.
│   ├── lib/
│   │   ├── auth/             # JWT, permissions, RBAC
│   │   ├── api/              # Response helpers (✅ done)
│   │   └── prisma.ts         # DB singleton
│   ├── i18n/                 # next-intl config
│   └── styles/               # CSS (Tailwind, fonts)
├── prisma/schema.prisma      # 60+ models
├── docs/                     # API documentation (TODO)
└── PLAN.md                   # Migration/refresh plan
```

---

## 🗄️ Database — 60+ Prisma Models

### Auth & RBAC
- `User`, `Role`, `Permission`, `UserRole`, `Session`, `LoginHistory`

### Core Content
- `Service`, `Project`, `Testimonial`, `ContactMessage`, `PricingPlan`, `HomeSlider`, `HomeVideo`

### Team & HR
- `TeamMember`, `Expertise`, `MemberExpertise` (rank, XP, LP, HR data)

### Commerce & Sales
- `Order`, `OrderAttribute`, `ServiceAttribute`, `Quote`, `QuoteRequest`, `SalesLead`, `AddonService`, `RewardTier`, `OrderReward`, `Payment`, `OrderStatusHistory`, `ServicePackage`

### Pricing Calculator
- `InfrastructureTier`, `FeatureGroup`, `Feature`, `FeatureVariant`, `PricingWebPackage`, `PricingComparisonFeature`, `PricingHostingPlan`, `PricingDomainPrice`, `PricingDeploymentItem`

### Project Management (JIRA-like)
- `Epic`, `Backlog`, `Task`, `TaskTag`, `TaskViolation`, `BugNote`, `Deployment`, `FigmaDemo`, `EnvFile`, `GitCommit`, `GscMetric`, `SocialPost`, `HandoverPackage`, `DailyStandup`, `ProjectMember`

### Loyalty Points (LP) & Gamification
- `CustomerPoint`, `PointTransaction`, `PointActivity`, `Advertisement`, `ReferralCode`, `ReferralTracking`, `LpAward`, `LpTransfer`

### Education (EDU)
- `Course`, `Lesson`, `Instructor`, `Enrollment`, `Attendance`, `Feedback`, `StudentProgress`, `EduPayment`

### System & Misc
- `AuditLog`, `Notification`, `SiteSetting`, `ServerAnalyticsEvent`, `CustomerWebsite`, `WebsiteStats`, `LandingPage`, `LandingSection`

---

## 🔐 Authentication

### Dual Auth System
1. **Credentials (JWT)** — `POST /api/admin/auth/login`, HttpOnly cookie `auth-token`
2. **Google OAuth** — NextAuth v5, provider `GoogleProvider`

### Role Hierarchy
```
ceo(-1) > super_admin(0) > admin(1) > project_manager(2) > media(3) > qa(4) > member(5)
```

### Auth Endpoint
- `GET /api/admin/auth/me` → `{ user: { userId, email, name, role, roles, avatar, accountType, teamMemberId, roleLevel, permissions[] } }`

---

## 🎨 Design System

### Colors
- Primary: `hsl(var(--primary))` (configurable via CSS vars)
- Accent: `#ff7832` (orange)
- Background: `hsl(var(--background))`
- Muted: `hsl(var(--muted))`

### Typography
- Font: system-ui with CSS vars for size/scale
- Vietnamese diacritics must render correctly

### UI Primitives
All via Radix UI + Tailwind v4. Components: Button, Dialog, Sheet, Table, Select, Badge, Card, Avatar, etc.

---

## 📋 Active Plan

See `PLAN.md` for the full migration/refactor roadmap. Current status:
- **✅ Done:** API response helpers, auth helpers, `/auth/me` endpoint
- **⚠️ Partial:** Error handling consistency, public API response standardization
- **❌ TODO:** docs/ folder, `errors.ts`, rate limiting, CI/CD, docs tooling

---

## ⚡ Key Conventions

1. **API Responses:** Always use helpers from `@/lib/api`:
   - Success: `ok(data)`, `list(data, pagination)`, `json(payload)`
   - Errors: `badRequest()`, `unauthorized()`, `notFound()`, `handleError(err)`
2. **Auth:** Always call `requirePermission()` or `requireAuth()` in API routes
3. **Error handling:** Always `try/catch` + `handleError()`
4. **No JSX/React in API routes** — backend is pure logic
5. **TypeScript strict mode** — no `any`
6. **i18n:** Public pages use `[locale]` routing (vi/en)
7. **Admin:** No locale prefix, separate `/admin/*` routing

---

## 🔧 Available Tools & Aliases

```bash
# Common dev commands (run from d:/LOOP_COMPANY/LOOP)
npm run dev          # Start dev server
npm run build        # Build production
npx prisma studio    # Open DB GUI
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

---

## 💬 Communication Style

- Vietnamese for project docs, comments, and user communication
- English for code, variable names, function names
- Be concise, practical, and action-oriented
- Always show clear next steps after completing a task
