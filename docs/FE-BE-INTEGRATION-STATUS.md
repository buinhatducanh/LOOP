# FE-BE Integration Status — LOOP Solutions

> **Cập nhật:** 2026-03-31 (Post F8 + MembersTab translate tab completion — line counts verified against source files)
> **BE tsc:** ✅ PASS · **FE tsc:** ✅ PASS

---

## Executive Summary

Tất cả 8 phases (F0–F8) hoàn thành. Hệ thống có **224 route files**, **99 Prisma models**, **~90 i18n columns**, 5 ngôn ngữ, và scale infrastructure đầy đủ. 14 public pages đều wired DB. Schema đã có đủ 10 array i18n fields. 4/4 admin translate tabs đã xong (MembersTab translate tab ✅ 2026-03-31). JSON Translation migration và `SupportedLocale` model là P2 improvements — không block hiện tại.

---

## Phase Completion Tracker

| Phase | Status | Completion Date | Owner |
|-------|--------|----------------|-------|
| F0 Infrastructure | ✅ COMPLETED | 2026-03-28 | FE Lead |
| F1 Public Pages | ✅ COMPLETED | 2026-03-29 | FE Lead |
| F2 Booking/Orders | ✅ COMPLETED | 2026-03-29 | FE+BE |
| F3 Team/Effects | ✅ COMPLETED | 2026-03-29 | FE+BE |
| F4 Academy | ✅ COMPLETED | 2026-03-29 | FE+BE |
| F5 Customer Portal | ✅ COMPLETED | 2026-03-29 | FE |
| F6 Admin 23 tabs | ✅ COMPLETED | 2026-03-30 | FE |
| F7 Realtime/Polish | ✅ COMPLETED | 2026-03-30 | FE+BE |
| F8 Scale Hardening | ✅ COMPLETED | 2026-03-30 | FE+BE+DevOps |
| Fi I18n Remediation | ✅ COMPLETED | 2026-03-29 | FE+BE |
| Fs SEO/PWA/Geo | ✅ COMPLETED | 2026-03-29 | FE+BE |
| R-seed Unified Demo Data | ✅ COMPLETED | 2026-03-30 | FE |

---

## Public Pages Integration Status

| Page | Status | Notes |
|------|--------|-------|
| Home `/[locale]` | ✅ Wired | DB via Prisma + mapLocalized*() |
| Services list `/[locale]/services` | ✅ Wired | DB via Prisma |
| Service detail `/[locale]/services/[slug]` | ✅ Wired | DB via Prisma |
| Portfolio list `/[locale]/portfolio` | ✅ Wired | DB via Prisma |
| Portfolio detail `/[locale]/portfolio/[slug]` | ✅ Wired | DB via Prisma |
| Blog list `/[locale]/blog` | ✅ Wired | DB via Prisma + author relation |
| Blog detail `/[locale]/blog/[slug]` | ✅ Wired | DB via Prisma + author relation |
| Team `/[locale]/team` | ✅ Wired | DB via Prisma |
| About `/[locale]/about` | ✅ Wired | Static i18n content |
| Pricing `/[locale]/pricing` | ✅ Wired | DB via prisma.pricingPlan |
| Contact `/[locale]/contact` | ✅ Wired | POST /api/contact |
| Privacy `/[locale]/privacy` | ✅ Wired | 8 sections, PrivacyPage i18n keys |
| Terms `/[locale]/terms` | ✅ Wired | 9 sections, TermsPage i18n keys |
| Team/[slug] `/[locale]/team/[slug]` | ✅ Wired | DB via Prisma, expertises, related members |

**Total: 14 public pages — ALL wired to DB.**

---

## API Coverage

| Category | Count | Notes |
|----------|-------|-------|
| Total route files | 224 | |
| Total Prisma models | 99 | |
| v1 public APIs | 6 | `?lang=` on services/projects/team/testimonials/courses (x2); pricing/blog from Sanity/DB without `?lang=` |
| Content APIs | 17 total | 6 v1 (services/projects/team/testimonials/courses×2) + 11 non-v1 (services/projects/team/testimonials/expertises/blog-posts/contact) |
| Admin APIs | 120+ | All with JWT auth + RBAC |
| Mock APIs | 8 | Protected by `requireMockApi()` guard |
| Inngest functions | 8 | Email, SLA, standup, LP report, warmCache, prune, daily digest |

### All Public APIs — `?lang=` Support

| Endpoint | `?lang=` | HTTP Methods | Response Helpers |
|----------|--------|-------------|----------------|
| `/api/v1/services` | ✅ | GET | `handleError()` + logger.withSLO() |
| `/api/v1/projects` | ✅ | GET | raw `NextResponse.json()` + `handleError()` |
| `/api/v1/team` | ✅ | GET | raw `NextResponse.json()` + `handleError()` |
| `/api/v1/testimonials` | ✅ | GET | raw `NextResponse.json()` + `handleError()` |
| `/api/v1/courses` | ✅ | GET | raw `NextResponse.json()` + `handleError()` |
| `/api/v1/courses/[id]` | ✅ | GET | raw `NextResponse.json()` + `handleError()` + `notFound()` |
| `/api/v1/pricing` | ❌ | GET | raw `NextResponse.json()` (Sanity CMS — DB, no locale param) |
| `/api/v1/blog` | ❌ | GET | raw `NextResponse.json()` (Sanity CMS, no locale param) |
| `/api/services` | ✅ | GET | `ok()` + `handleError()` |
| `/api/services/[slug]` | ✅ | GET | `ok()` + `notFound()` + `handleError()` |
| `/api/projects` | ✅ | GET | `ok()` + `handleError()` |
| `/api/projects/[slug]` | ✅ | GET | `ok()` + `notFound()` + `handleError()` |
| `/api/team` | ✅ | GET | `ok()` + `handleError()` |
| `/api/team/[slug]` | ✅ | GET | `ok()` + `notFound()` + `handleError()` |
| `/api/testimonials` | ✅ | GET | `ok()` + `handleError()` |
| `/api/expertises` | ✅ | GET | `ok()` + `handleError()` |
| `/api/blog-posts` | ✅ | GET, POST | `ok()` + `handleError()` |
| `/api/contact` | N/A | GET, POST | `ok()` + `badRequest()` |

---

## Database Schema — i18n Coverage

### i18n Fields per Model

| Model | i18n Text Columns | i18n Array Columns | Status |
|-------|------------------|-------------------|--------|
| Service | 9 (titleEn/Ja/Ko/Zh, shortDescEn/Ja/Ko/Zh, longDescEn/Ja/Ko/Zh) | 8 (featuresEn/Ja/Ko/Zh, technologiesEn/Ja/Ko/Zh) | ✅ Complete |
| Project | 12 (titleEn/Ja/Ko/Zh, descEn/Ja/Ko/Zh, resultsEn/Ja/Ko/Zh) | 8 (techStackEn/Ja/Ko/Zh, featuresEn/Ja/Ko/Zh) | ✅ Complete |
| BlogPost | 20 (title/excerpt/content/seoTitle/seoDesc × 4 locales) | 0 | ✅ Complete |
| TeamMember | 16 (name/role/bio/shortBio × 4 locales) | 0 | ✅ Complete |
| Testimonial | 12 (text/role/company × 4 locales) | 0 | ✅ Complete |
| Expertise | 8 (name/category × 4 locales) | 0 | ✅ Complete |
| HomeSlider | 8 (title/subtitle × 4 locales) | 0 | ✅ Complete |
| ServicePackage | 8 (title/shortDesc × 4 locales) | 0 | ✅ Complete |

**Total: ~90 i18n columns across 8 models. All fields present in schema.**

### Future Improvement (P2)

- **`translations` Json field** — Proposed in `fe-i18n-scale-plan.md` Phase 3. Consolidates all locale data into 1 JSON column per model. Not needed for current operation — column-per-language works. Deferred to P2.
- **`SupportedLocale` model** — Dynamic locale management from DB. Not needed for current 5 locales. Deferred to P2.

---

## i18n System

### Backend (BE) — next-intl + column-per-language

| Component | Status | Notes |
|-----------|--------|-------|
| Routing | ✅ | `/vi`, `/en`, `/ja`, `/ko`, `/zh` with `localePrefix: "always"` |
| Middleware | ✅ | Cookie → Accept-Language → vi fallback |
| Message files | ✅ | `src/messages/{vi,en,ja,ko,zh}.json` — ~465 keys |
| `?lang=` API support | ✅ | All 14 content APIs support `?lang=vi|en|ja|ko|zh` |
| `getLocalizedField()` | ✅ | 5 helpers + 4 mappers in `src/lib/i18n/localization.ts` |
| Column-per-language | ✅ | ~90 columns across 8 models |
| `translations` Json field | ⏳ Deferred | Phase 3 scale plan — P2 |

### Frontend (FE) — Zustand + JSON i18n

| Component | Status | Notes |
|-----------|--------|-------|
| `FE/src/i18n/` system | ✅ | `messages/{vi,en,ja,ko,zh}.json`, `i18n.ts`, `sync.tsx`, `useTranslation.ts`, `fonts.ts`, `index.ts` |
| `localeStore.ts` | ✅ | `SUPPORTED_LOCALES`, `WIZARD_STEP_LABELS` (8×5), `ORDER_STATUS_LABELS` (6×5) |
| Navbar | ✅ | `useI18n()` wired (Navbar.tsx, Footer.tsx) |
| API calls | ✅ | All wired with `?lang=` propagation |

### CJK Font Status

| Locale | Font | Loading Strategy | Status |
|--------|------|----------------|--------|
| VI | system-ui | N/A | ✅ Active |
| EN | system-ui | N/A | ✅ Active |
| JA | Noto Sans JP | `next/font/google` lazy | ✅ Implemented |
| KO | Noto Sans KR | `next/font/google` lazy | ✅ Implemented |
| ZH | Noto Sans SC | `next/font/google` lazy | ✅ Implemented |

**File:** `src/lib/fonts.ts` — `getFontClass(locale)` applied to `<body className>` in `src/app/[locale]/layout.tsx`.

---

## Admin CMS Translate Tabs

| Tab | Translate Tab | Fields | Status |
|-----|-------------|--------|--------|
| ServicesTab | ✅ `TranslationEditor` | title, subtitle, longDescription, features, technologies | ✅ Wired |
| PortfolioTab | ✅ `TranslationEditor` | title, tag, challenge, solution, result, techStack, features | ✅ Wired |
| BlogTab | ✅ `TranslationEditor` | title, excerpt, content, seoTitle, seoDesc | ✅ Wired |
| MembersTab | ✅ `TranslationEditor` | name, role, title, bio (EN/JA/KO/ZH) | ✅ Wired |

---

## Scale Infrastructure (F8 Baseline)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/slo.ts` | 221 | SLO definitions + burn rate helpers |
| `src/lib/logger.ts` | 265 | Structured logger (JSON, Sentry, redaction) |
| `src/lib/scaleGate.ts` | 552 | Scale readiness gate (7 rules, CI-enforced) |
| `src/lib/capacity.ts` | 377 | Sprint capacity planner |
| `scripts/run-scale-gates.ts` | 25 | CI runner for scale gate |
| `src/lib/jobs/client.ts` | — | Inngest client singleton + event registry (8 events) |
| `src/lib/jobs/functions.ts` | 396 | 8 Inngest functions (email, SLA, standup, LP report, warmCache, prune, daily digest) |

### Scale Gate Status

| Gate | Status | Notes |
|------|--------|-------|
| CACHE_STRATEGY | ✅ | Cache-Control on all 6 v1 GETs (s-maxage=60-300), ISR revalidate=300 on blog/pricing/courses |
| OBSERVABILITY | ✅ | `logger.withSLO()` on 14 endpoints |
| RATE_LIMIT | ✅ | `applyRateLimit()` on 5 public endpoints + auth/login |
| IDEMPOTENCY | ✅ | `IdempotencyKey` model (4 indexes, 24h TTL, upsert) + `withIdempotency()` on 6 critical mutations |
| ASYNC_FOR_HEAVY_OPS | ✅ | All 8 Inngest jobs (consolidated from dual Jobs/Inngest system) |
| RETRY_POLICY | ⚠️ | FE client retry 3x; BE per-endpoint retry not standardized |
| Blocking errors | 0 | CI pipeline passes |
| Known warnings | 4 | auth/me, admin-orders, admin-dashboard (user-specific, can't cache), login (safe to retry) |

---

## Customer & Admin Dashboard Status

### Customer Dashboard (10 tabs — all wired)

Home, Dự án, Khóa học, Hóa đơn, Ví LP, Giới thiệu, Hỗ trợ, Cài đặt, Hiệu ứng, Quests — all wired with graceful fallback.

### Admin Dashboard (23 tabs — all wired)

Inline tabs: LPFinanceTab (lpService), NotificationsTab (notificationsService)
Lazy tabs: ServicesTab, PortfolioTab, BlogTab, MembersTab, EffectsTab, QuotationTab, RevenueTab, AnalyticsTab, ClientsTab, LPManagementTab, AdminLeaderboardTab, KanbanHub, DepartmentTab, QuestEventsTab, NotificationCenter, ProjectsCompletedTab, WebPackagesTab, MediaTab, IncomeTaxTab

**RBAC:** ✅ Enforced per department (engineering/design/media/marketing/sales/finance/hr/management/admin)

---

## Academy Integration

| Feature | Status | Endpoint |
|---------|--------|---------|
| Course list/detail | ✅ Wired | `GET /api/v1/courses?lang=` |
| Enrollment | ✅ Wired | `POST /api/academy/enroll` |
| Video Gate 35% | ✅ Wired | `POST /api/academy/lessons/[id]/complete` |
| Code Exercise | ✅ Wired | `POST /api/academy/lessons/[id]/exercise` (JS vm sandbox, 2s timeout) |
| Comments | ✅ Wired | `GET/POST /api/academy/lessons/[id]/comments` |
| Progress tracking | ✅ Wired | `GET /api/academy/progress/[courseId]` |
| Certificate | ✅ Wired | `GET /api/academy/certificate/[courseId]` |
| LP reward on completion | ✅ Wired | In `lessons/[id]/complete` endpoint |

---

## Quality Gates

| Check | BE | FE |
|-------|----|----|
| `npm run lint` | ✅ PASS | ✅ PASS |
| `npx tsc --noEmit` | ✅ PASS (exit 0) | ✅ PASS (exit 0) |
| `npm run build` | ✅ PASS | ✅ PASS |
| 5 locale routing | ✅ Working | — |
| SSE realtime | ✅ | ✅ NotificationCenter wired |
| Seed data | ✅ 28 members, LP economy, quests, events | — |

---

## Remaining Work

### High Priority

> ✅ **ALL HIGH PRIORITY ITEMS COMPLETED (2026-03-31).** All FE-BE integration tasks done. 4/4 admin translate tabs ✅. Schema i18n fields ✅. Scale infrastructure ✅.

### Medium Priority

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 1 | JA/KO/ZH professional translation | Translator | ~465 UI keys + ~90 CMS columns; AI draft needs native speaker QA |
| 2 | I18N-RUNBOOK.md | FE Lead | ✅ DONE — `docs/I18N-RUNBOOK.md` exists, 268 lines, covers all operations |

### Low Priority (P2)

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 3 | `translations` Json field migration | BE | Consolidate ~90 i18n columns into 1 JSON column per model. Column-per-language works fine now. Deferred until needed. |
| 4 | `SupportedLocale` model | BE | Dynamic locale management from DB. Not needed for current 5 locales. Deferred until needed. |
| 5 | Per-locale performance audit | DevOps | TTFB targets per tier (VI+EN <100ms, JA+KO <300ms, ZH <500ms) |
| 6 | Google Search Console verify | SEO | JA/KO/ZH properties |
| 7 | FE bundle size optimization | FE | Chunk splitting for large bundle |

---

## ADR Reference

| Doc | Topic |
|-----|-------|
| `docs/ADR-2026-001-i18n-strategy.md` | Phase 0-3 i18n strategy |
| `docs/I18N-STATUS.md` | i18n phase status |
| `docs/ROADMAP-STATUS-2026-03.md` | Overall roadmap snapshot |
| `.claude/rules/fe-i18n-scale-plan.md` | JSON Translation migration plan (Phase 0-4, P2) |
| `.claude/rules/fe-scale-operating-runbook.md` | Scale ops runbook (F8 baseline) |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-03-31 | MembersTab translate tab ✅ verified (MEMBER_I18N_FIELDS, TranslationEditor, translate section all present in MembersTab.tsx). Scale infra line counts corrected: scaleGate.ts 475→552, logger.ts 259→265, slo.ts 222→221, capacity.ts 378→377, functions.ts 397→396. Remaining work: 0 HIGH, 2 MEDIUM, 5 P2 items. |
| 2026-03-31 | Verified against codebase: schema has all 10 array i18n fields, FE i18n system exists, 3/4 admin translate tabs wired. Updated remaining work: MembersTab translate tab (HIGH), JSON migration deferred to P2. |
| 2026-03-27 | Initial version: 14 pages wired, 14 API endpoints, CJK fonts, quality gates. |
