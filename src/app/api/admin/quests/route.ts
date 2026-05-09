import { list, handleError, ok, buildPagination } from "@/lib/api/response";
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
    const frequency = searchParams.get("frequency");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (frequency) where.frequency = frequency;
    if (isActive !== null) where.isActive = isActive === "true";

    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { participants: true } },
        },
      }),
      prisma.quest.count({ where }),
    ]);

    return list(
      quests.map((q: typeof quests[number]) => ({ ...q, participantCount: (q as { _count?: { participants: number } })._count?.participants ?? 0 })),
      buildPagination(page, limit, total),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("quests", "create");
    const data = await req.json();

    if (!data.title || !data.frequency) {
      return ok({ error: "title and frequency are required" }, 400);
    }

    const quest = await prisma.quest.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        lpReward: parseInt(data.lpReward ?? "0"),
        xpReward: parseInt(data.xpReward ?? "0"),
        frequency: data.frequency,
        category: data.category ?? "engagement",
        icon: data.icon ?? "Target",
        color: data.color ?? "#818CF8",
        target: parseInt(data.target ?? "1"),
        forRoles: data.forRoles ?? ["staff", "manager", "admin"],
        isActive: data.isActive ?? true,
        sortOrder: parseInt(data.sortOrder ?? "0"),
      },
    });

    return ok(quest, 201);
  } catch (error) {
    return handleError(error);
  }
}
