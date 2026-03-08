# KẾ HOẠCH PHÁT TRIỂN HOÀN THIỆN HỆ THỐNG LOOP
# Chiến lược SEO Top 1 Google + Migration Next.js + Song ngữ Việt-Anh

---

## PHÂN TÍCH HIỆN TRẠNG

### Tech Stack hiện tại
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| React | 18 | UI Framework |
| Vite | SPA mode | Build tool (KHÔNG có SSR) |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | v4 | Styling |
| React Router | v7 | Client-side routing |
| Radix UI (shadcn/ui) | Latest | UI Components |
| Motion (Framer Motion) | Latest | Animations |

### Các trang hiện có
- `/` - Trang chủ (Hero, Stats, Services, Portfolio, Testimonials, CTA)
- `/services` - Danh sách dịch vụ (5 dịch vụ)
- `/services/:id` - Chi tiết dịch vụ
- `/portfolio` - Danh mục dự án (5 dự án)
- `/portfolio/:id` - Chi tiết dự án
- `/pricing` - Bảng giá (4 gói: Basic/Standard/Premium/Enterprise)
- `/about` - Giới thiệu
- `/contact` - Liên hệ
- `/login`, `/register` - Xác thực
- `/admin/*` - Quản trị (Dashboard, Projects, Services, Customers, Messages, Settings, Accounts)

### VẤN ĐỀ NGHIÊM TRỌNG CẦN KHẮC PHỤC

| # | Vấn đề | Mức độ | Ảnh hưởng SEO |
|---|---|---|---|
| 1 | **SPA Client-Side Rendering** - HTML chỉ có `<div id="root"></div>`, Google crawler không thấy nội dung | CRITICAL | Google không index được nội dung |
| 2 | **Title = "Web Agency Website Prototype"** - không có brand LOOP | CRITICAL | Mất hoàn toàn keyword ranking |
| 3 | **Không có meta description** trên bất kỳ trang nào | CRITICAL | CTR trên SERP rất thấp |
| 4 | **Không có Open Graph / Twitter Card tags** | HIGH | Chia sẻ trên social media không có preview |
| 5 | **Không có sitemap.xml** | HIGH | Google không biết cấu trúc trang |
| 6 | **Không có robots.txt** | HIGH | Không kiểm soát được crawl behavior |
| 7 | **Không có Structured Data (JSON-LD)** | HIGH | Mất rich snippets trên Google |
| 8 | **Không có blog/content marketing** | HIGH | Không có fresh content cho Google |
| 9 | **Không có i18n** - Chỉ tiếng Anh, không có tiếng Việt | HIGH | Mất thị trường Việt Nam |
| 10 | **Branding sai** - Code ghi "NexaWeb", công ty là "LOOP" | MEDIUM | Brand inconsistency |
| 11 | **Không có image optimization** (alt text, WebP, lazy load) | MEDIUM | Core Web Vitals kém |
| 12 | **Không có canonical URLs** | MEDIUM | Duplicate content risk |
| 13 | **Không có breadcrumbs** | MEDIUM | Mất navigation schema |
| 14 | **Không có trang 404** | LOW | UX kém khi URL sai |
| 15 | **Không có analytics** (GA4, Search Console) | LOW | Không đo lường được hiệu quả |

---

## KẾ HOẠCH TRIỂN KHAI CHI TIẾT

---

### PHASE 1: MIGRATION NEXT.JS + SEO FOUNDATION
**Mức độ ưu tiên: CRITICAL | Thời gian ước tính: 2-3 tuần**

#### 1.1 Khởi tạo dự án Next.js 15 App Router

**Tạo project mới:**
```
next-loop/
├── app/
│   ├── [locale]/                    # i18n dynamic segment
│   │   ├── layout.tsx               # Root layout với metadata
│   │   ├── page.tsx                 # Home page (SSG)
│   │   ├── services/
│   │   │   ├── page.tsx             # Services listing (SSG)
│   │   │   └── [id]/page.tsx        # Service detail (SSG)
│   │   ├── portfolio/
│   │   │   ├── page.tsx             # Portfolio listing (SSG)
│   │   │   └── [id]/page.tsx        # Project detail (SSG)
│   │   ├── pricing/page.tsx         # Pricing (SSG)
│   │   ├── about/page.tsx           # About (SSG)
│   │   ├── contact/page.tsx         # Contact (SSR - form submission)
│   │   ├── blog/
│   │   │   ├── page.tsx             # Blog listing (ISR)
│   │   │   ├── [slug]/page.tsx      # Blog article (ISR)
│   │   │   └── category/[cat]/page.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── admin/                       # Admin (no locale, no SSR needed)
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard
│   │   ├── projects/page.tsx
│   │   ├── services/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── settings/page.tsx
│   │   └── accounts/page.tsx
│   ├── sitemap.ts                   # Dynamic sitemap generation
│   ├── robots.ts                    # Dynamic robots.txt
│   └── not-found.tsx                # 404 page
├── components/
│   ├── ui/                          # shadcn/ui (giữ nguyên)
│   ├── layout/
│   │   ├── Navbar.tsx               # Migrate từ hiện tại
│   │   └── Footer.tsx               # Migrate từ hiện tại
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── StatsSection.tsx
│   │   ├── ServicesPreview.tsx
│   │   ├── PortfolioPreview.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── CTASection.tsx
│   ├── cards/
│   │   ├── ServiceCard.tsx
│   │   ├── ProjectCard.tsx
│   │   └── PricingCard.tsx
│   ├── forms/
│   │   └── ContactForm.tsx
│   ├── seo/
│   │   ├── JsonLd.tsx               # MỚI - Structured data component
│   │   └── Breadcrumbs.tsx          # MỚI - Breadcrumb component
│   └── shared/
│       ├── HeroCanvas.tsx
│       └── ImageWithFallback.tsx
├── lib/
│   ├── sanity/                      # Headless CMS
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── schemas/
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── routing.ts
│   └── utils.ts
├── messages/                        # i18n translations
│   ├── vi.json                      # Tiếng Việt
│   └── en.json                      # English
├── data/
│   └── mockData.ts                  # Giữ tạm, migrate dần sang CMS
├── contexts/
│   └── AuthContext.tsx
├── styles/
│   ├── globals.css
│   ├── fonts.css
│   └── theme.css
├── public/
│   ├── images/                      # Optimized local images
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── og-image.jpg                 # Default OG image
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

**Dependencies mới cần thêm:**
```json
{
  "dependencies": {
    "next": "^15.x",
    "next-intl": "^3.x",
    "@sanity/client": "^6.x",
    "next-sanity": "^9.x",
    "next-sitemap": "^4.x",
    "@vercel/analytics": "^1.x",
    "schema-dts": "^1.x"
  }
}
```

**Giữ nguyên (không cần thay đổi):**
- Tất cả shadcn/ui components trong `components/ui/`
- Tailwind CSS v4 configuration
- Motion (Framer Motion) animations
- AuthContext logic
- Admin panel components (chỉ đổi routing)

#### 1.2 Metadata API cho mọi trang

**File: `app/[locale]/layout.tsx`**
```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://loop.vn'),
  title: {
    default: 'LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp',
    template: '%s | LOOP'
  },
  description: 'LOOP - Công ty thiết kế website thương mại, ứng dụng di động, phần mềm quản lý doanh nghiệp. Tối ưu SEO, hiệu suất cao, hỗ trợ 24/7.',
  keywords: ['thiết kế website', 'làm website', 'website thương mại điện tử', 'ứng dụng di động', 'phần mềm quản lý'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    alternateLocale: 'en_US',
    siteName: 'LOOP',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@loop_vn',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: {
    canonical: 'https://loop.vn',
    languages: { 'vi': '/vi', 'en': '/en' },
  },
};
```

**Metadata cho từng trang cụ thể:**

| Trang | Title (VI) | Description (VI) |
|---|---|---|
| Home | LOOP - Thiết kế Website & App chuyên nghiệp | Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý. Cam kết SEO top Google, hiệu suất 95+. |
| Services | Dịch vụ thiết kế Website \| LOOP | Dịch vụ thiết kế website doanh nghiệp, thương mại điện tử, landing page, ứng dụng web tùy chỉnh. Giá từ $499. |
| Service Detail | {service.title} - Thiết kế {type} \| LOOP | Dynamic per service |
| Portfolio | Dự án đã thực hiện \| LOOP | Xem các dự án website, ứng dụng web đã hoàn thành. 150+ dự án, 98% khách hàng hài lòng. |
| Pricing | Bảng giá thiết kế Website \| LOOP | Bảng giá dịch vụ thiết kế website LOOP. Gói Basic từ $499, Standard $999, Premium $1999. |
| About | Về chúng tôi \| LOOP | LOOP - Đội ngũ 50+ chuyên gia, 8+ năm kinh nghiệm thiết kế website và ứng dụng cho doanh nghiệp. |
| Contact | Liên hệ \| LOOP | Liên hệ LOOP để nhận tư vấn miễn phí. Hotline: xxx, Email: hello@loop.vn |
| Blog | Blog công nghệ \| LOOP | Chia sẻ kiến thức thiết kế web, SEO, marketing online, xu hướng công nghệ mới nhất. |

#### 1.3 Structured Data (JSON-LD)

**Component `components/seo/JsonLd.tsx`:**

Schema cần triển khai cho từng trang:

| Trang | Schema Type | Mục đích |
|---|---|---|
| Tất cả trang | `Organization` | Thông tin công ty LOOP |
| Home | `WebSite` + `SearchAction` | Sitelinks search box trên Google |
| Services | `ItemList` + `Service` | Rich snippets cho dịch vụ |
| Service Detail | `Service` + `FAQPage` | FAQ rich result |
| Portfolio | `ItemList` | Danh sách dự án |
| Project Detail | `CreativeWork` | Thông tin dự án |
| Pricing | `Product` + `Offer` | Hiển thị giá trên Google |
| About | `AboutPage` + `Organization` | Knowledge panel |
| Contact | `ContactPage` + `LocalBusiness` | Local SEO |
| Blog | `Blog` + `BlogPosting` | Article rich results |
| Mọi trang | `BreadcrumbList` | Breadcrumb navigation |

**Ví dụ Organization schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LOOP",
  "url": "https://loop.vn",
  "logo": "https://loop.vn/logo.png",
  "description": "Công ty thiết kế website và ứng dụng chuyên nghiệp",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "VN"
  },
  "sameAs": ["https://facebook.com/loop.vn", "https://linkedin.com/company/loop-vn"]
}
```

#### 1.4 Sitemap & Robots

**File: `app/sitemap.ts`**
- Tự động generate từ tất cả pages
- Bao gồm blog posts từ CMS
- Priority: Home (1.0) > Services (0.9) > Blog (0.8) > Portfolio (0.7) > Others (0.6)
- changeFrequency: Blog (weekly), Services (monthly), Others (monthly)

**File: `app/robots.ts`**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /login
Disallow: /register
Sitemap: https://loop.vn/sitemap.xml
```

#### 1.5 Rebranding NexaWeb → LOOP

Các file cần thay đổi:
- `components/layout/Navbar.tsx` - Logo & brand name
- `components/layout/Footer.tsx` - Brand name, copyright, contact info
- `app/[locale]/layout.tsx` - Metadata
- `data/mockData.ts` - Testimonials (thay "NexaWeb" → "LOOP")
- Tất cả pages có mention "NexaWeb"

---

### PHASE 2: I18N - SONG NGỮ VIỆT-ANH
**Mức độ ưu tiên: HIGH | Thời gian ước tính: 1-2 tuần**

#### 2.1 Cài đặt next-intl

**Cấu trúc URL:**
```
https://loop.vn/vi/           → Trang chủ (Tiếng Việt - mặc định)
https://loop.vn/vi/dich-vu    → Dịch vụ
https://loop.vn/vi/du-an      → Dự án
https://loop.vn/vi/bang-gia   → Bảng giá
https://loop.vn/vi/ve-chung-toi → Giới thiệu
https://loop.vn/vi/lien-he    → Liên hệ
https://loop.vn/vi/blog       → Blog

https://loop.vn/en/           → Home (English)
https://loop.vn/en/services   → Services
https://loop.vn/en/portfolio  → Portfolio
...
```

#### 2.2 File dịch thuật

**`messages/vi.json`** (ví dụ):
```json
{
  "nav": {
    "home": "Trang chủ",
    "services": "Dịch vụ",
    "portfolio": "Dự án",
    "pricing": "Bảng giá",
    "about": "Về chúng tôi",
    "contact": "Liên hệ",
    "blog": "Blog",
    "getQuote": "Nhận báo giá"
  },
  "hero": {
    "badge": "Công ty phát triển web chuyên nghiệp",
    "title": "Thiết kế Website chuyên nghiệp cho",
    "titleHighlight1": "Doanh nghiệp",
    "titleHighlight2": "Chi nhánh",
    "description": "Chúng tôi xây dựng trải nghiệm số cao cấp — từ website doanh nghiệp, hệ thống chi nhánh đến nền tảng thương mại điện tử và ứng dụng web tùy chỉnh."
  },
  "services": {
    "businessWebsite": {
      "title": "Website Doanh nghiệp",
      "shortDescription": "Website chuyên nghiệp, tối ưu chuyển đổi, xây dựng thương hiệu và tăng trưởng doanh thu."
    }
  }
}
```

#### 2.3 Hreflang Tags

Tự động thêm vào `<head>` mỗi trang:
```html
<link rel="alternate" hreflang="vi" href="https://loop.vn/vi/dich-vu" />
<link rel="alternate" hreflang="en" href="https://loop.vn/en/services" />
<link rel="alternate" hreflang="x-default" href="https://loop.vn/vi/dich-vu" />
```

#### 2.4 Vietnamese URL Slugs

| English URL | Vietnamese URL |
|---|---|
| `/en/services` | `/vi/dich-vu` |
| `/en/services/business-website` | `/vi/dich-vu/website-doanh-nghiep` |
| `/en/services/ecommerce-website` | `/vi/dich-vu/website-thuong-mai-dien-tu` |
| `/en/portfolio` | `/vi/du-an` |
| `/en/pricing` | `/vi/bang-gia` |
| `/en/about` | `/vi/ve-chung-toi` |
| `/en/contact` | `/vi/lien-he` |
| `/en/blog` | `/vi/blog` |

---

### PHASE 3: BLOG SYSTEM VỚI HEADLESS CMS
**Mức độ ưu tiên: HIGH | Thời gian ước tính: 2-3 tuần**

#### 3.1 Chọn CMS: Sanity Studio

**Lý do chọn Sanity thay vì Strapi:**
| Tiêu chí | Sanity | Strapi |
|---|---|---|
| Hosting | Cloud (free tier đủ dùng) | Tự host (cần VPS) |
| Real-time preview | Có sẵn | Cần config thêm |
| Next.js integration | `next-sanity` official | Community plugin |
| Vietnamese content | Unicode đầy đủ | Unicode đầy đủ |
| Image CDN | Có sẵn (Sanity CDN) | Cần Cloudinary |
| Free tier | 100K API calls/tháng | Self-hosted miễn phí |
| Portable Text (Rich Text) | Native | Cần plugin |

#### 3.2 Sanity Schema Design

```
schemas/
├── post.ts          # Blog post
├── category.ts      # Blog category
├── tag.ts           # Blog tag
├── author.ts        # Author profile
├── service.ts       # Services (migrate từ mockData)
├── project.ts       # Portfolio projects (migrate từ mockData)
├── testimonial.ts   # Testimonials
└── siteSettings.ts  # Global site settings
```

**Blog Post Schema:**
```ts
{
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    { name: 'title', type: 'object', fields: [
      { name: 'vi', type: 'string', title: 'Tiêu đề (Việt)' },
      { name: 'en', type: 'string', title: 'Title (English)' },
    ]},
    { name: 'slug', type: 'slug' },
    { name: 'excerpt', type: 'object', /* vi + en */ },
    { name: 'body', type: 'object', fields: [
      { name: 'vi', type: 'portableText' },
      { name: 'en', type: 'portableText' },
    ]},
    { name: 'featuredImage', type: 'image', options: { hotspot: true } },
    { name: 'category', type: 'reference', to: [{ type: 'category' }] },
    { name: 'tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] },
    { name: 'author', type: 'reference', to: [{ type: 'author' }] },
    { name: 'seo', type: 'object', fields: [
      { name: 'metaTitle', type: 'object' /* vi + en */ },
      { name: 'metaDescription', type: 'object' /* vi + en */ },
      { name: 'focusKeyword', type: 'string' },
    ]},
    { name: 'publishedAt', type: 'datetime' },
  ]
}
```

#### 3.3 Blog Pages

**`app/[locale]/blog/page.tsx`** - Blog listing:
- Phân trang (pagination) - 12 bài/trang
- Filter theo category
- Search
- Featured post
- Sidebar: categories, recent posts, tags cloud
- ISR: revalidate mỗi 60 giây

**`app/[locale]/blog/[slug]/page.tsx`** - Blog article:
- Table of Contents tự động
- Estimated read time
- Social sharing buttons
- Related posts
- Author bio
- Comments (optional: Disqus hoặc custom)
- JSON-LD `BlogPosting` schema
- `generateStaticParams()` để pre-render popular posts

**`app/[locale]/blog/category/[cat]/page.tsx`** - Category page

#### 3.4 RSS Feed

**`app/feed.xml/route.ts`** - RSS 2.0 feed cho blog

#### 3.5 Content Pillars (Chiến lược nội dung)

| Pillar | Keyword chính (VI) | Số bài/tháng |
|---|---|---|
| Thiết kế Website | "thiết kế website", "làm website chuyên nghiệp" | 4 |
| Thương mại điện tử | "website bán hàng", "thương mại điện tử" | 3 |
| SEO & Marketing | "tối ưu SEO", "marketing online" | 3 |
| Công nghệ & Trends | "xu hướng web", "React", "Next.js" | 2 |
| Case Studies | "dự án website", "portfolio" | 2 |

---

### PHASE 4: TECHNICAL SEO EXCELLENCE
**Mức độ ưu tiên: HIGH | Thời gian ước tính: 1-2 tuần**

#### 4.1 Core Web Vitals Optimization

**LCP (Largest Contentful Paint) < 2.5s:**
- Sử dụng `next/image` cho tất cả hình ảnh (auto WebP/AVIF, responsive sizing)
- `priority` prop cho hero image và above-the-fold images
- Preload critical fonts
- Minimize CSS blocking

**CLS (Cumulative Layout Shift) < 0.1:**
- Set explicit width/height cho tất cả images
- Font-display: swap cho web fonts
- Reserve space cho dynamic content (ads, embeds)

**INP (Interaction to Next Paint) < 200ms:**
- Code splitting tự động (Next.js App Router)
- `React.lazy()` cho admin components
- Debounce search inputs
- Optimize event handlers

#### 4.2 Image Optimization Strategy

```tsx
// Thay tất cả <img> bằng next/image
import Image from 'next/image';

<Image
  src="/images/hero.webp"
  alt="LOOP - Thiết kế website chuyên nghiệp cho doanh nghiệp"
  width={1200}
  height={630}
  priority  // cho above-the-fold
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Quy tắc alt text cho SEO:**
- Hero: "LOOP - [keyword chính]"
- Services: "[Tên dịch vụ] - LOOP"
- Portfolio: "[Tên dự án] - Dự án bởi LOOP"
- Blog: "[Mô tả nội dung hình] - LOOP Blog"

#### 4.3 Breadcrumbs Component

```
Home > Dịch vụ > Website Doanh nghiệp
Home > Dự án > LuxeShop E-Commerce
Home > Blog > SEO > Hướng dẫn tối ưu SEO cho website
```

Kèm JSON-LD `BreadcrumbList` schema.

#### 4.4 Internal Linking Strategy

| Từ trang | Link đến | Anchor text |
|---|---|---|
| Home (services preview) | Service detail | "Xem chi tiết dịch vụ {name}" |
| Home (portfolio preview) | Project detail | "Xem dự án {name}" |
| Service detail | Related projects | "Dự án {name} sử dụng dịch vụ này" |
| Blog articles | Related services | "Dịch vụ {name} của LOOP" |
| Blog articles | Related blog posts | Contextual anchor text |
| Footer | All main pages | Service names, page names |
| Pricing | Contact | "Liên hệ nhận báo giá" |

#### 4.5 Canonical URLs

Mỗi trang tự động có:
```html
<link rel="canonical" href="https://loop.vn/vi/dich-vu/website-doanh-nghiep" />
```

#### 4.6 404 Page

**`app/not-found.tsx`:**
- Branded 404 page
- Search box
- Links đến trang chính
- Suggested pages

#### 4.7 Performance Budget

| Metric | Target | Tool đo |
|---|---|---|
| Lighthouse Performance | 95+ | Chrome DevTools |
| LCP | < 2.0s | PageSpeed Insights |
| CLS | < 0.05 | PageSpeed Insights |
| INP | < 150ms | PageSpeed Insights |
| TTI | < 3.0s | WebPageTest |
| Bundle size (JS) | < 200KB gzipped | Bundle Analyzer |

---

### PHASE 5: ANALYTICS & MONITORING
**Mức độ ưu tiên: MEDIUM | Thời gian ước tính: 3-5 ngày**

#### 5.1 Google Analytics 4

- Setup GA4 property
- Vercel Analytics (bổ sung)
- Event tracking:
  - Form submissions (Contact, Get Quote)
  - CTA button clicks
  - Service page views
  - Blog read time
  - Portfolio clicks
  - Language switch events

#### 5.2 Google Search Console

- Verify ownership
- Submit sitemap.xml
- Monitor:
  - Index coverage
  - Core Web Vitals
  - Search queries & CTR
  - Mobile usability
  - Structured data validation

#### 5.3 Monitoring Stack

| Tool | Mục đích | Free tier |
|---|---|---|
| Google Search Console | SEO monitoring | Free |
| Google Analytics 4 | Traffic analytics | Free |
| Vercel Analytics | Real-time performance | Free (hobby) |
| PageSpeed Insights API | Automated CWV checks | Free |

---

### PHASE 6: LOCAL SEO & OFF-PAGE
**Mức độ ưu tiên: MEDIUM | Thời gian ước tính: Ongoing**

#### 6.1 Google Business Profile
- Tạo/claim profile cho LOOP
- Thông tin NAP (Name, Address, Phone) nhất quán
- Categories: "Web Design Company", "Software Company"
- Photos, business hours, services
- Encourage Google Reviews

#### 6.2 Local Schema Markup
```json
{
  "@type": "LocalBusiness",
  "name": "LOOP",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "[Thành phố]",
    "addressCountry": "VN"
  },
  "telephone": "+84-xxx-xxx-xxx",
  "priceRange": "$$"
}
```

#### 6.3 Social Media Presence
- Facebook Business Page (quan trọng nhất tại VN)
- LinkedIn Company Page
- YouTube channel (video tutorials, case studies)
- Zalo OA (Official Account - quan trọng cho thị trường VN)

#### 6.4 Backlink Strategy
| Nguồn | Loại | Khó khăn |
|---|---|---|
| Directories (Clutch, GoodFirms, TopDev.vn) | Business listing | Dễ |
| Guest posts trên blog tech VN | Content + link | Trung bình |
| Case studies với clients (co-marketing) | PR + link | Trung bình |
| Tech communities (Viblo, Dev.to) | Community + link | Dễ |
| PR articles (báo online VN) | News + link | Khó |

---

### PHASE 7: TÍNH NĂNG BỔ SUNG
**Mức độ ưu tiên: LOW-MEDIUM | Thời gian ước tính: 2-4 tuần**

#### 7.1 FAQ Section với Schema
- Thêm FAQ section vào trang Services, Pricing
- JSON-LD `FAQPage` schema
- Giúp chiếm vị trí "People Also Ask" trên Google

#### 7.2 Live Chat / Chatbot
- Tích hợp Tawk.to (free) hoặc Crisp
- Tăng engagement và conversion
- Giảm bounce rate (tín hiệu tốt cho SEO)

#### 7.3 Testimonials/Reviews Enhancement
- Google Reviews widget
- Video testimonials
- `Review` schema markup
- Star ratings hiển thị trên Google

#### 7.4 Speed Dial / Quick Actions (Mobile)
- Click-to-call button
- Zalo chat button
- Facebook Messenger button
- Floating CTA trên mobile

#### 7.5 Case Studies Expansion
- Mở rộng từ 5 → 15+ case studies
- Mỗi case study có số liệu cụ thể (ROI, traffic increase, conversion rate)
- Before/After screenshots
- Client video testimonials

---

### PHASE 8: CHUẨN HOÁ PROFILE & MỞ RỘNG MÔ HÌNH KINH DOANH
**Mức độ ưu tiên: HIGH | Thời gian ước tính: 4-6 tuần**

#### 8.1 Hệ thống Team & Profile (Tăng độ tin cậy / E-E-A-T)
- Xây dựng trang profile chi tiết cho Ban Lãnh đạo (CEO, CTO) và các chuyên gia nòng cốt.
- Nội dung: Tiểu sử, kinh nghiệm chuyên môn, dự án đã thực hiện, chứng chỉ, links mạng xã hội (LinkedIn).
- SEO: Áp dụng JSON-LD `Person` schema cho từng chuyên gia để tăng mức độ uy tín trên Google.

#### 8.2 Tái cấu trúc Sản Phẩm & Gói Dịch Vụ
Thiết kế lại hệ thống dịch vụ phục vụ đa dạng nhu cầu và chiến lược dài hạn:
- **Gói Web Sẵn Có (Ready-made Templates)**: Chức năng xem trước mẫu (live preview), thông tin chi tiết gói, giỏ hàng hoặc form đặt mua trực tiếp.
- **Gói Web Theo Yêu Cầu (Custom Build)**: Flow thu thập yêu cầu nhiều bước (Multi-step form) để phân tích requirement, tự động xuất báo giá sơ bộ.
- **Gói Dịch Vụ SEO & Content Post**: Gói đăng ký định kỳ (Subscription) bảo trì website, cung cấp bài viết chuẩn SEO hàng tháng cho doanh nghiệp.

#### 8.3 Hệ thống Authentication & Quản trị Nội Bộ (Admin)
- **Hệ thống Auth (Xác thực)**: Tích hợp bảo mật (NextAuth.js / Supabase Auth) phân quyền người dùng (Super Admin, Content Editor, Sales).
- **Mở rộng Admin Platform**:
  - Quản lý thông tin & Profile team member.
  - Quản lý danh mục các Gói dịch vụ (cập nhật giá, thêm gói mới).
  - Quản lý Leads & Contacts từ khách hàng đặt gói.
  - Module quản trị các gói Subscriptions (SEO, Maintainance).

---

## TỔNG KẾT CÔNG NGHỆ

| Layer | Công nghệ | Lý do |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG, SEO tốt nhất, Image optimization |
| Language | **TypeScript** | Giữ nguyên, type safety |
| Styling | **Tailwind CSS v4** | Giữ nguyên, performance tốt |
| UI Components | **shadcn/ui (Radix)** | Giữ nguyên, accessible |
| Animations | **Motion (Framer Motion)** | Giữ nguyên |
| CMS | **Sanity** | Blog, content management, free tier |
| i18n | **next-intl** | Best Next.js i18n library |
| SEO | **Next.js Metadata API + JSON-LD** | Built-in, no extra lib needed |
| Analytics | **GA4 + Vercel Analytics** | Free, comprehensive |
| Hosting | **Vercel** | Best cho Next.js, edge CDN, free SSL |
| Images | **next/image + Sanity CDN** | Auto optimization, WebP/AVIF |
| Forms | **React Hook Form + Zod** | Validation, performance |

---

## TIMELINE TỔNG THỂ

```
Tuần 1-3:   Phase 1 - Next.js Migration + SEO Foundation (CRITICAL)
Tuần 3-5:   Phase 2 - i18n Song ngữ Việt-Anh
Tuần 4-7:   Phase 3 - Blog System + Sanity CMS
Tuần 7-9:   Phase 4 - Technical SEO Excellence
Tuần 9-10:  Phase 5 - Analytics & Monitoring
Tuần 10+:   Phase 6 - Local SEO & Off-page (ongoing)
Tuần 10-14: Phase 7 - Tính năng bổ sung
```

**Tổng thời gian cần thiết: ~10-14 tuần cho technical implementation**
**SEO results: 3-6 tháng sau launch để thấy ranking cải thiện rõ rệt**

---

## CHECKLIST SEO TRƯỚC KHI LAUNCH

- [ ] Mọi trang đều có unique title + meta description
- [ ] Open Graph tags cho mọi trang
- [ ] Structured Data (JSON-LD) validated (Google Rich Results Test)
- [ ] sitemap.xml submitted lên Google Search Console
- [ ] robots.txt chính xác
- [ ] Canonical URLs trên mọi trang
- [ ] Hreflang tags cho song ngữ
- [ ] Core Web Vitals passed (green) trên PageSpeed Insights
- [ ] Mobile-friendly test passed
- [ ] All images có alt text descriptive
- [ ] Internal linking structure hợp lý
- [ ] 404 page hoạt động
- [ ] HTTPS (SSL) active
- [ ] Blog có ít nhất 10 bài viết trước launch
- [ ] Google Business Profile đã setup
- [ ] GA4 + Search Console đã connected
