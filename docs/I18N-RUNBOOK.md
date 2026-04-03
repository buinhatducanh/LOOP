# I18N Runbook — LOOP Solutions

> **Version**: 1.1.0 · Updated: 2026-04-04
> **Scope**: All 5 locales (`vi`, `en`, `ja`, `ko`, `zh`) · Public pages + Admin CMS
> **Previous**: 2026-03-31 — v1.0 (Phases Fi–Fs complete)

---

## Tổng quan

LOOP có **2 hệ thống i18n riêng biệt**:

| | Public Pages (`src/app/[locale]/`) | Admin CMS (`src/app/admin/`) |
|---|---|---|
| **Framework** | `next-intl` (`useTranslations`) | Custom React Context (`useAdminTranslations`) |
| **Locale routing** | URL prefix `/vi/`, `/en/`, etc. | Cookie `NEXT_LOCALE` |
| **Locale files** | `src/i18n/messages/{vi,en,ja,ko,zh}.json` | `src/i18n/admin/messages/{vi,en}.json` |
| **Languages** | 5 (vi, en, ja, ko, zh) | 2 (vi, en) |

---

## 1. Cấu trúc thư mục

```
src/
├── i18n/
│   ├── messages/              # Public page translations (next-intl)
│   │   ├── vi.json            # Vietnamese — source of truth
│   │   ├── en.json            # English
│   │   ├── ja.json           # Japanese
│   │   ├── ko.json           # Korean
│   │   └── zh.json           # Simplified Chinese
│   ├── routing.ts             # next-intl locale config
│   ├── request.ts             # next-intl server config
│   └── admin/
│       ├── AdminI18nProvider.tsx   # React context provider
│       ├── useAdminTranslations.ts  # Hook export
│       ├── admin-t.ts              # Server-side helper
│       └── messages/
│           ├── vi.json         # Vietnamese
│           └── en.json         # English
```

---

## 2. Thêm string mới (Public Pages)

### 2.1 Luôn thêm vào `vi.json` TRƯỚC

VI là source of truth — tất cả các locale khác phải match keys với VI.

```json
{
  "newPage": {
    "title": "Trang mới",
    "subtitle": "Mô tả ngắn"
  }
}
```

### 2.2 Copy key → các locale khác

Cùng key, khác value:

| Key | vi | en | ja | ko | zh |
|-----|----|----|----|----|----|
| `common.save` | Lưu | Save | 保存 | 저장 | 保存 |
| `common.yes` | Có | Yes | はい | 예 | 是 |

### 2.3 Quy tắc ngôn ngữ

| Ngôn ngữ | Charset | Font | Lưu ý |
|-----------|---------|------|--------|
| **VI** (Vietnamese) | Latin + diacritics | `Noto Serif JP` | Dùng `đ` thay vì `d`, `ơ` thay vì `o` |
| **EN** (English) | Latin | `Inter`, `Cinzel` | Title Case cho menu labels |
| **JA** (Japanese) | Hiragana + Katakana + Kanji | `Noto Serif JP`, `Cinzel` | ❌ KHÔNG Cyrillic, VN diacritics, Korean, Chinese |
| **KO** (Korean) | Hangul | `Noto Serif JP`, `Inter` | ❌ KHÔNG Japanese Kanji, VN diacritics, Cyrillic |
| **ZH** (Simplified Chinese) | Simplified Hanzi | `Noto Serif JP`, `Inter` | ✅ Dùng Simplified (简体) — không Traditional (繁體) |

**Mixed-script bug phổ biến:**
```json
// ❌ SAI — mixed Japanese + Vietnamese
"heroDesc": "IronからDiamondまでの27人のメンバー。全員헌신적인 전문가입니다."

// ✅ ĐÚNG — pure Japanese
"heroDesc": "IronからDiamondまでの27人のメンバー。全員，真摯なプロフェッショナルです。"
```

### 2.4 Dùng trong component (Public Pages)

```typescript
// Public pages — dùng useTranslations từ next-intl
import { useTranslations } from "next-intl";

export default function MyPage() {
  const t = useTranslations("newPage");
  return <h1>{t("title")}</h1>;
}
```

### 2.5 Interpolation

```json
// vi.json
"orderCount": "{n} đơn hàng"
```

```typescript
// Component
t("orderCount", { n: 42 })  // → "42 đơn hàng"
```

---

## 3. Thêm string mới (Admin CMS)

Admin chỉ hỗ trợ **VI** và **EN** (2 locale).

### 3.1 Thêm vào `src/i18n/admin/messages/vi.json`

```json
{
  "orders": {
    "title": "Quản lý đơn hàng",
    "titleCount": "{n} đơn hàng",
    "formBtnSave": "Lưu thay đổi"
  }
}
```

### 3.2 Copy key → `en.json`

```json
{
  "orders": {
    "title": "Order Management",
    "titleCount": "{n} orders",
    "formBtnSave": "Save Changes"
  }
}
```

### 3.3 Dùng trong component

```typescript
// Admin pages — dùng custom hook
"use client";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";

export default function OrdersPage() {
  const { t } = useAdminTranslations();
  return <h2>{t("orders.title")}</h2>;
}
```

### 3.4 Server Components (Admin)

```typescript
import { getAdminTranslations } from "@/i18n/admin/admin-t";

export default async function SomePage() {
  const { t } = await getAdminTranslations();
  return <h2>{t("orders.title")}</h2>;
}
```

---

## 4. Namespace convention

### Public pages (`src/i18n/messages/`)

```
HomePage.*      → Home.tsx
Academy.*       → AcademyPage
BookingPage.*   → BookingWizard
Navigation.*    → Navbar.tsx
Footer.*        → Footer.tsx
seo.*           → Meta tags
landing.*       → LandingPage
team.*          → Home.tsx (team section)
errors.*        → Error boundaries
```

### Admin pages (`src/i18n/admin/messages/`)

```
sidebar.groups.* / sidebar.nav.*  → AdminSidebar.tsx
common.*                      → Reusable across all admin pages
kpis.*                        → Admin dashboard KPIs
orders.* / services.* / blog.* / etc. → Page-specific
topbar.*                      → AdminTopbar.tsx
settings.*                    → Settings page
```

---

## 5. String interpolation pattern

### Count interpolation
```json
"titleCount": "{n} đơn hàng"
```
```tsx
{t("orders.titleCount", { n: total })}
```

### Name interpolation
```json
"confirmDelete": "Xóa \"{name}\"?"
```
```tsx
{t("orders.confirmDelete", { name: customerName })}
```

### KHÔNG interpolate
- User input placeholders: `placeholder="Nhập email..."` — giữ nguyên hint
- Internal IDs: `"Mã đơn: #12345"` — dynamic, không cần translate
- Code/markdown content: code snippets, URLs, slugs

---

## 6. Translation workflow

```
Developer thêm feature
  → vi.json → thêm key + value (VI)
  → Dùng t("namespace.key") trong component
  → npx tsc --noEmit ✅

Translator thêm locale khác
  → Mở locale file
  → Copy key từ vi.json
  → Translate VALUE giữ nguyên KEY
  → Tuân thủ quy tắc ngôn ngữ (Section 2.3)

Review
  → npx tsc --noEmit ✅
  → Kiểm tra mixed-script
  → Verify locale switcher trên dev server
```

---

## 7. Locale switcher

### Public pages (next-intl)

```typescript
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

// LocaleSwitcher component
routing.locales.forEach(locale => {
  router.replace(pathname, { locale }); // → /vi/..., /en/...
});
```

### Admin pages (AdminI18nProvider)

```typescript
const { locale, setLocale } = useAdminTranslations();
setLocale("en"); // → document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000"
```

---

## 8. Known issues & fixes (2026-04-04)

| Issue | File | Fix |
|-------|------|-----|
| JA mixed VN (헌신적인) | `ja.json:654` | → 真摯な |
| JA Chinese char (不接受) | `ja.json:668` | → 就業不可 |
| JA "的人才" | `ja.json:663` | → 才能 |
| JA "ホールオブ Fame" | `ja.json:632,660` | → ホール・オブ・フェーム |
| KO "저희는" vs "우리는" | `ko.json:741` | → Polite form ✅ |
| ZH all Simplified Chinese | `zh.json` | → Verified clean |

---

## 9. Thêm locale mới

1. Tạo `src/i18n/messages/{new}.json` — copy structure từ `vi.json`
2. Translate tất cả VALUE (giữ nguyên KEY)
3. Thêm vào `src/i18n/routing.ts`: `locales: ["vi", "en", "ja", "ko", "zh", "{new}"]`
4. Thêm locale switcher option trong Navbar
5. Chạy `npx tsc --noEmit` ✅

---

## 10. Quick Reference

```
Thêm text mới?
  1. vi.json → key + value (VI)
  2. en.json → cùng key, translate VALUE
  3. ja/ko/zh → translate (script rules)

Sửa text?
  1. Tìm trong vi.json → sửa VI
  2. Copy change sang EN, JA, KO, ZH

Lỗi mixed-script?
  JA: ❌ Cyrillic, VN diacritics, Korean, Chinese
  KO: ❌ Japanese Kanji, VN diacritics, Cyrillic
  ZH: ❌ Traditional (繁體)

Component mới?
  Public → useTranslations("namespace")
  Admin → useAdminTranslations() → t("namespace.key")
```