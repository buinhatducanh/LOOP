/**
 * Public MediaBooking API — customer-facing booking form submission.
 * No authentication required.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ok, badRequest, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

// nanoid-like generator: MBK- + 12 uppercase alphanumeric
function generateBookingNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MBK-${result}`;
}

const createSchema = z.object({
  customerName: z.string().min(1, "customer name is required"),
  customerEmail: z.string().email("invalid email address"),
  customerPhone: z.string().optional(),
  companyName: z.string().optional(),
  bookingType: z.enum(["event", "product", "corporate", "social", "custom"]),
  title: z.string().min(1, "project title is required"),
  requirements: z.string().optional(),
  deadline: z.string().optional(), // ISO date string
  budget: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.message);
    }

    const bookingNumber = generateBookingNumber();

    const booking = await prisma.mediaBooking.create({
      data: {
        bookingNumber,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone ?? null,
        companyName: parsed.data.companyName ?? null,
        bookingType: parsed.data.bookingType,
        title: parsed.data.title,
        requirements: parsed.data.requirements ?? null,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        status: "pending",
        paymentStatus: "unpaid",
        totalAmount: parsed.data.budget ?? null,
        paidAmount: 0,
      },
      select: {
        id: true,
        bookingNumber: true,
      },
    });

    return ok({ id: booking.id, bookingNumber: booking.bookingNumber }, 201);
  } catch (err) {
    return handleError(err);
  }
}
