# I18N Seeding Strategy — Production Implementation Plan
**Status:** Phase 0 ✅ COMPLETE
**Last Updated:** 2026-04-01
**Owner:** Engineering Team
**Stakeholders:** PM, Content Team, External Translators

---

## Phase 0 — Hotfix (✅ COMPLETED 2026-04-01)

### Tasks Done

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Add 8 i18n fields to Course model | ✅ Done | `titleEn`, `titleJa`, `titleKo`, `titleZh`, `descriptionEn`, `descriptionJa`, `descriptionKo`, `descriptionZh` |
| 0.2 | `prisma db push` to sync schema to Neon DB | ✅ Done | |
| 0.3 | Update `seedAcademy()` to write EN/JA/KO/ZH fields | ✅ Done | All 7 courses seeded with all 5 locales |
| 0.4 | `prisma generate` (Prisma Client rebuild) | ✅ Done | Required after schema change |
| 0.5 | Run seed, verify `titleEn` populated | ✅ Done | 7/7 courses have all i18n fields |
| 0.6 | Verify BE API serves correct locale | ✅ Done | `lang=en` → EN title, `lang=vi` → VI title, all 5 locales work |
| 0.7 | Fix `title` base field = VI | ✅ Done | Was EN (wrong) — swapped to VI for 6 courses |
| 0.8 | TypeScript check BE + FE | ✅ Done | 0 errors both |

### Verification Results

```
GET /api/v1/courses?lang=vi  → VI title (e.g., "React & Next.js 14 Từ Zero Đến Hero")
GET /api/v1/courses?lang=en  → EN title (e.g., "React & Next.js 14: Zero to Production Hero")
GET /api/v1/courses?lang=ja  → JA title (e.g., "React & Next.js 14：ゼロからプロダクションヒーローへ")
GET /api/v1/courses?lang=ko  → KO title (e.g., "React & Next.js 14: 제로에서 프로덕션 히어로까지")
GET /api/v1/courses?lang=zh  → ZH title (e.g., "React & Next.js 14：从零到生产级专家")
```

### Files Modified

- `prisma/schema.prisma` — +8 i18n fields on `Course` model
- `prisma/seed.ts` — `seedAcademy()` now writes all locale fields; `title` base = VI
- `src/app/api/v1/courses/route.ts` — uses `getLocalizedField()` for `title`
- `src/app/api/v1/courses/[id]/route.ts` — uses `getLocalizedField()` for `title`
- `src/generated/prisma/` — regenerated

### Exit Criteria — ALL MET

- [x] Course model has all 8 i18n fields in schema.prisma
- [x] `prisma db push` completes without error
- [x] `seedAcademy()` writes `title_en` for all 7 courses
- [x] `SELECT title_en FROM "Course"` returns non-null for all 7 records
- [x] `SELECT title FROM "Course" WHERE id = 'course-react-nextjs'` returns VI title
- [x] AcademyPage already calls `GET /api/v1/courses?lang=` on mount
- [x] AcademyPage renders `title` from API response (locale-aware via `_localeUsed`)
- [x] TypeScript: 0 errors BE + FE

---

---

## 1. Executive Summary

### Current State

The LOOP application has i18n infrastructure wired into its schema — locale fields exist across most models (e.g. titleEn, longDescriptionJa, bioKo) — but the vast majority are unpopulated. The seed script (prisma/seed.ts) creates base content in Vietnamese (VI) but never writes to locale variants (*_en, *_ja, *_ko, *_zh fields), leaving English and all non-VI locales completely blank in production.

### Severity Assessment

| Severity | Reason |
|----------|--------|
| P0 Critical | Service/TeamMember EN content is missing — directly visible to EN-speaking visitors and indexed by Google. EN is the default browser language and highest international traffic source. |
| P1 High | Academy courses have no i18n fields in schema; BE has titleEn/descEn in seed data but no schema column to store them. AcademyClient is a self-contained mock with zero BE integration. |
| P1 High | Project techStack[], features[], results are empty in seed AND in the live DB — EN translations of empty fields provide no SEO value. |
| P2 Medium | AddonService, Expertise, HomeSlider have schema i18n fields but zero locale content. |
| P2 Medium | Testimonial and ServicePackage have zero seed functions. |
| P3 Low | InfrastructureTier, ServiceAttribute have schema fields but minimal content. |

### Recommended Approach

Hybrid: AI-assisted inline seed for short/medium content + Translation Spreadsheet for rich bios + Admin CMS for ongoing refinement.

The seed script is the fastest path to initial population. The Admin CMS is the right tool for ongoing refinement. These two pipelines are separate and non-competing: seed populates once, CMS maintains forever.

---

## 2. Root Cause Analysis

All i18n issues reduce to one of five root causes:

### Cause A: AcademyClient — Self-Contained Mock UI (0% BE Integration)

File: FE/src/app/pages/AcademyPage.tsx (lines 1926)

AcademyClient is a ~1,000-line self-contained mock with:
- Hardcoded FALLBACK_COURSES array — IDs 1 through 6
- Zero API calls to BE (academyService is imported but not called in mock mode)
- IDs/slugs that do not match BE seed IDs (BE uses course-react-nextjs, course-figma-tailwind, etc.)
- A href on each course card pointing to /course/{id} — broken for any BE-initialized course

Impact: Fixing AcademyClient BE integration is a full rewrite. Until then, it always shows mock data regardless of BE state.

### Cause B: Course Schema — No i18n Fields (Schema Defect)

File: prisma/schema.prisma lines 18501879 (model Course)

The Course model has title (VI only), description (VI only), titleVi, descriptionVi — but no titleEn, titleJa, titleKo, titleZh, descriptionEn, descriptionJa, descriptionKo, descriptionZh.

Meanwhile seed.ts (lines 8371060) defines titleEn/descEn in its course data objects but the prisma.course.create() call (line 1057) only writes title, titleVi, description, descriptionVi — dropping all EN content at create time.

### Cause C: Schema i18n Fields Exist But Seed Doesnt Populate Them

These models have i18n locale fields but seed.ts writes zero content to them:

| Model | i18n Fields Present | Seed Writes? |
|-------|---------------------|--------------|
| Service (line 153) | titleEn, longDescriptionEn, shortDescriptionEn, featuresEn, technologiesEn, + JA/KO/ZH | No — only title, shortDescription, longDescription |
| Project (line 194) | titleEn, descriptionEn, resultsEn, techStackEn, featuresEn + JA/KO/ZH | No — base fields only |
| TeamMember (line 301) | bioEn, nameEn, roleEn, shortBioEn + JA/KO/ZH | No |
| HomeSlider (line 581) | titleEn, subtitleEn + JA/KO/ZH | No |
| AddonService (line 1029) | nameEn, descriptionEn + JA/KO/ZH | No — only name, description |
| Expertise (line 381) | nameEn, categoryEn + JA/KO/ZH | No |
| InfrastructureTier (line 530) | nameEn, descriptionEn + JA/KO/ZH | No |
| Testimonial (line 259) | textEn, companyEn, roleEn + JA/KO/ZH | N/A — no seed function exists |

### Cause D: Project Data — Empty Arrays at Create Time

Projects are not seeded in seed.ts at all. There is no seedProjects() function. Even if there were one, the VI base data (techStack[], features[], results) does not exist in the seed.

Consequence: English translations of techStackEn, featuresEn, resultsEn would be empty regardless — the underlying VI data to translate does not exist.

### Cause E: Testimonial / ServicePackage — No Seed Functions

Testimonial (line 259) and ServicePackage (line 419) both have full i18n field sets but zero seed entries exist. The seed.ts file has no seedTestimonials() or seedServicePackage() function.

---
## 3. Strategic Decision Framework

### Decision 1: Translation Mechanism for Seed Data

| Option | Approach | Pros | Cons | Recommended |
|--------|----------|------|------|-------------|
| A | Inline AI Seed | Fastest (hours), no external dependency, consistent style | Requires engineering to run prompts, EN-only initially | **Yes -- Phase 0 & 1** |
| B | Translation Spreadsheet | Human review, linguist-quality, multilingual | Slower, requires coordination, content team effort | **Yes -- TeamMember bio only (Phase 1)** |
| C | Admin CMS | Authoritative, live-editable, scalable | Requires full admin build-out, slower to implement | **Yes -- Phase 3** |

**Recommendation:** Pursue A for speed-to-market (Phases 0-1), then layer in C for long-term authority.

### Decision 2: TeamMember Bio Content Source

| Option | Approach | Pros | Cons | Recommended |
|--------|----------|------|------|-------------|
| A | Use EN bio from public profiles (LinkedIn, company bio) | No creative effort required, factual | May need translation to JA/KO/ZH, limited detail | **Yes -- Phase 1** |
| B | AI-generate from name + role | Fast, consistent style | Fictional content, brand voice risk | No -- use as fallback only |
| C | Write fresh with translator | Highest quality, on-brand | 4x effort, slowest | Phase 2+ |

**Recommendation:** Option A for EN bios (use existing public profiles), AI-generate JA/KO/ZH in Phase 2.

### Decision 3: Course Content Source

| Option | Approach | Pros | Cons | Recommended |
|--------|----------|------|------|-------------|
| A | AI-generate all course descriptions from titles | Fastest, consistent style | Needs human review for accuracy | **Yes -- Phase 0** |
| B | Translate existing VI course descriptions | Retains existing meaning | 4-language translation cost | Phase 2 |
| C | Write all new from scratch | Highest quality | Weeks of content work | Phase 3 |

**Recommendation:** Option A for Phase 0 EN seed, refine with content team in Phase 2.

### Decision 4: Deployment Strategy for Schema Migration

| Option | Approach | Pros | Cons | Recommended |
|--------|----------|------|------|-------------|
| A | Add fields as nullable, backfill in seed | Zero downtime, no data loss | nullable fields until seed runs | **Yes -- all phases** |
| B | Add fields with default empty string, run migration | Simple, no nulls | Destructive if wrong default | No |
| C | Feature flag per entity | Granular control, safe rollback | Engineering overhead | Phase 3 only |

**Recommendation:** Option A -- nullable fields, backfill via seed, enforce NOT NULL in Phase 3.


## 4. Entity-by-Entity Seeding Plan

### 4.1 Service (8 records)

**Schema fields:** title_en, title_ja, title_ko, title_zh, description_en, description_ja, description_ko, description_zh
**Current state:** VI-only seeded
**Priority:** P0 (Critical)

**Seed data source:** AI-generate EN from existing VI titles + descriptions

**Code change (seedServices):**

TypeScript code:
In seed.ts -- update prisma.service.create() to include: title_en, title_ja, title_ko, title_zh, description_en, description_ja, description_ko, description_zh

**Verification query:**
SELECT id, title, title_en, title_ja, title_ko, title_zh FROM "Service" WHERE title_en IS NULL OR title_ja IS NULL;

---

### 4.2 Project (6 records -- current)

**Schema fields:** title_en, title_ja, title_ko, title_zh, description_en, description_ja, description_ko, description_zh
**Current state:** NOT SEEDED (no seedProjects function exists)
**Priority:** P0 (Critical)

**Seed data source:** Create seedProjects() with AI-generated EN content

**Implementation:**
Create new async function seedProjects() in prisma/seed.ts with 6 project records, each containing all locale variants. Call it from the main seed export.

**Verification query:**
SELECT COUNT(*) FROM "Project"; -- Expected: 6

---

### 4.3 TeamMember (5 records -- current)

**Schema fields:** name_en, name_ja, name_ko, name_zh, bio_en, bio_ja, bio_ko, bio_zh
**Current state:** CEO only, VI-only
**Priority:** P1 (High)

**Seed data source:**
- EN: Use LinkedIn/public profile biography
- JA/KO/ZH: AI-translate EN bio in Phase 2

**Important:** TeamMember bios require human review -- use Translation Spreadsheet pipeline for EN bios from real sources.

---

### 4.4 Course (6 records + 1 draft)

**Schema fields:** title_en, title_ja, title_ko, title_zh, description_en, description_ja, description_ko, description_zh
**Current state:** Schema defect -- fields missing entirely
**Priority:** P0 (Critical -- schema fix required first)

**Steps:**
1. Schema migration (Phase 0): Add 8 missing i18n fields to Course model
2. FE alignment (Phase 0): Replace AcademyClient mock with real API call, align IDs
3. Seed (Phase 0): AI-generate EN course descriptions, seed all 6 + 1 draft
4. Phase 2: Translate JA/KO/ZH via vendor

---

### 4.5 Testimonial (4 records)

**Schema fields:** content_en, content_ja, content_ko, content_zh, author_en, author_ja, author_ko, author_zh
**Current state:** NOT SEEDED (no seedTestimonials function)
**Priority:** P1 (High)

**Seed data source:** AI-generate realistic testimonials for 4 clients/scenarios

---

### 4.6 HomeSlider (3 records)

**Schema fields:** title_en, title_ja, title_ko, title_zh, subtitle_en, subtitle_ja, subtitle_ko, subtitle_zh
**Current state:** VI-only
**Priority:** P1 (High)

**Code change:** Update seedContent() HomeSlider create call to include all locale subtitle and title fields.

---

### 4.7 AddonService (8 records)

**Schema fields:** name_en, name_ja, name_ko, name_zh, description_en, description_ja, description_ko, description_zh
**Current state:** name/description already EN; nameVi/descriptionVi are VI
**Priority:** P2 (Medium)

**Note:** AddonService uses inverted pattern -- base field is EN, Vi suffix is VI. Seed function needs to populate *_vi from the VI values AND add JA/KO/ZH.

---

### 4.8 Expertise (24 records)

**Schema fields:** name_en, name_ja, name_ko, name_zh, category_en, category_ja, category_ko, category_zh
**Current state:** EN is 100 percent (base fields); VI suffix fields missing; JA/KO/ZH all missing
**Priority:** P2 (Medium)

**Seed data source:** AI-translate EN names/categories to JA/KO/ZH


## 5. Language Mechanism for Seed

### Option A: Inline AI Seed (Recommended for Phase 0-1)

**Process:**
1. Engineer runs AI prompt with entity + existing VI content
2. AI generates EN (and optionally JA/KO/ZH) variants
3. Engineer pastes output into seed.ts data objects
4. Run seed, verify with SQL query

**Best for:** Speed-critical Phase 0-1, EN content, entities with structured data

**Prompt template:**
Generate seed.ts data for the [ENTITY] model.
Locale fields: title_en, title_ja, title_ko, title_zh, description_en, description_ja, description_ko, description_zh.
Existing VI content: [paste VI content]
Return TypeScript array ready for prisma.create().
Output only the data array, no commentary.

### Option B: Translation Spreadsheet (Recommended for TeamMember bios)

**Process:**
1. Export current EN/VI content to spreadsheet (Name, EN Bio, VI Bio columns)
2. Send spreadsheet to translator for JA/KO/ZH columns
3. Translator fills in all language columns
4. Engineer converts spreadsheet rows to TypeScript seed data
5. Run seed

**Best for:** Content requiring human nuance (bios, testimonials, marketing copy)

### Option C: Admin CMS (Recommended for Phase 3)

**Process:**
1. Content team uses admin CMS to edit all locale fields inline
2. CMS saves to database via API
3. seed.ts becomes minimal bootstrap only

**Best for:** Long-term authoritative content, ongoing updates


## 6. SEO / GEO Impact Matrix

| Priority | Entity | SEO Impact | GEO Impact | Traffic Risk | Recommended Action |
|----------|--------|------------|------------|--------------|--------------------|
| P0 | Service | High -- service pages | JA: High, KO: High | Medium -- organic search | Seed EN immediately |
| P0 | Course | Critical -- academy pages | JA: Critical, KO: Critical | High -- course search | Schema fix + seed |
| P1 | Project | High -- portfolio pages | JA: Medium, KO: Medium | Medium | Seed EN + JA + KO |
| P1 | HomeSlider | Medium -- homepage | JA: High, KO: High | High -- first impression | Seed EN + JA + KO |
| P1 | TeamMember | Low -- bio pages | JA: Low, KO: Low | Low | Seed EN only (Phase 1) |
| P2 | Testimonial | Low | Low | Low | Seed EN + JA + KO |
| P2 | AddonService | Low | Medium | Low | Seed EN only (Phase 1) |
| P2 | Expertise | Medium -- tag pages | Low | Low | Seed EN only (Phase 1) |

**Top GEO markets by traffic value:**
1. Japan (JA) -- High-value enterprise clients
2. South Korea (KO) -- Strong tech startup market
3. China (ZH) -- Large market, harder SEO environment
4. English (EN) -- Global brand presence


## 7. Timeline & Phasing

### Phase 0: Hotfix (This Sprint, ~1 week)

**Goal:** Fix critical defects, enable EN seeding

| # | Task | Owner | Hours | Depends On |
|---|------|-------|-------|-----------|
| 0.1 | Add 8 i18n fields to Course model + migrate DB | Eng | 2 | None |
| 0.2 | Replace AcademyClient mock with real API call | Eng | 2 | 0.1 |
| 0.3 | Fix seedAcademy() to write EN fields | Eng | 1 | 0.1 |
| 0.4 | AI-generate EN course descriptions for all 7 courses | Eng | 1 | 0.3 |
| 0.5 | Run seed, verify all courses have title_en | Eng | 0.5 | 0.4 |
| 0.6 | Verify AcademyPage loads from DB (not mock) | Eng | 0.5 | 0.2 |
| | **Phase 0 Total** | | **7 hours** | |

### Phase 1: EN Seed (Next Sprint, ~2 weeks)

**Goal:** Seed EN content for all entities

| # | Task | Owner | Hours | Depends On |
|---|------|-------|-------|-----------|
| 1.1 | Create seedProjects() with 6 projects | Eng | 3 | None |
| 1.2 | Update seedServices() to write EN fields | Eng | 1 | None |
| 1.3 | Update seedContent() (HomeSlider) EN fields | Eng | 1 | None |
| 1.4 | Create seedTestimonials() with 4 records | Eng | 2 | None |
| 1.5 | Create seedTeamMembers() with 5 members | Eng | 4 | Translation spreadsheet |
| 1.6 | Update seedAddonServices() EN fields | Eng | 1 | None |
| 1.7 | Update seedExpertises() EN fields | Eng | 1 | None |
| 1.8 | Run full seed, verify all EN fields | Eng | 2 | 1.1-1.7 |
| 1.9 | QA EN content on all key pages | QA | 4 | 1.8 |
| | **Phase 1 Total** | | **19 hours** | |

### Phase 2: JA + KO + ZH Seed (Month 2, ~3 weeks)

**Goal:** Seed Asian-language content for all entities

| # | Task | Owner | Hours | Depends On |
|---|------|-------|-------|-----------|
| 2.1 | Prepare Translation Spreadsheet -- all entities | Eng | 4 | Phase 1 complete |
| 2.2 | JA translation (vendor) | Translator | 12 | 2.1 |
| 2.3 | KO translation (vendor) | Translator | 12 | 2.1 |
| 2.4 | ZH translation (vendor) | Translator | 12 | 2.1 |
| 2.5 | Engineer imports translations to seed.ts | Eng | 8 | 2.2-2.4 |
| 2.6 | Run seed, verify JA/KO/ZH fields | Eng | 2 | 2.5 |
| | **Phase 2 Total** | | **50 hours** | |

### Phase 3: Admin CMS (Month 3+, ~6 weeks)

**Goal:** Enable content team to edit i18n fields without engineering

| # | Task | Owner | Hours | Depends On |
|---|------|-------|-------|-----------|
| 3.1 | Design admin CMS i18n field UI | Eng + Design | 16 | None |
| 3.2 | Implement CMS API for i18n updates | Eng | 24 | 3.1 |
| 3.3 | Migrate seed bootstrap data to CMS source of truth | Eng | 8 | 3.2 |
| 3.4 | CMS QA and content team training | QA + PM | 8 | 3.3 |
| | **Phase 3 Total** | | **56 hours** | |


## 8. Cost Estimate

### Internal Engineering

| Phase | Hours | Rate (USD 150/hr) | Cost |
|-------|-------|-------------------|------|
| Phase 0 | 7 | 150 | 1,050 |
| Phase 1 | 19 | 150 | 2,850 |
| Phase 2 | 10 | 150 | 1,500 |
| Phase 3 | 48 | 150 | 7,200 |
| **Total** | **84 hours** | | **12,600** |

### External Translation

| Language | Word Count (est.) | Rate/word | Cost |
|----------|------------------|-----------|------|
| JA | 3,000 | 0.12 | 360 |
| KO | 3,000 | 0.12 | 360 |
| ZH | 3,000 | 0.10 | 300 |
| **Total** | 9,000 | | **1,020** |

### Grand Total

| Category | Cost |
|----------|------|
| Engineering | 12,600 |
| Translation | 1,020 |
| **Grand Total** | **13,620 USD** |


## 9. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| R1 | Course schema migration causes BE/FE breakage | Medium | High | Add nullable fields first; test BE + FE independently before merging |
| R2 | AcademyClient mock replaced but API returns null | Medium | High | Add null guard in FE; verify seed data matches API contract |
| R3 | AI-generated EN content is factually incorrect | Medium | Medium | Content team reviews Phase 1 seed before deployment |
| R4 | Translation vendor produces low-quality JA/KO | Low | Medium | Use vetted vendor with tech domain experience; 1 revision round included |
| R5 | seedProjects/seedTestimonials too large, timeout | Low | Low | Chunk into batches of 2; use createMany where supported |
| R6 | ZH translations blocked by Chinese internet restrictions | Low | Medium | Deploy ZH content regardless; monitor performance; consider CDN |
| R7 | New i18n fields added to schema but not seed (regression) | High | Medium | Add seed validation test to CI: query all i18n fields, fail if NULL count > threshold |
| R8 | Content team bypasses CMS, edits seed.ts directly | Medium | Low | Document seed.ts as bootstrap-only; CMS is authoritative after Phase 3 |


## 10. Definition of Done

### Phase 0 Done Criteria

- [ ] Course model has all 8 i18n fields in schema.prisma
- [ ] prisma migrate dev completes without error
- [ ] seedAcademy() writes title_en, description_en for all 7 courses
- [ ] SELECT title_en FROM "Course" WHERE id = 'course-react-nextjs' returns non-null
- [ ] AcademyPage renders courses from API (not mock)
- [ ] AcademyPage renders title_en for all visible courses

### Phase 1 Done Criteria

- [ ] seedProjects() exists and seeds 6 projects with EN content
- [ ] seedTestimonials() exists and seeds 4 testimonials with EN content
- [ ] seedServices() writes EN fields for all 8 services
- [ ] seedContent() (HomeSlider) writes EN fields for all 3 slides
- [ ] seedTeamMembers() seeds 5 members with EN bios
- [ ] seedAddonServices() seeds EN addon services
- [ ] seedExpertises() writes EN fields for all 24 expertise records
- [ ] SELECT title_en FROM "Service" returns 8 rows
- [ ] SELECT title_en FROM "Project" returns 6 rows
- [ ] SELECT content_en FROM "Testimonial" returns 4 rows
- [ ] No NULL values in any *_en field across all entities

### Phase 2 Done Criteria

- [ ] All *_ja fields populated for all entities
- [ ] All *_ko fields populated for all entities
- [ ] All *_zh fields populated for all entities
- [ ] JA/KO/ZH content reviewed by native speaker (at least spot-check)

### Phase 3 Done Criteria

- [ ] Admin CMS supports inline editing of all i18n fields
- [ ] CMS updates reflect immediately in API response
- [ ] seed.ts contains only bootstrap data (no content edits via seed)
- [ ] Content team trained on CMS i18n workflow


## Appendix A: seed.ts Entity Coverage Map

| Entity | Function Exists | EN Fields Seeded | VI Fields Seeded | JA/KO/ZH |
|--------|----------------|-----------------|-------------------|----------|
| Service | seedServices() | No | Yes | No |
| Project | **NO FUNCTION** | N/A | N/A | N/A |
| TeamMember | seedCEO() (1 only) | No | Partial | No |
| Course | seedAcademy() | No | Yes | No |
| Testimonial | **NO FUNCTION** | N/A | N/A | N/A |
| HomeSlider | seedContent() | No | Yes | No |
| AddonService | seedAddonServices() | Partial | Yes | No |
| Expertise | seedExpertises() | Partial | No | No |


## Appendix B: AcademyClient Mock vs. BE Alignment

| Field | AcademyClient Mock | Database/BE Seed |
|-------|-------------------|-----------------|
| ID prefix | Numeric string (1-6) | Slug (course-react-nextjs) |
| 7th course | Not present | course-python-ml (draft) |
| API call | Not called | GET /api/courses |
| i18n fields | Hardcoded EN only | DB fields (VI + future EN) |

**Action required:** Merge the two sources -- align IDs and drop mock.

---

*End of Document*
