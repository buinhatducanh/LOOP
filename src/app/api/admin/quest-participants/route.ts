import { list, handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * GET  /api/admin/quest-participants?userId=&questId=&eventId=&page=&limit=
 * POST /api/admin/quest-participants  { userId, questId?, eventId? }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("quests", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;
    const userId = searchParams.get("userId");
    const questId = searchParams.get("questId");
    const eventId = searchParams.get("eventId");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (questId) where.questId = questId;
    if (eventId) where.eventId = eventId;

    const [participants, total] = await Promise.all([
      prisma.questParticipant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          quest: { select: { id: true, title: true } },
          event: { select: { id: true, title: true } },
        },
      }),
      prisma.questParticipant.count({ where }),
    ]);

    return list(participants, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("quests", "read");
    const data = await req.json();

    if (!data.userId) return ok({ error: "userId is required" }, 400);
    if (!data.questId && !data.eventId) {
      return ok({ error: "questId or eventId is required" }, 400);
    }

    const participant = await prisma.questParticipant.create({
      data: {
        userId: data.userId,
        questId: data.questId ?? null,
        eventId: data.eventId ?? null,
        progress: 0,
        completed: false,
        lpEarned: 0,
        xpEarned: 0,
      },
    });

    return ok(participant, 201);
  } catch (error) {
    // Unique constraint violation = already joined
    if ((error as { code?: string }).code === "P2002") {
      return ok({ error: "already joined" }, 409);
    }
    return handleError(error);
  }
}
