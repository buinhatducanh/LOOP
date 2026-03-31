# i18n Implementation Status — LOOP Solutions

> **Cập nhật:** 2026-03-31 (Post all phases completion — aligned with FE-BE-INTEGRATION-STATUS.md)
> **Build:** ✅ `npm run lint` · ✅ `npx tsc --noEmit` · ✅ `npm run build`

---

## Phase Status

| Phase | Name | Status | Completion Date | Notes |
|-------|------|--------|---------------|-------|
| Fi | I18n Remediation | ✅ COMPLETE | 2026-03-29 | SiteHeader/Footer → `useI18n()`, LocaleSwitcher cookie, error page hardcoded (Next.js limitation) |
| Fs | SEO/PWA/Geo | ✅ COMPLETE | 2026-03-29 | Dynamic OG via `/api/og`, geo tags, JSON-LD, manifest linked, theme_color fixed |
| F8 | Scale Hardening | ✅ COMPLETE | 2026-03-30 | Scale infrastructure + SLO + logger + cache + idempotency |

---

## i18n API Coverage

### All Public APIs — `?lang=` Support

| Endpoint | `?lang=` | Response Helpers | Status |
|----------|--------|----------------|--------|
| `/api/v1/services` | ✅ | `handleError()` | ✅ |
| `/api/v1/projects` | ✅ | `handleError()` | ✅ |
| `/api/v1/blog` | ✅ | `handleError()` | ✅ |
| `/api/v1/team` | ✅ | `handleError()` | ✅ |
| `/api/v1/testimonials` | ✅ | `handleError()` | ✅ |
| `/api/v1/pricing` | ✅ | `handleError()` | ✅ |
| `/api/services` | ✅ | `ok()` + `handleError()` | ✅ |
| `/api/services/[slug]` | ✅ | `ok()` + `notFound()` + `handleError()` | ✅ |
| `/api/projects` | ✅ | `ok()` + `handleError()` | ✅ |
| `/api/projects/[slug]` | ✅ | `ok()` + `notFound()` + `handleError()` | ✅ |
| `/api/team` | ✅ | `ok()` + `handleError()` | ✅ |
| `/api/team/[slug]` | ✅ | `ok()` + `notFound()` + `handleError()` | ✅ |
| `/api/testimonials` | ✅ | `ok()` + `handleError()` | ✅ |
| `/api/expertises` | ✅ | `ok()` + `handleError()` | ✅ |
| `/api/blog-posts` | ✅ | `ok()` + `handleError()` | ✅ |
| `/api/contact` | N/A | POST-only | ✅ |

**Total: 15 endpoints with `?lang=` support (vi/en/ja/ko/zh).**

---

## Translation Coverage

### UI Strings (messages/*.json)

| Locale | Keys | Coverage | Status |
|--------|------|----------|--------|
| VI | ~465 | 100% | ✅ Source of truth, default |
| EN | ~465 | 100% | ✅ Full translation |
| JA | ~465 | 100% | ✅ Keys complete; human QA pending phrasing polish |
| KO | ~465 | 100% | ✅ Keys complete; human QA pending phrasing polish |
| ZH | ~465 | 100% | ✅ Keys complete; human QA pending phrasing polish |

### CMS Content (Database — Column-Per-Language)

| Model | i18n Fields | VI | EN | JA | KO | ZH |
|-------|------------|----|----|----|----|----|
| Service | title, shortDesc, longDesc, features[], technologies[] ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |
| Project | title, desc, results, techStack[], features[] ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |
| BlogPost | title, excerpt, content, seoTitle, seoDesc ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |
| TeamMember | name, role, bio, shortBio ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |
| Testimonial | text, role, company ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |
| Expertise | name, category ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |
| HomeSlider | title, subtitle ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |
| ServicePackage | title, shortDesc ×4 | ✅ | ⚠️ Partial | ⏳ | ⏳ | ⏳ |

✅ = Data present | ⚠️ = Partial | ⏳ = Pending (no data — requires admin input or professional translation)

---

## Admin CMS Translate Tabs

| Tab | URL | Fields | BE Endpoint | Status |
|-----|-----|--------|-------------|--------|
| ServicesTab | `/admin/services` | title, subtitle, longDescription, features, technologies | `PUT /api/admin/services/[id]` | ✅ |
| PortfolioTab | `/admin/portfolio` | title, tag, challenge, solution, result, techStack, features | `PUT /api/admin/projects/[id]` | ✅ |
| BlogTab | `/admin/blog` | title, excerpt, content, seoTitle, seoDesc | `PATCH /api/admin/blog-posts/[id]` | ✅ |
| MembersTab | `/admin/members` | name, role, title, bio | `PUT /api/admin/team/[id]` | ✅ |

All 4 tabs use `TranslationEditor` component with EN/JA/KO/ZH per-field editing.

---

## CJK Font Loading

| Locale | Font | Strategy | Status |
|--------|------|----------|--------|
| VI | system-ui | N/A | ✅ Active |
| EN | system-ui | N/A | ✅ Active |
| JA | Noto Sans JP | `next/font/google` lazy | ✅ |
| KO | Noto Sans KR | `next/font/google` lazy | ✅ |
| ZH | Noto Sans SC | `next/font/google` lazy | ✅ |

File: `src/lib/fonts.ts` → `getFontClass(locale)` applied to `<body>` in `src/app/[locale]/layout.tsx`.
VI/EN users pay zero CJK font overhead.

---

## Performance Targets (Pending Audit)

| Locale Tier | Target TTFB | Strategy | Status |
|------------|------------|----------|--------|
| VI + EN | < 100ms | CDN pre-render | ⏳ Pending |
| JA + KO | < 300ms | Edge SSR | ⏳ Pending |
| ZH | < 500ms | Lazy SSR | ⏳ Pending |

---

## i18n Backend Helpers

| Helper | File | Status |
|--------|------|--------|
| `getLocalizedField()` | `src/lib/i18n/localization.ts` | ✅ |
| `getLocalizedArray()` | `src/lib/i18n/localization.ts` | ✅ |
| `getAllLocalizedFields()` | `src/lib/i18n/localization.ts` | ✅ |
| `parseLocaleParam()` | `src/lib/i18n/localization.ts` | ✅ |
| `mapLocalizedService()` | `src/lib/i18n/localization.ts` | ✅ |
| `mapLocalizedProject()` | `src/lib/i18n/localization.ts` | ✅ |
| `mapLocalizedTeamMember()` | `src/lib/i18n/localization.ts` | ✅ |
| `mapLocalizedBlogPost()` | `src/lib/i18n/localization.ts` | ✅ |

---

## Remaining Work

### HIGH
> ✅ **All HIGH items completed.**

### MEDIUM

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 1 | JA/KO/ZH professional translation (UI + CMS) | Translator | ~465 UI keys + ~90 CMS columns; AI draft needs native speaker QA |
| 2 | I18N-RUNBOOK.md | FE Lead | ✅ DONE — `docs/I18N-RUNBOOK.md` 268 lines, covers all operations |

### LOW (P2)

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 3 | `translations` Json field migration | BE | Consolidate ~90 columns → 1 JSON column per model. Column-per-language works fine. Deferred. |
| 4 | `SupportedLocale` model | BE | Dynamic locale management from DB. Not needed for current 5 locales. Deferred. |
| 5 | Per-locale TTFB performance audit | DevOps | VI+EN <100ms, JA+KO <300ms, ZH <500ms |
| 6 | Google Search Console verify JA/KO/ZH | SEO | Verify JA/KO/ZH properties |
| 7 | FE bundle size optimization | FE | Chunk splitting for large bundle |

---

## Quality Gates

| Gate | Status |
|------|--------|
| `npm run lint` | ✅ PASS (0 errors) |
| `npx tsc --noEmit` | ✅ PASS |
| `npm run build` | ✅ PASS |
| 5 locale routing | ✅ Working (`/vi`, `/en`, `/ja`, `/ko`, `/zh`) |
| Middleware | ✅ Cookie → Accept-Language → vi fallback |
| `?lang=` coverage | ✅ 15 public endpoints |

---

## ADR Reference

| Doc | Topic |
|-----|-------|
| `docs/ADR-2026-001-i18n-strategy.md` | i18n strategy Phase 0–3 |
| `docs/FE-BE-INTEGRATION-STATUS.md` | Full FE-BE integration status |
| `docs/I18N-RUNBOOK.md` | Operations guide ✅ (268 lines, step-by-step) |
| `docs/I18N-TRANSLATION-SETUP.md` | Phrase/Lokalise setup guide |
| `.claude/rules/fe-i18n-scale-plan.md` | JSON Translation migration (Phase 0–4, P2) |
| `.claude/rules/fe-i18n-implementation-plan.md` | Full i18n implementation plan |
