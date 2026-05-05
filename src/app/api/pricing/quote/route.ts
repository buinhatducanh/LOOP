import { ok, badRequest, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

// VIP discount caps per tier (G3 fix)
const VIP_DISCOUNT_CAPS: Record<string, number> = {
  regular: 0.10,
  vip1: 0.15,
  vip2: 0.20,
  vip3: 0.25,
};

const quoteSchema = z.object({
  customerName: z.string().min(1, "Vui lòng nhập tên"),
  customerEmail: z.string().email("Email không hợp lệ"),
  customerPhone: z.string().optional(),
  companyName: z.string().optional(),
  selectedItems: z.array(
    z.object({
      featureId: z.string(),
      featureName: z.string(),
      variantId: z.string(),
      variantName: z.string().default(""),
      price: z.number().int().min(0),
    })
  ).min(1, "Vui lòng chọn ít nhất 1 tính năng"),
  totalAmount: z.number().min(0),
  /** LP used by customer to offset totalAmount (max % enforced server-side by VIP tier) */
  lpUsed: z.number().int().min(0).default(0),
  paymentPlan: z.enum(["50", "100"]).optional(),
  notes: z.string().optional(),
  /** Pre-selected hosting plan slug */
  hostingPlanSlug: z.string().optional(),
  /** Domain name the customer wants (e.g. "mysite.vn") */
  domainName: z.string().optional(),
  /** "now" = purchase domain now; "after_handover" = purchase after project delivery */
  domainPurchaseTime: z.enum(["now", "after_handover"]).default("now"),
  /** Detailed breakdown of costs */
  pricingBreakdown: z.any().optional(),
  /** Source of request: fixed | custom */
  source: z.string().default("fixed"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = quoteSchema.parse(body);

    // Look up or create ClientVipStatus for this customer (G3 fix)
    let vipStatus = await prisma.clientVipStatus.findUnique({
      where: { userEmail: validated.customerEmail },
    });
    if (!vipStatus) {
      vipStatus = await prisma.clientVipStatus.create({
        data: { userEmail: validated.customerEmail, tier: "regular" },
      });
    }

    // Apply tier-based discount cap (never demote — only cap max LP allowed)
    const discountCap = VIP_DISCOUNT_CAPS[vipStatus.tier] ?? 0.10;
    const maxLpAllowed = Math.floor(validated.totalAmount * discountCap);
    const lpUsed = Math.min(validated.lpUsed, maxLpAllowed);

    console.log("DEBUG: Creating QuoteRequest with data:", {
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      totalAmount: validated.totalAmount,
      lpUsed,
      source: validated.source,
    });

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        customerPhone: validated.customerPhone || null,
        companyName: validated.companyName || null,
        selectedItems: validated.selectedItems as any,
        totalAmount: Math.round(validated.totalAmount),
        lpUsed,
        paymentPlan: validated.paymentPlan || null,
        notes: validated.notes || null,
        hostingPlanSlug: validated.hostingPlanSlug || null,
        domainName: validated.domainName || null,
        domainPurchaseTime: validated.domainPurchaseTime,
        pricingBreakdown: (validated.pricingBreakdown || {}) as any,
        source: validated.source,
      },
    });

    return ok(
      {
        ...quoteRequest,
        message: "Yêu cầu báo giá đã được gửi thành công!",
        vipTier: vipStatus.tier,
        discountCap,
        maxLpAllowed: lpUsed,
      },
      201
    );
  } catch (error) {
    console.error("CRITICAL ERROR in /api/pricing/quote:", error);
    if (error instanceof z.ZodError) {
      return badRequest(error.issues.map((i) => i.message).join("; "));
    }
    return serverError(error instanceof Error ? error.message : "Internal Server Error");
  }
}
