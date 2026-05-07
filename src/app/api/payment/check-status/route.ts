import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

/**
 * GET /api/payment/check-status?ref=... OR ?orderId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const ref = searchParams.get("ref");

    if (!orderId && !ref) {
      return NextResponse.json({ error: "orderId or ref is required" }, { status: 400 });
    }

    // --- CASE 1: Check by Reference (New payment-first flow) ---
    if (ref) {
      const cachePath = path.join(process.cwd(), "scratch", "orphan_payments.json");
      if (fs.existsSync(cachePath)) {
        try {
          const orphans = JSON.parse(fs.readFileSync(cachePath, "utf8"));
          const found = orphans.find((o: any) => 
            o.ref.includes(ref.toUpperCase()) || ref.toUpperCase().includes(o.ref)
          );

          if (found) {
            return NextResponse.json({
              data: {
                verified: true,
                amount: found.amount,
                transactionId: found.transactionId
              }
            });
          }
        } catch (e) {
          console.error("[CheckStatus] Cache read error:", e);
        }
      }
      
      // Fallback: check if already created
      const quote = await prisma.quoteRequest.findFirst({
        where: { 
          OR: [
            { id: { contains: ref.replace("LOOP", ""), mode: 'insensitive' } },
            { customerPhone: { contains: ref.replace("LOOP", "") } }
          ],
          status: "paid"
        }
      });

      if (quote) {
        return NextResponse.json({ data: { verified: true, alreadyExists: true } });
      }

      return NextResponse.json({ data: { verified: false, status: "pending" } });
    }

    // --- CASE 2: Check by Order ID (Legacy or fallback flow) ---
    if (orderId) {
      const quote = await prisma.quoteRequest.findUnique({
        where: { id: orderId },
      });

      if (!quote) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }

      if (quote.status === "paid") {
        return NextResponse.json({ data: { verified: true } });
      }

      const payment = await prisma.payment.findFirst({
        where: { orderId: quote.id },
        orderBy: { createdAt: 'desc' }
      });

      if (payment) {
        return NextResponse.json({ data: { verified: true, amount: payment.amount } });
      }

      return NextResponse.json({ data: { verified: false, status: "pending" } });
    }

    return NextResponse.json({ data: { verified: false } });

  } catch (err) {
    console.error("[CheckStatus] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
