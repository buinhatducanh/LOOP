/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║           LOOP SOLUTIONS — QUY TRÌNH HOẠT ĐỘNG TOÀN BỘ HỆ THỐNG          ║
 * ║                    Asian Tech-Zen × Cyberpunk OS Platform                   ║
 * ║                         Version 3.0 — 25/03/2026                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * I. TỔNG QUAN KIẾN TRÚC
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * 1. FRONTEND STACK
 *    - React 18 + TypeScript + Vite
 *    - Tailwind CSS v4 (dùng rgba() thay opacity class)
 *    - Motion (Framer Motion) — longhand properties only
 *    - Zustand — Global state management
 *    - React Router v7 — Data mode routing
 *    - Pure SVG charts (không dùng thư viện chart)
 *
 * 2. DESIGN SYSTEM
 *    - File: /src/app/components/layout/ds.ts
 *    - Tokens: DS (colors, fonts, borders), GRD (gradients), GLOW (shadows)
 *    - Font stack: Cinzel (heading), Inter (body), JetBrains Mono (code)
 *    - Dark mode only — Asian Tech-Zen theme
 *
 * 3. STATE MANAGEMENT
 *    - File: /src/app/store/loopStore.ts
 *    - Zustand store đồng bộ Admin ↔ Customer ↔ Public
 *    - Types: Order, PortfolioProject, Service, AdminNotification, ClientNotification
 *    - Logic tách biệt: VNĐ (tiền thật) vs LP (điểm thưởng nội bộ)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * II. LUỒNG TRANG NGƯỜI DÙNG (PUBLIC)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * A. TRANG CHỦ (/)
 *    → LandingPage.tsx
 *    → Hero section, dịch vụ, portfolio showcase, testimonials
 *    → CTA: Đặt lịch tư vấn, Xem dịch vụ
 *
 * B. DỊCH VỤ (/dich-vu)
 *    → ServicesPage.tsx
 *    → 4 dịch vụ: Web, App/SaaS, Dashboard, SEO
 *    → Giá từ-đến, demo links (masked URL)
 *    → Detail: /dich-vu/:id → ServiceDetailPage.tsx
 *
 * C. BÁO GIÁ (/bao-gia)
 *    → BookingWizardPage.tsx — WIZARD 8 BƯỚC
 *    → Bước 1: Chọn dịch vụ (4 loại)
 *    → Bước 2: Chọn gói (Starter/Business/Enterprise) — hệ số ×1/×2.2/×3.8
 *    → Bước 3: Chọn tính năng tùy chọn (CMS, i18n, e-commerce...)
 *    → Bước 4: Chọn nhân sự phụ trách (4 talent hiện tại)
 *    → Bước 5: Lịch hẹn tư vấn (online/onsite)
 *    → Bước 6: Dịch vụ thêm (hosting, bảo trì, training...)
 *    → Bước 7: Xem lại đơn hàng (auto tổng hợp)
 *    → Bước 8: Thanh toán (VNĐ + LP giảm giá tối đa 20%)
 *    → Output: Tạo Order trong Zustand → Admin nhận thông báo
 *
 * D. DỰ ÁN (/du-an)
 *    → PortfolioPage.tsx
 *    → 6 dự án đã hoàn thành (VNRetail, MedApp, AnalyticsPro...)
 *    → Filter theo danh mục (SaaS, App, Website)
 *    → Detail: /du-an/:id → ProjectDetailPage.tsx
 *      - Challenge / Solution / Result
 *      - Metrics (3 KPIs)
 *      - Tags, features, team info
 *      - Demo link (masked URL)
 *      - Testimonial khách hàng
 *
 * E. ĐỘI NGŨ (/doi-ngu)
 *    → Home.tsx (Team page)
 *    → 27 thành viên với hệ thống rank
 *    → Rank: Iron → Bronze → Silver → Gold → Platinum → Ruby → Diamond
 *    → Components: MemberCard, LEDRunner, HUDPanel, HallOfFame
 *    → Hiệu ứng theo rank (particle, glow, border, aura, badge, trail)
 *    → Detail: /member/:id → MemberDetailPage.tsx
 *
 * F. HỌC VIỆN (/hoc-vien)
 *    → AcademyPage.tsx
 *    → 7 khóa học (React, UI/UX, Node.js, DevOps, SEO, Rust, Python)
 *    → Detail: /hoc-vien/:id → CourseDetailPage.tsx
 *      - Xem trước miễn phí (FreeTrialModal)
 *      - Thanh toán 3 mode: VNĐ / LP+VNĐ / LP toàn phần (PaymentModal)
 *      - CoursePlayer (sau enrollment):
 *        * VIDEO GATE: Phải xem ≥35% video trước khi mở bài tiếp
 *        * Comments/Bình luận mỗi bài
 *        * Code Exercise — editor + output trực tiếp
 *        * Sidebar danh sách bài học + progress tracking
 *        * Certificate khi hoàn thành 100%
 *        * +LP reward khi hoàn thành
 *
 * G. BLOG (/blog)
 *    → BlogPage.tsx
 *    → Detail: /blog/:id → BlogDetailPage.tsx
 *
 * H. LIÊN HỆ (/lien-he)
 *    → ContactPage.tsx
 *    → Form liên hệ
 *
 * I. ĐẶT LỊCH (/dat-lich)
 *    → BookingWizardPage.tsx (cùng trang báo giá)
 *
 * J. ĐĂNG NHẬP/ĐĂNG KÝ
 *    → /dang-nhap, /dang-ky → AuthPage.tsx
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * III. LUỒNG TRANG KHÁCH HÀNG (CUSTOMER DASHBOARD)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * → /khach-hang → CustomerDashboard.tsx
 *
 * Tabs:
 *   1. Tổng quan (home) — KPIs, dự án gần đây, LP balance
 *   2. Dự án (projects) — Danh sách đơn hàng, trạng thái, progress
 *   3. Khóa học (courses) — Khóa đã đăng ký, progress
 *   4. Hóa đơn (invoices) — Danh sách invoices, trạng thái thanh toán
 *   5. Ví LP (lp) — Balance, lịch sử giao dịch, đổi LP
 *   6. Giới thiệu (referral) — Mã giới thiệu, thống kê
 *   7. Hỗ trợ (support) — Chat với PM, xem demo links
 *   8. Cài đặt (settings) — Thông tin cá nhân
 *
 * Luồng đơn hàng (từ góc khách):
 *   pending_payment → paid → in_progress → demo_ready → client_review → done
 *   Khách nhận notification khi demo_ready
 *   Khách xem demo qua DemoViewer (masked URL)
 *   Khách chat với PM trong từng order
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * IV. LUỒNG TRANG ADMIN (ADMIN DASHBOARD)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * → /admin → AdminDashboard.tsx
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ QUẢN LÝ                                                                │
 * │  ├─ Tổng quan (overview)     — KPIs, dự án đang làm, activity feed    │
 * │  ├─ Đơn hàng (orders)        — CRUD orders, chat, send demo, status   │
 * │  ├─ Thành viên (members)     — CRUD 27 members, rank, LP, status      │
 * │  └─ Kanban (projects)        — Board drag-drop quản lý tasks          │
 * │                                                                        │
 * │ SẢN PHẨM                                                               │
 * │  ├─ Dịch vụ (services)       — CRUD 4 dịch vụ, pricing, demo links   │
 * │  ├─ Báo giá (quotation) ★NEW — Quản lý cấu hình wizard 8 bước       │
 * │  │   ├─ Dịch vụ              — Thêm/sửa/xóa/bật-tắt dịch vụ         │
 * │  │   ├─ Gói dịch vụ          — Starter/Business/Enterprise + multiplier│
 * │  │   ├─ Tính năng            — Features tùy chọn theo từng dịch vụ    │
 * │  │   ├─ Dịch vụ thêm         — Extras (hosting, maintenance...)       │
 * │  │   ├─ Nhân sự              — Talents khả dụng cho booking           │
 * │  │   └─ 8 Bước Wizard        — Xem cấu hình từng bước                │
 * │  ├─ Portfolio (portfolio)    — CRUD portfolio projects, demo links     │
 * │  ├─ Dự án xong ★NEW         — Chi tiết dự án hoàn thành              │
 * │  │   (projects_completed)      Challenge/Solution/Result, metrics,     │
 * │  │                             demo, testimonial, featured toggle      │
 * │  ├─ Học viện (academy) ★UPG  — 3 views:                              │
 * │  │   ├─ Khóa học             — CRUD courses, publish/draft            │
 * │  │   ├─ Học viên & Tiến độ   — Student progress tracking, detail view │
 * │  │   │   ├─ Filter theo khóa/trạng thái                               │
 * │  │   │   ├─ Progress bars, quiz scores                                │
 * │  │   │   └─ Student Detail Modal (chart, stats, certificate status)   │
 * │  │   └─ Video & Bài giảng   — Video stats, gate config, completion   │
 * │  └─ Blog (blog)             — CRUD blog posts                        │
 * │                                                                        │
 * │ TÀI CHÍNH                                                              │
 * │  ├─ Doanh thu (revenue)      — Charts, reports VNĐ                    │
 * │  ├─ Khách hàng (clients)     — CRM, client profiles                   │
 * │  └─ Tài chính LP (lp)       — LP distribution, transactions, rates   │
 * │                                                                        │
 * │ HỆ THỐNG                                                               │
 * │  ├─ Hiệu ứng ★NEW           — Quản lý effects theo rank              │
 * │  │  (effects)                  ├─ Global toggle bật/tắt toàn bộ       │
 * │  │                             ├─ CRUD hiệu ứng (10 effects)          │
 * │  │                             ├─ Rarity: Common/Rare/Epic/Legendary  │
 * │  │                             ├─ Type: Particle/Glow/Border/Aura/... │
 * │  │                             ├─ View theo Rank (unlock conditions)  │
 * │  │                             └─ View theo thành viên (overrides)    │
 * │  ├─ Thông báo (notifications) — Admin notifs, mark read/delete        │
 * │  └─ Cài đặt (settings)       — LP rate, season name, system config   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * V. MAPPING TRANG NGƯỜI DÙNG ↔ TRANG ADMIN
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * ┌──────────────────────────┬──────────────────────────────────────────────┐
 * │ TRANG NGƯỜI DÙNG         │ TRANG ADMIN TƯƠNG ỨNG                       │
 * ├──────────────────────────┼──────────────────────────────────────────────┤
 * │ Trang chủ (/)            │ Overview (tổng quan KPIs)                   │
 * │ Dịch vụ (/dich-vu)       │ Services Tab (CRUD dịch vụ, pricing)       │
 * │ Báo giá (/bao-gia)       │ Quotation Tab (cấu hình 8 bước wizard) ★   │
 * │ Dự án (/du-an)           │ Portfolio Tab + Projects Completed Tab ★    │
 * │ Đội ngũ (/doi-ngu)       │ Members Tab + Effects Tab ★                │
 * │ Học viện (/hoc-vien)      │ Academy Tab (courses + students + videos) ★│
 * │ Blog (/blog)             │ Blog Tab                                    │
 * │ Liên hệ (/lien-he)       │ Clients Tab (CRM)                          │
 * │ Đặt lịch (/dat-lich)     │ Orders Tab (đơn hàng)                      │
 * │ Khách hàng dashboard     │ Clients Tab + Orders Tab                    │
 * │ Auth (/dang-nhap)        │ Settings Tab (system config)                │
 * └──────────────────────────┴──────────────────────────────────────────────┘
 * ★ = Mới thêm hoặc nâng cấp trong phiên này
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * VI. HỆ THỐNG LP (LOYALTY POINTS)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * 1. KIẾM LP
 *    - Hoàn thành task/mission (nhân viên nội bộ)
 *    - Hoàn thành khóa học (học viên)
 *    - Mua dịch vụ (khách hàng nhận LP reward)
 *    - Giới thiệu bạn bè (referral)
 *
 * 2. DÙNG LP
 *    - Giảm giá dịch vụ (tối đa 20%, rate 1000 LP = 500K VNĐ)
 *    - Mua khóa học bằng LP
 *    - Đổi thưởng nội bộ
 *
 * 3. RANK SYSTEM (nhân viên)
 *    Iron (Lv.1-14) → Bronze (15-34) → Silver (35-54)
 *    → Gold (55-74) → Platinum (75-84) → Ruby (85-94) → Diamond (95+)
 *    Mỗi rank có hiệu ứng riêng, unlock theo level
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * VII. LUỒNG ĐƠN HÀNG (ORDER FLOW)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * [Khách] Wizard báo giá → Xác nhận → pending_payment
 *   ↓
 * [Khách] Thanh toán → paid → [Admin nhận notification]
 *   ↓
 * [Admin] Phân công PM → in_progress → [Khách thấy progress update]
 *   ↓
 * [Admin] Upload demo → demo_ready → [Khách nhận notification + DemoViewer]
 *   ↓
 * [Khách] Review demo → phản hồi qua chat → client_review
 *   ↓
 * [Admin] Sửa theo feedback → gửi demo mới → loop lại demo_ready
 *   ↓
 * [Admin] Khách duyệt → done → [Khách nhận LP reward]
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * VIII. LUỒNG HỌC VIỆN (ACADEMY FLOW)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * [Khách] Xem khóa học → Học thử miễn phí (FreeTrialModal)
 *   ↓
 * [Khách] Đăng ký → PaymentModal (VNĐ / LP+VNĐ / LP)
 *   ↓
 * [Khách] Enrolled → CoursePlayer
 *   ├─ Xem video (phải xem ≥35% mới mở bài tiếp — Video Gate)
 *   ├─ Làm bài tập code trực tiếp (Code Exercise panel)
 *   ├─ Bình luận/hỏi đáp (Comments section)
 *   ├─ Đánh dấu hoàn thành từng bài
 *   └─ 100% → Certificate + LP reward
 *
 * [Admin] Academy Tab
 *   ├─ Tab "Khóa học" — CRUD courses, publish/draft
 *   ├─ Tab "Học viên" — Track tiến độ từng student
 *   │   ├─ Filter: theo khóa, trạng thái (active/completed/inactive/dropped)
 *   │   ├─ Table: progress bar, quiz scores, last active
 *   │   └─ Detail Modal: biểu đồ tiến độ, stats, certificate status
 *   └─ Tab "Video" — Thống kê video, cấu hình Video Gate threshold
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * IX. LUỒNG HIỆU ỨNG RANK (EFFECTS SYSTEM)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * [System] 10 hiệu ứng mặc định
 *   ├─ Particle Glow (Iron+)
 *   ├─ Border Gradient (Bronze+)
 *   ├─ Silver Shimmer (Silver+)
 *   ├─ Gold Aura (Gold+)
 *   ├─ Neon Pulse Border (Gold Lv.60+)
 *   ├─ Platinum Trail (Platinum+)
 *   ├─ Matrix Rain (Platinum Lv.80+) [disabled by default]
 *   ├─ Ruby Fire Particles (Ruby+)
 *   ├─ Diamond Holographic (Diamond+)
 *   └─ Cosmic Badge (Diamond Lv.100+)
 *
 * [Admin] Effects Tab
 *   ├─ Global toggle: bật/tắt toàn bộ hiệu ứng trên web
 *   ├─ CRUD hiệu ứng: name, description, type, rarity, unlock conditions
 *   ├─ View "Danh sách" — tổng quan, bật/tắt từng effect
 *   ├─ View "Theo Rank" — hiệu ứng grouped by rank, thêm mới per rank
 *   └─ View "Theo thành viên" — xem ai đang dùng effect nào
 *
 * [Member] Dashboard (Customer/Member portal)
 *   └─ Có thể ẩn/hiện hiệu ứng đã unlock của mình
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * X. FILE STRUCTURE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * /src/app/
 * ├── App.tsx                    — Entry point (RouterProvider)
 * ├── routes.ts                  — Route definitions
 * ├── Home.tsx                   — Team page (/doi-ngu)
 * ├── MemberDetailPage.tsx       — Member detail (/member/:id)
 * ├── store/
 * │   └── loopStore.ts           — Zustand global store
 * ├── pages/
 * │   ├── LandingPage.tsx        — Home (/)
 * │   ├── ServicesPage.tsx       — Dịch vụ (/dich-vu)
 * │   ├── ServiceDetailPage.tsx  — Chi tiết dịch vụ
 * │   ├── PortfolioPage.tsx      — Dự án (/du-an)
 * │   ├── ProjectDetailPage.tsx  — Chi tiết dự án
 * │   ├── ContactPage.tsx        — Liên hệ
 * │   ├── BlogPage.tsx           — Blog
 * │   ├── BlogDetailPage.tsx     — Chi tiết blog
 * │   ├── AcademyPage.tsx        — Học viện (/hoc-vien)
 * │   ├── CourseDetailPage.tsx   — Chi tiết khóa học (★ enhanced)
 * │   ├── BookingWizardPage.tsx  — Báo giá 8 bước
 * │   ├── AuthPage.tsx           — Đăng nhập/đăng ký
 * │   ├── AdminDashboard.tsx     — Admin dashboard (★ enhanced)
 * │   └── CustomerDashboard.tsx  — Customer portal
 * ├── components/
 * │   ├── admin/
 * │   │   ├── AcademyTab.tsx     — ★ Enhanced: students + videos + courses
 * │   │   ├── BlogTab.tsx        — CRUD blog
 * │   │   ├── ClientsTab.tsx     — CRM
 * │   │   ├── KanbanBoard.tsx    — Project kanban
 * │   │   ├── MembersTab.tsx     — CRUD members
 * │   │   ├── OrdersTab.tsx      — Order management
 * │   │   ├── PortfolioTab.tsx   — Portfolio CRUD
 * │   │   ├── QuotationTab.tsx   — ★ NEW: Báo giá config
 * │   │   ├── EffectsTab.tsx     — ★ NEW: Rank effects management
 * │   │   ├── ProjectsCompletedTab.tsx — ★ NEW: Completed projects detail
 * │   │   ├── RevenueTab.tsx     — Revenue stats
 * │   │   └── ServicesTab.tsx    — Services management
 * │   ├── team/
 * │   │   ├── memberData.ts      — 27 members + rank config
 * │   │   ├── MemberCard.tsx     — Card component with effects
 * │   │   ├── LEDRunner.tsx      — LED animation
 * │   │   ├── HUDPanel.tsx       — HUD overlay
 * │   │   ├── HallOfFame.tsx     — Hall of fame
 * │   │   ├── Counter.tsx        — Animated counter
 * │   │   ├── RoleFilters.tsx    — Role filter UI
 * │   │   └── SearchSortBar.tsx  — Search + sort
 * │   ├── layout/
 * │   │   ├── ds.ts              — Design system tokens
 * │   │   ├── Navbar.tsx         — Navigation bar
 * │   │   ├── Footer.tsx         — Footer
 * │   │   └── PublicLayout.tsx   — Public layout wrapper
 * │   └── ui/
 * │       ├── DemoViewer.tsx     — ⚠️ PROTECTED (manually edited)
 * │       └── [shadcn components]
 * └── LOOP_OPERATIONS_DOC.tsx    — This file
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * XI. QUY TẮC KỸ THUẬT QUAN TRỌNG
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * 1. Motion props: LUÔN dùng longhand (backgroundColor, borderColor)
 *    KHÔNG dùng shorthand (background, border) trong whileHover/animate/initial
 *
 * 2. Opacity: Dùng rgba() values thay vì Tailwind opacity classes
 *    ✅ rgba(59,130,246,0.15)
 *    ❌ bg-blue-500/15
 *
 * 3. DemoViewer.tsx: KHÔNG CHỈNH SỬA — file đã được edit thủ công
 *
 * 4. Charts: Pure SVG only (không dùng Recharts hay D3 trực tiếp)
 *
 * 5. LP vs VNĐ: Tách biệt logic — LP là điểm thưởng, VNĐ là tiền thật
 *    1,000 LP = 500,000 VNĐ giảm giá (tối đa 20% đơn hàng)
 *
 * 6. Việt hóa 100%: Tất cả UI text bằng tiếng Việt
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * XII. CHANGELOG PHIÊN NÀY (25/03/2026)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * ★ MỚI:
 *   1. QuotationTab.tsx — Quản lý cấu hình wizard báo giá 8 bước
 *      - CRUD dịch vụ, gói, tính năng, extras, nhân sự
 *      - Preview cấu hình 8 bước
 *
 *   2. EffectsTab.tsx — Quản lý hiệu ứng rank đội ngũ
 *      - Global toggle bật/tắt toàn cục
 *      - CRUD 10+ hiệu ứng với rarity system
 *      - 3 views: danh sách, theo rank, theo thành viên
 *
 *   3. ProjectsCompletedTab.tsx — Quản lý dự án đã hoàn thành
 *      - Chi tiết: info, content (challenge/solution/result), demo, metrics, testimonial
 *      - Featured toggle, CRUD đầy đủ
 *
 * ★ NÂNG CẤP:
 *   4. AcademyTab.tsx — Thêm 2 view mới:
 *      - "Học viên & Tiến độ": 10 mock students, filter, detail modal
 *      - "Video & Bài giảng": stats per course, gate config
 *
 *   5. CourseDetailPage.tsx — CoursePlayer enhanced:
 *      - Video Gate: phải xem ≥35% trước khi chuyển bài
 *      - Comments/Bình luận: thêm, like, reply
 *      - Code Exercise: editor + output panel
 *      - Enhanced enrollment flow: quyền lợi, cam kết hoàn tiền
 *
 *   6. AdminDashboard.tsx — Sidebar mở rộng:
 *      - Thêm: Báo giá, Dự án xong, Hiệu ứng rank
 *      - 16 tabs tổng cộng (từ 13)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * END OF DOCUMENT
 * ══════════════════════════════════════════════════════════════════════════════
 */

export default function OperationsDoc() {
  return null; // This is a documentation file, not a component
}
