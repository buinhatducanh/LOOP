# FE i18n Scale Plan — JSON Translation Architecture

> **Muc tieu:** Chuyen tu column-per-language sang JSON Translation de scale vo han ngon ngu ma khong can migration.
> **Owner:** PO + FE Lead + BE Lead
> **Cap nhat:** 2026-03-30
> **Trang thai:** Proposed

---

## 1) Van de hien tai — Column-Per-Language

### Hien trang

Prisma schema dung **column-per-language** cho 4 model chinh:

```prisma
model Service {
  title              String    // VI (default)
  titleEn            String?
  titleJa            String?
  titleKo            String?
  titleZh            String?
  shortDescriptionEn String?
  shortDescriptionJa String?
  // ... x5 ngon ngu x N fields = hang tram cot
}
```

**Models bi anh huong:** `Service`, `Project`, `BlogPost`, `TeamMember`

### Chi phi them 1 ngon ngu moi (vi du: Tieng Phap)

| Buoc | Effort |
|------|--------|
| Them ~50-80 cot moi vao schema (`titleFr`, `descFr`, `contentFr`...) | 0.5 ngay |
| Chay migration tren production DB | Risk cao |
| Sua `getLocalizedField()` helper — them suffix `Fr` | 0.5 ngay |
| Sua tat ca admin CMS translate tabs (4 tabs) | 1 ngay |
| Sua tat ca mapper functions | 0.5 ngay |
| Tao `messages/fr.json` (UI strings) | 0.5 ngay |
| QA 6-locale smoke test | 0.5 ngay |
| **Tong:** | **~3-5 ngay dev + migration risk** |

### Van de scale

- Moi ngon ngu moi = schema migration bat buoc
- So cot tang tuyen tinh: 5 ngon ngu x 10 fields = 50 cot; 10 ngon ngu = 100 cot
- Migration risk tren production DB (Neon) tang theo so cot
- Admin CMS tabs phai hardcode per-locale — khong dynamic
- `getLocalizedField()` phai hardcode suffix mapping per-locale

---

## 2) Giai phap de xuat — JSON Translation Field

### Kien truc moi

```
Layer 1: UI Strings (GIU NGUYEN — da tot)
  next-intl + messages/{locale}.json
  Them ngon ngu = them 1 file JSON

Layer 2: CMS Content (CAN REFACTOR)
  HIEN TAI: column-per-language (titleEn, titleJa...)
  DE XUAT: Json field tren Prisma (PostgreSQL jsonb)
```

### Schema moi

```prisma
model Service {
  id           String   @id @default(cuid())
  // Giu field VI goc (backward compatible, default locale)
  title        String
  description  String
  features     String[]

  // MOI: 1 JSON field chua TAT CA translations
  translations Json?    @default("{}")
  // Cau truc: {
  //   "en": { "title": "Web Dev", "description": "..." },
  //   "ja": { "title": "ウェブ開発", "description": "..." },
  //   "fr": { "title": "Développement Web", "description": "..." }
  // }
}
```

**Ap dung tuong tu cho:** `Project`, `BlogPost`, `TeamMember`

### Helper moi

```typescript
// src/lib/i18n/json-translation.ts

interface TranslationRecord {
  translations?: Record<string, Record<string, string | string[]>>;
  [key: string]: unknown;
}

/**
 * Lay 1 field theo locale. Fallback → VI (field goc).
 */
export function t(
  record: TranslationRecord,
  field: string,
  locale: string
): string | null {
  if (locale === 'vi') return (record[field] as string) ?? null;

  const translated = record.translations?.[locale]?.[field];
  if (typeof translated === 'string' && translated.length > 0) return translated;

  // Fallback → VI
  return (record[field] as string) ?? null;
}

/**
 * Lay array field theo locale. Fallback → VI.
 */
export function tArray(
  record: TranslationRecord,
  field: string,
  locale: string
): string[] {
  if (locale === 'vi') return (record[field] as string[]) ?? [];

  const translated = record.translations?.[locale]?.[field];
  if (Array.isArray(translated) && translated.length > 0) return translated;

  return (record[field] as string[]) ?? [];
}

/**
 * Lay nhieu fields cung luc. Fallback → VI per field.
 */
export function tAll(
  record: TranslationRecord,
  fields: string[],
  locale: string
): Record<string, string | string[] | null> {
  return Object.fromEntries(
    fields.map(f => [f, t(record, f, locale)])
  );
}
```

### So sanh hai phuong an

| Tieu chi | Option A: JSON Field (Khuyen nghi) | Option B: Translation Table |
|----------|-----------------------------------|---------------------------|
| Them ngon ngu | 0 migration | 0 migration |
| Query performance | Tot (jsonb native PostgreSQL) | Can JOIN/batch load |
| Type safety | Application-level (Zod) | DB-level |
| Do phuc tap | Thap | Cao |
| Phu hop quy mo | 5-15 ngon ngu | 15+ ngon ngu |
| Translation tool integration | Export JSON → import | Native support |
| **Khuyen nghi cho LOOP** | **Co** | Khong (overkill) |

**Ly do chon Option A:**
- LOOP co ~4 translatable models — khong qua phuc tap
- 5-15 ngon ngu la sweet spot cho JSON approach
- Prisma 7 + PostgreSQL jsonb = production-ready
- Migration path don gian nhat tu column-per-language
- Phu hop quy mo agency

---

## 3) Ke hoach trien khai — 3 giai doan

### Giai doan 1: Foundation — JSON Translation Helper (1 tuan)

**Muc tieu:** Chuyen tu column-per-language sang JSON field, backward compatible.

| # | Task | Chi tiet | Effort | Owner |
|---|------|---------|--------|-------|
| 1.1 | Schema migration | Them `translations Json? @default("{}")` vao 4 models | 0.5 ngay | BE |
| 1.2 | Data migration script | Copy `titleEn/Ja/Ko/Zh` → `translations` JSON cho tat ca records | 0.5 ngay | BE |
| 1.3 | Translation helper | Tao `src/lib/i18n/json-translation.ts` — `t()`, `tArray()`, `tAll()` | 0.5 ngay | BE |
| 1.4 | Validation schema | Tao Zod schema cho translations JSON structure | 0.5 ngay | BE |
| 1.5 | Update v1 API endpoints | 6 endpoints dung helper moi thay vi `getLocalizedField()` | 1 ngay | BE |
| 1.6 | Update admin API endpoints | PUT/POST endpoints nhan `translations` JSON thay vi per-field | 0.5 ngay | BE |
| 1.7 | QA 5-locale smoke test | Tat ca v1 endpoints tra dung data theo locale | 0.5 ngay | QA |

**Data migration script:**
```typescript
// scripts/migrate-translations.ts
async function migrateServiceTranslations() {
  const services = await prisma.service.findMany();
  for (const s of services) {
    const translations: Record<string, Record<string, string>> = {};

    for (const locale of ['en', 'ja', 'ko', 'zh']) {
      const suffix = locale.charAt(0).toUpperCase() + locale.slice(1);
      const localeData: Record<string, string> = {};

      for (const field of ['title', 'shortDescription', 'longDescription']) {
        const value = s[`${field}${suffix}` as keyof typeof s];
        if (typeof value === 'string' && value.length > 0) {
          localeData[field] = value;
        }
      }

      if (Object.keys(localeData).length > 0) {
        translations[locale] = localeData;
      }
    }

    await prisma.service.update({
      where: { id: s.id },
      data: { translations },
    });
  }
}
```

**Exit criteria GD1:**
- `translations` field co data cho tat ca records da co ban dich
- v1 API endpoints tra dung data tu JSON field
- Old column fields van ton tai (chua xoa — backward compatible)
- Build + tsc + lint pass

---

### Giai doan 2: Dynamic Admin UI (1 tuan)

**Muc tieu:** Admin CMS tu dong render translation tabs theo danh sach ngon ngu active.

| # | Task | Chi tiet | Effort | Owner |
|---|------|---------|--------|-------|
| 2.1 | TranslationEditor component | Render tabs dong tu `SUPPORTED_LOCALES`, khong hardcode | 1 ngay | FE |
| 2.2 | Thay the hardcoded tabs | ServicesTab, PortfolioTab, BlogTab, MembersTab | 1.5 ngay | FE |
| 2.3 | Locale management API | `GET /api/admin/i18n/locales` — danh sach ngon ngu active | 0.5 ngay | BE |
| 2.4 | Admin add/remove locale | UI them/xoa ngon ngu supported (khong can migration) | 1 ngay | FE+BE |
| 2.5 | Translation completeness | % da dich per locale per entity (badge indicator) | 0.5 ngay | FE |

**TranslationEditor component:**
```tsx
interface TranslationEditorProps {
  entity: { translations?: Record<string, Record<string, string>> };
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'richtext' | 'array';
  }>;
  locales: Array<{ code: string; name: string; flag: string }>;
  onChange: (translations: Record<string, Record<string, string>>) => void;
}

// Su dung:
<TranslationEditor
  entity={service}
  fields={[
    { key: 'title', label: 'Tieu de', type: 'text' },
    { key: 'shortDescription', label: 'Mo ta ngan', type: 'textarea' },
    { key: 'longDescription', label: 'Mo ta dai', type: 'richtext' },
    { key: 'features', label: 'Tinh nang', type: 'array' },
  ]}
  locales={activeLocales}
  onChange={(t) => setTranslations(t)}
/>
```

**Exit criteria GD2:**
- Admin CMS dung TranslationEditor component chung
- Them ngon ngu moi = them vao config, UI tu render tab moi
- Translation completeness indicator hien thi chinh xac
- Build + tsc + lint pass

---

### Giai doan 3: Scale Infrastructure (1 tuan)

**Muc tieu:** Automation, tooling, cleanup de scale lau dai.

| # | Task | Chi tiet | Effort | Owner |
|---|------|---------|--------|-------|
| 3.1 | SupportedLocale model | Locale config tu DB thay vi hardcode trong code | 0.5 ngay | BE |
| 3.2 | Translation CLI | `npm run i18n:export` / `npm run i18n:import` (JSON format) | 1 ngay | BE |
| 3.3 | Auto-translate draft | DeepL/Google Translate API → tao draft → human review flag | 1 ngay | BE |
| 3.4 | Translation dashboard | Admin panel: coverage per locale, missing translations, last updated | 1 ngay | FE |
| 3.5 | Cleanup old columns | Xoa `titleEn`, `titleJa`... sau khi verify du lieu da migrate | 0.5 ngay | BE |
| 3.6 | Documentation | Cap nhat I18N-RUNBOOK.md | 0.5 ngay | FE |

**SupportedLocale model:**
```prisma
model SupportedLocale {
  code       String   @id          // "vi", "en", "fr", "de"
  name       String                // "Vietnamese", "English"
  nativeName String                // "Tieng Viet", "English"
  flag       String                // flag emoji
  isActive   Boolean  @default(true)
  isDefault  Boolean  @default(false)
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Translation CLI:**
```bash
# Export tat ca translations cua Service sang JSON
npm run i18n:export -- --entity service --output ./translations/

# Output: translations/service-en.json, service-ja.json...
# Format: [{ "id": "clx...", "title": "Web Dev", "description": "..." }]

# Import translations tu file JSON (sau khi dich xong)
npm run i18n:import -- --entity service --locale fr --input ./translations/service-fr.json
```

**Auto-translate workflow:**
```
Admin chon entity → "Auto-translate to French"
  → API goi DeepL/Google Translate
  → Luu vao translations.fr voi flag: { "_draft": true }
  → Admin review → approve → xoa _draft flag
  → Published
```

**Exit criteria GD3:**
- Locale config tu DB, admin UI quan ly
- CLI export/import hoat dong
- Auto-translate draft workflow hoat dong
- Old columns da xoa, khong con column-per-language
- I18N-RUNBOOK.md cap nhat day du

---

## 4) Quy trinh them ngon ngu moi SAU refactor

```
TRUOC (hien tai):                      SAU (de xuat):
──────────────────                     ───────────────
1. Sua schema.prisma (50+ fields)      1. Admin UI → "Add Language" → nhap code/name/flag
2. Chay migration                      2. Tao messages/{locale}.json (UI strings)
3. Sua getLocalizedField()             3. (Optional) Chay auto-translate draft
4. Sua tat ca admin tabs               4. Admin review translations trong CMS
5. Sua mapper functions                5. Done
6. Tao messages file
7. QA

Effort: ~3-5 ngay dev                 Effort: ~2-4 gio (+ thoi gian dich noi dung)
Schema changes: Co (migration)         Schema changes: KHONG
Risk: Cao (production migration)       Risk: Thap (chi data change)
```

---

## 5) Priority Matrix

| Giai doan | Business Value | Technical Risk | Effort | Priority |
|-----------|---------------|---------------|--------|----------|
| GD1: JSON Translation Foundation | Cao — unblock future languages | Thap — backward compatible | 1 tuan | **P0** |
| GD2: Dynamic Admin UI | Cao — giam dev cost per language | Thap — UI only | 1 tuan | **P0** |
| GD3: Scale Infrastructure | Trung binh — automation + cleanup | Thap — optional components | 1 tuan | **P1** |

---

## 6) Rui ro & Mitigation

| # | Rui ro | Impact | Prob | Score | Mitigation |
|---|--------|--------|------|-------|-----------|
| R1 | JSON field mat type safety | Medium | Medium | 4 | Zod validation schema + TypeScript generic helper |
| R2 | Data migration loi (column → JSON) | High | Low | 3 | Script chay staging truoc; giu old columns 2 tuan truoc khi xoa |
| R3 | Performance JSON query | Low | Low | 1 | PostgreSQL jsonb native; chi read toan bo JSON (khong filter by content) |
| R4 | Auto-translate quality kem | Medium | Medium | 4 | Bat buoc human review flag truoc khi publish |
| R5 | Admin UX phuc tap khi nhieu locale | Medium | Low | 2 | Tab UI + search/filter locale; chi hien active locales |
| R6 | Backward compatibility break | High | Low | 3 | Giu old columns trong GD1+GD2; chi xoa o GD3 sau khi verify |

---

## 7) KPI do luong thanh cong

| Metric | Target hien tai | Target sau refactor |
|--------|----------------|-------------------|
| Effort them ngon ngu moi | 3-5 ngay dev | < 4 gio (khong tinh dich) |
| Schema changes can thiet | 1 migration per locale | 0 migration |
| Translation coverage visibility | Khong co | 100% entities co indicator |
| Build/deploy impact khi them locale | Can redeploy | Khong can redeploy |
| Admin CMS code changes khi them locale | Sua 4+ files | 0 code changes |
| Time to first draft translation | Thu cong | < 5 phut (auto-translate) |

---

## 8) Dependencies & Prerequisites

### Truoc khi bat dau GD1

- [ ] Backup production DB (Neon snapshot)
- [ ] Verify Prisma 7 Json type hoat dong voi Neon PostgreSQL
- [ ] Chot danh sach translatable fields per model
- [ ] Review hien trang data: bao nhieu records da co ban dich

### Dependency map

```
GD1 (Foundation) ← khong phu thuoc gi
  |
  v
GD2 (Admin UI) ← phu thuoc GD1 (can JSON field + helper)
  |
  v
GD3 (Scale) ← phu thuoc GD1 + GD2 (can JSON + admin UI truoc khi cleanup)
```

---

## 9) Translatable Fields Inventory

### Service (6 fields)
- `title`, `shortDescription`, `longDescription`, `features` (array), `technologies` (array), `subtitle`

### Project (6 fields)
- `title`, `description`, `results`, `techStack` (array), `features` (array), `tag`

### BlogPost (5 fields)
- `title`, `content`, `excerpt`, `seoTitle`, `seoDesc`

### TeamMember (10 fields)
- `name`, `role`, `bio`, `shortBio`, `specialty`, `challenge`, `solution`, `result`, `guild`, `quote`

**Tong: ~27 translatable fields across 4 models**

---

## 10) Migration Safety Protocol

### Buoc 1: Them JSON field (non-breaking)
```sql
ALTER TABLE "Service" ADD COLUMN "translations" JSONB DEFAULT '{}';
ALTER TABLE "Project" ADD COLUMN "translations" JSONB DEFAULT '{}';
ALTER TABLE "BlogPost" ADD COLUMN "translations" JSONB DEFAULT '{}';
ALTER TABLE "TeamMember" ADD COLUMN "translations" JSONB DEFAULT '{}';
```

### Buoc 2: Data migration (idempotent script)
- Chay `scripts/migrate-translations.ts`
- Script doc old columns → ghi vao `translations` JSON
- Idempotent: chay lai khong duplicate data

### Buoc 3: Update code (dual-read)
- Helper moi doc tu `translations` JSON
- Neu `translations` rong → fallback doc old columns (backward compatible)
- API endpoints chuyen sang helper moi

### Buoc 4: Verify (2 tuan observation)
- So sanh response tu helper moi vs helper cu
- Monitor error rate, response shape
- QA 5-locale regression

### Buoc 5: Cleanup (sau 2 tuan verify)
- Xoa old column-per-language fields
- Xoa `getLocalizedField()` helper cu
- Migration: `ALTER TABLE "Service" DROP COLUMN "titleEn", DROP COLUMN "titleJa"...`

---

## 11) Lien ket

- `.claude/rules/fe-i18n-implementation-plan.md` — Plan i18n goc (Phase 0-3)
- `.claude/rules/fe-roadmap.md` — FE Roadmap tong the
- `.claude/rules/fe-delivery-process.md` — Quy trinh delivery
- `.claude/rules/fe-code-review-checklist.md` — Checklist review (i18n section)
- `src/lib/i18n/localization.ts` — Helper hien tai (se duoc thay the)
- `src/messages/*.json` — UI translation files (giu nguyen)
