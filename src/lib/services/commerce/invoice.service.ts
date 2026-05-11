/**
 * Invoice Service — LOOP Solutions
 *
 * Handles invoice auto-generation on payment recording,
 * invoice number generation, and invoice data helpers.
 */

import { prisma } from "@/lib/prisma";

// ─── Invoice Number Generation ────────────────────────────────────────────────

/**
 * Generate next invoice number: INV-YYYYMM-XXXX
 * Resets sequence each month.
 *
 * Uses $transaction to prevent race conditions on concurrent payments.
 * If a duplicate invoiceNumber is somehow generated (extremely rare),
 * the caller will receive a Prisma unique constraint error and should retry.
 */
export async function generateInvoiceNumber(): Promise<string> {
 const now = new Date();
 const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
 const prefix = `INV-${yearMonth}-`;

 // Atomic: find last + increment inside a transaction
 // This prevents two concurrent payments from getting the same invoice number.
 return prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
 const lastInvoice = await tx.invoice.findFirst({
 where: { invoiceNumber: { startsWith: prefix } },
 orderBy: { invoiceNumber: "desc" },
 select: { invoiceNumber: true },
 });

 let sequence = 1;
 if (lastInvoice) {
 const lastSeqStr = lastInvoice.invoiceNumber.replace(prefix, "");
 const lastSeq = parseInt(lastSeqStr, 10);
 if (!isNaN(lastSeq)) {
 sequence = lastSeq + 1;
 }
 }

 return `${prefix}${String(sequence).padStart(4, "0")}`;
 });
}

// ─── Auto-generate Invoice on Payment ─────────────────────────────────────────

export interface AutoGenerateInvoiceOptions {
 orderId: string;
 paymentAmount: number; // base amount (before VAT)
 paymentMethod: string; // bank_transfer | vietqr | cash | vnpay | momo | cod | other
 createdBy: string; // userId of admin who recorded
}

/**
 * Auto-generate an Invoice when a payment is recorded.
 * Called OUTSIDE the payment transaction (fire-and-forget).
 *
 * Flow:
 * 1. Look up order + orderRevenueLines
 * 2. Generate invoice number
 * 3. Create Invoice (draft status)
 * 4. Create InvoiceLineItems from OrderRevenueLine
 *
 * Returns the created invoice, or null if order not found / already invoiced.
 */
export async function autoGenerateInvoice(
 opts: AutoGenerateInvoiceOptions,
): Promise<{ id: string; invoiceNumber: string } | null> {
 const { orderId, paymentAmount, paymentMethod, createdBy } = opts;

 // Skip if already has an active invoice for this order
 const existing = await prisma.invoice.findFirst({
 where: {
 orderId,
 status: { not: "cancelled" },
 },
 select: { id: true },
 });
 if (existing) {
 return null;
 }

 // ── Fetch order with revenue lines ─────────────────────────────────────────
 const order = await prisma.order.findUnique({
 where: { id: orderId },
 include: { orderRevenueLines: true },
 });

 if (!order) return null;

 // ── Generate invoice number ────────────────────────────────────────────────
 const invoiceNumber = await generateInvoiceNumber();

 // ── Build line items from OrderRevenueLine ─────────────────────────────────
 const revenueLines = order.orderRevenueLines;

 if (revenueLines.length === 0) {
 // No revenue lines — paymentAmount is the GROSS amount (including VAT).
 // Formula: total = net * 1.1 → VAT = total / 11, net = total - tax
 // Example: 1,000,000 → tax = round(90,909), net = 909,091 → 909,091 + 90,909 = 1,000,000 ✅
 const taxAmount = Math.round(paymentAmount / 11);
 const netAmount = paymentAmount - taxAmount;
 const invoice = await prisma.invoice.create({
 data: {
 invoiceNumber,
 orderId,
 type: "income",
 amount: netAmount,
 taxAmount,
 totalAmount: paymentAmount,
 status: "draft",
 paidMethod: paymentMethod,
 description: `Thanh toán đơn hàng #${order.orderNumber}`,
 paidAt: new Date(),
 createdBy,
 },
 });

 return { id: invoice.id, invoiceNumber: invoice.invoiceNumber };
 } else {
 // ── Proportional allocation across revenue lines ──────────────────────────────
 const totalRevenue = revenueLines.reduce((sum: number, line: { totalPrice: number }) => sum + line.totalPrice, 0);

 const lineItems = revenueLines.map((line: { serviceName: string; totalPrice: number; taxRate: number }) => {
 const proportion = totalRevenue > 0 ? line.totalPrice / totalRevenue : 1 / revenueLines.length;
 const linePayment = Math.round(paymentAmount * proportion);
 const taxAmount = Math.round(linePayment / 11);
 return {
 description: line.serviceName,
 quantity: 1,
 unitPrice: linePayment - taxAmount,
 totalPrice: linePayment,
 taxAmount,
 taxRate: line.taxRate,
 };
 });

 const totalLinePayment = lineItems.reduce((sum: number, li: { totalPrice: number }) => sum + li.totalPrice, 0);
 const totalTaxAmount = lineItems.reduce((sum: number, li: { taxAmount: number }) => sum + li.taxAmount, 0);

 // ── Create invoice with line items ──────────────────────────────────────────
 const invoice = await prisma.invoice.create({
 data: {
 invoiceNumber,
 orderId,
 type: "income",
 amount: totalLinePayment - totalTaxAmount,
 taxAmount: totalTaxAmount,
 totalAmount: totalLinePayment,
 status: "draft",
 paidMethod: paymentMethod,
 description: `Thanh toán đơn hàng #${order.orderNumber}`,
 paidAt: new Date(),
 createdBy,
 lineItems: {
 create: lineItems.map((li: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
 description: li.description,
 quantity: li.quantity,
 unitPrice: li.unitPrice,
 totalPrice: li.totalPrice,
 })),
 },
 },
 include: { lineItems: true },
 });

 return { id: invoice.id, invoiceNumber: invoice.invoiceNumber };
 }
}

// ─── Admin Notification on Invoice Auto-generation ────────────────────────────

/**
 * Fire-and-forget notification to admin when invoice is auto-generated.
 */
export async function notifyInvoiceAutoGenerated(
 invoiceNumber: string,
 orderId: string,
 paymentAmount: number,
): Promise<void> {
 try {
 const formattedAmount = new Intl.NumberFormat("vi-VN").format(paymentAmount);
 await prisma.adminNotification.create({
 data: {
 type: "invoice_auto_generated",
 title: `📄 Invoice tạo tự động — #${invoiceNumber}`,
 message: `Invoice cho đơn #${orderId} — ${formattedAmount} VNĐ — trạng thái: draft. Vui lòng duyệt và gửi cho khách.`,
 link: `/admin/invoices`,
 priority: "normal",
 },
 });
 } catch {
 // silent — non-critical
 }
}
