import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
      variantName: z.string(),
      price: z.number(),
    })
  ).min(1, "Vui lòng chọn ít nhất 1 tính năng"),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = quoteSchema.parse(body);

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        customerPhone: validated.customerPhone || null,
        companyName: validated.companyName || null,
        selectedItems: validated.selectedItems,
        totalAmount: validated.totalAmount,
        notes: validated.notes || null,
      },
    });

    return NextResponse.json(
      { data: quoteRequest, message: "Yêu cầu báo giá đã được gửi thành công!" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create quote request:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
