import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import type { Prisma } from "@/generated/prisma";
type InputJsonValue = Prisma.InputJsonValue;

// POST /api/admin/tasks/[id]/revoke
// Kỷ luật kép: PM thu hồi LP + reassign task
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("tasks", "update");
    const { id } = await params;
    const { type, description, revokedLp, assigneeId, note } = await req.json();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // P1-2 FIX: wrap all writes + audit log in a transaction.
    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Log violation
      await tx.taskViolation.create({
        data: {
          taskId: id,
          type: type ?? "scope_creep",
          note: description ?? note ?? "Task revoked by PM",
          revokedLp: revokedLp ?? 0,
        },
      });

      // 2. Mark task as violated, reset to backlog
      const t = await tx.task.update({
        where: { id },
        data: {
          violated: true,
          status: "backlog",
          assigneeId: assigneeId ?? null,
        },
      });

      // 3. Reject any pending LP awards for this task
      await tx.lpAward.updateMany({
        where: { taskId: id, status: "pending" },
        data: { status: "rejected", rejectedReason: `Task revoked by PM. LP withdrawn.` },
      });

      // 4. Audit log — inside tx so there's no gap between write and audit
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "revoke",
          resource: "tasks",
          resourceId: id,
          oldValues: task as unknown as InputJsonValue,
          newValues: { type, description, revokedLp, assigneeId } as unknown as InputJsonValue,
        },
      });

      return t;
    });

    return NextResponse.json({
      data: updated,
      message: `Task revoked. ${revokedLp ?? 0} LP withdrawn. Task moved to backlog.`,
    });
  } catch (error) {
    return handleError(error);
  }
}
