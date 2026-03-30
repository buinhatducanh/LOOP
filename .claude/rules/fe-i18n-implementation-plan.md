# FE i18n 5 Ngôn ngữ Implementation Plan — LOOP Solutions

> **Tuần:** Foundation → Optimization (Tuần 1–5)
> **Mục tiêu:** Triển khai i18n 5 ngôn ngữ (VI–EN–JA–KO–ZH) với hiệu suất tối ưu, SEO đầy đủ, và hạ tầng vận hành sẵn sàng mở rộng.
> **Cập nhật:** 2026-03-30

---

## 1) Sprint Goal (đo được)

Trong 5 tuần, đạt các kết quả bắt buộc:

1. Website hoạt động 5 ngôn ngữ (VI–EN–JA–KO–ZH) với URL riêng biệt `/vi`, `/en`, `/ja`, `/ko`, `/zh`.
2. Tiered loading: VI–EN pre-render, JA–KO SSR, ZH lazy-load — TTFB tối ưu theo từng tier.
3. SEO hreflang + sitemaps đầy đủ cho cả 5 ngôn ngữ.
4. CMS content (Services, Portfolio, Blog) hỗ trợ translate trên tất cả ngôn ngữ.
5. Translation workflow chuẩn hóa cho vận hành lâu dài.
6. Không làm chậm perf hiện tại (TTFB baseline < 200ms với CDN).

---

## 1b) Phase Status Tracker

| Phase | Tên | Trạng thái | Notes |
|-------|------|-----------|-------|
| **Phase 0** | Foundation | ✅ COMPLETE | next-intl routing, middleware, 5 messages files, `[locale]/` pages |
| **Phase 0.5** | BE API i18n | ✅ COMPLETE | 14 API endpoints `?lang=`, `getLocalizedField()`, `mapLocalizedService/Project/TeamMember/BlogPost` |
| **Phase 1** | JA+KO Expansion | ✅ PARTIAL | CJK fonts ✅, JA+KO+ZH messages ✅, routing ✅, **FE i18n system mới ✅ (2026-03-30)** |
| **Phase 1.5** | FE i18n System | ✅ COMPLETE | Translation JSONs 5 locale ✅, sync provider ✅, useI18n hook ✅, CJK fonts lazy-load ✅ (2026-03-30) |
| **Phase 2** | ZH Optimization | ✅ PARTIAL | ZH font ✅, ZH messages ✅, **Prisma array i18n ✅** (2026-03-30) |
| **Phase 3** | Admin CMS Translate Tabs | ✅ COMPLETE | ServicesTab/PortfolioTab/BlogTab/MembersTab translate UI ✅ |
| **Phase 4** | Scale / Ops | ⏳ PENDING | Phrase/Lokalise production, GSC verify, perf audit |

---

## 2) Phase Status chi tiết

### ✅ Phase 0 — Foundation (COMPLETE — 2026-03-24/26)

**Backend (BE):**
- [x] `src/i18n/routing.ts` — 5 locales, `localePrefix: "always"`, `defaultLocale: "vi"` ✅
- [x] `src/i18n/request.ts` — `getRequestConfig()` locale detection ✅
- [x] `src/i18n/navigation.ts` — `createNavigation()` locale-aware Link/router ✅
- [x] `src/i18n/i18n.ts` — `useLocale`, `useTranslations`, `useFormatter` ✅
- [x] `src/middleware.ts` — Edge locale routing (cookie → Accept-Language → vi) ✅
- [x] `src/messages/vi.json` — ~465 keys (Navigation, Footer, Home, Services, Portfolio, Blog, Contact, SEO) ✅
- [x] `src/messages/en.json` — ~465 keys ✅
- [x] `src/messages/ja.json` — ~465 keys ✅
- [x] `src/messages/ko.json` — ~465 keys ✅
- [x] `src/messages/zh.json` — ~465 keys ✅
- [x] `src/app/[locale]/` — 14 pages (Home, About, Services, Portfolio, Blog, Team, Contact, Pricing, Privacy, Terms, etc.) ✅
- [x] `src/lib/i18n/localization.ts` — `getLocalizedField()`, `getLocalizedArray()`, `getAllLocalizedFields()`, `parseLocaleParam()` ✅
- [x] `src/lib/i18n/missing-keys.ts` — dev-only VI↔EN key coverage checker ✅

**Frontend (FE — legacy):**
- [x] `FE/src/store/localeStore.ts` — `SUPPORTED_LOCALES`, `LOCALE_LABELS`, `LOCALE_FLAGS`, `WIZARD_STEP_LABELS ×5`, `ORDER_STATUS_LABELS ×5`, Zustand store ✅

### ✅ Phase 0.5 — BE API i18n (COMPLETE — 2026-03-27/28)

**14 API endpoints hỗ trợ `?lang=`:**
- [x] `GET /api/services` ✅
- [x] `GET /api/services/[slug]` ✅
- [x] `GET /api/projects` ✅
- [x] `GET /api/projects/[slug]` ✅
- [x] `GET /api/team` ✅
- [x] `GET /api/team/[slug]` ✅
- [x] `GET /api/testimonials` ✅
- [x] `GET /api/expertises` ✅
- [x] `GET /api/blog-posts` ✅
- [x] `GET /api/blog-posts/[slug]` ✅ (`ok()` helper applied 2026-03-30)
- [x] `GET /api/v1/services` ✅
- [x] `GET /api/v1/projects` ✅
- [x] `GET /api/v1/team` ✅
- [x] `GET /api/v1/testimonials` ✅

**Prisma i18n fields (schema.prisma):**

| Model | VI fields | EN/JA/KO/ZH fields | Status |
|-------|-----------|---------------------|--------|
| Service | title, shortDescription, longDescription, features[], technologies[] | ✅ titleEn/Ja/Ko/Zh, shortDescEn/Ja/Ko/Zh, longDescEn/Ja/Ko/Zh ✅ featuresEn/Ja/Ko/Zh[], technologiesEn/Ja/Ko/Zh[] (2026-03-30) | ✅ COMPLETE |
| Project | title, description, techStack[], features[], results | ✅ titleEn/Ja/Ko/Zh, descEn/Ja/Ko/Zh, resultsEn/Ja/Ko/Zh ✅ techStackEn/Ja/Ko/Zh[], featuresEn/Ja/Ko/Zh[] (2026-03-30) | ✅ COMPLETE |
| BlogPost | title, content, excerpt, seoTitle, seoDesc | ✅ all 5 fields × 4 locales | ✅ COMPLETE |
| TeamMember | name, role, bio, shortBio | ✅ all 4 fields × 4 locales | ✅ COMPLETE |
| Testimonial | text, role, company | ✅ all 3 fields × 4 locales | ✅ COMPLETE |
| Expertise | name, category | ✅ nameEn/Ja/Ko/Zh, categoryEn/Ja/Ko/Zh | ✅ COMPLETE |
| HomeSlider | title, subtitle | ✅ titleEn/Ja/Ko/Zh, subtitleEn/Ja/Ko/Zh | ✅ COMPLETE |
| ServicePackage | title, shortDesc | ✅ titleEn/Ja/Ko/Zh, shortDescEn/Ja/Ko/Zh | ✅ COMPLETE |

### ✅ Phase 1 — JA+KO Expansion (PARTIAL)

- [x] JA + KO routing ✅
- [x] JA + KO message files ✅
- [x] CJK font lazy-load (`Noto Sans JP`, `Noto Sans KR`) ✅
- [x] JA + KO hreflang + sitemap ✅
- [x] `mapLocalizedTeamMember()` expertise handling ✅

### ✅ Phase 1.5 — FE i18n System (NEW — COMPLETE 2026-03-30)

**Hệ thống i18n mới cho FE (Vite/React):**
- [x] `FE/src/i18n/messages/vi.json` — ~200 keys (common, navigation, footer, home, services, portfolio, team, academy, blog, contact, booking, auth, customer, admin, errors) ✅ **NEW**
- [x] `FE/src/i18n/messages/en.json` — ~200 keys ✅ **NEW**
- [x] `FE/src/i18n/messages/ja.json` — ~200 keys ✅ **NEW**
- [x] `FE/src/i18n/messages/ko.json` — ~200 keys ✅ **NEW**
- [x] `FE/src/i18n/messages/zh.json` — ~200 keys ✅ **NEW**
- [x] `FE/src/i18n/i18n.ts` — `t()`, `namespace()`, locale detection, path helpers ✅ **NEW**
- [x] `FE/src/i18n/sync.ts` — `I18nProvider`, `useI18n()` sync context, pre-loaded messages ✅ **NEW**
- [x] `FE/src/i18n/useTranslation.ts` — `useTranslation()` + `useLocale()` hooks ✅ **NEW**
- [x] `FE/src/i18n/fonts.ts` — CJK font lazy-load (JA/KO/ZH), `injectFontClasses()`, `applyLocaleFont()` ✅ **NEW**
- [x] `FE/src/i18n/index.ts` — public barrel export ✅ **NEW**
- [x] `Navbar.tsx` — hardcoded VI → `useI18n()` t() keys ✅ **UPDATED 2026-03-30**
- [x] `Footer.tsx` — hardcoded VI → `useI18n()` t() keys ✅ **UPDATED 2026-03-30**
- [x] `ds.ts` NAV_LINKS → translation key format (`navigation.home`, etc.) ✅ **UPDATED 2026-03-30**

### ✅ Phase 2 — ZH Optimization (PARTIAL)

- [x] ZH lazy SSR ✅
- [x] ZH messages ✅
- [x] Noto Sans SC font ✅
- [x] `FE/src/i18n/fonts.ts` — ZH font lazy-load ✅

### ✅ Phase 3 — Admin CMS Translate Tabs (COMPLETE — Week 13)

- [x] ServicesTab translate tab (EN/JA/KO/ZH per-field) ✅
- [x] PortfolioTab translate tab ✅
- [x] BlogTab translate tab ✅
- [x] MembersTab translate tab ✅

### ⏳ Phase 4 — Scale / Ops (PENDING)

- [ ] Phrase/Lokalise production wiring → CI/CD
- [ ] Google Search Console verify JA/KO/ZH properties
- [ ] Performance audit (TTFB per locale tier)
- [ ] SEO audit (Screaming Frog hreflang)
- [ ] Translation lint in CI (missing-keys.ts → pre-build step)
- [ ] JA/KO/ZH professional human QA
- [ ] FE pages remaining to migrate: `LandingPage`, `ServicesPage`, `PortfolioPage`, `AcademyPage`, `BookingWizardPage`, `AuthPage`, `ContactPage`, `CustomerDashboard`, `AdminDashboard`

---

## 3) Các thay đổi Schema mới (2026-03-30)

**Migration cần tạo:**
```bash
cd d:/LOOP_COMPANY/LOOP
npx prisma migrate dev --name add_i18n_array_fields
```

**Fields mới đã thêm vào schema.prisma:**

```
Service:
  featuresEn     String[]  @map("features_en")
  featuresJa     String[]  @map("features_ja")
  featuresKo     String[]  @map("features_ko")
  featuresZh     String[]  @map("features_zh")
  technologiesEn String[]  @map("technologies_en")
  technologiesJa String[]  @map("technologies_ja")
  technologiesKo String[]  @map("technologies_ko")
  technologiesZh String[]  @map("technologies_zh")

Project:
  techStackEn   String[]  @map("tech_stack_en")
  techStackJa  String[]  @map("tech_stack_ja")
  techStackKo  String[]  @map("tech_stack_ko")
  techStackZh  String[]  @map("tech_stack_zh")
  featuresEn    String[]  @map("features_en")
  featuresJa   String[]  @map("features_ja")
  featuresKo   String[]  @map("features_ko")
  featuresZh   String[]  @map("features_zh")
```

**`getLocalizedArray()` tự động handle fields mới** — không cần sửa helper.

---

## 4) Các file mới / thay đổi (2026-03-30)

### File mới (FE i18n system)
```
FE/src/i18n/
  messages/vi.json        (~200 keys, 5 namespaces)
  messages/en.json        (~200 keys)
  messages/ja.json        (~200 keys)
  messages/ko.json        (~200 keys)
  messages/zh.json        (~200 keys)
  i18n.ts               (async t, namespace, locale utils)
  sync.ts               (I18nProvider, useI18n sync context)
  useTranslation.ts      (useTranslation, useLocale hooks)
  fonts.ts              (CJK lazy-load, applyLocaleFont)
  index.ts              (public barrel export)
```

### File thay đổi (FE)
```
FE/src/app/components/layout/Navbar.tsx      (hardcoded VI → useI18n t())
FE/src/app/components/layout/Footer.tsx    (hardcoded VI → useI18n t())
FE/src/app/components/layout/ds.ts         (NAV_LINKS → translation key format)
FE/src/app/store/localeStore.ts          (giữ nguyên, làm source of truth cho locale)
```

### File thay đổi (BE)
```
prisma/schema.prisma                     (+featuresEn/Ja/Ko/Zh[], technologiesEn/Ja/Ko/Zh[] for Service; +techStackEn/Ja/Ko/Zh[], featuresEn/Ja/Ko/Zh[] for Project)
src/app/api/blog-posts/[slug]/route.ts   (raw NextResponse → ok() helper)
```

---

## 5) Remaining Work — FE Pages i18n Migration

Sau khi hệ thống i18n đã setup, các pages cần migrate hardcoded strings:

| Page | Hardcoded strings | Priority | Status |
|------|-----------------|----------|--------|
| LandingPage.tsx | Hero, sections, CTA | P0 | ⏳ |
| ServicesPage.tsx | Page title, empty state | P1 | ⏳ |
| PortfolioPage.tsx | Page title, filter labels | P1 | ⏳ |
| AcademyPage.tsx | Course labels, instructor | P1 | ⏳ |
| BookingWizardPage.tsx | Step labels, extras (WIZARD_STEP_LABELS đã có) | P2 | ⏳ |
| ContactPage.tsx | Form labels, validation | P2 | ⏳ |
| CustomerDashboard.tsx | Tab labels, status labels (ORDER_STATUS_LABELS đã có) | P2 | ⏳ |
| AdminDashboard.tsx | Tab labels | P2 | ⏳ |

---

## 6) Lệnh kiểm tra

```bash
# 1. Verify BE build
cd d:/LOOP_COMPANY/LOOP
npx tsc --noEmit

# 2. Run migration
npx prisma migrate dev --name add_i18n_array_fields

# 3. Verify API locale endpoints
curl "http://localhost:3000/api/services?lang=en"
curl "http://localhost:3000/api/projects?lang=ja"
curl "http://localhost:3000/api/team?lang=ko"

# 4. FE type check
cd d:/LOOP_COMPANY/LOOP/FE
npx tsc --noEmit

# 5. FE build
npm run build

# 6. Missing translation keys check (dev)
cd d:/LOOP_COMPANY/LOOP
npx tsx src/i18n/missing-keys.ts
```

---

## 7) Phase 0 cũ — Phase Status Tracker (legacy, for reference)

### Phase 0 — Foundation (Tuần 1–2)
Thiết lập nền tảng i18n với 2 ngôn ngữ đầu tiên (VI + EN).

### Phase 1 — Expansion (Tuần 3)
Thêm Japanese + Korean, tối ưu font CJK, CMS multilingual fields.

### Phase 2 — Optimization (Tuần 4)
Thêm Chinese (lazy load), tối ưu perf từng tier, audit SEO.

### Phase 3 — Scale (Tuần 5)
Translation management workflow, analytics per locale, hardening production.

---

## 8) Scope chi tiết theo Giai đoạn (cũ — để reference)

### Phase 0 — Foundation (Tuần 1–2)

#### P0 (bắt buộc)
- [ ] Setup `next-intl` với cấu trúc routing `/vi`, `/en`.
- [ ] Cấu hình Edge Middleware (middleware.ts) locale detection + redirect.
- [ ] Chuyển toàn bộ static UI strings (label, nav, button, error, validation) sang `src/messages/vi.json` và `src/messages/en.json`.
- [ ] Tái cấu trúc `app/[locale]/` folder — thay thế hard-coded strings bằng `useTranslations()`.
- [ ] Locale-aware root layout và metadata với hreflang tags.
- [ ] Sitemap động cho VI + EN.
- [ ] `robots.ts` locale-aware.
- [ ] Lint + type-check + build pass cho cả 2 locale.

#### P1 (quan trọng)
- [ ] Locale switcher UI component (dropdown/flags) — persistent qua cookie.
- [ ] Fallback translation helper cho missing keys (ko crash khi thiếu key).
- [ ] Validate tất cả page render đúng locale (không leak string từ locale khác).

#### P2 (nếu còn thời gian)
- [ ] Prefetch next-locale data khi hover locale switcher.

---

### Phase 1 — Expansion (Tuần 3)

#### P0 (bắt buộc)
- [ ] Thêm Japanese (`ja`) và Korean (`ko`) vào routing.
- [ ] Tạo `src/messages/ja.json` và `src/messages/ko.json` — translate tất cả UI strings.
- [ ] Font optimization: lazy load `Noto Sans JP` và `Noto Sans KR` (chỉ load khi locale = ja/ko).
- [ ] SSR setup cho JA + KO (không pre-render — giảm bundle size).
- [ ] Cập nhật sitemap cho JA + KO.
- [ ] Cập nhật hreflang tags thêm ja + ko.
- [ ] Prisma schema: bổ sung translated fields cho `Service`, `Project`, `BlogPost` (titleEn, titleJa, titleKo, descEn, descJa, descKo, contentEn, contentJa, contentKo, v.v.).

#### P1 (quan trọng)
- [x] Admin CMS: translate interface cho Services / Portfolio / Blog / Members (per-field translation) ✅ done (Week 13).
- [x] `getLocalizedField()` helper trong BE — fallback tự động sang Việt khi field chưa translate ✅ done (Phase 0).
- [x] API endpoint list/detail: hỗ trợ `?lang=xx` query param → trả đúng localized content ✅ done (Week 13, 14 endpoints).

#### P2 (nếu còn thời gian)
- [ ] Cải thiện locale switcher với flag icons + language names native.

---

### Phase 2 — Optimization (Tuần 4)

#### P0 (bắt buộc)
- [ ] Thêm Chinese (`zh`) vào routing với lazy load strategy.
- [ ] Tạo `src/messages/zh.json` — translate tất cả UI strings.
- [ ] Font optimization: lazy load `Noto Sans SC` (chỉ khi user chọn ZH, ~8MB savings nếu không dùng).
- [ ] Cập nhật sitemap cho ZH.
- [ ] Cập nhật hreflang tags thêm zh.
- [ ] Tối ưu bundle size từng tier — verify không có locale strings thừa load trong bundle sai tier.

#### P1 (quan trọng)
- [ ] Performance audit: đo TTFB/LCP từng locale từ Vercel Edge.
- [ ] SEO audit: test hreflang, canonical, x-robot tags cho cả 5 locale.
- [ ] Validate tất cả page 5 locale render đúng — known issues log.

#### P2 (nếu còn thời gian)
- [ ] Resource hints (`<link rel="preload">`) cho locale strings tier-1.

---

### Phase 3 — Scale (Tuần 5)

#### P0 (bắt buộc)
- [ ] Tích hợp translation management tool (Phrase hoặc Lokalise) — workflow chuẩn hóa.
- [ ] Google Search Console: verify property cho 5 locale market.
- [ ] Analytics setup: track page views + conversions theo locale.
- [ ] QA regression: full smoke test 5 ngôn ngữ trên staging.
- [ ] Production deployment + post-deploy smoke.
- [ ] Runbook vận hành: cách thêm ngôn ngữ mới, cách update translation, cách handle missing translation.

#### P1 (quan trọng)
- [ ] Backup translation JSON → Git / translation tool sync workflow.
- [ ] Monitoring: error rate per locale, translation missing rate.
- [ ] Documentation: i18n architecture + glossary cho 5 ngôn ngữ.

#### P2 (nếu còn thời gian)
- [ ] Per-locale A/B testing baseline (language as variant).
- [ ] Auto-translate draft workflow (DeepL/Google Translate → human review).

---

## 4) Phân rã Task theo Ngày

### Phase 0 — Tuần 1 (Foundation Start)

#### Day 1 — Setup + Routing
- [ ] Install `next-intl` + dependencies.
- [ ] Tạo `src/i18n/routing.ts` — define 5 locales.
- [ ] Tạo `src/i18n/request.ts` — server-side locale detection.
- [ ] Tạo `src/i18n/providers.tsx` — client providers.
- [ ] Cấu hình `next.config.ts` với `i18n` plugin.
- [ ] Viết `middleware.ts` — Edge locale routing.
- [ ] **Output:** Locale routing hoạt động, request `/vi/about` và `/en/about` resolve đúng.

#### Day 2 — Message Files + Structure
- [ ] Tạo `src/messages/vi.json` + `src/messages/en.json` skeleton (flattened key structure).
- [ ] Thiết lập cấu trúc JSON keys chuẩn: `nav.*`, `home.*`, `services.*`, `portfolio.*`, `blog.*`, `contact.*`, `common.*`, `errors.*`, `seo.*`.
- [ ] Extract 100% hard-coded strings từ `src/app/[locale]/layout.tsx`.
- [ ] Tái cấu trúc `src/app/` → `src/app/[locale]/` (nếu chưa có).
- [ ] **Output:** Cấu trúc message files sẵn sàng translate.

#### Day 3 — Replace Hard-coded Strings (Part 1)
- [ ] Thay `useTranslations()` cho Navigation + Footer components.
- [ ] Thay `useTranslations()` cho Home page.
- [ ] Thay `useTranslations()` cho About page.
- [ ] Thay `useTranslations()` cho Contact page.
- [ ] **Output:** 4 page/component không còn hard-coded strings.

#### Day 4 — Replace Hard-coded Strings (Part 2)
- [ ] Thay `useTranslations()` cho Services list + detail.
- [ ] Thay `useTranslations()` cho Portfolio list + detail.
- [ ] Thay `useTranslations()` cho Blog list + detail.
- [ ] Thay `useTranslations()` cho Team page.
- [ ] Thay `useTranslations()` cho Pricing page.
- [ ] **Output:** Tất cả public pages không còn hard-coded strings.

#### Day 5 — SEO + Sitemap + Hardening (Phase 0 end)
- [ ] Metadata với hreflang tags trong root layout.
- [ ] Tạo `app/sitemap.ts` locale-aware cho VI + EN.
- [ ] Update `app/robots.ts` locale-aware.
- [ ] Test locale switcher: switch VI → EN → lưu cookie → revisit → giữ đúng.
- [ ] QA smoke: kiểm tra 10 page/key scenarios cả VI + EN.
- [ ] Chạy lint + type-check + build.
- [ ] **Output:** Phase 0 candidate, 2 locale hoạt động production-ready.

---

### Phase 0 — Tuần 2 (CMS Multilingual Foundation)

#### Day 1 — Prisma Schema Update
- [ ] Backup production schema.
- [ ] Thêm translated fields cho `Service` (titleEn, descEn, contentEn, v.v.).
- [ ] Thêm translated fields cho `Project` (titleEn, descEn, contentEn, v.v.).
- [ ] Thêm translated fields cho `BlogPost` (titleEn, descEn, contentEn, v.v.).
- [ ] Thêm translated fields cho `TeamMember` (nameEn, bioEn, v.v.).
- [ ] Thêm translated fields cho `HomeSlider` (titleEn, subtitleEn, v.v.).
- [ ] Chạy `npx prisma migrate dev --name add_i18n_fields`.
- [ ] **Output:** Schema hỗ trợ đa ngôn ngữ.

#### Day 2 — Backend Helpers + API Update
- [ ] Tạo `src/lib/i18n/content.ts` — `getLocalizedField()` helper với auto-fallback.
- [ ] Update `src/lib/api/services.ts` — `list()` + `getBySlug()` hỗ trợ `?lang=xx`.
- [ ] Update `src/lib/api/projects.ts` — `list()` + `getBySlug()` hỗ trợ `?lang=xx`.
- [ ] Update blog API endpoints tương tự.
- [ ] **Output:** API trả localized content đúng theo locale param.

#### Day 3 — Admin CMS Translation UI
- [ ] Admin Services: tab translate (5 ngôn ngữ) cho title + desc + content.
- [ ] Admin Portfolio: tab translate cho title + desc + content + metadata.
- [ ] Admin Blog: tab translate cho title + desc + content + seo.
- [ ] Admin Team: tab translate cho name + bio + role.
- [ ] **Output:** Admin cho phép translate content không cần code.

#### Day 4 — Locale in API + API Docs
- [ ] Verify all v1 API endpoints trả đúng localized fields theo `Accept-Language` header hoặc `?lang=` param.
- [ ] Cập nhật `docs/API-CONTRACT.md` — ghi rõ i18n params cho từng endpoint.
- [ ] Cập nhật `docs/API-I18N.md` (tạo mới) — documentation cho i18n API convention.
- [ ] **Output:** Contract rõ ràng cho FE integration.

#### Day 5 — Integration + Hardening (Phase 0 Final)
- [ ] FE: services/portfolio/blog list/detail dùng `?lang=` param từ current locale.
- [ ] Test fallback: locale = en, nhưng contentEn = null → fallback hiển thị contentVi.
- [ ] QA smoke 5-locale trên staging.
- [ ] Lint + type-check + build.
- [ ] **Output:** Phase 0 complete — i18n foundation hoàn chỉnh.

---

### Phase 1 — Tuần 3 (JA + KO Expansion)

#### Day 1 — JA + KO Setup
- [ ] Thêm `ja`, `ko` vào `routing.ts`.
- [ ] Tạo `src/messages/ja.json` (copy EN → JA translate).
- [ ] Tạo `src/messages/ko.json` (copy EN → KO translate).
- [ ] Update middleware: `localePrefix: "always"` cho 5 locales.
- [ ] **Output:** 5 locales recognized trong routing.

#### Day 2 — Font Optimization CJK
- [ ] Setup `next/font` với `Noto_Sans_JP` + `Noto_Sans_KR`.
- [ ] Lazy load: JA font chỉ load khi locale = ja, KO font chỉ load khi locale = ko.
- [ ] Verify font subset: chỉ load JP/KR glyphs cần thiết (không full CJK).
- [ ] Performance check: font size JA + KO < 2MB mỗi locale.
- [ ] **Output:** Font CJK tối ưu, không ảnh hưởng VI/EN perf.

#### Day 3 — JA + KO UI Translation
- [ ] Review + verify tất cả UI strings đã translate JA + KO.
- [ ] Verify Japanese typography: line-height, font-size phù hợp CJK content.
- [ ] Verify Korean typography tương tự.
- [ ] Test layout breaks với CJK characters (longer/ shorter text).
- [ ] **Output:** UI JA + KO chuẩn typography.

#### Day 4 — CMS JA + KO Content Fields
- [ ] Admin: verify translate tabs hoạt động cho JA + KO (Services, Portfolio, Blog).
- [ ] Backend: `getLocalizedField()` hỗ trợ ja + ko.
- [ ] Test: set locale = ja, contentJa = null → fallback contentVi → pass.
- [ ] Update sitemap + robots cho JA + KO.
- [ ] **Output:** CMS content JA + KO hoạt động.

#### Day 5 — JA + KO SEO + QA (Phase 1 End)
- [ ] Update hreflang tags: thêm `ja`, `ko`.
- [ ] Update sitemap: thêm 5-locale sitemap entries.
- [ ] Google Search Console: verify JA + KO property.
- [ ] QA smoke 5-locale: VI/EN/JA/KO/ZH trên staging.
- [ ] Lint + type-check + build.
- [ ] **Output:** Phase 1 complete.

---

### Phase 2 — Tuần 4 (ZH + Performance Optimization)

#### Day 1 — ZH Lazy Load Setup
- [ ] Thêm `zh` vào routing (đảm bảo lazy load strategy).
- [ ] Tạo `src/messages/zh.json` (copy EN → ZH translate).
- [ ] Setup `Noto_Sans_SC` lazy load: chỉ load khi locale = zh.
- [ ] Verify ZH font ~8MB — confirm lazy strategy đúng (không load khi ở VI/EN/JA/KO).
- [ ] **Output:** ZH lazy-loaded, không ảnh hưởng perf 4 locale khác.

#### Day 2 — ZH UI + CMS + SEO
- [ ] Verify tất cả UI strings đã translate ZH.
- [ ] Verify ZH typography (font-size, line-height cho Simplified Chinese).
- [ ] Admin: verify translate tabs ZH hoạt động.
- [ ] Update sitemap + hreflang + robots cho ZH.
- [ ] **Output:** ZH hoàn chỉnh.

#### Day 3 — Performance Audit
- [ ] Measure TTFB cho VI/EN (pre-render): mục tiêu < 100ms từ CDN.
- [ ] Measure TTFB cho JA/KO (SSR): mục tiêu < 300ms từ Edge.
- [ ] Measure TTFB cho ZH (lazy SSR): mục tiêu < 500ms lần đầu.
- [ ] Measure bundle size per locale (phát hiện leak).
- [ ] Lighthouse audit cho VI + EN (target: Performance > 90).
- [ ] **Output:** Baseline perf metrics + issue list.

#### Day 4 — Performance Fixes
- [ ] Fix bundle leak (locale strings load nhầm tier).
- [ ] Tối ưu font loading strategy (preload VI/EN fonts).
- [ ] Tối ưu next-intl config: đảm bảo không load 5 locale files cùng lúc.
- [ ] Re-measure perf metrics.
- [ ] **Output:** Perf达标 cho tất cả tier.

#### Day 5 — SEO Audit + Hardening (Phase 2 End)
- [ ] Full SEO audit: hreflang, canonical, sitemap, robots cho 5 locale.
- [ ] Test: Googlebot nhận đúng localized content cho từng locale.
- [ ] Verify locale switcher: VI → EN → JA → KO → ZH → quay lại VI (cookie persistence).
- [ ] QA full smoke 5-locale.
- [ ] Lint + type-check + build.
- [ ] **Output:** Phase 2 complete — 5 locale production-ready.

---

### Phase 3 — Tuần 5 (Scale + Operations)

#### Day 1 — Translation Management Setup
- [ ] Setup Phrase hoặc Lokalise project.
- [ ] Import existing `vi.json` + `en.json` as source.
- [ ] Cấu hình translation workflow: source (VI) → target (EN/JA/KO/ZH).
- [ ] Thiết lập human review gate trước khi production sync.
- [ ] Setup Phrase CLI / GitHub Action: auto-sync translation khi update JSON.
- [ ] **Output:** Translation management sẵn sàng.

#### Day 2 — Analytics + Monitoring
- [ ] Setup Google Analytics (GA4) với locale dimension.
- [ ] Track page views per locale.
- [ ] Track conversion events per locale.
- [ ] Setup Vercel Analytics: verify per-locale performance dashboard.
- [ ] Tạo translation quality monitor: count missing keys per locale.
- [ ] **Output:** Observability đầy đủ per locale.

#### Day 3 — Operations Runbook
- [ ] Viết `docs/I18N-RUNBOOK.md`:
  - Cách thêm ngôn ngữ mới (step-by-step).
  - Cách update translation (workflow).
  - Cách xử lý missing translation (fallback + hotfix).
  - Cách monitor translation quality.
  - Glossary cho 5 ngôn ngữ (key terms).
- [ ] QA: team member mới follow runbook thêm ngôn ngữ thứ 6 (thử) → pass.
- [ ] **Output:** Documentation hoàn chỉnh.

#### Day 4 — Regression + Bug Fix
- [ ] Full regression: auth flow VI/EN/JA/KO/ZH.
- [ ] Full regression: booking wizard VI/EN/JA/KO/ZH.
- [ ] Full regression: admin CMS translate VI/EN/JA/KO/ZH.
- [ ] Fix bugs phát hiện.
- [ ] **Output:** Regression pass, zero blocker bugs.

#### Day 5 — Go/No-Go + Production Deploy (Phase 3 End)
- [ ] Final lint + type-check + build.
- [ ] Go/No-Go review với PO + Tech Lead.
- [ ] Production deployment.
- [ ] Post-deploy smoke: 5 locale trên production.
- [ ] Thông báo stakeholders + update status report.
- [ ] Retro: capture learnings + action items.
- [ ] **Output:** 5-locale website live production.

---

## 5) API / Endpoint Checklist

### i18n Infrastructure APIs
- [ ] `GET /api/i18n/config` — danh sách supported locales + active status
- [ ] `GET /api/i18n/translations/{locale}` — lazy load translation JSON (cho ZH)

### Content APIs (update existing)
- [ ] `GET /api/v1/services?lang={locale}` — localized service list
- [ ] `GET /api/v1/services/[slug]?lang={locale}` — localized service detail
- [ ] `GET /api/v1/projects?lang={locale}` — localized project list
- [ ] `GET /api/v1/projects/[slug]?lang={locale}` — localized project detail
- [ ] `GET /api/blog-posts?lang={locale}` — localized blog list
- [ ] `GET /api/blog-posts/[id|slug]?lang={locale}` — localized blog detail
- [ ] `GET /api/team?lang={locale}` — localized team list

### Admin CMS APIs (update existing)
- [ ] `POST/PUT /api/admin/services/[id]` — save translated fields (titleEn, titleJa, titleKo, titleZh, v.v.)
- [ ] `POST/PUT /api/admin/projects/[id]` — save translated fields
- [ ] `POST/PUT /api/admin/blog-posts/[id]` — save translated fields
- [ ] `POST/PUT /api/admin/team/[id]` — save translated fields

### SEO APIs
- [ ] `GET /sitemap.{locale}.xml` — per-locale sitemap (hoặc single sitemap với locale tags)

---

## 6) QA Scenarios bắt buộc

### QA-01: Locale Routing
- VI → `/vi/about` → render tiếng Việt
- EN → `/en/about` → render English
- JA → `/ja/about` → render 日本語
- KO → `/ko/about` → render 한국어
- ZH → `/zh/about` → render 中文

### QA-02: Locale Switcher Persistence
1. Mở `/vi/services`
2. Click switcher → chọn English
3. Redirect → `/en/services`
4. Đóng tab
5. Mở lại `/` (root)
6. Redirect → `/en` (giữ đúng locale)
7. ✅ Pass

### QA-03: Fallback Content
1. Set locale = `en`
2. Mở blog post có `contentEn = null`, `contentVi = "Vietnamese content"`
3. ✅ Hiển thị Vietnamese content (fallback)
4. Set locale = `en` với contentEn có giá trị
5. ✅ Hiển thị English content

### QA-04: SEO hreflang
1. Inspect `/vi/about` → `<link rel="alternate" hreflang="vi" href=".../vi/about">` tồn tại
2. Inspect `/vi/about` → `<link rel="alternate" hreflang="en" href=".../en/about">` tồn tại
3. Tương tự cho JA, KO, ZH
4. ✅ hreflang tags đầy đủ

### QA-05: Font Loading
1. Mở `/vi/about` → Noto Sans VI load < 100KB
2. Mở `/ja/about` → Noto Sans JP load < 2MB (lazy)
3. Mở `/zh/about` → Noto Sans SC load < 8MB (lazy)
4. Không mở ZH → font ZH không load ở VI/EN/JA/KO pages
5. ✅ Font lazy load đúng

### QA-06: CMS Translate
1. Login admin → Services → chọn service
2. Tab Translate → điền title + desc cho EN, JA, KO, ZH
3. Save
4. Reload page (EN locale) → hiển thị English translation
5. Switch to ZH → hiển thị Chinese translation
6. ✅ CMS translate hoạt động

### QA-07: Performance
1. VI → `/vi` → TTFB < 100ms (CDN cached)
2. JA → `/ja` → TTFB < 300ms (Edge SSR)
3. ZH lần đầu → TTFB < 500ms
4. Lighthouse VI → Performance score > 90
5. ✅ Performance tier đạt

---

## 7) Definition of Done (Toàn bộ Project)

- [ ] 5 ngôn ngữ hoạt động (VI/EN/JA/KO/ZH) — routing, UI, content, SEO.
- [ ] Tiered loading: VI+EN pre-render, JA+KO SSR, ZH lazy — đúng spec.
- [ ] Font optimization: không load CJK font nặng cho non-CJK locale.
- [ ] SEO: hreflang + sitemap + robots đầy đủ cho 5 locale.
- [ ] CMS: admin translate UI cho Services/Portfolio/Blog/Team — đầy đủ 5 ngôn ngữ.
- [ ] API: `?lang=` param hoạt động cho toàn bộ content endpoints.
- [ ] Fallback: content chưa translate tự động fallback về Việt Nam.
- [ ] Translation management: Phrase/Lokalise workflow setup.
- [ ] Performance: TTFB + Lighthouse đạt tier targets.
- [ ] Lint + type-check + build pass.
- [ ] QA smoke 5-locale pass — zero blocker bug.
- [ ] Runbook `docs/I18N-RUNBOOK.md` hoàn chỉnh.
- [ ] Sẵn sàng thêm ngôn ngữ thứ 6+ mà không cần refactor lớn.

---

## 8) Rủi ro & Phương án

| ID | Rủi ro | Impact | Prob | Score | Mitigation | Owner | ETA |
|----|--------|--------|------|-------|-----------|-------|-----|
| R-I18N-01 | Dịch UI strings cho 4 ngôn ngữ mới mất thời gian (20K+ keys) | 3 | 3 | 9 | Sử dụng AI translation (DeepL) làm draft → human review; ưu tiên JA+KO trước ZH | FE Lead + Translator | Day 1 Phase 1 |
| R-I18N-02 | Font CJK (ZH ~8MB) gây chậm perf nếu load sai strategy | 3 | 2 | 6 | Lazy load bắt buộc; verify với WebPageTest trước khi merge | FE Lead | Day 1 Phase 2 |
| R-I18N-03 | Prisma migration schema lớn (5 ngôn ngữ × N models) ảnh hưởng production | 3 | 2 | 6 | Migration trên staging trước; backup DB; rollback plan sẵn sàng | BE Lead | Day 1 Phase 0 W2 |
| R-I18N-04 | hreflang misconfiguration → SEO duplicate content penalty | 2 | 2 | 4 | Audit hreflang với Screaming Frog sau Phase 2; fix trước production | SEO | Day 5 Phase 2 |
| R-I18N-05 | Locale switcher không persist đúng (cookie/server component) | 2 | 2 | 4 | Test persistence flow ngày Day 5 Phase 0; edge case: first visit vs return visit | FE | Day 5 Phase 0 |
| R-I18N-06 | Bundle size tăng vì import nhầm 5 locale files cùng lúc | 2 | 2 | 4 | Verify bundle analyzer sau Phase 1; CI fail nếu bundle > threshold | FE Lead | Day 5 Phase 1 |

---

## 9) Dependencies & Prerequisites

### Trước khi bắt đầu (Phase 0 Day 1)

- [ ] **Design:** Duyệt translation key structure với team (số lượng keys ước tính).
- [ ] **Translation vendor:** Ký hợp đồng translation agency hoặc setup DeepL API account.
- [ ] **Phrase/Lokalise:** Trial account setup (dùng trial cho Week 5).
- [ ] **Prisma access:** Backup production DB trước migration Phase 0 Week 2.
- [ ] **SEO:** Google Search Console admin access cho 5 locale properties.
- [ ] **Font licenses:** Verify Noto Sans licenses (Apache 2.0 — miễn phí) cho tất cả ngôn ngữ.
- [ ] **Performance baseline:** Đo TTFB/LCP hiện tại làm benchmark.

### Giao tiếp liên team

| Giai đoạn | Cần gì từ đâu | Deadline |
|-----------|---------------|---------|
| Phase 0 | Design duyệt key structure | Day 1 |
| Phase 0 | Translation vendor (EN strings) | Day 3 |
| Phase 1 | JA + KO translation (2 ngôn ngữ) | Day 3 Phase 1 |
| Phase 1 | Font files optimized ready | Day 2 Phase 1 |
| Phase 2 | ZH translation | Day 2 Phase 2 |
| Phase 3 | Phrase/Lokalise setup | Day 1 Phase 3 |

---

## 10) Resource & Effort Estimate

| Giai đoạn | FE effort | BE effort | Design | Translation | QA |
|-----------|-----------|-----------|--------|-------------|-----|
| Phase 0 (W1) | 4 days | 0.5 days | 0.5 days | 0 | 1 day |
| Phase 0 (W2) | 1 day | 3 days | 0 | 0 | 1 day |
| Phase 1 (W3) | 3 days | 0.5 days | 0 | 2 days (JA+KO) | 1.5 days |
| Phase 2 (W4) | 2 days | 0.5 days | 0 | 1 day (ZH) | 1.5 days |
| Phase 3 (W5) | 1.5 days | 0.5 days | 0 | 0.5 days | 1.5 days |
| **Tổng** | **~11.5 days FE** | **~5 days BE** | **~0.5 days** | **~3.5 days** | **~6.5 days** |

**Total: ~27 person-days**

---

## 11) Lệnh kiểm tra nhanh (chạy mỗi giai đoạn)

```bash
# 1. Lint
npm run lint

# 2. Type check
npx tsc --noEmit

# 3. Build
npm run build

# 4. Kiểm tra bundle size (nếu có bundle analyzer)
npm run analyze  # nếu có

# 5. Smoke test locale routing
curl -I https://staging.loop.com/vi/about
curl -I https://staging.loop.com/en/about
curl -I https://staging.loop.com/ja/about
curl -I https://staging.loop.com/ko/about
curl -I https://staging.loop.com/zh/about

# 6. Verify hreflang
curl -s https://staging.loop.com/vi/about | grep "hreflang"

# 7. Check missing translation keys (next-intl)
npx next-intl-verify --locale en
```

---

## 12) Báo cáo cuối tuần (template per week)

```
## Week XX Status Report — i18n Implementation

### Phase: [Phase X]
### Overall Status: [on_track | at_risk | delayed]

**Done tuần này:**
-
-

**Not done:**
-
-

**Blockers:**
-
-

**Bugs phát hiện:**
-
-

**Perf metrics tuần này:**
- VI TTFB: ...ms (baseline: ...ms)
- EN TTFB: ...ms
- JA TTFB: ...ms
- KO TTFB: ...ms
- ZH TTFB: ...ms
- Lighthouse VI: ... (baseline: ...)

**Translation progress:**
- VI: 100% | EN: ...% | JA: ...% | KO: ...% | ZH: ...%

**Plan tuần kế tiếp:**
1.
2.
3.
```

---

## 13) Các File cần tạo mới / cập nhật

### File tạo mới
```
src/i18n/routing.ts
src/i18n/request.ts
src/i18n/providers.tsx
src/messages/vi.json
src/messages/en.json
src/messages/ja.json
src/messages/ko.json
src/messages/zh.json
src/middleware.ts
src/app/[locale]/layout.tsx          # cập nhật từ root layout
docs/I18N-RUNBOOK.md
docs/API-I18N.md
```

### File cập nhật
```
prisma/schema.prisma                  # + i18n fields
src/app/layout.tsx                    # locale-aware root
src/app/sitemap.ts                    # 5-locale sitemap
src/app/robots.ts                     # locale-aware robots
docs/API-CONTRACT.md                  # + i18n params
docs/PERMISSION-MATRIX.md             # admin i18n permissions
```

---

## 14) Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| TTFB VI+EN (pre-render) | < 100ms (CDN) | Vercel Analytics |
| TTFB JA+KO (SSR) | < 300ms | Vercel Analytics |
| TTFB ZH (lazy SSR) | < 500ms | Vercel Analytics |
| Lighthouse Performance (VI) | >= 90 | Lighthouse CI |
| Bundle size VI+EN | < baseline | Bundle analyzer |
| Bundle size JA/KO/ZH | < VI+EN baseline | Bundle analyzer |
| Translation coverage UI | 100% (5 locales) | next-intl verify |
| Translation coverage CMS | 100% (5 locales) | Admin QA |
| SEO hreflang | 100% pages, 5 locales | Screaming Frog |
| Go-live | Week 5 Friday | Production deploy |

---

## 15) Liên kết

- `docs/API-CONTRACT.md` — cập nhật i18n params
- `docs/I18N-RUNBOOK.md` — (tạo mới) operations guide
- `docs/API-I18N.md` — (tạo mới) i18n API conventions
- `.claude/rules/fe-delivery-process.md` — delivery process chuẩn
- `.claude/rules/fe-release-checklist.md` — release checklist
- `.claude/rules/fe-testing-playbook.md` — testing strategy
