# LOOP Solutions — Tài liệu Quy trình Vận hành Toàn bộ Hệ thống

> **Phiên bản**: 2.0 · Cập nhật: 24/03/2026  
> **Hệ điều hành**: LOOP OS — Asian Tech-Zen × Cyberpunk  
> **Stack**: React + Zustand + Tailwind CSS v4 + Motion + Pure SVG Charts

---

## I. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

### 1.1 Cấu trúc Frontend
```
src/app/
├── store/
│   └── loopStore.ts          ← Zustand Store trung tâm (toàn bộ state)
├── pages/
│   ├── LandingPage.tsx        ← Trang chủ
│   ├── ServicesPage.tsx       ← Danh sách dịch vụ
│   ├── ServiceDetailPage.tsx  ← Chi tiết dịch vụ + Demo Viewer
│   ├── PortfolioPage.tsx      ← Danh sách dự án
│   ├── ProjectDetailPage.tsx  ← Chi tiết dự án + Demo Viewer
│   ├── AcademyPage.tsx        ← Học viện + Thanh toán LP
│   ├── CourseDetailPage.tsx   ← Khóa học + Player + Free Trial
│   ├── AdminDashboard.tsx     ← Bảng điều khiển Admin
│   └── CustomerDashboard.tsx  ← Cổng thông tin Khách hàng
├── components/
│   ├── admin/
│   │   ├── OrdersTab.tsx      ← Quản lý đơn hàng + Gửi demo
│   │   ├── ServicesTab.tsx    ← Quản lý dịch vụ + Demo links
│   │   ├── PortfolioTab.tsx   ← Quản lý portfolio + Demo links
│   │   ├── KanbanBoard.tsx    ← Bảng Kanban nội bộ
│   │   ├── MembersTab.tsx     ← Quản lý thành viên
│   │   ├── ClientsTab.tsx     ← Quản lý khách hàng
│   │   ├── RevenueTab.tsx     ← Thống kê doanh thu
│   │   ├── AcademyTab.tsx     ← Quản lý học viện
│   │   └── BlogTab.tsx        ← Quản lý blog
│   ├── ui/
│   │   └── DemoViewer.tsx     ← Component xem demo (che URL)
│   ├── layout/
│   │   └── ds.ts              ← Design tokens toàn hệ thống
│   └── team/
│       └── memberData.ts      ← Dữ liệu 27 thành viên
```

---

## II. QUY TRÌNH KINH DOANH (Business Flow)

### 2.1 Vòng đời Đơn hàng (Order Lifecycle)

```
KHÁCH HÀNG                          ADMIN / NHÂN VIÊN
─────────────────────────────────────────────────────────
1. Xem dịch vụ/dự án
   └─ Bấm "Xem Demo" (Demo Viewer)
   └─ URL che: demo.loop-solutions.vn/...
   └─ URL gốc: ẩn hoàn toàn (mã hóa base64)

2. Đặt lịch tư vấn (/dat-lich)
   └─ Nhập thông tin yêu cầu
   └─ Chọn dịch vụ + ngân sách

3. Nhận báo giá & Ký hợp đồng
   └─ Tạo hóa đơn (INV-XXXX)
   └─ Trạng thái: pending_payment

4. Thanh toán                         ← Admin nhận thông báo ngay
   └─ VNĐ / Kết hợp LP               ← Badge "đơn mới" trên Sidebar
   └─ Trạng thái: paid                ← Alert đỏ trong OrdersTab

5. Admin phân công PM                 ← OrdersTab > Chọn PM > Lưu
   └─ Trạng thái: in_progress

6. Thực hiện dự án                    ← Cập nhật % tiến độ real-time
   └─ Sprint review định kỳ
   └─ Admin gửi demo link bất cứ lúc nào

7. Gửi Demo Link                      ← OrdersTab > "Gửi Demo Link"
   └─ Admin nhập URL gốc (Figma/Vercel)
   └─ Hệ thống tạo URL che tự động
   └─ Mã hóa URL gốc (base64)
   └─ Khách nhận thông báo ngay       ← Bell notification sáng lên
   └─ Trạng thái: demo_ready

8. Khách xem Demo                     ← CustomerDashboard > Dự án
   └─ Alert "Demo sẵn sàng" nổi bật
   └─ DemoViewer: xem trong trình duyệt giả lập
   └─ Không thể copy URL gốc
   └─ Gửi phản hồi qua chat

9. Review & Chỉnh sửa
   └─ Admin nhận tin nhắn             ← Notification badge
   └─ Cập nhật và gửi demo mới

10. Nghiệm thu & Hoàn thành           ← Trạng thái: done
    └─ LP thưởng cộng vào tài khoản
    └─ Certificate tự động (khóa học)
    └─ Bàn giao source code
```

### 2.2 Hệ thống LP (Learning Points)

| Sự kiện | LP Nhận |
|---------|---------|
| Hoàn thành dự án (mỗi 1M VNĐ) | +50 LP |
| Hoàn thành khóa học | +150 đến +450 LP |
| Giới thiệu khách hàng mới | +1,500 LP |
| Lên rank mới | +500 đến +2,000 LP |
| Referral bonus | +Variable |

| Sử dụng LP | Giá trị |
|-----------|---------|
| 1,000 LP | 500,000 VNĐ giảm giá |
| Tối đa 1 đơn | 20% hóa đơn |
| Thanh toán khóa học | Tối đa 50% học phí |

---

## III. HỆ THỐNG DEMO VIEWER (Bảo vệ URL)

### 3.1 Nguyên lý hoạt động

```
┌─────────────────────────────────────────────────────────┐
│                    DEMO VIEWER                           │
│                                                          │
│  Admin nhập URL gốc:                                     │
│  https://figma.com/embed?url=xxx hoặc staging.vercel.app│
│                    ↓                                     │
│  Hệ thống mã hóa: btoa(encodeURIComponent(url))         │
│                    ↓                                     │
│  Lưu trên store: encodedUrl (không hiển thị)             │
│                    ↓                                     │
│  Iframe load: src={decodeUrl(encodedRef.current)}        │
│                    ↓                                     │
│  Thanh địa chỉ hiển thị: maskedUrl                       │
│  VD: demo.loop-solutions.vn/vnretail-v3                  │
│                                                          │
│  Bảo vệ thêm:                                            │
│  - onContextMenu={prevent} → không right-click           │
│  - userSelect: 'none' → không copy text                  │
│  - Watermark: "LOOP Solutions · Protected Preview"       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Quy trình gửi Demo cho khách

1. Admin vào **Admin Panel → Đơn hàng**
2. Chọn đơn hàng → Click **"Gửi Demo Link"**
3. Nhập URL gốc (Figma embed / staging / Vercel)
4. Nhập URL che (tùy chỉnh)
5. Viết ghi chú kèm theo
6. Preview demo trước khi gửi
7. Click **"Gửi Demo cho khách"**
8. ✅ Khách nhận notification ngay lập tức
9. Khách vào **Customer Portal → Dự án** để xem

---

## IV. CẤU TRÚC DỮ LIỆU (Zustand Store)

### 4.1 Order State Machine

```typescript
type OrderStatus =
  | 'pending_payment'   // Chờ thanh toán
  | 'paid'             // Đã thanh toán
  | 'in_progress'      // Đang thực hiện
  | 'demo_ready'       // Demo gửi cho khách
  | 'client_review'    // Khách đang review
  | 'done'             // Hoàn thành
  | 'cancelled';       // Đã hủy
```

### 4.2 Notification Flow

```
Sự kiện                      → Admin Notif    → Client Notif
─────────────────────────────────────────────────────────────
Khách thanh toán             → ✅ new_order   → ❌
Admin gửi demo               → ❌             → ✅ demo_ready
Khách nhắn tin               → ✅ client_msg  → ❌
Admin chuyển trạng thái      → ✅ system      → ✅ order_update
Hoàn thành dự án             → ✅ system      → ✅ lp_earned
```

---

## V. QUẢN LÝ HỌC VIỆN (Academy)

### 5.1 Quy trình học

```
1. Trang /hoc-vien → Xem danh sách khóa học
2. /hoc-vien/:id  → Trang chi tiết khóa học
   ├─ Thông tin đầy đủ: mục tiêu, chương trình, giảng viên
   ├─ "Học thử miễn phí" → FreeTrialModal
   │   ├─ Trình phát video mô phỏng
   │   ├─ Seek bar, Play/Pause, danh sách bài
   │   └─ Khóa bài sau khi hết free → CTA mua
   └─ "Mua khóa học" → PaymentModal
       ├─ 3 chế độ: VNĐ / LP + VNĐ / Toàn LP
       └─ Sau khi mua → CoursePlayer mở

3. CoursePlayer (toàn màn hình)
   ├─ Sidebar bài học (grouped by chapter)
   ├─ Video player: play/pause, seek, volume
   ├─ Đánh dấu hoàn thành từng bài
   ├─ Tài liệu, source code per bài
   ├─ Tiến độ tổng: 0-100%
   └─ Certificate unlock khi 100%
```

### 5.2 Admin Quản lý Học viện
- Tab **Học viện** trong AdminDashboard
- CRUD khóa học, giảng viên, học viên
- Xem thống kê enrollment, doanh thu LP

---

## VI. HỆ THỐNG THÀNH VIÊN (Team)

### 6.1 Hệ thống Rank (đã Việt hóa)

| Rank | Tiếng Việt | LP Min | Màu |
|------|------------|--------|-----|
| Iron | Sắt | 0 | #8B9DC3 |
| Bronze | Đồng | 1,000 | #CD7F32 |
| Silver | Bạc | 5,000 | #C0C0C0 |
| Gold | Vàng | 15,000 | #FFD700 |
| Platinum | Bạch Kim | 30,000 | #E5E4E2 |
| Ruby | Hồng Ngọc | 50,000 | #E0115F |
| Diamond | Kim Cương | 80,000 | #7DD3FC |

### 6.2 Tính năng đội ngũ
- 27 thành viên với profile chi tiết (/member/:id)
- HUD Panel, LED Runner, Hall of Fame
- Kanban Board nội bộ
- LP leaderboard

---

## VII. CÔNG NGHỆ & NGUYÊN TẮC THIẾT KẾ

### 7.1 Design System
- **Nền**: `#020617` (Deep Navy)
- **Card**: `#0F172A` / `#111827`
- **Primary**: Blue `#3B82F6` / Purple `#818CF8`
- **Font Heading**: Cinzel (serif)
- **Font Mono**: JetBrains Mono
- **Font Body**: Inter

### 7.2 Animation System
- **Library**: Motion (`motion/react`)
- Animated counter: count-up khi scroll vào view
- Progress bar: animate width từ 0% → target
- Notification badge: pulse scale animation
- Card hover: glow border + box-shadow
- Page transitions: opacity + y slide

### 7.3 Nguyên tắc quan trọng
- ✅ Dùng `rgba()` thay vì Tailwind opacity classes
- ✅ Charts dùng pure SVG (không dùng thư viện)
- ✅ Tách biệt LP points và VNĐ
- ✅ Admin có phần quản lý tương ứng với mọi tính năng user
- ✅ URL demo được bảo vệ qua mã hóa base64 + masked URL
- ✅ Zustand store đồng bộ state giữa Admin và Customer

---

## VIII. QUY TRÌNH DEPLOY & VẬN HÀNH

### 8.1 Khi có đơn hàng mới
1. Kiểm tra **Admin → Đơn hàng** (badge đỏ xuất hiện)
2. Xem chi tiết đơn, xác nhận thanh toán
3. Phân công PM trong vòng 24h
4. Tạo sprint plan, bắt đầu thực hiện
5. Cập nhật tiến độ hàng tuần
6. Gửi demo link khi có bản review
7. Thu thập phản hồi qua chat
8. Nghiệm thu, bàn giao, cộng LP

### 8.2 Khi có phản hồi demo từ khách
1. Notification **client_message** xuất hiện
2. Vào **Đơn hàng** → Xem tin nhắn
3. Họp team xử lý feedback
4. Cập nhật, gửi demo version mới
5. Lặp lại đến khi khách duyệt

### 8.3 LP Management
- Phân phối LP tự động khi dự án done
- Admin có thể điều chỉnh LP thủ công (LPFinanceTab)
- Tỷ giá mặc định: 1,000 LP = 500,000 VNĐ giảm giá
- Giới hạn: tối đa 20% mỗi hóa đơn

---

## IX. TÍNH NĂNG THEO TRANG

| Trang | Chức năng chính |
|-------|----------------|
| `/` | Landing, hero animation, services overview |
| `/dich-vu` | Danh sách 4 dịch vụ |
| `/dich-vu/:id` | Chi tiết + **Demo Viewer** |
| `/du-an` | Portfolio 6 dự án |
| `/du-an/:id` | Chi tiết + **Demo Viewer** |
| `/hoc-vien` | Danh sách khóa học + LP payment |
| `/hoc-vien/:id` | **Free Trial** + **Purchase** + **Course Player** |
| `/dat-lich` | Booking wizard |
| `/blog` + `/blog/:id` | Blog |
| `/doi-ngu` | Team 27 người |
| `/member/:id` | Profile thành viên |
| `/dang-nhap` | Auth page |
| `/admin` | **Admin Dashboard** (13 tabs) |
| `/khach-hang` | **Customer Dashboard** (8 tabs) |

### Admin Dashboard — 13 Tabs
1. **Tổng quan** — KPIs, biểu đồ SVG, tiến độ dự án animated
2. **Đơn hàng** ⭐ — Order management, gửi demo, chat khách hàng
3. **Thành viên** — CRUD 27 thành viên
4. **Kanban** — Sprint board nội bộ
5. **Dịch vụ** ⭐ — Quản lý 4 dịch vụ + demo links
6. **Portfolio** ⭐ — Quản lý 6+ dự án + demo links
7. **Học viện** — Quản lý khóa học, học viên
8. **Blog** — CMS bài viết
9. **Doanh thu** — Thống kê tài chính
10. **Khách hàng** — CRM
11. **Tài chính LP** — LP economy
12. **Thông báo** — Real-time notifications
13. **Cài đặt** — System config

*(⭐ = Tab mới được thêm trong phiên bản 2.0)*

---

## X. LIÊN HỆ & HỖ TRỢ

- **Discord**: discord.gg/loop-solutions
- **Email**: team@loop-solutions.vn
- **Admin Panel**: /admin (Diamond rank required)
- **Customer Portal**: /khach-hang

---

*Tài liệu này được tạo tự động bởi LOOP OS v2.0 · Confidential*
