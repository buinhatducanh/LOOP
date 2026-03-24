import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

// GET /api/ref/[code] — Public referral click tracking + redirect
// Query params: ?utm_source=&utm_medium=&utm_campaign=&utm_term=&utm_content=
// Also accepts POST for explicit click events with IP/user-agent.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const normalized = code.toUpperCase();

    const referralCode = await prisma.referralCode.findUnique({
      where: { code: normalized },
      select: { id: true, isActive: true, expiresAt: true, name: true },
    });

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    }

    if (!referralCode.isActive) {
      return NextResponse.json({ error: "This referral code is no longer active" }, { status: 410 });
    }

    if (referralCode.expiresAt && new Date(referralCode.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This referral code has expired" }, { status: 410 });
    }

    const { searchParams } = new URL(req.url);
    const utmSource   = searchParams.get("utm_source")   ?? undefined;
    const utmMedium   = searchParams.get("utm_medium")    ?? undefined;
    const utmCampaign = searchParams.get("utm_campaign") ?? undefined;
    const utmTerm     = searchParams.get("utm_term")      ?? undefined;
    const utmContent  = searchParams.get("utm_content")  ?? undefined;
    const ip          = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
                      ?? req.headers.get("x-real-ip")
                      ?? "unknown";
    const userAgent   = req.headers.get("user-agent") ?? undefined;

    // Hash IP for privacy (don't store raw IPs)
    const ipHash = createHash("sha256").update(`${ip}-${process.env.DATABASE_URL ?? "loop"}`).digest("hex").slice(0, 32);

    // Record click asynchronously (don't block redirect)
    prisma.referralTracking.create({
      data: {
        referralCodeId: referralCode.id,
        event: "click",
        landingUrl: req.nextUrl.origin,
        utmSource: utmSource ?? null,
        utmMedium: utmMedium ?? null,
        utmCampaign: utmCampaign ?? null,
        utmTerm: utmTerm ?? null,
        utmContent: utmContent ?? null,
        ipHash,
        userAgent: userAgent ?? null,
      },
    }).catch(() => {/* silent — don't block the response */});

    // Redirect to main website or a campaign landing page
    const destination = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
    return NextResponse.redirect(new URL(`/?ref=${normalized}`, destination), 302);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/ref/[code] — Record a conversion event (signup, lead, order)
// Body: { event: "signup" | "lead" | "order", salesLeadId?, orderId?, revenue? }
// Used by frontend after a visitor signs up or places an order via the referral link.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const normalized = code.toUpperCase();
    const { event, salesLeadId, orderId, revenue } = await req.json();

    const validEvents = ["signup", "lead", "order"];
    if (!event || !validEvents.includes(event)) {
      return NextResponse.json(
        { error: `event must be one of: ${validEvents.join(", ")}` },
        { status: 400 }
      );
    }

    const referralCode = await prisma.referralCode.findUnique({
      where: { code: normalized },
      select: { id: true, isActive: true, expiresAt: true, useCount: true, maxUses: true, lpRate: true },
    });

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    }

    if (!referralCode.isActive) {
      return NextResponse.json({ error: "This referral code is no longer active" }, { status: 410 });
    }

    // Check usage limit
    if (referralCode.maxUses !== null && referralCode.useCount >= referralCode.maxUses) {
      return NextResponse.json({ error: "This referral code has reached its usage limit" }, { status: 410 });
    }

    // Validate references
    if (event === "lead" || event === "order") {
      if (!salesLeadId) {
        return NextResponse.json({ error: "salesLeadId is required for lead/order events" }, { status: 400 });
      }
      const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
      if (!lead) return NextResponse.json({ error: "SalesLead not found" }, { status: 404 });
    }

    if (event === "order") {
      if (!orderId) {
        return NextResponse.json({ error: "orderId is required for order events" }, { status: 400 });
      }
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

      // Update SalesLead referralCodeId if not set
      if (salesLeadId) {
        await prisma.salesLead.update({
          where: { id: salesLeadId },
          data: { referralCodeId: referralCode.id },
        }).catch(() => {/* ignore if already set */});
      }

      // Update Order referralCodeId if not set
      await prisma.order.update({
        where: { id: orderId },
        data: { referralCodeId: referralCode.id },
      }).catch(() => {/* ignore if already set */});
    }

    // Create tracking record
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
            ?? req.headers.get("x-real-ip") ?? "unknown";
    const ipHash = createHash("sha256").update(`${ip}-${process.env.DATABASE_URL ?? "loop"}`).digest("hex").slice(0, 32);

    const tracking = await prisma.referralTracking.create({
      data: {
        referralCodeId: referralCode.id,
        event,
        salesLeadId: salesLeadId ?? null,
        orderId: orderId ?? null,
        revenue: typeof revenue === "number" ? revenue : 0,
        ipHash,
        userAgent: req.headers.get("user-agent") ?? null,
      },
    });

    // Increment use count
    await prisma.referralCode.update({
      where: { id: referralCode.id },
      data: { useCount: { increment: 1 } },
    });

    return NextResponse.json({
      data: { trackingId: tracking.id, event, success: true },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
