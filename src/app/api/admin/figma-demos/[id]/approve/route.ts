import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

// POST /api/admin/figma-demos/[id]/approve
// PM approves → activate project, create default backlogs
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("figmas", "update");
    const { id } = await params;

    const demo = await prisma.figmaDemo.findUnique({ where: { id } });
    if (!demo) return notFound("Demo not found");

    if (demo.status !== "pending") {
      return badRequest("Demo already processed");
    }

    const now = new Date();

    // Resolve approver TeamMember.id from session.userId
    const approverMember = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMember: { select: { id: true } } },
    });

    // Activate project + create default backlogs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Activate the project
      await tx.order.update({
        where: { id: demo.projectId },
        data: {
          projectStatus: "active",
          isActiveProject: true,
          startedAt: now,
        },
      });

      // 2. Create default backlogs (if none exist for this project)
      const existingBacklogs = await tx.backlog.findMany({
        where: { projectId: demo.projectId },
        select: { id: true },
      });

      if (existingBacklogs.length === 0) {
        const defaultBacklogs = [
          { name: "Backlog",      title: "Backlog",      sortOrder: 0 },
          { name: "In Progress", title: "In Progress",  sortOrder: 1 },
          { name: "Review",      title: "Review",       sortOrder: 2 },
          { name: "Done",        title: "Done",          sortOrder: 3 },
        ];
        await tx.backlog.createMany({
          data: defaultBacklogs.map((b) => ({
            projectId: demo.projectId,
            ...b,
          })),
        });
      }

      // 3. Mark demo as approved
      return tx.figmaDemo.update({
        where: { id },
        data: {
          status: "approved",
          approvedBy: approverMember?.teamMember?.id ?? null,
          approvedAt: now,
        },
        include: {
          project: { select: { id: true, orderNumber: true, customerName: true } },
        },
      });
    });

    await createAuditLog({
      userId: session.userId,
      action: "approve",
      resource: "figmas",
      resourceId: id,
      newValues: { status: "approved", projectId: demo.projectId },
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
