# I18N Runbook — LOOP Solutions

> **Mục đích:** Hướng dẫn vận hành i18n cho 5 ngôn ngữ (VI/EN/JA/KO/ZH).
> **Cập nhật:** 2026-03-31 (All phases complete — docs aligned with FE-BE-INTEGRATION-STATUS.md)

---

## 1) Tổng quan kiến trúc

### Ngôn ngữ được hỗ trợ

| Locale | Code | Font | Strategy |
|--------|------|------|----------|
| Tiếng Việt | `vi` | default | pre-render |
| English | `en` | default | pre-render |
| 日本語 | `ja` | Noto Sans JP | SSR (lazy) |
| 한국어 | `ko` | Noto Sans KR | SSR (lazy) |
| 中文 | `zh` | Noto Sans SC | SSR (lazy) |

### URL pattern
- `/vi/...` — Tiếng Việt (mặc định)
- `/en/...` — English
- `/ja/...` — 日本語
- `/ko/...` — 한국어
- `/zh/...` — 中文

---

## 2) Thêm ngôn ngữ mới (step-by-step)

### Bước 1 — Cập nhật routing
```typescript
// src/i18n/routing.ts
export const locales = ['vi', 'en', 'ja', 'ko', 'zh'] as const;
// Thêm locale mới vào đây
export type Locale = (typeof locales)[number];
```

### Bước 2 — Thêm message file
```bash
# Tạo file messages mới (copy từ en.json làm baseline)
cp src/messages/en.json src/messages/THREE_LETTER_CODE.json
```

### Bước 3 — Cập nhật middleware
```typescript
// src/middleware.ts
// Thêm locale vào danh sách supported
```

### Bước 4 — Cập nhật font loading
```typescript
// src/lib/fonts.ts
// Thêm lazy load cho font mới
```

### Bước 5 — Thêm font preload cho SEO
```typescript
// src/app/[locale]/layout.tsx
// Thêm <link rel="preload"> cho font
```

### Bước 6 — Cập nhật sitemap + hreflang
- Sitemap tự động sinh cho tất cả locales
- Kiểm tra `<link rel="alternate" hreflang>` trên mỗi page

### Bước 7 — Cập nhật docs
- [ ] CLAUDE.md — thêm locale vào danh sách
- [ ] I18N-STATUS.md — cập nhật coverage
- [ ] I18N-RUNBOOK.md — ghi nhận locale mới

---

## 3) Cập nhật translation

### Cập nhật UI strings (message files)
```bash
# Message files location
src/messages/vi.json
src/messages/en.json
src/messages/ja.json
src/messages/ko.json
src/messages/zh.json
```

**Quy tắc:**
- VI và EN là source of truth — cập nhật 2 file này trước
- JA/KO/ZH: dùng AI-assisted translation → human review → merge
- Không merge nếu thiếu key (Next-intl fallback về source locale)
- Key mới = phải có value cho tất cả 5 locales trước khi release

### Workflow khuyến nghị
1. Thêm/chỉnh sửa key trong `vi.json` + `en.json`
2. Chạy script extract → sync sang JA/KO/ZH (DeepL/Claude assisted)
3. Human review JA/KO/ZH
4. PR với diff đầy đủ 5 files

### Kiểm tra translation coverage
```bash
# Build sẽ warn nếu có key không khớp
npm run build

# Hoặc check thủ công
diff <(jq -r 'keys[]' src/messages/vi.json | sort) \
     <(jq -r 'keys[]' src/messages/en.json | sort)
```

---

## 4) Quản lý content CMS (Admin)

### Các trường i18n trong Admin

#### Services (dịch vụ)
- `title` — Tiếng Việt (source)
- `titleEn`, `titleJa`, `titleKo`, `titleZh` — bản dịch
- `shortDescription` / `shortDescriptionEn/Ja/Ko/Zh`

#### Portfolio (dự án)
- `title` / `titleEn/Ja/Ko/Zh`
- `tag` / `tagEn/Ja/Ko/Zh`
- `description` (challenge) / `descriptionEn/Ja/Ko/Zh`
- `results` / `resultsEn/Ja/Ko/Zh`
- `solution` / `solutionEn/Ja/Ko/Zh`

#### Blog Posts
- `title` / `titleEn/Ja/Ko/Zh`
- `content` / `contentEn/Ja/Ko/Zh`

#### Team Members
- `name` / `nameEn/Ja/Ko/Zh`
- `role` / `roleEn/Ja/Ko/Zh`
- `bio` / `bioEn/Ja/Ko/Zh`
- `shortBio` / `shortBioEn/Ja/Ko/Zh`

### Fallback strategy
Nếu trường dịch tương ứng để trống → hệ thống tự động hiển thị **Tiếng Việt** (vi).

**Điều kiện trigger fallback:**
```typescript
// Backend: getLocalizedField() trong src/lib/i18n/localization.ts
// Nếu field vi = null/undefined → fallback vào trường gốc
```

### Admin translate tab workflow
1. Admin mở tab **Dịch thuật** trong modal chỉnh sửa
2. Chọn locale (EN/JA/KO/ZH)
3. Nhập bản dịch cho từng trường
4. Click **Lưu bản dịch** → gọi `PUT /api/admin/{resource}/[id]`
5. User website tự động nhận nội dung mới (không cần deploy)

---

## 5) Monitoring translation quality

### Metrics cần theo dõi

| Metric | Target | Alert threshold |
|--------|--------|---------------|
| Translation coverage (JA/KO/ZH) | >= 90% | < 70% |
| Missing key count | 0 | > 5 |
| Build warnings | 0 | any |

### Công thức coverage
```
Coverage = (Số trường có nội dung / Tổng số trường i18n) × 100%
```

### Dashboard
- Kiểm tra **Admin → Translate tab** → Coverage badge trên mỗi item
- Coverage badge màu xanh = đã fill đầy đủ, màu cam = thiếu

---

## 6) Xử lý missing translation

### Khi user truy cập page không có translation
1. **Backend fallback:** `getLocalizedField()` trả về giá trị VI
2. **Frontend fallback:** UI strings fallback về `vi.json` key
3. **Không crash** — site vẫn render được

### Fast-fix missing translation (hotfix)
1.定位 thiếu key: mở **Admin → Translate tab** của item liên quan
2. Nhập nội dung cho locale thiếu
3. Save → xác nhận user site cập nhật ngay

---

## 7) API i18n reference

### Public APIs với `?lang=` param
```
GET /api/services?lang=vi|en|ja|ko|zh
GET /api/services/[slug]?lang=vi|en|ja|ko|zh
GET /api/projects?lang=vi|en|ja|ko|zh
GET /api/projects/[slug]?lang=vi|en|ja|ko|zh
GET /api/team?lang=vi|en|ja|ko|zh
GET /api/team/[slug]?lang=vi|en|ja|ko|zh
GET /api/testimonials?lang=vi|en|ja|ko|zh
GET /api/expertises?lang=vi|en|ja|ko|zh
GET /api/blog-posts?lang=vi|en|ja|ko|zh
```

### Backend helpers
```typescript
// src/lib/i18n/localization.ts
getLocalizedField(record, fieldName, locale)
// → Trả về localized field hoặc VI fallback

parseLocaleParam(searchParams)
// → Trích xuất locale từ query params, default = 'vi'
```

---

## 8) Glossary (key terms)

| VI | EN | JA | KO | ZH |
|----|----|----|----|-----|
| Dịch vụ | Services | サービス | 서비스 | 服务 |
| Dự án | Projects | プロジェクト | 프로젝트 | 项目 |
| Bài viết | Blog Posts | ブログ | 블로그 | 博客 |
| Đội ngũ | Team | チーム | 팀 | 团队 |
| Giá | Pricing | 料金 | 가격 | 价格 |
| Liên hệ | Contact | お問い合わせ | 연락처 | 联系我们 |
| Chính sách bảo mật | Privacy Policy | プライバシーポリシー | 개인정보 처리방침 | 隐私政策 |
| Điều khoản sử dụng | Terms of Service | 利用規約 | 이용약관 | 服务条款 |

---

## 9) Troubleshooting

### Symptom: Page render tiếng Anh thay vì tiếng Việt
- Nguyên nhân: Cookie `NEXT_LOCALE=en`
- Fix: Xóa cookie → reload page

### Symptom: Font CJK không load
- Nguyên nhân: Font file chưa được generate hoặc lazy load chưa trigger
- Fix: Kiểm tra `src/lib/fonts.ts` lazy loading config

### Symptom: hreflang tags sai
- Nguyên nhân: Middleware chưa detect đúng locale
- Fix: Kiểm tra `src/middleware.ts` locale detection order

### Symptom: Translation tab không hiển thị coverage đúng
- Nguyên nhân: State chưa sync sau khi save
- Fix: Refresh page → kiểm tra API response

---

## 10) Quick reference commands

```bash
# Check build
npm run build

# Type check
npx tsc --noEmit

# Verify all locales have same keys
comm -12 <(jq -r 'keys[]' src/messages/vi.json | sort) \
          <(jq -r 'keys[]' src/messages/en.json | sort) | wc -l

# Test API locale
curl "http://localhost:3000/api/services?lang=ja"
curl "http://localhost:3000/api/projects?lang=ko"
```
