import { ok, badRequest, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

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

export async function POST(req: NextRequest) {
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

    return ok({ ...order, message: "Order submitted successfully!" }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(`Validation failed: ${error.issues.map((i) => i.message).join("; ")}`);
    }
    console.error("Order creation error:", error);
    return serverError();
  }
}
