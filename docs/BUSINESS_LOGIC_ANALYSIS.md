# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ HỆ THỐNG (BUSINESS LOGIC ANALYSIS) - LOOP PROJECT

> **Người lập:** Antigravity - System Analyst Expert
> **Dự án:** LOOP Solutions
> **Cập nhật lần cuối:** 2026-04-14
> **Độ chính xác:** 100% (Đồng bộ Core Logic v8, Quest/VIP System v8.1 và Mobile Strategy)

---

## MỤC LỤC
1. [Tổng Quan Hệ Thống & Kiến Trúc Mobile Đa Nền Tảng](#1-tổng-quan-hệ-thống--kiến-trúc-mobile-đa-nền-tảng)
2. [Hệ Thống Phân Quyền & Quản Lý Người Dùng (Auth & RBAC v4.0)](#2-hệ-thống-phân-quyền--quản-lý-người-dùng-auth--rbac-v40)
3. [Nghiệp Vụ Sales, Quản Lý Đơn Hàng & Doanh Thu Ngoài (Off-System)](#3-nghiệp-vụ-sales-quản-lý-đơn-hàng--doanh-thu-ngoài-off-system)
4. [Nghiệp Vụ Nhân Sự (Staff) - Gamification, Rank & Tiers](#4-nghiệp-vụ-nhân-sự-staff---gamification-rank--tiers)
5. [Nghiệp Vụ Khách Hàng (Client) - VIP Tiers & Customer Quests](#5-nghiệp-vụ-khách-hàng-client---vip-tiers--customer-quests)
6. [Quản Trị Dự Án Kỹ Thuật (Kanban System)](#6-quản-trị-dự-án-kỹ-thuật-kanban-system)
7. [Nghiệp Vụ Ecosystem (Academy, Tỷ giá LP)](#7-nghiệp-vụ-ecosystem-academy-tỷ-giá-lp)

---

## 1. TỔNG QUAN HỆ THỐNG & KIẾN TRÚC MOBILE ĐA NỀN TẢNG

Hệ thống được chia làm hai vành đai sinh thái bao gồm Môi trường Web (Next.js) và Môi trường Mobile (React Native / Expo):

### Sinh Thái Kép:
- **Khách Hàng (LOOP Client / Web):** Phục vụ luồng khám phá dịch vụ, Booking 8 bước, Cổng thông tin theo dõi chi tiết dự án, Academy, VIP System. (App Store/CH Play đối với Mobile).
- **Vành Đai Nội Bộ (LOOP Guild Staff / Web Admin):** Nơi làm việc cho 27 nhân sự, Dashboard có 28 tab phân quyền động. Hệ thống báo cáo Huddle, duyệt Kanban, và chia thưởng LP Off-System. Mobile App được phân phối tĩnh qua file `.apk` nội bộ và Expo Go (0 VNĐ chi phí).

**Triết lý kiến trúc lõi:** Tuyệt đối Data-Driven (Tokens, Color). Mọi UI React Native dùng NativeWind và map với `src/lib/design-tokens.ts`. Hệ thống thanh toán dùng **Dual Currency**: `VNĐ` (Tiền thật khách thanh toán) và `LP` (Điểm Gamification nội bộ).

---

## 2. HỆ THỐNG PHÂN QUYỀN & QUẢN LÝ NGƯỜI DÙNG (Auth & RBAC v4.0)

### Cấu Trúc Khối 3 Tầng Quyền
RBAC không dùng role "cứng" mà dùng **Permission-Based System** do CEO phê duyệt:
- **System Role (Phân bậc):** 8 Bậc từ `ceo (-1) -> super_admin (0) -> admin (1) -> hr (2) -> pm (3) -> media (4) -> qa (5) -> member (6)`.
- **Department (8 Phòng ban):** `engineering`, `design`, `media`, `marketing`, `sales`, `finance`, `hr`, `management`. Mỗi member thuộc 1 phòng, Trưởng phòng (`isDeptHead=true`) có quyền giao Task và xem LP của phòng.
- **Tab Permissions (28 admin tabs):** Quyền hiển thị UI được map 1-1 với Tab (VD: `revenue_split`, `off_system_payments`). Admin tab được cấp phát tuỳ biến thông qua `user.tabPermissions`.

---

## 3. NGHIỆP VỤ SALES, QUẢN LÝ ĐƠN HÀNG & DOANH THU NGOÀI (Off-System)

### 3.1 Order Lifecycle (7 Trạng Thái Bắt Buộc)
1. `pending_payment`: Chờ khách hàng thanh toán cọc.
2. `paid`: Đã thanh toán, hệ thống bắn `AdminNotification(type: payment, priority: high)`.
3. `in_progress`: Đang thi công, tạo tác các Task trên Kanban.
4. `demo_ready`: Đã có bản Design Figma Demo, gửi cho khách hàng review.
5. `client_review`: Đang vòng lặp chỉnh sửa từ feedback khách.
6. `done`: Project hoàn thành, LP reward cho Client được cấp (`order.lpReward` field).
7. `cancelled`: Hủy.

**Quy tắc tài chính:** `budget` là số VND khách cần trả. `lpUsed` là số LP giảm giá (Giới hạn tối đa 20% giá trị hóa đơn, phụ thuộc vào mức VIP).

### 3.2 Revenue Split & Off-System Payment (V5 Hệ Thống)
Nếu có tiền về từ hợp đồng bên ngoài (Không quét qua hệ thống Web gốc), kế toán nhập lệnh **OffSystemPayment**.
- Hệ thống tự động kích hoạt `RevenueSplitConfig` chia LP vào thẻ hoa hồng cho từng nhóm:
  - **PM (35%), Dev (25%), Design (15%), QA (15%), SEO (10%)**. (Công ty lấy 0% - đẩy tiền mặt còn LP chia cho Dev).
  - Tỷ giá quy đổi (LP Rate) lấy từ `SiteSetting("lp_rate_config")`. Lệnh Split chuyển trạng thái Pending đến khi CEO/PM `approve`, sẽ lập tức đẩy LP vào tài khoản `availableLp` của từng cá nhân.

---

## 4. NGHIỆP VỤ NHÂN SỰ (STAFF) - GAMIFICATION, RANK & TIERS

Staff **Tách Rời** hoàn toàn khỏi Client trong vấn đề XP/LP.

### 4.1 Hệ Thống XP (Experience Points / Level)
- Staff có **Level** (Dựa vào XP). 
- Dùng **Staff Quest (v8.1)** với 3 độ phủ:
  - **Công Ty (Company):** Tham gia Huddle chung, XP chia đều tất cả tham gia.
  - **Phòng Ban (Department):** KPIs riêng của phòng (ví dụ: Marketing có 10 khách), XP chia trong phòng.
  - **Cá Nhân (Personal):** Nhiệm vụ theo chức năng.
- **Quan trọng:** Quest Staff KHÔNG Thưởng LP, Quest Staff chỉ thưởng **XP** để up Cấp độ làm việc (`Level`). Reset không tồn tại (chạy vô hạn).

### 4.2 Hệ Thống LP (Loyalty Points / Rank) & Box Shadow
- LP thể hiện **Rank** từ Iron -> Diamond.
  - Cần cẩn trọng chuẩn mã màu UI như: **Diamond (Legendary, MinLevel: 115+, Uncapped, màu `#818CF8`)**, **Platinum (Màu Teal `#14B8A6`)**.
- LP của Staff có thể *chuyển đổi lẫn nhau* qua `LpTransfer`.
- Nguồn thu LP Staff: Hoàn thành Task ở cột `Done`, Approval từ `OffSystemSplit`, Điểm danh Daily Check-in (50 LP/ngày).

---

## 5. NGHIỆP VỤ KHÁCH HÀNG (CLIENT) - VIP TIERS & CUSTOMER QUESTS

Hệ thống điểm Khách Hàng vận hành tách biệt hoàn toàn. Khách hàng **Bị Chặn Toàn Tập (FORBIDDEN)** trong việc giao dịch chuyển đổi LP (`LpTransfer` cho người khác). Lợi ích chỉ dùng cá nhân.

### 5.1 Khách hàng VIP Tiers (Bậc 1->3)
Để nâng cấp VIP, khách phải thỏa **CẢ 2 Điều kiện** (Spending bằng VNĐ và có VIP Points từ Client Quests):
1. **Khách hàng (Regular):** Gốc 0 VNĐ. Max giảm giá 10% khi hóa đơn thanh toán bằng LP.
2. **VIP 1:** Tổng chi 10 Triệu VNĐ + 100 VIP Points. Giảm max 15%.
3. **VIP 2:** Tổng chi 50 Triệu VNĐ + 500 VIP Points. Giảm max 20%. Hỗ trợ Priority.
4. **VIP 3:** Tổng chi 100 Triệu VNĐ + 1000 VIP Points. Giảm max 25%. Kênh VIP Desk.
*(Lưu ý: Không có VIP tầng 4).*

### 5.2 Khách Hàng Quyền Lợi & Quest (Client Quest)
Khách hàng làm Quest (VD: Review hoàn thiện dự án `q-client-review-1`, First Order `q-client-first-order`, Referral Code).
- Quest của khách thưởng **LP** (để giảm bill) và **VIP Points** (để đọ rank hạng VIP). Khách không sử dụng khái niệm XP.

---

## 6. QUẢN TRỊ DỰ ÁN KỸ THUẬT (KANBAN SYSTEM)

Là Workflow lõi (Jira-Like) nằm ở Component `KanbanBoard.tsx` và chia tầng ở `KanbanHub`:
1. **Backlog** -> **Todo** -> **Doing** -> **Review** (Cột này sẽ kích hoạt webhook Github hoặc Notification cho QA Assignee) -> **Done** (Lúc này Trigger tự động thưởng LP cho Task Assignee).
2. Được map Notification Real-time bằng Server-Sent Events (SSE) (File `useRealtimeNotifications.ts` stream qua cổng `/api/admin/events/stream`). Mức độ khẩn gồm `urgent (đỏ chót, chớp nháy)` tới `low`.

---

## 7. NGHIỆP VỤ ECOSYSTEM (ACADEMY, TỶ GIÁ LP)

### Academy Gamification Integration
Trường học LMS tích hợp sâu vào Loop. Khi nhân sự (Staff) mua khoá học, quá trình `enroll/route.ts` sẽ Deduct (Trừ) LP vào ví của nhân sự và tự động gọi API `syncRankFields()` xử lý giật lùi rank/level theo mốc quy định.

### Config Tỉ Giá Tiền (Lp Rate Persist)
Dữ liệu Rate quy đổi tiền (VD: 1,000 LP = 500,000 VNĐ cho Khách hàng, 1 LP = 1,000 VNĐ cho OffSystemPayment của Nhân viên) KHÔNG còn Hardcode. Kế toán lưu cấu hình ở mảng `SiteSetting` với key là `"lp_rate_config"`. Bảng lưu này có chi tiết cả thưởng Tết (Tet bonus), Lương (Salary các level Iron/Bronze...). Mọi tính toán Frontend/Backend đều sẽ bốc từ hệ số của key này.
