import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// POST /api/admin/tasks/[id]/revoke
// Kỷ luật kép: PM thu hồi LP + reassign task
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("tasks", "update");
    const { id } = await params;
    const { type, description, revokedLp, assigneeId, note } = await req.json();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1. Log violation
    await prisma.taskViolation.create({
      data: {
        taskId: id,
        type: type ?? "scope_creep",
        note: description ?? note ?? "Task revoked by PM",
        revokedLp: revokedLp ?? 0,
      },
    });

    // 2. Mark task as violated, reset to backlog
    const updated = await prisma.task.update({
      where: { id },
      data: {
        violated: true,
        status: "backlog",
        assigneeId: assigneeId ?? null,
      },
    });

    // 4. Reject any pending LP awards for this task
    await prisma.lpAward.updateMany({
      where: { taskId: id, status: "pending" },
      data: { status: "rejected", rejectedReason: `Task revoked by PM. LP withdrawn.` },
    });

    await createAuditLog({
      userId: session.userId,
      action: "revoke",
      resource: "tasks",
      resourceId: id,
      newValues: { type, description, revokedLp, assigneeId },
    });

    return NextResponse.json({
      data: updated,
      message: `Task revoked. ${revokedLp ?? 0} LP withdrawn. Task moved to backlog.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
