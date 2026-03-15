# PLAN — Hoàn tất dự án LOOP

> Cập nhật: 2026-03-15
> Trạng thái tổng quan: ~85% hoàn thành

---

## I. TÌNH TRẠNG HIỆN TẠI

### Đã hoàn thành
| Module | Chi tiết |
|--------|----------|
| **Landing pages** | Home, Services, Pricing, Portfolio, About, Contact — tất cả fetch từ DB, fallback mock |
| **Blog** | Sanity CMS đầy đủ, ISR 60s, bilingual (vi/en) |
| **Admin Dashboard** | 14 trang quản trị: Dashboard, Services, Projects, Team, Testimonials, Messages, Orders, Packages, Pricing Features, Quote Requests, Users, Roles, Audit Log, Settings |
| **Auth** | JWT login, middleware bảo vệ admin routes, RBAC |
| **SEO** | JsonLd, dynamic metadata, sitemap.xml, robots.txt, OG/Twitter cards |
| **i18n** | Vietnamese/English với next-intl, ServiceCard + ProjectCard đã có i18n |
| **Pricing** | 4 gói web, comparison table, hosting/domain, deployment handoff, calculator |
| **Contact Form** | Validation + submit API + DB storage |
| **Error Handling** | 404 page, loading states cho mỗi route |
| **Analytics** | Google Analytics, Vercel Analytics, Vercel Speed Insights, Tawk.to chat |
| **Footer** | Redesign chuyên nghiệp với highlights bar |

### Còn thiếu / Cần sửa
| # | Vấn đề | Mức ưu tiên |
|---|--------|-------------|
| 1 | Footer dịch vụ vẫn hardcode 6 links giả (web-dev, mobile-apps...) thay vì lấy từ DB services thật | **Cao** |
| 2 | Seed data cũ trong DB (giá USD, nội dung English) — cần re-seed sau khi đã fix seed.ts | **Cao** |
| 3 | Trang `/privacy` và `/terms` chưa tồn tại (Footer link tới) | **Cao** |
| 4 | Home page `stats`, `whyUs` chưa truyền i18n namespace đúng cho WhyUs | **Trung bình** |
| 5 | Service detail page vẫn hiển thị text English hardcode ("About this Service", "Ready to get started?") | **Trung bình** |
| 6 | Project detail page text hardcode English ("About this Project", "Key Features", etc.) | **Trung bình** |
| 7 | OG Image placeholder — chưa có file `/opengraph-image` thật | **Trung bình** |
| 8 | Thiếu `logo.png` trong `/public` (JsonLd reference) | **Trung bình** |
| 9 | Register page tồn tại nhưng chưa rõ flow đăng ký (chỉ admin invite?) | **Thấp** |
| 10 | Chưa có tests (unit, integration, e2e) | **Thấp** |
| 11 | `_legacy_spa/` vẫn còn — cần dọn dẹp | **Thấp** |

---

## II. KẾ HOẠCH TRIỂN KHAI

### Phase 1: Sửa lỗi dữ liệu & Footer (Ưu tiên cao)

**1.1 — Footer lấy services từ DB thay vì hardcode**
- File: `src/app/[locale]/layout.tsx` (dòng 118–128)
- Hiện tại dùng translated keys giả: `"serviceWeb"`, `"serviceMobile"`...
- Sửa: Fetch `getServices()` trong layout, map `slug` + `title` thật từ DB
- Fallback: giữ translated names nếu DB trống

**1.2 — Re-seed database**
- File: `prisma/seed.ts` (đã fix giá VND + nội dung tiếng Việt)
- Chạy: `npm run db:seed` để cập nhật DB với data mới
- Xác minh: kiểm tra giá hiển thị đúng trên frontend

**1.3 — Tạo trang Privacy Policy & Terms of Service**
- Tạo: `src/app/[locale]/privacy/page.tsx` + `privacy-page.tsx`
- Tạo: `src/app/[locale]/terms/page.tsx` + `terms-page.tsx`
- Nội dung: template chuẩn cho dịch vụ web agency, hỗ trợ vi/en
- SEO: metadata + canonical URL

---

### Phase 2: Hoàn thiện i18n cho detail pages (Ưu tiên trung bình)

**2.1 — Service Detail Page i18n**
- File: `src/app/[locale]/services/[id]/service-detail-page.tsx`
- Các text hardcode cần dịch:
  - "About this Service" / "Về dịch vụ này"
  - "What's Included" / "Bao gồm"
  - "Starting from" / "Giá từ"
  - "Delivery" / "Thời gian"
  - "Technologies Used" / "Công nghệ sử dụng"
  - "Ready to get started?" / "Sẵn sàng bắt đầu?"
  - "Request a Quote" / "Yêu cầu báo giá"
  - "Related Projects" / "Dự án liên quan"
- Thêm `useTranslations("ServiceDetailPage")` + keys trong messages

**2.2 — Project Detail Page i18n**
- File: `src/app/[locale]/portfolio/[id]/project-detail-page.tsx`
- Các text hardcode:
  - "About this Project" / "Về dự án này"
  - "Key Features" / "Tính năng nổi bật"
  - "Tech Stack"
  - "Client", "Year", "Results"
  - "Interested in a similar project?" / "Quan tâm dự án tương tự?"
  - "Explore our ... service" / "Khám phá dịch vụ..."
  - "View Service" / "Xem dịch vụ"
  - "Get a Quote" / "Nhận báo giá"
- Thêm `useTranslations("ProjectDetailPage")` + keys

**2.3 — Kiểm tra i18n toàn bộ**
- Duyệt lại tất cả pages ở locale `/en` để đảm bảo không còn Vietnamese hardcode
- Duyệt lại locale `/vi` để đảm bảo không còn English hardcode

---

### Phase 3: Assets & SEO nâng cao (Ưu tiên trung bình)

**3.1 — Tạo OG Image**
- Tạo `src/app/opengraph-image.tsx` (Next.js dynamic OG image)
- Hoặc đặt file static `public/opengraph-image.png` (1200×630)
- Thiết kế: logo LOOP + tagline + gradient background

**3.2 — Tạo logo.png**
- Export logo SVG → PNG cho `public/logo.png`
- Được reference trong JsonLd Organization schema

**3.3 — Verify manifest.json**
- Kiểm tra `public/manifest.json` có đủ icons, name, theme_color
- Đảm bảo PWA basics hoạt động

---

### Phase 4: Dọn dẹp & Tối ưu (Ưu tiên thấp)

**4.1 — Xóa `_legacy_spa/`**
- Thư mục legacy React SPA không còn sử dụng
- Xóa hoàn toàn để giảm kích thước repo

**4.2 — Review Register flow**
- Nếu chỉ admin invite → xóa trang `/register` + ẩn link
- Nếu cần public register → hoàn thiện API endpoint

**4.3 — Mock data cleanup**
- `src/data/mockData.ts` và `src/data/pricingPackages.ts` hiện chỉ dùng làm fallback
- Giữ nguyên nhưng thêm comment rõ ràng mục đích sử dụng
- Đảm bảo mock data đồng bộ với seed data

---

### Phase 5: Testing & Deployment (Ưu tiên thấp)

**5.1 — Cấu hình CI/CD**
- GitHub Actions: lint → type-check → build
- Auto deploy qua Vercel (đã có config sẵn)

**5.2 — Lighthouse audit**
- Chạy Lighthouse trên tất cả trang public
- Target: Performance 95+, Accessibility 95+, SEO 100
- Fix bất kỳ issues nào phát hiện

**5.3 — Testing (tùy chọn)**
- Vitest cho unit tests (utility functions, formatVND, queries)
- Playwright cho E2E (contact form submission, admin login flow)

---

## III. KIẾN TRÚC DỮ LIỆU

```
[Server Component page.tsx]
  ├─ fetch DB trực tiếp (Prisma) — KHÔNG qua API route
  ├─ generateMetadata() → dynamic <title>, <meta>
  ├─ generateStaticParams() → ISG cho detail pages
  ├─ JsonLd structured data từ real DB data
  ├─ revalidate / ISR khi cần
  └─ Pass data xuống Client Component (serialized props)
        └─ [Client Component] "use client"
            ├─ Nhận data qua props (đã fetch sẵn server-side)
            ├─ useTranslations() cho i18n text
            ├─ Animations (framer-motion)
            ├─ Interactive UI
            └─ KHÔNG fetch thêm data → zero client waterfall
```

---

## IV. THỨ TỰ TRIỂN KHAI

| # | Task | Ước tính | Phụ thuộc |
|---|------|----------|-----------|
| 1 | Footer lấy services từ DB | — | — |
| 2 | Re-seed database | — | #1 |
| 3 | Trang Privacy + Terms | — | — |
| 4 | Service Detail i18n | — | — |
| 5 | Project Detail i18n | — | — |
| 6 | OG Image + logo.png | — | — |
| 7 | Xóa _legacy_spa | — | — |
| 8 | Review Register flow | — | — |
| 9 | CI/CD + Lighthouse | — | #1–#6 |

**Ghi chú:** Task 1, 3, 4, 5, 6 có thể thực hiện song song.
