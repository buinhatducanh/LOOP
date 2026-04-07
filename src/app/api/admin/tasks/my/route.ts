import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("tasks", "read");
    const { searchParams } = new URL(req.url);

    // Get the team member ID for the current user via User.teamMemberId
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMemberId: true },
    });
    const teamMemberId = user?.teamMemberId;

    if (!teamMemberId) {
      return NextResponse.json({ error: "No team member found for user" }, { status: 404 });
    }

    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      assigneeId: teamMemberId,
      isActive: true,
    };

    if (status && status !== "all") where.status = status;
    if (projectId) where.backlog = { projectId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { updatedAt: "desc" },
      ],
      include: {
        backlog: {
          select: {
            id: true, name: true, title: true,
            project: { select: { id: true, orderNumber: true, customerName: true } },
          },
        },
        tags: true,
        lpAwards: { select: { id: true, lpAmount: true, status: true } },
      },
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    return handleError(error);
  }
}
