# BẢN KẾ HOẠCH VẬN HÀNH BỘ MÁY TỔNG THỂ (UNIFIED MASTER PLAN) - LOOP ECOSYSTEM

> **Mục tiêu:** Bản kết nối toàn diện duy nhất dùng làm "Hạt nhân" cho mọi định hướng công nghệ của LOOP (Web, Mobile, SaaS sau này). Bất kỳ Lập trình viên hay AI Agent nào tiếp nhận dự án bắt buộc phải đọc file này.
> **Triết lý:** "Mọi công cụ, Một bộ não" (One Core, Multiple Fronts).

---

## 1. MÔ HÌNH HỆ SINH THÁI TẬP TRUNG (The Monolithic Core Ecosystem)
Để chuẩn bị cho việc LOOP sẽ phát triển ra App, tích hợp máy chấm công, hoặc tác ra bán SaaS, chúng ta không chia tách Backend thành các service vụn vặt ngay từ đầu. Thay vào đó, tất cả sẽ kết nối chung vào **MỘT Hệ thống Cơ Sở Dữ Liệu (Single Source of Truth)**.

### a. Bộ Não Trung Tâm (The Core API & DB)
* **Nơi chứa:** Chịu tải bởi Next.js API Server (`/api/*`) nằm trong dự án gốc hiện tại.
* **Database:** `Neon Postgres` + `Prisma ORM`. Toàn bộ 100+ bảng logic (Business, Auth, LP, XP) nằm chung một sơ đồ.
* **Background Rule:** `Inngest` phụ trách các lệnh ngầm (Gửi push notification hàng loạt, tính điểm thưởng cuối tuần, Auto-promote VIP).

### b. Các Cánh Tay Vươn Ra (The Fronts)
Mọi ứng dụng tương lai chỉ là chiếc "mặt nạ" UI gọi dữ liệu từ Bộ Não Trung Tâm:
1. **LOOP Agency Web (Web Public & Admin Tĩnh):** Trang chủ marketing, cổng Wizard đặt hàng, và CMS Dashboard cho Admin xem số liệu bằng trình duyệt máy tính.
2. **LOOP Guild App (Internal Mobile App):** App trên điện thoại Android/iOS chỉ dành riêng cho 27 nhân viên. Chuyên Quản lý Task Kanban, check-in, nhận Notification khẩn, xem rank LP.
3. **LOOP Client App (Customer Mobile App):** App để khách hàng rút điện thoại ra theo dõi dự án đang làm, duyệt FigmaDemo, nạp rút hóa đơn LP.
4. **LOOP SaaS (Hướng mở rộng tương lai):** Đóng gói bộ máy HR/Kanban tuyệt vời trên thành trang `app.loops.vn` cho bên thứ 3 thuê. (Khi nào tới phase này mới chia vách ngăn Multi-Tenant).

---

## 2. CHUẨN MỰC TÍCH HỢP QUAN TRỌNG NHẤT CHO MỌI AGENT / DEV

Dù Lập trình web hay code giao diện app Mobile, mọi file mã nguồn cần tuân thủ 3 Mỏ Neo (Anchors) sau:

### 1- Neo Ngôn ngữ Giao diện (Design System Matrix)
* **Tuyệt đối KHÔNG hardcode màu vào mã nguồn.**
* Mọi thiết bị Web, Mobile hay App tương lai đều Import từ đúng một kho `src/lib/design-tokens.ts`.
* Mobile dùng `NativeWind`, Web dùng `Tailwind`. Cả hai gọi chung mã biến `DS.blue`, `DS.bgCard`... Nếu LOOP đổi thương hiệu hoặc bán SaaS cho công ty khác, chỉ cần đổi mã màu ở file `design-tokens.ts` là TOÀN BỘ hệ sinh thái Web+App sẽ thay đồ.

### 2- Neo Quyền Lực & Game Hóa (Unified Gamification State)
* Phải phân định nghiêm ngặt: **XP -> Tăng Cấp Sự Nghiệp (Level), LP -> Chi tiêu/Thưởng (Rank/Voucher)**.
* **Staff khác Client**. Staff có thể bị trừ LP, bị rớt rank nếu làm nhiệm vụ trễ hạn SLA. Client thì tuyệt đối LP chỉ đi lên và dùng để tiêu tiền trong hệ sinh thái khóa học/website LOOP.
* AI/Dev mỗi khi xây dựng chức năng tạo tác (Ví dụ gõ phím "Hoàn thành Task", "Kết thúc Sprint"), luôn luôn phải viết lệnh `trigger()` kiểm tra xem có Rơi phần thưởng hay Kích hoạt Quest hay không. (API: `/api/admin/quests/staff/event`).

### 3- Neo Quyền Mạng (Unified RBAC & Auth)
* Không dùng Session Cookie dính chặt trình duyệt nữa.
* Mọi cổng kết nối Web và Mobile đều thống nhất dùng **JWT Bearer Token** (Cấp một mã khóa có hạn 30 ngày cho Mobile kéo dài thời gian duy trì phiên).
* Mọi điểm API đều được chắn bởi hàm Guard từ Cấp cao nhất (CEO) rồi dò từ Role Hệ Thống đến Permission Tab cụ thể.

---

## 3. LỘ TRÌNH VẬN HÀNH THỰC THI THỐNG NHẤT (Vòng Tròn Lan Tỏa)

Đây là các Trạm không thể nhảy cóc. Chúng ta sẽ làm từ rốn của lõi bung tỏa ra ngoài:

### Giai Đoạn 1 (FOCUS 100% HIỆN TẠI): Siết Khung Backend và Web Nội bộ
* **Quy tắc:** Đóng băng việc mở rộng (Freeze the core). Không đẻ thêm tính năng Gamification rườm rà.
* **Mục tiêu:** 
  1. Dọn dẹp nợ kỹ thuật (Technical Debt) ở luồng Kanban trên nền Web.
  2. Bọc "Trần" (Cap Limits) cho dòng tiền LP để ngăn chặn lạm phát điểm (LP Inflation) từ các hệ thống tự động thưởng.
  3. Hoàn thiện Customer Dashboard trên Web để người dùng tin tưởng rút tiền mặt đặt cọc. Off-system payment phải nhuyễn mịn.

### Giai Đoạn 2: [TẠM HOÃN] Vũ Khí Cầm Tay - LOOP Guild Mobile App
* Không khởi chạy cho tới khi Giai Đoạn 1 (Web) đạt mức độ hoàn hảo không bug. App sẽ chỉ tập trung vào các điểm chạm nhanh (Push notification, Check-in, Kéo task). 

### Giai Đoạn 3: [TẠM HOÃN] Gây Mê Khách Hàng - LOOP Client Mobile App + Academy
* Phát hành sau khi đội ngũ đã quen với áp lực vận hành. App trên App Store chuyên biệt luồng khách hàng VIP.

### Giai Đoạn 4: [TẦM NHÌN DÀI HẠN] Trưởng Thành Rực Rỡ - The B2B SaaS
* Đòi hỏi đập tầng Data để thêm thiết kế Multi-tenant (Workspace ID). Tránh Over-engineering lúc này. Hiện tại vẫn giữ Single Source of Truth cho 1 công ty.

---

## 4. TÀI LIỆU CHỈ NAM CHO BẤT KỲ VỊ TRÍ NÀO
Bất kể bạn là ai, AI Agent thiết kế, Coder hay Nhân sự Quản lý, để vận hành hệ thống này vui lòng luôn đối chiếu chéo các trụ chống sau:
- Để xử lý Logic dòng tiền, phần thưởng -> Xem: `BUSINESS_LOGIC_ANALYSIS.md`
- Để viết API, nối DB, lập trình Data -> Xem: `.claude/rules/loop-business-logic-core.md`
- Để tuân thủ Luật phát triển Code cho AI -> Xem: `.claude.md` + `CLAUDE.md`

(*Lưu ý cho AI Agent: Bất kỳ khi nào nhận lệnh tạo app mới hoặc file tính năng mở rộng, hãy thiết kế sao cho nó không tự độc lập mà phải sống chung bám rễ vào Core API & Database đã xây định hình ở trên*).


---

# CHUYÊN MỤC: TÍCH HỢP TỪ (BUSINESS_LOGIC_ANALYSIS.md)

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


---

# CHUYÊN MỤC: TÍCH HỢP TỪ (loop-business-logic-core.md)

# LOOP Business Logic — Source of Truth (Core)

> **Version**: 8.0.0 · Updated: 2026-04-09
> **Source**: Verified vs `loopStore.ts`, `authStore.ts`, `KanbanBoard.tsx`, `useRealtimeNotifications.ts`, authStore v4 (8 roles + department system)
> **Status**: Core sections 1–13. For advanced systems (Staff Quest v8, Customer VIP), see `loop-quest-vip-system.md`.

---

## Tổng quan

File này ghi lại các business facts đã verify với code thực tế — dùng làm **source of truth** khi implement hoặc viết docs.
Mọi tài liệu nghiệp vụ (CompanyProcessPage, markdown docs) phải khớp với các facts trong file này.

---

## 1. Order Lifecycle — 7 trạng thái

```typescript
type OrderStatus =
  | 'pending_payment'   // 01: chờ thanh toán
  | 'paid'             // 02: đã thanh toán, chờ phân công PM
  | 'in_progress'      // 03: đang thực hiện
  | 'demo_ready'       // 04: demo đã gửi, chờ khách review
  | 'client_review'    // 05: khách đang xem + phản hồi
  | 'done'             // 06: hoàn thành
  | 'cancelled';      // ⚠: hủy (hủy bất kỳ bước nào trừ DONE)
```

### Mỗi bước tạo notification tương ứng:
- `paid` → `AdminNotification(type: payment, priority: high)`
- `in_progress` → `AdminNotification(type: system)`
- `demo_ready` → `ClientNotification(type: demo_ready)` + `AdminNotification embed`
- Khách nhắn tin → `AdminNotification(type: client_message)`
- `done` → LP reward được ghi nhận (field `order.lpReward`)

### Dual Currency trong Order interface:
```typescript
interface Order {
  budget: number;       // VNĐ — tiền thật, Khách → LOOP
  lpUsed: number;       // LP — Khách dùng giảm giá (max 20% budget)
  lpReward: number;     // LP — LOOP thưởng Khách khi done (field, KHÔNG tự động tính)
}
```

---

## 2. Kanban System — 2 components

### KanbanHub (`src/app/components/admin/KanbanHub.tsx`)
3 cấp:
1. **Hub tổng quan**: Grid 4 phòng ban (Engineering · Design · Media · Marketing) + thống kê task toàn công ty
2. **Phòng ban**: List/Gantt view các dự án + Workload chart theo thành viên
3. **KanbanBoard** (click vào dự án)

### KanbanBoard (`src/app/components/admin/KanbanBoard.tsx`)
- **Library**: `react-dnd` + `HTML5Backend`
- **5 cột**: Backlog → Todo → Doing → Review → Done
- Mỗi task có: `id, title, description, priority(urgent/high/medium/low), assigneeIds[], lp, dueDate, tags, comments, attachments, checklist(done/total), colId`

```typescript
const COLUMNS = [
  { id: 'backlog', label: 'Backlog',     color: text4, icon: '○' },
  { id: 'todo',    label: 'Cần làm',    color: blue,   icon: '◎' },
  { id: 'doing',   label: 'Đang làm',   color: amber,  icon: '◑' },
  { id: 'review',  label: 'Review',      color: purple, icon: '◕' },
  { id: 'done',    label: 'Hoàn thành', color: green,  icon: '●' },
];
```

### Staff mini-Kanban (StaffPortal.tsx)
- Filter theo `user.shortName` để chỉ hiển thị task assign cho user đang login
- 3 cột: Todo → Doing → Done
- Di chuyển task sang Done → LP reward được ghi nhận

---

## 3. LP System — Source of Truth

### Nguyên tắc
- LP ≠ tiền thật
- KHÔNG quy ra tiền mặt
- Chỉ dùng: giảm giá dịch vụ / đổi quà nội bộ

### Tỷ giá
```
1,000 LP = 500,000 VNĐ giảm giá
max 20% giá trị hóa đơn
```

### Nguồn LP (đã verify — không có "1M VNĐ = +50 LP" tự động)

| Nguồn | Staff | Client | Trigger | Ghi chú |
|-------|-------|--------|---------|---------|
| Order done | — | `order.lpReward` field | Order status → done | **KHÔNG tự động tính** — là field gán thủ công. VD: 175M VNĐ → lpReward = 8,750 |
| Kanban task | 800–25,000 | — | Task → Done column | LP gắn trực tiếp vào `task.lp` |
| Điểm danh | 50 LP/ngày | 50 LP/ngày | `authStore.checkIn()` | Streak liên tiếp → reset về 1 nếu bỏ ngày |
| Quest | 20–3,000 | 20–3,000 | `authStore.completeQuest()` | daily 20-50, weekly 200-500, monthly 1,000-2,000, one_time 500-3,000 |
| Event bonus | ×lpBonus | ×lpBonus | `CompanyEvent.active=true` | Spring Festival ×2, Hackathon ×3 |
| Admin manual | ±any | — | AdminLeaderboardTab | Bonus / Penalty / Event / Manual |
| OffSystemPayment | ✅ (member nhận split) | — | PM/Admin approve OffSystemSplit | `OffSystemSplit.approvedAt` → credit LP |

### Academy LP (PENDING — P2-7 chưa implemented)
- `src/app/api/academy/enroll/route.ts` hiện tại: `lpAwarded = 0`
- Cần implement: tính LP award dựa trên course price × rate sau enrollment payment
- Gọi `syncRankFields()` sau LP deduction (member spending LP on education)

---

## 4. Rank System — Source of Truth

> Verified vs `memberData.ts` (`RANKS` config) và `memberData.ts` line 100+

```typescript
type RankKey = 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'diamond';

interface RankConfig {
  label: string;
  tier: number;
  color: string;         // hex thực tế
  symbol: string;
  minLevel: number;
  maxLevel: number;      // undefined = uncapped
  lpPerLevel: number;
  rarity: 'common'|'rare'|'epic'|'legendary';
}
```

### Bảng Rank (code = truth)

| Rank | Tier | Symbol | Level | LP/Level | Màu hex | Rarity |
|------|------|--------|-------|----------|---------|--------|
| Iron | 1 | ⬡ | 1–14 | 100 LP | `#9CA3AF` | Common |
| Bronze | 2 | ◈ | 15–34 | 350 LP | `#CD7F32` | Common |
| Silver | 3 | ◇ | 35–54 | 800 LP | `#CBD5E1` | Rare |
| Gold | 4 | ★ | 55–74 | 2,000 LP | `#FFD700` | Rare |
| Platinum | 5 | ❋ | 75–94 | 5,000 LP | `#14B8A6` | Epic |
| Ruby | 6 | ♦ | 95–114 | 12,000 LP | `#EF4444` | Epic |
| Diamond | 7 | ✦ | **115+ (uncapped)** | 30,000 LP | `#818CF8` | Legendary |

### ⚠️ CỰC KỲ QUAN TRỌNG
- **Platinum color = `#14B8A6`** (teal), KHÔNG phải `#E5E4E2`
- **Diamond minLevel = 115** (KHÔNG phải 95)
- **Diamond uncapped**: `maxLevel: undefined, uncapped: true`
- Bảng rank cũ (trước Season III) dùng Diamond 95+ — đã deprecated

---

## 5. Quest System — Source of Truth

### 13 Quests (init trong `authStore.ts`)

```typescript
type QuestFrequency = 'daily' | 'weekly' | 'monthly' | 'one_time' | 'event';
type QuestStatus = 'available' | 'in_progress' | 'completed' | 'expired';
```

| Frequency | LP Range | Reset | Ví dụ quest |
|-----------|----------|-------|--------------|
| daily | 20–50 LP | Mỗi ngày 00:00 | Điểm danh (q-daily-1), gửi tin nhắn (q-daily-2), xem blog (q-daily-3) |
| weekly | 200–500 LP | Thứ 2 hàng tuần | Hoàn thành 3 task (q-week-1), viết blog (q-week-2), hoàn thành 1 khóa (q-week-3) |
| monthly | 1,000–2,000 LP | Ngày 1 hàng tháng | Đánh giá 360° (q-month-1), referral 1 KH (q-month-2) |
| one_time | 500–3,000 LP | Không reset | First Blood (q-ach-1), Streak Master 30 ngày (q-ach-2) |
| event | Bonus | Theo event | Event quests |

### 3 CompanyEvents (init trong `authStore.ts`)

| Event | Type | lpBonus | Active | Date |
|-------|------|---------|--------|------|
| LOOP Spring Festival 2026 | seasonal | ×2 | ✅ | 2026-03-20 → 2026-04-20 |
| Hackathon Internal Q1 | competition | ×3 | ✅ | 2026-04-05 → 2026-04-07 |
| LOOP Anniversary — 2 năm | celebration | ×2 | ❌ | 2026-05-15 → 2026-05-22 |

---

## 6. Notification System

### Real-time Simulation
```typescript
// useRealtimeNotifications.ts
export function useRealtimeNotifications(intervalMs = 28_000) {
  // Pool 9 templates xoay vòng: new_order / payment / client_message / lp / media_booking / system / task / escalation / review
}
```

### Priority levels
```
urgent → màu đỏ, badge nhấp nháy, cần xử lý ngay
high   → màu xanh/tím, banner thông báo
normal → hiển thị bình thường
low    → chỉ hiện trong list
```

---

## 7. Staff Portal Tabs (v4.0)

```typescript
// authStore.ts — getAccessibleTabs(role, departmentKey?)
// Tab list KHÔNG còn hardcoded — CEO gán permissions từng tab
// Baseline: ROLE_BASE_TABS[role] + DEPT_TAB_BONUS[departmentKey]
// CEO gán thêm/bớt: PUT /api/admin/permissions/[memberId]
```

---

## 8. Admin RBAC — 8 Staff Roles (v4.0)

### 8.1 Role Hierarchy (có thêm `hr`)

```typescript
// roleLevel: lower = more privileged
ceo: -1 → super_admin: 0 → admin: 1 → hr: 2 → project_manager: 3 → media: 4 → qa: 5 → member: 6
```

### 8.2 8 Phòng ban

| ID | Tên | Màu | Trưởng phòng |
|----|-----|------|--------------|
| `engineering` | Phòng Kỹ thuật (IT) | `#3B82F6` | Có (Crown icon) |
| `design` | Phòng Thiết kế | `#8B5CF6` | Có |
| `media` | Phòng Media | `#EC4899` | Có |
| `marketing` | Phòng Marketing | `#F59E0B` | Có |
| `sales` | Phòng Kinh doanh | `#22C55E` | Có |
| `finance` | Phòng Tài chính | `#14B8A6` | Có |
| `hr` | Phòng Nhân sự | `#6366F1` | Có |
| `management` | Ban Quản lý | `#EAB308` | CEO (không cần chỉ định) |

### 8.3 Tab Permissions — Permission-Based (v4.0)

> **Thay đổi lớn**: Từ trước mỗi role có 1 danh sách tabs cố định.
> **Bây giờ** mỗi tab = 1 permission riêng biệt, CEO gán cho từng member.

```typescript
// 28 admin tabs — mỗi tab = 1 permission
type AdminTab =
  | "overview" | "orders" | "members" | "departments" | "projects"
  | "services" | "media" | "quotation" | "portfolio" | "projects_completed"
  | "academy" | "blog" | "revenue" | "clients" | "lp" | "lp_manage"
  | "income_tax" | "web_packages" | "effects" | "notification_center"
  | "settings" | "quests_events" | "leaderboard_admin" | "analytics"
  | "figma_demos" | "kanban" | "revenue_split" | "off_system_payments";

// CEO gán permissions → lưu vào TeamMember.tabPermissions
// Session user nhận tabPermissions[] khi login
canAccessTab(user, tabId): boolean
  → ceo/super_admin/admin → true (all tabs)
  → user.tabPermissions.includes(tabId) → true
  → user.departmentPermissions[user.departmentId]?.includes(tabId) → true
  → else → false
```

### 8.4 Member Onboarding — CEO Approval Workflow (v4.0)

> Xem chi tiết: `admin-rbac.md` Section 8 (Onboarding)

```
HR tạo hồ sơ → Nhân viên đăng ký (pending) → CEO duyệt → Gán role + department + tab permissions → Kích hoạt
```

**3 lớp quyền (v4.0):**
- System Role (1 cái): member, media, qa, pm, hr — gán bởi CEO khi onboarding
- Tab Permissions (nhiều cái): CEO gán từng admin tab từ Settings → Phân quyền
- Department (1 cái): chọn phòng ban → tự nhận dept bonus tabs

**Default tabs (cho mọi member, không revoke):**
- `kanban`: Kanban Board
- `order-basic`: Xem đơn hàng

**Trưởng phòng (isDeptHead):** Giữ nguyên system role + thêm dept bonus tabs + xem LP phòng mình + gán task trong phòng

---

## 9. Protected Files

Các file sau **KHÔNG được chỉnh sửa thủ công**:
- `src/app/components/ui/DemoViewer.tsx`
- `src/app/components/layout/AdvancedSearch.tsx`

---

## 10. Design Rules (from UI/UX Rules)

- Motion: **KHÔNG** dùng `backgroundColor`, `borderColor`, `boxShadow` trong `whileHover/animate/initial` (gây lỗi NaN). Chỉ dùng `scale`, `opacity`, `x`, `y`. Thay bằng CSS `transition-all` + `onHoverStart/onHoverEnd`.
- Màu: dùng `rgba(hex, alpha)` inline style, không dùng Tailwind opacity classes
- Charts: **100% Pure SVG** — không dùng recharts, d3, chart.js
- Fonts: `DS.heading` (Cinzel), `DS.mono` (JetBrains Mono), `DS.body` (Inter)

---

## 11. Revenue Split + Off-System Payment (v5 — 2026-04-07)

### 11.1 Mô hình dữ liệu

**Prisma Models mới (tạo 2026-04-07):**

```prisma
// Cấu hình % chia doanh thu theo role — seed 6 rows
model RevenueSplitConfig {
  id         String   @id @default(cuid())
  key        String   @unique   // "pm" | "dev" | "qa" | "design" | "seo" | "company"
  label      String             // "Project Manager" | "Developer"...
  percentage Float              // 10.0 = 10%
  isActive   Boolean @default(true)
}

// Ghi nhận chi phí/thu ngoài hệ thống Order
model OffSystemPayment {
  id          String   @id @default(cuid())
  orderId     String?            // gắn Order nếu có (optional)
  amountVnd  Float              // số tiền VNĐ
  lpRate     Float              // tỷ giá tại thời điểm ghi nhận (e.g. 1000)
  totalLp    Int                // amountVnd / lpRate
  description String?
  note       String?
  createdBy  String
  splits     OffSystemSplit[]
}

// LP chia cho từng role — approve bởi PM/Admin/CEO
model OffSystemSplit {
  id                  String    @id @default(cuid())
  offSystemPaymentId  String
  memberId            String              // TeamMember nhận LP
  projectRole         String              // "pm" | "dev" | "qa"...
  percentage          Float              // % từ RevenueSplitConfig tại thời điểm tạo
  lpAmount            Int               // totalLp × percentage / 100
  status              String @default("pending")  // pending | approved | rejected
  approvedBy          String?
  approvedAt          DateTime?
}
```

**Seed RevenueSplitConfig (6 rows):**

| Key | Label | % | Ghi chú |
|-----|-------|---|---------|
| `pm` | Project Manager | 35% | Đầu tiên để chia |
| `dev` | Developer | 25% | |
| `qa` | QA Engineer | 15% | |
| `design` | Designer | 15% | |
| `seo` | SEO Specialist | 10% | |
| `company` | Công ty | 0% | Phần còn lại (không tạo split) |

### 11.2 Luồng nghiệp vụ hoàn chỉnh

```
Admin → /admin/off_system_payments
    │
    ├── Nhập số tiền (VD: 3,000,000 VND)
    ├── Tỷ giá: lấy từ SiteSetting "lp_rate_config" (mặc định: 1 LP = 1,000 VND)
    ├── Tổng LP = 3,000,000 ÷ 1,000 = 3,000 LP
    ├── (Optional) Gắn Order
    │
    ▼
POST /api/admin/off-system-payments
    │
    ├── Load RevenueSplitConfig active (key ≠ "company", percentage > 0)
    │
    ▼ Auto tạo OffSystemSplit rows:
    ┌──────────────────────────────────────────────────────────┐
    │ pm      │ 35% │ 3,000 × 35% = 1,050 LP │ pending   │
    │ dev     │ 25% │ 3,000 × 25% =   750 LP │ pending   │
    │ qa      │ 15% │ 3,000 × 15% =   450 LP │ pending   │
    │ design  │ 15% │ 3,000 × 15% =   450 LP │ pending   │
    │ seo     │ 10% │ 3,000 × 10% =   300 LP │ pending   │
    └──────────────────────────────────────────────────────────┘
    │
    ▼
PM/Admin/CEO → Duyệt từng split
    │
    ▼ POST /api/admin/off-system-payments/:id/splits/:splitId/approve
    │
    ├── Credit LP cho member (TeamMember.availableLp += lpAmount)
    ├── Tạo LpTransaction (source: "award", referenceType: "off_system_split")
    ├── syncRankFields(memberId) → cập nhật rank/level/XP
    └── Status: pending → approved
```

### 11.3 LP Rate Config — Persist

**Key**: `SiteSetting` với `key = "lp_rate_config"`, `group = "lp"`
**Value**: JSON string

```json
{
  "lp_to_vnd": 1000,
  "salary_iron": 500,      "salary_bronze": 1200,
  "salary_silver": 2500,   "salary_gold": 5000,
  "salary_platinum": 10000, "salary_ruby": 22000,
  "salary_diamond": 50000,
  "perf_bonus_pct": 20,    "tet_bonus_months": 1.5,
  "service_per_unit": 300,
  "project_small": 500,     "project_medium": 1500,
  "project_large": 4000
}
```

**API**:
- `GET /api/admin/settings/lp-rate` → load config (fallback defaults)
- `POST /api/admin/settings/lp-rate` → upsert SiteSetting

**UI**: `RateConfigModal` trong `lp_manage/page.tsx` — đã persist thay vì chỉ local state.

### 11.4 Revenue Page tích hợp

`/admin/revenue` cộng OffSystemPayment vào tổng doanh thu:

```typescript
totalRevenue = orderRevenue (Order.paidAmount) + offSystemRevenue (OffSystemPayment.amountVnd)
```

Monthly chart cũng bao gồm off-system payments.

### 11.5 Files mới (2026-04-07)

| File | Mô tả |
|------|--------|
| `src/app/api/admin/settings/lp-rate/route.ts` | LP rate GET/POST |
| `src/app/api/admin/revenue-split-configs/route.ts` | CRUD list |
| `src/app/api/admin/revenue-split-configs/[id]/route.ts` | CRUD single |
| `src/app/api/admin/off-system-payments/route.ts` | POST + auto-split |
| `src/app/api/admin/off-system-payments/[id]/route.ts` | GET/PATCH/DELETE |
| `src/app/api/admin/off-system-payments/[id]/splits/[splitId]/approve/route.ts` | Approve → credit LP |
| `src/app/admin/revenue_split/page.tsx` | Config % chia |
| `src/app/admin/off_system_payments/page.tsx` | Form + list payments |
| `prisma/schema.prisma` | 3 models mới |

### 11.6 RBAC Tabs mới

Thêm 2 tab vào `AdminTab` type và `PM_TABS`:
- `revenue_split` — cấu hình % chia doanh thu
- `off_system_payments` — nhập chi phí ngoài + duyệt splits

---

## 12. Full Project Lifecycle (E2E — 2026-04-08)

### 12.1 Luồng đầy đủ (từ khách hàng → bàn giao)

```
[KHÁCH HÀNG]
  ├── Đăng nhập Google OAuth → Hoàn tất hồ sơ (client-onboarding)
  ├── Chọn báo giá → Wizard 8 bước → Thanh toán 50% deposit
  │
[CEO / ADMIN]
  ├── Nhận notification "Thanh toán 50%"
  ├── Xác nhận thanh toán thủ công (bank transfer)
  ├── Gán Designer + PM + Dev + QA vào project
  │
[DESIGNER]
  ├── Nhận notification được assign
  ├── Thiết kế → gửi Figma link (FigmaDemo)
  │
[KHÁCH HÀNG]
  ├── Nhận notification demo ready
  ├── Review → comments/reject/approve (FigmaDemo token approval API)
  │
[DESIGNER]
  ├── Sửa → gửi lại (FigmaDemo cycles)
  │
[KHÁCH HÀNG]
  ├── Approve cuối cùng → HandoverPackage tự tạo với Figma gốc
  │
[PM]
  ├── Nhận notification → TaskKanban project riêng của Order
  ├── Gán task cho Dev + QA, gắn GitHub branch + .env
  │
[DEV]
  ├── Làm task → push branch "task-{id}-{name}" → Kéo sang "In Review"
  │
[QA]
  ├── Nhận notification → Test → Done → LP auto-awarded
  │
[PM]
  ├── Review → merge vào main → Đóng dự án
  ├── notification CEO duyệt
  │
[CEO]
  ├── Duyệt → notification KH
  │
[KHÁCH HÀNG]
  ├── Xem HandoverPackage (Figma gốc + scope + deployment URL)
  ├── Thanh toán 50% còn lại
  ├── Mua domain + hosting (PricingWebPackage + eKYC form)
  │
[ADMIN/PM]
  ├── Xác nhận thanh toán
  ├── Cấu hình website
  ├── CustomerWebsite.configStatus → "configured"
  │
[KHÁCH HÀNG]
  ├── Xác nhận → Đóng dự án hoàn tất
```

### 12.2 Order Statuses — Luồng Custom đầy đủ

| Status | Actor | Trigger | Side Effects |
|--------|-------|---------|------------|
| draft | customer | Wizard submit → Quote created | — |
| pending | sales | Quote sent to customer | — |
| quoted | customer | Customer accepts quote | → creates Order (accepted) |
| accepted | system | Auto on quote accept | — |
| paid_partial | admin | Record 50% payment | → notification CEO |
| contracted | admin | Confirm bank transfer | → assign PM/designer/dev/qa |
| designing | designer | Start design work | → FigmaDemo created |
| developing | dev | Start dev | → TaskKanban tasks |
| reviewing | pm | Dev merge to main | → PM review |
| delivered | pm | PM marks delivered | → notification KH |
| completed | customer | Customer confirms handover | → LP reward credited |

### 12.3 TaskKanban — Task Lifecycle

**Columns:** `backlog → todo → in_progress → in_review → done`

| Column | Ai chuyển | Trigger |
|--------|-----------|---------|
| backlog | PM/Admin | Tạo task mới |
| todo | PM | Gán dev cho task |
| in_progress | Dev | Bắt đầu làm |
| in_review | Dev | Push branch → auto (GitHub webhook) |
| done | PM | Merge to main → LP auto-awarded |

**Transition rules:**
- `backlog → todo`
- `todo → backlog | in_progress`
- `in_progress → backlog | in_review`
- `in_review → in_progress | done`
- `done → in_progress` (allow reopen)

**On "in_review":** creates `AdminNotification` → assigned QA
**On "done":** auto-creates pending `LpAward` for assignee (if `lp > 0`)

### 12.4 Notification Types

| Type | Trigger | Recipient | Priority |
|------|---------|---------|---------|
| new_order | Quote accepted | admin | high |
| payment_received | 50% payment recorded | ceo | urgent |
| design_request | Order → contracted | designer | high |
| demo_ready | FigmaDemo sent | customer | high |
| demo_feedback | Customer comments/rejects | designer | normal |
| design_approved | Customer approves final FigmaDemo | pm, designer | normal |
| task_assigned | TaskKanban assigned to member | dev/qa | normal |
| task_in_review | Task moved to in_review | qa | normal |
| task_done | Task moved to done | pm | normal |
| project_delivered | Order status → delivered | customer | high |
| handover_pending | Final 50% payment recorded | admin | high |
| domain_purchase | CustomerWebsite created | admin | normal |
| ekyc_submitted | eKYC data submitted | admin | normal |
| website_configured | CustomerWebsite.configStatus → configured | customer | normal |

### 12.5 Domain & Hosting Purchase Flow

```
Customer → Purchase domain + hosting (PricingWebPackage)
        → Submit eKYC (name, ID number, DOB, address)
        → Order.projectStatus = "pending_config"
        → CustomerWebsite.configStatus = "pending_config"
        → Admin reviews + configures website
        → Admin sets CustomerWebsite.configStatus = "configured"
        → Customer confirms
        → Project closed
```

**eKYC fields:** `ekycName`, `ekycIdNumber`, `ekycDob`, `ekycAddress` — stored in `CustomerWebsite`. Application-level encryption recommended for production.

### 12.6 LP Distribution Timeline

| Sự kiện | Ai nhận LP | Công thức |
|---------|-----------|---------|
| Thanh toán 50%/100% | customer | `ceil(VND × 0.00005 × 0.10)` |
| Thanh toán (referral) | referrer | `floor(VND × tierPct / 20000)` |
| Task done (TaskKanban) | dev assignee | `TaskKanban.lp` field |
| FigmaDemo approved | designer | từ `Order.lpAllocation` |
| OffSystemPayment | dev/pm/qa/designer/seo | `RevenueSplitConfig %` |

### 12.7 Project Members & Roles

**ProjectRole keys:** `pm | designer | dev | qa | seo`
**Model:** `ProjectMember` (FK: `memberId → TeamMember`, `projectRoleKey → ProjectRole.key`)

| Action | Ai được làm |
|--------|------------|
| Assign member to project | admin, pm |
| Remove member from project | admin |
| Create TaskKanban | pm, admin |
| Move task column | assignee, pm, admin |
| Approve task (done) | pm, admin |
| Send FigmaDemo | designer, admin |
| Approve FigmaDemo (client) | customer |
| Create HandoverPackage | pm, admin |
| Record payment | admin, ceo |
| Purchase domain/hosting | customer |
| Submit eKYC | customer |
| Configure website | admin, pm |

### 12.8 SSE Notification System

Real-time notifications via SSE (Server-Sent Events):
- **Endpoint:** `GET /api/admin/events/stream`
- **Events:** `connected`, `notification`, `ping` (heartbeat every 25s)
- **Hook:** `useRealtimeNotifications()` in admin layout
- **Fallback:** polling every 30s if SSE unavailable

### 12.9 Protected Files

- ❌ `src/app/components/ui/DemoViewer.tsx` — KHÔNG chỉnh sửa thủ công
- ❌ `src/app/components/layout/AdvancedSearch.tsx` — KHÔNG chỉnh sửa thủ công
- ❌ `src/app/api/admin/orders/[id]/transition/route.ts` — KHÔNG bypass transition rules


---

# CHUYÊN MỤC: TÍCH HỢP TỪ (.claude.md)

# LOOP Solutions — Claude Code Instructions

## Working Directory

`d:/LOOP_COMPANY/LOOP/` — **Đây là thư mục làm việc chính.**

## CRITICAL: Folders You MUST NOT Touch

```
❌ d:/LOOP_COMPANY/DESIGN LOOPS/
→ KHÔNG BAO GIỜ tạo, sửa, hoặc xóa bất kỳ file nào trong folder này.
→ Chỉ đọc để reference UI/UX.
```

## Documents — Read Before Writing Any Code

```
docs/PROJECT-PLAN.md   → Kiến trúc tổng thể, giai đoạn, quy tắc lớn
docs/PROJECT-RULES.md  → Quick reference cho từng quy tắc cụ thể
```

Đọc hai file này TRƯỚC KHI bắt đầu bất kỳ công việc nào.

---

## Golden Rules (Non-Negotiable)

### 1. Cấm Hardcode

Mọi giá trị data phải đến từ: ENV vars, Database (Prisma), hoặc i18n.

```typescript
// ❌ SAI
const url = "https://loop.vn";
const name = "VNRetail JSC";
const color = "#3B82F6";

// ✅ ĐÚNG
const url = process.env.NEXT_PUBLIC_SITE_URL;
const name = dbTeamMember.name;        // từ Prisma
style={{ color: DS.blue }}            // từ design tokens
```

### 2. Design Tokens Bắt Buộc

Import từ `@/lib/design-tokens`. Không hardcode màu hex trong JSX.

```typescript
import { DS, GRD, GLOW } from "@/lib/design-tokens";

// ✅ Dùng DS cho màu
style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}

// ✅ Dùng GRD cho gradient
style={{ background: GRD.primary }}

// ❌ Không hardcode
style={{ color: "#3B82F6" }}
```

### 3. Business Data = API/DB, Không Mock

```typescript
// ❌ SAI — hardcoded mock
const orders = [{ id: 'ORD-2601', clientName: 'Nguyễn Minh Tuấn', ... }];

// ✅ ĐÚNG — từ API
const { data } = useQuery({
  queryKey: qk.orders({ page: 1 }),
  queryFn: () => adminApi.get("/api/admin/orders"),
});
```

### 4. Auth Store = Real API, Không Rollback

`src/app/store/authStore.ts` đã migrate sang real API.
Không bao giờ quay lại mock `DEMO_USERS`.

### 5. Mỗi Trang = Route File Riêng

```
src/app/admin/overview/page.tsx    ✅
src/app/admin/orders/page.tsx      ✅
src/app/admin/members/page.tsx     ✅

src/app/admin/page.tsx             ❌ (gộp nhiều tabs)
```

### 6. i18n Cho Mọi User-Facing Text

```typescript
// ❌ SAI
<h1>Chào mừng LOOP</h1>

// ✅ ĐÚNG
<h1>{t("welcome")}</h1>
// với messages/vi.json: { "welcome": "Chào mừng LOOP" }
```

### 7. Query Keys Qua `qk` Factory

```typescript
// ❌ SAI
queryKey: ["orders", page]

// ✅ ĐÚNG
import { qk } from "@/lib/query/provider";
queryKey: qk.orders({ page })
```

---

## Mỗi Khi Nhận Task Mới

1. **Đọc `docs/PROJECT-PLAN.md`** — xác định giai đoạn + route
2. **So sánh với DESIGN LOOPS** — tìm file UI tương tự (đọc thôi)
3. **Xác định data source** — model nào? API route đã có chưa?
4. **Code theo cấu trúc** — route file → imports → data fetching → render
5. **Self-review checklist:**
   - [ ] Không hardcode data
   - [ ] Dùng DS/GRD/GLOW
   - [ ] i18n keys đầy đủ
   - [ ] Loading/empty/error states
   - [ ] No console.log
   - [ ] No TypeScript errors

---

## Cấu Trúc File Quan Trọng

```
src/lib/design-tokens.ts     ← Nguồn sự thật cho colors/fonts
prisma/schema.prisma         ← Nguồn sự thật cho database models
src/messages/vi.json         ← Nguồn sự thật cho Vietnamese i18n
src/app/store/authStore.ts   ← Auth đã migrate (không rollback)
src/lib/api/client.ts        ← apiClient + adminApi
src/lib/query/provider.tsx   ← qk factory (tạo mới nếu chưa có)
```

## Giai Đoạn Thực Hiện

| Giai đoạn | Nội dung | Thứ tự |
|-----------|---------|--------|
| 1 | Nền tảng (seed, design tokens, query keys) | 1 |
| 2 | Trang chủ & Dịch vụ | 2 |
| 3 | Portfolio & Dự án | 3 |
| 4 | Team & Gamification (CORE) | 4 |
| 5 | Admin Dashboard (24 tabs) | 5 |
| 6 | Academy & Blog | 6 |
| 7 | Media, Contact, About | 7 |
| 8 | Cleanup & Polish | 8 |

## Khi Có Thắc Mắc

1. Đọc `docs/PROJECT-PLAN.md`
2. Đọc `docs/PROJECT-RULES.md`
3. Rà soát rules tại thư mục `.claude/rules/`
4. Nếu vẫn không rõ → hỏi trước khi code

---

## Tích Hợp Kiến Trúc Mobile App Mới (Năm Nay)
Toàn bộ tư duy cốt lõi về mảng di động cho LOOP (React Native Expo, phân phối APK nội bộ, tái sử dụng Next.js API làm BaaS) phải được tuân thủ nghiêm ngặt.
Đọc kỹ tệp tham chiếu ưu tiên tại: `d:/LOOP_COMPANY/LOOP/.claude/rules/mobile-app-strategy.md` khi có bất cứ yêu cầu nào liên quan tới Mobile.


---

# CHUYÊN MỤC: TÍCH HỢP TỪ (CLAUDE.md)

# LOOP Solutions — Claude Code Context

> Project: LOOP Solutions Agency Platform — Next.js 15 Production
> Last Updated: 2026-04-07
> Language: Vietnamese (code comments, docs), English (variable names, function names)
> Status: ALL 8 PHASES COMPLETE ✅ (F0–F8) + Fi + Fs + R-seed ✅ — 224 route files, 99 models, ~90 i18n columns, 5 locales; infrastructure: slo.ts(221L) + logger.ts(265L) + scaleGate.ts(552L) + capacity.ts(377L) + Inngest (8 functions, 396L); cache: Cache-Control on 6 v1 GETs; idempotency: IdempotencyKey model + withIdempotency() on 6 mutations; observability: logger.withSLO() on 14 endpoints; rate-limit: applyRateLimit() on 5 public + auth/login; scale gate: 0 blocking, 4 non-critical warnings; **RBAC REDESIGN ✅ (2026-04-04): 7 roles (ceo/super_admin/admin/pm/media/qa/member), per-role tab sets, admin@loop.vn → super_admin level 0, JWT includes roleLevel**; **MEMBER ONBOARDING PLANNED (P2-A/B/C): CEO approval workflow + Access Tags**. **REVENUE SPLIT ✅ (2026-04-07): Off-System Payment → LP auto-split theo RevenueSplitConfig % → approve → credit LP. 3 Prisma models (RevenueSplitConfig + OffSystemPayment + OffSystemSplit). 4 API routes + 2 admin pages. LP rate persist via SiteSetting. Revenue page incorporates off-system revenue. Build ✅ tsc ✅ lint ✅.
> CI/CD: GitHub connected to Vercel, auto-deploy on push. Domain: loops.vn (production).

---

## ⚠️ CRITICAL — Production Codebase Only

```
/src/   ✅ PRODUCTION — Next.js 15, live at loops.vn
```

All development happens in `/src/`. **FE/** and **DESIGN LOOPS/** prototype folders were archived (see `git log 38fa12e`) — not present in this repo.

### KHÔNG BAO GIỜ làm:

- ❌ Copy/paste code từ archive branches vào `src/`
- ❌ Import từ prototype folders (không còn trong repo)
- ❌ Dùng mock data files trong production pages

### CHỈ dùng:

- `src/app/` — production pages
- `src/components/` — production shared components
- `src/lib/` — production business logic
- `src/app/api/admin/*` — production API endpoints

---

## Rules

> Khi implement feature mới hoặc viết docs liên quan đến nghiệp vụ, ĐỌC file này TRƯỚC:

| File | Mục đích |
|------|-----------|
| `docs/BUSINESS_LOGIC_ANALYSIS.md` | **[NEW] TÀI LIỆU SUPREME ANALYSIS (Source of Truth)**. Ghi nhận 100% logic toàn hệ sinh thái Web & Mobile, phân rã VIP, Off-system, và 3-Scope Quests. Đọc MỘT ĐI LÀ HIỂU HẾT DỰ ÁN. |
| `.claude/rules/mobile-app-strategy.md` | Hướng dẫn chiến lược triển khai Native Mobile App, React Native Expo + NativeWind UI Tokens |
| `.claude/rules/loop-business-logic-core.md` | Phân rã cấu trúc kỹ thuật Database cụ thể cho logic (Code level facts). |
| `.claude/rules/api-conventions.md` | API response shapes, HTTP status codes, endpoint naming, pagination |
| `.claude/rules/code-style.md` | TypeScript conventions, naming, async/await, null handling |
| `.claude/rules/database.md` | Prisma conventions, indexes, transactions |
| `.claude/rules/error-handling.md` | Error classes, handleError(), retry logic |
| `.claude/rules/security.md` | Auth, input validation, rate limiting |
| `.claude/rules/fe-be-parity.md` | FE mock vs BE production — BE luôn thắng |
| `.claude/rules/admin-design-parity.md` | Admin Dashboard parity: FE AdminDashboard vs BE AdminSidebar + pages. Sidebar width, tab labels, layout shell. P2 tasks cho admin. |
| `.claude/rules/admin-rbac.md` | **⚠️ 2 hệ thống RBAC khác nhau**: (1) FE mock — 5 roles (admin/manager/staff/client/guest), (2) BE production — 7 roles + granular DB permissions. Role mapping, security rules, wire plan cho Members page. Đọc TRƯỚC khi sửa auth hoặc permissions. |
| `.claude/rules/go-live-phase2.md` | P2 deferred tasks (non-blocking) |

---

## Tổng quan dự án

### Codebase duy nhất

> **2026-04-04**: FE/ và DESIGN LOOPS/ đã được archive khỏi repo. Chỉ còn `/src/` là production.

```
/src/   ✅ PRODUCTION — Next.js 15 + Prisma 7 + PostgreSQL/Neon
```

| Metric | Value |
|---|---|
| **Route files** | 224 API routes |
| **Models** | 99 Prisma models |
| **i18n columns** | ~90 columns, 5 locales (VI/EN/JA/KO/ZH) |
| **Seed data** | 28 members, LP economy, quests, events |
| **Dev port** | `3000` |
| **Production** | loops.vn (Vercel + Neon PostgreSQL) |

### Hạ tầng Production

| | |
|---|---|
| **Hosting** | Vercel (Next.js SSR + static) |
| **Domain** | `loops.vn` (production) |
| **Git** | GitHub connected → Vercel auto-deploy |
| **Database** | Neon (PostgreSQL) |
| **CI** | `.github/workflows/ci.yml` — lint + typecheck + build + test |
| **Deploy tự động** | Push `develop` → Preview URL · Push `main`/tag → loops.vn |
| **Env vars** | Vercel Dashboard → Settings → Environment Variables |
| **Vercel project** | `prj_T3kS2kTcAF38IuhMtqGRRlINOSR5` · `team_zgpVFIa6a7Y9QE4H4yTHe3Bv` | |

### Mục tiêu hiện tại
All 8 phases hoàn thành. **Revenue Split + Off-System Payment ✅ (2026-04-07)** — LP Rate persist, RevenueSplitConfig CRUD, OffSystemPayment auto-split, approve → credit LP. Remaining: JA/KO/ZH professional translation (MEDIUM), I18N-RUNBOOK done ✅. Deferred P2: JSON Translation migration, SupportedLocale model, TTFB audit, GSC verify, bundle opt. Chi tiết: `docs/FE-BE-INTEGRATION-STATUS.md`.

---

## Kiến trúc hệ thống LOOP

### Luồng người dùng (User Flow)

```
Khách hàng tiềm năng
    ├── /               → LandingPage (hero, dịch vụ, portfolio, testimonial)
    ├── /dich-vu        → ServicesPage (4 dịch vụ: Web, App/SaaS, Dashboard, SEO)
    │   └── /dich-vu/:id → ServiceDetailPage
    ├── /du-an          → PortfolioPage (6 dự án hoàn thành)
    │   └── /du-an/:id  → ProjectDetailPage (challenge/solution/result + metrics)
    ├── /doi-ngu        → Home.tsx (27 thành viên, rank Iron→Diamond, HUD overlay)
    │   └── /member/:id → MemberDetailPage
    ├── /hoc-vien       → AcademyPage (7 khóa học)
    │   └── /hoc-vien/:id → CourseDetailPage (Video Gate 35%, Code Exercise, Certificate)
    ├── /blog           → BlogPage
    │   └── /blog/:id   → BlogDetailPage
    ├── /lien-he        → ContactPage (form liên hệ)
    ├── /dat-lich       → BookingWizardPage (8 bước báo giá)
    └── /dang-nhap      → AuthPage

Khách hàng đã đặt hàng
    └── /khach-hang     → CustomerDashboard (8 tabs: tổng quan, dự án, khóa học, hóa đơn, ví LP, giới thiệu, hỗ trợ, cài đặt)

Nhân viên LOOP
    └── /admin          → AdminDashboard (23 tabs theo phòng ban)

Onboarding (lần đầu)
    └── /               → OnboardingPage (5-slide intro, localStorage skip tracking)
```

---

## Hệ thống nghiệp vụ LOOP

### 1. LP Economy (Điểm thưởng nội bộ)

**Kiếm LP:**
- Hoàn thành task/quest nội bộ (nhân viên)
- Hoàn thành khóa học (học viên)
- Mua dịch vụ (khách hàng nhận LP reward)
- Giới thiệu bạn bè (referral)

**Dùng LP:**
- Giảm giá dịch vụ: tối đa 20%, rate `1,000 LP = 500,000 VNĐ`
- Mua khóa học (toàn phần hoặc LP+VNĐ)
- Đổi thưởng nội bộ

**Rank System (nhân viên):**
| Rank | Màu | Level | Hiệu ứng |
|---|---|---|---|
| Iron | #9CA3AF | 1–14 | Particle Glow |
| Bronze | #CD7F32 | 15–34 | Border Gradient |
| Silver | #C0C0C0 | 35–54 | Silver Shimmer |
| Gold | #FFD700 | 55–74 | Gold Aura + Neon Pulse (Lv.60+) |
| Platinum | #E5E4E2 | 75–84 | Platinum Trail + Matrix Rain (Lv.80+) |
| Ruby | #E0115F | 85–94 | Ruby Fire Particles |
| Diamond | #7DD3FC | 95+ | Diamond Holographic + Cosmic Badge (Lv.100+) |

**Admin Effects Tab:**
- Global toggle bật/tắt toàn bộ hiệu ứng
- CRUD hiệu ứng: name, description, type, rarity, unlock conditions
- 3 views: danh sách, theo rank, theo thành viên

### 2. Order Lifecycle

```
pending_payment → paid → in_progress → demo_ready → client_review → done
```
- **Wizard 8 bước:** Chọn dịch vụ → Gói (×1/×2.2/×3.8) → Tính năng → Nhân sự → Lịch hẹn → Extras → Review → Thanh toán (VNĐ + LP)
- **Admin Orders Tab:** CRUD, gán PM, send demo (masked URL), chat với khách, advance status
- **Customer Dashboard:** Theo dõi order, xem demo qua DemoViewer, chat với PM

### 3. Academy Flow

- **Free trial:** Xem trước miễn phí (FreeTrialModal)
- **Enrollment:** VNĐ / LP+VNĐ / LP toàn phần (PaymentModal)
- **CoursePlayer:**
  - Video Gate: phải xem ≥35% mới mở bài tiếp
  - Code Exercise: editor + output trực tiếp
  - Comments: bình luận mỗi bài
  - Certificate khi hoàn thành 100% + LP reward

### 4. Quest & Event System

**13 Quests theo frequency:**
- Daily: Điểm danh, gửi tin nhắn, xem blog
- Weekly: Hoàn thành 3 task, viết blog, hoàn thành 1 khóa
- Monthly: Đánh giá 360°, giới thiệu 1 KH
- One-time: First Blood, Streak Master 30 ngày
- Client: Đặt dịch vụ đầu tiên, đánh giá

**3 Events:**
- Spring Festival 2026 (seasonal, active)
- Hackathon Internal Q1 (competition, active)
- LOOP Anniversary (celebration, inactive)

---

## Thiết kế hệ thống FE

### Tech Stack
- **React 18 + TypeScript** (strict, no `any`)
- **Vite 6** (build tool)
- **Tailwind CSS v4** (utility-first, CSS variables for design tokens)
- **Motion** (Framer Motion) — longhand properties only (backgroundColor, borderColor)
- **Zustand** (global state: loopStore + authStore)
- **React Router v7** (Data Router)

### Design System (`src/app/components/layout/ds.ts`)
```
DS: bg=#020617, bgCard=#0F172A, blue=#3B82F6, purple=#818CF8, text3=#94A3B8
Fonts: Cinzel (heading), Inter (body), JetBrains Mono (code)
```

### Quy tắc CSS quan trọng
- ✅ Dùng `rgba()` thay vì Tailwind opacity classes: `rgba(59,130,246,0.15)`
- ✅ Longhand properties trong motion: `backgroundColor`, `borderColor`
- ❌ Không dùng shorthand: `background`, `border` trong `whileHover/animate/initial`
- ❌ Không dùng Recharts/D3 — chỉ dùng Pure SVG cho charts
- ✅ `DemoViewer.tsx` — KHÔNG CHỈNH SỬA (file đã edit thủ công)

---

## Cấu trúc thư mục FE

```
src/
├── app/
│   ├── [locale]/                  # Public pages (/{locale}/...)
│   │   ├── page.tsx               # Landing page
│   │   ├── services/              # Services listing + detail
│   │   ├── portfolio/             # Portfolio listing + detail
│   │   ├── blog/                  # Blog listing + detail
│   │   ├── academy/               # Academy listing + course detail
│   │   ├── team/                  # Team listing + member detail
│   │   ├── khach-hang/            # Customer dashboard (8 tabs)
│   │   ├── dang-nhap/             # Login
│   │   ├── dat-lich/              # Booking wizard
│   │   └── components/            # SiteHeader, SiteFooter (shared)
│   ├── admin/                     # Admin dashboard (23 tabs)
│   │   ├── layout.tsx             # Dark admin shell (React Query + auth)
│   │   ├── overview/page.tsx
│   │   ├── members/page.tsx       # Member CRUD (1,988L)
│   │   ├── orders/page.tsx
│   │   ├── academy/page.tsx
│   │   ├── effects/page.tsx       # ⚠️ READ-ONLY — driven by code
│   │   ├── quest_events/page.tsx
│   │   └── ... (20 more sections)
│   ├── api/                        # API routes
│   │   ├── v1/                    # Public read-only (localized, cached)
│   │   ├── admin/                 # Protected CRUD (requirePermission)
│   │   ├── academy/               # Education API
│   │   └── auth/                  # JWT auth
│   └── (root)                     # Onboarding, feed.xml
├── components/
│   ├── ui/                         # 49 Shadcn/ui base components
│   ├── admin/                      # AdminSidebar, AdminTopbar, SessionInit
│   ├── landing/                    # Page client components (OnboardingClient, etc.)
│   └── layout/                     # ds.ts (design tokens)
├── lib/
│   ├── auth/                       # JWT, permissions, RBAC
│   ├── api/                        # Response helpers (ok, list, handleError)
│   ├── services/                   # Business logic (commerce, gamification, etc.)
│   ├── jobs/                       # Inngest background jobs (8 functions)
│   ├── pricing/                    # Quote calculator, order lifecycle
│   └── ...                         # analytics, cache, logger, slo, etc.
├── i18n/messages/                  # i18n JSON (5 locales — VI/EN/JA/KO/ZH)
├── store/                           # Zustand (authStore, loopStore, audioStore)
├── styles/                          # globals.css, figma-theme.css
└── middleware.ts                    # i18n routing + admin auth + logo.png static
```

---

## API Endpoints (key)

### Public APIs (v1)
- `GET /api/v1/services?lang=` → Service list
- `GET /api/v1/projects?lang=` → Project list
- `GET /api/v1/team?lang=` → TeamMember list
- `GET /api/v1/testimonials?lang=`
- `GET /api/v1/pricing?lang=` → ❌ NOT implemented — FE uses `/api/pricing/config?lang=`
- `GET /api/v1/blog?lang=` → ❌ NOT implemented — FE uses `/api/blog-posts?lang=` (DB-backed)
- `GET /api/v1/courses?lang=` → Academy course list
- `GET /api/v1/courses/[id]?lang=` → Academy course detail + curriculum

### Student/Client Academy APIs
- `GET /api/academy/enroll` → List user enrollments
- `POST /api/academy/enroll` → Enroll in course (vnd/mixed/lp)
- `POST /api/academy/lessons/[id]/complete` → Mark lesson complete (Video Gate 35%)
- `GET /api/academy/progress/[courseId]` → Load saved progress
- `GET /api/academy/certificate/[courseId]` → Certificate eligibility

### Admin APIs (key)
- `GET/POST /api/admin/services` → Service CRUD
- `GET/POST /api/admin/projects` → Project CRUD
- `GET/POST /api/admin/team` → TeamMember CRUD
- `GET/POST /api/admin/orders` → Order CRUD
- `GET/POST /api/admin/blog-posts` → BlogPost CRUD
- `GET/POST /api/admin/edu/courses` → Course CRUD
- `PUT/DELETE /api/admin/edu/courses/[id]` → Course update/delete
- `GET/POST /api/admin/edu/enrollments` → Enrollment CRUD
- `GET/POST /api/admin/lp-awards` → LP awards
- `GET/POST /api/admin/lp-transactions` → LP transactions
- `GET/POST /api/admin/lp-redemptions` → LP redemptions
- `GET/POST /api/admin/figma-demos` → Demo links
- `GET/POST /api/admin/quote` → Pricing wizard
- `GET /api/admin/dashboard` → KPI overview
- `GET /api/admin/dashboard/charts` → Analytics charts
- `GET/POST /api/admin/settings/lp-rate` → LP rate config (persist)
- `GET/POST/PUT/DELETE /api/admin/revenue-split-configs` → RevenueSplitConfig CRUD
- `GET/POST /api/admin/off-system-payments` → OffSystemPayment + auto-split
- `GET/PATCH/DELETE /api/admin/off-system-payments/[id]` → OffSystemPayment single
- `POST /api/admin/off-system-payments/[id]/splits/[splitId]/approve` → Credit LP to member

### Auth
- `POST /api/admin/auth/login` → JWT login
- `GET /api/admin/auth/me` → Current user
- `POST /api/admin/auth/logout` → Logout

---

## Prisma Models (key)

| Model | Dùng ở |
|---|---|
| Service | ServicesPage, ServiceDetailPage |
| Project | PortfolioPage, ProjectDetailPage |
| TeamMember | Home.tsx (27 members), MemberDetailPage |
| Expertise | Team member specialties |
| BlogPost | BlogPage, BlogDetailPage |
| Testimonial | LandingPage testimonials |
| HomeSlider | LandingPage hero sliders |
| HomeVideo | LandingPage video section |
| PricingPlan | BookingWizardPage (pricing config) |
| Order | CustomerDashboard, OrdersTab, Order lifecycle |
| OrderStatusHistory | OrderTab tracking |
| FigmaDemo | DemoViewer masked URLs |
| Quote | BookingWizardPage submit |
| QuoteRequest | Wizard 8-step |
| Payment | CustomerDashboard invoices |
| ServicePackage | Wizard step 2 (packages) |
| Feature | Wizard step 3 (add-on features) |
| AddonService | Wizard step 6 |
| InfrastructureTier | Wizard pricing |
| FeatureGroup | Wizard pricing |
| FeatureVariant | Wizard pricing |
| CustomerPoint | LP balance |
| PointTransaction | LP history |
| PointActivity | LP activity log |
| LpAward | LP awards (admin) |
| LpTransfer | LP transfers |
| Course | AcademyPage, CourseDetailPage |
| Lesson | CoursePlayer |
| Instructor | AcademyPage |
| Enrollment | Academy enrollment + progress |
| StudentProgress | Video Gate 35% tracking |
| Attendance | Course attendance |
| Feedback | Course feedback |
| EduPayment | Academy payment |
| Notification | AdminNotifications, ClientNotifications |
| SalesLead | ClientsTab CRM |
| Task | KanbanBoard |
| Epic | KanbanBoard epics |
| Backlog | KanbanBoard backlogs |
| BlogPost | Blog content |
| RankEffect | EffectsTab CRUD + per-rank display |
| MemberEffectOverride | Member card effects (Akira, Ryo, Vũ Trọng overrides) |
| Quest | QuestEventsTab CRUD |
| CompanyEvent | QuestEventsTab CRUD |
| QuestParticipant | Quest participation tracking (15 team members) |
| User (Team) | User accounts for team members (QuestParticipant FK) |
| **RevenueSplitConfig** | Revenue split % per role (2026-04-07) |
| **OffSystemPayment** | Chi phí/thu ngoài hệ thống (2026-04-07) |
| **OffSystemSplit** | LP split per role, approve workflow (2026-04-07) |

---

## Admin RBAC

### Role Hierarchy
`admin > manager > staff > client > guest`

### Department Tabs
| Department | Tabs |
|---|---|
| engineering | overview, orders, projects, members, notification_center |
| design | overview, orders, projects, portfolio, members, notification_center |
| media | overview, media, orders, projects, members, notification_center |
| marketing | overview, blog, academy, clients, services, notification_center |
| sales | overview, orders, clients, quotation, services, revenue, notification_center |
| finance | overview, revenue, lp, lp_manage, income_tax, web_packages, orders, notification_center |
| hr | overview, members, departments, notification_center |
| management | overview, orders, members, departments, projects, revenue, clients, notification_center, quests_events |
| admin | **TẤT CẢ 23 tabs** |

### 25 Admin Tabs
`overview | orders | members | departments | projects | services | media | quotation | portfolio | projects_completed | academy | blog | revenue | clients | lp | lp_manage | income_tax | web_packages | effects | notification_center | settings | quests_events | leaderboard_admin | analytics | figma-demos | kanban | revenue_split | off_system_payments`

---

## Phase Roadmap (FE-first)

### Phase F0 — Infrastructure (Foundation) ✅
Thiết lập hạ tầng kết nối FE → BE, auth, routing.

### Phase F1 — Public Pages ✅
Landing, Services, Portfolio, Blog, Contact — kết nối public APIs.

### Phase F2 — Booking Wizard + Orders ✅
Wizard 8 bước + Order lifecycle.

### Phase F3 — Team + Effects ✅
27 members + Rank effects system.

### Phase F4 — Academy ✅
Courses + Enrollment + Video Gate. BE endpoints: `courses/[id]`, `enroll`, `lessons/[id]/complete`, `progress`, `certificate`, admin `PUT/DELETE`. Academy seed: 6 instructors, 7 courses, lessons, enrollments. PaymentModal→enroll API, CoursePlayer→completeLesson API, AcademyTab→CRUD.

### Phase F5 — Customer Portal ✅
Customer dashboard + LP wallet + quests.

### Phase F6 — Admin CMS ✅
23 admin tabs — 100% wired to BE APIs. 4/4 translate tabs (Services/Portfolio/Blog/Members) via `TranslationEditor`.

### Phase F7 — Realtime/Polish ✅
SSE notifications, AnalyticsTab wired, AdminLeaderboardTab fixed (CUID memberId), seed quests/events.

### Phase F8 — Scale Hardening ✅
SLO/logger/scaleGate/capacity + Inngest 8 functions + Cache-Control + IdempotencyKey + Rate-limit.

### Fi — I18n Remediation ✅
Navbar/Footer wired useI18n(), LocaleSwitcher cookie, error page hardcoded (Next.js limitation).

### Fs — SEO/PWA/Geo ✅
Dynamic OG via /api/og, geo tags, JSON-LD (Organization+WebSite), manifest linked, theme_color fixed.

### R-seed — Unified Demo Data ✅
28 members, LP economy, quests/events, orders, rank effects — BE seed + FE fallback sync.

---

## Development Workflow

```bash
# Start dev server (port 3000)
cd d:/LOOP_COMPANY/LOOP && npm run dev

# Quality gates
npm run lint
npx tsc --noEmit

# Deploy via Vercel CLI (manual, no GitHub Actions needed)
npx vercel --prod=false          # Preview
npx vercel --prod               # Production (loops.vn)
```

## CI/CD Pipeline

```
GitHub push (develop)  ──→  CI (lint + typecheck + build)  ──→  Vercel Preview
GitHub push (main)    ──→  CI (lint + typecheck + build)  ──→  loops.vn
```

| Trigger | Môi trường | URL |
|---|---|---|
| Push `develop` | Preview | Vercel auto-assign |
| Push `main` | Production | `loops.vn` |
| Pull Request | Preview (temp) | Vercel auto-assign |

> **Không cần `deploy.yml`** — Vercel tự nhận webhook từ GitHub. Chỉ cần thêm Environment Variables trong Vercel Dashboard → Settings → Environment Variables. CI workflow nằm ở `.github/workflows/ci.yml`.

---

## Communication Style

- Vietnamese cho docs, comments, giao tiếp người dùng
- English cho code, variable names, function names
- Ngắn gọn, thực tế, có action

---

## Available Slash Commands

- `/audit` — API Consistency Audit
- `/docs` — Documentation Helper
- `/plan` — Check LOOP Plan Progress
- `/review` — Code Review
