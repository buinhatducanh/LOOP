import { ok, badRequest, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { orderLogger } from "@/lib/logger";
import { withIdempotency } from "@/lib/idempotency";
import { applyRateLimit } from "@/lib/rate-limit";

const orderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().optional(),
  companyName: z.string().optional(),
  notes: z.string().optional(),
  selectedItems: z.array(z.object({
    featureId: z.string(),
    featureName: z.string(),
    price: z.number(),
  })).min(1, "At least one feature required"),
  totalAmount: z.number().min(0),
});

async function handleCreateOrder(req: NextRequest) {
  // ── Rate limit: 20/min per IP for public order submission ─────────────────
  const rateLimitResult = await applyRateLimit(req, "public");
  if (!rateLimitResult.allowed) return rateLimitResult.response!;

  try {
    const body = await req.json();
    const validated = orderSchema.parse(body);

    const orderNumber =
      `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: "custom",
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        customerPhone: validated.customerPhone || null,
        companyName: validated.companyName || null,
        requirements: validated.notes || null,
        status: "pending",
        paymentStatus: "unpaid",
        basePrice: validated.totalAmount,
        systemCalculatedPrice: validated.totalAmount,
        finalPrice: validated.totalAmount,
        selectedAttributes: {
          create: validated.selectedItems.map((item) => ({
            attributeId: item.featureId,
            priceAtOrder: item.price,
          })),
        },
      },
    });

    orderLogger.info("Public order created", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      total: validated.totalAmount,
      itemCount: validated.selectedItems.length,
    });
    return ok({ ...order, message: "Order submitted successfully!" }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(`Validation failed: ${error.issues.map((i) => i.message).join("; ")}`);
    }
    orderLogger.withSLO("POST /api/services/order failed", {
      endpoint: "/api/services/order",
      statusCode: 500,
    });
    return serverError();
  }
}

export const POST = withIdempotency("create_order", handleCreateOrder);
