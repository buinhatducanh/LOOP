import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const createSchema = z.object({
  salesLeadId: z.string().min(1, "salesLeadId bắt buộc"),
  quoteNumber: z.string().min(1, "quoteNumber bắt buộc"),
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  totalAmount: z.number().int().min(0),
  lpAllocation: z.record(z.string(), z.number()).default({}),
  /** LP used by customer (copied from QuoteRequest.lpUsed) */
  lpUsed: z.number().int().min(0).default(0),
  /** Optional: link Quote to its originating QuoteRequest */
  quoteRequestId: z.string().optional(),
  milestones: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    dueDate: z.string().optional(),
  })).optional(),
  validUntil: z.string().transform(s => new Date(s)).optional(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("quotes", "read");
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};

    const status = searchParams.get("status");
    if (status && status !== "all") where.status = status;

    const salesLeadId = searchParams.get("salesLeadId");
    if (salesLeadId) where.salesLeadId = salesLeadId;

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { salesLead: { customerName: { contains: search, mode: "insensitive" } } },
        { salesLead: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          salesLead: {
            select: {
              id: true,
              customerName: true,
              customerEmail: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      data: quotes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("quotes", "create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    // Validate LP allocation sums to 100
    const lp = parsed.data.lpAllocation ?? {};
    const lpSum = Object.values(lp as Record<string, number>).reduce((s, v) => s + v, 0);
    if (lpSum !== 0 && lpSum !== 100) {
      return NextResponse.json(
        { error: `LP allocation phải tổng = 100%. Hiện tại: ${lpSum}%` },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.create({
      data: {
        salesLeadId: parsed.data.salesLeadId,
        quoteNumber: parsed.data.quoteNumber,
        title: parsed.data.title,
        totalAmount: parsed.data.totalAmount,
        lpAllocation: lp,
        lpUsed: parsed.data.lpUsed,
        milestones: parsed.data.milestones ?? undefined,
        validUntil: parsed.data.validUntil,
        note: parsed.data.note ?? null,
      },
      include: {
        salesLead: { select: { id: true, customerName: true, customerEmail: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "quotes",
      resourceId: quote.id,
      newValues: body,
    });

    return NextResponse.json({ data: quote }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
