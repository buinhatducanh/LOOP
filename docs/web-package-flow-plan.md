# Web Package Purchase Flow — Implementation Plan

> **Version**: 1.5.0 · Date: 2026-04-13
> **Status**: Phase 1 + 2B + 2C + 3 complete ✅ (Schema + Domain Search + Inngest Cron + Admin Hosting/Domain Tabs + SSE Filter + Vercel Deploy API)
> **Author**: Claude (PO advisor)
>
> **PO Decisions (2026-04-13)**:
> - Pricing page: mở rộng `/pricing`, cho chọn custom design HOẶC template có sẵn
> - Git repo: plain URL string, PM nhập tay
> - WHOIS: free API (khuyến nghị: see Section 4.1)
> - Auto-renew thanh toán: không tích hợp, chỉ notify

---

## Implementation Status

### ✅ Phase 1 — Schema & Infrastructure

| Item | Status | File |
|------|--------|------|
| PricingWebPackage.templateRepoUrl | ✅ Done | `prisma/schema.prisma` |
| CustomerWebsite domain/hosting fields | ✅ Done | `prisma/schema.prisma` |
| CustomerWebsite vercel fields | ✅ Done | `prisma/schema.prisma` |
| CustomerWebsite auto-renew flags | ✅ Done | `prisma/schema.prisma` |
| CustomerWebsite separate expiry timestamps | ✅ Done | `prisma/schema.prisma` |
| OrderRevenueLine model | ✅ Done | `prisma/schema.prisma` |
| Invoice model (reuse existing) | ✅ Done | `prisma/schema.prisma` |
| OrderCostLine model | ✅ Done | `prisma/schema.prisma` |
| Hosting/Domain pricing seed | ✅ Done | `prisma/seed.ts` |
| Domain-search API (Cloudflare DoH) | ✅ Done | `src/app/api/pricing/domain-search/route.ts` |
| Hosting plans API | ✅ Done | `src/app/api/pricing/hosting-plans/route.ts` |
| Portal domain-purchase API | ✅ Done | `src/app/api/portal/domain-purchase/route.ts` |
| Inngest expiry cron | ✅ Done | `src/lib/jobs/functions.ts` |
| Migration file | ✅ Done | `prisma/migrations/20260413_143000_add_web_package_fields/` |

### ✅ Phase 2 — Admin & Portal UI

| Item | Status | File |
|------|--------|------|
| Admin web_packages tab | ✅ Done | `src/app/admin/web_packages/page.tsx` |
| Portal web-purchase wizard | ✅ Done | `src/components/landing/WebPurchaseWizard.tsx` |
| Portal web-purchase API | ✅ Done | `src/app/api/portal/web-purchase/route.ts` |
| Public web-packages API | ✅ Done | `src/app/api/v1/web-packages/route.ts` |
| Pricing page mode toggle | ✅ Done | `src/components/landing/PricingModeToggle.tsx` |
| Vercel deploy API | ✅ Done | `src/app/api/admin/customer-websites/[id]/deploy/route.ts` |
| Admin pricing → Hosting tab | ✅ Done | `src/app/admin/pricing/page.tsx` |
| Admin pricing → Domain Prices tab | ✅ Done | `src/app/admin/pricing/page.tsx` |
| Hosting plans admin API | ✅ Done | `src/app/api/admin/pricing/hosting-plans/route.ts` |
| Domain prices admin API | ✅ Done | `src/app/api/admin/pricing/domain-prices/route.ts` |
| Invoice + Revenue line API | ✅ Done | Revenue lines created in `portal/web-purchase` |
| SSE filter by tab permissions | ✅ Done | `src/app/api/admin/events/stream/route.ts` |

---

## Tổng quan nghiệp vụ

LOOP cung cấp **2 dịch vụ website**:

| Dịch vụ | Mô tả | Đặc điểm |
|---------|--------|----------|
| **Template Package** | Giao diện có sẵn + Headless API BE gắn vào | Giá rẻ, làm nhanh |
| **Custom Design** | Thiết kế riêng cho khách hàng | Thu nhập chính |

**Cả hai đều đi kèm**: domain + hosting + dịch vụ y (cùng dải tùy quy mô).

---

## 1. Schema Changes

### 1.1 CustomerWebsite — thêm fields

Thêm vào `prisma/schema.prisma` model `CustomerWebsite`:

```prisma
model CustomerWebsite {
 // ... existing fields ...

 // Domain purchase info
 registeredAt DateTime? @map("registered_at") // Admin xác nhận đăng ký domain → set ngày này
 domainTermMonths Int @default(12) @map("domain_term_months") // 12 hoặc 24 tháng
 domainCost Int @default(0) @map("domain_cost") // VNĐ đã thanh toán (tổng)
 domainTld String? @map("domain_tld") // ".vn" | ".com" | ".com.vn"

 // Hosting purchase info
 hostingPlanId String? @map("hosting_plan_id") // FK → PricingHostingPlan
 hostingTermMonths Int @default(12) @map("hosting_term_months") // 6 | 12 | 24
 hostingCost Int @default(0)  @map("hosting_cost") // VNĐ đã thanh toán (tổng)

 // Vercel deployment
 vercelProjectId  String? @map("vercel_project_id")
 vercelProjectUrl String? @map("vercel_project_url")

 // Auto-renewal flag
 autoRenewDomain Boolean @default(false)  @map("auto_renew_domain")
 autoRenewHosting Boolean @default(false) @map("auto_renew_hosting")

 // Relations
 hostingPlan PricingHostingPlan? @relation(fields: [hostingPlanId], references: [id])

 // Timestamps
 domainExpiresAt DateTime? @map("domain_expires_at") // = registeredAt + domainTermMonths
 hostingExpiresAt DateTime? @map("hosting_expires_at") // = deployedAt + hostingTermMonths

 @@index([domainExpiresAt])
 @@index([hostingExpiresAt])
}
```

**Lý do**: Trường `expiresAt` chung hiện tại không phân biệt domain vs hosting (2 thứ có term khác nhau). Tách ra 2 trường riêng để cron job notify chính xác.

### 1.2 Migration

```bash
npx prisma migrate dev --name add_web_package_fields
```

---

## 2. PricingHostingPlan — Seed data

Admin quản lý trong `Admin → Pricing → Hosting Plans`. Seed mẫu:

| Slug | Name | Monthly Price | Months | Discount | Total |
|------|------|--------------|--------|----------|-------|
| `starter-2gb` | Gói Starter 2GB | 40,000 VND | 12 | 0% | 480,000 VND |
| `starter-2gb-2yr` | Gói Starter 2GB — 2 năm | 40,000 VND | 24 | ~17% | 800,000 VND |
| `pro-5gb` | Gói Pro 5GB | 80,000 VND | 12 | 0% | 960,000 VND |
| `pro-5gb-2yr` | Gói Pro 5GB — 2 năm | 80,000 VND | 24 | ~17% | 1,600,000 VND |
| `business-10gb` | Gói Business 10GB | 150,000 VND | 12 | 5% | 1,710,000 VND |
| `business-10gb-2yr` | Gói Business 10GB — 2 năm | 150,000 VND | 24 | ~20% | 2,880,000 VND |

**Công thức**:
```
totalCost = monthlyPrice × months × (1 - discountPct / 100)
```

### 2.1 PricingDomainPrice — Seed data

| Extension | Registration Price | Renewal Price | Period |
|-----------|-------------------|---------------|--------|
| `.vn` | 599,000 VND | 550,000 VND | 1 năm |
| `.com.vn` | 350,000 VND | 320,000 VND | 1 năm |
| `.com` | 350,000 VND | 320,000 VND | 1 năm |

---

## 3. Customer Purchase Flow — Mở rộng `/pricing`

### 3.1 Trang Pricing nâng cấp

Mở rộng trang `src/app/[locale]/pricing/page.tsx` hiện có, thay vì tạo trang mới.

**Layout mới**:

```
/pricing
 ├── [Toggle] Chế độ xem: ● Theo dịch vụ ○ Theo gói web
 │
 ├── ═══════════════════════════════════════════
 │ CHẾ ĐỘ 1: Theo dịch vụ (hiện tại — giữ nguyên)
 │ ├── Web tùy chỉnh — báo giá riêng (Wizard 8 bước)
 │ ├── Landing page — báo giá
 │ └── Dashboard/SaaS — báo giá
 │
 ├── ═══════════════════════════════════════════
 │ CHẾ ĐỘ 2: Theo gói web (MỚI)
 │ ├── ══════════════════════════════
 │ │ Bước 1: Chọn loại
 │ │ ┌─────────────────┐ ┌─────────────────────┐
 │ │ │ 🎨 Template │ │ ✨ Custom Design │
 │ │ │ Gói có sẵn │ │ Thiết kế riêng  │
 │ │ │ Nhanh & rẻ │ │ Báo giá riêng │
 │ │ └─────────────────┘ └─────────────────────┘
 │ │
 │ │ (Nếu chọn Template)
 │ │ ══════════════════════════════
 │ │ Bước 2: Chọn gói web (PricingWebPackage)
 │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ │ │ Nhà hàng │ │ Spa │ │ Khách sạn │
 │ │ │ 12 trang │ │ 8 trang │ │ 15 trang │
 │ │ │ 8M VNĐ │ │ 6M VNĐ │ │ 12M VNĐ │
 │ │ └──────────┘ └──────────┘ └──────────┘
 │ │
 │ │ Bước 3: Domain + Hosting (pricing section mới)
 │ │ ┌────────────────────────────────┐ [Tìm domain]
 │ │ │ Nhập tên miền: dongho │
 │ │ └────────────────────────────────┘
 │ │ ☑ dongho.vn — 599,000đ/năm ✓
 │ │ ☐ dongho.com.vn — 350,000đ/năm
 │ │ ☐ dongho.com — 350,000đ/năm
 │ │
 │ │ Hosting:
 │ │ ○ 2GB/40K/tháng ● 5GB/80K/tháng ○ 10GB/150K/tháng
 │ │ Term: ○ 6 tháng ● 12 tháng ○ 24 tháng
 │ │
 │ │ ───────────────────────────────────
 │ │ Tạm tính:
 │ │ Template: 8,000,000đ
 │ │ Domain: 599,000đ
 │ │ Hosting (12 tháng): 960,000đ
 │ │ ─────────────────────────
 │ │ TỔNG: 9,559,000đ
 │ │ [Tiếp tục đặt hàng →]
 │ │
 │ │ (Nếu chọn Custom Design)
 │ │ → Redirect sang Wizard 8 bước (/dat-lich)
 │ │ với pre-fill dịch vụ "custom_web"
 └──
```

**UI Flow**:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Chọn dịch vụ │
│ ┌─────────────────┐ ┌─────────────────────┐  │
│ │ 🎨 Template │ │ ✨ Custom Design │ │
│ │ Gói có sẵn │ │ Thiết kế riêng │ │
│ │ Từ X VNĐ │ │ Từ Y VNĐ │ │
│ └─────────────────┘ └─────────────────────┘ │
│ │
│ 2. Chọn gói web (nếu Template) │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Nhà hàng │ │ Spa │ │ Khách sạn │  │
│ │ 12 trang │ │ 8 trang │ │ 15 trang │  │
│ └──────────┘ └──────────┘ └──────────┘ │
│ (PricingWebPackage — có slug, name, price) │
│ │
│ 3. Domain │
│ ┌──────────────────────────────────┐ [Kiểm tra] │
│ │ Nhập tên miền: dongho │ │
│ └──────────────────────────────────┘ │
│ Kết quả:  │
│ ☑ dongho.vn — 599,000 VND/năm [+ Chọn] │
│ ☐ dongho.com.vn — 350,000 VND/năm [+ Chọn] │
│ ☐ dongho.com — 350,000 VND/năm [+ Chọn] │
│ │
│ 4. Hosting │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ 2GB/40K │ │ 5GB/80K │ │ 10GB/150K│ │
│ │ 12 tháng │ │ 12 tháng │ │ 12 tháng │ │
│ │ 480,000đ │ │ 960,000đ │ │1,710,000đ │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│ Term: ○ 6 tháng ● 12 tháng ○ 24 tháng │
│ (Cập nhật total khi đổi term) │
│ │
│ ───────────────────────────────────────────── │
│ Tổng cộng:  │
│ Template: 8,000,000 VND │
│ Domain:  599,000 VND (1 năm) │
│ Hosting: 480,000 VND (12 tháng) │
│ ───────────────────────── │
│ TỔNG: 9,079,000 VND │
│ [Đặt hàng] │
└─────────────────────────────────────────────────────────────┘
```

### Bước 2: Tạo Order + Payment

```
POST /api/portal/web-purchase (API mới)
 ├── Tạo Order (orderType: "web_package")
 │ ├── domainName = "dongho.vn"
 │ ├── domainCost = 599,000
 │ ├── hostingCost = 480,000
 │ ├── packageId = PricingWebPackage.id
 │ └── status = "pending_payment"
 ├── Tạo CustomerWebsite (pending)
 │ ├── domain = "dongho.vn"
 │ ├── domainTermMonths = 12
 │ ├── domainTld = ".vn"
 │ ├── hostingPlanId = PricingHostingPlan.id
 │ ├── hostingTermMonths = 12
 │ ├── hostingCost = 480,000
 │ ├── configStatus = "pending_config"
 │ ├── domainExpiresAt = null (set khi admin duyệt)
 │ └── hostingExpiresAt = null
 └── Trả về Order → redirect thanh toán
```

---

## 4. Domain Search — API & UI

### 4.1 WHOIS Integration — Free API

**Khuyến nghị: dùng Cloudflare + DNS lookup (hoàn toàn miễn phí)**

Cloudflare cung cấp public DNS-over-HTTPS API — không cần API key:

```typescript
// GET /api/pricing/domain-search?keyword=dongho
async function checkDomainAvailability(keyword: string, tlds: string[]): Promise<DomainResult[]> {
  const results: DomainResult[] = [];

 for (const tld of tlds) {
 const fullDomain = `${keyword}${tld}`;
 const base = keyword.replace(/\s+/g, "").toLowerCase();

 // 1. Check local DB (domain đã mua trong hệ thống)
 const purchased = await prisma.customerWebsite.findFirst({
 where: { domain: fullDomain },
 });
 if (purchased) {
 results.push({ ...buildResult(keyword, tld, fullDomain), available: false, reason: "already_registered" });
 continue;
 }

 // 2. Check reserved/blocked keywords
 if (BLOCKED_KEYWORDS.includes(base) || base.length < 2) {
  results.push({ ...buildResult(keyword, tld, fullDomain), available: false, reason: "invalid" });
 continue;
 }

 // 3. Cloudflare DNS-over-HTTPS check
 // Nếu domain có A/AAAA record → đã có người trỏ → taken
 // Nếu NXDOMAIN → chưa có ai đăng ký → available
 let dnsStatus: "taken" | "available" | "unknown" = "unknown";

 try {
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 3000);

 const res = await fetch(
 `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(fullDomain)}&type=A`,
 {
 headers: { Accept: "application/dns-json" },
 signal: controller.signal,
 }
 );
 clearTimeout(timeout);

 if (res.ok) {
 const json = await res.json();
 // NXDOMAIN = Status: 3 (NOERROR có records = taken)
 const status = json.Status ?? 0;
 dnsStatus = (status === 3 || !json.Answer) ? "available" : "taken";
 }
 } catch {
 dnsStatus = "unknown"; // fallback: coi là unknown
 }

 // 4. Map price từ PricingDomainPrice
 const domainPrice = await prisma.pricingDomainPrice.findUnique({
 where: { extension: tld },
 });

 results.push({
 keyword,
 tld,
 fullDomain,
 available: dnsStatus === "available",
 dnsChecked: true,
 registrationPrice: domainPrice?.registrationPrice ?? 0,
 renewalPrice: domainPrice?.renewalPrice ?? 0,
 registrationYears: 1,
 totalPrice: domainPrice?.registrationPrice ?? 0,
 });
 }

 // Sort: .vn first, available first
 return results.sort((a, b) => {
 if (a.tld === ".vn" && b.tld !== ".vn") return -1;
 if (b.tld === ".vn" && a.tld !== ".vn") return 1;
 if (a.available !== b.available) return a.available ? -1 : 1;
 return 0;
 });
}
```

**Ưu điểm**:
- Miễn phí, không giới hạn
- Không cần API key
- Response nhanh (<3s)
- Đánh dấu `dnsChecked: true` để biết đã verify thật hay fallback

**Hạn chế**:
- DNS check không phải WHOIS — domain có thể đã đăng ký nhưng chưa trỏ DNS (rare)
- Không check được domain giữ chỗ (reserved) của registrar
- Không hoạt động với someccTLD (.vn, .io) có DNS riêng

**Fallback**: Nếu DNS check fail → hiển thị "Chưa xác nhận được — vui lòng liên hệ sales để kiểm tra". Không bao giờ nói sai "có sẵn" nếu không chắc.

**Giải thích cho khách**: "Hệ thống tự động kiểm tra. Nếu tên miền hiển thị ✓, bạn có thể đặt. Nếu hiển thị ?, vui lòng liên hệ sales xác nhận."

**Tích hợp WHOIS thật (P3)**:
Khi LOOP cần chắc chắn 100%, dùng **WhoisXML API** (500 lookups/tháng free):
```
GET https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=KEY&domainName=dongho.vn&outputFormat=json
```
Response: `WhoisRecord.dataError === "MISSING"` → available.

### 4.2 Domain Search API — Mới

**`GET /api/pricing/domain-search?keyword=dongho`**

```typescript
// Response
{
 data: [
 {
 keyword: "dongho",
 tld: ".vn",
 fullDomain: "dongho.vn",
 available: true,
 registrationPrice: 599000, // từ PricingDomainPrice
 renewalPrice: 550000,
 registrationYears: 1,
 totalPrice: 599000,
 discountedPrice: null,
 },
 {
 keyword: "dongho",
 tld: ".com.vn",
 fullDomain: "dongho.com.vn",
 available: true,
 registrationPrice: 350000,
 renewalPrice: 320000,
 totalPrice: 350000,
 },
 {
 keyword: "dongho",
 tld: ".com",
 fullDomain: "dongho.com",
 available: false, // WHOIS taken
 registrationPrice: 350000,
 renewalPrice: 320000,
 },
 ]
}
```

**Logic**:
1. Query `PricingDomainPrice` → lấy danh sách TLD active
2. WHOIS check từng TLD với keyword
3. Filter TLD đã mua trong hệ thống (`CustomerWebsite`)
4. Map price từ `PricingDomainPrice`
5. **Đánh dấu available = true nếu** WHOIS available VÀ chưa trong DB

**Đánh dấu khả dụng (highlight)**:
- `.vn` luôn ưu tiên hiển thị đầu
- TLD có `available: true` → border xanh lá, icon ✓
- TLD có `available: false` → opacity 50%, icon ✗, không chọn được

### 4.3 Multi-year domain registration

Admin seed `PricingDomainPrice` thêm cột cho 2 năm (hoặc tính tự động: 2 năm = giá × 2 - discount).

---

## 5. Hosting Term Calculator

### 5.1 Frontend logic

```typescript
// Tính tổng hosting dựa trên PricingHostingPlan
function calculateHostingTotal(plan: PricingHostingPlan, termMonths: number): number {
 const monthlyPrice = plan.monthlyPrice;
 const months = termMonths;
 const discountPct = plan.discountPct; // áp dụng nếu mua >= plan.months
 const effectiveDiscount = months >= plan.months ? discountPct : 0;
 return Math.round(monthlyPrice * months * (1 - effectiveDiscount / 100));
}

// Ví dụ:
// starter-2gb (40K/tháng, 12 tháng, 0% discount)
// 6 tháng: 40,000 × 6 = 240,000 VND
// 12 tháng: 40,000 × 12 = 480,000 VND
// 24 tháng: 40,000 × 24 × 0.83 ≈ 800,000 VND (17% off)
```

### 5.2 Term selector UI

```
Term hosting:
 ○ 6 tháng — không có discount
 ● 12 tháng — theo gói (0%)
 ○ 24 tháng — discount ~17% (tùy gói)
```

### 5.3 Admin pricing page — Hosting tab

Mở rộng `/admin/pricing` tab hiện có, thêm tab "Hosting" để:
- CRUD `PricingHostingPlan`
- Preview calculator (nhập tháng → xem total)
- Đặt monthlyPrice, months (reference), discountPct

---

## 6. Admin Approval Workflow

### 6.1 Admin nhận thông báo

```
Khách đặt hàng
 ↓
Admin thấy notification trong Notification Center
 ↓ loại: "web_purchase_pending"
 ↓ priority: "high"
 ↓ link: /admin/customer-websites?filter=pending_config
 ↓
Admin duyệt:
 1. Xác nhận domain đã đăng ký thực tế
 2. Set deployedAt = hôm nay
 3. Set domainExpiresAt = hôm nay + domainTermMonths
 4. Set hostingExpiresAt = deployedAt + hostingTermMonths
 5. Set configStatus = "configured"
  6. (Optional) Tạo Vercel project → set vercelProjectId
 ↓
Trạng thái website: "configured"
 ↓
Khách nhận notification: "Website của bạn đã sẵn sàng"
```

### 6.2 Admin customer-websites page

Mở rộng trang `/admin/customer-websites` hiện có:

- **Filter mặc định**: `configStatus = pending_config` (chờ duyệt)
- **Table columns thêm**: Domain, Domain expires, Hosting expires, Registered at, Term
- **Row actions**:
 - `[Xác nhận domain]` → modal: set `registeredAt`, `domainExpiresAt`, `hostingExpiresAt`
 - `[Deploy Vercel]` → gọi API → set `vercelProjectId`, `vercelProjectUrl`
  - `[Cấu hình xong]` → set `configStatus = "configured"`
- **Auto-renew toggle**: on/off cho domain + hosting

---

## 7. Vercel API Integration

### 7.1 Setup

1. Tạo Vercel API Token: `https://vercel.com/account/tokens`
2. Thêm env var: `VERCEL_API_TOKEN` (secret)
3. Tạo team/org ID: `VERCEL_TEAM_ID`

### 7.2 Auto-create project API

**`POST /api/admin/customer-websites/[id]/deploy`** (admin action)

```typescript
// src/app/api/admin/customer-websites/[id]/deploy/route.ts

async function deployToVercel(customerWebsiteId: string, session: SessionUser) {
 const website = await prisma.customerWebsite.findUnique({ where: { id: customerWebsiteId } });
 if (!website) throw new Error("Website not found");

 const package = website.packageId
 ? await prisma.pricingWebPackage.findUnique({ where: { id: website.packageId } })
 : null;

 // 1. Create Vercel project
 const response = await fetch("https://api.vercel.com/v13/projects", {
 method: "POST",
 headers: {
 "Authorization": `Bearer ${process.env.VERCEL_API_TOKEN}`,
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 name: website.domain?.replace(/\.(vn|com\.vn|com)$/, "") ?? `site-${website.id}`,
 framework: "nextjs",
 teamId: process.env.VERCEL_TEAM_ID,
 // Git repository nếu có template repo
 gitRepository: package?.templateRepoUrl ? {
 type: "github",
 repo: package.templateRepoUrl,
 } : undefined,
  environmentVariables: [
 { key: "CUSTOMER_NAME", value: website.customerName ?? "" },
 { key: "WEBSITE_DOMAIN", value: website.domain ?? "" },
 ],
 }),
 });

 if (!response.ok) {
 // Fallback: mark as manual
 await prisma.customerWebsite.update({
 where: { id: customerWebsiteId },
 data: { configStatus: "pending_manual_deploy" },
 });
 throw new Error(`Vercel API error: ${response.statusText}`);
 }

 const vercelProject = await response.json();

 // 2. Update CustomerWebsite
 await prisma.customerWebsite.update({
 where: { id: customerWebsiteId },
 data: {
 vercelProjectId: vercelProject.id,
 vercelProjectUrl: `https://${vercelProject.url}`,
 hostingProvider: "vercel",
 hostingUrl: `https://${vercelProject.url}`,
 },
 });

 return vercelProject;
}
```

### 7.3 Manual fallback

Nếu Vercel API fail → `configStatus = "pending_manual_deploy"` + notification cho admin kèm step-by-step deploy guide.

---

## 8. Expiry Tracking — Inngest Cron

### 8.1 Domain & Hosting Renewal Cron

Thêm vào `src/lib/jobs/functions.ts`:

```typescript
// ─── Domain & Hosting Expiry Notification ─────────────────────────
// Cron: chạy 1 lần/ngày lúc 09:00
// Notify trước 30 ngày, 7 ngày, 1 ngày

export const domainHostingExpiryNotification = inngest.createFunction(
 {
 id: "domain-hosting-expiry-notification",
 name: "Domain & Hosting Expiry",
  rateLimit: { limit: 1, period: "1h" },
 triggers: [{ cron: "0 9 * * *" }],
 },
 async ({ step }) => {
 const now = new Date();
 const notifyDays = [30, 7, 1]; // ngày trước khi hết hạn

 // Step 1: Tìm domain sắp hết hạn
 const expiring = await step.run("find-expiring-websites", async () => {
 const { prisma } = await import("@/lib/prisma");

 const websites = await prisma.customerWebsite.findMany({
 where: {
 status: "active",
 OR: [
 { domainExpiresAt: { not: null, lte: addDays(now, 30), gt: now } },
 { hostingExpiresAt: { not: null, lte: addDays(now, 30), gt: now } },
 ],
 },
 include: {
 order: { select: { id: true, customerId: true } },
 },
 });

 return websites.filter(w => {
 if (!w.domainExpiresAt && !w.hostingExpiresAt) return false;
 const domainDays = w.domainExpiresAt
 ? differenceInDays(w.domainExpiresAt, now)
 : 999;
 const hostingDays = w.hostingExpiresAt
 ? differenceInDays(w.hostingExpiresAt, now)
 : 999;
 return notifyDays.includes(domainDays) || notifyDays.includes(hostingDays);
 });
 });

 let notified = 0;

 for (const website of expiring) {
 await step.run(`notify-website-${website.id}`, async () => {
 const { prisma } = await import("@/lib/prisma");

 const domainDays = website.domainExpiresAt
 ? differenceInDays(website.domainExpiresAt, now)
 : null;
 const hostingDays = website.hostingExpiresAt
 ? differenceInDays(website.hostingExpiresAt, now)
 : null;

 // Notify customer
 if (website.order?.customerId) {
 await prisma.clientNotification.create({
 data: {
 odingId: website.order.customerId,
 type: "renewal_reminder",
 title: "Nhắc nhở gia hạn dịch vụ",
 message: buildRenewalMessage(website, domainDays, hostingDays),
 priority: domainDays === 7 || hostingDays === 7 ? "high" : "normal",
 },
 });
 }

 // Notify relevant admins (web_packages tab)
 await prisma.adminNotification.create({
 data: {
 type: "web_expiry_reminder",
 title: `Nhắc gia hạn: ${website.domain ?? website.name}`,
 message: buildAdminRenewalMessage(website, domainDays, hostingDays),
 link: `/admin/customer-websites/${website.id}`,
 priority: domainDays === 1 || hostingDays === 1 ? "urgent" : "normal",
 },
 });

 notified++;
 });
 }

 return { websitesChecked: expiring.length, notificationsSent: notified };
 }
);
```

**Cần import helpers**:
```typescript
import { addDays, differenceInDays } from "date-fns";
```

### 8.2 Đăng ký function

```typescript
// src/lib/jobs/functions.ts
export const allJobs = [
 // ... existing ...
 domainHostingExpiryNotification,
];
```

---

## 9. Role-Based Notification System

### 9.1 Nguyên tắc

> **Mỗi thành viên chỉ nhận notification liên quan đến tab mình có quyền truy cập.**

```
Phân loại notification theo "tab" nguồn gốc:

| Notification type | Nguồn tab | Ai nhận |
|--------------------|-----------|---------|
| `web_purchase_pending` | web_packages | admin, sales, management |
| `domain_purchase` | web_packages | admin, sales, management |
| `web_expiry_reminder` | web_packages | admin, sales, management |
| `order_created` | orders | admin, pm, sales |
| `payment_received` | orders | admin, finance |
| `new_client_message` | clients | admin, pm |
| `quest_completed` | quests_events | admin, hr |
| `lp_award` | lp_manage | admin, finance |
| `sla_violation` | kanban | admin, pm, engineering |
| `demo_ready` | orders | admin, pm |
| `handover_pending` | orders | admin, pm |

Admin/CEO/Super_admin: nhận TẤT CẢ notification.
```

### 9.2 SSE Filter by Tab

Sửa `src/app/api/admin/events/stream/route.ts`:

```typescript
// Map notification type → tab permission required
const NOTIF_TAB_MAP: Record<string, string> = {
 "web_purchase_pending": "web_packages",
 "domain_purchase": "web_packages",
 "web_expiry_reminder": "web_packages",
 "order_created": "orders",
 "payment_received":  "orders",
 "new_client_message": "clients",
 "quest_completed": "quests_events",
 "lp_award": "lp_manage",
 "sla_violation":  "kanban",
 "sla_warning": "kanban",
 "demo_ready": "orders",
 "handover_pending": "orders",
 // Global — ai cũng nhận
 "system": "*",
 "staff_checkin": "*",
};

// Filter: only send notif if user has tab access
function canSeeNotif(session: SessionUser, type: string): boolean {
 const tab = NOTIF_TAB_MAP[type];
 if (!tab || tab === "*") return true;
 if (isCeo(session) || isSuperAdmin(session) || isAdmin(session)) return true;
 if (session.tabPermissions?.includes(tab)) return true;
 if (session.departmentPermissions[session.departmentId ?? ""]?.includes(tab)) return true;
 return false;
}

// Trong SSE loop, thay vì gửi tất cả:
for (const n of notifications) {
 if (!canSeeNotif(session, n.type)) continue; // <-- filter
 send("notification", { ... });
}
```

### 9.3 Admin Notification Center — Filter UI

Mở rộng `/admin/notification_center/page.tsx`:

```tsx
// Thêm tab filter
const FILTER_TABS = [
 { key: "all", label: "Tất cả" },
 { key: "web_packages", label: "Web & Domain", icon: "🌐" },
 { key: "orders", label: "Đơn hàng", icon: "📦" },
 { key: "lp", label: "LP & Tài chính", icon: "💰" },
 { key: "tasks", label: "Task & SLA", icon: "⚠️" },
 { key: "team", label: "Nhân sự", icon: "👥" },
];

// Filter từ tabPermissions của session user
const visibleTypes = FILTER_TABS.find(t => t.key === activeTab)?.key === "all"
 ? ALL_TYPES
 : ALL_TYPES.filter(t => NOTIF_TAB_MAP[t] === activeTab);
```

### 9.4 Email notification — không spam

```
Email chỉ gửi cho:
 1. Notification priority = "urgent" HOẶC
 2. Notification type = "payment_received" HOẶC
 3. SLA violation/warning

KHÔNG gửi email cho: daily checkin, quest complete, new order (chỉ in-app notification)

Admin tự bật/tắt email notification theo loại trong Settings.
```

### 9.5 Tóm tắt notification rules

| Loại | In-app | Email | RBAC filter |
|------|--------|-------|------------|
| urgent/high priority | ✅ luôn | ✅ luôn | theo tab |
| web_packages | ✅ | ❌ (trừ urgent) | ✅ web_packages |
| orders | ✅ | ❌ (trừ payment) | ✅ orders |
| lp/finance | ✅ | ❌ (trừ urgent) | ✅ lp |
| tasks/sla | ✅ | ✅ (violation/warning) | ✅ kanban |
| global (checkin, quest) | ✅ | ❌ | ❌ (ai cũng thấy) |

---

## 10. File Changes Summary

### Schema (1 file)
```
prisma/schema.prisma
 └── CustomerWebsite: + domainCost, hostingCost, domainTld, domainTermMonths,
 hostingPlanId, hostingTermMonths, registeredAt,
 vercelProjectId, vercelProjectUrl,
 domainExpiresAt, hostingExpiresAt,
 autoRenewDomain, autoRenewHosting
```

### API Routes (3 new, 2 modified)
```
src/app/api/pricing/domain-search/route.ts [NEW]
src/app/api/portal/web-purchase/route.ts [NEW]
src/app/api/admin/customer-websites/[id]/deploy/route.ts [NEW]
src/app/api/admin/events/stream/route.ts [MOD — filter by tab]
src/app/api/portal/domain-purchase/route.ts [MOD — create Order]
```

### Inngest (1 new job)
```
src/lib/jobs/functions.ts
 └── + domainHostingExpiryNotification (cron 09:00 daily)
```

### Pages (3 new/modified)
```
src/app/[locale]/pricing/page.tsx [MOD — extend with web package section]
src/app/admin/customer-websites/page.tsx [MOD — add expiry cols, deploy]
src/app/admin/notification_center/page.tsx [MOD — tab filter + RBAC]
```

### Admin Pricing (1 new tab)
```
src/app/admin/pricing/page.tsx
 └── + Hosting tab (CRUD PricingHostingPlan)
```

---

## 11. Implementation Phases

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| **1A** | Schema migration + domain-search API + pricing seed | Medium | P0 |
| **1B** | Admin approve flow: registeredAt + expiresAt + CustomerWebsite PATCH | Low | P0 |
| **1C** | Portal web-purchase wizard + Order creation | Medium | P0 |
| **2A** | Inngest cron expiry notification | Low | P1 |
| **2B** | Admin pricing → Hosting tab | Low | P1 |
| **2C** | SSE filter by tab permissions | Low | P1 |
| **3A** | Vercel API deploy | Medium | P2 |
| **3B** | Admin notification center tab filter UI | Low | P2 |
| **3C** | Real WHOIS integration (vs fallback) | Medium | P2 |

**Đề xuất**: Làm Phase 1 hoàn chỉnh (1A + 1B + 1C) → test end-to-end → Phase 2 → Phase 3.

---

## Phụ lục A — Advisory: Order Administration cho Revenue & Tax

> **Mục đích**: Tư vấn hệ thống quản trị Order để theo dõi doanh thu chính xác và khai báo thuế dễ dàng.

---

### A.1 Vấn đề hiện tại

Hệ thống có `Order` model với `paidAmount`, nhưng:

| Vấn đề | Hệ quả |
|---------|--------|
| `paidAmount` là 1 field duy nhất | Không phân tách được revenue theo loại dịch vụ |
| Không có revenue categorization | Không biết bao nhiêu từ web, bao nhiêu từ app |
| Invoice không có số serial | Thuế yêu cầu serial number |
| Chi phí không theo dõi riêng | Không tính được gross vs net profit |
| Off-system payment tách biệt | Khó consolidate revenue picture |

---

### A.2 Đề xuất: Revenue Line Items

Thêm model trung gian để phân tách từng dòng doanh thu:

```prisma
// Mỗi Order có nhiều dòng revenue — như hóa đơn thật
model OrderRevenueLine {
 id String @id @default(cuid())
 orderId String @map("order_id")
 category String // "web_package" | "custom_design" | "domain" | "hosting" | "addon"
 serviceName String // "Gói Nhà hàng" | "Domain .vn" | "Hosting 12 tháng"
 packageRef  String? // PricingWebPackage.id hoặc ServicePackage.id
 quantity Int @default(1)
 unitPrice Int  // VNĐ — giá đơn vị
 totalPrice Int // VNĐ — quantity × unitPrice
 periodMonths  Int? // cho domain/hosting (1, 12, 24)
 taxable Boolean @default(true) // domain/hosting có thể không chịu thuế tùy loại
 taxRate Float  @default(0) // 10% VAT, 0% nếu taxable=false
 taxAmount Int @default(0) // totalPrice × taxRate
 invoiceId String? @map("invoice_id") // liên kết hóa đơn
 createdAt DateTime @default(now())

 order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
 invoice  Invoice? @relation(fields: [invoiceId], references: [id])

 @@index([orderId, category])
 @@index([category, createdAt])
}

// Hóa đơn chính thức — có serial cho thuế
model Invoice {
 id String @id @default(cuid())
 invoiceSerial String @unique @map("invoice_serial") // VD: "INV-2026-0001"
 orderId String @map("order_id")
 customerName String
 customerTaxId String? @map("customer_tax_id") // MST khách hàng (bắt buộc nếu KH có công ty)
 customerEmail String
 customerAddress String?
 subtotal  Int // tổng trước thuế
 taxAmount Int // VAT 10%
 totalAmount Int // subtotal + taxAmount
 issuedAt DateTime @default(now()) @map("issued_at")
 dueDate DateTime? @map("due_date")
 status String @default("draft") // draft | issued | cancelled
 paymentStatus String @default("unpaid") // unpaid | partial | paid

 order Order @relation(fields: [orderId], references: [id])
 revenueLines OrderRevenueLine[]

 @@index([invoiceSerial])
 @@index([status, issuedAt])
}
```

---

### A.3 Order Revenue Flow — End-to-End

```
Khách đặt hàng (Template)
 │
 ├── Order tạo với orderType = "web_package"
 │ ├── OrderRevenueLine (web_package): 8,000,000đ
 │ ├── OrderRevenueLine (domain): 599,000đ
 │ └── OrderRevenueLine (hosting): 960,000đ
 │
 ├── Tổng subtotal = 9,559,000đ
 ├── VAT (10%) = 955,900đ
 ├── Total = 10,514,900đ
 │
 ├── Thanh toán 50% → 5,257,450đ
 │ └── Payment (partial): 5,257,450đ
 │
 └── Hoàn thành → Invoice issued
 ├── InvoiceSerial: "INV-2026-0001"
 ├── Status: "issued"
 └── Dùng cho khai báo thuế
```

---

### A.4 Revenue Dashboard — Admin Revenue Tab

Trang `/admin/revenue` nên hiển thị:

```
┌──────────────────────────────────────────────────────────┐
│ Revenue Overview Q1 2026 │
│ │
│ Tổng doanh thu  │ 425,000,000 VND ▲ +18% │
│ Thuế VAT thu │  38,636,000 VND │
│ Đơn hàng hoàn thành │ 12 đơn │
│  │
│ Theo loại dịch vụ: │
│ ┌──────────────────────────────┐ ┌───────────────┐ │
│ │ ████████████ Custom Web 62% │ │ Revenue │ │
│ │ ████ Template  23% │ │ Breakdown │ │
│ │ ██ Domain/Host 15% │ │  │ │
│ └──────────────────────────────┘ └───────────────┘ │
│ │
│ Đơn hàng chờ thanh toán: 3 đơn / 45,000,000đ │
│ Hóa đơn quá hạn: 2 đơn / 18,000,000đ  │
└──────────────────────────────────────────────────────────┘
```

**Tính năng cần**:

| Tính năng | Mô tả |
|-----------|--------|
| Revenue by category | Phân tách web_custom / web_template / domain_hosting / addon |
| VAT tracking | Tổng VAT thu được, có thể export cho thuế |
| Invoice serial | Auto-increment, format "INV-YYYY-NNNN" |
| Outstanding payments | Đơn hàng đã giao nhưng chưa thanh toán đủ |
| Monthly/quarterly/yearly | Pivot theo kỳ — quan trọng cho báo cáo thuế |
| Export CSV/Excel | Revenue report cho kế toán |

---

### A.5 Công thức Revenue cho báo cáo thuế

```typescript
// Revenue report query
const revenueLines = await prisma.orderRevenueLine.findMany({
 where: {
 taxable: true,
 createdAt: { gte: quarterStart, lte: quarterEnd },
 },
 include: { invoice: { select: { status: true } } },
});

// Filter chỉ invoice đã issued (chưa issued = chưa phát sinh nghĩa vụ thuế)
const issued = revenueLines.filter(l => l.invoice?.status === "issued");

const subtotal = issued.reduce((sum, l) => sum + l.totalPrice, 0);
const vatCollected = issued.reduce((sum, l) => sum + l.taxAmount, 0);
const totalRevenue = subtotal + vatCollected;

// Export cho kế toán
const taxReport = {
 period: "Q1 2026",
 totalInvoices: issued.length,
 subtotalVnd: subtotal,
 vat10Percent: vatCollected,
 totalWithVat: totalRevenue,
 byCategory: groupBy(issued, "category"),
 byMonth: groupBy(issued, "month"),
};
```

---

### A.6 Invoice Serial Number Strategy

```typescript
// Auto-generate invoice serial khi issue invoice
async function generateInvoiceSerial(): Promise<string> {
 const year = new Date().getFullYear();
 const lastInvoice = await prisma.invoice.findFirst({
 where: { invoiceSerial: { startsWith: `INV-${year}-` } },
 orderBy: { invoiceSerial: "desc" },
 });

 let nextNum = 1;
 if (lastInvoice) {
 const lastNum = parseInt(lastInvoice.invoiceSerial.split("-")[2] ?? "0");
 nextNum = lastNum + 1;
 }

 return `INV-${year}-${String(nextNum).padStart(4, "0")}`;
 // VD: INV-2026-0001, INV-2026-0002, ...
}
```

**Lưu ý**: Serial không được sửa sau khi phát hành. Nếu hủy → tạo credit note, không xóa invoice cũ.

---

### A.7 Chi phí và Gross Profit (đề xuất P2)

Để tính được profit thực:

```prisma
model OrderCostLine {
 id String @id @default(cuid())
 orderId String @map("order_id")
 category String // "domain_cost" | "hosting_cost" | "lp_payout" | "other"
 description String
 amount Int // VNĐ — chi phí thực tế
 order  Order @relation(...)
}

// Ví dụ:
// Domain mua thật: .vn = 150,000đ (giá cost)
// Hosting thực: 40,000đ/tháng × 12 = 480,000đ
// LP payout cho member (OffSystemPayment): không tính vào cost LOOP
```

Revenue - Cost = Gross Profit. LP payout không phải cost của LOOP — là phân chia cho member.

---

### A.8 Implementation Priority

| Priority | Task | Lý do |
|---------|------|--------|
| **P1** | Thêm `OrderRevenueLine` model + seed migration | Revenue categorization |
| **P1** | Auto-generate invoice serial + Invoice model | Thuế yêu cầu |
| **P2** | Revenue dashboard breakdown by category | Theo dõi doanh thu |
| **P2** | VAT summary export (CSV) | Khai báo thuế |
| **P3** | Chi phí (OrderCostLine) → Gross profit | Biết lãi thực |
| **P3** | Tax report theo quý | Báo cáo kế toán |

