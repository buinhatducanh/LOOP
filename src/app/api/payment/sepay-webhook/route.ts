import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payment/sepay-webhook
 * 
 * Webhook handler for SePay.vn.
 * SePay will call this endpoint when a bank transfer is detected.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. Verify API Key (Optional but recommended)
    // SePay sends the API Key in the 'x-api-key' header if configured
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = process.env.SEPAY_API_KEY;
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      console.error("[SePay Webhook] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[SePay Webhook] Received data:", body);

    const { transferAmount, content, id: transactionId } = body;

    // 2. Identify the QuoteRequest from the content (description)
    // Content format in QR: "LOOP-<SHORT_ID>"
    const match = content.match(/LOOP-([A-Z0-9]+)/i);
    const shortId = match ? match[1] : null;

    if (!shortId) {
      console.warn("[SePay Webhook] Could not parse shortId from content:", content);
      return NextResponse.json({ ok: true }); 
    }

    // Find the QuoteRequest that matches this short ID (last 8 chars of CUID)
    const quoteRequests = await prisma.quoteRequest.findMany({
      where: { 
        status: { not: "paid" },
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const quote = quoteRequests.find((q: typeof quoteRequests[number]) => q.id.slice(-8).toUpperCase() === shortId.toUpperCase());

    if (!quote) {
      console.error("[SePay Webhook] No matching QuoteRequest found for:", shortId);
      return NextResponse.json({ ok: true });
    }

    // 3. Create Payment record
    await prisma.payment.create({
      data: {
        orderId: quote.id,
        amount: Number(transferAmount),
        method: "sepay",
        note: `SePay Transaction ID: ${transactionId} | Content: ${content}`,
        confirmedAt: new Date(),
      }
    });

    // 4. Create Order if enough paid
    const requiredAmount = quote.paymentPlan === "100" 
      ? quote.totalAmount 
      : Math.round(quote.totalAmount * 0.5);

    // Apply the 5% discount logic if it's 100% plan
    const actualRequired = quote.paymentPlan === "100"
      ? Math.round(requiredAmount * 0.95)
      : requiredAmount;

    if (Number(transferAmount) >= actualRequired) {
      const orderNumber = `LOOP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${quote.id.slice(-4).toUpperCase()}`;
      
      await prisma.order.create({
        data: {
          orderNumber,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          companyName: quote.companyName,
          totalAmount: quote.totalAmount,
          paidAmount: Number(transferAmount),
          paymentStatus: "paid",
          status: "pending",
          paymentMethod: "bank_transfer_sepay",
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

      console.log("[SePay Webhook] Order created successfully via SePay:", orderNumber);
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[SePay Webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
