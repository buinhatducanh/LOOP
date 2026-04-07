import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

// POST /api/admin/figma-demos/[id]/reject
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("figmas", "update");
    const { id } = await params;
    const { reason } = await req.json().catch(() => ({ reason: "Rejected by PM" }));

    const demo = await prisma.figmaDemo.findUnique({ where: { id } });
    if (!demo) return notFound("Demo not found");

    if (demo.status !== "pending") {
      return badRequest("Demo already processed");
    }

    const updated = await prisma.figmaDemo.update({
      where: { id },
      data: {
        status: "rejected",
        rejectionNote: reason ?? "Rejected by PM",
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "reject",
      resource: "figmas",
      resourceId: id,
      newValues: { status: "rejected", rejectionNote: reason },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
