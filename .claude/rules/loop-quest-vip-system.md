# LOOP Quest + VIP System (v8)

> **Version**: 8.1.0 · Updated: 2026-04-10
> **Source**: Verified vs `src/app/api/admin/quests/route.ts`, `daily-login/route.ts`, `prisma/schema.prisma`
> **Status**: ⚠️ IMPLEMENTATION vs SPEC MISMATCH — Sec 1-2 document the TARGET design (v8). Code implements a subset (see Section 8 for what's ACTUALLY built vs planned). Staff Quest + Client VIP full implementation is P2 planned work. For core business, see `loop-business-logic-core.md`.

---

## Tổng quan

File này ghi lại Staff Quest System (3 độ phủ) và Customer VIP System v8 (2026-04-09).
LP Staff ≠ LP Customer — phân tách hoàn toàn.

---

## 1. Staff Quest System — 3 Độ Phủ (v8)

> **v8 — 2026-04-09**: Hệ thống quest riêng cho nhân sự (trừ CEO, ADMIN, SUPER_ADMIN, HR). Chia 3 cấp: công ty → phòng ban → cá nhân. XP là phần thưởng chính (không phải LP). Không reset theo thời gian — thời gian hoàn thành vô hạn.

### 1.1 Phân tách nhân sự vs quản trị

```
AI LÀM QUEST:    Staff (member, pm, media, qa) + HR (có thể có quest riêng)
AI KHÔNG LÀM:     CEO, super_admin, admin   → không thuộc hệ thống quest nhân sự
```

### 1.2 Ba độ phủ quest

```
┌─────────────────────────────────────────────────────────────┐
│  ĐỘ PHỦ 1 — CÔNG TY (Company-Wide)                          │
│  Tất cả nhân sự cùng làm 1 nhiệm vụ chung                  │
│  Thưởng: XP chia đều cho tất cả người tham gia             │
│  Ví dụ:                                                     │
│    • Điểm danh hàng ngày (tất cả điểm danh = công ty đạt) │
│    • Cập nhật eKYC (tất cả cập nhật = công ty đạt)         │
│    • Workshop/talk nội bộ (tham gia ≥ 80%)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ĐỘ PHỦ 2 — PHÒNG BAN (Department)                         │
│  Chỉ member thuộc phòng ban cùng làm                       │
│  Thưởng: XP chia đều trong phòng ban                       │
│  Ví dụ:                                                     │
│    • MKT: "10 khách hàng đầu tiên của phòng"               │
│    • Sales: "Đạt doanh thu 50M trong tháng"                │
│    • Design: "Hoàn thành 5 demo trong Sprint"              │
│    • Engineering: "Review ≥ 20 PR trong tháng"              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ĐỘ PHỦ 3 — CÁ NHÂN THEO ROLE (Personal)                   │
│  Mỗi người tự hoàn thành nhiệm vụ riêng theo role         │
│  Thưởng: XP toàn phần cho cá nhân                           │
│  Ví dụ:                                                     │
│    • MKT: "Có 1 khách hàng riêng trong tháng"              │
│    • PM: "Quản lý 3 dự án cùng lúc"                        │
│    • Media: "Xuất bản 4 bài blog"                           │
│    • Dev: "Merge ≥ 10 PR"                                   │
│    • QA: "Report ≥ 15 bug"                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Thưởng XP (không phải LP)

```typescript
interface StaffQuest {
  id: string;
  key: string;              // "q-company-daily-checkin" | "q-dept-mkt-10clients" | "q-personal-mkt-1client"
  scope: "company" | "department" | "personal";
  departmentId?: string;    // null nếu scope = "company" hoặc "personal"
  title: string;           // "Điểm danh công ty"
  description: string;
  targetValue: number;     // số cần đạt (VD: 10 khách)
  currentValue: number;    // progress hiện tại (0 → targetValue)
  xpReward: number;        // XP thưởng khi hoàn thành
  participantIds: string[]; // TeamMember[] — ai đang tham gia
  completedIds: string[];   // TeamMember[] — ai đã hoàn thành
  isActive: boolean;
  // Cấu hình trigger
  triggerType: "manual" | "auto";  // manual = tự click, auto = hệ thống tracking
  eventKey?: string;       // event key để auto-update progress (VD: "order.created", "task.done")
  createdAt: Date;
  // Thời gian: KHÔNG có deadline — không reset theo ngày/tuần/tháng
  // Hoàn thành khi nào thì thưởng khi đó
}
```

### 1.4 XP vs LP — Staff

| | XP | LP |
|---|---|---|
| **Đối tượng** | Nhân sự (staff) | Nhân sự + Khách hàng |
| **Nguồn chính** | Staff Quest completion | Kanban task, OffSystemPayment, Admin manual, điểm danh |
| **Công thức** | `xpReward` cố định trong quest config | `TaskKanban.lp` hoặc `% OffSystemPayment` |
| **Reset** | **KHÔNG reset** | Có thể reset (Admin deduct) |
| **Rank ảnh hưởng** | **CÓ** — XP tích lũy → level thăng tiến (Iron→Diamond) | **CÓ** — LP tích lũy → rank field |
| **LP chuyển nhượng** | — | Staff LP có thể chuyển (LpTransfer) |
| **Tỷ lệ** | 1 XP = 1 XP | 1 LP = 1 LP |
| **Lưu trữ** | `StaffQuestProgress` — per member per quest | `TeamMember.availableLp` |

### 1.5 Cập nhật LP System (Staff — giữ nguyên nguồn)

> Staff vẫn kiếm LP từ: Kanban task, OffSystemPayment, Admin manual, điểm danh. Quest chỉ thưởng **XP**.

| Nguồn LP | Staff | Trigger |
|-----------|-------|---------|
| Kanban task | ✅ | Task → Done |
| OffSystemPayment | ✅ | Split approved |
| Admin manual | ✅ | AdminLeaderboardTab |
| Điểm danh | ✅ | authStore.checkIn() |
| **Staff Quest** | ❌ | **→ Thưởng XP, không thưởng LP** |

### 1.6 Trigger tự động (eventKey)

```typescript
// StaffQuest.triggerKey → map với hệ thống event
const EVENT_KEY_MAP = {
  "order.created":      // Order mới được tạo
  "order.done":          // Order hoàn thành
  "task.done":           // TaskKanban → Done
  "pr.merged":           // GitHub webhook
  "blog.published":      // Blog post published
  "demo.approved":        // FigmaDemo approved
  "ekyc.updated":         // TeamMember cập nhật eKYC
  "checkin.daily":       // authStore.checkIn()
  "client.acquired":      // SalesLead → converted
};

// Mỗi event trigger → update ALL quests có eventKey tương ứng
// → progress++
```

### 1.7 Quest cá nhân theo Role (ví dụ)

| Role | Quest | Scope | Target | XP |
|------|-------|-------|--------|----|
| `marketing` | Có 1 khách riêng trong tháng | personal | 1 khách | 500 |
| `marketing` | Đạt 10 khách phòng ban | department | 10 khách | 1,000 |
| `pm` | Quản lý 3 dự án cùng lúc | personal | 3 orders | 800 |
| `media` | Xuất bản 4 bài blog | personal | 4 posts | 400 |
| `dev` | Merge ≥ 10 PR | personal | 10 PRs | 600 |
| `qa` | Report ≥ 15 bug | personal | 15 bugs | 450 |
| `sales` | Đạt doanh thu 20M | personal | 20M VND | 1,200 |

---

## 2. Customer Quest + VIP System (v8)

> **v8 — 2026-04-09**: Khách hàng (client) có hệ thống quest + VIP tiers riêng. LP khách **chỉ dùng cá nhân**, không chuyển được cho ai khác. Không có LP Transfer giữa khách.

### 2.1 Phân tách LP Staff vs Customer

```
STAFF LP:    Kiếm từ Kanban/OffSystem/Admin/Điểm danh → CÓ chuyển được (LpTransfer)
CLIENT LP:   Kiếm từ Order done / Quest → CHỈ dùng cá nhân, KHÔNG chuyển được
```

### 2.2 Customer Quest System

```typescript
interface ClientQuest {
  id: string;
  key: string;              // "q-client-first-order", "q-client-referral-1"
  title: string;
  description: string;
  targetValue: number;      // số cần đạt
  currentValue: number;     // progress
  lpReward: number;         // LP thưởng (KHÔNG có XP — khách không dùng XP)
  xpReward: number;         // 0 (khách không có hệ thống rank/XP)
  type: "first_order" | "referral" | "spending" | "review" | "engagement";
  // Trigger
  triggerType: "manual" | "auto";
  eventKey?: string;        // "order.done", "referral.converted", "review.submitted"
  // VIP contribution
  vipPoints: number;        // Điểm tích lũy vào VIP tier
  isActive: boolean;
  createdAt: Date;
  // Không reset — hoàn thành khi nào thưởng khi đó
}

interface ClientQuestProgress {
  id: string;
  odingId: string;          // User (Customer) — FK
  questId: string;
  currentValue: number;
  completed: boolean;
  completedAt: Date | null;
  lpAwarded: boolean;       // đã nhận LP chưa
  vipPointsAwarded: boolean; // đã cộng VIP points chưa
}
```

### 2.3 Customer Quest mẫu

| Key | Tiêu đề | Mô tả | Target | LP | VIP Pts |
|-----|---------|--------|--------|-----|---------|
| `q-client-first-order` | Khách hàng đầu tiên | Hoàn thành đơn hàng đầu tiên | 1 order | 2,000 | 50 |
| `q-client-referral-1` | Giới thiệu bạn bè | Giới thiệu 1 khách hàng mới | 1 ref | 5,000 | 100 |
| `q-client-review-1` | Đánh giá dịch vụ | Viết review sau khi hoàn thành dự án | 1 review | 500 | 20 |
| `q-client-spending-10m` | VIP Bronze | Tổng chi tiêu đạt 10 triệu | 10M VND | 1,000 | 200 |
| `q-client-spending-50m` | VIP Silver | Tổng chi tiêu đạt 50 triệu | 50M VND | 3,000 | 500 |
| `q-client-spending-100m` | VIP Gold | Tổng chi tiêu đạt 100 triệu | 100M VND | 8,000 | 1,000 |

### 2.4 VIP Tiers — Bậc thang khách hàng

> Dựa vào **tổng chi tiêu tích lũy** (Order.paidAmount thực tế) + **VIP points** từ quest hoàn thành.
> VIP tier tối đa: **VIP 3**. Không có VIP 4.

```typescript
interface VipTier {
  key: "regular" | "vip1" | "vip2" | "vip3";
  label: string;
  minSpending: number;       // tổng chi tiêu tối thiểu (VNĐ)
  minVipPoints: number;     // VIP points tối thiểu (từ quest)
  // Cần ĐỦ CẢ 2 điều kiện mới lên tier
  benefits: string[];
  discountCap: number;      // % giảm giá tối đa khi dùng LP
  lpToVndRate: number;       // tỷ lệ quy đổi LP → VNĐ
}
```

### 2.5 Bảng VIP Tiers

| Tier | Label | Tổng chi tiêu tối thiểu | VIP Points tối thiểu | Giảm giá LP tối đa |
|------|-------|------------------------|---------------------|---------------------|
| `regular` | Khách hàng | 0 VNĐ | 0 | 10% |
| `vip1` | VIP 1 | 10,000,000 VNĐ (10M) | 100 pts | 15% |
| `vip2` | VIP 2 | 50,000,000 VNĐ (50M) | 500 pts | 20% |
| `vip3` | VIP 3 | 100,000,000 VNĐ (100M) | 1,000 pts | 25% |

### 2.6 Điều kiện lên VIP

```
Cần ĐỦ CẢ 2:
  1. Tổng chi tiêu (Order.paidAmount thực tế đã thanh toán)
  2. VIP Points từ quest hoàn thành

→ VIP tier = MAX(tier đạt theo spending, tier đạt theo VIP points)
→ Tự động promote khi thỏa điều kiện
→ Không demote (không giảm tier)
```

### 2.7 LP Khách hàng — Chỉ dùng cá nhân

```typescript
// LpTransfer — CHẶN cho customer
interface LpTransfer {
  id: string;
  fromUserId: string;     // User
  toUserId: string;       // User
  amount: number;
  createdAt: Date;
  // RULES:
  // IF fromUser.accountType === "customer" → REJECT (không cho phép)
  // IF toUser.accountType === "customer" → REJECT (không nhận được)
  // Chỉ cho phép: staff → staff
}

// Client LP Usage
interface ClientPointTransaction {
  // Chỉ ghi nhận, không chuyển được
  source: "quest_completed" | "order_reward" | "referral_bonus";
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  referenceType?: "client_quest" | "order" | "referral";
  referenceId?: string;
}
```

### 2.8 Điều kiện tham gia quest của khách

| Quest | Điều kiện | Ghi chú |
|-------|-----------|---------|
| First order | Chưa có Order nào hoàn thành | Tự động gán khi đăng ký |
| Referral | Đã có ≥ 1 order hoàn thành | Gửi link giới thiệu |
| Review | Đã có ≥ 1 order `done` | Sau khi nhận handover |
| Spending milestone | Theo tier | Tự động tracking |

### 2.9 LP cho khách — Nguồn và sử dụng

**Nguồn LP khách:**

| Nguồn | LP | Trigger | VIP Points |
|-------|----|---------|-----------|
| Order hoàn thành | `order.lpReward` field | Order status → done | ✅ (tùy campaign) |
| Quest hoàn thành | `ClientQuest.lpReward` | `completeQuest()` | ✅ (`ClientQuest.vipPoints`) |
| Referral bonus | % VND referral | Referral converted | ✅ (tùy tier) |

**Sử dụng LP khách:**
- Giảm giá dịch vụ: tối đa `discountCap` theo VIP tier
- Mua khóa học (Academy)
- Đổi quà nội bộ

**KHÔNG ĐƯỢC PHÉP:**
- ❌ Chuyển LP cho người khác (khách → khách)
- ❌ Chuyển LP cho nhân viên
- ❌ Nhận LP từ nhân viên

### 2.10 Cập nhật LP System — Bảng tổng hợp

| Nguồn LP | Staff | Customer | Ghi chú |
|-----------|:-----:|:--------:|---------|
| Order done | — | ✅ | `order.lpReward` field |
| Kanban task | ✅ | — | Staff only |
| OffSystemPayment | ✅ | — | Staff only |
| Admin manual | ✅ | — | Staff only |
| Điểm danh | ✅ | ✅ | 50 LP/ngày |
| Staff Quest | ❌ | — | → Thưởng **XP**, không LP |
| Client Quest | — | ✅ | LP + VIP Points |
| Referral | ✅ (referrer) | ✅ (referrer) | |
| Academy enroll | ✅ (deduct LP) | ✅ (deduct LP) | Mua khóa học bằng LP |

### 2.11 LP Transfer — Giới hạn

```typescript
// src/lib/services/gamification/transfer.service.ts
async function transferLp(fromUserId: string, toUserId: string, amount: number) {
  const fromUser = await getUser(fromUserId);
  const toUser = await getUser(toUserId);

  // RULE: Cả 2 phải là staff
  if (fromUser.accountType === "customer" || toUser.accountType === "customer") {
    throw new ApiError(403, "customer lp cannot be transferred", "LP_TRANSFER_CUSTOMER_FORBIDDEN");
  }

  // Staff → Staff: cho phép (LP bonus/penalty giữa nhân viên)
  // Cập nhật: availableLp source/dest
  // Tạo LpTransfer record
}
```

---

## 3. Prisma Models — Staff Quest + Client VIP (v8)

### 3.1 Staff Quest Models

```prisma
// Quest theo 3 độ phủ — Staff
model StaffQuest {
  id             String   @id @default(cuid())
  key            String   @unique
  scope          String             // "company" | "department" | "personal"
  departmentId   String?            // null nếu scope = "company" hoặc "personal"
  department     Department? @relation(fields: [departmentId], references: [id])
  title          String
  description    String
  targetValue    Int
  xpReward       Int                // XP thưởng
  triggerType    String             // "manual" | "auto"
  eventKey       String?            // "order.created" | "task.done" ...
  isActive       Boolean  @default(true)
  createdAt     DateTime @default(now())

  progresses    StaffQuestProgress[]
  participants  StaffQuestParticipant[]

  @@index([scope, departmentId])
  @@index([isActive, scope])
}

// Ai đang tham gia quest (company/department)
model StaffQuestParticipant {
  id         String   @id @default(cuid())
  questId    String
  memberId   String
  quest      StaffQuest @relation(fields: [questId], references: [id])
  member     TeamMember @relation(fields: [memberId], references: [id])
  joinedAt   DateTime @default(now())

  @@unique([questId, memberId])
  @@index([memberId])
}

// Progress cá nhân — theo dõi từng member
model StaffQuestProgress {
  id           String   @id @default(cuid())
  questId      String
  memberId     String
  currentValue Int      @default(0)
  completed    Boolean  @default(false)
  completedAt  DateTime?
  xpAwarded    Boolean  @default(false)
  quest        StaffQuest @relation(fields: [questId], references: [id])
  member       TeamMember @relation(fields: [memberId], references: [id])

  @@unique([questId, memberId])
  @@index([memberId, completed])
}
```

### 3.2 Client VIP + Quest Models

```prisma
// VIP Tier của khách hàng — tự động tính
model ClientVipStatus {
  id             String   @id @default(cuid())
  odingId       String   @unique  // User.id (customer)
  user           User     @relation(fields: [odingId], references: [id])
  tier           String   @default("regular")  // "regular" | "vip1" | "vip2" | "vip3"
  totalSpending  Float    @default(0)          // tổng Order.paidAmount thực tế
  vipPoints      Int      @default(0)          // từ ClientQuest hoàn thành
  updatedAt      DateTime @updatedAt
}

// Quest dành cho khách hàng
model ClientQuest {
  id             String   @id @default(cuid())
  key            String   @unique
  title          String
  description    String
  targetValue    Int
  lpReward       Int                // LP thưởng
  vipPoints      Int                // Điểm VIP tích lũy
  type           String             // "first_order" | "referral" | "spending" | "review" | "engagement"
  triggerType    String             // "manual" | "auto"
  eventKey       String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())

  progresses     ClientQuestProgress[]

  @@index([isActive, type])
}

// Progress quest của từng khách
model ClientQuestProgress {
  id               String    @id @default(cuid())
  odingId         String    // User.id (customer)
  questId         String
  currentValue    Int       @default(0)
  completed       Boolean   @default(false)
  completedAt     DateTime?
  lpAwarded       Boolean   @default(false)
  vipPointsAwarded Boolean  @default(false)
  quest           ClientQuest @relation(fields: [questId], references: [id])

  @@unique([odingId, questId])
  @@index([odingId, completed])
}
```

### 3.3 Cập nhật User model (thêm fields)

```prisma
// User — bổ sung fields cho VIP + LP khách
model User {
  // ... existing fields
  accountType String   @default("customer")  // "staff" | "customer"

  // Customer-only
  clientVipStatus      ClientVipStatus?
  clientQuestProgress  ClientQuestProgress[]

  // LP: shared field nhưng logic khác nhau
  // Staff: chuyển được (LpTransfer)
  // Customer: KHÔNG chuyển được
}
```

### 3.4 Cập nhật TeamMember model (thêm XP)

```prisma
// TeamMember — bổ sung XP fields
model TeamMember {
  // ... existing fields

  // XP từ Staff Quest (v8)
  totalXp      Int      @default(0)    // tổng XP tích lũy
  level        Int      @default(1)    // level hiện tại (từ XP, có thể ≠ rank level)
  xpToNextLevel Int     @default(0)   // XP cần để lên level tiếp

  // Quest progress
  staffQuestProgress StaffQuestProgress[]
}
```

### 3.5 Event Tracker cho auto-trigger

```prisma
// Theo dõi sự kiện để auto-update quest progress
model QuestEventLog {
  id          String   @id @default(cuid())
  odingId    String?             // User.id — nullable (company-wide quest không cần)
  memberId    String?             // TeamMember.id — nullable
  eventKey    String              // "order.created", "task.done" ...
  metadata    Json?               // { orderId, amount, ... }
  createdAt   DateTime @default(now())

  @@index([eventKey, createdAt])
  @@index([memberId, eventKey])
}
```

---

## 4. API Routes — Staff Quest + Client VIP (v8)

### 4.1 Staff Quest API

| Route | Method | Mô tả |
|-------|--------|-------|
| `GET /api/admin/quests/staff` | GET | List all staff quests (filter: scope, department) |
| `POST /api/admin/quests/staff` | POST | Create staff quest |
| `PUT /api/admin/quests/staff/[id]` | PUT | Update quest config |
| `DELETE /api/admin/quests/staff/[id]` | DELETE | Delete quest |
| `GET /api/admin/quests/staff/[id]/progress` | GET | Xem progress của tất cả members |
| `POST /api/quests/staff/[id]/join` | POST | Member tham gia quest (company/dept) |
| `POST /api/quests/staff/[id]/complete` | POST | Member tự xác nhận hoàn thành (personal) |
| `GET /api/quests/staff/me` | GET | My quests + progress (staff) |
| `POST /api/quests/staff/event` | POST | Event webhook → auto-update progress (internal) |

### 4.2 Client Quest + VIP API

| Route | Method | Mô tả |
|-------|--------|-------|
| `GET /api/client/quests` | GET | List available quests for current user |
| `GET /api/client/quests/progress` | GET | My quest progress |
| `POST /api/client/quests/[id]/complete` | POST | Claim quest reward (LP + VIP points) |
| `GET /api/client/vip` | GET | My VIP status + tier info |
| `GET /api/client/lp` | GET | My LP balance + history |
| `POST /api/client/lp/redeem` | POST | Redeem LP for discount/service |

### 4.3 LP Transfer API — Cập nhật

```typescript
// POST /api/admin/lp-transfers
// Validate: cả 2 phải là staff
// If fromUser.accountType === "customer" → 403
// If toUser.accountType === "customer" → 403
```

---

## 5. Staff XP — Công thức Level

> Staff vẫn dùng **Rank System** (Section 4 trong core file) cho rank hiển thị (Iron→Diamond).
> XP từ quest **bổ sung** vào level, không thay thế rank LP.

### 5.1 XP → Level mapping

```typescript
// XP cost per level (tương tự LP nhưng dùng XP riêng)
const XP_PER_LEVEL = [
  0,    // Lv 1
  100,  // Lv 2
  300,  // Lv 3
  // ...
];

// totalXp → level tương ứng
function xpToLevel(totalXp: number): number {
  let level = 1;
  let cumulative = 0;
  for (const cost of XP_PER_LEVEL) {
    cumulative += cost;
    if (totalXp < cumulative) break;
    level++;
  }
  return level;
}

// Đồng bộ: khi nhận XP quest → syncRankFields (cập nhật level/rank display)
```

### 5.2 Rank vs Level — Staff

| | Rank (Section 4 trong core) | Level (v8 — XP) |
|---|---|---|
| **Nguồn tính** | `TeamMember.totalLp` | `TeamMember.totalXp` |
| **Công thức** | LP/Level = RANKS[tier].lpPerLevel | XP cost bảng riêng |
| **Hiển thị** | Iron → Diamond (biểu tượng, màu) | Staff Quest page (progress bar) |
| **Cập nhật** | `syncRankFields()` (LP thay đổi) | `syncLevelFromXp()` (XP quest) |
| **Quest reward** | Không | ✅ — Staff Quest thưởng XP → level tăng |

---

## 6. VIP Tier — Chi tiết đầy đủ (v8)

### 6.1 VIP Benefits

| Tier | Label | Discount Cap | LP→VND Rate | Priority Support | Exclusive Access |
|------|-------|-------------|-------------|-----------------|-----------------|
| `regular` | Khách hàng | 10% | 1,000 LP = 500,000 VNĐ | ❌ | ❌ |
| `vip1` | VIP 1 | 15% | 1,000 LP = 550,000 VNĐ | ✅ | ❌ |
| `vip2` | VIP 2 | 20% | 1,000 LP = 600,000 VNĐ | ✅ Priority | ✅ |
| `vip3` | VIP 3 | 25% | 1,000 LP = 750,000 VNĐ | ✅ VIP Desk | ✅ Early access |

### 6.2 VIP Promote Logic

```typescript
// Mỗi khi: Order paid / ClientQuest completed → recalculate VIP
async function recalculateClientVip(userId: string) {
  const user = await getUser(userId);
  const orders = await prisma.order.findMany({
    where: { odingId: userId, status: "done" },
    select: { paidAmount: true },
  });
  const totalSpending = orders.reduce((sum, o) => sum + (o.paidAmount ?? 0), 0);

  const vipStatus = await prisma.clientVipStatus.findUnique({
    where: { odingId: userId },
  });
  const vipPoints = vipStatus?.vipPoints ?? 0;

  // Tính tier mới
  let newTier = "regular";
  if (totalSpending >= 100_000_000 && vipPoints >= 1000) newTier = "vip3";
  else if (totalSpending >= 50_000_000 && vipPoints >= 500) newTier = "vip2";
  else if (totalSpending >= 10_000_000 && vipPoints >= 100) newTier = "vip1";

  // Chỉ promote, không demote
  const tierOrder = ["regular", "vip1", "vip2", "vip3"];
  if (tierOrder.indexOf(newTier) > tierOrder.indexOf(vipStatus?.tier ?? "regular")) {
    await prisma.clientVipStatus.upsert({
      where: { odingId: userId },
      create: { odingId: userId, tier: newTier, totalSpending, vipPoints },
      update: { tier: newTier, totalSpending, vipPoints },
    });
    // → notification "Bạn đã lên VIP X!"
  }
}
```

---

## 7. Luồng End-to-End — Staff Quest + Client VIP (v8)

### 7.1 Staff Quest Lifecycle

```
[ADMIN/CEO tạo Staff Quest]
    │
    ├── Scope: company | department | personal
    ├── Trigger: manual | auto (eventKey)
    ├── XP reward: 100–2000
    │
    ▼
[SYSTEM gán cho member phù hợp]
    │
    ├── company: tất cả staff (tự động join)
    ├── department: member thuộc phòng ban → auto join
    ├── personal: gán cho member cụ thể
    │
    ▼
[EVENT TRIGGER]
    │
    ├── auto: event webhook → POST /api/quests/staff/event → update progress
    ├── manual: member click "Hoàn thành"
    │
    ▼
[currentValue >= targetValue]
    │
    ├── Tạo StaffQuestProgress record (completed=true, completedAt=now)
    ├── StaffQuestParticipant.completedIds.push(memberId)
    ├── TeamMember.totalXp += xpReward
    ├── syncLevelFromXp(memberId) → level/rank update
    └── Notification "Bạn nhận được {xpReward} XP từ {quest.title}"
```

### 7.2 Client VIP Lifecycle

```
[KHÁCH ĐĂNG KÝ]
    │
    ├── Tự động gán ClientQuest: q-client-first-order
    ├── ClientVipStatus tạo: tier=regular, totalSpending=0, vipPoints=0
    │
    ▼
[KHÁCH HOÀN THÀNH ORDER ĐẦU TIÊN]
    │
    ├── Order status → done
    ├── q-client-first-order: currentValue=1 → completed
    ├── CustomerPoint += lpReward (VD: 2,000 LP)
    ├── ClientVipStatus.vipPoints += vipPoints (VD: 50)
    ├── recalculateClientVip() → kiểm tra tier mới
    │     └── Tier regular → vip1 (nếu tổng chi tiêu ≥ 10M sau order này)
    └── Notification "Bạn nhận {lpReward} LP + lên VIP 1!"
    │
    ▼
[KHÁCH HOÀN THÀNH QUEST TIẾP THEO]
    │
    ├── q-client-referral-1: giới thiệu bạn → converted
    ├── CustomerPoint += 5,000 LP
    ├── ClientVipStatus.vipPoints += 100
    └── recalculateClientVip()
    │
    ▼
[KHÁCH CHI TIÊU NHIỀU HƠN]
    │
    ├── Thanh toán thêm Order → paidAmount cộng dồn
    ├── recalculateClientVip() → tier tăng (regular→vip1→vip2→vip3)
    └── Notification kèm VIP benefit mới
    │
    ▼
[KHÁCH DÙNG LP GIẢM GIÁ]
    │
    ├── Wizard: chọn LP dùng (max = discountCap theo VIP tier)
    ├── LP → giảm giá VNĐ
    └── Deduct CustomerPoint (không chuyển được)
```

---

## 8. Implementation Status (v8.1 — 2026-04-10)

> ⚠️ This section documents what's **actually built** vs what the spec describes.
> Use this as the ground truth — spec is aspirational.

### 8.1 Staff Quest — What's Built

| Feature | Spec v8 | Implemented | Notes |
|---------|---------|-------------|-------|
| Quest CRUD | ✅ | ✅ | `GET/POST /api/admin/quests`, `PUT/DELETE /api/admin/quests/[id]` |
| `Quest.scope` field | ✅ | ✅ Added 2026-04-10 | FK to Department, nullable for company/personal |
| `Quest.xpReward` field | ✅ | ✅ | Stored in DB |
| Quest frequency/category | ✅ | ✅ | daily/weekly/monthly/one_time/event/seasonal |
| Daily login quest | ✅ | ✅ | `POST /api/admin/quests/daily-login` — creates LpAward(status=approved) |
| Staff Quest API routes (join/complete/event) | ✅ | ❌ NOT built | `GET /api/quests/staff/me`, `POST /api/quests/staff/[id]/join` |
| StaffQuest model (separate from Quest) | ✅ | ❌ NOT built | Using existing `Quest` + `QuestParticipant` |
| StaffQuestProgress model | ✅ | ❌ NOT built | |
| StaffQuestParticipant model | ✅ | ❌ NOT built | |
| Event auto-trigger system | ✅ | ❌ NOT built | No `QuestEventLog` table, no event webhook |
| 3-scope XP distribution (company/dept/personal) | ✅ | ❌ NOT built | QuestParticipant tracks progress but no scope-based XP logic |

### 8.2 Client VIP — What's Built

| Feature | Spec v8 | Implemented | Notes |
|---------|---------|-------------|-------|
| Customer LP from order done | ✅ | ✅ | `order.lpReward` field, credited manually |
| Customer LP from quest | ✅ | ❌ NOT built | No `ClientQuest` model, no `ClientVipStatus` model |
| VIP tiers (regular→vip3) | ✅ | ❌ NOT built | No VIP tier logic |
| VIP points | ✅ | ❌ NOT built | No `ClientQuestProgress` tracking |
| Customer LP transfer restriction | ✅ | ❌ NOT built | `LpTransfer` doesn't check accountType |
| Client Quest API routes | ✅ | ❌ NOT built | |

### 8.3 Quest Model — Actual Schema (2026-04-10)

```prisma
model Quest {
  id             String       @id @default(cuid())
  title          String
  description    String
  lpReward       Int          @map("lp_reward")
  xpReward       Int          @default(0) @map("xp_reward")
  frequency      String       // daily | weekly | monthly | one_time | event | seasonal
  category       String       // engagement | project | social | learning | achievement
  scope          String       @default("company")  // company | department | personal
  departmentId   String?      @map("department_id") // FK → Department (nullable)
  icon           String
  color          String
  target         Int          @default(1)
  forRoles       String[]     @map("for_roles")
  isActive       Boolean      @default(true) @map("is_active")
  sortOrder     Int          @default(0) @map("sort_order")

  participants   QuestParticipant[]
  // No separate StaffQuestProgress model — progress tracked via QuestParticipant
}
```

### 8.4 Daily Login — Actual Implementation (2026-04-10)

```
Flow (FIXED 2026-04-10):
  1. TOCTOU check: re-read User.lastLogin inside $transaction
  2. Streak: +1 if last login was yesterday, else reset to 1
  3. DailyReward lookup (day 1-7 cap)
  4. LpAward.create({ status: "approved", source: "daily_login" })
  5. TeamMember.currentXp↑, level↑ (LP aggregated via LpAward → syncRankFields)
  6. LpTransaction(type="award", source="daily_login")
  7. QuestParticipant upsert
```

### 8.5 P2 Roadmap for Full Staff Quest v8

| Priority | Task | Effort | Notes |
|---------|------|--------|-------|
| P2-1 | Create `StaffQuest` model (separate from `Quest`) | Medium | Need to migrate scope/Dept FK to new model |
| P2-2 | Implement `/api/quests/staff/[id]/join` | Low | Use existing QuestParticipant |
| P2-3 | Implement scope-based XP distribution logic | Medium | Company=equal split, Dept=within dept, Personal=full |
| P2-4 | Event webhook → auto-update progress | Medium | Create QuestEventLog, implement trigger handlers |
| P2-5 | Implement Client VIP models | High | Separate PR, needs PO alignment on VIP benefits |
