# i18n Implementation Status — LOOP Solutions

> **Cập nhật:** 2026-03-27 (Week 14)

---

## Phase Status

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| Phase 0 | Foundation | ✅ COMPLETE | routing, middleware, helpers, 5 locale messages, public pages DB-wired, 14 pages |
| Phase 0.5 | API i18n | ✅ COMPLETE | All 14 public APIs support `?lang=`, `ok()`/`handleError()` applied |
| Phase 1 | JA+KO Expansion | ✅ PARTIAL | CJK fonts ✅, hreflang ✅, translation pending |
| Phase 2 | ZH Optimization | ✅ PARTIAL | ZH font ✅, lazy SSR, perf audit pending |
| Phase 3 | Scale + Ops | ✅ PARTIAL | Admin CMS translate tabs ✅, I18N-RUNBOOK.md ✅ |
| Phase 3 | Ops | ⏳ PENDING | Phrase/Lokalise PoC, professional JA/KO/ZH UI translation |

---

## i18n API Coverage

| Endpoint | `?lang=` Support | Response Helpers | Status |
|----------|-----------------|----------------|--------|
| `/api/v1/services` | ✅ | `handleError()` | ✅ |
| `/api/v1/projects` | ✅ | `handleError()` | ✅ |
| `/api/v1/blog` | ✅ | `handleError()` | ✅ |
| `/api/v1/team` | ✅ | `handleError()` | ✅ |
| `/api/v1/testimonials` | ✅ | `handleError()` | ✅ |
| `/api/v1/pricing` | ✅ | `handleError()` | ✅ |
| `/api/blog-posts` | ✅ | ✅ | ✅ |
| `/api/services` | ✅ (added) | `ok()` + `handleError()` | ✅ NEW |
| `/api/services/[slug]` | ✅ (added) | `ok()` + `notFound()` + `handleError()` | ✅ NEW |
| `/api/projects` | ✅ (added) | `ok()` + `handleError()` | ✅ NEW |
| `/api/projects/[slug]` | ✅ (added) | `ok()` + `notFound()` + `handleError()` | ✅ NEW |
| `/api/team` | ✅ (added) | `ok()` + `handleError()` | ✅ NEW |
| `/api/team/[slug]` | ✅ (added) | `ok()` + `notFound()` + `handleError()` | ✅ NEW |
| `/api/testimonials` | ✅ (added) | `ok()` + `handleError()` | ✅ NEW |
| `/api/expertises` | ✅ (added) | `ok()` + `handleError()` | ✅ NEW |
| `/api/contact` | N/A | POST-only | ✅ |
| `/api/admin/*` | N/A | JWT auth + requirePermission | ✅ |

**Total public APIs with `?lang=`: 14 endpoints**

---

## Translation Coverage

### UI Strings (messages/*.json)

| Locale | Coverage | Status |
|--------|----------|--------|
| VI | ✅ 100% | Source of truth, default |
| EN | ✅ 100% | Full translation |
| JA | ✅ 100% | Translation keys complete (manual QA pending phrasing polish) |
| KO | ✅ 100% | Translation keys complete (manual QA pending phrasing polish) |
| ZH | ✅ 100% | Translation keys complete (manual QA pending phrasing polish) |

### CMS Content (Database Fields)

| Model | i18n Fields | VI | EN | JA | KO | ZH |
|-------|------------|----|----|----|----|----|
| Service | titleEn/Ja/Ko/Zh, descEn/Ja/Ko/Zh, contentEn/Ja/Ko/Zh | ✅ | ⚠️ | ⏳ | ⏳ | ⏳ |
| Project | titleEn/Ja/Ko/Zh, descEn/Ja/Ko/Zh, contentEn/Ja/Ko/Zh | ✅ | ⚠️ | ⏳ | ⏳ | ⏳ |
| TeamMember | nameEn/Ja/Ko/Zh, roleEn/Ja/Ko/Zh, bioEn/Ja/Ko/Zh | ✅ | ⚠️ | ⏳ | ⏳ | ⏳ |
| Expertise | nameEn/Ja/Ko/Zh, categoryEn/Ja/Ko/Zh | ✅ | ⚠️ | ⏳ | ⏳ | ⏳ |
| Testimonial | textEn/Ja/Ko/Zh, roleEn/Ja/Ko/Zh, companyEn/Ja/Ko/Zh | ✅ | ⚠️ | ⏳ | ⏳ | ⏳ |
| HomeSlider | titleEn/Ja/Ko/Zh, subtitleEn/Ja/Ko/Zh | ✅ | ⚠️ | ⏳ | ⏳ | ⏳ |
| BlogPost | titleEn/Ja/Ko/Zh, contentEn/Ja/Ko/Zh, excerptEn/Ja/Ko/Zh | ✅ | ⚠️ | ⏳ | ⏳ | ⏳ |

✅ = Complete | ⚠️ = Partial | ⏳ = Pending (no data yet)

---

## Admin CMS Translate Tabs (Week 13)

| Tab | URL | Translate Fields | BE Endpoint | Status |
|-----|-----|-----------------|-------------|--------|
| ServicesTab | `/admin/services` | title/subtitle (VI/EN/JA/KO/ZH) | `PUT /api/admin/services/[id]` | ✅ |
| PortfolioTab | `/admin/portfolio` | title/tag/challenge/solution/result (EN/JA/KO/ZH) | `PUT /api/admin/projects/[id]` | ✅ |
| BlogTab | `/admin/blog` | title (EN/JA/KO/ZH) | `PATCH /api/admin/blog-posts/[id]` | ✅ |
| MembersTab | `/admin/members` | name/role/bio (EN/JA/KO/ZH) | `PUT /api/admin/team/[id]` | ✅ |

FE API clients:
- `src/app/api/servicesAdminApi.ts`
- `src/app/api/projectsAdminApi.ts`
- `src/app/api/blogAdminApi.ts`
- `src/app/api/teamAdminApi.ts`
- `src/app/api/adminClient.ts` (base client with `AdminApiError`)

All tabs: optimistic local update → async API sync, animated loading/success/error banners.

---

| File | Description |
|------|-------------|
| `src/lib/fonts.ts` | `Noto_Sans_JP`, `Noto_Sans_KR`, `Noto_Sans_SC` via `next/font/google` |
| `src/app/[locale]/layout.tsx` | `className={getFontClass(locale)}` on `<body>` |

**VI/EN users pay zero font overhead.**

---

## Pending Work

### HIGH
- [x] ~~Admin CMS translate tabs (Services / Portfolio / Blog / Team translate UI per-field)~~ ✅ Done Week 13
- [x] ~~JA + KO + ZH translation (message files UI strings)~~ ✅ Key coverage 100% on 2026-03-27
- [ ] JA + KO + ZH professional linguistic QA (phrasing, tone, native review)
- [ ] JA + KO + ZH professional translation (CMS content — Service/Project/Team/Blog fields)

### MEDIUM
- [x] ~~I18N-RUNBOOK.md~~ ✅ Done Week 14
- [x] ~~Phrase/Lokalise PoC docs~~ ✅ `docs/I18N-TRANSLATION-SETUP.md`
- [ ] Phrase/Lokalise production account + CI secret wiring
- [ ] Google Search Console verify JA/KO/ZH properties

### LOW
- [x] FE bundle size optimization (1.9MB → 31KB critical path, per-page lazy chunks) ✅ Done Week 14
- [ ] Additional admin code-splitting (chunk-admin still ~608KB) via tab-level lazy imports in AdminDashboard
- [ ] Translation lint script in CI (fail build when locale key missing)

### MEDIUM
- [ ] Translation management setup (Phrase/Lokalise) — Phase 3
- [ ] I18N-RUNBOOK.md operations documentation
- [ ] Performance audit: TTFB per locale tier

### LOW
- [ ] Google Search Console: verify JA + KO + ZH properties
- [ ] SEO hreflang full audit (Screaming Frog)

---

## Quality Gates

| Gate | Status |
|------|--------|
| `npm run lint` | ✅ PASS (0 errors) |
| `npx tsc --noEmit` | ✅ PASS |
| `npm run build` | ✅ PASS |
| 5 locale routing | ✅ Working |
| i18n middleware | ✅ Cookie → Accept-Language → VI fallback |
| `getLocalizedField()` | ✅ |
| `mapLocalized*()` | ✅ 4 helpers |
| `?lang=` coverage | ✅ 14 public endpoints |

---

## Performance Targets

| Locale Tier | Target TTFB | Strategy | Status |
|------------|------------|----------|--------|
| VI + EN | < 100ms (CDN) | Pre-render | ⏳ Pending audit |
| JA + KO | < 300ms (Edge) | SSR | ⏳ Pending audit |
| ZH | < 500ms | Lazy SSR | ⏳ Pending audit |

---

## ADR Reference

See `docs/ADR-2026-001-i18n-strategy.md` for full Phase 0-3 implementation details.
