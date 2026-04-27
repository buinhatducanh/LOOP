import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/payment/check-status?orderId=...
 * 
 * Polling endpoint to check if an order has been paid.
 * Logic:
 * 1. Check QuoteRequest
 * 2. Check if Order already created (payment success)
 * 3. Mock/Real check for transactions
 * 4. Create Order if payment verified
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // 1. Find the QuoteRequest
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: orderId },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // 2. Check if an Order already exists for this Quote
    // (We'll use notes or a custom field to link them if no direct relation exists)
    const existingOrder = await prisma.order.findFirst({
      where: { customerEmail: quote.customerEmail, totalAmount: quote.totalAmount, createdAt: { gte: quote.createdAt } },
    });

    if (existingOrder && existingOrder.paymentStatus === "paid") {
      return NextResponse.json({
        data: {
          isPaid: true,
          status: "completed",
          orderNumber: existingOrder.orderNumber,
        }
      });
    }

    // 3. Calculate required amount based on payment plan
    const requiredAmount = quote.paymentPlan === "100" 
      ? quote.totalAmount 
      : Math.round(quote.totalAmount * 0.5);

    // 4. MOCK TRANSACTION CHECK
    // In production, you would call SePay/Casso/PayOS API here or check a 'Transactions' table
    // populated by a webhook.
    
    // MOCK: If the orderId ends in 'PAID', simulate success.
    // Otherwise, check for a mock 'payment' record if you have one.
    let paidAmount = 0;
    
    // For development, we'll allow a manual trigger via a specific orderId pattern 
    // or just look for a recent Payment record linked to this orderId
    const payment = await prisma.payment.findFirst({
      where: { orderId: quote.id }, // Temporarily using quote.id as orderId in Payment model for polling
      orderBy: { createdAt: 'desc' }
    });

    if (payment) {
      paidAmount = payment.amount;
    }

    // If no payment found, return pending
    if (paidAmount === 0) {
      return NextResponse.json({
        data: {
          isPaid: false,
          paidAmount: 0,
          requiredAmount,
          status: "pending",
        }
      });
    }

    // 5. Check if amount is enough
    if (paidAmount < requiredAmount) {
      return NextResponse.json({
        data: {
          isPaid: false,
          paidAmount,
          requiredAmount,
          status: "partial",
          message: "Bạn chưa chuyển đủ tiền",
        }
      });
    }

    // 6. PAYMENT SUCCESSFUL -> CREATE ORDER
    const orderNumber = `LOOP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${quote.id.slice(-4).toUpperCase()}`;
    
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        companyName: quote.companyName,
        totalAmount: quote.totalAmount,
        paidAmount: paidAmount,
        paymentStatus: "paid",
        status: "pending",
        paymentMethod: "bank_transfer",
        requirements: quote.notes,
        domainName: quote.domainName,
        lpUsed: quote.lpUsed,
        // Map other fields as needed
      }
    });

    // Update QuoteRequest status
    await prisma.quoteRequest.update({
      where: { id: quote.id },
      data: { status: "paid" }
    });

    return NextResponse.json({
      data: {
        isPaid: true,
        paidAmount,
        requiredAmount,
        status: "completed",
        orderNumber: newOrder.orderNumber,
      }
    });

  } catch (err) {
    console.error("[CheckStatus] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
