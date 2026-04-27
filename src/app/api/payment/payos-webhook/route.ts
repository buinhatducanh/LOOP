import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import payOS from "@/lib/payos";

/**
 * POST /api/payment/payos-webhook
 * 
 * Webhook handler for PayOS.
 * PayOS will call this endpoint when a payment is received.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Verify signature (Security)
    // You must provide PAYOS_CHECKSUM_KEY in your .env
    const webhookData = await payOS.webhooks.verify(body);

    if (!webhookData) {
      console.error("[PayOS Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[PayOS Webhook] Received payment data:", webhookData);

    const { amount, description, orderCode } = webhookData;

    // 2. Identify the QuoteRequest from the description
    // Description format in QR: "LOOP-<SHORT_ID>"
    const match = description.match(/LOOP-([A-Z0-9]+)/i);
    const shortId = match ? match[1] : null;

    if (!shortId) {
      console.warn("[PayOS Webhook] Could not parse shortId from description:", description);
      return NextResponse.json({ ok: true }); // Still return 200 to acknowledge
    }

    // Find the QuoteRequest that matches this short ID (last 8 chars of CUID)
    const quoteRequests = await prisma.quoteRequest.findMany({
      where: { 
        status: { not: "paid" },
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // Check last 20 requests
    });

    const quote = quoteRequests.find(q => q.id.slice(-8).toUpperCase() === shortId.toUpperCase());

    if (!quote) {
      console.error("[PayOS Webhook] No matching QuoteRequest found for:", shortId);
      return NextResponse.json({ ok: true });
    }

    // 3. Check if an Order already exists
    const existingOrder = await prisma.order.findFirst({
      where: { customerEmail: quote.customerEmail, totalAmount: quote.totalAmount, createdAt: { gte: quote.createdAt } },
    });

    if (existingOrder && existingOrder.paymentStatus === "paid") {
      return NextResponse.json({ ok: true });
    }

    // 4. Create Payment record
    await prisma.payment.create({
      data: {
        orderId: quote.id, // Using quote ID temporarily as reference
        amount: amount,
        method: "payos",
        note: `PayOS OrderCode: ${orderCode} | Desc: ${description}`,
        confirmedAt: new Date(),
      }
    });

    // 5. Create Order if enough paid
    const requiredAmount = quote.paymentPlan === "100" 
      ? quote.totalAmount 
      : Math.round(quote.totalAmount * 0.5);

    // Apply the 5% discount logic if it's 100% plan
    const actualRequired = quote.paymentPlan === "100"
      ? Math.round(requiredAmount * 0.95)
      : requiredAmount;

    if (amount >= actualRequired) {
      const orderNumber = `LOOP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${quote.id.slice(-4).toUpperCase()}`;
      
      await prisma.order.create({
        data: {
          orderNumber,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          companyName: quote.companyName,
          totalAmount: quote.totalAmount,
          paidAmount: amount,
          paymentStatus: "paid",
          status: "pending",
          paymentMethod: "bank_transfer_payos",
          requirements: quote.notes,
          domainName: quote.domainName,
          lpUsed: quote.lpUsed,
        }
      });

      // Update QuoteRequest status
      await prisma.quoteRequest.update({
        where: { id: quote.id },
        data: { status: "paid" }
      });

      console.log("[PayOS Webhook] Order created successfully:", orderNumber);
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[PayOS Webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
