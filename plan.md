# LOOP - Architecture Analysis Plan
## Phân tích kiến trúc & Kế hoạch cải thiện toàn diện

> **Tech Stack hiện tại:** Next.js 15 (App Router) + Prisma 7 + Neon PostgreSQL + Sanity CMS + Cloudinary + TailwindCSS 4 + next-intl (vi/en) + NextAuth v5
> **Deploy:** Vercel (inferred) | **DB:** Neon Serverless PostgreSQL

---

## I. PERFORMANCE & TỐC ĐỘ (Speed Optimization)

### 1.1 Vấn đề hiện tại
| Vấn đề | Mức độ | Chi tiết |
|--------|--------|----------|
| **Font loading chặn render** | 🔴 Critical | Google Fonts load qua `<link>` trong `<head>` → render-blocking. Cần chuyển sang `next/font` (self-hosted, zero layout shift) |
| **Không có ISR/SSG cho trang tĩnh** | 🔴 Critical | Các trang services, portfolio, team, pricing đều fetch DB mỗi request. Không có `revalidate` hay `generateStaticParams` |
| **RSS feed `force-dynamic`** | 🟡 Medium | `feed.xml/route.ts` dùng `force-dynamic` → mỗi request đều fetch Sanity. Nên cache với `revalidate` |
| **Bundle size chưa tối ưu** | 🟡 Medium | 30+ Radix UI packages + Recharts + Framer Motion + Sanity → bundle lớn. Cần audit và dynamic import |
| **Thiếu Suspense boundaries** | 🟡 Medium | Chỉ có 5 `loading.tsx`. Nhiều route thiếu → trải nghiệm loading kém |
| **Database query không cache** | 🔴 Critical | `queries.ts` gọi Prisma trực tiếp không dùng `unstable_cache` hay React `cache()` → mỗi render đều query DB |
| **Connection pool nhỏ** | 🟡 Medium | `max: 5` connections cho Neon pooler. Ổn cho serverless nhưng cần monitoring |

### 1.2 Hành động cần làm
1. **Chuyển sang `next/font/google`** → tự host Inter font, loại bỏ external request
2. **Thêm ISR cho public pages** → `revalidate = 3600` cho services, portfolio, team, pricing
3. **Implement `generateStaticParams`** cho dynamic routes (`/services/[id]`, `/portfolio/[id]`, `/team/[slug]`)
4. **Wrap Prisma queries với React `cache()` + `unstable_cache()`** cho data layer
5. **Dynamic import** cho components nặng: Recharts, Framer Motion, TawktoChat, SpeedDial
6. **Thêm `loading.tsx`** cho tất cả route segments còn thiếu (blog, contact, about, team, account)
7. **Image optimization audit** → đảm bảo tất cả dùng `next/image` với proper `sizes` prop

---

## II. FLOW & KIẾN TRÚC CODE (Architecture Flow)

### 2.1 Vấn đề hiện tại
| Vấn đề | Mức độ | Chi tiết |
|--------|--------|----------|
| **Dual data source (DB + mockData)** | 🔴 Critical | `sitemap.ts` và nhiều nơi fallback sang `mockData` khi DB fail → dữ liệu không nhất quán |
| **API routes quá nhiều, không có abstraction layer** | 🟡 Medium | 60+ API route handlers, mỗi cái tự viết validation, auth check, error handling riêng |
| **Middleware quá phức tạp** | 🟡 Medium | `middleware.ts` ~220 dòng, xử lý auth + RBAC + i18n + redirect trong 1 file |
| **Không có service layer** | 🔴 Critical | Business logic nằm trực tiếp trong API route handlers. Không tái sử dụng được |
| **Auth check trùng lặp** | 🟡 Medium | Middleware check auth, API route lại check auth lần nữa. Cần centralize |
| **Không có error boundaries** | 🟡 Medium | Thiếu `error.tsx` và `not-found.tsx` cho các route segments |
| **Type definitions rải rác** | 🟢 Low | `src/types/` tồn tại nhưng nhiều API response/request chưa được type |

### 2.2 Hành động cần làm
1. **Tạo Service Layer** (`src/services/`) → tách business logic ra khỏi API routes
2. **Tạo API middleware utilities** → shared validation, auth, error handling wrappers
3. **Loại bỏ mockData fallback** → seed DB đúng cách, dùng error handling thay vì fallback
4. **Tách middleware** thành modules: `auth.middleware.ts`, `rbac.middleware.ts`, `i18n.middleware.ts`
5. **Thêm `error.tsx` và `not-found.tsx`** cho mỗi route segment
6. **Implement Repository Pattern** cho data access → `src/repositories/`

---

## III. KHẢ NĂNG MỞ RỘNG (Scalability)

### 3.1 Vấn đề hiện tại
| Vấn đề | Mức độ | Chi tiết |
|--------|--------|----------|
| **Không có caching layer** | 🔴 Critical | Không Redis/Upstash. Mỗi request đều hit DB trực tiếp |
| **Không có rate limiting** | 🔴 Critical | API endpoints không giới hạn request → dễ bị abuse |
| **Không có queue system** | 🟡 Medium | Email, notifications xử lý đồng bộ trong request cycle |
| **Monolithic architecture** | 🟡 Medium | Admin + Public + API cùng 1 app. Scale = scale tất cả |
| **Không có health check endpoint** | 🟢 Low | Thiếu `/api/health` cho monitoring |
| **Không có Docker** | 🟡 Medium | Không có Dockerfile/docker-compose → khó deploy ngoài Vercel |
| **CI/CD thiếu test** | 🔴 Critical | CI chỉ lint + typecheck + build. Không có test nào (0 test files) |
| **WebSocket (ws) trong dependencies** | 🟡 Medium | Có `ws` package nhưng unclear implementation → cần evaluate |

### 3.2 Hành động cần làm
1. **Thêm Redis/Upstash** → cache layer cho queries, sessions, rate limiting
2. **Implement rate limiting** → `@upstash/ratelimit` cho API routes
3. **Thêm background job queue** → Inngest/Trigger.dev cho email, notifications
4. **Viết tests** → Unit tests cho services, integration tests cho API routes
5. **Tạo Dockerfile** → self-hosted deployment option
6. **Tạo health check endpoint** → `/api/health` check DB + external services
7. **API versioning strategy** → `/api/v1/` prefix cho future breaking changes

---

## IV. DỮ LIỆU & DATABASE (Data Architecture)

### 4.1 Vấn đề hiện tại
| Vấn đề | Mức độ | Chi tiết |
|--------|--------|----------|
| **Schema quá lớn (1150 dòng, 35+ models)** | 🟡 Medium | Khó maintain, cần tách thành modules |
| **Dual CMS (Prisma + Sanity)** | 🟡 Medium | Blog dùng Sanity, còn lại dùng Prisma → 2 nguồn truth, 2 cách quản lý |
| **Thiếu soft delete** | 🟡 Medium | Chỉ có `isActive` flag, không có `deletedAt` cho audit trail |
| **Thiếu database indexes** | 🟡 Medium | Nhiều query patterns thiếu composite index (e.g., `status + createdAt` cho orders) |
| **Không có data validation ở DB level** | 🟢 Low | Dùng Zod ở app level nhưng DB constraints thiếu (e.g., CHECK constraints) |
| **JSON columns thiếu schema** | 🟡 Medium | `data Json?`, `content Json?`, `styles Json?` → không validate structure |
| **Credential trong .env.example** | 🔴 Critical | `.env.example` chứa real credentials (DB URL, API keys, secrets) → security risk |

### 4.2 Hành động cần làm
1. **Rotate tất cả credentials** ngay lập tức (DB password, API keys, AUTH_SECRET đã bị leak trong .env.example)
2. **Thêm soft delete pattern** → `deletedAt DateTime?` cho models quan trọng
3. **Audit & thêm database indexes** theo actual query patterns
4. **Thống nhất CMS strategy** → migrate blog sang Prisma hoặc commit Sanity cho tất cả content
5. **Validate JSON columns** → dùng Zod schemas + custom Prisma middleware
6. **Tách Prisma schema** thành modules (dùng prisma multi-schema nếu supported)

---

## V. BACKUP & DISASTER RECOVERY

### 5.1 Vấn đề hiện tại
| Vấn đề | Mức độ | Chi tiết |
|--------|--------|----------|
| **Không có backup strategy** | 🔴 Critical | Neon có point-in-time recovery nhưng chưa có documented backup plan |
| **Không có migration rollback plan** | 🔴 Critical | Prisma migrations chạy forward-only, không có rollback scripts |
| **Media files không backup** | 🟡 Medium | Cloudinary images chỉ ở 1 nơi. Mất = mất vĩnh viễn |
| **Sanity content không backup** | 🟡 Medium | Blog content chỉ ở Sanity cloud |
| **Không có staging environment** | 🔴 Critical | Development → Production trực tiếp, không có staging |
| **Thiếu monitoring & alerting** | 🔴 Critical | Chỉ có Vercel Analytics. Không có error tracking (Sentry), uptime monitoring |

### 5.2 Hành động cần làm
1. **Neon backup policy** → Configure branch-based backups, test point-in-time recovery
2. **Automated DB export** → Cron job export PostgreSQL dump hàng ngày → S3/R2
3. **Media backup** → Sync Cloudinary assets → backup storage
4. **Sanity export** → Scheduled `sanity dataset export`
5. **Setup staging environment** → Vercel Preview + Neon branch database
6. **Integrate Sentry** → Error tracking cho cả frontend và backend
7. **Uptime monitoring** → BetterStack/UptimeRobot cho production
8. **Migration rollback scripts** → Cho mỗi migration, viết reverse migration

---

## VI. SEO (Search Engine Optimization)

### 6.1 Đã có (tốt)
- ✅ Sitemap.xml dynamic với i18n alternates
- ✅ robots.txt proper configuration
- ✅ OpenGraph + Twitter Card meta tags
- ✅ JSON-LD (Organization + WebSite schema)
- ✅ Canonical URLs + hreflang
- ✅ RSS Feed (`/feed.xml`)
- ✅ Security headers (X-Frame-Options, CSP-related)
- ✅ Google Search Console verification setup
- ✅ Image optimization config (AVIF/WebP)

### 6.2 Vấn đề cần cải thiện
| Vấn đề | Mức độ | Chi tiết |
|--------|--------|----------|
| **Thiếu JSON-LD cho từng page type** | 🟡 Medium | Chỉ có Organization + WebSite ở root. Thiếu Service, Product, Article, FAQ, BreadcrumbList |
| **Không có dynamic OG images** | 🟡 Medium | OG image tĩnh (`/og-image.svg`) cho tất cả pages → CTR thấp khi share |
| **Meta description không dynamic** | 🟡 Medium | Mỗi page cần unique meta description từ content |
| **Thiếu breadcrumb navigation** | 🟡 Medium | Không có breadcrumb UI + BreadcrumbList schema |
| **Blog SEO yếu** | 🔴 Critical | Blog dùng Sanity nhưng thiếu Article schema, author schema, reading time |
| **Thiếu FAQ schema** | 🟢 Low | Pricing/Services pages có thể benefit từ FAQ rich results |
| **Internal linking strategy** | 🟡 Medium | Không có related services/projects → giảm crawl depth |
| **Sitemap thiếu blog posts** | 🔴 Critical | Sitemap chỉ có services + portfolio, không có blog posts + team pages |
| **Core Web Vitals chưa monitor** | 🟡 Medium | Có SpeedInsights nhưng cần structured CWV monitoring |
| **Thiếu lastModified thực tế** | 🟢 Low | Sitemap dùng `new Date()` thay vì actual `updatedAt` từ DB |

### 6.3 Hành động cần làm
1. **JSON-LD cho mỗi page type:**
   - Service pages → `Service` schema
   - Portfolio → `CreativeWork` schema
   - Blog → `Article` + `Person` (author) schema
   - Team → `Person` + `Employee` schema
   - Pricing → `Product` + `Offer` schema
   - Contact → `ContactPage` + `LocalBusiness` schema
2. **Dynamic OG Images** → `next/og` (ImageResponse) cho mỗi page
3. **Breadcrumb component** + `BreadcrumbList` JSON-LD
4. **Thêm blog posts và team pages vào sitemap**
5. **Internal linking** → Related services widget, related projects
6. **Fix lastModified** → dùng actual `updatedAt` timestamps từ DB

---

## VII. GEO (Generative Engine Optimization)

### 7.1 Vấn đề hiện tại
| Vấn đề | Mức độ | Chi tiết |
|--------|--------|----------|
| **Content không structured cho AI extraction** | 🔴 Critical | Thiếu semantic HTML, heading hierarchy không nhất quán |
| **Không có FAQ structured data** | 🟡 Medium | AI engines prioritize Q&A format content |
| **Thiếu "About" entity signals** | 🟡 Medium | AI cần rõ ràng: LOOP là gì, làm gì, ở đâu, phục vụ ai |
| **Không có knowledge base / glossary** | 🟡 Medium | AI engines index educational content tốt hơn marketing content |
| **Content quá thiên marketing** | 🟡 Medium | Cần thêm educational/informational content cho AI indexing |
| **Thiếu author authority signals** | 🟡 Medium | Blog thiếu author bio, credentials, expertise signals |
| **Không có API/data endpoints cho AI** | 🟢 Low | Thiếu `.well-known/ai-plugin.json` hoặc structured data API |

### 7.2 Hành động cần làm
1. **Tối ưu semantic HTML** → proper heading hierarchy (h1 → h2 → h3), `<article>`, `<section>`, `<aside>`
2. **FAQ sections** trên key pages (Services, Pricing) với `FAQPage` schema
3. **Entity disambiguation** → Rõ ràng "LOOP" là company, location, founding year, expertise areas
4. **Knowledge base / Blog strategy** → Educational content targeting "how to", "what is", "best practices"
5. **Author profiles** → Link team members → blog posts, show credentials
6. **Speakable content** → Mark key content sections dễ trích dẫn bằng `Speakable` schema
7. **Structured data API** → `/api/public/company-info` JSON endpoint cho AI crawlers
8. **Long-form content** → Detailed case studies, technical guides → AI-indexable content
9. **Citation-worthy statistics** → Unique data points, research, benchmarks
10. **Multi-language content parity** → Đảm bảo EN content chất lượng = VN (không chỉ dịch máy)

---

## VIII. ĐỘ ƯU TIÊN TỔNG THỂ (Priority Roadmap)

### Phase 1 - Urgent (Tuần 1-2) 🔴
1. Rotate leaked credentials trong `.env.example`
2. Chuyển Google Fonts → `next/font`
3. Thêm ISR cho public pages + React `cache()` cho queries
4. Thêm rate limiting cho API
5. Setup Sentry error tracking
6. Fix sitemap (thêm blog, team, sửa lastModified)

### Phase 2 - Important (Tuần 3-4) 🟡
1. Service layer refactor
2. Dynamic import cho heavy components
3. JSON-LD cho mỗi page type
4. Dynamic OG images
5. Breadcrumb component
6. Backup strategy implementation
7. Staging environment setup

### Phase 3 - Enhancement (Tuần 5-8) 🟢
1. Redis/Upstash caching layer
2. Background job queue
3. Testing infrastructure (unit + integration)
4. GEO optimization (FAQ, knowledge base, semantic HTML)
5. Dockerfile + self-hosted option
6. API versioning
7. Monitoring & alerting dashboard

### Phase 4 - Future (Tháng 3+) 🔵
1. Microservices consideration (tách admin)
2. Edge computing strategy
3. AI-powered content optimization
4. Advanced analytics pipeline
5. Multi-tenant architecture (nếu scale agency model)

---

## IX. METRICS ĐO LƯỜNG

| Metric | Hiện tại (ước tính) | Mục tiêu |
|--------|---------------------|----------|
| Lighthouse Performance | ~70-75 | 95+ |
| First Contentful Paint | ~2.5s | <1.2s |
| Largest Contentful Paint | ~4s | <2.5s |
| Time to Interactive | ~5s | <3s |
| Cumulative Layout Shift | ~0.15 | <0.1 |
| API Response Time (p95) | ~500ms | <200ms |
| Test Coverage | 0% | >70% |
| Uptime | Unknown | 99.9% |
| SEO Score (Lighthouse) | ~80 | 95+ |

---

*Plan created: 2026-03-20*
*Project: LOOP - Web Development Agency Platform*
