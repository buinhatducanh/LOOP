# ADR-2026-001 — i18n Strategy for LOOP Website

> **Date:** 2026-03-26
> **Status:** Accepted
> **Owners:** FE Lead, BE Lead, PO
> **Related Epic/Module:** i18n Implementation (FE Phase 0)
> **Last Updated:** 2026-03-27

---

## 1) Context

LOOP website cần hỗ trợ 5 ngôn ngữ (VI–EN–JA–KO–ZH) để phục vụ thị trường nội địa (VN) và mở rộng quốc tế (Japan, Korea, China, global English market).

Backend hiện tại là API-only (Next.js 15 + Prisma 7 + PostgreSQL/Neon) với 198 endpoints. Frontend sẽ là separate repo consume APIs.

Các quyết định cần chốt trước khi bắt đầu implementation:
1. Default language
2. URL strategy
3. Translation quality bar
4. Market priority sequence

---

## 2) Decision

### Decision 1: Default Language = **Vietnamese (VI)**

VI là ngôn ngữ mặc định, source-of-truth cho CMS content.

**Rationale:**
- LOOP là agency Việt Nam, khách hàng chính ở thị trường Việt Nam
- Backend code/comments/docs hiện tại = tiếng Việt
- CMS content (Service, Project, Blog) hiện tại = tiếng Việt
- Fallback chain: EN → VI (khi missing) = tự nhiên

### Decision 2: URL Strategy = **Subdirectory** (`/vi/`, `/en/`, `/ja/`, `/ko/`, `/zh/`)

Mỗi locale có URL riêng biệt với locale prefix.

**Rationale:**
- SEO tốt nhất: page authority consolidated dưới single domain
- hreflang tự nhiên: mỗi URL có hreflang riêng
- Cookie persistence đi kèm tự nhiên
- So sánh:
  - `/?lang=` → không tạo separate URL → không index được riêng ❌
  - Subdomain (`vi.loop.com`) → tốt cho scale nhưng phức tạp hơn ở giai đoạn đầu ❌
  - Subdirectory → đơn giản + SEO tốt ✅

### Decision 3: Translation Quality Bar = **Tiered Strategy**

| Phase | Target | Quality Bar |
|-------|--------|-------------|
| Phase 0 (VI→EN) | EN | Human review bắt buộc |
| Phase 1 (EN→JA/KO) | JA, KO | AI draft + human spot check |
| Phase 2 (EN→ZH) | ZH | AI draft, NO review (MVP only) |

**Rationale:**
- EN là thị trường quốc tế chính → cần chất lượng cao
- JA/KO = high-income market → AI-assisted acceptable for MVP
- ZH = huge potential market → lazy-load strategy + AI draft MVP first

### Decision 4: Market Priority = **VI → EN → JA/KO → ZH**

Sequence unchanged from plan.

**Rationale:**
- Phase 0: VI + EN foundation (tuần 1-2)
- Phase 1: JA + KO expansion (tuần 3) — font optimization CJK
- Phase 2: ZH lazy-load (tuần 4) — font ~8MB cần cẩn thận
- ZH để cuối vì: (a) lazy-load phức tạp hơn, (b) market entry cần thêm strategy

---

## 3) Options Considered

### Default Language

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| VI | Home market, existing content | May limit EN quality | **Chosen** |
| EN | Universal, developer-friendly | Existing content is VI, more translation work | Rejected |

### URL Strategy

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Subdirectory `/vi/` | SEO best, hreflang natural, simple | Requires middleware redirect | **Chosen** |
| Query param `/?lang=` | No URL restructure needed | No separate index, SEO weak | Rejected |
| Subdomain `vi.loop.com` | Scale-friendly, isolated | Complex setup, DNS/CDN config | Rejected for Phase 0 |

### Translation Quality

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| All human review | Consistent quality | Slow, expensive | Rejected (EN only) |
| All AI | Fast, cheap | Quality inconsistent | Rejected |
| **Tiered** | Balances quality + speed | More complex workflow | **Chosen** |

---

## 4) Consequences

### Positive

- VI default → native experience cho home market
- Subdirectory → full SEO benefits, hreflang correct-by-default
- Tiered quality → faster MVP launch với quality-appropriate tiers
- Clear sequence → team có lộ trình rõ ràng

### Negative / Trade-offs

- `localePrefix: "always"` → mọi URL bắt buộc có prefix → có thể ảnh hưởng UX một số link cứng
- ZH lazy-load → first-time ZH user experience slightly slower
- VI là source → nếu EN market grow, có thể cần đảo ngược (EN là source)

### Risks Introduced

- zh.json missing keys → need robust fallback chain
- Font lazy-load ZH → potential FOUC/layout shift if not handled
- SEO migration → existing indexed URLs without locale prefix need redirect

---

## 5) Rollout Plan

- **Milestone 1 (Week 1):** VI + EN foundation
  - next-intl setup với `/vi`, `/en` routing
  - UI strings extraction (VI → EN)
  - Middleware locale detection
  - Sitemap + hreflang VI + EN

- **Milestone 2 (Week 2):** CMS Multilingual Foundation
  - Prisma i18n fields (titleEn, descEn, contentEn, v.v.)
  - BE `getLocalizedField()` helper
  - Admin CMS translate tabs

- **Milestone 3 (Week 3):** JA + KO Expansion
  - Font optimization CJK
  - JA + KO routing
  - Full translation (AI + spot review)

- **Milestone 4 (Week 4):** ZH + Performance
  - ZH lazy-load strategy
  - Performance audit từng tier
  - SEO audit 5 locale

- **Milestone 5 (Week 5):** Scale + Operations
  - Phrase/Lokalise workflow
  - Analytics per locale
  - Production hardening

---

## 6) Validation

- **KPI:** Sitemap có đủ 5 locale entries ✓ *(Milestone 1, 2, 3 — done)*
- **KPI:** Hreflang tags present cho mỗi locale ✓ *(Milestone 1 — done)*
- **KPI:** Font lazy-load đúng tier (VI/EN < 100KB, JA/KO < 2MB, ZH < 8MB) ⏳ *(pending — Milestone 3)*
- **KPI:** TTFB VI+EN < 100ms (CDN), JA+KO < 300ms (Edge), ZH < 500ms ⏳ *(pending — Milestone 4)*
- **Review date:** Sau Phase 2 complete (Week 4)

---

## 8) Implementation Status

### ✅ Phase 0 — Foundation (DONE — 2026-03-27)

**Milestone 1 — VI + EN Foundation:**
- [x] `next-intl` setup với `/vi`, `/en` routing (5 locales total)
- [x] Edge Middleware locale detection (cookie → Accept-Language → vi)
- [x] UI strings extraction: `vi.json` (211 keys), `en.json` (211 keys)
- [x] Middleware: sitemap + hreflang VI + EN
- [x] `LocaleSwitcher` component for 5 locales
- [x] `src/i18n/routing.ts`, `request.ts`, `providers.tsx`

**Milestone 2 — CMS Multilingual Foundation:**
- [x] Prisma i18n fields: `titleEn`, `titleJa`, `titleKo`, `titleZh`, `descriptionEn`, etc. on 7 models
  - Models: `Service`, `Project`, `TeamMember`, `Expertise`, `Testimonial`, `HomeSlider`, `BlogPost`
- [x] `BE getLocalizedField()` helper in `src/lib/i18n/localization.ts`
- [x] All 11 public content APIs support `?lang=vi|en|ja|ko|zh` with auto-fallback to VI
- [x] Admin CRUD routes accept i18n fields automatically (pass-through to Prisma)
- [x] Blog posts: `blog-posts/` route (DB-backed) separate from `v1/blog` (Sanity CMS)

**Milestone 3 — Public Pages Wired to DB (DONE — 2026-03-27):**
- [x] `/[locale]` (home): Hero, Stats, Services, Portfolio, Why Us, Team, Testimonials, CTA — all DB-driven
- [x] `/[locale]/about`: AboutPage namespace, story, values, CTA
- [x] `/[locale]/services`: ServicesPage namespace, service list with DB + localized fields
- [x] `/[locale]/services/[slug]`: ServiceDetailPage namespace, features, tech, related services
- [x] `/[locale]/portfolio`: PortfolioPage namespace, project cards with DB
- [x] `/[locale]/portfolio/[slug]`: ProjectDetailPage namespace, screenshots, features, results
- [x] `/[locale]/blog`: BlogPage namespace, post list with DB
- [x] `/[locale]/blog/[slug]`: Post detail with author relation, related posts
- [x] `/[locale]/team`: TeamPage namespace, member cards with DB
- [x] `/[locale]/contact`: ContactPage namespace, contact form POST /api/contact (client component)
- [x] `/[locale]/pricing`: PricingPage namespace, pricing cards + comparison table
- [x] All pages build clean (`✓ Compiled successfully`, 109 static pages)
- [x] `src/messages/` synced to `messages/` (5 locale files, 211+ keys each)

**Branch:** `feature/i18n-vi-en` (14 commits ahead of `master`)

### ⏳ Phase 1 — JA + KO Expansion (PENDING)

- [ ] Professional translation of `ja.json`, `ko.json` (AI draft → human review)
- [ ] CJK font lazy-loading: `Noto Sans JP`, `Noto Sans KR`
- [ ] JA + KO hreflang + sitemap entries
- [ ] CJK typography: line-height, font-size adjustments

### ⏳ Phase 2 — ZH + Performance (PENDING)

- [ ] Professional translation of `zh.json` (AI draft acceptable for MVP)
- [ ] `Noto Sans SC` lazy-load (~8MB)
- [ ] ZH hreflang + sitemap entries
- [ ] Performance audit per tier

### ⏳ Phase 3 — Scale + Operations (PENDING)

- [ ] Translation management workflow (Phrase/Lokalise)
- [ ] Analytics per locale
- [ ] Production hardening + runbook

---

## 7) Approval

- **PO:** [Owner]
- **FE Lead:** [Owner]
- **BE Lead:** [Owner]
- **QA Lead:** [Owner]
