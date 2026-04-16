import { handleError, ok, badRequest, list, buildPagination } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/task-kanban — list tasks filtered by orderId (and column/assigneeId/qaId/priority/search)
// POST /api/admin/task-kanban — create a new TaskKanban task

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("task-kanban", "read");

    const { searchParams } = new URL(req.url);
    const where: Record<string, unknown> = {};

    const orderId = searchParams.get("orderId");
    if (orderId) where.orderId = orderId;

    const column = searchParams.get("column");
    if (column && column !== "all") where.column = column;

    const assigneeId = searchParams.get("assigneeId");
    if (assigneeId && assigneeId !== "all") where.assigneeId = assigneeId;

    const qaId = searchParams.get("qaId");
    if (qaId && qaId !== "all") where.qaId = qaId;

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
      prisma.taskKanban.findMany({
        where,
        orderBy: [
          { priority: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              status: true,
            },
          },
        },
      }),
      prisma.taskKanban.count({ where }),
    ]);

    return list(tasks, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("task-kanban", "create");
    const data = await req.json();

    if (!data.title || !data.orderId) {
      return badRequest("title and orderId are required");
    }

    // Verify order exists
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) return badRequest("order not found");

    const task = await prisma.taskKanban.create({
      data: {
        orderId: data.orderId,
        column: data.column ?? "backlog",
        title: data.title,
        description: data.description ?? null,
        priority: data.priority ?? "medium",
        lp: data.lp ? parseInt(data.lp) : 0,
        branchName: data.branchName ?? null,
        githubLink: data.githubLink ?? null,
        assigneeId: data.assigneeId ?? null,
        qaId: data.qaId ?? null,
        envFileId: data.envFileId ?? null,
 dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        order: {
          select: { id: true, orderNumber: true, customerName: true },
        },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "task-kanban",
      resourceId: task.id,
      newValues: data,
    });

    return ok(task, 201);
  } catch (err) {
    return handleError(err);
  }
}
