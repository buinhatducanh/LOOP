# LOOP Business Logic — Source of Truth

> **Version**: 5.0.0 · Updated: 2026-04-07
> **Source**: Verified against `loopStore.ts`, `authStore.ts`, `memberData.ts`, `KanbanBoard.tsx`, `KanbanHub.tsx`, `useRealtimeNotifications.ts`, `authStore.ts` v3 (7 roles)
> **Status**: v5 — Revenue Split Config + Off-System Payment (2026-04-07): LP Rate Persist, RevenueSplitConfig, OffSystemPayment + OffSystemSplit models, auto-split workflow, approve flow.

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

## 7. Staff Portal Tabs

```typescript
// authStore.ts — getAccessibleTabs()
STAFF_TABS = ['overview', 'projects', 'notification_center'];
// Manager: theo department (xem DEPT_TABS trong authStore)
```

---

## 8. Admin RBAC — 7 Staff Roles

### 8.1 Role Hierarchy

```typescript
// roleLevel: lower = more privileged
ceo: -1 → super_admin: 0 → admin: 1 → project_manager: 2 → media: 3 → qa: 4 → member: 5
```

### 8.2 Per-Role Admin Tabs

| Role | Tabs | Domain |
|------|------|--------|
| admin (0-1) | all 23 | Toàn hệ thống |
| project_manager (2) | orders, clients, quotation, services, revenue, projects, members, departments, lp_manage... | Kinh doanh, vận hành dự án |
| media (3) | media, blog, orders, projects, clients, academy, services, portfolio... | Media, marketing, nội dung |
| qa (4) | projects, notification_center, orders, clients, members, academy... | Testing, QA |
| member (5) | overview, notification_center, leaderboard_admin, academy, quests_events | Cơ bản — mọi người đều xem Kanban |

### 8.3 Member Onboarding — CEO Approval Workflow

```
HR tạo hồ sơ → Nhân viên đăng ký (pending) → CEO duyệt → Gán role + tags → Kích hoạt
```

**2 lớp quyền:**
- System Role (1 cái): member, media, qa, pm — gán bởi CEO
- Access Tags (nhiều cái): blog-post, seo-content, kanban... — gán bởi CEO

**Default tags (cho mọi member, không revoke):**
- `kanban`: Kanban Board
- `order-basic`: Xem đơn hàng

**Mới thêm (v4):**
- `blog-post`: Quản trị bài viết (cho SEO, Media)
- `project-content`: Nội dung dự án (cho SEO, Designer)
- `seo-content`: Nội dung SEO (cho SEO Specialist)
- `media-content`: Nội dung Media (cho Media team)
- `salary`: Xem lương (CEO/Admin only)
- `lp-manage`: Quản lý LP (CEO → Admin)
- `finance-view`: Xem tài chính (cho Kế toán)
- `hr-manage`: Quản lý nhân sự (cho HR)

---

## 9. Admin RBAC Tabs (25 tabs)

```typescript
type AdminTab =
  | 'overview' | 'orders' | 'members' | 'departments' | 'projects'
  | 'services' | 'media' | 'quotation' | 'portfolio' | 'projects_completed'
  | 'academy' | 'blog'
  | 'revenue' | 'clients' | 'lp' | 'lp_manage' | 'income_tax' | 'web_packages'
  | 'effects' | 'notification_center' | 'settings' | 'quests_events'
  | 'leaderboard_admin' | 'analytics' | 'figma-demos' | 'kanban'
  | 'revenue_split' | 'off_system_payments'; // v5 (2026-04-07)
```

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

## 12. LP System — Bổ sung nguồn LP

**Thêm vào bảng nguồn LP (Section 3):**

| Nguồn | Staff | Client | Trigger | Ghi chú |
|-------|-------|--------|---------|---------|
| **OffSystemPayment** | **✅ (member nhận split)** | — | PM/Admin approve OffSystemSplit | `OffSystemSplit.approvedAt` → credit LP |

**Logic approve OffSystemSplit:**
```typescript
// POST /api/admin/off-system-payments/:id/splits/:splitId/approve
// 1. TeamMember.availableLp += lpAmount
// 2. LpTransaction (type: award, source: award, referenceType: off_system_split)
// 3. syncRankFields(memberId)
// 4. OffSystemSplit.status = "approved"
```
