import { list, handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("quests", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === "true";

    const [events, total] = await Promise.all([
      prisma.companyEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          _count: { select: { participants: true } },
        },
      }),
      prisma.companyEvent.count({ where }),
    ]);

    return list(
      events.map(e => ({ ...e, participantCount: (e as { _count?: { participants: number } })._count?.participants ?? 0 })),
      { page, limit, total, totalPages: Math.ceil(total / limit) },
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("quests", "create");
    const data = await req.json();

    if (!data.title || !data.startDate || !data.endDate) {
      return ok({ error: "title, startDate, and endDate are required" }, 400);
    }

    const event = await prisma.companyEvent.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        type: data.type ?? "seasonal",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        lpBonus: parseInt(data.lpBonus ?? "0"),
        color: data.color ?? "#818CF8",
        icon: data.icon ?? "Calendar",
        bannerUrl: data.bannerUrl ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return ok(event, 201);
  } catch (error) {
    return handleError(error);
  }
}
