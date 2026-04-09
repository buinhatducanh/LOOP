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
