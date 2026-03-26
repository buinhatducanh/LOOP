# LOOP Company Website — Claude Code Context

> **Project:** LOOP Agency Website — Next.js 15 + Prisma 7 + PostgreSQL/Neon
> **Last Updated:** 2026-03-27
> **Language:** Vietnamese (code comments, docs), English (variable names)
> **Status:** Phase 0 i18n complete — scaffolding ready, new FE integration pending

---

## 🎯 Project Overview

Next.js 15 application with backend API (198 endpoints) + scaffolded public pages
for 5-language i18n (VI/EN/JA/KO/ZH). New frontend will fully integrate these
APIs via the `?lang=` localization contract.

**Branch:** `feature/i18n-vi-en` (13 commits ahead of `master`)

**i18n infrastructure complete (Phase 0):**
- `src/app/[locale]/` — scaffolded pages (about, blog, contact, portfolio, pricing, services, team)
- `src/components/` — SiteHeader, SiteFooter, LocaleSwitcher
- `src/i18n/` — routing, request config, providers (5 locales)
- `src/messages/` + `messages/` — `vi.json`, `en.json`, `ja.json`, `ko.json`, `zh.json` (211 keys each)
- `src/lib/i18n/localization.ts` — `getLocalizedField()`, `getLocalizedArray()`, `mapLocalized*()` helpers
- All 11 public content APIs support `?lang=vi|en|ja|ko|zh` with VI fallback

**Pending:**
- New frontend repo to fully wire up the scaffolded pages
- Professional translation of JA/KO/ZH message files (Phase 1)
- CJK font lazy-loading (Phase 1)

---

## 📁 Project Structure

```
loop-website/
├── src/
│   ├── app/
│   │   ├── [locale]/              # Locale-prefixed public pages (vi/en/ja/ko/zh)
│   │   │   ├── about/, blog/, contact/, portfolio/, pricing/, services/, team/
│   │   │   ├── components/       # SiteHeader, SiteFooter, LocaleSwitcher
│   │   │   └── layout.tsx        # Locale-aware root layout
│   │   ├── api/                  # API Route Handlers (198 endpoints)
│   │   │   ├── admin/            # Protected admin API (JWT auth)
│   │   │   ├── auth/             # NextAuth Google OAuth
│   │   │   ├── v1/               # Public v1 API contract (localized)
│   │   │   ├── webhooks/         # GitHub, Vercel, Loop webhooks
│   │   │   ├── inngest/          # Background jobs
│   │   │   ├── services/, projects/, team/, expertises/, blog-posts/  # Public content APIs
│   │   │   └── ...               # remaining API routes
│   │   ├── (public)/figma/review/ # Client Figma review page
│   │   ├── layout.tsx            # Minimal root layout (no i18n)
│   │   ├── robots.ts             # robots.txt (5 locales)
│   │   └── sitemap.ts            # sitemap.xml (5 locales + dynamic blog slugs)
│   ├── lib/
│   │   ├── auth/                 # JWT, permissions, RBAC, edge auth
│   │   ├── api/                  # Response helpers, ApiError class
│   │   ├── db/queries.ts         # Prisma query helpers
│   │   ├── i18n/localization.ts  # getLocalizedField(), getLocalizedArray(), mapLocalized*()
│   │   ├── prisma.ts             # DB singleton
│   │   ├── rank/ranks.ts         # Rank system config
│   │   ├── rate-limit.ts         # Upstash Redis rate limiting
│   │   └── ...                   # services, email, sentry, etc.
│   ├── i18n/                     # next-intl config
│   │   ├── routing.ts            # 5 locales: vi/en/ja/ko/zh
│   │   ├── request.ts            # Server-side locale + messages
│   │   └── providers.tsx         # Client NextIntlClientProvider
│   └── middleware.ts              # Edge middleware (i18n routing + admin auth)
├── messages/                      # Locale JSON files (root, for request.ts)
│   ├── vi.json, en.json          # Full translations (211 keys)
│   └── ja.json, ko.json, zh.json # Phase 1 translation-ready (211 keys each)
├── prisma/schema.prisma          # 60+ models (7 with i18n fields)
└── docs/                        # API documentation + ADR

---

## 🗄️ Database — 60+ Prisma Models

| Category | Models |
|----------|--------|
| Auth & RBAC | `User`, `Role`, `Permission`, `UserRole`, `Session`, `LoginHistory` |
| Core Content | `Service` ⚡, `Project` ⚡, `Testimonial` ⚡, `ContactMessage`, `PricingPlan`, `HomeSlider` ⚡, `HomeVideo` |
| Team & HR | `TeamMember` ⚡, `Expertise` ⚡, `MemberExpertise` |
| Commerce & Sales | `Order`, `OrderAttribute`, `ServiceAttribute`, `Quote`, `QuoteRequest`, `SalesLead`, `AddonService`, `RewardTier`, `OrderReward`, `Payment`, `OrderStatusHistory`, `ServicePackage` |
| Pricing Calculator | `InfrastructureTier`, `FeatureGroup`, `Feature`, `FeatureVariant`, `PricingWebPackage`, `PricingComparisonFeature`, `PricingHostingPlan`, `PricingDomainPrice`, `PricingDeploymentItem` |
| Project Management | `Epic`, `Backlog`, `Task`, `TaskTag`, `TaskViolation`, `BugNote`, `Deployment`, `FigmaDemo`, `EnvFile`, `GitCommit`, `GscMetric`, `SocialPost`, `HandoverPackage`, `DailyStandup`, `ProjectMember` |
| LP & Gamification | `CustomerPoint`, `PointTransaction`, `PointActivity`, `Advertisement`, `ReferralCode`, `ReferralTracking`, `LpAward`, `LpTransfer` |
| Education (EDU) | `Course`, `Lesson`, `Instructor`, `Enrollment`, `Attendance`, `Feedback`, `StudentProgress`, `EduPayment` |
| System & Misc | `AuditLog`, `Notification`, `SiteSetting`, `ServerAnalyticsEvent`, `CustomerWebsite`, `WebsiteStats`, `LandingPage`, `LandingSection`, `BlogPost` ⚡ |

⚡ = i18n fields added (`titleEn`, `titleJa`, `titleKo`, `titleZh`, `descriptionEn`, etc.)

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

## 🌐 Internationalization (i18n)

### Supported Locales
`vi` (default) · `en` · `ja` · `ko` · `zh`

### URL Strategy
Subdirectory: `/vi/...`, `/en/...`, `/ja/...`, `/ko/...`, `/zh/...`

### Backend Localization
All 11 public content APIs support `?lang=`:
```bash
GET /api/v1/services?lang=en
GET /api/services/[slug]?lang=ja
GET /api/blog-posts?lang=zh
```

Key helpers in `@/lib/i18n/localization`:
- `parseLocaleParam(searchParams)` — extract locale from query, default `vi`
- `getLocalizedField(record, fieldName, locale)` — get localized field or VI fallback
- `getLocalizedArray(record, fieldName, locale)` — same for array fields
- `mapLocalizedService(record, locale)` — map full service record with `_localeUsed`
- `mapLocalizedProject/TeamMember/BlogPost` — same for other models

### Middleware
Edge middleware at `src/middleware.ts` handles locale detection:
1. Cookie `NEXT_LOCALE` → 2. Accept-Language header → 3. Default `vi`

### Frontend Message Files
- `messages/vi.json`, `messages/en.json` — full translations
- `messages/ja.json`, `messages/ko.json`, `messages/zh.json` — Phase 1 ready



## 📋 Active Plan

See `docs/ADR-2026-001-i18n-strategy.md` for i18n roadmap (Phase 0 ✅ complete, Phase 1/2/3 pending).

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
6. **i18n:** All public content APIs support `?lang=vi|en|ja|ko|zh`. Default = `vi`. Use `getLocalizedField()` from `@/lib/i18n/localization` for field-level localization.
7. **API-only app** — public pages scaffolded but not fully wired to BE

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
