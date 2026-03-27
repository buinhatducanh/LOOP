# FE-BE Integration Status — LOOP Solutions

> **Cập nhật:** 2026-03-27 (Week 13)

---

## Public Pages Integration Status

| Page | Status | Notes |
|------|--------|-------|
| Home `/[locale]` | ✅ Wired | DB via Prisma + mapLocalized*() |
| Services list `/[locale]/services` | ✅ Wired | DB via Prisma |
| Service detail `/[locale]/services/[slug]` | ✅ Wired | DB via Prisma |
| Portfolio list `/[locale]/portfolio` | ✅ Wired | DB via Prisma |
| Portfolio detail `/[locale]/portfolio/[slug]` | ✅ Wired | DB via Prisma |
| Blog list `/[locale]/blog` | ✅ Wired | DB via Prisma |
| Blog detail `/[locale]/blog/[slug]` | ✅ Wired | DB via Prisma + author relation |
| Team `/[locale]/team` | ✅ Wired | DB via Prisma |
| About `/[locale]/about` | ✅ Wired | Static i18n content |
| Pricing `/[locale]/pricing` | ✅ Wired | DB via prisma.pricingPlan — static fallback |
| Contact `/[locale]/contact` | ✅ Wired | POST /api/contact |
| Privacy `/[locale]/privacy` | ✅ Wired | 8 sections, PrivacyPage i18n keys |
| Terms `/[locale]/terms` | ✅ Wired | 9 sections, TermsPage i18n keys |
| Team/[slug] `/[locale]/team/[slug]` | ✅ Wired | DB via Prisma, expertises, related members |

**Total: 14 public pages — ALL wired to DB.**

---

## API Coverage

| Category | Count | Notes |
|----------|-------|-------|
| Total route files | 200 | |
| Total HTTP methods | ~357 | |
| v1 public APIs | 7 | All with `?lang=` support |
| Content APIs | 14+ | services, projects, team, blog-posts, testimonials, expertises |
| Admin APIs | 120+ | All with JWT auth |
| Mock APIs | 8 | Protected by `requireMockApi()` guard |

### All Public APIs — `?lang=` Support

| Endpoint | `?lang=` | HTTP Methods | Response Helpers |
|----------|--------|-------------|----------------|
| `/api/v1/services` | ✅ | GET | `handleError()` |
| `/api/v1/projects` | ✅ | GET | `handleError()` |
| `/api/v1/team` | ✅ | GET | `handleError()` |
| `/api/v1/testimonials` | ✅ | GET | `handleError()` |
| `/api/v1/pricing` | ✅ | GET | `handleError()` |
| `/api/v1/blog` | ✅ | GET | `handleError()` |
| `/api/services` | ✅ | GET | `ok()` + `handleError()` |
| `/api/services/[slug]` | ✅ | GET | `ok()` + `notFound()` + `handleError()` |
| `/api/projects` | ✅ | GET | `ok()` + `handleError()` |
| `/api/projects/[slug]` | ✅ | GET | `ok()` + `notFound()` + `handleError()` |
| `/api/team` | ✅ | GET | `ok()` + `handleError()` |
| `/api/team/[slug]` | ✅ | GET | `ok()` + `notFound()` + `handleError()` |
| `/api/testimonials` | ✅ | GET | `ok()` + `handleError()` |
| `/api/expertises` | ✅ | GET | `ok()` + `handleError()` |
| `/api/blog-posts` | ✅ | GET, POST | ✅ |
| `/api/contact` | N/A | GET, POST | ✅ ok/badRequest |
| `/api/admin/*` | N/A | All | JWT auth + requirePermission |

**Mock APIs** are protected by `requireMockApi()` guard — only active when `NEXT_PUBLIC_MOCK_API=true`. No deprecation header needed.

---

## CJK Font Status

| Locale | Font | Loading Strategy | Status |
|--------|------|----------------|--------|
| VI | system-ui | N/A | ✅ Active |
| EN | system-ui | N/A | ✅ Active |
| JA | Noto Sans JP | `next/font/google` lazy | ✅ Implemented |
| KO | Noto Sans KR | `next/font/google` lazy | ✅ Implemented |
| ZH | Noto Sans SC | `next/font/google` lazy | ✅ Implemented |

**File:** `src/lib/fonts.ts` — `getFontClass(locale)` applied to `<body className>` in `src/app/[locale]/layout.tsx`.

---

## Quality Gates

| Check | Status |
|-------|--------|
| `npm run lint` | ✅ PASS (0 errors) |
| `npx tsc --noEmit` | ✅ PASS (0 errors) |
| `npm run build` | ✅ PASS |
| 5 locale routing | ✅ Working |
| i18n helpers | ✅ Complete |
| API response helpers | ✅ All routes using `ok()`/`handleError()` |

---

## Priority Work Items

### ✅ COMPLETED (Week 13)

1. ✅ All 14 public pages wired to DB
2. ✅ CJK font lazy loading (Noto Sans JP/KR/SC)
3. ✅ All public APIs support `?lang=` (14 endpoints)
4. ✅ All API routes use `@/lib/api` helpers (`ok()`, `handleError()`, `notFound()`)
5. ✅ Privacy + Terms + Team/[slug] pages created
6. ✅ Pricing page wired to DB

### 🔄 IN PROGRESS

- [ ] Admin CMS translate tabs (Services / Portfolio / Blog / Team translate UI)

### ⏳ PENDING

| Priority | Item | Notes |
|----------|------|-------|
| HIGH | JA/KO/ZH professional translation | ~60% AI draft — needs human review |
| MED | Translation management (Phrase/Lokalise) | Phase 3 |
| MED | I18N-RUNBOOK.md | Operations guide |
| LOW | Per-locale performance audit | TTFB targets per tier |
| LOW | Google Search Console verify | JA/KO/ZH properties |

---

## ADR Reference

- `docs/ADR-2026-001-i18n-strategy.md` — Phase 0-3 i18n strategy
- `docs/I18N-STATUS.md` — i18n phase status
- `docs/ROADMAP-STATUS-2026-03.md` — overall roadmap snapshot
