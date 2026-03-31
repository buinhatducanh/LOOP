# FE i18n Scale Plan — JSON Translation Architecture

> **Mục tiêu:** Chuyển từ column-per-language sang JSON Translation để scale vô hạn ngôn ngữ mà không cần migration.
> **Owner:** PO + FE Lead + BE Lead
> **Cập nhật:** 2026-03-31
> **Trạng thái:** Proposed — chưa bắt đầu

---

## 0) Tổng kết Audit Thực Tế (2026-03-31)

> ⚠️ **Phát hiện quan trọng:** Nhiều item được ghi là "đã xong" trong CLAUDE.md nhưng thực tế chưa tồn tại.

### Thực trạng toàn bộ hệ thống i18n

| Thành phần | Trạng thái | Chi tiết |
|---|---|---|
| **BE column-per-language** | ✅ 57 cột | `Service`(9), `Project`(12), `TeamMember`(16), `BlogPost`(20) |
| **`translations` JSON field** | ❌ Chưa có | Chỉ là proposal — schema chưa có field nào |
| **`SupportedLocale` model** | ❌ Chưa có | Locale hardcoded trong LOCALE_SUFFIX |
| **`getLocalizedField()` helpers** | ✅ Đã có | 5 helpers + 4 mappers trong `localization.ts` |
| **API `?lang=` support** | ✅ 14 endpoints | Tất cả `/api/v1/*` đã hỗ trợ locale param |
| **`featuresEn/Ja/Ko/Zh` arrays (Service)** | ❌ Thiếu trong schema | Code gọi nhưng schema không có |
| **`techStackEn/Ja/Ko/Zh` arrays (Project)** | ❌ Thiếu trong schema | Code gọi nhưng schema không có |
| **`featuresEn/Ja/Ko/Zh` arrays (Project)** | ❌ Thiếu trong schema | Code gọi nhưng schema không có |
| **Admin translate tabs (ServicesTab)** | ❌ Chưa có | CLAUDE.md ghi ✅ — thực tế tab `content` empty |
| **Admin translate tabs (PortfolioTab)** | ❌ Chưa có | Không có EN/JA/KO/ZH field inputs |
| **Admin translate tabs (BlogTab)** | ❌ Chưa có | Không có `content` field, không có locale variant |
| **Admin translate tabs (MembersTab)** | ❌ Chưa có | EMPTY_MEMBER không có i18n fields |
| **FE i18n JSON files** | ❌ Chưa có | CLAUDE.md ghi ✅ Phase 1.5 — files không tồn tại |
| **`FE/src/i18n/i18n.ts`** | ❌ Không tồn tại | Không có FE i18n system |
| **`FE/src/i18n/messages/vi.json`** | ❌ Không tồn tại | FE vẫn dùng hardcoded VI |
| **BE message files** | ⚠️ 415 keys | VI/EN ✅, JA/KO/ZH thiếu 12 keys mỗi file |
| **`LOCALE_SUFFIX`** | ✅ `{ vi:"", en:"En", ja:"Ja", ko:"Ko", zh:"Zh" }` | Không surprises |
| **`SupportedLocale` model** | ❌ Không có | Phải tạo mới |

### Số lượng cột i18n thực tế trong schema

```
Service     : 9 cột  (titleEn/Ja/Ko/Zh, shortDescEn/Ja/Ko/Zh, longDescEn/Ja/Ko/Zh)  + 4 arrays MISSING
Project     : 12 cột (titleEn/Ja/Ko/Zh, descEn/Ja/Ko/Zh, resultsEn/Ja/Ko/Zh)         + 6 arrays MISSING
TeamMember  : 16 cột (nameEn/Ja/Ko/Zh, roleEn/Ja/Ko/Zh, bioEn/Ja/Ko/Zh, shortBioEn/Ja/Ko/Zh)
BlogPost    : 20 cột (titleEn/Ja/Ko/Zh, excerptEn/Ja/Ko/Zh, contentEn/Ja/Ko/Zh, seoTitleEn/Ja/Ko/Zh, seoDescEn/Ja/Ko/Zh)
─────────────────────────────────────────────────────────────────────────────────────────
Tổng       : 57 cột text + 10 arrays MISSING
```

### Key gaps cần fix TRƯỚC khi migrate sang JSON

1. **Array columns missing**: `featuresEn/Ja/Ko/Zh` (Service), `technologiesEn/Ja/Ko/Zh` (Service), `techStackEn/Ja/Ko/Zh` (Project), `featuresEn/Ja/Ko/Zh` (Project) — API code đã reference những field này nhưng schema không có → BE sẽ crash nếu gọi
2. **Admin translate tabs**: 0/4 đã implement → cần xây hoàn toàn từ đầu
3. **FE i18n system**: CLAUDE.md ghi ✅ Phase 1.5 nhưng files không tồn tại → cần xây hoàn toàn

---

## 1) Vấn đề hiện tại — Column-Per-Language

### Hien trang

Prisma schema dùng **column-per-language** cho 4 model chính:

```prisma
model Service {
  title              String    // VI (default)
  titleEn            String?
  titleJa            String?
  titleKo            String?
  titleZh            String?
  shortDescriptionEn String?
  shortDescriptionJa String?
  longDescriptionEn  String?
  // ... x5 ngon ngu x N fields
  // ⚠️ MISSING: featuresEn, technologiesEn arrays
}
```

### Chi phi them 1 ngon ngu moi (Tieng Phap — column-per-language)

| Buoc | Effort |
|------|--------|
| Thêm ~57 cột mới vào schema | 0.5 ngày |
| Chạy migration trên production DB | Risk cao |
| Sửa `LOCALE_SUFFIX` + `getLocalizedField()` | 0.5 ngày |
| Xây translate tab trong 4 admin tabs | 2 ngày |
| Sửa tất cả mapper functions | 0.5 ngày |
| Cập nhật FE API services để gửi đúng field | 1 ngày |
| QA 6-locale smoke test | 0.5 ngày |
| **Tổng** | **~5 ngày dev + migration risk cao** |

### Van de scale

- Mỗi ngôn ngữ mới = schema migration bắt buộc
- 10 arrays đang MISSING trong schema (code reference field không tồn tại)
- Admin translate tabs chưa có (0/4)
- FE i18n system chưa có
- `LOCALE_SUFFIX` hardcoded → thêm ngôn ngữ = code change
- `SupportedLocale` model không có

---

## 2) Giai phap de xuat — JSON Translation Field

### Kien truc moi

```
Layer 1: UI Strings
  next-intl + messages/{locale}.json (BE)
  FE: tạo hệ thống i18n JSON tương tự
  → Thêm ngôn ngữ = thêm 1 file JSON

Layer 2: CMS Content
  HIEN TAI: column-per-language (titleEn, titleJa...)
  DE XUAT: Json field trên Prisma (PostgreSQL jsonb)
  → Thêm ngôn ngữ = thêm key trong JSON, 0 migration
```

### Schema moi

```prisma
model Service {
  id           String   @id @default(cuid())
  // Giữ base VI (default locale — backward compatible)
  title        String
  shortDescription String
  longDescription  String?
  features         String[]
  technologies     String[]
  subtitle      String?

  // MOI: 1 JSON field chứa TẤT CẢ translations
  translations Json?    @default("{}")
  // Cấu trúc: {
  //   "en": { "title": "Web Dev", "shortDescription": "..." },
  //   "ja": { "title": "ウェブ開発", "shortDescription": "..." },
  //   "fr": { "title": "Développement Web", "shortDescription": "..." }
  // }
  // Array fields cũng trong này:
  //   "en": { "features": ["SEO", "Analytics"], "technologies": ["React"] }
  // }

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Áp dụng tương tự cho: `Project`, `BlogPost`, `TeamMember`

### Helper moi

```typescript
// src/lib/i18n/json-translation.ts

export interface LocalizedRecord {
  translations?: Record<string, Record<string, string | string[]>>;
  [key: string]: unknown;
}

const LOCALE_SUFFIX: Record<string, string> = {
  vi: "", en: "En", ja: "Ja", ko: "Ko", zh: "Zh",
};

export const FALLBACK_CHAIN = ["vi"];

/**
 * Lay gia tri 1 field theo locale.
 * Fallback chain: requested_locale → vi (base field) → null
 */
export function getLocalizedField(
  record: LocalizedRecord,
  fieldName: string,
  locale: string
): string | null {
  if (locale === "vi") {
    return (record[fieldName] as string) ?? null;
  }

  const translated = record.translations?.[locale]?.[fieldName];
  if (typeof translated === "string" && translated.length > 0) {
    return translated;
  }

  // Fallback → VI base
  return (record[fieldName] as string) ?? null;
}

/**
 * Lay array field theo locale.
 */
export function getLocalizedArray(
  record: LocalizedRecord,
  fieldName: string,
  locale: string
): string[] {
  if (locale === "vi") {
    return (record[fieldName] as string[]) ?? [];
  }

  const translated = record.translations?.[locale]?.[fieldName];
  if (Array.isArray(translated) && translated.length > 0) {
    return translated as string[];
  }

  return (record[fieldName] as string[]) ?? [];
}

/**
 * Lay nhieu fields cung luc.
 */
export function getAllLocalizedFields(
  record: LocalizedRecord,
  fieldNames: string[],
  locale: string
): Record<string, string | string[] | null> & { _localeUsed: string } {
  const result: Record<string, string | string[] | null> = {};
  for (const field of fieldNames) {
    const val = getLocalizedField(record, field, locale);
    result[field] = val;
  }
  return { ...result, _localeUsed: locale };
}

/**
 * Lay tat ca fields (string + array) cua 1 locale.
 * Dùng cho API response và admin form population.
 */
export function getTranslationsForLocale(
  record: LocalizedRecord,
  locale: string
): Record<string, string | string[]> {
  if (locale === "vi") {
    const base: Record<string, string | string[]> = {};
    for (const key of Object.keys(record)) {
      if (key === "translations" || key === "id") continue;
      const v = record[key];
      if (typeof v === "string" || Array.isArray(v)) base[key] = v;
    }
    return base;
  }

  return (record.translations?.[locale] ?? {}) as Record<string, string | string[]>;
}
```

### So sanh hai phuong an

| Tieu chi | Column-per-language (hien tai) | JSON Field (de xuat) |
|----------|--------------------------------|-----------------------|
| Cột i18n hiện tại | 57 cột + 10 arrays MISSING | Thay = 1 JSON field/model |
| Thêm ngôn ngữ mới | +57 cột + migration | 0 migration |
| Array field support | ⚠️ 10 arrays MISSING (code sẽ crash) | ✅ Tự động trong JSON |
| Admin translate tabs | 0/4 — cần xây từ đầu | 1 component cho tất cả |
| `SupportedLocale` | ❌ Không có | ✅ Có |
| Code complexity | LOCALE_SUFFIX hardcoded everywhere | Helper đơn giản |
| Migration risk | Cao (57 cột) | Thấp (chỉ thêm 1 field) |
| **Khuyến nghị** | ❌ | **✅** |

---

## 3) Phuong an trien khai — Structured Recovery + JSON Migration

> Thay vì 3 giai đoạn thuần JSON, phương án này chia thành **4 phase** để:
> 1. Fix gaps hiện tại (array columns MISSING, admin tabs chưa có, FE i18n chưa có)
> 2. Sau đó migrate sang JSON

### Overview 4 Phase

```
Phase 0: Fix Now — San pham loi ngay (0.5 ngày)
  → Fix 10 array columns MISSING trong schema (code crash khi access)
  → KHÔNG ảnh hưởng gì đến i18n migration plan

Phase 1: Admin Translate Tabs — Xây từ đầu 4 tabs (2-3 ngày)
  → ServicesTab, PortfolioTab, BlogTab, MembersTab
  → Thêm i18n fields vào Admin API endpoints

Phase 2: FE i18n System — Xây JSON i18n cho FE (2 ngày)
  → FE/src/i18n/ system + message files
  → Navbar/Footer/LandingPage wired

Phase 3: JSON Translation Migration — Migrate 4 models (3 ngày)
  → Schema: thêm `translations Json?` + migration script
  → Helper moi + update API endpoints
  → Cleanup old columns

Phase 4: SupportedLocale + Scale Infrastructure (2 ngày)
  → SupportedLocale model + admin locale management
  → Translation CLI + auto-translate draft
  → Cleanup columns + documentation
```

### Chi tiet tung phase

---

## Phase 0: Fix Critical Gaps — Array Columns Missing (0.5 ngày) ⚠️ URGENT

> **Tại sao làm trước:** Code đang gọi `featuresEn`, `technologiesEn`... nhưng schema không có → Prisma crash khi query. Không liên quan đến i18n plan — đây là bug cần fix NGAY.

| # | Task | File can sua | Effort |
|---|------|-------------|--------|
| 0.1 | Thêm `featuresEn`, `featuresJa`, `featuresKo`, `featuresZh` vào Service model | `prisma/schema.prisma` | 15 phút |
| 0.2 | Thêm `technologiesEn`, `technologiesJa`, `technologiesKo`, `technologiesZh` vào Service model | `prisma/schema.prisma` | 15 phút |
| 0.3 | Thêm `techStackEn`, `techStackJa`, `techStackKo`, `techStackZh` vào Project model | `prisma/schema.prisma` | 15 phút |
| 0.4 | Thêm `featuresEn`, `featuresJa`, `featuresKo`, `featuresZh` vào Project model | `prisma/schema.prisma` | 15 phút |
| 0.5 | Chạy `npx prisma migrate dev --name add_missing_i18n_array_columns` | — | 15 phút |
| 0.6 | Update seed data: thêm empty arrays cho existing records | `prisma/seed.ts` | 15 phút |
| 0.7 | Verify: `npx tsc --noEmit` pass | — | 15 phút |

**Schema additions:**
```prisma
// Service model — them sau features[]
featuresEn     String[]  @map("features_en")
featuresJa    String[]  @map("features_ja")
featuresKo    String[]  @map("features_ko")
featuresZh    String[]  @map("features_zh")
technologiesEn String[] @map("technologies_en")
technologiesJa String[] @map("technologies_ja")
technologiesKo String[] @map("technologies_ko")
technologiesZh String[] @map("technologies_zh")

// Project model — them sau features[]
techStackEn   String[]  @map("tech_stack_en")
techStackJa   String[]  @map("tech_stack_ja")
techStackKo   String[]  @map("tech_stack_ko")
techStackZh   String[]  @map("tech_stack_zh")
featuresEn    String[]  @map("features_en")
featuresJa    String[]  @map("features_ja")
featuresKo    String[]  @map("features_ko")
featuresZh    String[]  @map("features_zh")
```

**Exit criteria:** Schema compile OK, Prisma generate OK, tsc pass. 0 crashes khi API gọi các array fields.

---

## Phase 1: Admin Translate Tabs — Xây 4 Tabs (2-3 ngày)

> **Thực trạng:** CLAUDE.md ghi Phase 3 Admin CMS Translate Tabs ✅ complete, thực tế 0/4 tabs có translate UI. Cần xây hoàn toàn từ đầu.

### Phase 1.1: Admin API — Add i18n fields cho 4 models (0.5 ngày)

**BE:** Cập nhật 4 PUT/POST endpoints để nhận đầy đủ i18n fields.

| Endpoint | File | Fields can xử lý |
|---|---|---|
| `PUT /api/admin/services/[id]` | `src/app/api/admin/services/[id]/route.ts` | titleEn/Ja/Ko/Zh, shortDescEn/Ja/Ko/Zh, longDescEn/Ja/Ko/Zh, featuresEn/Ja/Ko/Zh, technologiesEn/Ja/Ko/Zh |
| `PUT /api/admin/projects/[id]` | `src/app/api/admin/projects/[id]/route.ts` | titleEn/Ja/Ko/Zh, descEn/Ja/Ko/Zh, resultsEn/Ja/Ko/Zh, techStackEn/Ja/Ko/Zh, featuresEn/Ja/Ko/Zh |
| `PUT /api/admin/team/[id]` | `src/app/api/admin/team/[id]/route.ts` | nameEn/Ja/Ko/Zh, roleEn/Ja/Ko/Zh, bioEn/Ja/Ko/Zh, shortBioEn/Ja/Ko/Zh |
| `PUT /api/admin/blog-posts/[id]` | `src/app/api/admin/blog-posts/[id]/route.ts` | titleEn/Ja/Ko/Zh, excerptEn/Ja/Ko/Zh, contentEn/Ja/Ko/Zh, seoTitleEn/Ja/Ko/Zh, seoDescEn/Ja/Ko/Zh |

### Phase 1.2: Shared TranslationEditor Component (0.5 ngày)

**FE:** Tạo component dùng chung cho tất cả 4 tabs.

```tsx
// FE/src/app/components/admin/TranslationEditor.tsx

interface FieldDef {
  key: string;
  label: string;        // Label tiếng Việt
  type: 'text' | 'textarea' | 'richtext' | 'array';
  placeholder?: string;
}

interface TranslationEditorProps {
  // Base values (VI — read-only reference)
  baseValues: Record<string, string | string[]>;
  // Current translations being edited
  translations: Record<string, Record<string, string | string[]>>;
  // Supported non-VI locales
  locales: Array<{ code: string; label: string; flag: string }>;
  // Fields definitions
  fields: FieldDef[];
  // Callback when translations change
  onChange: (translations: Record<string, Record<string, string | string[]>>) => void;
  // Whether to show base VI values (read-only)
  showBase?: boolean;
}

// Usage:
<TranslationEditor
  baseValues={currentService}       // VI values — read-only
  translations={service.translations ?? {}}  // EN/JA/KO/ZH
  locales={[
    { code: 'en', label: 'English',  flag: '🇬🇧' },
    { code: 'ja', label: '日本語',    flag: '🇯🇵' },
    { code: 'ko', label: '한국어',   flag: '🇰🇷' },
    { code: 'zh', label: '中文',     flag: '🇨🇳' },
  ]}
  fields={[
    { key: 'title',              label: 'Tiêu đề',    type: 'text'     },
    { key: 'shortDescription',   label: 'Mô tả ngắn', type: 'textarea'  },
    { key: 'longDescription',    label: 'Mô tả dài',  type: 'richtext' },
    { key: 'features',           label: 'Tính năng',  type: 'array'     },
  ]}
  onChange={(t) => setTranslations(t)}
/>
```

### Phase 1.3: Integrate vao 4 Admin Tabs (1-2 ngày)

| Tab | Changes | Effort |
|-----|---------|--------|
| **ServicesTab** | Thêm tab "Translate" vào `ServiceEditModal` | 3 giờ |
| **PortfolioTab** | Thêm tab "Translate" vào `ProjectEditModal` | 3 giờ |
| **BlogTab** | Thêm `content` field (richtext) + tab "Translate" vào `PostModal` | 4 giờ |
| **MembersTab** | Thêm tab "Translate" vào `MemberFormModal` | 3 giờ |

**ServicesTab changes:**
- Tab list: `basic | demo | content | translate` (currently `content` is empty)
- Tab `translate`: dùng `TranslationEditor` với fields: title, shortDescription, longDescription, features, technologies
- Lưu: gửi full i18n fields lên `PUT /api/admin/services/[id]`

**PortfolioTab changes:**
- Tab list: `basic | demo | content | translate`
- Tab `translate`: fields: title, description, results, techStack, features

**BlogTab changes:**
- Modal: thêm `content` textarea + tab "Translate"
- Tab `translate`: fields: title, excerpt, content, seoTitle, seoDesc

**MembersTab changes:**
- Form: thêm tab "Translate"
- Fields: name, role, bio, shortBio

### Phase 1 Exit Criteria

- [ ] 4/4 admin tabs có translate tab hoạt động
- [ ] Save translation → API persists → reload → values correct
- [ ] Fallback VI hoạt động (khi locale field = null → show VI)
- [ ] Lint + tsc + build pass

---

## Phase 2: FE i18n System (2 ngày)

> **Thực trạng:** CLAUDE.md Phase 1.5 ghi ✅ FE i18n System — thực tế files không tồn tại. Phải xây hoàn toàn.

### Phase 2.1: BE UI Messages — Fill Missing Keys (0.25 ngày)

| File | Missing keys | Action |
|---|---|---|
| `ja.json` | 12 keys | Translate missing keys |
| `ko.json` | 12 keys | Translate missing keys |
| `zh.json` | 12 keys | Translate missing keys |

### Phase 2.2: FE i18n JSON File Structure (0.25 ngày)

**Tạo FE message files** — 200 keys tối thiểu cho navigation, footer, common UI:

```
FE/src/i18n/
├── messages/
│   ├── vi.json     (~200 keys)
│   ├── en.json     (~200 keys)
│   ├── ja.json     (~200 keys)
│   ├── ko.json     (~200 keys)
│   └── zh.json     (~200 keys)
├── i18n.ts          # t(), namespace(), locale detection
├── useTranslation.ts # useI18n(), useLocale() hooks
├── I18nProvider.tsx  # Context provider wrapping app
└── index.ts         # Barrel export
```

**Key namespaces cho FE** (tương tự BE nhưng rút gọn):
```json
{
  "navigation": {
    "home": "Trang chủ",
    "services": "Dịch vụ",
    "portfolio": "Dự án",
    "team": "Đội ngũ",
    "academy": "Học viện",
    "blog": "Blog",
    "contact": "Liên hệ",
    "bookNow": "Đặt lịch ngay"
  },
  "footer": {
    "tagline": "Giải pháp số toàn diện",
    "rights": "© 2026 LOOP Solutions. Mọi quyền được bảo lưu."
  },
  "common": {
    "loading": "Đang tải...",
    "error": "Đã xảy ra lỗi",
    "empty": "Không có dữ liệu",
    "save": "Lưu",
    "cancel": "Hủy"
  },
  "services": { "title": "Dịch vụ của chúng tôi" },
  "portfolio": { "title": "Dự án của chúng tôi" },
  "team": { "title": "Đội ngũ của chúng tôi" },
  "academy": { "title": "Học viện" },
  "blog": { "title": "Blog" },
  "auth": { "login": "Đăng nhập", "logout": "Đăng xuất" }
}
```

### Phase 2.3: FE i18n Hooks + Provider (0.5 ngày)

```typescript
// FE/src/i18n/useTranslation.ts
export function useLocale(): string {
  return useLocaleStore((s) => s.locale);
}

export function useI18n() {
  const locale = useLocale();
  const messages = useI18nStore((s) => s.messages);
  const ns = useI18nStore((s) => s.namespace);

  function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let val: unknown = messages;
    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[k];
      } else {
        return key; // fallback: return key itself
      }
    }
    if (typeof val !== 'string') return key;

    if (params) {
      return val.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }
    return val;
  }

  return { t, locale, ns };
}
```

### Phase 2.4: Wire Navigation (1 ngày)

**Target files:**
- `Navbar.tsx` — nav links → `t('navigation.services')`
- `Footer.tsx` — footer content → `t('footer.tagline')`
- `LandingPage.tsx` — section headings → `t('services.title')`
- `ServicesPage.tsx` — page title → `t('services.title')`
- `PortfolioPage.tsx` — page title → `t('portfolio.title')`
- `AcademyPage.tsx` — page title → `t('academy.title')`

**Strategy:** Thay hardcoded strings bằng `useI18n().t()` theo namespace. **KHÔNG refactor toàn bộ page** — chỉ thay những strings đã hardcoded VI.

### Phase 2 Exit Criteria

- [ ] 5 locale message files tồn tại với ~200 keys mỗi file
- [ ] `useI18n().t()` hook hoạt động đúng
- [ ] Navbar/Footer/LandingPage wired → chuyển ngôn ngữ → UI update
- [ ] Fallback: missing key → trả về key string (không crash)
- [ ] Lint + tsc + build pass

---

## Phase 3: JSON Translation Migration (3 ngày)

> **Core migration:** Chuyển 4 models từ column-per-language sang `translations Json`.

### Phase 3.1: Schema Migration — Them `translations` Field (0.25 ngày)

```bash
cd d:/LOOP_COMPANY/LOOP
npx prisma migrate dev --name add_translations_json_field
```

**Schema changes — thêm sau mỗi model:**

```prisma
// Service model — them sau subtitle
translations Json? @default("{}")

// Project model — them sau tag
translations Json? @default("{}")

// BlogPost model — them sau seoDescZh
translations Json? @default("{}")

// TeamMember model — them sau quote
translations Json? @default("{}")
```

### Phase 3.2: Migration Script — Column → JSON (0.5 ngày)

```typescript
// scripts/migrate-translations.ts
// Chạy SAU migration, trước khi deploy

interface Locale { code: string; suffix: string; }
const LOCALES: Locale[] = [
  { code: 'en', suffix: 'En' },
  { code: 'ja', suffix: 'Ja' },
  { code: 'ko', suffix: 'Ko' },
  { code: 'zh', suffix: 'Zh' },
];

// Service fields to migrate
const SERVICE_FIELDS = [
  'title', 'shortDescription', 'longDescription',
  'subtitle', 'features', 'technologies',
];

async function migrateServiceTranslations() {
  const services = await prisma.service.findMany();
  let migrated = 0;

  for (const s of services) {
    const translations: Record<string, Record<string, string | string[]>> = {};

    for (const locale of LOCALES) {
      const localeData: Record<string, string | string[]> = {};

      for (const field of SERVICE_FIELDS) {
        const colName = `${field}${locale.suffix}` as keyof typeof s;
        const value = s[colName];
        if (value != null && (typeof value === 'string' ? value.length > 0 : (Array.isArray(value) && value.length > 0))) {
          localeData[field] = value as string | string[];
        }
      }

      if (Object.keys(localeData).length > 0) {
        translations[locale.code] = localeData;
      }
    }

    if (Object.keys(translations).length > 0) {
      await prisma.service.update({
        where: { id: s.id },
        data: { translations: JSON.stringify(translations) },
      });
      migrated++;
    }
  }

  console.log(`✅ Migrated ${migrated}/${services.length} Service records`);
}

// Tương tự cho: migrateProjectTranslations, migrateBlogPostTranslations, migrateTeamMemberTranslations
```

### Phase 3.3: Update Localization Helpers (0.5 ngày)

**File:** `src/lib/i18n/json-translation.ts` (NEW — thay thế logic trong `localization.ts`)

```typescript
// src/lib/i18n/json-translation.ts

import { LocalizedRecord } from './types';

export function getLocalizedField(
  record: LocalizedRecord,
  fieldName: string,
  locale: string
): string | null {
  if (locale === 'vi') return (record[fieldName] as string) ?? null;

  const json = record.translations;
  const translations = typeof json === 'string' ? JSON.parse(json) : json;

  const translated = translations?.[locale]?.[fieldName];
  if (typeof translated === 'string' && translated.length > 0) return translated;

  return (record[fieldName] as string) ?? null;
}

export function getLocalizedArray(
  record: LocalizedRecord,
  fieldName: string,
  locale: string
): string[] {
  if (locale === 'vi') return (record[fieldName] as string[]) ?? [];

  const json = record.translations;
  const translations = typeof json === 'string' ? JSON.parse(json) : json;

  const translated = translations?.[locale]?.[fieldName];
  if (Array.isArray(translated) && translated.length > 0) return translated as string[];

  return (record[fieldName] as string[]) ?? [];
}
```

**Dual-read fallback** (backward compatibility — đọc JSON TRƯỚC, fallback về columns):

```typescript
export function getLocalizedField(
  record: LocalizedRecord,
  fieldName: string,
  locale: string
): string | null {
  // 1. VI base
  if (locale === 'vi') return (record[fieldName] as string) ?? null;

  // 2. JSON field (new approach)
  const json = record.translations;
  const translations = typeof json === 'string' ? JSON.parse(json) : json;
  const jsonVal = translations?.[locale]?.[fieldName];
  if (typeof jsonVal === 'string' && jsonVal.length > 0) return jsonVal;

  // 3. Column fallback (old approach — for records not yet migrated)
  const suffix = { en: 'En', ja: 'Ja', ko: 'Ko', zh: 'Zh' }[locale];
  if (suffix) {
    const colVal = record[`${fieldName}${suffix}` as keyof LocalizedRecord];
    if (typeof colVal === 'string' && colVal.length > 0) return colVal;
  }

  // 4. VI base fallback
  return (record[fieldName] as string) ?? null;
}
```

### Phase 3.4: Update API Endpoints (0.75 ngày)

**Update 6 v1 endpoints** để dùng helper mới thay vì manual column access:

| Endpoint | File | Action |
|---|---|---|
| `GET /api/v1/services` | `src/app/api/v1/services/route.ts` | Dùng `getLocalizedField` thay vì manual `titleEn` |
| `GET /api/v1/projects` | `src/app/api/v1/projects/route.ts` | Dùng `getLocalizedField` |
| `GET /api/team` | `src/app/api/team/route.ts` | Dùng `mapLocalizedTeamMember` |
| `GET /api/blog-posts` | `src/app/api/blog-posts/route.ts` | Dùng `getLocalizedField` |
| `GET /api/services` | `src/app/api/services/route.ts` | Dùng `mapLocalizedService` |
| `GET /api/projects` | `src/app/api/projects/route.ts` | Dùng `mapLocalizedProject` |

### Phase 3.5: Update Admin PUT Endpoints (0.5 ngày)

Admin PUT endpoints nhận `translations` JSON thay vì từng cột riêng:

```typescript
// PUT /api/admin/services/[id]/route.ts

// Request body shape mới:
interface ServiceUpdateInput {
  title: string;
  shortDescription: string;
  longDescription?: string;
  features: string[];
  technologies: string[];
  subtitle?: string;
  translations?: string; // JSON string: { "en": {...}, "ja": {...} }
  // ... other fields (price, status, etc.)
}

// Save:
const { translations, ...rest } = body;
await prisma.service.update({
  where: { id },
  data: {
    ...rest,
    ...(translations && { translations: JSON.parse(translations) }),
  },
});
```

**Admin tabs update:**
- ServicesTab → gửi `translations` JSON thay vì từng field riêng
- PortfolioTab → tương tự
- BlogTab → tương tự
- MembersTab → tương tự

### Phase 3.6: Update FE API Services (0.25 ngày)

FE gọi admin PUT với shape mới:

```typescript
// FE/src/api/services.service.ts
async function updateService(id: string, data: ServiceUpdateDTO) {
  // Serialize translations to JSON string for API
  const payload = {
    ...data,
    translations: data.translations ? JSON.stringify(data.translations) : undefined,
  };
  return api.put(`/admin/services/${id}`, payload);
}
```

### Phase 3 Exit Criteria

- [ ] Migration script chạy thành công → tất cả records có data trong `translations` JSON
- [ ] 6/6 v1 API endpoints trả đúng data từ JSON field
- [ ] Admin tabs save/load translations đúng
- [ ] Fallback: old column data vẫn đọc được (dual-read active)
- [ ] 2-week observation: 0 regression trên production
- [ ] Lint + tsc + build pass

---

## Phase 4: SupportedLocale + Scale Infrastructure (2 ngày)

### Phase 4.1: SupportedLocale Model + API (0.5 ngày)

```prisma
model SupportedLocale {
  code       String   @id          // "vi", "en", "fr", "de"
  name       String                // "Vietnamese", "English", "French"
  nativeName String                // "Tiếng Việt", "English", "Français"
  flag       String                // "🇻🇳", "🇬🇧", "🇫🇷"
  isActive   Boolean  @default(true)
  isDefault  Boolean  @default(false)
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

```bash
npx prisma migrate dev --name add_supported_locale_model
```

**Admin locale management API:**
```
GET    /api/admin/locales          → list all SupportedLocale
POST   /api/admin/locales           → add new locale
PUT    /api/admin/locales/[code]    → update locale
DELETE /api/admin/locales/[code]    → remove locale (soft: isActive=false)
```

### Phase 4.2: Dynamic Locale Config trong FE (0.25 ngày)

FE sử dụng `SupportedLocale` thay vì hardcoded `SUPPORTED_LOCALES`:

```typescript
// FE/src/store/localeStore.ts
// Thay:
const SUPPORTED_LOCALES = ['vi', 'en', 'ja', 'ko', 'zh'];
// Bằng:
// Gọi GET /api/admin/locales → populate store
// Fallback về hardcoded array nếu API fail
```

### Phase 4.3: Translation CLI (0.5 ngày)

```bash
# Export all Service translations to JSON for external translation
npm run i18n:export -- --entity service --locale en --output ./translations/

# Output: translations/service-en.json
# Format: [{ "id": "clx...", "title": "...", "shortDescription": "..." }]

# Import translations back after professional translation
npm run i18n:import -- --entity service --locale fr --input ./translations/service-fr.json
```

### Phase 4.4: Auto-Translate Draft (0.25 ngày)

**Admin UI:** Nút "Auto-translate" trên translate tab:

```
1. Admin nhấn "Auto-translate to French"
2. → Gọi POST /api/admin/i18n/auto-translate với { entity, locale }
3. → BE gọi DeepL/Google Translate API
4. → Lưu vào translations.fr với flag: { "_draft": true }
5. → Admin review → approve → xóa "_draft" flag → published
```

### Phase 4.5: Cleanup Old Columns (0.25 ngày) ⚠️ Sau 2-week observation

```bash
# Chạy sau 2 tuần verify — KHÔNG chạy sớm
npx prisma migrate dev --name remove_old_i18n_columns
```

```sql
-- Migration SQL:
ALTER TABLE "Service" DROP COLUMN IF EXISTS "titleEn", DROP COLUMN IF EXISTS "titleJa", ...;
ALTER TABLE "Project" DROP COLUMN IF EXISTS "titleEn", ...;
-- (Tất cả column-per-language columns)
```

**Điều kiện chạy cleanup:**
- [ ] 2 tuần production với 0 regression từ dual-read
- [ ] 100% records đã migrate (JSON field có data)
- [ ] Backup production DB trước khi chạy

### Phase 4.6: Documentation (0.25 ngày)

- [ ] Cập nhật `fe-i18n-scale-plan.md` → Phase 4 marked complete
- [ ] Tạo `docs/I18N-RUNBOOK.md`:
  - Cách thêm ngôn ngữ mới (step-by-step)
  - Cách update translation
  - Cách xử lý missing translation
  - Glossary 5 ngôn ngữ

### Phase 4 Exit Criteria

- [ ] `SupportedLocale` model tồn tại + seeded với 5 locales hiện tại
- [ ] Admin có thể thêm/xóa/đổi ngôn ngữ từ UI — không cần code
- [ ] CLI export/import hoạt động
- [ ] Auto-translate draft workflow hoạt động
- [ ] Old columns đã xóa (hoặc có cleanup plan)
- [ ] I18N-RUNBOOK.md hoàn chỉnh

---

## 4) Quy trinh them ngon ngu moi SAU refactor (Phase 4 xong)

```
TRUOC (column-per-language):              SAU (JSON + SupportedLocale):
───────────────────────────────          ──────────────────────────────────────
1. Schema migration (57+ columns)         1. Admin UI → "Add Language"
2. Chạy migration                       2. Nhập: code/name/flag/sortOrder
3. Code change LOCALE_SUFFIX            3. Tạo messages/{locale}.json
4. Code change getLocalizedField        4. (Optional) Auto-translate draft
5. Xây translate tab 4 tabs           5. Admin review → publish
6. Sửa tất cả admin API endpoints       6. Done — 0 migration
7. QA 6-locale                         7. KHÔNG cần deploy FE/BE lần nào

Effort: ~5 ngày + migration risk        Effort: ~30 phút + thời gian dịch nội dung
```

---

## 5) Priority Matrix

| Phase | Business Value | Risk | Effort | Priority |
|-------|---------------|------|--------|----------|
| **Phase 0**: Fix array columns | **CRITICAL** — code crash khi access | Thấp | 0.5 ngày | 🔴 P0 |
| **Phase 1**: Admin Translate Tabs | Cao — translate workflow | Thấp | 2-3 ngày | 🟡 P1 |
| **Phase 2**: FE i18n System | Cao — 5-language FE pages | Thấp | 2 ngày | 🟡 P1 |
| **Phase 3**: JSON Migration | Cao — scale foundation | Trung bình | 3 ngày | 🟡 P1 |
| **Phase 4**: SupportedLocale + Scale | Trung bình — automation | Thấp | 2 ngày | 🟢 P2 |

---

## 6) Rui ro & Mitigation

| # | Rủi ro | Impact | Prob | Score | Mitigation |
|---|--------|--------|------|-------|-----------|
| R1 | Phase 0 (array columns) crash BE ngay bây giờ | High | High | 9 | Fix Phase 0 TRƯỚC TUẦN NÀY |
| R2 | Migration script miss records | High | Low | 3 | Chạy staging trước; dual-read fallback |
| R3 | Admin translate tabs ảnh hưởng UX admin hiện tại | Medium | Medium | 4 | Modal mới — không ảnh hưởng flow cũ |
| R4 | JSON field performance (very large content) | Low | Low | 1 | PostgreSQL jsonb native; content field per-content (BlogPost) |
| R5 | FE i18n system ảnh hưởng bundle size | Low | Medium | 2 | Lazy load message files per locale |
| R6 | Cleanup columns quá sớm → data loss | High | Low | 3 | 2-week observation mandatory |

---

## 7) Tong hop Effort

| Phase | Task | Effort | Owner |
|-------|------|--------|-------|
| **Phase 0** | Fix 10 missing array columns in schema | 0.5 ngày | BE |
| **Phase 1** | Admin translate tabs (4 tabs) | 2-3 ngày | FE + BE |
| | 1.1: Admin API i18n fields | 0.5 ngày | BE |
| | 1.2: TranslationEditor component | 0.5 ngày | FE |
| | 1.3: Integrate 4 tabs | 1-2 ngày | FE |
| **Phase 2** | FE i18n JSON system | 2 ngày | FE |
| | 2.1: Fill missing message keys | 0.25 ngày | Translator |
| | 2.2: Create FE message files | 0.25 ngày | FE |
| | 2.3: Hooks + Provider | 0.5 ngày | FE |
| | 2.4: Wire Navigation | 1 ngày | FE |
| **Phase 3** | JSON Translation Migration | 3 ngày | BE |
| | 3.1: Schema migration | 0.25 ngày | BE |
| | 3.2: Migration script | 0.5 ngày | BE |
| | 3.3: Update helpers | 0.5 ngày | BE |
| | 3.4: Update API endpoints | 0.75 ngày | BE |
| | 3.5: Update admin PUT | 0.5 ngày | BE |
| | 3.6: Update FE services | 0.25 ngày | FE |
| **Phase 4** | SupportedLocale + Scale | 2 ngày | BE + FE |
| **Total** | | **~10 ngày** | |

---

## 8) Dependencies & Prerequisites

### Trước khi bắt đầu

- [ ] Backup production DB (Neon snapshot) — **bắt buộc trước Phase 3**
- [ ] Verify Prisma 7 `Json` type hoạt động với Neon PostgreSQL
- [ ] Chốt 4 translatable models: Service, Project, BlogPost, TeamMember
- [ ] Review existing data: bao nhiêu records đã có bản dịch?

### Dependency map

```
Phase 0 (standalone — có thể bắt đầu ngay)
    ↓
Phase 1 (Admin tabs) ← Phụ thuộc: Phase 0 schema OK
    ↓
Phase 2 (FE i18n) ← Không phụ thuộc BE — chạy song song với Phase 1/3
    ↓
Phase 3 (JSON migration) ← Phụ thuộc: Phase 0 OK + 2-week Phase 1 observation
    ↓
Phase 4 (SupportedLocale) ← Phụ thuộc: Phase 3 complete
```

---

## 9) Tong hop translatable fields

### Service (7 fields)
- `title`, `shortDescription`, `longDescription`, `features` (array), `technologies` (array), `subtitle`

### Project (6 fields)
- `title`, `description`, `results`, `techStack` (array), `features` (array), `tag`

### BlogPost (5 fields)
- `title`, `content`, `excerpt`, `seoTitle`, `seoDesc`

### TeamMember (4 fields)
- `name`, `role`, `bio`, `shortBio`

**Tổng: 22 translatable fields across 4 models**

---

## 10) Migration Safety Protocol

### Buoc 1: Phase 0 — Fix array columns (standalone, non-breaking)
```bash
npx prisma migrate dev --name add_missing_i18n_array_columns
```
→ Thêm columns là additive (không drop gì) → LOW RISK

### Buoc 2: Phase 3 — Add JSON field (non-breaking)
```bash
npx prisma migrate dev --name add_translations_json_field
```
→ Thêm column với DEFAULT '{}' → LOW RISK, không mất data

### Buoc 3: Phase 3 — Run migration script (idempotent)
```bash
npx tsx scripts/migrate-translations.ts
```
→ Đọc old columns → ghi vào JSON → dual-read active

### Buoc 4: Phase 3 — Update API (dual-read active)
→ Helper đọc JSON trước → fallback columns → 100% backward compatible

### Buoc 5: Phase 4 — Verify (2-week observation)
→ Monitor: JSON field populated? Old columns still needed for fallback?
→ Nếu 100% records migrated → proceed to cleanup

### Buoc 6: Phase 4 — Cleanup old columns (optional, late)
```bash
npx prisma migrate dev --name remove_old_i18n_columns
```
→ Sau 2 tuần verify + backup → DROP columns

---

## 11) KPI do luong thanh cong

| Metric | Target hiện tại | Target sau refactor |
|--------|----------------|-------------------|
| Effort thêm ngôn ngữ mới | ~5 ngày + migration | < 4 giờ (không tính dịch) |
| Schema changes per ngôn ngữ | 1 migration | 0 migration |
| Admin translate tabs | 0/4 (chưa có) | 4/4 hoạt động |
| FE i18n system | Không có | ✅ Hoàn chỉnh |
| Array field support | ⚠️ Missing (crash) | ✅ Tự động |
| `SupportedLocale` model | ❌ Không có | ✅ Có |

---

## 12) Quick Wins tren duong

### Co the lam NGAY (khong phu thuoc gi)

**Fix Phase 0 — Array columns MISSING:**
```bash
cd d:/LOOP_COMPANY/LOOP
# Đọc schema, thêm 10 array columns missing
# Thêm vào Service: featuresEn/Ja/Ko/Zh, technologiesEn/Ja/Ko/Zh
# Thêm vào Project: techStackEn/Ja/Ko/Zh, featuresEn/Ja/Ko/Zh
npx prisma migrate dev --name add_missing_i18n_arrays
npx tsx prisma/seed.ts  # seed empty arrays for existing records
npx tsc --noEmit        # verify
```

**Fill 12 missing keys trong JA/KO/ZH message files:**
```bash
# Đọc vi.json vs ja.json → tìm 12 keys thiếu → translate
```

### Lệnh kiểm tra

```bash
# 1. Verify no array column crashes
cd d:/LOOP_COMPANY/LOOP
npx tsc --noEmit

# 2. Check BE build
npm run build

# 3. Check FE build
cd d:/LOOP_COMPANY/LOOP/FE
npx tsc --noEmit
npm run build

# 4. Verify API endpoints work with ?lang=
curl "http://localhost:3000/api/v1/services?lang=en"
curl "http://localhost:3000/api/v1/projects?lang=ja"
```

---

## 13) Comparison vs Old Plan

| Thành phần | Old Plan (2026-03-30) | New Plan (2026-03-31) |
|---|---|---|
| Admin translate tabs | Ghi "✅ complete" | **Thực tế: 0/4** — xây từ đầu |
| FE i18n system | Ghi "✅ Phase 1.5 complete" | **Thực tế: files không tồn tại** — xây từ đầu |
| Array columns | Không đề cập | **10 arrays MISSING** — code crash |
| SupportedLocale | Phase 3 | Phase 4 (sau JSON migration) |
| Total effort | 3 giai đoạn, 3 tuần | 4 phases, ~10 ngày |

---

## 14) Lien ket

- `.claude/rules/fe-i18n-implementation-plan.md` — i18n plan gốc (Phase 0-3)
- `.claude/rules/fe-roadmap.md` — FE Roadmap tổng thể
- `.claude/rules/fe-delivery-process.md` — Quy trình delivery
- `.claude/rules/fe-code-review-checklist.md` — Checklist review (i18n section)
- `src/lib/i18n/localization.ts` — Helper hiện tại (sẽ được mở rộng)
- `src/messages/*.json` — BE UI message files
