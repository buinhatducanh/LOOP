# PHÂN TÍCH FLOW THANH TOÁN — LOOP Solutions

> **Version**: 1.1.0 · Date: 2026-04-16
> **Author**: PO + Dev Team
> **Status**: P1 IMPLEMENTED ✅ — VietQR service + Invoice auto-generate + Email notifications done

## PO Decisions (2026-04-16)

| Câu hỏi | Quyết định |
|---------|-----------|
| VietQR Plan | **Free** — VietQR tạo QR động, admin confirm thủ công |
| Email Provider | **Resend** (đã có sẵn trong hệ thống tại `src/lib/email/sender.ts`) |
| VAT Invoice | **Manual** — Admin xuất từ phần mềm thuế riêng, gửi PDF qua email |
| Implement Order | **P1 trước** — VietQR + Invoice auto-gen + Email notifications |

## P1 Implementation Done (2026-04-16)

| Task | File | Status |
|------|------|--------|
| VietQR service | `src/lib/services/payment/vietqr.service.ts` | ✅ |
| VietQR API | `src/app/api/payment/vietqr/route.ts` | ✅ |
| Payment methods API | `src/app/api/payment/methods/route.ts` | ✅ |
| Invoice auto-gen | `src/lib/services/commerce/invoice.service.ts` | ✅ |
| Invoice in payments route | `src/app/api/admin/orders/[id]/payments/route.ts` | ✅ |
| Payment email template | `src/lib/email/sender.ts` | ✅ |

---

## MỤC LỤC

1. [Tổng quan hệ thống hiện tại](#1-tổng-quan-hệ-thống-hiện-tại)
2. [Proposed Payment Flow với VietQR](#2-proposed-payment-flow-với-vietqr)
3. [Chi tiết từng bước (End-to-End)](#3-chi-tiết-từng-bước-end-to-end)
4. [Thông báo (Notifications)](#4-thông-báo-notifications)
5. [Hóa đơn điện tử (VAT Invoice)](#5-hóa-đơn-điện-tử-vat-invoice)
6. [Admin quản trị thanh toán](#6-admin-quản-trị-thanh-toán)
7. [Kết nối VietQR API](#7-kết-nối-vietqr-api)
8. [Invoice auto-generation trigger](#8-invoice-auto-generation-trigger)
9. [So sánh: Hiện tại vs Đề xuất](#9-so-sánh-hiện-tại-vs-đề-xuất)
10. [Phụ lục: Các file liên quan](#10-phụ-lục-các-file-liên-quan)

---

## 1. Tổng quan hệ thống hiện tại

### 1.1 Cái đã có (AS-IS)

```
✅ Order lifecycle 12 bước (draft → completed)
✅ Booking Wizard 8 bước (đặt dịch vụ)
✅ Payment recording (admin ghi nhận thanh toán thủ công)
✅ LP reward cho khách khi order done
✅ Off-System Payment + LP split
✅ Notification hệ thống (AdminNotification) — KHÔNG CÓ email/SMS
✅ Invoice model + CRUD API (admin + client)
✅ Payment method labels: bank_transfer, cash, vnpay, momo, other
✅ QR tĩnh trong SiteSetting: payment_bank_qr, payment_momo_qr
```

### 1.2 Cái CHƯA có (GAPs)

```
❌ VietQR API integration (tạo QR động với amount + order number)
❌ Webhook từ ngân hàng (tự động confirm transfer)
❌ Auto-confirm payment (admin không phải kiểm tra banking app)
❌ Notification cho khách (email/SMS khi: order confirmed, payment received, invoice sent)
❌ Auto-generate Invoice khi payment recorded
❌ PDF receipt cho khách
❌ VietQR payment page cho khách tự chọn và thanh toán
❌ Payment confirmation email (khách nhận biết đã thanh toán thành công)
❌ VAT invoice request flow (khách yêu cầu xuất hóa đơn)
❌ VAT invoice email delivery
```

### 1.3 Hai loại đơn hàng hiện tại

| Loại | Wizard | Tạo order qua | Payment flow |
|------|--------|---------------|-------------|
| **Custom Order** | `BookingWizardClient.tsx` (8 bước) | `QuoteRequest` → Quote → Order | Manual bank transfer + admin record |
| **Web Package** | `WebPurchaseWizard.tsx` (Template) | `web-purchase/route.ts` | Manual bank transfer + admin record |

---

## 2. Proposed Payment Flow với VietQR

### 2.1 Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CUSTOMER SIDE │
│ │
│ Khách đặt dịch vụ (Wizard 8 bước) │
│ │ │
│ ▼ │
│ [Xác nhận thông tin] → Tạo Order (status: pending_payment) │
│ │ │
│ ▼ │
│ ┌─────────────────┐ │
│ │ CHỌN THANH TOÁN│ │
│ │ ├─ VietQR │ ◄── VietQR API tạo QR động với: │
│ │ │ (Recommended)│ amount, order_number, content  │
│ │ ├─ Chuyển khoản│ │
│ │ │ thủ công │ │
│ │ └─ Thanh toán │ │
│ │ sau (COD) │ │
│ └─────────────────┘ │
│  │ │
│ │ (Khách quét VietQR bằng app ngân hàng)  │
│ ▼ │
│ [Chờ xác nhận] ◄── VietQR webhook / Admin confirm │
│ │ │
│ │ (Webhook NH gọi /api/webhooks/vietqr hoặc admin tự xác nhận) │
│ ▼ │
│ ✅ Thanh toán thành công │
│ │ │
│ ▼ │
│ ┌─ Invoice auto-generated (draft) │
│ │  │ │
│ │ ├─ Khách yêu cầu VAT → Admin xuất → Gửi email │
│ │ └─ Không yêu cầu VAT → Để draft / Gửi receipt PDF │
│ └─ Notification admin + khách │
│ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN SIDE │
│ │
│ Admin Dashboard → Orders Tab  │
│ │ │
│ ├── Xem danh sách đơn hàng (payment status: unpaid/partial/full) │
│ ├── Payment Modal: ghi nhận thanh toán thủ công │
│ ├── Payment History: xem log từng khoản thanh toán │
│ ├── Invoices Tab: CRUD hóa đơn + gửi email VAT │
│ └── VietQR Logs: webhook log / manual confirm override │
│ │
│ VietQR Integration Admin │
│ │ │
│ ├── Cấu hình: VietQR API key, bank account, callback URL │
│ ├── Xem transfer log (từ webhook hoặc manual check) │
│ └── Auto-match: order_number trong transfer content │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Luồng nhanh (Quick Flow)

```
1. Khách đặt hàng → Order pending_payment
2. Khách chọn VietQR → hệ thống gọi VietQR API → tạo QR động
3. Khách quét QR bằng app ngân hàng → chuyển tiền
4. (A) VietQR webhook gọi /api/webhooks/vietqr → auto-confirm
 (B) Admin xác nhận thủ công nếu webhook chưa có
5. Payment recorded → Invoice auto-generated (draft)
6. Nếu khách yêu cầu VAT → Admin xuất hóa đơn → gửi email
7. Notification: admin nhận + khách nhận email confirmation
```

---

## 3. Chi tiết từng bước (End-to-End)

### Bước 1: Khách đặt hàng → Tạo Order

**Trigger:** Khách submit Wizard 8 bước

**API:** `POST /api/portal/orders` (hoặc `POST /api/portal/web-purchase`)

**Logic hiện tại:** `src/app/api/portal/web-purchase/route.ts:50-233`
- Tạo `Order` với `status: "pending_payment"`, `paymentStatus: "unpaid"`
- Tạo `AdminNotification(type: "web_purchase_pending")`
- **CẦN THÊM:** Gán `paymentCode` (mã thanh toán duy nhất: `LOOP-{ORDER_NUMBER}-{TIMESTAMP}`)

**Output:**
```typescript
{
 orderId: string,
 orderNumber: string, // VD: "ORD-xxxx"
 paymentCode: string, // VD: "LOOP-ORD-xxxx-17000000" — dùng trong VietQR content
 totalAmount: number, // VNĐ
 paymentStatus: "unpaid",
 paymentUrl?: string, // URL thanh toán VietQR (nếu chọn VietQR)
 qrDataUrl?: string,  // Base64 QR image (nếu chọn VietQR)
}
```

### Bước 2: Khách chọn VietQR → Tạo QR động

**Trigger:** Khách chọn payment method = "vietqr" ở bước thanh toán

**UI:** Thêm bước thanh toán trong Wizard hoặc redirect đến `PaymentPage` riêng

**API mới:** `POST /api/payment/vietqr/create`

```typescript
// Request
{
 orderId: string,
 amount: number, // VNĐ (số nguyên, không có .00)
 orderNumber: string, // "ORD-xxxx"
}

// Response
{
 qrData: string, // Base64 QR image
 paymentCode: string, // Mã chuyển khoản để NH match
 expiresAt: string, // Thời hạn QR (thường 15 phút)
 amount: number,
 bankAccount: string, // Số tài khoản LOOP
 bankName: string, // Tên ngân hàng
 beneficiaryName: string,// Tên chủ tài khoản
}
```

**VietQR API integration:**
- Dùng VietQR SDK hoặc gọi trực tiếp VietQR API v2
- VietQR hỗ trợ: tạo QR động với amount, tạo transfer với bank account
- Docs: https://vietqr.io/document/api

**Lưu ý quan trọng:**
- `orderNumber` hoặc `paymentCode` phải nằm trong **Nội dung chuyển khoản (transfer description)**
- VietQR cho phép gửi kèm `add_data` với custom content
- LOOP nên dùng: **LOOP-ORD-{NUMBER}** làm nội dung chuyển khoản → dùng regex match webhook

### Bước 3: Khách thanh toán bằng app ngân hàng

**Hành động:** Khách mở app ngân hàng → Quét QR → Nhập amount (nếu QR động) → Xác nhận chuyển tiền

**Nội dung chuyển khoản:** `LOOP-ORD-{NUMBER}` — dùng để match với order

**Thời gian:** Tức thời (real-time với VietQR)

### Bước 4: Xác nhận thanh toán (Hai phương án)

#### Phương án A: VietQR Webhook (Recommended — khi có tài khoản VietQR Business)

```
VietQR API gọi: POST /api/webhooks/vietqr
Body: {
 transactionId: string,
 amount: number,
 content: string, // "LOOP-ORD-xxxx"
 fromBank: string,
 fromAccount: string,
 toAccount: string,
 timestamp: string,
 signature: string // HMAC-SHA256 để verify
}
```

**Logic:**
1. Verify signature (HMAC-SHA256 với secret key)
2. Extract `orderNumber` từ `content` (regex: `/LOOP-ORD-(.+)/`)
3. Lookup `Order` by `orderNumber`
4. Verify amount match (amount >= order.totalAmount - order.paidAmount)
5. Call `recordPayment()` atomically
6. Create Invoice (draft)
7. Send notification → admin + customer email

**API mới:** `POST /api/webhooks/vietqr/route.ts`

#### Phương án B: Admin xác nhận thủ công (Interim — khi chưa có VietQR webhook)

```
Admin nhận notification từ banking app
 → /admin/orders → Order detail → "Xác nhận thanh toán"
 → Nhập: số tiền, số tài khoản nguồn, nội dung (optional)
 → Submit
 → recordPayment() → Invoice auto-generated → notification
```

**Lưu ý:** Phương án B vẫn CẦN THIẾT làm fallback khi:
- VietQR webhook fails
- Khách chọn "Chuyển khoản thủ công" (không dùng VietQR)
- Khách chọn "Thanh toán sau (COD)"

### Bước 5: Payment Recorded → Invoice Auto-Generated

**Trigger:** `recordPayment()` thành công

**Logic mới trong `recordPayment()`:**

```typescript
// Trong /api/admin/orders/[id]/payments/route.ts
// Sau khi Payment record được tạo thành công:

// Auto-generate Invoice
const invoice = await prisma.invoice.create({
 data: {
 invoiceNumber: generateInvoiceNumber(), // "INV-YYYYMM-XXXX"
 orderId: orderId,
 customerId: order.odingId,
 type: "income",
 amount: paymentAmount,  // base amount (chưa VAT)
 taxAmount: Math.round(paymentAmount * 0.1), // 10% VAT
 totalAmount: paymentAmount + taxAmount,
 status: "draft", // CHỜ admin duyệt trước khi gửi
 paidMethod: paymentMethod, // bank_transfer / vietqr / cash / vnpay / momo
 description: `Thanh toán đơn hàng #${orderNumber}`,
 paidAt: new Date(),
 createdBy: session.userId,
 }
});

// Tạo InvoiceLineItem
await prisma.invoiceLineItem.createMany({
 data: orderRevenueLines.map(line => ({
 invoiceId: invoice.id,
 description: line.description,
 quantity: 1,
 unitPrice: line.subtotal, // đã trừ VAT trong orderRevenueLines
 taxRate: 0.10, // 10%
 taxAmount: line.taxAmount,
 totalAmount: line.totalAmount,
 }))
});
```

**Invoice number format:** `INV-YYYYMM-XXXX`
- `YYYYMM`: năm-tháng hiện tại
- `XXXX`: số thứ tự tăng dần trong tháng (reset mỗi tháng)

### Bước 6: VAT Invoice Flow (Manual — PO quyết định)

**PO requirement:** Phần hóa đơn VAT giữ **MANUAL** để đảm bảo chất lượng.

```
Khách đặt hàng
 │
 ├── Có yêu cầu xuất VAT? ──YES──→ Khách nhập thông tin xuất hóa đơn:
 │ • Tên công ty
 │  • Mã số thuế
 │ • Địa chỉ
 │ • Email nhận hóa đơn
 │ (Lưu vào Order hoặc Customer field)
 │ ↓
 │  Admin nhận notification
 │ ↓
 │ Admin xem Invoice (đã auto-generated)
 │ ↓
 │ Admin điều chỉnh nếu cần:
 │ • Thông tin người mua (từ khách)
 │ • Duyệt invoice (draft → sent)
 │ ↓
 │ Admin bấm "Gửi hóa đơn"
 │ ↓
 │ Hệ thống gửi email cho khách
 │ (Invoice PDF đính kèm)
 │ ↓
 │ Invoice status: sent
 │
 └── NO ──→ Invoice để draft / gửi receipt đơn giản qua email
```

**Form thông tin VAT cho khách (thêm vào Wizard hoặc Customer Dashboard):**

```typescript
interface VatInfo {
 requestVat: boolean;
 companyName?: string; // Tên công ty
 taxCode?: string; // Mã số thuế
 companyAddress?: string; // Địa chỉ công ty
 recipientEmail?: string; // Email nhận hóa đơn
 recipientName?: string; // Người nhận
 recipientPhone?: string; // SĐT
}
```

**Cần thêm fields vào model:**

```prisma
// Option A: Thêm vào Order model
model Order {
 // ... existing fields
 vatRequest Json?  // VatInfo — null = không yêu cầu VAT
 invoiceId String? // FK → Invoice (sau khi auto-generated)
}

// Option B: Tạo model riêng
model VatInvoiceRequest {
 id String @id @default(cuid())
 orderId String @unique
 order Order @relation(fields: [orderId], references: [id])
 companyName String
 taxCode String
 address String
 email String
 phone String?
 status String @default("pending") // pending | invoiced | sent
 notes String?
 createdAt DateTime @default(now())
}
```

**PO recommendation:** Dùng **Option A** (JSON field trong Order) — đơn giản, không cần migration phức tạp.

---

## 4. Thông báo (Notifications)

### 4.1 Admin Notifications (ĐÃ CÓ — cần bổ sung thêm)

**File hiện tại:** `src/app/api/admin/orders/[id]/payments/route.ts:66-77`

**Cần bổ sung thêm notification types:**

```typescript
// Trong recordPayment() — sau khi payment recorded:

// 1. VietQR webhook confirmed (NEW)
if (paymentMethod === "vietqr") {
 await prisma.adminNotification.create({
 data: {
  type: "payment_vietqr_confirmed",
 title: "✅ VietQR xác nhận — {amount} VNĐ",
 message: `Đơn #{orderNumber} vừa nhận thanh toán qua VietQR. Tự động xác nhận bởi webhook.`,
 priority: amount >= totalExpected * 0.5 || amount >= 10_000_000 ? "urgent" : "high",
 }
 });
}

// 2. Invoice auto-generated (NEW)
await prisma.adminNotification.create({
 data: {
 type: "invoice_auto_generated",
 title: "📄 Invoice tạo tự động — #{invoiceNumber}",
 message: `Invoice #{invoiceNumber} cho đơn #{orderNumber} đã được tạo (trạng thái: draft). Vui lòng duyệt và gửi cho khách.`,
 priority: "normal",
 }
});

// 3. VAT requested (NEW — nếu khách yêu cầu VAT)
if (vatInfo?.requestVat) {
 await prisma.adminNotification.create({
 data: {
 type: "vat_invoice_requested",
 title: "🧾 Yêu cầu xuất hóa đơn VAT",
 message: `Khách yêu cầu xuất hóa đơn cho đơn #{orderNumber}. MST: ${vatInfo.taxCode}`,
 priority: "high",
 }
 });
}

// 4. Invoice sent (NEW)
await prisma.adminNotification.create({
 data: {
 type: "invoice_sent",
 title: "📧 Hóa đơn đã gửi — #{invoiceNumber}",
 message: `Hóa đơn #{invoiceNumber} đã được gửi email cho khách.`,
 priority: "normal",
 }
});
```

### 4.2 Customer Notifications (CHƯA CÓ — CẦN BUILD)

**PO requirement:** Gửi email/SMS notification cho khách.

**Các notification types cần gửi cho khách:**

| Trigger | Channel | Nội dung |
|---------|---------|---------|
| Order tạo (pending_payment) | Email | "Đơn hàng #{orderNumber} đã được tiếp nhận. Chờ thanh toán." |
| Payment confirmed | Email | "✅ Thanh toán #{amount} VNĐ cho đơn #{orderNumber} đã được ghi nhận." + receipt |
| Invoice draft | Email (optional) | "📄 Invoice #{invoiceNumber} đã được tạo." |
| Invoice sent (VAT) | Email | "🧾 Hóa đơn VAT cho đơn #{orderNumber}" + PDF attachment |
| Order status changed | Email | "📦 Đơn hàng #{orderNumber} đã chuyển sang trạng thái: {status}" |
| Demo ready | Email | "🎨 Demo cho đơn #{orderNumber} đã sẵn sàng. Xem ngay." |

**Implementation approach:**

```typescript
// src/lib/services/notification/email.service.ts

interface EmailPayload {
 to: string;
 subject: string;
 template: "payment_confirmed" | "invoice_sent" | "order_created" | "order_status_changed";
 data: Record<string, any>;
 attachments?: { filename: string; url: string }[]; // PDF invoice
}

// Service functions
async function sendPaymentConfirmationEmail(orderId: string, paymentAmount: number) { ... }
async function sendInvoiceEmail(invoiceId: string) { ... }
async function sendOrderStatusEmail(orderId: string, newStatus: string) { ... }

// Gọi trong recordPayment() sau khi payment thành công
// Gọi trong invoice route khi admin gửi invoice
```

**Email provider options:**

| Provider | Pros | Cons |
|---------|------|------|
| Resend | API đơn giản, có React Email, free 100 emails/day | Cần API key |
| SendGrid | Mạnh, enterprise | Phức tạp hơn |
| Nodemailer + SMTP | Miễn phí (dùng Gmail/company SMTP) | Giới hạn gửi |
| Loops | Transactional email API | Cần account |

**Recommendation:** Dùng **Resend** hoặc **Loops** (đơn giản, có React Email templates, integration nhanh).

---

## 5. Hóa đơn điện tử (VAT Invoice)

### 5.1 Phương pháp: MANUAL cho VAT (PO Decision)

> **PO requirement:** Phần xuất hóa đơn VAT giữ **MANUAL** thay vì kết nối API với cơ quan thuế.

**Lý do:**
- Hóa đơn điện tử Việt Nam (VAT) yêu cầu chữ ký số, kết nối với cơ quan thuế (eTax)
- Phức tạp về mặt pháp lý và kỹ thuật
- Giai đoạn này: Admin tạo invoice trên phần mềm hóa đơn riêng (hoặc Excel) → gửi PDF qua email
- LOOP web chỉ quản lý: thông tin khách hàng, theo dõi invoice đã gửi, lưu trữ

### 5.2 VAT Invoice Flow (Chi tiết)

```
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC A: Khách yêu cầu VAT khi đặt hàng │
│ │
│ Wizard bước thanh toán: │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Yêu cầu xuất hóa đơn VAT │ │
│ │ │ │
│ │ Tên công ty: [________________]  │ │
│ │ Mã số thuế: [________________] │ │
│ │ Địa chỉ công ty: [________________] │ │
│ │ Email nhận hóa đơn: [________________] │ │
│ │ Người mua: [________________] │ │
│ │ SĐT: [________________]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ → Lưu vào Order.vatRequest (JSON) │
│  → Admin nhận notification "Yêu cầu xuất hóa đơn VAT" │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC B: Admin xử lý hóa đơn │
│ │
│ Admin → Invoices Tab │
│ │ │
│ ├── Xem Invoice đã auto-generated (draft) │
│ │ │
│ ├── Edit invoice: │
│ │ • Điền thông tin người mua (từ Order.vatRequest) │
│ │ • Số hóa đơn: INV-YYYYMM-XXXX │
│ │ • Số seridata: (nếu dùng phần mềm hóa đơn) │
│ │ • Ký hiệu: (nếu dùng phần mềm hóa đơn) │
│ │ │
│ │ │
│ ├── Tải lên file hóa đơn PDF (đã xuất từ phần mềm) │
│ │ HOẶC │
│ │  Gửi email với nội dung HTML invoice │
│ │ │
│ └── Status: draft → sent │
│ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Invoice Status Flow

```
draft → sent → paid (hoặc cancelled/overdue)
```

| Status | Ý nghĩa | Ai thao tác |
|--------|---------|------------|
| `draft` | Invoice tạo tự động, chờ admin duyệt | System (auto) |
| `sent` | Admin đã gửi cho khách | Admin bấm "Gửi" |
| `paid` | Khách đã thanh toán (đối với invoice tự xuất) | Admin (nếu cần) |
| `cancelled` | Hủy invoice | Admin |
| `overdue` | Quá hạn thanh toán | System (cron job) |

### 5.4 Invoice Model Update

```typescript
// Thêm vào Invoice model trong schema.prisma

// Thêm fields cho VAT invoice
vatCompanyName String?  // Tên công ty (người mua)
vatTaxCode String? // Mã số thuế
vatAddress String? // Địa chỉ công ty
vatRecipientName String? // Người mua hàng
vatRecipientEmail String?  // Email nhận hóa đơn
vatSerialNumber String? // Số serial hóa đơn (từ phần mềm thuế)
vatSignature String? // Ký hiệu hóa đơn
vatFileUrl String? // URL file PDF đã upload (nếu có)
vatSentAt DateTime? // Thời điểm gửi
vatSentBy String? // Admin ID đã gửi
```

### 5.5 Invoice Email Template

Khi admin gửi hóa đơn (khách yêu cầu VAT):

```
Subject: 🧾 HÓA ĐƠN GTGT - LOOP Solutions #{invoiceNumber}

---

[LOOP SOLUTIONS]
[Địa chỉ LOOP]
[Email: hello@loops.vn]
[SĐT: xxx]

==========================================
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
Số: {invoiceNumber}
Ngày: {date}
==========================================

NGƯỜI MUA:
 Tên công ty: {vatCompanyName}
 Mã số thuế: {vatTaxCode}
 Địa chỉ: {vatAddress}

STT | Mô tả | Số lượng | Đơn giá | Thuế | Thành tiền
----|---------------------------|----------|-------------|---------|----------
 1 | {service_description} | 1 | {amount}  | 10% | {total}
----|---------------------------|----------|-------------|---------|----------
 | CỘNG: | {subtotal} |
 | THUẾ GTGT (10%): | {taxAmount} |
 | TỔNG CỘNG: | {totalAmount} |

Số tiền bằng chữ: {amountInWords}

==========================================
Cảm ơn quý khách đã tin tưởng LOOP Solutions!
==========================================
```

---

## 6. Admin quản trị thanh toán

### 6.1 Orders Tab — Cần bổ sung

**File:** `src/app/admin/orders/page.tsx`

**Thêm columns vào bảng Orders:**

| Column | Nội dung |
|--------|---------|
| Payment Status | Badge: unpaid / partial / paid / overpaid |
| Payment Progress | Progress bar: paidAmount / totalAmount |
| Last Payment At | Ngày giờ thanh toán gần nhất |
| VietQR Status | Trạng thái: pending / confirmed / expired / manual |
| Invoice | Invoice number + status badge |

**Thêm actions vào Order detail:**

```
Order #{orderNumber}
├── 💳 Thanh toán (PaymentModal — ĐÃ CÓ)
├── 📄 Tạo Invoice thủ công (nếu chưa auto)
├── ✏️ Sửa Invoice
├── 📧 Gửi Invoice
│ └── → Gửi email với invoice HTML hoặc PDF đính kèm
├── 🧾 Yêu cầu VAT: {companyName} / MST: {taxCode} — [Xem chi tiết]
├── ✅ Xác nhận VietQR (nếu webhook chưa confirm)
└── 📋 Payment History — Timeline log
```

### 6.2 Invoices Tab — UI Mới

**File:** `src/app/admin/invoices/page.tsx` (cần tạo hoặc mở rộng)

**Tính năng:**

| Tính năng | Mô tả |
|-----------|--------|
| Danh sách hóa đơn | Table: số hóa đơn, order number, khách hàng, số tiền, VAT info, status |
| Tạo Invoice | Form: order (dropdown), line items, VAT info, submit |
| Sửa Invoice | Edit form với validation |
| Gửi Invoice | Gửi email với template + PDF (nếu upload) |
| Upload PDF | Admin upload file PDF hóa đơn đã xuất |
| Filter | Theo status, ngày, khách hàng, order |
| Export | CSV/Excel cho kế toán |

### 6.3 Payment Configuration

**File:** `src/app/admin/settings/page.tsx` (thêm tab "Thanh toán")

**Settings cần thêm:**

```typescript
interface PaymentSettings {
 // VietQR
 vietqrApiKey: string;  // VietQR API key
 vietqrAccountId: string; // VietQR account ID
 vietqrWebhookSecret: string; // HMAC secret cho webhook verify
 vietqrCallbackUrl: string; // URL VietQR gọi về

 // Bank account hiển thị
 bankName: string; // VD: "Vietcombank"
 bankAccountNumber: string; // Số tài khoản
 bankAccountName: string; // Tên chủ tài khoản
 bankBranch: string; // Chi nhánh

 // QR tĩnh (fallback)
 paymentBankQrUrl: string; // QR tĩnh (đã có)
 paymentMomoQrUrl: string; // MoMo QR (đã có)

 // Email notifications
 emailNotificationsEnabled: boolean;
 sendCustomerPaymentConfirmation: boolean;
 sendCustomerInvoiceSent: boolean;
 sendCustomerOrderStatus: boolean;
 noreplyEmail: string; // Email gửi đi
}
```

---

## 7. Kết nối VietQR API

### 7.1 VietQR API Overview

**Docs:** https://vietqr.io/document/api

**VietQR cung cấp:**
1. **Bank Lookup API** — tra cứu thông tin ngân hàng
2. **QR Code Generation API** — tạo QR động
3. **Transfer History API** (Business account) — lịch sử chuyển khoản

### 7.2 VietQR QR Generation Flow

```
Backend LOOP
 │
 ├── Gọi: POST https://api.vietqr.io/v2/create
 │ Headers: x-api-key: {apiKey}, x-client-id: {clientId}
 │ Body: {
 │ accountNo: "123456789",
 │ accountName: "CONG TY TNHH LOOP",
 │ acqId: "970436", // Vietcombank BIC
 │ amount: 5000000,
 │ template: "compact",
 │ addData: "LOOP-ORD-xxxx"
 │ }
 │
 └── Response: { qrDataURL: "data:image/png;base64,..." }
 │
 ▼
 Hiển thị QR cho khách (Base64 image)
```

### 7.3 VietQR Webhook Flow

```
VietQR Business
 │
 ├── POST /api/webhooks/vietqr
 │ Headers: x-signature: HMAC-SHA256(body, secret)
 │ Body: {
 │ id: "txn_xxxx",
 │ amount: 5000000,
 │ transferType: "in",
 │ addData: "LOOP-ORD-xxxx",
 │ transactionDateTime: "2026-04-16T10:30:00",
 │  debitAccount: "1234567890",
 │ creditAccount: "9876543210",
 │ bankId: "970436"
 │ }
 │
 ▼
LOOP Backend
 │
 ├── Verify signature
 ├── Extract order number from addData
 ├── Lookup order
 ├── recordPayment()
 ├── Generate invoice (draft)
 ├── Send notification
 │
  └── Response: 200 OK
```

### 7.4 VietQR Service

```typescript
// src/lib/services/payment/vietqr.service.ts

interface VietQRConfig {
 apiKey: string;
 clientId: string;
 webhookSecret: string;
 callbackUrl: string;
 bankAccount: {
 accountNo: string;
 accountName: string;
 bankId: string; // VietQR bank code (VD: "970436" = Vietcombank)
 bankBin: string; // 3 số đầu tài khoản
 };
}

interface VietQRPaymentRequest {
 orderId: string;
 orderNumber: string;
 amount: number;  // VNĐ, số nguyên
 description?: string;
}

interface VietQRPaymentResponse {
 qrDataURL: string; // Base64 PNG image
 paymentCode: string; // Mã thanh toán (để khách điền vào nội dung)
 expiresAt: Date;
}

class VietQRService {
 constructor(private config: VietQRConfig) {}

 async createQR(request: VietQRPaymentRequest): Promise<VietQRPaymentResponse> {
 // 1. Gọi VietQR API
 // 2. Parse response
 // 3. Trả về qrDataURL + paymentCode
 }

 async verifyWebhook(payload: unknown, signature: string): Promise<boolean> {
 // HMAC-SHA256 verify
 }

 parseWebhookPayload(payload: VietQRWebhookPayload): {
 orderNumber: string;
 amount: number;
 transactionId: string;
 } {
 // Extract LOOP-ORD-{number} from addData
 // Parse amount, transactionId
 }
}
```

### 7.5 Payment Method Mới trong Wizard

**Thêm vào payment method list:**

```typescript
const PAYMENT_METHODS = [
 { value: "vietqr", label: "VietQR", icon: "📱", recommended: true },
 { value: "bank_transfer", label: "Chuyển khoản thủ công", icon: "🏦" },
 { value: "vnpay", label: "VNPay", icon: "💳" },
 { value: "momo", label: "MoMo", icon: "🟣" },
 { value: "cash", label: "Tiền mặt", icon: "💵" },
 { value: "cod", label: "Thanh toán sau", icon: "📅" },
 { value: "other", label: "Khác", icon: "•••" },
];
```

---

## 8. Invoice Auto-Generation Trigger

### 8.1 Trigger Points

```typescript
// Khi nào invoice được auto-generated?

const INVOICE_AUTO_GENERATE = {
 // Trigger  // Tạo invoice?
 "payment_recorded": true, // ✅ Khi admin ghi nhận thanh toán
 "vietqr_webhook_confirmed": true, // ✅ Khi VietQR webhook xác nhận
 "manual_payment_created": true, // ✅ Khi khách tự chọn "thanh toán sau"
 "order_status_to_in_progress": false, // ❌ Không tạo khi bắt đầu làm
 "order_completed": false, // ❌ Đã có payment invoice rồi
};
```

### 8.2 Invoice Auto-Generate Logic

```typescript
// src/lib/services/commerce/invoice.service.ts

async function autoGenerateInvoice(
 orderId: string,
 paymentId: string,
 paymentAmount: number,
 paymentMethod: string
): Promise<Invoice> {
 // 1. Lấy order + orderRevenueLines
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 include: { orderRevenueLines: true, oding: { select: { id: true, name: true, email: true } } }
 });

 // 2. Generate invoice number
 const invoiceNumber = await generateInvoiceNumber();

 // 3. Create invoice
 const invoice = await prisma.invoice.create({
 data: {
 invoiceNumber,
 orderId,
 customerId: order!.odingId,
 type: "income",
 amount: paymentAmount,
 taxAmount: Math.round(paymentAmount / 11), // 10% VAT = amount / 11
 totalAmount: paymentAmount,
 status: "draft",
 paidMethod: paymentMethod,
 description: `Thanh toán đơn hàng #${order!.orderNumber}`,
 paidAt: new Date(),
 createdBy: "system",
 // VAT info từ order nếu có
 ...(order!.vatRequest && {
 vatCompanyName: order!.vatRequest.companyName,
 vatTaxCode: order!.vatRequest.taxCode,
 vatAddress: order!.vatRequest.address,
 vatRecipientEmail: order!.vatRequest.email,
 })
 }
 });

 // 4. Create line items
 const lineItems = order!.orderRevenueLines.map(line => ({
 invoiceId: invoice.id,
 description: line.description,
 quantity: 1,
 unitPrice: line.subtotal,
 taxRate: 0.10,
 taxAmount: line.taxAmount,
 totalAmount: line.totalAmount,
 }));
 await prisma.invoiceLineItem.createMany({ data: lineItems });

 // 5. Update order with invoiceId
 await prisma.order.update({
 where: { id: orderId },
 data: { invoiceId: invoice.id }
 });

 // 6. Notification admin
 await prisma.adminNotification.create({
 data: {
 type: "invoice_auto_generated",
 title: `📄 Invoice tạo tự động — #${invoiceNumber}`,
 message: `Invoice cho đơn #${order!.orderNumber} — ${formatVND(paymentAmount)} VNĐ — chờ duyệt`,
 priority: "normal",
 }
 });

 return invoice;
}
```

### 8.3 Invoice Number Generation

```typescript
// src/lib/services/commerce/invoice.service.ts

async function generateInvoiceNumber(): Promise<string> {
 const now = new Date();
 const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
 // VD: "INV-202604-0001"

 // Tìm số lớn nhất trong tháng
 const lastInvoice = await prisma.invoice.findFirst({
 where: {
 invoiceNumber: { startsWith: `INV-${yearMonth}` }
 },
 orderBy: { invoiceNumber: "desc" }
 });

 let sequence = 1;
 if (lastInvoice) {
 const lastSeq = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
  sequence = lastSeq + 1;
 }

 return `INV-${yearMonth}-${String(sequence).padStart(4, "0")}`;
}
```

---

## 9. So sánh: Hiện tại vs Đề xuất

### 9.1 Payment Flow

| Step | Hiện tại | Đề xuất |
|------|----------|---------|
| Tạo order | ✅ Có | ✅ Giữ nguyên |
| Chọn thanh toán | ⚠️ Chỉ label, chưa có UI chọn | ✅ Có UI chọn: VietQR / chuyển khoản / COD |
| VietQR tạo QR | ❌ Chưa có | ✅ VietQR API integration |
| Xác nhận thanh toán | ❌ Admin tự kiểm tra banking app | ✅ VietQR webhook + admin confirm fallback |
| recordPayment | ✅ Có | ✅ Giữ nguyên |
| Invoice auto-generate | ❌ Chưa có | ✅ Tự động khi payment recorded |
| Notification admin | ✅ Có (payment_received) | ✅ Mở rộng: VietQR confirmed, invoice created, VAT requested |
| Notification khách | ❌ Không có | ✅ Email: payment confirmed, invoice sent |
| VietQR webhook | ❌ Không có | ✅ `POST /api/webhooks/vietqr` |

### 9.2 Invoice Flow

| Step | Hiện tại | Đề xuất |
|------|----------|---------|
| Invoice model | ✅ Có | ✅ Mở rộng fields VAT |
| Invoice CRUD | ✅ Có | ✅ Giữ nguyên |
| Auto-generate on payment | ❌ Không | ✅ Có |
| VAT request form | ❌ Không | ✅ Có trong Wizard |
| Invoice PDF generation | ❌ Không có | ❌ Gửi bằng email HTML (không auto-generate PDF) |
| VAT API integration | ❌ Không | ❌ **MANUAL** — Admin dùng phần mềm thuế riêng |
| Gửi email invoice | ❌ Không | ✅ Có (manual send) |
| Invoice email template | ❌ Không | ✅ Có HTML template |

### 9.3 Priority Implementation

| Priority | Task | Effort | Ghi chú |
|----------|------|--------|---------|
| **P1** | VietQR API service + QR generation | Medium | Core feature |
| **P1** | VietQR webhook handler | Medium | Auto-confirm payment |
| **P1** | Invoice auto-generate on payment | Medium | Hook vào recordPayment |
| **P1** | Admin Payment confirmation UI | Low | Confirm thanh toán thủ công |
| **P2** | Email service (Resend/Loops) | Medium | Notification cho khách |
| **P2** | VAT request form trong Wizard | Low | Thêm fields |
| **P2** | Invoice email template + send | Medium | Admin gửi manual |
| **P2** | Invoice Tab mở rộng | Medium | Full CRUD + send + upload PDF |
| **P3** | VietQR webhook secret verify | Low | Security |
| **P3** | Payment settings UI | Low | Cấu hình VietQR trong admin |

---

## 10. Phụ lục: Các file liên quan

### 10.1 File CẦN SỬA

| File | Action | Mô tả |
|------|--------|--------|
| `src/app/api/admin/orders/[id]/payments/route.ts` | Sửa | Thêm auto-generate invoice + notification |
| `src/app/api/admin/orders/[id]/transition/route.ts` | Sửa | Thêm notification cho khách |
| `src/app/admin/orders/page.tsx` | Sửa | Thêm columns, VietQR status, payment confirmation UI |
| `src/components/landing/WebPurchaseWizard.tsx` | Sửa | Thêm payment method selection step + VietQR flow |
| `src/components/landing/BookingWizardClient.tsx` | Sửa | Thêm payment method selection + VAT request |
| `src/app/admin/invoices/page.tsx` | Sửa/Mở rộng | Full invoice management + send email |
| `prisma/schema.prisma` | Sửa | Thêm: Order.vatRequest, Order.invoiceId, Invoice.vat* fields |
| `src/lib/prisma.ts` | Không đổi | — |

### 10.2 File CẦN TẠO MỚI

| File | Mô tả |
|------|--------|
| `src/lib/services/payment/vietqr.service.ts` | VietQR API integration |
| `src/app/api/payment/vietqr/create/route.ts` | Tạo QR thanh toán |
| `src/app/api/webhooks/vietqr/route.ts` | VietQR webhook handler |
| `src/lib/services/commerce/invoice.service.ts` | Invoice auto-generate + helpers |
| `src/lib/services/notification/email.service.ts` | Email sending service |
| `src/app/api/admin/invoices/[id]/send/route.ts` | Gửi invoice qua email |
| `src/app/api/admin/settings/payment/route.ts` | Payment settings CRUD |
| `src/app/admin/settings/page.tsx` | Thêm tab "Thanh toán" |

### 10.3 Prisma Schema Changes

```prisma
// 1. Thêm vào Order model
model Order {
 // ... existing fields
 vatRequest Json? // VatInfo: { companyName, taxCode, address, email, ... }
 invoiceId String?  // FK → Invoice (sau khi auto-generated)
 invoice Invoice? @relation(fields: [invoiceId], references: [id])

 // Thêm index cho payment lookup
 @@index([paymentStatus])
 @@index([invoiceId])
}

// 2. Mở rộng Invoice model
model Invoice {
 // ... existing fields
 vatCompanyName String?
 vatTaxCode String?
 vatAddress String?
 vatRecipientName String?
 vatRecipientEmail String?
 vatSerialNumber String? // Số serial từ phần mềm thuế
 vatSignature String?
 vatFileUrl String?
 vatSentAt DateTime?
 vatSentBy String?

 // Thêm index
 @@index([status, createdAt])
 @@index([orderId])
}

// 3. Thêm SiteSetting keys cho payment config
// Key: "vietqr_config" → JSON config
// Key: "payment_settings" → JSON config
```

### 10.4 Environment Variables cần thêm

```bash
# VietQR API
VIETQR_API_KEY=your_vietqr_api_key
VIETQR_CLIENT_ID=your_vietqr_client_id
VIETQR_WEBHOOK_SECRET=your_webhook_secret

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@loops.vn

# Bank account (public info — hiển thị cho khách)
NEXT_PUBLIC_BANK_NAME=Vietcombank
NEXT_PUBLIC_BANK_ACCOUNT=1234567890
NEXT_PUBLIC_BANK_NAME=CONG TY TNHH LOOP SOLUTIONS
NEXT_PUBLIC_BANK_BRANCH=TP.HCM
```

### 10.5 Recommended VietQR Plan

| Plan | Giá | Features |
|------|-----|---------|
| **Free** | 0đ | QR tĩnh, QR động (amount), Webhook (không confirm tự động) |
| **Business** | ~500k/tháng | Webhook confirmed, Transfer history, Multiple accounts |

**Recommendation:** Bắt đầu với **Free plan** để test. Khi scale, nâng lên **Business** để có confirmed webhook.

---

## TÓM TẮT CHO PO

### Điều PO cần quyết định

1. **VietQR Plan:** Free (manual confirm) hay Business (auto webhook confirm)?
2. **Email Provider:** Resend hay Loops? (cả 2 đều miễn phí tier để bắt đầu)
3. **VAT Invoice:** Giữ hoàn toàn manual hay có form để admin điền serial/signature?
4. **Thứ tự implement:** P1 (payment core) trước hay P1+P2 cùng làm?
5. **Khách chọn "Thanh toán sau (COD)":** Có cho phép không? Nếu có → cần reminder system?

### Cái KHÔNG làm (Deferred)

- ❌ VietQR Business confirmed webhook (chờ scale)
- ❌ VAT API integration với cơ quan thuế (manual process)
- ❌ PDF auto-generation (gửi HTML email thay thế)
- ❌ SMS notification (chỉ email)
- ❌ Payment retry logic (chỉ confirm/cancel)
- ❌ Refund flow (deferred)
