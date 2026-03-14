# PLAN: Landing Page 100% Dynamic Data (Real API / Database)

## Phân tích hiện trạng

### Đã hoạt động tốt (DB → Server Component → Client)
| Trang | Data source | SEO | Ghi chú |
|-------|-----------|-----|---------|
| `/` (Home) | `getServices()`, `getProjects()`, `getTestimonials()` | Server Component + JsonLd | Fallback mockData khi DB trống |
| `/about` | `getTeamMembers()` | Server Component + JsonLd | Fallback mockTeamMembers |
| `/services` | `getServices()` | Server Component + JsonLd + FAQSchema | OK |
| `/services/[id]` | `getServiceBySlug()` + `generateStaticParams()` | ISG + metadata dynamic | OK |
| `/portfolio` | `getProjects()` | Server Component | OK |
| `/portfolio/[id]` | `getProjectBySlug()` + `generateStaticParams()` | ISG + metadata dynamic | OK |
| `/pricing` | `getPricingPackagesData()` (5 tables) | ISR 5min + FAQSchema | OK |
| `/pricing/calculator` | API `/api/pricing/calculator` | Static metadata | OK |
| `/blog` | Sanity CMS (`postsQuery`) | ISR 60s | OK |
| `/blog/[slug]` | Sanity CMS (`postBySlugQuery`) | ISR 60s + BlogPosting JsonLd | OK |
| `/contact` | Form → `/api/contact` | Static JsonLd | Form gửi DB qua API |

### Còn HARDCODE cần chuyển sang dynamic
| Vị trí | Nội dung hardcode | Giải pháp |
|--------|-------------------|-----------|
| **Footer** (`Footer.tsx`) | `serviceLinks` (6 links), `socialLinks` (GitHub/Twitter/LinkedIn/Instagram URLs), email/phone/address | Lấy services từ DB + SiteSettings cho social/contact |
| **Navbar** (`Navbar.tsx`) | `navLinks` (6 links static) | Giữ static (navigation structure ít thay đổi) |
| **Contact Page** (`contact-page.tsx`) | `contactInfo` array: email, phone, address, working hours | Lấy từ SiteSettings |
| **Contact Page JsonLd** (`contact/page.tsx`) | telephone, email hardcode trong schema | Lấy từ SiteSettings |
| **Home Page** (`home-page.tsx`) | `stats` (150+, 98%, 50+, 8+), `whyUs` (4 items) | Stats → SiteSettings, WhyUs giữ i18n (content marketing) |
| **About Page** (`about-page.tsx`) | `stats` (same as home), `values` (4 items) | Stats → SiteSettings, Values giữ i18n |
| **Footer CTA/Brand** | Description text, CTA | Dùng i18n (OK - giữ nguyên) |

---

## Kế hoạch thực hiện

### Phase 1: SiteSettings Query + Admin Schema Update

**Bước 1.1** — Tạo server-side query `getSiteSettings()` trong `lib/db/queries.ts`
- Fetch tất cả SiteSettings từ DB, return dạng `Record<string, string>`
- Dùng trực tiếp trong Server Components (không qua API — tối ưu hiệu suất)

**Bước 1.2** — Thêm các key mới vào Admin Settings schema (`settings/page.tsx`)
- Group `stats`: `stat_projects`, `stat_satisfaction`, `stat_team_size`, `stat_years`
- Group `social`: thêm `twitter_url`, `instagram_url` (đã có facebook, linkedin, github, tiktok)
- Group `general`: thêm `working_hours`

### Phase 2: Dynamic Footer

**Bước 2.1** — Footer service links → lấy từ DB
- Chuyển Footer thành nhận props từ Server Component layout
- `PublicShell` (hoặc layout.tsx) fetch `getServices()` + `getSiteSettings()`
- Truyền services list + site settings xuống Footer
- Footer hiển thị top 6 services sorted by `sortOrder`

**Bước 2.2** — Footer social links + contact info → SiteSettings
- Truyền social URLs (facebook, linkedin, github, twitter, instagram) xuống Footer
- Truyền contact info (email, phone, address) xuống Footer
- Fallback hardcode values nếu settings trống

### Phase 3: Dynamic Contact Page

**Bước 3.1** — Contact page server component fetch SiteSettings
- `contact/page.tsx` (Server Component) → `getSiteSettings()`
- Pass contactInfo (email, phone, address, hours) xuống `ContactPage`
- Update JsonLd schema dùng real data thay vì hardcode

**Bước 3.2** — ContactPage component nhận props thay vì hardcode
- Thêm props interface cho contact info
- Render từ props, giữ fallback defaults

### Phase 4: Dynamic Stats (Home + About)

**Bước 4.1** — Home page truyền stats từ SiteSettings
- `page.tsx` fetch `getSiteSettings()` song song với services/projects/testimonials
- Extract stat values, pass xuống `HomePage`

**Bước 4.2** — About page tương tự
- `about/page.tsx` fetch `getSiteSettings()` cùng `getTeamMembers()`
- Pass stats xuống `AboutPage`

**Bước 4.3** — Update client components nhận stats props
- `HomePage` + `AboutPage`: nhận `stats` optional prop
- Hiển thị dynamic values thay vì hardcode "150+", "98%"...

---

## Tóm tắt kiến trúc SEO & Hiệu suất

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
            ├─ Animations (framer-motion)
            ├─ Interactive UI
            └─ KHÔNG fetch thêm data → zero client waterfall
```

**Đảm bảo:**
- 100% SSR/SSG → Google crawl được full content
- Zero client-side data fetching cho landing pages
- JsonLd structured data từ real database
- ISR cho pricing (5min), blog (60s)
- `generateStaticParams` cho service/project detail pages
- Tất cả nội dung thay đổi được từ Admin panel

---

## Thứ tự triển khai ước tính

1. **Phase 1** — SiteSettings query + Admin schema update
2. **Phase 2** — Dynamic Footer
3. **Phase 3** — Dynamic Contact Page
4. **Phase 4** — Dynamic Stats (Home + About)
5. Build & verify SSR output
