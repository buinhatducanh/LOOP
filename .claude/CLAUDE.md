# LOOP Company Website — Claude Code Context

> **Project:** LOOP Agency Website — API-only Backend (Next.js 15 + Prisma 7 + PostgreSQL/Neon)
> **Last Updated:** 2026-03-26
> **Language:** Vietnamese (code comments, docs), English (variable names)
> **Status:** Frontend removed — API-only app ready for new FE integration

---

## 🎯 Project Overview

Next.js 15 backend-only application exposing 198 REST API endpoints.
All frontend pages (public + admin UI) have been removed. The new frontend
will be a separate repo consuming these APIs.

**Frontend removed (2026-03-26):**
- `src/app/[locale]/` — public pages deleted
- `src/app/admin/` — admin CMS pages deleted
- `src/components/` — all UI components deleted
- `src/i18n/`, `src/navigation/`, `src/hooks/`, `src/styles/` — deleted

**Frontend kept:**
- `src/app/(public)/figma/review/[token]/page.tsx` — client Figma review UI (no deps)

---

## 📁 Project Structure

```
loop-website/
├── src/
│   ├── app/
│   │   ├── api/                    # API Route Handlers (198 endpoints)
│   │   │   ├── admin/             # Protected admin API (JWT auth)
│   │   │   ├── auth/              # NextAuth Google OAuth
│   │   │   ├── v1/                # Public v1 API contract
│   │   │   ├── webhooks/          # GitHub, Vercel, Loop webhooks
│   │   │   └── inngest/           # Background jobs
│   │   ├── (public)/figma/review/ # Client Figma review page
│   │   ├── layout.tsx             # Minimal root layout (no i18n)
│   │   ├── robots.ts              # robots.txt
│   │   └── sitemap.ts             # sitemap.xml
│   ├── lib/
│   │   ├── auth/                  # JWT, permissions, RBAC, edge auth
│   │   ├── api/                   # Response helpers, ApiError class
│   │   ├── db/queries.ts         # Prisma query helpers
│   │   ├── prisma.ts             # DB singleton
│   │   ├── rank/ranks.ts         # Rank system config (moved from components)
│   │   ├── rate-limit.ts         # Upstash Redis rate limiting
│   │   └── ...                    # services, email, sentry, etc.
│   └── middleware.ts              # Edge middleware (API-only, no i18n)
├── prisma/schema.prisma           # 60+ models
├── docs/                          # 14 API documentation files
└── PLAN.md                        # Migration/refactor plan
```

---

## 🗄️ Database — 60+ Prisma Models

| Category | Models |
|----------|--------|
| Auth & RBAC | `User`, `Role`, `Permission`, `UserRole`, `Session`, `LoginHistory` |
| Core Content | `Service`, `Project`, `Testimonial`, `ContactMessage`, `PricingPlan`, `HomeSlider`, `HomeVideo` |
| Team & HR | `TeamMember`, `Expertise`, `MemberExpertise` |
| Commerce & Sales | `Order`, `OrderAttribute`, `ServiceAttribute`, `Quote`, `QuoteRequest`, `SalesLead`, `AddonService`, `RewardTier`, `OrderReward`, `Payment`, `OrderStatusHistory`, `ServicePackage` |
| Pricing Calculator | `InfrastructureTier`, `FeatureGroup`, `Feature`, `FeatureVariant`, `PricingWebPackage`, `PricingComparisonFeature`, `PricingHostingPlan`, `PricingDomainPrice`, `PricingDeploymentItem` |
| Project Management | `Epic`, `Backlog`, `Task`, `TaskTag`, `TaskViolation`, `BugNote`, `Deployment`, `FigmaDemo`, `EnvFile`, `GitCommit`, `GscMetric`, `SocialPost`, `HandoverPackage`, `DailyStandup`, `ProjectMember` |
| LP & Gamification | `CustomerPoint`, `PointTransaction`, `PointActivity`, `Advertisement`, `ReferralCode`, `ReferralTracking`, `LpAward`, `LpTransfer` |
| Education (EDU) | `Course`, `Lesson`, `Instructor`, `Enrollment`, `Attendance`, `Feedback`, `StudentProgress`, `EduPayment` |
| System & Misc | `AuditLog`, `Notification`, `SiteSetting`, `ServerAnalyticsEvent`, `CustomerWebsite`, `WebsiteStats`, `LandingPage`, `LandingSection` |

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

## 📋 Active Plan

See `PLAN.md` for the full roadmap. **Core plan complete.**

---

## ⚡ Key Conventions

1. **API Responses:** Always use helpers from `@/lib/api`:
   - Success: `ok(data)`, `list(data, pagination)`, `json(payload)`
   - Errors: `badRequest()`, `unauthorized()`, `notFound()`, `handleError(err)`
2. **Auth:** Always call `requirePermission()` in admin API routes
3. **Error handling:** Always `try/catch` + `handleError()`
4. **No JSX/React in API routes** — backend is pure TypeScript
5. **TypeScript strict mode** — no `any`
6. **API-only app** — no public pages, no admin CMS pages

---

## 🔧 Available Tools & Aliases

```bash
# Common dev commands (run from d:/LOOP_COMPANY/LOOP)
npm run dev          # Start dev server
npm run build        # Build production
npx prisma studio    # Open DB GUI
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

---

## 💬 Communication Style

- Vietnamese for project docs, comments, and user communication
- English for code, variable names, function names
- Be concise, practical, and action-oriented
- Always show clear next steps after completing a task
