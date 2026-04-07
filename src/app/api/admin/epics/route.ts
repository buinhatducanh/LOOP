import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("backlogs", "read");
    const { searchParams } = new URL(req.url);
    // Support both orderId and projectId for backward compat
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const epics = await prisma.epic.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        backlogs: {
          include: {
            tasks: { select: { id: true, status: true, lp: true } },
          },
        },
      },
    });

    // Compute LP totals per epic
    const epicsWithStats = epics.map(epic => ({
      ...epic,
      totalLp: epic.backlogs.reduce((s, b) => s + b.tasks.reduce((t, task) => t + task.lp, 0), 0),
      allocatedLp: epic.backlogs.reduce((s, b) => s + b.tasks.reduce((t, task) => t + task.lp, 0), 0),
      status: epic.isActive ? "active" : "archived",
    }));

    return NextResponse.json({ data: epicsWithStats });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("backlogs", "create");
    const data = await req.json();

    // Support both orderId and projectId
    const projectId = data.projectId ?? data.orderId;
    if (!projectId || !data.title) {
      return NextResponse.json({ error: "projectId and title are required" }, { status: 400 });
    }

    const epic = await prisma.epic.create({
      data: {
        projectId,
        title: data.title,
        color: data.color ?? "#8B5CF6",
        isActive: true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "backlogs",
      resourceId: epic.id,
      newValues: data,
    });

    return NextResponse.json({ data: epic }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
