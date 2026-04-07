import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  backlog: ["in_progress"],
  in_progress: ["in_review", "backlog"],
  in_review: ["done", "in_progress"],
  done: ["in_progress"],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("tasks", "read");
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        backlog: {
          select: {
            id: true, name: true, title: true, epicId: true,
            project: { select: { id: true, orderNumber: true, customerName: true } },
          },
        },
        assignee: { select: { id: true, name: true } },
        tags: true,
        lpAwards: { orderBy: { createdAt: "desc" } },
        violations: { orderBy: { createdAt: "desc" } },
        bugNotes: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        commits: { orderBy: { committedAt: "desc" } },
      },
    });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: task });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("tasks", "update");
    const { id } = await params;
    const data = await req.json();
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Validate status transition
    if (data.status && data.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(data.status)) {
        return NextResponse.json(
          { error: `Invalid transition: ${existing.status} → ${data.status}. Allowed: ${allowed.join(", ") || "none"}` },
          { status: 400 },
        );
      }
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.lp !== undefined) updateData.lp = parseInt(data.lp);
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "done") updateData.completedAt = now;
    }
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.branchName !== undefined) updateData.branchName = data.branchName || null;
    if (data.externalId !== undefined) updateData.externalId = data.externalId || null;
    if (data.estimatedHours !== undefined) {
      updateData.estimatedHours = data.estimatedHours ? parseInt(data.estimatedHours) : null;
    }
    if (data.slaDeadline !== undefined) {
      updateData.slaDeadline = data.slaDeadline ? new Date(data.slaDeadline) : null;
    }
    if (data.sortOrder !== undefined) updateData.sortOrder = parseInt(data.sortOrder);
    if (data.violated !== undefined) updateData.violated = data.violated;

    const task = await prisma.task.update({ where: { id }, data: updateData });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "tasks",
      resourceId: id,
      oldValues: existing,
      newValues: data,
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _session = await requirePermission("tasks", "delete");
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    await createAuditLog({ userId: session.userId, action: "delete", resource: "tasks", resourceId: id });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
