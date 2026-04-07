import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  backlog: ["in_progress"],
  in_progress: ["in_review", "backlog"],
  in_review: ["done", "in_progress"],
  done: ["in_progress"],
};

// POST /api/admin/tasks/[id]/transition
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("tasks", "update");
    const { id } = await params;
    const { status, completionNote, qualityScore } = await req.json();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (status) {
      const allowed = VALID_TRANSITIONS[task.status] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from "${task.status}" to "${status}". Allowed: ${allowed.join(", ")}` },
          { status: 400 },
        );
      }
    }

    const now = new Date();

    // Atomic: task update and LP award creation must be in the same transaction
    // to prevent "task marked done but no LP awarded" inconsistency.
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (status) {
        updateData.status = status;
        if (status === "done") {
          updateData.completedAt = now;
          // Auto-create LP award request when task transitions to done
          if (task.lp > 0 && task.assigneeId) {
            const backlog = await tx.backlog.findUnique({
              where: { id: task.backlogId },
              select: { projectId: true },
            });
            if (backlog) {
              await tx.lpAward.create({
                data: {
                  taskId: task.id,
                  projectId: backlog.projectId,
                  memberId: task.assigneeId,
                  lpAmount: task.lp,
                  expAmount: task.lp,
                  source: "task_done",
                  status: "pending",
                },
              });
            }
          }
        }
      }

      return tx.task.update({ where: { id }, data: updateData });
    });

    await createAuditLog({
      userId: session.userId,
      action: "transition",
      resource: "tasks",
      resourceId: id,
      newValues: { from: task.status, to: status, completionNote, qualityScore },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
