# LOOP Company Website — Claude Code Context

> Project: LOOP Agency Website — Next.js 15 + Prisma 7 + PostgreSQL/Neon
> Last Updated: 2026-03-27
> Language: Vietnamese (code comments, docs), English (variable names)
> Status: Phase 0 i18n complete — public pages wired to DB (Phase 0 ✅, Phase 1-3 pending)

---

## Project Overview

Next.js 15 application with backend API (200 route files, 357+ HTTP methods) + fully wired public pages for 5-language i18n (VI/EN/JA/KO/ZH). All 13 public pages read from the database via Prisma + mapLocalized*() helpers — not just scaffolded.

Branch: feature/i18n-vi-en (14 commits ahead of master)

i18n infrastructure complete (Phase 0):
- src/app/[locale]/ — 13 pages wired to DB: home, about, blog, blog/[slug], contact, portfolio, portfolio/[slug], pricing, services, services/[slug], team, + _templates
- src/components/ — SiteHeader, SiteFooter, LocaleSwitcher
- src/i18n/ — routing, request config, providers (5 locales)
- src/messages/ + messages/ — vi.json, en.json, ja.json, ko.json, zh.json (211 keys each)
- src/lib/i18n/localization.ts — getLocalizedField(), getLocalizedArray(), mapLocalized*() helpers
- 7 v1 public APIs support ?lang=vi|en|ja|ko|zh with VI fallback: /api/v1/services, /api/v1/projects, /api/v1/blog, /api/v1/team, /api/v1/testimonials, /api/v1/pricing, /api/blog-posts
  (Note: /api/services and /api/team are non-v1 routes without ?lang= — low priority)

Pending (Phase 1-3):
- CJK font lazy-loading: Noto Sans JP, KR, SC ✅ done in Week 13
- Admin CMS translate tabs: ServicesTab/PortfolioTab/BlogTab/MembersTab ✅ done
- Team member seed data (`memberData.ts`) now includes i18n fields for all records (name/role/bio EN/JA/KO/ZH)
- Admin tabs wired to real BE APIs ✅: ServicesTab → PUT /api/admin/services/[id]; PortfolioTab → PUT/POST/DELETE /api/admin/projects/[id]; BlogTab → PATCH/DELETE /api/admin/blog-posts/[id]; MembersTab → PUT/DELETE /api/admin/team/[id]
- API clients: `src/app/api/servicesAdminApi.ts`, `src/app/api/projectsAdminApi.ts`, `src/app/api/blogAdminApi.ts`, `src/app/api/teamAdminApi.ts`, `src/app/api/adminClient.ts`
- Professional translation of JA/KO/ZH message files (Phase 1-2)
- Translation management setup (Phrase/Lokalise, Phase 3)
- I18N-RUNBOOK.md operations documentation (Phase 3)

---

## Database 60+ Prisma Models

Category | Models
---|---
Auth & RBAC | User, Role, Permission, UserRole, Session, LoginHistory
Core Content | Service ⚡, Project ⚡, Testimonial ⚡, ContactMessage, PricingPlan, HomeSlider ⚡, HomeVideo
Team & HR | TeamMember ⚡, Expertise ⚡, MemberExpertise
Commerce & Sales | Order, OrderAttribute, ServiceAttribute, Quote, QuoteRequest, SalesLead, AddonService, RewardTier, OrderReward, Payment, OrderStatusHistory, ServicePackage
Pricing Calculator | InfrastructureTier, FeatureGroup, Feature, FeatureVariant, PricingWebPackage, PricingComparisonFeature, PricingHostingPlan, PricingDomainPrice, PricingDeploymentItem
Project Management | Epic, Backlog, Task, TaskTag, TaskViolation, BugNote, Deployment, FigmaDemo, EnvFile, GitCommit, GscMetric, SocialPost, HandoverPackage, DailyStandup, ProjectMember
LP & Gamification | CustomerPoint, PointTransaction, PointActivity, Advertisement, ReferralCode, ReferralTracking, LpAward, LpTransfer
Education (EDU) | Course, Lesson, Instructor, Enrollment, Attendance, Feedback, StudentProgress, EduPayment
System & Misc | AuditLog, Notification, SiteSetting, ServerAnalyticsEvent, CustomerWebsite, WebsiteStats, LandingPage, LandingSection, BlogPost ⚡

⚡ = i18n fields added (titleEn, titleJa, titleKo, titleZh, descriptionEn, etc.)
7 i18n models: Service, Project, Testimonial, HomeSlider, TeamMember, Expertise, BlogPost

---

## Authentication

Dual Auth System:
1. Credentials (JWT) — POST /api/admin/auth/login, HttpOnly cookie auth-token
2. Google OAuth — NextAuth v5, provider GoogleProvider

Role Hierarchy:
ceo(-1) > super_admin(0) > admin(1) > project_manager(2) > media(3) > qa(4) > member(5)

Auth Endpoint:
GET /api/admin/auth/me → { user: { userId, email, name, role, roles, avatar, accountType, teamMemberId, roleLevel, permissions[] } }

---

## Internationalization (i18n)

Supported Locales: vi (default) · en · ja · ko · zh
URL Strategy: Subdirectory /vi/..., /en/..., /ja/..., /ko/..., /zh/...

Backend Localization:
7 v1 public content APIs support ?lang=:
  GET /api/v1/services?lang=en
  GET /api/v1/projects?lang=ja
  GET /api/v1/team?lang=ko
  GET /api/blog-posts?lang=zh

Key helpers in @/lib/i18n/localization:
- parseLocaleParam(searchParams) — extract locale from query, default vi
- getLocalizedField(record, fieldName, locale) — get localized field or VI fallback
- getLocalizedArray(record, fieldName, locale) — same for array fields
- mapLocalizedService/Project/TeamMember/BlogPost(record, locale) — map full record with _localeUsed

Middleware:
Edge middleware at src/middleware.ts handles locale detection:
1. Cookie NEXT_LOCALE → 2. Accept-Language header → 3. Default vi

Frontend Message Files:
- messages/vi.json, messages/en.json — full translations (211 keys)
- messages/ja.json, messages/ko.json, messages/zh.json — Phase 1 translation-ready

---

## Key Conventions

1. API Responses: Always use helpers from @/lib/api. NEVER return raw NextResponse.json() directly.
   - Success: ok(data), list(data, pagination), json(payload)
   - Errors: badRequest(), unauthorized(), notFound(), handleError(err)
2. Auth: Always call requirePermission() in admin API routes
3. Error handling: Always try/catch + handleError() — never swallow errors silently
4. No JSX/React in API routes — backend is pure TypeScript
5. TypeScript strict mode — no any
6. i18n: v1 public APIs support ?lang=vi|en|ja|ko|zh. Default = vi. Use getLocalizedField() from @/lib/i18n/localization for field-level localization.
7. API-only app — public pages wired to DB via Prisma, NOT scaffolded

---

## Available Tools Commands

npm run dev          Start dev server
npm run build        Build production
npx prisma studio    Open DB GUI
npm run lint         ESLint
npx tsc --noEmit     Type check

---

## Communication Style

- Vietnamese for project docs, comments, and user communication
- English for code, variable names, function names
- Be concise, practical, and action-oriented
- Always show clear next steps after completing a task
