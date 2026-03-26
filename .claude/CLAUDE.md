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

For FE rebuild + integration process, follow:
- `.claude/rules/fe-master-index.md` — mục lục tổng của toàn bộ bộ tài liệu FE
- `.claude/rules/fe-roadmap.md` — lộ trình theo phase
- `.claude/rules/fe-delivery-process.md` — quy trình PO → Design → Dev → QA → Release
- `.claude/rules/fe-architecture-microservices.md` — kiến trúc tích hợp + boundary tách service
- `.claude/rules/fe-sprint-template.md` — template vận hành sprint tuần
- `.claude/rules/fe-week-01-plan.md` → `.claude/rules/fe-week-12-plan.md` — bộ kế hoạch thực thi 12 tuần
- `.claude/rules/fe-i18n-implementation-plan.md` — triển khai i18n 5 ngôn ngữ (VI–EN–JA–KO–ZH) trong 5 tuần
- `.claude/rules/fe-weekly-status-report.md` — template báo cáo tuần
- `.claude/rules/fe-risk-register-template.md` — mẫu quản trị rủi ro
- `.claude/rules/fe-release-checklist.md` — checklist phát hành production
- `.claude/rules/fe-release-runbook.md` — runbook thao tác release
- `.claude/rules/fe-kpi-scorecard-template.md` — scorecard KPI vận hành
- `.claude/rules/fe-capacity-planning-template.md` — template capacity planning
- `.claude/rules/fe-retrospective-template.md` — template retrospective
- `.claude/rules/fe-data-contract-checklist.md` — checklist data contract FE/BE
- `.claude/rules/fe-governance-policy.md` — governance policy (RACI/SLA/escalation/change control)
- `.claude/rules/fe-change-request-template.md` — mẫu CR quản lý thay đổi scope
- `.claude/rules/fe-incident-playbook.md` — playbook xử lý sự cố
- `.claude/rules/fe-communication-plan.md` — kế hoạch giao tiếp liên team
- `.claude/rules/fe-api-integration-playbook.md` — playbook tích hợp API
- `.claude/rules/fe-environment-matrix.md` — ma trận môi trường
- `.claude/rules/fe-feature-flag-policy.md` — chính sách feature flag
- `.claude/rules/fe-code-review-checklist.md` — checklist review code
- `.claude/rules/fe-security-review-checklist.md` — checklist security review
- `.claude/rules/fe-dependency-policy.md` — chính sách dependency
- `.claude/rules/fe-testing-playbook.md` — playbook testing
- `.claude/rules/fe-adr-template.md` — mẫu ADR kiến trúc
- `.claude/rules/fe-handover-checklist.md` — checklist bàn giao
- `.claude/rules/fe-doc-maintenance-policy.md` — chính sách bảo trì tài liệu
- `.claude/rules/fe-branching-strategy.md` — chiến lược branch/merge
- `.claude/rules/fe-backlog-triage-policy.md` — policy backlog triage
- `.claude/rules/fe-support-playbook.md` — playbook support sau release
- `.claude/rules/fe-meeting-agendas.md` — mẫu agenda họp vận hành
- `.claude/rules/fe-onboarding-guide.md` — hướng dẫn onboarding thành viên mới
- `.claude/rules/fe-master-index.md` là nguồn ưu tiên để điều hướng toàn bộ bộ tài liệu.

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
