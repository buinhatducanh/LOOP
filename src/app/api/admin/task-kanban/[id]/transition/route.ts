import { handleError, ok, badRequest, notFound } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { XP_PER_LP } from "@/lib/rank/xp";

// Valid kanban column transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  backlog: ["todo"],
  todo: ["backlog", "in_progress"],
  in_progress: ["backlog", "in_review"],
  in_review: ["in_progress", "done"],
  done: ["in_progress"], // allow reopen
};

// POST /api/admin/task-kanban/[id]/transition
// Moves a TaskKanban task to a new column.
// Side effects:
//   - "in_review"  → AdminNotification to qaId member
//   - "done"      → pending LpAward for assignee (if lp > 0) + AdminNotification to assignee + project PM(s)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("task-kanban", "update");
    const { id } = await params;
    const { column } = await req.json();

    if (!column) return badRequest("column is required");

    // Load task + order info (no assignee/qa include — relations not defined in schema)
    const task = await prisma.taskKanban.findUnique({
      where: { id },
      include: {
        order: {
          select: { id: true, orderNumber: true, customerName: true },
        },
      },
    });

    if (!task) return notFound("Task not found");

    const allowed = VALID_TRANSITIONS[task.column] ?? [];
    if (!allowed.includes(column)) {
      return badRequest(
        `Cannot move task from "${task.column}" to "${column}". Allowed: ${allowed.join(", ") || "none"}`,
      );
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update column (and completedAt for done/reopen)
      const updateData: Record<string, unknown> = { column };
      if (column === "done") {
        updateData.completedAt = now;
      } else if (task.completedAt && column !== "done") {
        updateData.completedAt = null; // clear on reopen
      }

      const updatedTask = await tx.taskKanban.update({
        where: { id },
        data: updateData,
      });

      // 2. Side effects per target column
      if (column === "in_review") {
        // Notify QA member when task enters review
        // qaId is a TeamMember.id — look up the associated User to create notification
        if (updatedTask.qaId) {
          const qaUser = await tx.user.findFirst({
            where: { teamMemberId: updatedTask.qaId },
            select: { id: true, name: true },
          });
          if (qaUser) {
            await tx.notification.create({
              data: {
                userId: qaUser.id,
                type: "task_review",
                title: "Task cần Review",
                message: `Task "${updatedTask.title}" (Dự án ${task.order.orderNumber}) đã chuyển sang Review và cần bạn kiểm tra.`,
                link: `/admin/projects/${updatedTask.orderId}/kanban`,
              },
            });
          }
        }
      }

      if (column === "done") {
        // Auto-create pending LP award for assignee
        if (updatedTask.lp > 0 && updatedTask.assigneeId) {
          await tx.lpAward.create({
            data: {
              taskId: null, // TaskKanban — no FK to Task model
              memberId: updatedTask.assigneeId,
              lpAmount: updatedTask.lp,
              expAmount: updatedTask.lp * XP_PER_LP,
              source: "kanban_task_done",
              status: "pending",
              projectId: updatedTask.orderId,
            },
          });
        }

        // Notify assignee
        if (updatedTask.assigneeId) {
          const msg = `Chúc mừng! Task "${updatedTask.title}" (Dự án ${task.order.orderNumber}) đã được đánh dấu hoàn thành.${updatedTask.lp > 0
            ? ` Bạn sẽ nhận được ${updatedTask.lp.toLocaleString("vi-VN")} LP sau khi được duyệt.`
            : ""
            }`;
          await tx.adminNotification.create({
            data: {
              type: "task_done",
              title: "Task hoàn thành",
              message: msg,
              link: `/admin/projects/${updatedTask.orderId}/kanban`,
              priority: "normal",
              isRead: false,
            },
          });
        }

        // Notify project PM(s)
        const pmMembers = await tx.projectMember.findMany({
          where: { projectId: updatedTask.orderId },
        });

        const pms = pmMembers.filter((pm) => pm.projectRoleKey === "pm");
        if (pms.length > 0) {
          await tx.adminNotification.createMany({
            data: pms.map((pm) => ({
              type: "task_done",
              title: "Task hoàn thành",
              message: `Task "${updatedTask.title}" trong dự án ${task.order.orderNumber} (${task.order.customerName}) đã hoàn thành.`,
              link: `/admin/projects/${updatedTask.orderId}/kanban`,
              priority: "normal",
              isRead: false,
            })),
          });
        }
      }

      return updatedTask;
    });

    await createAuditLog({
      userId: session.userId,
      action: "transition",
      resource: "task-kanban",
      resourceId: id,
      newValues: { from: task.column, to: column },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
