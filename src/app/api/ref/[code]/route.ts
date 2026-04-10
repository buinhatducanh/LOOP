import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError, badRequest } from "@/lib/api/response";
import { createHash } from "crypto";

// GET /api/ref/[code] — Public referral click tracking + redirect
// Query params: ?utm_source=&utm_medium=&utm_campaign=&utm_term=&utm_content=
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

    if (!referralCode) return notFound("Referral code not found");
    if (!referralCode.isActive)
      return NextResponse.json({ error: "This referral code is no longer active" }, { status: 410 });
    if (referralCode.expiresAt && new Date(referralCode.expiresAt) < new Date())
      return NextResponse.json({ error: "This referral code has expired" }, { status: 410 });

    const { searchParams } = new URL(req.url);
    const utmSource   = searchParams.get("utm_source")   ?? undefined;
    const utmMedium   = searchParams.get("utm_medium")    ?? undefined;
    const utmCampaign = searchParams.get("utm_campaign") ?? undefined;
    const utmTerm     = searchParams.get("utm_term")      ?? undefined;
    const utmContent  = searchParams.get("utm_content")  ?? undefined;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
             ?? req.headers.get("x-real-ip") ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? undefined;

    // Hash IP for privacy
    const ipHash = createHash("sha256")
      .update(`${ip}-${process.env.DATABASE_URL ?? "loop"}`)
      .digest("hex").slice(0, 32);

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
    }).catch(() => {/* silent */});

    const destination = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
    return NextResponse.redirect(new URL(`/?ref=${normalized}`, destination), 302);
  } catch (error) {
    console.error("Referral tracking error:", error);
    return serverError();
  }
}

// POST /api/ref/[code] — Record a conversion event (signup, lead, order)
const validEvents = ["signup", "lead", "order"] as const;
// ReferralEvent type removed - not currently used

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const normalized = code.toUpperCase();
    const { event, salesLeadId, orderId, revenue } = await req.json();

    if (!event || !validEvents.includes(event)) {
      return badRequest(`event must be one of: ${validEvents.join(", ")}`);
    }

    const referralCode = await prisma.referralCode.findUnique({
      where: { code: normalized },
      select: { id: true, isActive: true, expiresAt: true, useCount: true, maxUses: true, lpRate: true },
    });

    if (!referralCode) return notFound("Referral code not found");
    if (!referralCode.isActive)
      return NextResponse.json({ error: "This referral code is no longer active" }, { status: 410 });
    if (referralCode.maxUses !== null && referralCode.useCount >= referralCode.maxUses)
      return NextResponse.json({ error: "This referral code has reached its usage limit" }, { status: 410 });

    // Validate references
    if (event === "lead" || event === "order") {
      if (!salesLeadId) return badRequest("salesLeadId is required for lead/order events");
      const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
      if (!lead) return notFound("SalesLead not found");
    }

    if (event === "order") {
      if (!orderId) return badRequest("orderId is required for order events");
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return notFound("Order not found");

      const ignoreIfAlreadyLinked = (e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("P2002") && !msg.includes("Unique constraint")) throw e;
      };

      await prisma.$transaction(async (tx) => {
        if (salesLeadId) {
          await tx.salesLead.update({
            where: { id: salesLeadId },
            data: { referralCodeId: referralCode.id },
          }).catch(ignoreIfAlreadyLinked);
        }
        await tx.order.update({
          where: { id: orderId },
          data: { referralCodeId: referralCode.id },
        }).catch(ignoreIfAlreadyLinked);
      });
    }

    // Record tracking
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
             ?? req.headers.get("x-real-ip") ?? "unknown";
    const ipHash = createHash("sha256")
      .update(`${ip}-${process.env.DATABASE_URL ?? "loop"}`)
      .digest("hex").slice(0, 32);

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

    await prisma.referralCode.update({
      where: { id: referralCode.id },
      data: { useCount: { increment: 1 } },
    });

    return ok({ trackingId: tracking.id, event, success: true }, 201);
  } catch (error) {
    console.error("Referral conversion error:", error);
    return serverError();
  }
}
