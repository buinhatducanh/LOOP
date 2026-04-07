import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// Valid task status transitions
const _VALID_TRANSITIONS: Record<string, string[]> = {
  backlog: ["in_progress"],
  in_progress: ["in_review", "backlog"],
  in_review: ["done", "in_progress"],
  done: ["in_progress"], // Allow reopening
};

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("tasks", "read");
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};

    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    if (projectId) where.backlog = { projectId };

    const backlogId = searchParams.get("backlogId");
    if (backlogId) where.backlogId = backlogId;

    const status = searchParams.get("status");
    if (status && status !== "all") where.status = status;

    const assigneeId = searchParams.get("assigneeId");
    if (assigneeId && assigneeId !== "all") where.assigneeId = assigneeId;

    const priority = searchParams.get("priority");
    if (priority && priority !== "all") where.priority = priority;

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          backlog: {
            select: {
              id: true, name: true,
              project: { select: { id: true, orderNumber: true, customerName: true } },
            },
          },
          tags: true,
          lpAwards: { select: { id: true, lpAmount: true, status: true } },
          violations: { select: { id: true, type: true, revokedLp: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({ data: tasks, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("tasks", "create");
    const data = await req.json();

    if (!data.backlogId || !data.title) {
      return NextResponse.json({ error: "backlogId and title are required" }, { status: 400 });
    }

    // Auto-calculate SLA deadline from SlaRule if backlog has order
    const backlog = await prisma.backlog.findUnique({
      where: { id: data.backlogId },
      include: { project: { include: { slaRules: true } } },
    });

    let slaDeadline: Date | null = null;
    if (backlog && data.priority) {
      const slaRule = backlog.project.slaRules.find(r => r.priority === data.priority);
      if (slaRule) {
        slaDeadline = new Date(Date.now() + slaRule.maxHours * 60 * 60 * 1000);
      }
    }

    const task = await prisma.task.create({
      data: {
        backlogId: data.backlogId,
        title: data.title,
        description: data.description ?? null,
        lp: data.lp ?? 0,
        priority: data.priority ?? "medium",
        status: data.status ?? "backlog",
        assigneeId: data.assigneeId ?? null,
        branchName: data.branchName ?? null,
        externalId: data.externalId ?? null,
        estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : null,
        slaDeadline: slaDeadline ?? null,
        tags: data.tags ? { create: data.tags.map((t: string) => ({ name: t })) } : undefined,
      },
      include: {
        backlog: {
          select: {
            id: true, name: true, title: true,
            project: { select: { id: true, orderNumber: true } },
          },
        },
        tags: true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "tasks",
      resourceId: task.id,
      newValues: data,
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
