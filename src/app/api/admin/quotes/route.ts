import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const createSchema = z.object({
  salesLeadId: z.string().optional(),
  quoteNumber: z.string().min(1, "quoteNumber bắt buộc"),
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  totalAmount: z.number().int().min(0),
  lpAllocation: z.record(z.string(), z.number()).default({}),
  lpUsed: z.number().int().min(0).default(0),
  quoteRequestId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  companyName: z.string().optional(),
  configuration: z.string().optional(),
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
          quoteRequest: {
            select: { id: true, customerName: true, customerEmail: true, companyName: true, totalAmount: true, status: true },
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

    const configData = parsed.data.configuration ? JSON.parse(parsed.data.configuration) : null;
    // Resolve salesLeadId
    let salesLeadId = parsed.data.salesLeadId;
    let selectedFeatureIds: string[] = [];
    let qr: any = null;

    if (parsed.data.quoteRequestId) {
      qr = await prisma.quoteRequest.findUnique({
        where: { id: parsed.data.quoteRequestId },
      });
      if (qr) {
        const existingLead = qr.customerEmail
          ? await prisma.salesLead.findFirst({ where: { customerEmail: qr.customerEmail } })
          : null;
        if (existingLead) {
          salesLeadId = existingLead.id;
        } else {
          const newLead = await prisma.salesLead.create({
            data: {
              customerName: qr.customerName,
              customerEmail: qr.customerEmail ?? undefined,
              customerPhone: qr.customerPhone ?? undefined,
              companyName: qr.companyName ?? undefined,
              source: "website",
              status: "new",
            },
          });
          salesLeadId = newLead.id;
        }
        if (qr.selectedItems && Array.isArray(qr.selectedItems)) {
          selectedFeatureIds = (qr.selectedItems as Array<{ featureId?: string }>)
            .filter(item => item?.featureId)
            .map(item => item.featureId as string);
        }
      }
    } else if (!salesLeadId && parsed.data.customerName) {
      // Auto-create SalesLead if manual info provided
      const newLead = await prisma.salesLead.create({
        data: {
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail ?? undefined,
          customerPhone: parsed.data.customerPhone ?? undefined,
          companyName: parsed.data.companyName ?? undefined,
          source: "direct",
          status: "new",
        },
      });
      salesLeadId = newLead.id;
    }

    if (!salesLeadId) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp salesLeadId hoặc thông tin khách hàng mới" },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.create({
      data: {
        salesLeadId,
        quoteNumber: parsed.data.quoteNumber,
        title: parsed.data.title,
        totalAmount: parsed.data.totalAmount,
        lpAllocation: lp,
        lpUsed: parsed.data.lpUsed,
        milestones: parsed.data.milestones ?? undefined,
        validUntil: parsed.data.validUntil,
        note: parsed.data.note ?? null,
        quoteRequestId: parsed.data.quoteRequestId ?? undefined,
        selectedFeatureIds,
        // Save detailed configuration into pricingBreakdown
        pricingBreakdown: configData || (qr as any)?.pricingBreakdown || (qr ? {
          package: { name: (qr.selectedItems as any)?.[0]?.featureName || "Website Tùy chỉnh" },
          hosting: qr.hostingPlanSlug ? { name: qr.hostingPlanSlug, slug: qr.hostingPlanSlug } : null,
          domains: qr.domainName ? [{ name: qr.domainName }] : [],
          total: qr.totalAmount,
        } : null),
        source: (qr as any)?.source ?? "fixed",
      },
      include: {
        salesLead: { select: { id: true, customerName: true, customerEmail: true } },
      },
    });

    // Update QuoteRequest status
    if (parsed.data.quoteRequestId) {
      await prisma.quoteRequest.update({
        where: { id: parsed.data.quoteRequestId },
        data: { status: "quoted" },
      });
    }

    // Audit log: log only explicitly accepted fields — never raw request body
    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "quotes",
      resourceId: quote.id,
      newValues: {
        quoteNumber: parsed.data.quoteNumber,
        title: parsed.data.title,
        totalAmount: parsed.data.totalAmount,
        salesLeadId,
        quoteRequestId: parsed.data.quoteRequestId ?? null,
        selectedFeatureIds,
      },
    });

    return NextResponse.json({ data: quote }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
