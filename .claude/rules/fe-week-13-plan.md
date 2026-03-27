# FE Week 13 Plan — LOOP Solutions

> **Tuần:** Week 13
> **Mục tiêu tuần:** Hoàn tất i18n hardening + chuẩn hóa public API locale support + chốt nền tảng admin CMS translation flow.
> **Cập nhật:** 2026-03-27

---

## 1) Sprint Goal (đo được)

Trong tuần 13, đạt các kết quả bắt buộc:
1. Tất cả public API endpoints chính hỗ trợ `?lang=vi|en|ja|ko|zh`.
2. Tất cả route handler public/v1 dùng chuẩn `@/lib/api` helpers (`ok`, `notFound`, `handleError`).
3. Hoàn tất page coverage cho public i18n: Privacy, Terms, Team detail.
4. Hoàn tất CJK font lazy loading cho JA/KO/ZH.
5. Lint + type-check + build pass.

---

## 2) Scope tuần 13

## P0 (bắt buộc)
- [x] Tạo page `src/app/[locale]/privacy/page.tsx`
- [x] Tạo page `src/app/[locale]/terms/page.tsx`
- [x] Tạo page `src/app/[locale]/team/[slug]/page.tsx`
- [x] Wire pricing page vào DB (`prisma.pricingPlan`)
- [x] Add `?lang=` support cho `/api/services`, `/api/services/[slug]`
- [x] Add `?lang=` support cho `/api/projects`, `/api/projects/[slug]`
- [x] Add `?lang=` support cho `/api/team`, `/api/team/[slug]`
- [x] Add `?lang=` support cho `/api/testimonials`, `/api/expertises`
- [x] Chuẩn hóa `handleError()` cho `/api/v1/*` route handlers
- [x] Chuẩn hóa `ok()` + `handleError()` cho `/api/blog-posts`

## P1 (quan trọng)
- [x] Setup CJK font lazy loading (JP/KR/SC)
- [x] Update docs status (`I18N-STATUS.md`, `FE-BE-INTEGRATION-STATUS.md`)
- [x] Update CLAUDE.md reflect actual state

## P2 (nếu còn thời gian)
- [ ] Admin CMS translate tabs UI (Services/Portfolio/Blog/Team)
- [ ] Professional translation pipeline (JA/KO/ZH human review)

---

## 3) Kết quả thực tế tuần 13

### ✅ Done
- Public pages i18n coverage: 14/14 page routes (including privacy/terms/team/[slug]).
- Public API locale coverage: 14 endpoints support `?lang=`.
- API convention compliance: all updated routes use `@/lib/api` helpers.
- CJK font strategy implemented via `src/lib/fonts.ts` + locale-based class on layout.
- **Admin CMS translate tabs**: ServicesTab, PortfolioTab, BlogTab, MembersTab now have translate tab with EN/JA/KO/ZH per-field editing (Services: title/subtitle; Portfolio: title/tag/challenge/solution/result; Blog: title; Members: name/role/bio).
- Blog admin PUT/PATCH route updated to accept i18n fields (titleEn/Ja/Ko/Zh, contentEn/Ja/Ko/Zh).
- Member type in memberData.ts updated with i18n fields (nameEn/Ja/Ko/Zh, roleEn/Ja/Ko/Zh, bioEn/Ja/Ko/Zh).
- All 27 member seed records updated with i18n field defaults and EN baseline.
- MembersTab EMPTY_MEMBER constant updated with i18n field defaults.
- MemberFormModal added `translate` section with per-locale editing for name/role/bio.
- Quality gates pass:
  - `npm run lint`: pass (0 errors)
  - `npx tsc --noEmit`: pass (0 errors)
  - `npm run build`: pass

### ⚠️ Not Done
- Connect FE admin tabs to real BE endpoints fully (this session: ServicesTab migrated as first slice).
- Phrase/Lokalise setup.
- Professional translation review for JA/KO/ZH message files.
- Human translation review for JA/KO/ZH.

---

## 4) API checklist (final Week 13)

### Public Content APIs (localized)
- [x] `GET /api/services?lang={locale}`
- [x] `GET /api/services/[slug]?lang={locale}`
- [x] `GET /api/projects?lang={locale}`
- [x] `GET /api/projects/[slug]?lang={locale}`
- [x] `GET /api/team?lang={locale}`
- [x] `GET /api/team/[slug]?lang={locale}`
- [x] `GET /api/testimonials?lang={locale}`
- [x] `GET /api/expertises?lang={locale}`
- [x] `GET /api/blog-posts?lang={locale}`

### v1 APIs (localized)
- [x] `GET /api/v1/services?lang={locale}`
- [x] `GET /api/v1/projects?lang={locale}`
- [x] `GET /api/v1/team?lang={locale}`
- [x] `GET /api/v1/testimonials?lang={locale}`
- [x] `GET /api/v1/pricing?lang={locale}`
- [x] `GET /api/v1/blog?lang={locale}`

---

## 5) QA scenario bắt buộc (Week 13)

1. `/vi/privacy`, `/en/privacy`, `/ja/privacy`, `/ko/privacy`, `/zh/privacy` render đúng.
2. `/vi/terms` ... `/zh/terms` render đúng.
3. `/vi/team/[slug]` ... `/zh/team/[slug]` render đúng + fallback VI when missing translation.
4. `GET /api/services?lang=en` returns localized `title/description/features`.
5. `GET /api/team?lang=ja` returns localized `name/role/bio`.
6. Build pass after full integration.

---

## 6) DoD (Week 13)

- [x] All target routes implemented and buildable.
- [x] No TypeScript errors.
- [x] Public API locale contract unified.
- [x] Docs updated to actual state.

---

## 7) Plan Week 14 (đề xuất)

## P0
1. ~~Connect FE admin tabs (Services/Portfolio/Blog/Members) to real BE `/api/admin/*/[id]` endpoints~~ ✅ All 4 tabs migrated.
2. ~~Add missing i18n fields to BE admin routes where needed~~ ✅ Blog PUT route supports titleEn/Ja/Ko/Zh, contentEn/Ja/Ko/Zh.
3. ~~MembersTab `shortBioEn/Ja/Ko/Zh` and `roleEn/Ja/Ko/Zh`~~ ✅ Prisma schema has all i18n fields for TeamMember.

## P1
1. Professional translation review for `messages/ja.json`, `messages/ko.json`, `messages/zh.json`.
2. i18n runbook (`docs/I18N-RUNBOOK.md`).
3. Add missing fields to BlogTab (content textarea, publish date) — map missing BE fields.

## P2
1. Phrase/Lokalise PoC.
2. Google Search Console verify JA/KO/ZH properties.
3. FE bundle size optimization (chunk splitting for 1.9MB bundle).

---

## 8) Lệnh kiểm tra trước chốt tuần

```bash
npm run lint
npx tsc --noEmit
npm run build
```
