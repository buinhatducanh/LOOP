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

---
---

# PHẦN 2: KẾ HOẠCH QUẢN TRỊ ADMIN CHI TIẾT
# Tham khảo mô hình các công ty phần mềm quy mô lớn (Atlassian, Salesforce, HubSpot, Zoho, Monday.com)

---

## PHÂN TÍCH HIỆN TRẠNG ADMIN

### Hệ thống hiện có
| Model | Trạng thái | Ghi chú |
|---|---|---|
| User (role: user/admin) | Cơ bản | Chỉ có role đơn giản, chưa có permission system |
| Service | Có DB schema | Chưa có UI admin CRUD |
| Project | Có DB schema | Chưa có UI admin CRUD |
| PricingPlan | Có DB schema | Chưa có UI admin CRUD |
| Testimonial | Có DB schema | Chưa có UI admin CRUD |
| ContactMessage | Có DB schema | Chưa có UI admin CRUD |
| TeamMember | Có DB schema | Chưa có UI admin CRUD |
| ServicePackage | Có DB schema | Chưa có UI admin CRUD |
| Order | Có DB schema | Chưa có UI admin CRUD |
| SiteSetting | Có DB schema | Chưa có UI admin |
| Admin Dashboard | Placeholder | Chỉ có text "coming soon" |

### Thiếu sót nghiêm trọng so với chuẩn công ty phần mềm lớn
1. **Không có hệ thống phân quyền (RBAC)** - Chỉ có role "user"/"admin", không phân biệt Super Admin / Editor / Sales / Viewer
2. **Không có Audit Log** - Không theo dõi ai đã làm gì, khi nào
3. **Không có Notification System** - Không thông báo khi có lead mới, order mới
4. **Không có CRM module** - Không quản lý pipeline khách hàng
5. **Không có Dashboard analytics** - Không có biểu đồ, KPI, metrics
6. **Không có File/Media Management** - Không quản lý ảnh, tài liệu tập trung
7. **Không có Workflow/Automation** - Không tự động gán task, gửi email
8. **Không có Activity Feed** - Không có timeline hoạt động của team
9. **Không có Calendar/Schedule** - Không quản lý lịch meeting, deadline dự án
10. **Không có Internal Chat/Notes** - Không có ghi chú nội bộ cho mỗi khách hàng/đơn hàng

---

## PHASE 9: HỆ THỐNG PHÂN QUYỀN NÂNG CAO (RBAC + ABAC)
**Mức độ ưu tiên: CRITICAL | Thời gian: 2-3 tuần**
**Tham khảo: Atlassian (Jira/Confluence), Google Workspace, AWS IAM**

### 9.1 Thiết kế Role-Based Access Control (RBAC)

**Hệ thống Role phân cấp:**

```
Super Admin (Owner)
├── Admin (Full Access)
│   ├── Content Manager
│   │   ├── Content Editor
│   │   └── Content Viewer
│   ├── Sales Manager
│   │   ├── Sales Rep
│   │   └── Sales Viewer
│   ├── Project Manager
│   │   ├── Developer
│   │   └── Designer
│   └── Support Manager
│       ├── Support Agent
│       └── Support Viewer
└── Client (External Access)
    ├── Client Admin
    └── Client Viewer
```

**Ma trận phân quyền chi tiết:**

| Module | Super Admin | Admin | Content Manager | Sales Manager | Project Manager | Support Agent | Client |
|---|---|---|---|---|---|---|---|
| Dashboard (Full) | CRUD | CRUD | Read | Read | Read | Read | - |
| Users & Roles | CRUD | Read | - | - | - | - | - |
| Services | CRUD | CRUD | CRUD | Read | Read | Read | - |
| Projects/Portfolio | CRUD | CRUD | CRUD | Read | CRUD | Read | Read (own) |
| Blog/Content | CRUD | CRUD | CRUD | Read | - | - | - |
| Orders/Deals | CRUD | CRUD | Read | CRUD | Read | Read | Read (own) |
| Contacts/Leads | CRUD | CRUD | Read | CRUD | - | CRUD | - |
| Pricing Plans | CRUD | CRUD | Read | Read | - | - | Read |
| Testimonials | CRUD | CRUD | CRUD | Read | - | - | - |
| Team Members | CRUD | CRUD | Read | Read | Read | - | - |
| Site Settings | CRUD | Read | - | - | - | - | - |
| Audit Logs | Read | Read | - | - | - | - | - |
| Analytics/Reports | CRUD | Read | Read (own) | Read (own) | Read (own) | - | - |
| File Manager | CRUD | CRUD | CRUD | Read | CRUD | Read | Upload (own) |
| Notifications | CRUD | CRUD | Read (own) | Read (own) | Read (own) | Read (own) | Read (own) |
| Billing/Finance | CRUD | Read | - | Read | - | - | Read (own) |

### 9.2 Database Schema mới cho RBAC

```prisma
model Role {
  id          String       @id @default(cuid())
  name        String       @unique // 'super_admin', 'admin', 'content_manager', etc.
  displayName String       @map("display_name")
  description String?
  level       Int          @default(0) // hierarchy level (0 = highest)
  isSystem    Boolean      @default(false) @map("is_system") // system roles can't be deleted
  permissions Permission[]
  users       UserRole[]
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  @@map("roles")
}

model Permission {
  id       String @id @default(cuid())
  resource String // 'services', 'projects', 'orders', 'users', etc.
  action   String // 'create', 'read', 'update', 'delete', 'export', 'approve'
  scope    String @default("all") // 'all', 'own', 'team', 'department'
  roleId   String @map("role_id")
  role     Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, resource, action])
  @@map("permissions")
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId    String   @map("role_id")
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  assignedBy String? @map("assigned_by")
  expiresAt DateTime? @map("expires_at") // temporary role assignments
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([userId, roleId])
  @@map("user_roles")
}
```

### 9.3 Middleware phân quyền

```
src/lib/auth/
├── permissions.ts        # Permission checker utility
├── rbac-middleware.ts     # Next.js middleware for route protection
├── role-guard.tsx         # React component wrapper
├── use-permissions.ts     # React hook: usePermission('services', 'create')
└── constants.ts           # Permission constants & role definitions
```

**Logic kiểm tra quyền (tham khảo Casbin/CASL):**
```ts
// Ví dụ sử dụng
const canEdit = usePermission('services', 'update');
const canDelete = usePermission('orders', 'delete', { scope: 'own' });

// Server-side
await requirePermission(session, 'projects', 'create');
```

### 9.4 Session & Authentication nâng cao

**Tích hợp NextAuth.js v5 (Auth.js):**
- Google OAuth (đã có)
- Email/Password với bcrypt
- Magic Link (passwordless login)
- Two-Factor Authentication (2FA) via TOTP (Google Authenticator)
- Session management: JWT + Database sessions
- Remember me / Trusted devices
- Login history & Active sessions management

**Database bổ sung:**
```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  deviceName   String?  @map("device_name")
  lastActiveAt DateTime @default(now()) @map("last_active_at")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("sessions")
}

model TwoFactorSecret {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  secret    String
  isEnabled Boolean  @default(false) @map("is_enabled")
  backupCodes String[] @map("backup_codes")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("two_factor_secrets")
}

model LoginHistory {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ipAddress String   @map("ip_address")
  userAgent String   @map("user_agent")
  location  String?
  status    String   // 'success', 'failed', 'blocked'
  createdAt DateTime @default(now()) @map("created_at")

  @@map("login_history")
}
```

---

## PHASE 10: ADMIN DASHBOARD & ANALYTICS HUB
**Mức độ ưu tiên: HIGH | Thời gian: 3-4 tuần**
**Tham khảo: HubSpot Dashboard, Salesforce Lightning, Monday.com, Metabase**

### 10.1 Admin Layout & Navigation

**Cấu trúc file:**
```
src/app/admin/
├── layout.tsx                    # Admin shell: sidebar + topbar + content
├── page.tsx                      # Dashboard overview
├── (content)/
│   ├── services/
│   │   ├── page.tsx              # Services list (DataTable)
│   │   ├── new/page.tsx          # Create service
│   │   └── [id]/
│   │       ├── page.tsx          # View service detail
│   │       └── edit/page.tsx     # Edit service
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/page.tsx
│   ├── blog/
│   │   ├── posts/
│   │   │   ├── page.tsx          # All posts
│   │   │   ├── new/page.tsx      # New post (Rich editor)
│   │   │   └── [id]/edit/page.tsx
│   │   ├── categories/page.tsx
│   │   └── tags/page.tsx
│   ├── testimonials/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   └── team/
│       ├── page.tsx
│       ├── new/page.tsx
│       └── [id]/edit/page.tsx
├── (sales)/
│   ├── orders/
│   │   ├── page.tsx              # All orders (Kanban + Table view)
│   │   └── [id]/page.tsx         # Order detail + timeline
│   ├── leads/
│   │   ├── page.tsx              # Lead pipeline (Kanban)
│   │   └── [id]/page.tsx
│   ├── contacts/
│   │   ├── page.tsx              # Contact list
│   │   └── [id]/page.tsx         # Contact detail + activity
│   └── packages/
│       ├── page.tsx              # Service packages
│       └── [id]/edit/page.tsx
├── (analytics)/
│   ├── overview/page.tsx         # Analytics dashboard
│   ├── revenue/page.tsx          # Revenue reports
│   ├── traffic/page.tsx          # Website traffic
│   └── seo/page.tsx              # SEO performance
├── (system)/
│   ├── users/
│   │   ├── page.tsx              # User management
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── roles/
│   │   ├── page.tsx              # Role management
│   │   └── [id]/page.tsx
│   ├── audit-log/page.tsx        # Audit trail
│   ├── settings/
│   │   ├── page.tsx              # General settings
│   │   ├── email/page.tsx        # Email templates
│   │   ├── integrations/page.tsx # Third-party integrations
│   │   └── backup/page.tsx       # Backup & restore
│   └── media/page.tsx            # Media library
└── components/
    ├── admin-sidebar.tsx
    ├── admin-topbar.tsx
    ├── admin-breadcrumb.tsx
    ├── data-table.tsx             # Reusable table (TanStack Table)
    ├── kanban-board.tsx           # Drag & drop Kanban
    ├── stat-card.tsx
    ├── chart-card.tsx
    ├── activity-feed.tsx
    ├── quick-actions.tsx
    └── search-command.tsx         # Cmd+K global search
```

### 10.2 Dashboard Overview (Trang chính)

**KPI Cards (hàng trên cùng):**
| Card | Metric | So sánh | Icon |
|---|---|---|---|
| Tổng doanh thu | ₫XXX,XXX,XXX | +12% vs tháng trước | TrendingUp |
| Đơn hàng mới | XX đơn | +5 vs tuần trước | ShoppingCart |
| Leads chưa xử lý | XX leads | Urgent badge nếu > 10 | UserPlus |
| Messages chưa đọc | XX tin nhắn | Real-time update | MessageSquare |
| Traffic hôm nay | X,XXX visits | vs hôm qua | BarChart |
| Conversion Rate | X.X% | +0.2% vs tuần trước | Target |

**Charts & Graphs (Recharts / Chart.js):**
- **Revenue Chart** (Line/Area): Doanh thu theo ngày/tuần/tháng (12 tháng gần nhất)
- **Orders by Status** (Donut): pending / processing / completed / cancelled
- **Lead Sources** (Bar): Direct / Google / Facebook / Referral / Zalo
- **Popular Services** (Horizontal Bar): Top 5 dịch vụ được đặt nhiều nhất
- **Traffic Overview** (Area): Page views, unique visitors, bounce rate
- **Team Performance** (Table): Task completed, deals closed per member

**Quick Actions Panel:**
- Tạo đơn hàng mới
- Thêm blog post
- Gửi báo giá
- Xem messages mới
- Export báo cáo

**Activity Feed (Real-time):**
```
[Avatar] Nguyễn Văn A đã tạo đơn hàng #ORD-2024-0156     2 phút trước
[Avatar] Trần Thị B đã publish bài blog "Xu hướng Web 2024"  15 phút trước
[Avatar] Khách hàng mới đăng ký: tech@company.com            1 giờ trước
[Avatar] Lê Văn C đã cập nhật project "LuxeShop"             3 giờ trước
```

### 10.3 DataTable Component (TanStack Table v8)

**Tính năng chuẩn enterprise (tham khảo AG Grid, MUI DataGrid):**
- Sorting (multi-column)
- Filtering (text, select, date range, number range)
- Pagination (server-side) với page size selector
- Column visibility toggle
- Column resize & reorder
- Row selection (single/multi) với bulk actions
- Search global + search per column
- Export: CSV, Excel, PDF
- Inline editing (click-to-edit)
- Row expand (chi tiết bổ sung)
- Responsive: ẩn column trên mobile, swipe navigation
- Keyboard navigation (accessibility)
- Loading skeleton / Empty state

### 10.4 Kanban Board (dnd-kit)

**Dùng cho: Orders, Leads, Project Tasks**

```
| Mới         | Đang xử lý    | Chờ duyệt    | Hoàn thành   | Huỷ          |
|-------------|----------------|---------------|--------------|--------------|
| [Card]      | [Card]         | [Card]        | [Card]       |              |
| [Card]      | [Card]         |               | [Card]       |              |
| [Card]      |                |               |              |              |
```

Mỗi card hiển thị: Tên KH, gói dịch vụ, giá trị, ngày tạo, người phụ trách, priority badge.

---

## PHASE 11: CRM & QUẢN LÝ KHÁCH HÀNG
**Mức độ ưu tiên: HIGH | Thời gian: 3-4 tuần**
**Tham khảo: HubSpot CRM, Salesforce, Pipedrive, Zoho CRM**

### 11.1 Contact Management (Quản lý liên hệ)

**Database Schema bổ sung:**
```prisma
model Contact {
  id            String    @id @default(cuid())
  // Thông tin cơ bản
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  email         String    @unique
  phone         String?
  avatar        String?
  // Thông tin công ty
  companyName   String?   @map("company_name")
  companySize   String?   @map("company_size") // '1-10', '11-50', '51-200', '201-500', '500+'
  industry      String?
  website       String?
  position      String?   // Chức vụ
  // Phân loại
  type          String    @default("lead") // 'lead', 'prospect', 'customer', 'partner', 'churned'
  source        String?   // 'website', 'google', 'facebook', 'referral', 'zalo', 'cold_call', 'event'
  status        String    @default("new") // 'new', 'contacted', 'qualified', 'negotiation', 'won', 'lost'
  score         Int       @default(0) // Lead scoring (0-100)
  // Phân công
  assignedToId  String?   @map("assigned_to_id")
  assignedTo    User?     @relation("AssignedContacts", fields: [assignedToId], references: [id])
  // Địa chỉ
  address       String?
  city          String?
  country       String    @default("VN")
  // Metadata
  tags          String[]
  customFields  Json?     @map("custom_fields")
  notes         ContactNote[]
  activities    Activity[]
  deals         Deal[]
  orders        Order[]
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("contacts")
}

model ContactNote {
  id        String   @id @default(cuid())
  contactId String   @map("contact_id")
  contact   Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
  authorId  String   @map("author_id")
  author    User     @relation(fields: [authorId], references: [id])
  content   String   @db.Text
  isPinned  Boolean  @default(false) @map("is_pinned")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("contact_notes")
}

model Activity {
  id          String   @id @default(cuid())
  contactId   String?  @map("contact_id")
  contact     Contact? @relation(fields: [contactId], references: [id], onDelete: Cascade)
  dealId      String?  @map("deal_id")
  deal        Deal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id])
  type        String   // 'call', 'email', 'meeting', 'note', 'task', 'status_change', 'deal_created'
  title       String
  description String?  @db.Text
  metadata    Json?    // extra data (call duration, email subject, etc.)
  scheduledAt DateTime? @map("scheduled_at")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("activities")
}
```

### 11.2 Lead Scoring System (Tham khảo HubSpot)

**Tiêu chí chấm điểm tự động:**

| Hành động | Điểm | Ghi chú |
|---|---|---|
| Điền form liên hệ | +20 | Quan tâm rõ ràng |
| Đăng ký tài khoản | +15 | Có ý định sử dụng |
| Xem trang Pricing | +10 | Đang so sánh giá |
| Xem trang Services (>2 dịch vụ) | +10 | Tìm hiểu sâu |
| Mở email marketing | +5 | Engage với nội dung |
| Click link trong email | +8 | Engage mạnh |
| Quay lại website (return visit) | +5 | Nhớ đến thương hiệu |
| Company size > 50 | +15 | Enterprise potential |
| Không hoạt động > 30 ngày | -10 | Mất quan tâm |
| Unsubscribe email | -20 | Không muốn liên hệ |

**Lead Quality Tiers:**
- **Hot (80-100)**: Sales cần liên hệ trong 24h
- **Warm (50-79)**: Nurture qua email series
- **Cold (20-49)**: Theo dõi, gửi content
- **Unqualified (0-19)**: Không phù hợp

### 11.3 Sales Pipeline (Deal Management)

```prisma
model Deal {
  id           String    @id @default(cuid())
  title        String
  contactId    String    @map("contact_id")
  contact      Contact   @relation(fields: [contactId], references: [id])
  assignedToId String    @map("assigned_to_id")
  assignedTo   User      @relation("AssignedDeals", fields: [assignedToId], references: [id])
  // Pipeline
  stage        String    @default("qualification") // Stages below
  probability  Int       @default(10) // % khả năng chốt
  // Giá trị
  value        Int       // Giá trị deal (VND)
  currency     String    @default("VND")
  // Thời gian
  expectedCloseDate DateTime? @map("expected_close_date")
  actualCloseDate   DateTime? @map("actual_close_date")
  // Chi tiết
  packageId    String?   @map("package_id")
  package      ServicePackage? @relation(fields: [packageId], references: [id])
  lostReason   String?   @map("lost_reason")
  notes        String?   @db.Text
  activities   Activity[]
  // Metadata
  tags         String[]
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@map("deals")
}
```

**Pipeline Stages (Kanban view):**

```
Qualification → Needs Analysis → Proposal → Negotiation → Closed Won / Closed Lost
    10%             25%            50%          75%         100% / 0%
```

| Stage | Hành động cần làm | Auto-actions |
|---|---|---|
| Qualification | Xác nhận nhu cầu, budget, timeline | Gửi email giới thiệu LOOP |
| Needs Analysis | Họp chi tiết, thu thập requirement | Ghi chú meeting, tạo task phân tích |
| Proposal | Gửi báo giá chi tiết, demo | Auto-gen PDF proposal |
| Negotiation | Đàm phán giá, điều khoản | Reminder nếu >7 ngày không update |
| Closed Won | Chuyển sang Order, tạo project | Email welcome, tạo project tự động |
| Closed Lost | Ghi lý do, archive | Email follow-up sau 3 tháng |

### 11.4 Customer 360 View (Trang chi tiết khách hàng)

**Layout trang `/admin/contacts/[id]`:**

```
┌──────────────────────────────────────────────────────────────┐
│ [Avatar] Nguyễn Văn A          [Hot Lead ●]  [Edit] [More▼] │
│ CEO @ TechCorp Vietnam                                       │
│ nguyen@techcorp.vn | +84 912 345 678 | techcorp.vn          │
├──────────────┬───────────────────────────────────────────────┤
│              │                                                │
│ Thông tin    │  [Timeline / Activity Feed]                    │
│ ─────────    │  ┌─ 📞 Gọi điện - 15 phút         Hôm nay   │
│ Company:     │  │  "KH quan tâm gói Premium"                 │
│ TechCorp     │  ├─ 📧 Gửi proposal v2             Hôm qua   │
│              │  │  proposal-techcorp-v2.pdf                   │
│ Industry:    │  ├─ 📝 Ghi chú meeting              3 ngày    │
│ Technology   │  │  "Budget: 50-80tr, Timeline: Q2"           │
│              │  ├─ 🔔 Lead score +10               5 ngày    │
│ Size: 51-200 │  │  Xem trang Pricing 3 lần                   │
│              │  └─ ✉️ Form liên hệ                 1 tuần    │
│ Score: 85/100│     "Cần website thương mại điện tử"          │
│              │                                                │
│ Tags:        │  [Deals]                                       │
│ #enterprise  │  ┌────────────────────────────────────────┐   │
│ #ecommerce   │  │ TechCorp E-Commerce | ₫75,000,000     │   │
│              │  │ Stage: Proposal | Close: 15/04/2026    │   │
│ Assigned:    │  └────────────────────────────────────────┘   │
│ [Trần B]     │                                                │
│              │  [Orders]  [Files]  [Emails]                   │
├──────────────┴───────────────────────────────────────────────┤
│ + Add Note  | + Log Call  | + Schedule Meeting  | + Send Email│
└──────────────────────────────────────────────────────────────┘
```

---

## PHASE 12: HỆ THỐNG QUẢN LÝ ĐƠN HÀNG & TÀI CHÍNH
**Mức độ ưu tiên: HIGH | Thời gian: 3-4 tuần**
**Tham khảo: Shopify Admin, WooCommerce, Stripe Dashboard, QuickBooks**

### 12.1 Order Management nâng cao

**Mở rộng Order schema:**
```prisma
model Order {
  id              String         @id @default(cuid())
  orderNumber     String         @unique @map("order_number") // ORD-2026-0001
  // Khách hàng
  contactId       String?        @map("contact_id")
  contact         Contact?       @relation(fields: [contactId], references: [id])
  customerName    String         @map("customer_name")
  customerEmail   String         @map("customer_email")
  customerPhone   String?        @map("customer_phone")
  companyName     String?        @map("company_name")
  // Gói dịch vụ
  packageId       String         @map("package_id")
  package         ServicePackage @relation(fields: [packageId], references: [id])
  // Chi tiết
  requirements    String?        @db.Text
  customizations  Json?          // Tuỳ chỉnh thêm
  // Tài chính
  subtotal        Int            // Giá gốc
  discount        Int            @default(0) // Giảm giá
  tax             Int            @default(0) // Thuế
  totalAmount     Int            @map("total_amount") // Tổng thanh toán
  currency        String         @default("VND")
  // Trạng thái
  status          String         @default("pending")
  // pending → confirmed → in_progress → review → revision → completed → delivered
  // pending → cancelled (bất kỳ lúc nào trước completed)
  paymentStatus   String         @default("unpaid") @map("payment_status")
  // unpaid → partial → paid → refunded
  // Phân công
  assignedToId    String?        @map("assigned_to_id")
  assignedTo      User?          @relation("AssignedOrders", fields: [assignedToId], references: [id])
  // Timeline
  confirmedAt     DateTime?      @map("confirmed_at")
  startedAt       DateTime?      @map("started_at")
  completedAt     DateTime?      @map("completed_at")
  deliveredAt     DateTime?      @map("delivered_at")
  cancelledAt     DateTime?      @map("cancelled_at")
  cancelReason    String?        @map("cancel_reason")
  // Relations
  payments        Payment[]
  orderItems      OrderItem[]
  orderTimeline   OrderTimeline[]
  attachments     Attachment[]
  dealId          String?        @map("deal_id")
  // Metadata
  internalNotes   String?        @db.Text @map("internal_notes")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  @@map("orders")
}

model OrderItem {
  id          String @id @default(cuid())
  orderId     String @map("order_id")
  order       Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  description String
  quantity    Int    @default(1)
  unitPrice   Int    @map("unit_price")
  total       Int

  @@map("order_items")
}

model OrderTimeline {
  id        String   @id @default(cuid())
  orderId   String   @map("order_id")
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  userId    String?  @map("user_id")
  user      User?    @relation(fields: [userId], references: [id])
  action    String   // 'created', 'status_changed', 'payment_received', 'note_added', 'file_uploaded'
  fromValue String?  @map("from_value")
  toValue   String?  @map("to_value")
  note      String?
  createdAt DateTime @default(now()) @map("created_at")

  @@map("order_timeline")
}

model Payment {
  id            String   @id @default(cuid())
  orderId       String   @map("order_id")
  order         Order    @relation(fields: [orderId], references: [id])
  amount        Int
  method        String   // 'bank_transfer', 'cash', 'momo', 'vnpay', 'paypal', 'credit_card'
  status        String   @default("pending") // 'pending', 'confirmed', 'failed', 'refunded'
  transactionId String?  @map("transaction_id")
  reference     String?  // Mã chuyển khoản
  note          String?
  confirmedBy   String?  @map("confirmed_by")
  confirmedAt   DateTime? @map("confirmed_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("payments")
}
```

### 12.2 Order Workflow & Status Machine

```
                    ┌──────────┐
                    │ PENDING  │ ← Đơn mới tạo
                    └────┬─────┘
                         │ Admin xác nhận
                    ┌────▼─────┐
               ┌────│CONFIRMED │
               │    └────┬─────┘
               │         │ Bắt đầu triển khai
               │    ┌────▼──────┐
               │    │IN_PROGRESS│ ← Assign cho team
               │    └────┬──────┘
               │         │ Hoàn thành dev
               │    ┌────▼─────┐
               │    │  REVIEW  │ ← KH review
               │    └────┬─────┘
               │         │         │
               │    Approve   Request changes
               │         │         │
               │    ┌────▼────┐  ┌▼────────┐
               │    │COMPLETED│  │REVISION  │──→ back to IN_PROGRESS
               │    └────┬────┘  └──────────┘
               │         │ Bàn giao
               │    ┌────▼─────┐
               │    │DELIVERED │ ✓ Done
               │    └──────────┘
               │
          CANCELLED ← (anytime before COMPLETED)
```

### 12.3 Invoice & Quotation Generator

**Tự động tạo PDF (tham khảo FreshBooks, Wave):**

| Document | Trigger | Nội dung |
|---|---|---|
| Quotation (Báo giá) | Tạo từ Deal | Thông tin KH, gói dịch vụ, giá, điều khoản, validity |
| Invoice (Hoá đơn) | Order confirmed | Chi tiết đơn hàng, thanh toán, due date |
| Receipt (Biên nhận) | Payment confirmed | Xác nhận đã thanh toán, số tiền, phương thức |
| Contract (Hợp đồng) | Deal won | Template hợp đồng, điều khoản, SLA |

**Công nghệ:** `@react-pdf/renderer` hoặc `puppeteer` (HTML → PDF)

### 12.4 Revenue Dashboard

**Báo cáo tài chính:**
- Doanh thu theo tháng/quý/năm (Line chart)
- Doanh thu theo dịch vụ (Pie chart)
- Doanh thu theo sales rep (Bar chart)
- Accounts Receivable (Công nợ phải thu)
- Monthly Recurring Revenue (MRR) từ gói Subscription
- Average Deal Size
- Win Rate (% deals thành công)
- Sales Cycle Length (trung bình bao lâu chốt deal)

---

## PHASE 13: HỆ THỐNG NỘI BỘ & PRODUCTIVITY
**Mức độ ưu tiên: MEDIUM | Thời gian: 4-6 tuần**
**Tham khảo: Jira, Asana, Notion, Slack, Google Workspace**

### 13.1 Project Management (Quản lý dự án nội bộ)

**Khác với Portfolio (public) - đây là quản lý workflow nội bộ của team:**

```prisma
model InternalProject {
  id           String    @id @default(cuid())
  name         String
  code         String    @unique // PROJ-001
  orderId      String?   @map("order_id")
  order        Order?    @relation(fields: [orderId], references: [id])
  // Team
  managerId    String    @map("manager_id")
  manager      User      @relation("ManagedProjects", fields: [managerId], references: [id])
  members      ProjectMember[]
  // Status
  status       String    @default("planning") // planning, active, on_hold, completed, archived
  priority     String    @default("medium") // low, medium, high, urgent
  // Timeline
  startDate    DateTime? @map("start_date")
  dueDate      DateTime? @map("due_date")
  completedAt  DateTime? @map("completed_at")
  // Progress
  progress     Int       @default(0) // 0-100%
  // Details
  description  String?   @db.Text
  tasks        Task[]
  milestones   Milestone[]
  attachments  Attachment[]
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@map("internal_projects")
}

model Task {
  id           String    @id @default(cuid())
  projectId    String    @map("project_id")
  project      InternalProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parentId     String?   @map("parent_id") // Sub-tasks
  parent       Task?     @relation("SubTasks", fields: [parentId], references: [id])
  children     Task[]    @relation("SubTasks")
  title        String
  description  String?   @db.Text
  status       String    @default("todo") // todo, in_progress, review, done
  priority     String    @default("medium")
  assigneeId   String?   @map("assignee_id")
  assignee     User?     @relation("AssignedTasks", fields: [assigneeId], references: [id])
  dueDate      DateTime? @map("due_date")
  estimatedHours Float?  @map("estimated_hours")
  actualHours  Float?    @map("actual_hours")
  tags         String[]
  sortOrder    Int       @default(0) @map("sort_order")
  completedAt  DateTime? @map("completed_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@map("tasks")
}

model Milestone {
  id          String    @id @default(cuid())
  projectId   String    @map("project_id")
  project     InternalProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  description String?
  dueDate     DateTime  @map("due_date")
  isCompleted Boolean   @default(false) @map("is_completed")
  completedAt DateTime? @map("completed_at")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("milestones")
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String   @map("project_id")
  project   InternalProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  role      String   @default("member") // lead, member, reviewer
  joinedAt  DateTime @default(now()) @map("joined_at")

  @@unique([projectId, userId])
  @@map("project_members")
}
```

**Views cho Task Management:**
- **Kanban Board**: Todo → In Progress → Review → Done (drag & drop)
- **List View**: Sortable, filterable table
- **Calendar View**: Tasks/Milestones trên calendar
- **Gantt Chart** (optional): Timeline view với dependencies
- **My Tasks**: Dashboard cá nhân cho mỗi team member

### 13.2 Notification System

```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String    @map("user_id")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String    // Notification types below
  title     String
  message   String
  data      Json?     // { orderId, contactId, taskId, etc. }
  link      String?   // URL to navigate when clicked
  isRead    Boolean   @default(false) @map("is_read")
  readAt    DateTime? @map("read_at")
  createdAt DateTime  @default(now()) @map("created_at")

  @@index([userId, isRead])
  @@map("notifications")
}
```

**Notification Types & Triggers:**

| Event | Notify | Channel |
|---|---|---|
| Đơn hàng mới | Sales Manager + Assigned Sales | In-app + Email |
| Message từ form liên hệ | Sales team | In-app + Email + Push |
| Lead score > 80 (Hot) | Assigned Sales Rep | In-app + Email |
| Deal stage changed | Sales Manager | In-app |
| Task assigned | Assignee | In-app + Email |
| Task due soon (24h) | Assignee | In-app + Email |
| Task overdue | Assignee + Manager | In-app + Email |
| Payment received | Admin + Finance | In-app + Email |
| Blog post published | Content Manager | In-app |
| New user registered | Admin | In-app |
| System error/alert | Super Admin | In-app + Email + SMS |

**Real-time delivery:** Server-Sent Events (SSE) hoặc WebSocket (Pusher/Ably free tier)

**Notification Preferences (per user):**
- Cho phép user tắt/bật từng loại notification
- Chọn channel (in-app only, email, both)
- Quiet hours (không gửi email ngoài giờ làm việc)

### 13.3 Audit Log & Activity Tracking

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String?  @map("user_id")
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // 'create', 'update', 'delete', 'login', 'export', 'permission_change'
  resource   String   // 'order', 'service', 'user', 'contact', etc.
  resourceId String?  @map("resource_id")
  oldValues  Json?    @map("old_values") // Previous state (for updates)
  newValues  Json?    @map("new_values") // New state (for updates)
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  metadata   Json?
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Audit Log UI:**
- Filterable by user, action, resource, date range
- Diff view cho updates (old vs new values)
- Export CSV cho compliance
- Retention policy: giữ 1 năm, archive sau đó

### 13.4 Media Library (File Management)

**Tham khảo: WordPress Media Library, Cloudinary Dashboard**

```prisma
model Media {
  id          String   @id @default(cuid())
  filename    String
  originalName String  @map("original_name")
  mimeType    String   @map("mime_type")
  size        Int      // bytes
  url         String   // Cloudinary URL
  publicId    String   @map("public_id") // Cloudinary public ID
  width       Int?
  height      Int?
  alt         String?
  caption     String?
  folder      String   @default("/") // Virtual folder structure
  uploadedById String  @map("uploaded_by_id")
  uploadedBy  User     @relation(fields: [uploadedById], references: [id])
  tags        String[]
  usedIn      Json?    @map("used_in") // Track where this media is used
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("media")
}
```

**Tính năng Media Library:**
- Grid / List view
- Drag & drop upload (multiple files)
- Image preview, crop, resize (Cloudinary transformations)
- Folder structure ảo
- Search by name, tags, type
- Used-in tracking (biết ảnh đang dùng ở đâu)
- Bulk actions: delete, move, tag
- Lazy loading infinite scroll
- File type support: Images (JPG, PNG, WebP, SVG), Documents (PDF), Videos

### 13.5 Email Templates & Automation

**Tham khảo: Mailchimp, SendGrid, HubSpot Email**

**Email Templates cần có:**

| Template | Trigger | Biến động |
|---|---|---|
| Welcome Email | User đăng ký | {name}, {email} |
| Lead Confirmation | Form liên hệ | {name}, {service}, {message} |
| Order Confirmation | Order created | {orderNumber}, {package}, {total} |
| Payment Received | Payment confirmed | {orderNumber}, {amount}, {method} |
| Project Update | Status changed | {projectName}, {status}, {note} |
| Project Delivered | Order delivered | {projectName}, {deliverables} |
| Follow-up (3 days) | Lead no response | {name}, {service} |
| Re-engagement (30 days) | Inactive lead | {name}, {offer} |
| Monthly Newsletter | Scheduled | {posts}, {updates} |
| Review Request | Post-delivery 7 days | {name}, {projectName}, {reviewLink} |

**Tech stack email:** Resend (miễn phí 3000 emails/tháng) hoặc Nodemailer + SMTP

### 13.6 Calendar & Scheduling

- Calendar view tích hợp trong admin
- Hiển thị: Task deadlines, Milestones, Meetings, Follow-ups
- Kéo thả để reschedule
- Sync với Google Calendar (optional)
- Reminder notifications

---

## PHASE 14: BẢO MẬT, BACKUP & INFRASTRUCTURE
**Mức độ ưu tiên: HIGH | Thời gian: 2-3 tuần**
**Tham khảo: AWS Security Best Practices, SOC 2, OWASP**

### 14.1 Security Hardening

**API Security:**
- Rate limiting (express-rate-limit): 100 req/min cho API, 5 req/min cho auth endpoints
- CSRF protection (double submit cookie pattern)
- Input sanitization (DOMPurify cho rich text, Zod cho form data)
- SQL injection prevention (Prisma parameterized queries - đã có)
- XSS prevention (React auto-escaping + CSP headers)
- CORS configuration (whitelist domains)
- Helmet.js headers (X-Frame-Options, X-Content-Type-Options, etc.)

**Content Security Policy (CSP):**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://res.cloudinary.com https://*.googleusercontent.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://vitals.vercel-insights.com;
  frame-ancestors 'none';
```

**Authentication Security:**
- Password policy: min 8 chars, 1 uppercase, 1 number, 1 special
- Account lockout after 5 failed attempts (15 min cooldown)
- Password reset with time-limited tokens (1 hour)
- Force password change on first login (admin-created accounts)
- Session timeout: 30 min inactive, 8 hour max
- Secure cookie flags: HttpOnly, Secure, SameSite=Strict

### 14.2 Data Backup Strategy

| What | Frequency | Retention | Method |
|---|---|---|---|
| PostgreSQL (Neon) | Daily auto | 30 days | Neon built-in PITR |
| Media (Cloudinary) | Weekly | 90 days | Cloudinary backup add-on |
| Config/Settings | On change | Indefinite | Git versioned |
| Audit Logs | Monthly archive | 1 year active, 5 year archive | Export to S3/R2 |

### 14.3 Environment & Deployment

**Environment tách biệt:**

| Environment | URL | Database | Mục đích |
|---|---|---|---|
| Development | localhost:3000 | Neon dev branch | Phát triển |
| Staging | staging.loop.vn | Neon staging branch | Testing, review |
| Production | loop.vn | Neon main | Live |

**CI/CD Pipeline (GitHub Actions):**
```
Push to branch → Lint + Type check → Unit tests → Build → Deploy Preview
Merge to main  → Lint + Type check → Unit tests → Build → Deploy Production
```

### 14.4 Monitoring & Error Tracking

| Tool | Mục đích | Free tier |
|---|---|---|
| Sentry | Error tracking, performance | 5K events/month |
| Vercel Analytics | Web analytics, CWV | Free (hobby) |
| UptimeRobot | Uptime monitoring | 50 monitors free |
| LogRocket / PostHog | Session replay, product analytics | Free tier |

---

## PHASE 15: TÍCH HỢP BÊN THỨ BA & MỞ RỘNG
**Mức độ ưu tiên: MEDIUM | Thời gian: 2-4 tuần**
**Tham khảo: Zapier, HubSpot Integrations, Salesforce AppExchange**

### 15.1 Payment Gateway Integration

| Gateway | Thị trường | Phí | Priority |
|---|---|---|---|
| VNPay | Việt Nam | 1.1-1.8% | P0 |
| MoMo | Việt Nam | 1.5% | P0 |
| ZaloPay | Việt Nam | 1.5% | P1 |
| Bank Transfer (Manual) | Việt Nam | 0% | P0 (default) |
| PayPal | International | 3.9% + fixed | P1 |
| Stripe | International | 2.9% + 30¢ | P2 |

### 15.2 Communication Integrations

| Integration | Mục đích | Implementation |
|---|---|---|
| Zalo OA API | Gửi thông báo cho KH VN | Webhook + API |
| Facebook Messenger | Chat support, lead capture | Facebook SDK |
| Telegram Bot | Notification cho internal team | Bot API |
| Google Calendar | Sync meetings & deadlines | OAuth + Calendar API |
| Google Drive | File sharing với clients | Drive API |
| Slack / Discord | Internal team notifications | Webhook |

### 15.3 Marketing Integrations

| Integration | Mục đích |
|---|---|
| Google Ads (GTM) | Conversion tracking |
| Facebook Pixel | Retargeting, lookalike audiences |
| Mailchimp / Brevo | Email marketing campaigns |
| Google Tag Manager | Centralized tag management |

### 15.4 API cho Client Portal (Tương lai)

**Client Portal** - Khu vực riêng cho khách hàng đăng nhập:
- Xem trạng thái dự án đang triển khai
- Xem & tải hoá đơn, biên nhận
- Upload tài liệu, nội dung cho dự án
- Chat/Ghi chú trực tiếp với team
- Xem lịch sử thanh toán
- Request thay đổi (change request)
- Approve deliverables

---

## PHASE 16: AI & AUTOMATION
**Mức độ ưu tiên: LOW-MEDIUM | Thời gian: 2-3 tuần**
**Tham khảo: HubSpot AI, Salesforce Einstein, Intercom Fin**

### 16.1 AI-Powered Features

| Feature | Mô tả | Công nghệ |
|---|---|---|
| AI Chatbot | Tư vấn dịch vụ, trả lời FAQ tự động 24/7 | Claude API / OpenAI |
| Smart Lead Scoring | ML-based scoring dựa trên behavior | Rule-based → ML later |
| Content Suggestions | Gợi ý chủ đề blog dựa trên trending keywords | Claude API |
| Auto-reply Email | Draft email response cho messages | Claude API |
| SEO Content Optimizer | Phân tích & gợi ý cải thiện SEO cho blog posts | Claude API |
| Proposal Generator | Tự động tạo proposal dựa trên requirement | Claude API + Template |
| Sentiment Analysis | Phân tích tone khách hàng trong messages | NLP |

### 16.2 Workflow Automation (No-code rules)

**Rule Engine (tham khảo Zapier, n8n):**

```
WHEN [trigger] AND [conditions] THEN [actions]
```

**Ví dụ rules:**

| # | When | Condition | Then |
|---|---|---|---|
| 1 | Lead score > 80 | Type = "lead" | Assign to Sales Manager + Send Slack notification |
| 2 | Order created | Package type = "template" | Auto-confirm + Send welcome email |
| 3 | Task overdue | Status != "done" | Notify assignee + Notify manager |
| 4 | Deal in "Proposal" > 7 days | No activity | Send reminder to Sales Rep |
| 5 | Payment received | Full amount | Update order status → confirmed |
| 6 | Contact inactive > 60 days | Was "customer" | Mark as "churned" + Send re-engagement email |
| 7 | Blog post published | Category = "SEO" | Share to Facebook + LinkedIn |
| 8 | New message from form | Service = "Enterprise" | Assign to Senior Sales + Priority = High |

---

## TỔNG KẾT TECHNOLOGY STACK (CẬP NHẬT)

| Layer | Công nghệ | Phiên bản | Mục đích |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 15.x | SSR/SSG, API routes |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **UI Components** | shadcn/ui (Radix) | Latest | Accessible components |
| **Admin Data Table** | TanStack Table | v8 | Advanced data grids |
| **Admin Charts** | Recharts | 2.x | Dashboard visualizations |
| **Kanban / DnD** | dnd-kit | Latest | Drag & drop |
| **Rich Text Editor** | Tiptap / BlockNote | Latest | Blog & content editing |
| **Forms** | React Hook Form + Zod | Latest | Validation |
| **Animations** | Motion (Framer Motion) | Latest | UI animations |
| **Database** | PostgreSQL (Neon) | 16 | Serverless Postgres |
| **ORM** | Prisma | 6.x | Type-safe database access |
| **Auth** | NextAuth.js (Auth.js) | v5 | Authentication + OAuth |
| **File Storage** | Cloudinary | - | Image/file CDN |
| **Email** | Resend | - | Transactional emails |
| **Real-time** | Server-Sent Events | - | Notifications |
| **PDF Generation** | @react-pdf/renderer | - | Invoices, proposals |
| **CMS** | Sanity | v3 | Blog content |
| **i18n** | next-intl | 3.x | Internationalization |
| **Analytics** | GA4 + Vercel Analytics | - | Traffic & performance |
| **Error Tracking** | Sentry | - | Error monitoring |
| **CI/CD** | GitHub Actions | - | Automated deployment |
| **Hosting** | Vercel | - | Edge deployment |
| **AI** | Claude API | Latest | AI features |

---

## TIMELINE MỞ RỘNG (CẬP NHẬT)

```
═══════════════════════════════════════════════════════════════════
 GIAI ĐOẠN 1: NỀN TẢNG (Tuần 1-14) — Đã plan ở Phase 1-8
═══════════════════════════════════════════════════════════════════
 Tuần 1-3:   Phase 1  - Next.js Migration + SEO Foundation
 Tuần 3-5:   Phase 2  - i18n Song ngữ
 Tuần 4-7:   Phase 3  - Blog System + CMS
 Tuần 7-9:   Phase 4  - Technical SEO
 Tuần 9-10:  Phase 5  - Analytics
 Tuần 10+:   Phase 6  - Local SEO (ongoing)
 Tuần 10-14: Phase 7  - Tính năng bổ sung
 Tuần 10-14: Phase 8  - Profile & Mở rộng

═══════════════════════════════════════════════════════════════════
 GIAI ĐOẠN 2: ADMIN PLATFORM (Tuần 15-32)
═══════════════════════════════════════════════════════════════════
 Tuần 15-17: Phase 9  - RBAC + Auth nâng cao (CRITICAL)
 Tuần 17-20: Phase 10 - Admin Dashboard & UI Components
 Tuần 20-24: Phase 11 - CRM & Quản lý KH
 Tuần 24-28: Phase 12 - Order Management & Tài chính
 Tuần 28-32: Phase 13 - Internal Tools (Project Mgmt, Notifications, etc.)

═══════════════════════════════════════════════════════════════════
 GIAI ĐOẠN 3: SCALE & OPTIMIZE (Tuần 32-40)
═══════════════════════════════════════════════════════════════════
 Tuần 32-34: Phase 14 - Security, Backup, Infrastructure
 Tuần 34-38: Phase 15 - Payment & Third-party Integrations
 Tuần 38-40: Phase 16 - AI & Automation

═══════════════════════════════════════════════════════════════════
 ONGOING: SEO, Content Marketing, Backlinks, Optimization
═══════════════════════════════════════════════════════════════════
```

**Tổng thời gian phát triển toàn bộ: ~40 tuần (10 tháng)**
**Milestone chính:**
- Tháng 3-4: Website public hoàn chỉnh + SEO ready
- Tháng 5-6: Admin Dashboard + RBAC hoạt động
- Tháng 6-7: CRM + Order Management
- Tháng 7-8: Internal Tools + Notifications
- Tháng 8-9: Security + Payment Integrations
- Tháng 9-10: AI Features + Automation

---

## CHECKLIST ADMIN TRƯỚC KHI LAUNCH

### Security & Auth
- [ ] RBAC hoạt động đúng cho tất cả roles
- [ ] 2FA đã triển khai cho admin accounts
- [ ] Rate limiting trên tất cả API endpoints
- [ ] CSRF protection active
- [ ] Session management hoạt động (timeout, multi-device)
- [ ] Password policy enforced
- [ ] Audit log ghi nhận mọi action

### Admin UI
- [ ] Dashboard load < 2s, tất cả charts render đúng
- [ ] DataTable: sort, filter, search, pagination, export hoạt động
- [ ] Kanban board drag & drop smooth
- [ ] Responsive trên tablet (admin ít dùng mobile)
- [ ] Dark mode hoạt động (admin hay làm đêm)
- [ ] Cmd+K global search hoạt động
- [ ] Breadcrumb navigation đúng trên mọi trang

### CRM & Sales
- [ ] Contact CRUD hoạt động, lead scoring tính đúng
- [ ] Deal pipeline drag & drop smooth
- [ ] Customer 360 view hiển thị đủ data
- [ ] Activity feed real-time
- [ ] Email templates gửi thành công

### Orders & Finance
- [ ] Order workflow chuyển status đúng
- [ ] Payment tracking chính xác
- [ ] Invoice PDF generate đúng format
- [ ] Revenue dashboard số liệu khớp
- [ ] Order number auto-increment đúng

### Infrastructure
- [ ] Backup đã cấu hình, test restore thành công
- [ ] Sentry error tracking hoạt động
- [ ] UptimeRobot monitoring active
- [ ] CI/CD pipeline chạy thành công
- [ ] Staging environment mirror production
