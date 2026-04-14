# Sales LP Reward Plan — Staff Commission on Customer Purchases

> **Version**: 1.0.0 · Date: 2026-04-14
> **Author**: PO
> **Status**: Draft — Cần review + estimate

---

## Tổng quan nghiệp vụ

Khi một **nhân sự (đặc biệt là sales)** đăng nhập hệ thống và giới thiệu / tư vấn trực tiếp cho khách hàng mua dịch vụ (web package, academy, media...), nhân sự đó sẽ được hưởng **LP commission** như một phần thưởng trực tiếp cho công việc tư vấn của mình.

> **Nguyên tắc**: Họ chỉ nhận LP **sau khi dự án được thanh toán hoàn toàn** — không phải lúc đặt hàng.

---

## 1. Mô hình LP Commission

### 1.1 Hai loại commission

| Loại | Tỷ lệ | Áp dụng cho | Ghi chú |
|------|--------|-------------|---------|
| **Direct Commission** | **10% LP** | Dịch vụ chính (web, academy, media booking) | Tính trên giá trị service gốc, làm tròn |
| **Addon Commission** | **5% LP** | Dịch vụ đi kèm (SEO nâng cao, hosting nâng cao, addon features) | Tính trên giá addon, làm tròn |

### 1.2 Ví dụ tính LP

```
Khách hàng mua Web Package:
 Template: 8,000,000 VND
 Domain: 599,000 VND
 Hosting: 480,000 VND
 SEO nâng cao (addon): 600,000 VND

→ Sales Direct (10%):
 Web: 8,000,000 × 10% = 800,000 LP
 (Domain + Hosting KHÔNG tính commission)

→ Sales Addon (5%):
 SEO: 600,000 × 5% = 30,000 LP

→ Tổng LP cho Sales: 830,000 LP
 → Chỉ credited sau khi KH thanh toán 100%
```

```
Khách hàng đăng ký khóa học Academy:
 Course: 3,000,000 VND

→ Sales Direct (10%):
 Course: 3,000,000 × 10% = 300,000 LP
```

### 1.3 Bảng tổng hợp LP nguồn cho Staff

| Nguồn LP | Staff | Trigger | Sales Commission |
|-----------|:-----:|---------|-----------------|
| Kanban task | ✅ | Task → Done | ❌ |
| OffSystemPayment | ✅ | Split approved | ❌ |
| Admin manual award | ✅ | Admin action | ❌ |
| Điểm danh | ✅ | Daily | ❌ |
| **Sales Direct Commission** | ✅ | **Order paid 100%** | ✅ **10%** |
| **Sales Addon Commission** | ✅ | **Order paid 100%** | ✅ **5%** |

---

## 2. Ai được hưởng Sales Commission?

### 2.1 Staff có quyền Sales

Mỗi Order có thể gắn `salesRepId` — ID của nhân sự tư vấn:

```
• Admin/CEO gán salesRep khi tạo Order
• Hoặc: Staff tự link referral (staff share link → customer registers → tự động gắn)
• Hoặc: Wizard có field "Mã giới thiệu" → nhân viên nhập mã
```

### 2.2 Điều kiện nhận LP

```
1. Order phải có salesRepId (không null)
2. Order status = "done" (thanh toán 100%)
3. Staff có role hợp lệ: sales, admin, pm, media (hoặc bất kỳ role nào được assign)
```

---

## 3. Khi nào LP được credited?

### 3.1 Rule: Chỉ sau khi paid 100%

```
pending_payment
 ↓ (thanh toán 50%)
paid / in_progress
 ↓ (thanh toán 50% còn lại)
→ salesRep credited LP khi Order status = "done"
```

**Tại sao?**
- Đảm bảo dự án thực sự hoàn tất mới tính thưởng
- Tránh trường hợp khách hàng hủy giữa chừng
- Đảm bảo doanh thu thực tế cho LOOP trước khi trả commission

### 3.2 Trường hợp thanh toán 1 lần (full payment)

```
pending_payment
 ↓ (thanh toán 100%)
paid / in_progress
 ↓ (dự án hoàn tất)
done → salesRep credited LP
```

---

## 4. Đối tượng nhận Commission

### 4.1 Staff Types được nhận

Tất cả staff có thể được gán làm `salesRepId`:
- `sales` — Sales nhận commission là chính
- `admin` / `super_admin` / `ceo` — Admin nhận khi gán thủ công
- `project_manager` — PM nhận khi PM tư vấn trực tiếp
- `media` — Media nhận khi tư vấn media booking
- `member` — Member thường nhận nếu có referral link

### 4.2 Không áp dụng

- `client` (khách hàng) — không nhận staff commission
- Order không có `salesRepId` — không ai nhận
- Order chưa `done` — chưa credited

---

## 5. Dịch vụ nào được tính Commission?

### 5.1 Direct Commission (10%)

| Dịch vụ | Cơ sở tính | Ví dụ |
|---------|-----------|--------|
| Web Package (Template) | `order.totalAmount` hoặc `order.budget` | 8M → 800,000 LP |
| Custom Design Web | `order.totalAmount` | 30M → 3,000,000 LP |
| Academy Course | `enrollment.paymentAmount` | 3M → 300,000 LP |
| Media Booking | `order.totalAmount` | 5M → 500,000 LP |

### 5.2 Addon Commission (5%)

| Addon | Cơ sở tính | Ví dụ |
|-------|-----------|--------|
| SEO nâng cao (30 bài/1 tháng) | addon price | 600K → 30,000 LP |
| Hosting nâng cao (+125K/tháng) | addon price | 125K → 6,250 LP |
| Custom feature | addon price | 2M → 100,000 LP |
| SSL nâng cao | addon price | 500K → 25,000 LP |
| Domain premium | addon price | 1M → 50,000 LP |

---

## 6. Data Model Changes

### 6.1 Order — thêm `salesRepId`

```prisma
model Order {
 // ... existing fields
 salesRepId String?  @map("sales_rep_id") // TeamMember.id — nhân viên tư vấn
 salesRep TeamMember? @relation(fields: [salesRepId], references: [id])

 // LP commission tracking
 salesDirectCommission Int @default(0) @map("sales_direct_commission") // LP earned from main service
 salesAddonCommission Int @default(0) @map("sales_addon_commission") // LP earned from addons
 commissionPaid Boolean @default(false) @map("commission_paid") // đã credited chưa
 commissionPaidAt  DateTime? @map("commission_paid_at") // thời điểm credited

 @@index([salesRepId])
 @@index([commissionPaid])
}
```

### 6.2 Enrollment (Academy) — thêm `salesRepId`

```prisma
model Enrollment {
 // ... existing fields
 salesRepId String? @map("sales_rep_id")
 salesRep TeamMember? @relation(fields: [salesRepId], references: [id])
 commissionPaid Boolean @default(false)
 commissionPaidAt DateTime? @map("commission_paid_at")
}
```

### 6.3 MediaBooking — thêm `salesRepId` (nếu có model riêng)

```prisma
model MediaBooking {
 // ... existing fields
  salesRepId String?
 salesRep TeamMember? @relation(fields: [salesRepId], references: [id])
 commissionPaid Boolean @default(false)
 commissionPaidAt DateTime?
}
```

### 6.4 TeamMember — có thể cần thêm field

```prisma
model TeamMember {
 // ... existing fields
 totalSalesCommission Int @default(0) @map("total_sales_commission") // tổng LP từ sales
 pendingCommission Int @default(0) @map("pending_commission") // chờ credited
 completedCommission Int @default(0) @map("completed_commission")  // đã credited
}
```

### 6.5 CommissionEvent Model (audit trail)

```prisma
// Ghi nhận từng lần LP commission được credited
model SalesCommissionEvent {
 id String @id @default(cuid())
 salesRepId String @map("sales_rep_id")
 referenceType String // "order" | "enrollment" | "media_booking"
 referenceId String @map("reference_id") // Order.id / Enrollment.id / ...
 directLp Int @default(0) // LP từ dịch vụ chính
 addonLp Int @default(0) // LP từ addon
 totalLp Int
 paidAt DateTime @default(now()) @map("paid_at")

 salesRep TeamMember @relation(fields: [salesRepId], references: [id])

 @@index([salesRepId])
  @@index([referenceType, referenceId])
}
```

---

## 7. Commission Calculation Logic

### 7.1 Khi Order chuyển sang `done`

```typescript
// src/lib/services/commerce/commission.service.ts

interface CommissionInput {
 salesRepId: string | null;
 orderId: string;
 orderType: "web_package" | "custom_design" | "academy" | "media";
 totalAmount: number; // VND — giá trị dịch vụ chính
 addonAmount: number; // VND — giá trị addon (nếu có)
}

async function calculateSalesCommission(input: CommissionInput): Promise<{
 directLp: number;
 addonLp: number;
 totalLp: number;
}> {
 const directLp = Math.round((input.totalAmount * 10) / 100_000);
 const addonLp = Math.round((input.addonAmount * 5) / 100_000);
 return { directLp, addonLp, totalLp: directLp + addonLp };
}

async function creditCommission(input: CommissionInput): Promise<void> {
 if (!input.salesRepId) return;
 if (input.totalAmount === 0 && input.addonAmount === 0) return;

 // Check: chỉ credit nếu chưa từng credited
 const existing = await prisma.salesCommissionEvent.findFirst({
 where: { referenceType: "order", referenceId: input.orderId },
 });
 if (existing) return;

 const { directLp, addonLp, totalLp } = await calculateSalesCommission(input);
 if (totalLp === 0) return;

 await prisma.$transaction([
 // 1. Update Order fields
 prisma.order.update({
 where: { id: input.orderId },
 data: {
 salesDirectCommission: directLp,
 salesAddonCommission: addonLp,
 commissionPaid: true,
 commissionPaidAt: new Date(),
 },
 }),

 // 2. Credit LP to sales rep
 prisma.teamMember.update({
 where: { id: input.salesRepId },
 data: {
 availableLp: { increment: totalLp },
 totalLp: { increment: totalLp },
 completedCommission: { increment: totalLp },
 },
 }),

 // 3. Record transaction
 prisma.lpTransaction.create({
 data: {
 memberId: input.salesRepId,
 type: "award",
 source: "sales_commission",
 referenceType: "order",
 referenceId: input.orderId,
 amount: totalLp,
 balanceAfter: /* query */ 0,
 },
 }),

 // 4. Audit trail
 prisma.salesCommissionEvent.create({
 data: {
 salesRepId: input.salesRepId,
 referenceType: "order",
 referenceId: input.orderId,
 directLp,
 addonLp,
 totalLp,
 paidAt: new Date(),
 },
 }),

 // 5. Sync rank fields
 syncRankFields(input.salesRepId),
 ]);
}
```

### 7.2 Khi Academy Enrollment hoàn thành

```typescript
async function creditAcademyCommission(enrollmentId: string, salesRepId: string | null) {
 if (!salesRepId) return;

 const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
 if (!enrollment || enrollment.commissionPaid) return;

 const payment = await prisma.eduPayment.findFirst({
 where: { enrollmentId, status: "completed" },
 orderBy: { createdAt: "desc" },
 });
 if (!payment) return;

 const directLp = Math.round((payment.amount * 10) / 100_000);

 await prisma.$transaction([
 prisma.enrollment.update({
 where: { id: enrollmentId },
 data: { commissionPaid: true, commissionPaidAt: new Date() },
 }),
 prisma.teamMember.update({
 where: { id: salesRepId },
 data: { availableLp: { increment: directLp }, totalLp: { increment: directLp } },
 }),
 prisma.lpTransaction.create({
 data: {
 memberId: salesRepId,
 type: "award",
 source: "sales_commission",
 referenceType: "enrollment",
 referenceId: enrollmentId,
 amount: directLp,
 balanceAfter: 0,
 },
 }),
 prisma.salesCommissionEvent.create({
 data: { salesRepId, referenceType: "enrollment", referenceId: enrollmentId, directLp, addonLp: 0, totalLp: directLp },
 }),
 syncRankFields(salesRepId),
 ]);
}
```

---

## 8. Trigger Points

Commission được tính tại các trigger point sau:

```
Order status → "done"
 │
 ▼ creditCommission() → cred LP for salesRep

Enrollment status → "completed"
 │
 ▼ creditAcademyCommission() → cred LP for salesRep

MediaBooking status → "completed"
 │
 ▼ creditMediaCommission() → cred LP for salesRep
```

**Cần hook vào:**
- `Order.transition("done")` — trigger commission
- Academy enrollment completion trigger
- Media booking completion trigger

---

## 9. Frontend UI

### 9.1 Admin — Gán Sales Rep

Trong Order form / Order detail:

```
Sales Representative:
┌─────────────────────────────────────────────┐
│ [Dropdown: Select staff member ▼] │
│ Hoặc: Nhập mã giới thiệu [___________] │
└─────────────────────────────────────────────┘
```

### 9.2 Staff Portal — Xem Commission của mình

Trong tab "Hoa hồng" hoặc tab LP:

```
┌─────────────────────────────────────────────────┐
│ Hoa hồng Sales │
│ │
│ Đã nhận: 2,500,000 LP │
│ Chờ credited: 300,000 LP ← (Order đang làm)│
│ │
│ Lịch sử: │
│ • Web Package Nhà hàng | +800,000 LP | ✓ 2026-04-10 │
│ • Khóa React Pro | +300,000 LP | ✓ 2026-04-12 │
│ • Media Booking ABC | +500,000 LP | ⏳ Pending │
└─────────────────────────────────────────────────┘
```

### 9.3 Admin — Sales Leaderboard

Trong Leaderboard tab:

```
┌────────────────────────────────────────────────────┐
│ Sales Leaderboard (Commission) │
│ │
│ 1. @NguyenVanA │ 4,200,000 LP │ 12 deals │ ★ │
│ 2. @TranThiB │ 3,100,000 LP │ 8 deals │ │
│ 3. @LeVanC │ 1,800,000 LP │ 5 deals │ │
└────────────────────────────────────────────────────┘
```

---

## 10. Notification cho Sales

Khi LP được credited:

```
🔔 Bạn nhận được 830,000 LP từ hoa hồng sales
 Dự án: Website Nhà hàng — Khách hàng ABC
 (Direct: 800K + Addon: 30K)

 [Xem chi tiết]
```

---

## 11. Edge Cases

### 11.1 Khách hàng chưa thanh toán đủ
- Commission **chưa credited** cho đến khi Order = done
- Có thể hiển thị "pending commission" trong UI

### 11.2 Sales Rep rời công ty trước khi Order done
- Commission vẫn được credited bình thường nếu Order done sau đó
- Nếu cần revoke: Admin có thể set `salesRepId = null` trước khi done

### 11.3 Order bị hủy sau khi đã credited
- Admin có quyền "Thu hồi commission" → trừ LP
- Tạo `SalesCommissionReversal` record

### 11.4 Nhiều sales cùng 1 deal
- Hiện tại: 1 Order = 1 salesRepId
- Tương lai (P2): 1 Order = nhiều salesRep với % phân chia

---

## 12. Migration Plan

| Priority | Task | Effort | Notes |
|---------|------|--------|-------|
| **P1** | ✅ Schema: Order + Enrollment + SalesCommissionEvent | Low | Đã có trong bảng |
| **P1** | ✅ commission.service.ts — calculation + credit logic | Medium | Core logic tính toán đã xong |
| **P1** | ✅ Hook vào Order transition → done | Low | Đã hook tại order-lifecycle.ts |
| **P1** | ✅ Admin UI: gán salesRepId trong Order form | Medium | Giao diện order đã có nút assign |
| **P1** | ⏳ Staff portal: xem pending + completed commission | Medium | Chưa có UI. LƯU Ý CHO AGENT SAU: cần fix `/api/staff/commission/route.ts` vì đang query `createdAt` ở bảng `SalesCommissionEvent` không tồn tại, logic tính pending cần lấy từ bảng `Order`. |
| **P2** | ⏳ Hook Academy enrollment completion | Low | creditAcademyCommission |
| **P2** | ⏳ Referral link system (mã giới thiệu) | Medium | Tự động gắn salesRepId |
| **P2** | ⏳ Sales Leaderboard | Low | Dùng SalesCommissionEvent |

---

## 13. Non-Functional Requirements

- **Idempotency**: Nếu Order chuyển done → credited → rồi PM revert lại `done` → không credited lại lần 2 (check `commissionPaid` flag)
- **Audit**: Tất cả commission được ghi vào `SalesCommissionEvent`
- **Performance**: LP credit nên là async (queue/job) không block request chính
- **Security**: Chỉ admin/ceo mới có quyền gán `salesRepId` sau khi Order đã created
