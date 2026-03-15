# PLATFORM ARCHITECTURE — Nền tảng Dịch vụ Website

> Phiên bản: 1.0
> Ngày: 2026-03-15
> Trạng thái: Bản thiết kế kiến trúc (chờ triển khai)

---

## MỤC LỤC

1. [Tổng quan hệ thống](#i-tổng-quan-hệ-thống)
2. [Module 1: Quản lý Dự án Custom](#ii-module-1--quản-lý-dự-án-custom-web-thiết-kế-riêng)
3. [Module 2: Quản lý Dự án Mẫu](#iii-module-2--quản-lý-dự-án-mẫu-web-gói)
4. [Module 3: Dịch vụ & Khuyến mãi](#iv-module-3--dịch-vụ-rời--hệ-thống-xp-rewards)
5. [Database Schema mới](#v-database-schema--thiết-kế-mở-rộng)
6. [Business Flow chi tiết](#vi-business-flow-chi-tiết-admin)
7. [Chiến lược triển khai](#vii-chiến-lược-triển-khai)

---

## I. TỔNG QUAN HỆ THỐNG

### Kiến trúc hiện tại (giữ nguyên)

```
Next.js 15 (App Router) + PostgreSQL + Prisma ORM
├─ Server Components: fetch DB trực tiếp (không qua API)
├─ Client Components: nhận data qua props, zero client waterfall
├─ Admin Dashboard: JWT + RBAC middleware
├─ i18n: next-intl (vi/en)
└─ CMS: Sanity (blog only)
```

### 3 Module mới cần phát triển

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Module 1     │  │  Module 2     │  │  Module 3             │  │
│  │  Custom Web   │  │  Web Gói      │  │  Dịch vụ rời +       │  │
│  │  (Thiết kế    │  │  (Template)   │  │  XP Rewards           │  │
│  │   riêng)      │  │               │  │                       │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
│  ┌──────┴─────────────────┴───────────────────────┴──────────┐  │
│  │              KHO TÍNH NĂNG (ServiceAttribute)             │  │
│  │         Cơ bản (price=0)  |  Nâng cao (price>0)           │  │
│  │         Quan hệ cha-con (mutual exclusion)                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              HỆ THỐNG XP & TIERED REWARDS                 │  │
│  │  Mỗi tính năng nâng cao = +N điểm XP                     │  │
│  │  Đạt ngưỡng level (100đ/level) → mở khóa reward          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Nguyên tắc Pricing đã xác nhận

| Loại | Logic giá |
|------|-----------|
| **Custom Web** | `Giá base (admin set) + Σ(giá từng tính năng nâng cao)`. Tính năng cơ bản = 0đ, đi kèm miễn phí |
| **Web Gói** | Giá trọn gói cố định. Admin gán cấp (level) + giá. Khách mua nguyên gói |
| **Dịch vụ rời** | Giá riêng lẻ, có thể mua độc lập. Một số có recurring (SEO hàng tháng) |
| **Rewards** | Hệ thống XP: tính năng nâng cao cho điểm → đạt level → mở khóa ưu đãi |
| **Admin override** | Admin có toàn quyền điều chỉnh giá cuối. Khách chỉ thấy giá sau khi qua queue xử lý |

---

## II. MODULE 1 — Quản lý Dự án Custom (Web Thiết Kế Riêng)

### 2.1 Quản lý Kho Tính năng (Feature Catalog)

#### Cấu trúc tính năng

```
ServiceAttribute (Kho tính năng)
├── tier: "basic" | "advanced"
├── price: 0 (basic) hoặc > 0 (advanced)
├── xpPoints: số điểm XP khi chọn (chỉ advanced)
├── parentId: quan hệ cha-con (mutual exclusion)
│
├── Ví dụ nhóm "Giỏ hàng":
│   ├── Giỏ hàng cơ bản     (tier=basic,    price=0,       parentId=null)
│   └── Giỏ hàng nâng cao   (tier=advanced, price=1000000, parentId=giỏ_cơ_bản)
│       → Khi chọn "nâng cao", tự động loại bỏ "cơ bản"
│
├── Ví dụ nhóm "Phân quyền":
│   ├── Không có phân quyền  (tier=basic,    price=0,       parentId=null)
│   └── Phân quyền nâng cao  (tier=advanced, price=2000000, parentId=null)
│
└── Tính năng độc lập (không có cha-con):
    └── Chat trực tuyến      (tier=advanced, price=500000,  parentId=null)
```

#### Admin Flow: Quản lý tính năng

```
Admin vào "Quản lý Tính năng"
│
├─ [Xem danh sách] ← Bảng với filter theo category, tier, trạng thái
│   Columns: Tên | Nhóm | Cấp độ | Giá | XP | Cha-Con | Trạng thái
│
├─ [Thêm tính năng mới]
│   ├─ Nhập: name, nameVi, description, category
│   ├─ Chọn tier: "basic" hoặc "advanced"
│   ├─ Nếu advanced → nhập price + xpPoints
│   ├─ Chọn parentId (optional): nếu có → tạo quan hệ mutual exclusion
│   ├─ Icon, sortOrder
│   └─ Lưu → validate: parentId phải cùng category
│
├─ [Sửa tính năng]
│   ├─ Sửa giá, XP, thông tin
│   ├─ ⚠ WARNING: Nếu tính năng đang được dùng trong đơn hàng active
│   │   → Hiện cảnh báo "X đơn hàng đang sử dụng tính năng này"
│   │   → Giá cũ đã snapshot trong OrderAttribute.priceAtOrder (không ảnh hưởng)
│   └─ Lưu
│
└─ [Vô hiệu hóa / Xóa]
    ├─ Soft-delete (isActive=false): ẩn khỏi danh sách chọn, giữ lại data
    └─ Hard-delete: chỉ khi không có đơn hàng nào liên kết
```

### 2.2 Quản lý Đơn hàng Custom

#### Cấu hình giá Base

```
Admin vào "Cài đặt giá"
│
└─ Thiết lập giá base cho Web Custom
   ├─ customWebBasePrice: 3,000,000 VND (ví dụ)
   ├─ Lưu vào SiteSetting (key="custom_web_base_price")
   └─ Giá này = phí thiết kế gốc, bao gồm toàn bộ tính năng cơ bản
```

#### Order Lifecycle (Vòng đời đơn hàng Custom)

```
                    ┌─────────────────────────────────────────────────────────┐
                    │              ORDER LIFECYCLE — CUSTOM WEB              │
                    └─────────────────────────────────────────────────────────┘

 [User/Admin]          [Admin Review]           [Production]            [Delivery]
      │                     │                       │                      │
      ▼                     │                       │                      │
 ┌─────────┐                │                       │                      │
 │  DRAFT  │  Khách chọn    │                       │                      │
 │         │  tính năng +   │                       │                      │
 │         │  nhập thông tin│                       │                      │
 └────┬────┘                │                       │                      │
      │ Submit              │                       │                      │
      ▼                     ▼                       │                      │
 ┌─────────┐         ┌───────────┐                  │                      │
 │ PENDING │────────▶│  QUOTED   │  Admin review    │                      │
 │         │ Admin   │           │  + override giá  │                      │
 │         │ duyệt   │           │  nếu cần         │                      │
 └─────────┘ giá     └─────┬─────┘                  │                      │
                           │ Gửi báo giá            │                      │
                           │ (qua queue)            │                      │
                           ▼                        │                      │
                    ┌───────────┐                    │                      │
                    │ ACCEPTED  │ Khách đồng ý       │                      │
                    │           │ báo giá            │                      │
                    └─────┬─────┘                    │                      │
                          │                         │                      │
                          ▼                         │                      │
                   ┌────────────┐                   │                      │
                   │  PAYMENT   │                   │                      │
                   │            │                   │                      │
                   │ ┌────────┐ │                   │                      │
                   │ │100%    │ │ Trả thẳng         │                      │
                   │ │hoặc    │ │                   │                      │
                   │ │50% đợt1│ │ Chia 50-50        │                      │
                   │ └────────┘ │                   │                      │
                   └─────┬──────┘                   │                      │
                         │ Xác nhận                 │                      │
                         │ thanh toán               │                      │
                         ▼                          ▼                      │
                   ┌───────────┐            ┌──────────────┐               │
                   │ CONTRACT  │───────────▶│ DESIGNING    │               │
                   │ SIGNED    │ Kí HĐ     │              │               │
                   └───────────┘            │ Thiết kế UI  │               │
                                            │ demo cho     │               │
                                            │ khách xem    │               │
                                            │ (ngoài HT)   │               │
                                            └──────┬───────┘               │
                                                   │ Khách duyệt          │
                                                   │ UI design            │
                                                   ▼                      │
                                            ┌──────────────┐               │
                                            │ DEVELOPING   │               │
                                            │              │               │
                                            │ Lập trình    │               │
                                            │ theo design  │               │
                                            └──────┬───────┘               │
                                                   │                      │
                                                   ▼                      ▼
                                            ┌──────────────┐        ┌───────────┐
                                            │  REVIEWING   │───────▶│ DELIVERED │
                                            │              │ Nghiệm │           │
                                            │  Khách review│ thu OK │           │
                                            │  + test      │        └─────┬─────┘
                                            └──────────────┘              │
                                                                          │ Nếu 50-50:
                                                                          │ Thu 50% còn lại
                                                                          ▼
                                                                   ┌───────────┐
                                                                   │ COMPLETED │
                                                                   │           │
                                                                   │ Bàn giao  │
                                                                   │ hoàn tất  │
                                                                   └───────────┘
```

#### Trạng thái đơn hàng (enum)

```
draft        → Khách đang chọn tính năng (chưa submit)
pending      → Đã submit, chờ Admin review
quoted       → Admin đã duyệt giá, báo giá đã gửi
accepted     → Khách đồng ý báo giá
paid_partial → Đã thanh toán đợt 1 (50%)
paid_full    → Đã thanh toán 100%
contracted   → Đã kí hợp đồng
designing    → Đang thiết kế UI demo
developing   → Đang lập trình
reviewing    → Khách đang review/nghiệm thu
delivered    → Đã bàn giao
completed    → Hoàn tất (đã thanh toán đủ + bàn giao)
cancelled    → Đã hủy
```

#### Admin Flow: Xử lý đơn hàng Custom

```
Admin vào "Quản lý Đơn hàng"
│
├─ [Danh sách đơn hàng]
│   ├─ Filter: trạng thái, loại (custom/template), ngày, khách hàng
│   ├─ Sort: ngày tạo, tổng tiền, trạng thái
│   └─ Badge: đếm số đơn pending cần xử lý
│
├─ [Xem chi tiết đơn Custom]
│   ├─ Thông tin khách hàng
│   ├─ Danh sách tính năng đã chọn (basic + advanced)
│   ├─ Tính giá tự động:
│   │   ├─ Giá base: 3,000,000 VND
│   │   ├─ + Giỏ hàng nâng cao: 1,000,000
│   │   ├─ + Phân quyền nâng cao: 2,000,000
│   │   ├─ = Tổng hệ thống: 6,000,000
│   │   ├─ XP tích lũy: 40 + 70 = 110 điểm → Level 2
│   │   └─ Rewards đạt được: [hiển thị danh sách]
│   │
│   ├─ [Admin Override giá] ← QUAN TRỌNG
│   │   ├─ Admin nhập "Giá báo khách": 5,500,000 (giảm 500k cho khách quen)
│   │   ├─ Lý do điều chỉnh (bắt buộc): "Khách VIP, giảm 500k"
│   │   ├─ Giá override này được lưu riêng (adminOverridePrice)
│   │   └─ Khách chỉ thấy giá cuối cùng, KHÔNG thấy giá gốc hệ thống
│   │
│   └─ [Chuyển trạng thái]
│       ├─ pending → quoted: Gửi báo giá qua queue (email/notification)
│       ├─ quoted → accepted: Khách xác nhận
│       ├─ accepted → paid_*: Xác nhận thanh toán
│       ├─ paid_* → contracted → designing → developing → reviewing
│       ├─ reviewing → delivered → completed
│       └─ Bất kỳ → cancelled (có lý do)
│
└─ [Tạo đơn mới (Admin sale)]
    ├─ Admin chọn tính năng cho khách (giống flow user)
    ├─ Nhập thông tin khách hàng
    ├─ Preview giá real-time
    ├─ Có thể override giá ngay
    └─ Tạo đơn ở trạng thái "quoted" (bỏ qua pending)
```

---

## III. MODULE 2 — Quản lý Dự án Mẫu (Web Gói)

### 3.1 Cấu trúc Web Gói

```
WebTemplate (đã có trong schema hiện tại)
│
├── Thông tin cơ bản: name, description, thumbnail, demoUrl
├── Giá trọn gói: price, originalPrice (hiển thị giá gạch ngang)
├── Công nghệ: technologies[]
├── Thời gian giao: deliveryTime
│
├── MỚI: level (cấp độ gói)
│   ├── 1 = Cơ bản (Landing page đơn giản)
│   ├── 2 = Trung cấp (Multi-page + form)
│   ├── 3 = Nâng cao (E-commerce cơ bản)
│   ├── 4 = Premium (Full-featured)
│   └── Admin tự đánh giá và gán level
│
├── MỚI: levelLabel / levelLabelVi
│   └── Tên hiển thị cho level ("Gói Cơ bản", "Gói Nâng cao", ...)
│
└── Tính năng đi kèm (bundled):
    └── WebTemplateAttribute → ServiceAttribute (M2M, đã có)
        Hiển thị danh sách tính năng cố định cho khách xem
```

### 3.2 Admin Flow: Quản lý Web Gói

```
Admin vào "Quản lý Web Gói"
│
├─ [Danh sách Templates]
│   ├─ Grid view: thumbnail + tên + giá + level badge
│   ├─ Filter: category, level, trạng thái
│   └─ Sort: sortOrder, giá, level
│
├─ [Thêm/Sửa Template]
│   ├─ Tab 1: Thông tin cơ bản
│   │   ├─ Name (vi/en), description, category
│   │   ├─ Thumbnail upload, screenshots upload
│   │   └─ Demo URL, technologies, deliveryTime
│   │
│   ├─ Tab 2: Giá & Cấp độ
│   │   ├─ Level: dropdown (1-4)
│   │   ├─ Level label: (vi/en)
│   │   ├─ Giá bán: price (VND)
│   │   ├─ Giá gốc (optional): originalPrice → hiển thị giảm giá
│   │   └─ Highlighted: toggle (nổi bật trên trang pricing)
│   │
│   ├─ Tab 3: Tính năng đi kèm
│   │   ├─ Multi-select từ kho ServiceAttribute
│   │   ├─ Drag-drop sắp xếp thứ tự hiển thị
│   │   ├─ Preview: danh sách tính năng sẽ hiển thị cho khách
│   │   └─ Tự động gắn cả basic + một số advanced tùy gói
│   │
│   └─ Lưu → tạo/cập nhật WebTemplate + WebTemplateAttribute records
│
├─ [Đơn hàng Web Gói]
│   ├─ Flow đơn giản hơn Custom:
│   │   ├─ Khách chọn gói → thanh toán → bàn giao
│   │   ├─ Trạng thái: pending → paid_full → setting_up → delivered → completed
│   │   └─ Không có bước thiết kế UI (đã có sẵn template)
│   └─ Admin xác nhận thanh toán → setup → bàn giao
│
└─ [Hiển thị trên Frontend]
    ├─ Trang Pricing: grid card với level badge + giá + CTA
    ├─ Chi tiết gói: danh sách tính năng với icon check
    └─ So sánh gói: bảng comparison theo level
```

---

## IV. MODULE 3 — Dịch vụ Rời & Hệ thống XP Rewards

### 4.1 Quản lý Dịch vụ Rời (Add-on Services)

```
AddonService (Entity mới)
│
├── Thông tin: name, nameVi, description, slug, icon
├── Loại: type = "one_time" | "recurring"
├── Giá:
│   ├── one_time: price (VND)
│   └── recurring: price (VND/tháng) + billingPeriod
├── Ví dụ:
│   ├── "Gói viết bài SEO"     → recurring, 2,000,000/tháng, 30 bài
│   ├── "Định vị Google Maps"  → one_time, 500,000
│   ├── "Hỗ trợ nhập liệu"    → one_time, 1,000,000
│   └── "Bảo trì hàng tháng"  → recurring, 500,000/tháng
│
└── Có thể mua độc lập (không cần mua web trước)
```

#### Admin Flow: Quản lý dịch vụ rời

```
Admin vào "Quản lý Dịch vụ rời"
│
├─ [Danh sách dịch vụ]
│   ├─ Columns: Tên | Loại | Giá | Billing | Trạng thái
│   └─ Filter: one_time / recurring
│
├─ [Thêm/Sửa dịch vụ]
│   ├─ Name (vi/en), description, icon
│   ├─ Type: one_time hoặc recurring
│   ├─ Price + billingPeriod (nếu recurring)
│   ├─ Metadata (JSON): chi tiết gói (số bài viết, scope, ...)
│   └─ Lưu
│
└─ [Quản lý đăng ký dịch vụ] (phát triển sau)
    ├─ Danh sách khách đang sử dụng dịch vụ recurring
    ├─ Nhân viên kỹ thuật xác nhận thanh toán hàng tháng
    └─ Gia hạn / Tạm dừng / Hủy
```

### 4.2 Hệ thống XP & Tiered Rewards

#### Cách hoạt động

```
┌─────────────────────────────────────────────────────────┐
│                  HỆ THỐNG XP REWARDS                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  TÍNH ĐIỂM XP                                   │    │
│  │                                                  │    │
│  │  Mỗi tính năng NÂNG CAO có giá trị XP riêng:   │    │
│  │  ├── Giỏ hàng nâng cao      = 40 XP             │    │
│  │  ├── Phân quyền nâng cao    = 70 XP             │    │
│  │  ├── Chat trực tuyến        = 30 XP             │    │
│  │  ├── Dashboard analytics    = 50 XP             │    │
│  │  └── ...                                         │    │
│  │                                                  │    │
│  │  Tổng XP đơn hàng = Σ(xpPoints của các tính    │    │
│  │                       năng nâng cao đã chọn)     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  THANH TIẾN ĐỘ (XP Progress Bar)               │    │
│  │                                                  │    │
│  │  Level 1: 0 ──────────────── 99 XP              │    │
│  │  Level 2: 100 ─────────────── 199 XP            │    │
│  │  Level 3: 200 ─────────────── 299 XP            │    │
│  │  Level 4: 300 ─────────────── 399 XP            │    │
│  │  ...                                             │    │
│  │                                                  │    │
│  │  Mỗi level = 100 XP (cố định, đơn giản)        │    │
│  │  Level = floor(totalXP / 100) + 1               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  REWARDS THEO LEVEL                              │    │
│  │                                                  │    │
│  │  Level 1: (Không có reward)                      │    │
│  │  Level 2: + Hỗ trợ nhập liệu (miễn phí)       │    │
│  │           + SEO 30 bài/tháng × 3 tháng          │    │
│  │  Level 3: + Google Maps định vị (miễn phí)      │    │
│  │           + Bảo trì 3 tháng miễn phí            │    │
│  │  Level 4: + Tư vấn marketing 1 buổi            │    │
│  │           + SEO 30 bài/tháng × 6 tháng          │    │
│  │  ...                                             │    │
│  │                                                  │    │
│  │  Admin tự cấu hình reward cho mỗi level         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### Admin Flow: Quản lý XP & Rewards

```
Admin vào "Cấu hình XP & Rewards"
│
├─ [Cấu hình XP cho tính năng]
│   ├─ Bảng: Tính năng nâng cao | XP hiện tại | Sửa
│   ├─ Admin gán/sửa xpPoints cho từng tính năng nâng cao
│   └─ Lưu → cập nhật ServiceAttribute.xpPoints
│
├─ [Cấu hình Rewards theo Level]
│   ├─ Level 2: [Chọn dịch vụ reward] + [Thời hạn]
│   │   ├─ Chọn từ danh sách AddonService
│   │   ├─ Quantity: 1
│   │   ├─ Duration: 3 tháng (nếu recurring)
│   │   └─ Thêm nhiều reward cho cùng level
│   │
│   ├─ Level 3: ...
│   ├─ Level 4: ...
│   └─ Lưu → tạo/cập nhật RewardTier + RewardTierItem records
│
├─ [Xem preview]
│   ├─ Giả lập: nếu khách chọn [Feature A + Feature B + Feature C]
│   │   ├─ Tổng XP: 140
│   │   ├─ Level: 2
│   │   ├─ Rewards: [Hỗ trợ nhập liệu, SEO 3 tháng]
│   │   └─ Thanh tiến độ: ████████████████░░░░ 40/100 (đến Level 3)
│   └─ Admin test trước khi publish
│
└─ [Cài đặt chung]
    ├─ XP mỗi level: 100 (mặc định, có thể điều chỉnh)
    ├─ Hiển thị thanh XP cho khách: Bật/Tắt
    └─ Lưu vào SiteSetting
```

#### Hiển thị phía User (tham khảo cho Frontend)

```
┌──────────────────────────────────────────────────┐
│  🎯 CẤP ĐỘ DỰ ÁN CỦA BẠN                      │
│                                                   │
│  ⭐ Level 2 — Dự án Nâng cao                     │
│                                                   │
│  XP: 140 / 200                                    │
│  ████████████████████████████████░░░░░░░░░░ 70%  │
│  ───────────────────────────────────────────       │
│  Thêm 60 XP nữa để lên Level 3!                  │
│                                                   │
│  🎁 ƯU ĐÃI ĐÃ MỞ KHÓA:                         │
│  ✅ Hỗ trợ nhập liệu sản phẩm (miễn phí)       │
│  ✅ Gói viết bài SEO 30 bài/tháng × 3 tháng     │
│                                                   │
│  🔒 ƯU ĐÃI TIẾP THEO (Level 3):                 │
│  ○ Định vị Google Maps miễn phí                   │
│  ○ Bảo trì website 3 tháng miễn phí              │
└──────────────────────────────────────────────────┘
```

---

## V. DATABASE SCHEMA — Thiết kế mở rộng

### 5.1 Thay đổi trên Schema hiện tại

#### ServiceAttribute — Thêm fields mới

```prisma
model ServiceAttribute {
  // ... giữ nguyên fields hiện tại ...

  // ── THÊM MỚI ──
  tier        String   @default("basic")    // "basic" | "advanced"
  xpPoints    Int      @default(0)          @map("xp_points")     // Điểm XP (chỉ advanced > 0)
  parentId    String?  @map("parent_id")    // Quan hệ cha-con (mutual exclusion)
  parent      ServiceAttribute?  @relation("FeatureHierarchy", fields: [parentId], references: [id])
  children    ServiceAttribute[] @relation("FeatureHierarchy")

  // ... giữ nguyên relations hiện tại ...
}
```

**Logic mutual exclusion:** Khi `parentId` có giá trị, nếu khách chọn tính năng con (advanced) → tự động bỏ chọn tính năng cha (basic), và ngược lại. Validate ở application layer.

#### WebTemplate — Thêm level

```prisma
model WebTemplate {
  // ... giữ nguyên fields hiện tại ...

  // ── THÊM MỚI ──
  level         Int      @default(1)          // Cấp độ gói: 1, 2, 3, 4
  levelLabel    String?  @map("level_label")  // "Basic", "Pro", "Enterprise"
  levelLabelVi  String?  @map("level_label_vi") // "Cơ bản", "Chuyên nghiệp", "Doanh nghiệp"

  // ... giữ nguyên relations hiện tại ...
}
```

#### Order — Mở rộng đáng kể

```prisma
model Order {
  // ... giữ nguyên fields hiện tại ...

  // ── THÊM MỚI ──
  basePrice           Int?     @map("base_price")            // Giá base tại thời điểm đặt (snapshot)
  systemCalculatedPrice Int?   @map("system_calculated_price") // Giá hệ thống tính = base + Σ(advanced)
  adminOverridePrice  Int?     @map("admin_override_price")  // Giá Admin ghi đè (khách thấy giá này)
  adminPriceNote      String?  @map("admin_price_note")      // Lý do Admin điều chỉnh giá
  finalPrice          Int?     @map("final_price")           // = adminOverridePrice ?? systemCalculatedPrice

  // ── XP & REWARDS ──
  totalXp             Int      @default(0) @map("total_xp")  // Tổng XP đơn hàng
  rewardLevel         Int      @default(1) @map("reward_level") // Level đạt được

  // ── THANH TOÁN ──
  paymentMethod       String?  @map("payment_method")        // "full" | "split_50_50"
  paidAmount          Int      @default(0) @map("paid_amount") // Số tiền đã thanh toán
  // paymentStatus đã có: "unpaid" | "partial" | "paid"

  // ── DOMAIN ──
  domainName          String?  @map("domain_name")           // Domain khách chọn

  // ── RELATIONS MỚI ──
  orderRewards        OrderReward[]
  payments            Payment[]
  statusHistory       OrderStatusHistory[]
}
```

### 5.2 Entities mới

#### AddonService — Dịch vụ rời

```prisma
model AddonService {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  nameVi        String   @map("name_vi")
  description   String?
  descriptionVi String?  @map("description_vi")
  icon          String?
  type          String   @default("one_time")  // "one_time" | "recurring"
  price         Int                              // Giá (VND)
  billingPeriod String?  @map("billing_period") // "monthly" | "quarterly" | "yearly" (nếu recurring)
  metadata      Json?                            // Chi tiết bổ sung: { articlesPerMonth: 30, ... }
  sortOrder     Int      @default(0) @map("sort_order")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  rewardTierItems RewardTierItem[]
  orderRewards    OrderReward[]

  @@map("addon_services")
}
```

#### RewardTier — Cấu hình reward theo level

```prisma
model RewardTier {
  id          String   @id @default(cuid())
  level       Int      @unique                  // Level: 2, 3, 4, ...
  name        String                            // "Dự án Nâng cao"
  nameVi      String   @map("name_vi")
  description String?
  minXp       Int      @map("min_xp")          // XP tối thiểu (level*100 - 100)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  items       RewardTierItem[]

  @@map("reward_tiers")
}
```

#### RewardTierItem — Chi tiết reward trong mỗi level

```prisma
model RewardTierItem {
  id              String       @id @default(cuid())
  rewardTierId    String       @map("reward_tier_id")
  rewardTier      RewardTier   @relation(fields: [rewardTierId], references: [id], onDelete: Cascade)
  addonServiceId  String       @map("addon_service_id")
  addonService    AddonService @relation(fields: [addonServiceId], references: [id])
  quantity        Int          @default(1)              // Số lượng tặng
  durationMonths  Int?         @map("duration_months")  // Thời hạn (tháng) cho recurring
  description     String?                               // Mô tả thêm
  sortOrder       Int          @default(0) @map("sort_order")

  @@unique([rewardTierId, addonServiceId])
  @@map("reward_tier_items")
}
```

#### OrderReward — Reward đã áp dụng cho đơn hàng

```prisma
model OrderReward {
  id              String       @id @default(cuid())
  orderId         String       @map("order_id")
  order           Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  addonServiceId  String       @map("addon_service_id")
  addonService    AddonService @relation(fields: [addonServiceId], references: [id])
  rewardLevel     Int          @map("reward_level")      // Level mà reward này thuộc về
  quantity        Int          @default(1)
  durationMonths  Int?         @map("duration_months")
  startDate       DateTime?    @map("start_date")        // Ngày bắt đầu dịch vụ reward
  endDate         DateTime?    @map("end_date")           // Ngày kết thúc
  status          String       @default("pending")        // "pending" | "active" | "expired" | "revoked"
  createdAt       DateTime     @default(now()) @map("created_at")

  @@map("order_rewards")
}
```

#### Payment — Lịch sử thanh toán

```prisma
model Payment {
  id            String   @id @default(cuid())
  orderId       String   @map("order_id")
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  amount        Int                                    // Số tiền thanh toán
  method        String?                                // "bank_transfer" | "cash" | ...
  note          String?                                // Ghi chú
  confirmedBy   String?  @map("confirmed_by")          // Admin ID xác nhận
  confirmedAt   DateTime? @map("confirmed_at")
  createdAt     DateTime @default(now()) @map("created_at")

  @@map("payments")
}
```

#### OrderStatusHistory — Lịch sử trạng thái

```prisma
model OrderStatusHistory {
  id         String   @id @default(cuid())
  orderId    String   @map("order_id")
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fromStatus String   @map("from_status")
  toStatus   String   @map("to_status")
  changedBy  String?  @map("changed_by")    // Admin ID
  note       String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([orderId, createdAt])
  @@map("order_status_history")
}
```

### 5.3 Entity Relationship Diagram (ERD)

```
┌──────────────────┐       ┌──────────────────┐
│ ServiceAttribute │       │   WebTemplate    │
│                  │       │                  │
│ id               │       │ id               │
│ name/nameVi      │       │ name/nameVi      │
│ tier (basic/adv) │◄──────│ level (1-4)      │
│ price            │  M:M  │ price            │
│ xpPoints         │       │ levelLabel       │
│ parentId ────┐   │       │                  │
│ category     │   │       └────────┬─────────┘
│              │   │                │
│  ┌───────────┘   │       WebTemplateAttribute
│  │ self-ref      │         (M2M junction)
│  └──► parent     │
│       children   │
└───────┬──────────┘
        │
        │ M:M via OrderAttribute
        │ (snapshot priceAtOrder)
        ▼
┌──────────────────┐       ┌──────────────────┐
│     Order        │       │  AddonService    │
│                  │       │                  │
│ id               │       │ id               │
│ orderType        │       │ name/nameVi      │
│ basePrice        │       │ type (one_time/  │
│ systemCalcPrice  │       │      recurring)  │
│ adminOverride    │       │ price            │
│ finalPrice       │       │ billingPeriod    │
│ totalXp          │       │ metadata         │
│ rewardLevel      │       └────────┬─────────┘
│ paymentMethod    │                │
│ domainName       │                │
│ status           │                │
└───┬──────────────┘                │
    │                               │
    │  ┌────────────────────┐       │
    ├──│   OrderReward      │───────┘
    │  │                    │   Reward đã áp dụng
    │  │ rewardLevel        │   cho đơn hàng cụ thể
    │  │ status             │
    │  │ startDate/endDate  │
    │  └────────────────────┘
    │
    │  ┌────────────────────┐
    ├──│   Payment          │
    │  │                    │   Lịch sử thanh toán
    │  │ amount             │   (nhiều đợt nếu 50-50)
    │  │ confirmedBy        │
    │  └────────────────────┘
    │
    │  ┌────────────────────┐
    └──│ OrderStatusHistory │
       │                    │   Audit trail trạng thái
       │ fromStatus         │
       │ toStatus           │
       │ changedBy          │
       └────────────────────┘

┌──────────────────┐
│   RewardTier     │
│                  │
│ level (unique)   │──────┐
│ name             │      │
│ minXp            │      │  1:M
└──────────────────┘      │
                          ▼
                 ┌────────────────────┐
                 │  RewardTierItem    │
                 │                    │
                 │ rewardTierId       │
                 │ addonServiceId ────│──► AddonService
                 │ quantity           │
                 │ durationMonths     │
                 └────────────────────┘
```

### 5.4 Indexes cho hiệu suất

```prisma
// Trên Order (truy vấn phổ biến nhất)
@@index([status, createdAt])          // Filter theo trạng thái + sắp xếp
@@index([orderType, status])          // Filter theo loại đơn
@@index([customerEmail])              // Tìm đơn theo email khách

// Trên ServiceAttribute
@@index([tier, isActive])             // Filter basic/advanced đang active
@@index([category, tier])             // Filter theo nhóm + cấp độ
@@index([parentId])                   // Tìm con theo cha

// Trên OrderReward
@@index([orderId, status])            // Rewards theo đơn hàng
@@index([status, endDate])            // Tìm rewards sắp hết hạn (cho cron)

// Trên Payment
@@index([orderId, createdAt])         // Lịch sử thanh toán theo đơn

// Trên WebTemplate
@@index([level, isActive])            // Filter theo level
@@index([category, isActive])         // Filter theo category
```

---

## VI. BUSINESS FLOW CHI TIẾT (ADMIN)

### 6.1 Flow tổng quan Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ADMIN DASHBOARD                               │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │Dashboard │  │ Orders   │  │ Catalog  │  │    Settings        │  │
│  │(Tổng     │  │(Đơn hàng)│  │(Danh mục)│  │                    │  │
│  │quan)     │  │          │  │          │  │                    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬───────────┘  │
│       │              │             │                  │              │
│  ┌────┴─────┐   ┌────┴─────┐  ┌───┴────┐    ┌───────┴──────────┐   │
│  │• Tổng    │   │• Custom  │  │• Tính  │    │• Giá base        │   │
│  │  doanh   │   │  Orders  │  │  năng  │    │• XP per level    │   │
│  │  thu     │   │• Template│  │• Web   │    │• Reward tiers    │   │
│  │• Đơn mới │   │  Orders  │  │  Gói   │    │• Payment methods │   │
│  │• XP      │   │• Service │  │• Dịch  │    │• Notification    │   │
│  │  stats   │   │  Orders  │  │  vụ rời│    │  templates       │   │
│  │• Revenue │   │          │  │        │    │                  │   │
│  │  chart   │   │          │  │        │    │                  │   │
│  └──────────┘   └──────────┘  └────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Flow xử lý giá (Price Calculation Engine)

```
┌──────────────────────────────────────────────────────────────────┐
│              PRICE CALCULATION — Server-side Logic                │
│                                                                  │
│  Input: selectedFeatureIds[]                                     │
│                                                                  │
│  Step 1: Fetch base price                                        │
│  ├─ basePrice = SiteSetting.get("custom_web_base_price")         │
│  └─ Ví dụ: 3,000,000                                            │
│                                                                  │
│  Step 2: Validate mutual exclusion                               │
│  ├─ Với mỗi feature đã chọn, kiểm tra parentId                  │
│  ├─ Nếu chọn child (advanced) → remove parent (basic) khỏi list │
│  └─ Nếu chọn parent (basic) → remove child (advanced) khỏi list │
│                                                                  │
│  Step 3: Calculate feature prices                                │
│  ├─ advancedFeatures = filter(tier === "advanced")               │
│  ├─ featureTotal = Σ(advancedFeatures.price)                     │
│  └─ Ví dụ: 1,000,000 + 2,000,000 = 3,000,000                   │
│                                                                  │
│  Step 4: Calculate XP                                            │
│  ├─ totalXp = Σ(advancedFeatures.xpPoints)                      │
│  ├─ rewardLevel = floor(totalXp / xpPerLevel) + 1               │
│  └─ Ví dụ: 40 + 70 = 110 → Level 2                              │
│                                                                  │
│  Step 5: Resolve rewards                                         │
│  ├─ rewards = RewardTier.findMany({ level: { lte: rewardLevel }})│
│  └─ Flatten all RewardTierItems                                  │
│                                                                  │
│  Step 6: Final price                                             │
│  ├─ systemPrice = basePrice + featureTotal                       │
│  ├─ finalPrice = adminOverride ?? systemPrice                    │
│  └─ Ví dụ: 3,000,000 + 3,000,000 = 6,000,000                   │
│                                                                  │
│  Output: {                                                       │
│    basePrice: 3000000,                                           │
│    featureTotal: 3000000,                                        │
│    systemPrice: 6000000,                                         │
│    totalXp: 110,                                                 │
│    rewardLevel: 2,                                               │
│    rewards: [...],                                               │
│    finalPrice: 6000000  // hoặc adminOverride                    │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Flow Admin Override giá (Queue-based)

```
Admin review đơn hàng pending
│
├─ Xem giá hệ thống tính: 6,000,000
├─ Quyết định override: 5,500,000
├─ Nhập lý do: "Khách VIP giảm 500k"
│
└─ Submit override
   │
   ├─ Lưu: adminOverridePrice = 5,500,000
   ├─ Lưu: adminPriceNote = "Khách VIP giảm 500k"
   ├─ Lưu: finalPrice = 5,500,000
   ├─ Chuyển status: pending → quoted
   │
   └─ Queue Job: "SendQuoteNotification"
      ├─ Gửi email/SMS cho khách với giá cuối: 5,500,000
      ├─ Khách KHÔNG thấy giá gốc 6,000,000
      ├─ Khách KHÔNG biết có override
      └─ Khách thấy: "Báo giá dự án của bạn: 5,500,000 VND"
```

---

## VII. CHIẾN LƯỢC TRIỂN KHAI

### Phase 1: Foundation (Ưu tiên cao)

```
1.1 — Mở rộng ServiceAttribute schema
     ├─ Thêm: tier, xpPoints, parentId (self-relation)
     ├─ Migration + seed data
     └─ Admin UI: CRUD tính năng với tier/xp/parent

1.2 — Mở rộng WebTemplate schema
     ├─ Thêm: level, levelLabel, levelLabelVi
     ├─ Migration + seed data
     └─ Admin UI: gán level cho template

1.3 — Mở rộng Order schema
     ├─ Thêm: basePrice, systemCalculatedPrice, adminOverridePrice, ...
     ├─ Thêm: totalXp, rewardLevel, paymentMethod, domainName
     ├─ Migration
     └─ Admin UI: chi tiết đơn hàng mới
```

### Phase 2: New Entities (Ưu tiên cao)

```
2.1 — AddonService
     ├─ Tạo model + migration
     ├─ API: CRUD endpoints
     └─ Admin UI: quản lý dịch vụ rời

2.2 — RewardTier + RewardTierItem
     ├─ Tạo models + migration
     ├─ API: cấu hình reward
     └─ Admin UI: trang cấu hình XP & Rewards

2.3 — OrderReward
     ├─ Tạo model + migration
     ├─ Logic: tự động tạo rewards khi đơn hàng chuyển trạng thái
     └─ Admin UI: xem rewards đã áp dụng
```

### Phase 3: Business Logic (Ưu tiên cao)

```
3.1 — Price Calculation Engine
     ├─ Server-side utility: calculateOrderPrice()
     ├─ Mutual exclusion validation
     ├─ XP calculation + level determination
     └─ Reward resolution

3.2 — Order Lifecycle Management
     ├─ Status transition validation
     ├─ OrderStatusHistory auto-logging
     ├─ Payment tracking (Payment model)
     └─ Admin override flow

3.3 — Queue System (thông báo)
     ├─ SendQuoteNotification job
     ├─ PaymentConfirmation job
     └─ RewardActivation job
```

### Phase 4: Frontend Integration (Ưu tiên trung bình)

```
4.1 — User-facing: chọn tính năng + xem giá real-time
4.2 — User-facing: thanh XP progress + rewards preview
4.3 — User-facing: trang Web Gói với level badges
4.4 — User-facing: mua dịch vụ rời
```

### Phase 5: Dịch vụ Recurring (Phát triển sau)

```
5.1 — Quản lý đăng ký dịch vụ hàng tháng
5.2 — Nhân viên kỹ thuật xác nhận thanh toán
5.3 — Tự động gia hạn / hết hạn
5.4 — Cron job: kiểm tra reward expiry
```

---

## PHỤ LỤC: Mapping với Schema hiện tại

| Entity hiện tại | Thay đổi | Ghi chú |
|------------------|----------|---------|
| `ServiceAttribute` | **Mở rộng** | Thêm tier, xpPoints, parentId |
| `WebTemplate` | **Mở rộng** | Thêm level, levelLabel |
| `Order` | **Mở rộng lớn** | Thêm nhiều fields cho pricing + XP + payment |
| `OrderAttribute` | **Giữ nguyên** | Đã có priceAtOrder snapshot |
| `WebTemplateAttribute` | **Giữ nguyên** | M2M junction đã đủ |
| `ServicePackage` | **Giữ nguyên** | Vẫn dùng cho hosting/domain packages |
| `SiteSetting` | **Thêm keys** | custom_web_base_price, xp_per_level |
| `AddonService` | **MỚI** | Dịch vụ rời |
| `RewardTier` | **MỚI** | Cấu hình reward theo level |
| `RewardTierItem` | **MỚI** | Chi tiết reward |
| `OrderReward` | **MỚI** | Reward đã áp dụng cho đơn |
| `Payment` | **MỚI** | Lịch sử thanh toán |
| `OrderStatusHistory` | **MỚI** | Audit trail trạng thái |
