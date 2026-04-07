/**
 * GET /api/portal/demos — Customer's own demo reviews
 * Requires customer auth (JWT cookie).
 * Returns FigmaDemo records linked to the customer's orders.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const _session = await requireAuth();

    // Get all order IDs for this customer
    const orders = await prisma.order.findMany({
      where: { customerEmail: session.email },
      select: { id: true, orderNumber: true, package: { select: { title: true } } },
    });

    const orderIds = orders.map(o => o.id);
    const orderMap = Object.fromEntries(orders.map(o => [o.id, o]));

    const demos = await prisma.figmaDemo.findMany({
      where: { projectId: { in: orderIds } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        figmaUrl: true,
        clientToken: true,
        status: true,
        versionHash: true,
        rejectionNote: true,
        approvedAt: true,
        sentAt: true,
        createdAt: true,
        projectId: true,
      },
    });

    // Attach order info to each demo
    const demosWithOrder = demos.map(d => ({
      ...d,
      reviewUrl: `/figma-review/${d.clientToken}`,
      order: orderMap[d.projectId] ?? null,
    }));

    return ok(demosWithOrder);
  } catch (err) {
    return handleError(err);
  }
}
