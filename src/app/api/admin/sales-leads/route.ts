import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const createSchema = z.object({
  source: z.string().default("website"),
  customerName: z.string().min(1, "Tên khách hàng bắt buộc"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  area: z.string().default("can_tho"),
  tier: z.string().default("sme"),
  status: z.string().default("new"),
  note: z.string().optional(),
  estimatedBudget: z.number().int().positive().optional(),
  assignedTo: z.string().optional(),
  // P1: referralCodeId was missing — leads created via referral link cannot be attributed
  referralCodeId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("sales-leads", "read");
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    const status = searchParams.get("status");
    if (status && status !== "all") where.status = status;

    const area = searchParams.get("area");
    if (area && area !== "all") where.area = area;

    const tier = searchParams.get("tier");
    if (tier && tier !== "all") where.tier = tier;

    const assignedTo = searchParams.get("assignedTo");
    if (assignedTo && assignedTo !== "all") where.assignedTo = assignedTo;

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortDir = searchParams.get("sortDir") ?? "desc";
    const orderBy: Record<string, string> = { [sortBy]: sortDir };

    const [leads, total] = await Promise.all([
      prisma.salesLead.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          quotes: { select: { id: true, totalAmount: true, status: true } },
          orders: { select: { id: true, orderNumber: true, status: true, totalAmount: true } },
        },
      }),
      prisma.salesLead.count({ where }),
    ]);

    return NextResponse.json({
      data: leads,
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
    const session = await requirePermission("sales-leads", "create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const lead = await prisma.salesLead.create({
      data: {
        source: parsed.data.source,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail ?? null,
        customerPhone: parsed.data.customerPhone ?? null,
        companyName: parsed.data.companyName ?? null,
        area: parsed.data.area,
        tier: parsed.data.tier,
        status: parsed.data.status,
        note: parsed.data.note ?? null,
        estimatedBudget: parsed.data.estimatedBudget ?? null,
        assignedTo: parsed.data.assignedTo ?? null,
        referralCodeId: parsed.data.referralCodeId ?? null,   // P1: was missing
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "sales-leads",
      resourceId: lead.id,
      newValues: body,
    });

    return NextResponse.json({ data: lead }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
