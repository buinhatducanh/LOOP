import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("backlogs", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const epicId = searchParams.get("epicId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (epicId) where.epicId = epicId;

    const backlogs = await prisma.backlog.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        epic: { select: { id: true, title: true, color: true } },
        tasks: {
          include: {
            tags: true,
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assigneeId: true,
            lp: true,
            violated: true,
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json({ data: backlogs });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("backlogs", "create");
    const data = await req.json();

    if (!data.orderId || !data.name) {
      return NextResponse.json({ error: "orderId and name are required" }, { status: 400 });
    }

    const backlog = await prisma.backlog.create({
      data: {
        projectId: data.orderId ?? data.projectId,
        epicId: data.epicId ?? null,
        name: data.name ?? data.title ?? "",
        title: data.title ?? data.name ?? "",
        description: data.description ?? null,
        totalLp: data.totalLp ?? 0,
        sortOrder: data.sortOrder ?? 0,
        isDefault: data.isDefault ?? false,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "backlogs",
      resourceId: backlog.id,
      newValues: data,
    });

    return NextResponse.json({ data: backlog }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
