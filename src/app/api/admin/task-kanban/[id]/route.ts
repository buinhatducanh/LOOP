import { handleError, ok, notFound } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/task-kanban/[id] — single task with order info
// PATCH /api/admin/task-kanban/[id] — update task fields
// DELETE /api/admin/task-kanban/[id] — remove task

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("task-kanban", "read");
    const { id } = await params;

    const task = await prisma.taskKanban.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            status: true,
            isActiveProject: true,
          },
        },
      },
    });

    if (!task) return notFound("Task not found");
    return ok(task);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("task-kanban", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.taskKanban.findUnique({ where: { id } });
    if (!existing) return notFound("Task not found");

    const updateData: Record<string, unknown> = {};

    // NOTE: column transitions MUST go through /task-kanban/:id/transition
    // Direct PATCH with column is blocked to enforce FSM transition rules.
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.lp !== undefined) {
      const parsed = parseInt(data.lp, 10);
      updateData.lp = isNaN(parsed) ? 0 : parsed;
    }
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.qaId !== undefined) updateData.qaId = data.qaId || null;
    if (data.branchName !== undefined) updateData.branchName = data.branchName || null;
    if (data.githubLink !== undefined) updateData.githubLink = data.githubLink || null;
    if (data.envFileId !== undefined) updateData.envFileId = data.envFileId || null;
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }

    // Sequential writes (PrismaNeon HTTP adapter does NOT support $transaction)
    const updated = await prisma.taskKanban.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: { id: true, orderNumber: true, customerName: true },
        },
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "update",
        resource: "task-kanban",
        resourceId: id,
        oldValues: existing,
        newValues: data,
      },
    }).catch(() => { /* non-critical */ });
    const task = updated;

    return ok(task);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("task-kanban", "delete");
    const { id } = await params;

    const existing = await prisma.taskKanban.findUnique({ where: { id } });
    if (!existing) return notFound("Task not found");

    await prisma.taskKanban.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "task-kanban",
      resourceId: id,
      oldValues: existing,
    });

    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
