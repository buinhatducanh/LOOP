# Plan: Admin-Configurable Pages & Team Page Nâng Cấp

## Tổng quan

Kiểm tra tất cả trang public, đảm bảo nội dung có thể điều chỉnh từ admin. Đặc biệt nâng cấp trang Đội ngũ (Team) với giao diện premium, thể hiện role hierarchy (CEO, CTO, Lead...), hình ảnh lớn, hiệu ứng "siêu khủng".

---

## Phase 1: Mở rộng TeamMember model (Schema + Admin)

### 1.1 Cập nhật Prisma schema `TeamMember`
Thêm các field mới để hỗ trợ role hierarchy và giao diện premium:
- `roleLevel Int @default(0)` — cấp bậc (0=CEO, 1=CTO/VP, 2=Lead, 3=Senior, 4=Member)
- `roleCategory String?` — phân loại: "leadership", "management", "engineering", "design", "operations"
- `coverImage String?` — ảnh bìa lớn cho trang chi tiết
- `quote String?` — câu nói/slogan cá nhân
- `email String?` — email công khai
- `phone String?` — số điện thoại (tùy chọn)
- `yearsExperience Int?` — số năm kinh nghiệm
- `isFeatured Boolean @default(false)` — đánh dấu thành viên nổi bật (hiển thị lớn hơn)

**File:** `prisma/schema.prisma`

### 1.2 Chạy migration
```bash
npx prisma migrate dev --name add-team-role-hierarchy
```

### 1.3 Cập nhật Admin Team page
Thêm các field mới vào form tạo/sửa team member trong `/admin/team`:
- Dropdown `roleLevel` (CEO/CTO/VP/Lead/Senior/Member)
- Dropdown `roleCategory` (Leadership/Management/Engineering/Design/Operations)
- Input `coverImage`, `quote`, `email`, `phone`, `yearsExperience`
- Toggle `isFeatured`

**File:** `src/app/admin/(content)/team/page.tsx`

### 1.4 Cập nhật API routes
Sửa GET/POST/PUT endpoints để handle các field mới.

**Files:** `src/app/api/admin/team/route.ts`, `src/app/api/admin/team/[id]/route.ts`

---

## Phase 2: Trang Public `/team` — Giao diện "Siêu Khủng"

### 2.1 Tạo public API endpoint
- `GET /api/team` — trả về danh sách team members active, sorted by roleLevel → sortOrder

**File:** `src/app/api/team/route.ts`

### 2.2 Tạo Server page `/team`
Fetch team data từ DB, fallback mock data.

**File:** `src/app/[locale]/team/page.tsx`

### 2.3 Tạo Team Page component — Thiết kế premium

**File:** `src/app/[locale]/team/team-page.tsx`

**Layout thiết kế:**

#### Section 1: Hero Banner
- Full-width gradient + particle/glow effects
- Title "Đội Ngũ Của Chúng Tôi" với animation stagger
- Subtitle từ translations

#### Section 2: Leadership Spotlight (CEO/CTO/VP — roleLevel 0-1)
- **Layout đặc biệt cho CEO:** Card siêu lớn, full-width, ảnh bên trái (cover image), thông tin bên phải
  - Tên + chức danh gradient lớn
  - Quote/slogan cá nhân với typography đặc biệt
  - Bio đầy đủ
  - Social links với hover glow
  - Expertise tags với shimmer effect
  - Badge "Founder & CEO" nổi bật
- **CTO/VP:** Cards lớn 2 cột, cũng nổi bật nhưng nhỏ hơn CEO

#### Section 3: Management & Leads (roleLevel 2)
- Grid 3 cột, card medium với ảnh tròn, role badge màu sắc, expertise chips

#### Section 4: Team Members (roleLevel 3-4)
- Grid 4 cột, card nhỏ gọn nhưng vẫn đẹp
- Hover effect reveal thêm thông tin

#### Hiệu ứng "Siêu khủng":
- Parallax scrolling cho hero
- Staggered fade-in animations (Framer Motion)
- Gradient border glow trên hover
- Card flip/tilt effect (3D perspective)
- Shimmer/sparkle trên leadership cards
- Smooth scroll-triggered animations
- Glassmorphism cards (backdrop-blur)
- Animated connection lines giữa leadership hierarchy

### 2.4 Tạo Team Member Detail page `/team/[slug]`
Trang chi tiết cho từng member khi click.

**File:** `src/app/[locale]/team/[slug]/page.tsx`, `src/app/[locale]/team/[slug]/member-page.tsx`

**Layout:**
- Cover image full-width với overlay gradient
- Avatar lớn floating trên cover
- Thông tin chi tiết: role, bio đầy đủ, expertise với progress bars
- Achievements showcase
- Social links
- Quote block nổi bật
- "Xem thêm thành viên" grid ở cuối

---

## Phase 3: Kiểm tra & Admin-hóa các trang public khác

### 3.1 Home page (`/`)
**Hiện tại:** Services, Projects, Testimonials đã lấy từ DB ✅. Stats lấy từ SiteSettings ✅.
**Cần sửa:**
- Tech stack hardcoded `["React", "Next.js", ...]` trên about-page → chuyển sang SiteSettings hoặc translation keys
- Hero section text đã dùng translations ✅

### 3.2 About page (`/about`)
**Hiện tại:** Team từ DB ✅, Stats từ SiteSettings ✅, Values từ translations ✅
**Cần sửa:**
- Tech stack `["React", "Next.js", "TypeScript", ...]` hardcoded tại line 415-418 → lấy từ SiteSettings key `tech_stack` (comma-separated)
- Link team members tới `/team/[slug]` đã có nhưng page chưa tồn tại → sẽ được tạo ở Phase 2

### 3.3 Pricing page (`/pricing`)
- Kiểm tra giá cố định vs DB
- Đảm bảo tên gói, mô tả lấy từ admin (packages/pricing-features)

### 3.4 Services page (`/services`)
- Đã lấy từ DB ✅

### 3.5 Portfolio page (`/portfolio`)
- Đã lấy từ DB ✅

### 3.6 Contact page (`/contact`)
- Kiểm tra thông tin liên hệ (địa chỉ, email, phone) → lấy từ SiteSettings

### 3.7 Terms & Privacy pages
- Hiện tại là static text → thêm SiteSettings keys hoặc giữ nguyên (ít thay đổi)

---

## Phase 4: Thêm SiteSettings keys mới

Trong admin Settings (`/admin/settings`), thêm:
- `tech_stack` — danh sách công nghệ (comma-separated)
- `team_page_title` — tiêu đề trang team
- `team_page_subtitle` — phụ đề trang team
- `company_address` — địa chỉ công ty
- `company_email` — email công ty
- `company_phone` — số điện thoại

**File:** `src/app/admin/(system)/settings/page.tsx`

---

## Phase 5: Cập nhật mockData

Cập nhật `mockTeamMembers` trong `src/data/mockData.ts` với các field mới (roleLevel, roleCategory, coverImage, quote, isFeatured) để fallback data cũng hiển thị đẹp.

---

## Tóm tắt file cần tạo/sửa

| File | Hành động |
|---|---|
| `prisma/schema.prisma` | Sửa — thêm fields TeamMember |
| `src/app/api/admin/team/route.ts` | Sửa — handle new fields |
| `src/app/api/admin/team/[id]/route.ts` | Sửa — handle new fields |
| `src/app/api/team/route.ts` | **Tạo mới** — public API |
| `src/app/api/team/[slug]/route.ts` | **Tạo mới** — public API detail |
| `src/app/admin/(content)/team/page.tsx` | Sửa — thêm form fields |
| `src/app/[locale]/team/page.tsx` | **Tạo mới** — server page |
| `src/app/[locale]/team/team-page.tsx` | **Tạo mới** — premium UI |
| `src/app/[locale]/team/[slug]/page.tsx` | **Tạo mới** — member detail server |
| `src/app/[locale]/team/[slug]/member-page.tsx` | **Tạo mới** — member detail UI |
| `src/app/[locale]/about/about-page.tsx` | Sửa — dynamic tech stack |
| `src/app/admin/(system)/settings/page.tsx` | Sửa — thêm setting keys |
| `src/data/mockData.ts` | Sửa — update mock team data |
| `src/lib/db/queries.ts` | Sửa — thêm query getTeamMemberBySlug |

---

## Thứ tự thực hiện

1. Phase 1 (Schema + Admin) → migrate DB
2. Phase 2 (Public team pages) → UI premium
3. Phase 3 (Audit các trang khác) → fix hardcoded values
4. Phase 4 (Settings keys) → admin config
5. Phase 5 (Mock data update)
6. Commit & Push
