import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
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

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
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

    return NextResponse.json({
      data: order,
      message: "Order submitted successfully!",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed",
        details: error.issues,
      }, { status: 400 });
    }
    console.error("Order creation error:", error);
    return NextResponse.json({
      error: "An error occurred",
    }, { status: 500 });
  }
}
