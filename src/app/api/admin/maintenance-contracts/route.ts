import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const createSchema = z.object({
  projectId: z.string().min(1, "projectId bắt buộc"),
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  price: z.number().int().min(0),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
  autoRenew: z.boolean().optional().default(false),
  status: z.enum(["active", "expiring_soon", "expired", "cancelled"]).optional().default("active"),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};

    const projectId = searchParams.get("projectId");
    if (projectId) where.projectId = projectId;

    const status = searchParams.get("status");
    if (status && status !== "all") where.status = status;

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      prisma.maintenanceContract.findMany({
        where,
        orderBy: { endDate: "asc" },
        skip,
        take: limit,
        include: {
          project: { select: { id: true, orderNumber: true, customerName: true, companyName: true } },
        },
      }),
      prisma.maintenanceContract.count({ where }),
    ]);

    return NextResponse.json({
      data: contracts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    await requirePermission("projects", "create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const contract = await prisma.maintenanceContract.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        price: parsed.data.price,
        billingCycle: parsed.data.billingCycle,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        autoRenew: parsed.data.autoRenew,
        status: parsed.data.status,
        note: parsed.data.note ?? null,
        renewalReminderSent: false,
      },
    });

    return NextResponse.json({ data: contract }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
