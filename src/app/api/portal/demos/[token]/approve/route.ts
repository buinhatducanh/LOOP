/**
 * POST /api/portal/demos/[token]/approve
 *
 * When a client approves their Figma demo from the customer portal:
 *  1. Find FigmaDemo by clientToken
 *  2. Mark it approved_by_client with approver + timestamp
 *  3. Create or update HandoverPackage for the project:
 *     - figmaUrl = demo.figmaUrl
 *     - status = "draft"
 *     - scope = features/requirements from order
 *  4. Send AdminNotification (type: design_approved) to PM/admin
 *
 * Auth required — both customer and staff accounts may call this.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api";
import { ok, notFound } from "@/lib/api/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { token } = await params;

    // ── 1. Find demo by client token ─────────────────────────────────────
    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
      include: {
        project: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            status: true,
            totalAmount: true,
            lpUsed: true,
          },
        },
      },
    });

    if (!demo) {
      return notFound("Demo không tồn tại hoặc link đã hết hạn");
    }

    // ── 2. Mark demo as approved by client ────────────────────────────────
    const approvedDemo = await prisma.figmaDemo.update({
      where: { id: demo.id },
      data: {
        status: "approved_by_client",
        approvedBy: session.userId,
        approvedAt: new Date(),
      },
    });

    // ── 3. Build scope from order ────────────────────────────────────────
    // Pull features from the order to populate handover scope
    const order = demo.project;
    const scope = {
      features: [] as string[],
      pointCount: order.lpUsed ?? 0,
      customRequests: [] as string[],
    };

    // ── 4. Create or update HandoverPackage ───────────────────────────────
    const existingHandover = await prisma.handoverPackage.findFirst({
      where: { projectId: demo.projectId },
      orderBy: { createdAt: "desc" },
    });

    const handover = existingHandover
      ? await prisma.handoverPackage.update({
          where: { id: existingHandover.id },
          data: {
            figmaUrl: demo.figmaUrl,
            status: "draft",
            scope,
          },
        })
      : await prisma.handoverPackage.create({
          data: {
            projectId: demo.projectId,
            figmaUrl: demo.figmaUrl,
            status: "draft",
            scope,
            deliveredBy: session.userId,
          },
        });

    // ── 5. Notify PM/admin via AdminNotification ─────────────────────────
    await prisma.adminNotification.create({
      data: {
        type: "design_approved",
        title: "Design được khách hàng duyệt",
        message: `${order.customerName} đã duyệt design — Đơn ${order.orderNumber}`,
        link: `/admin/orders`,
        priority: "normal",
        isRead: false,
      },
    });

    return ok(
      {
        demo: approvedDemo,
        handover: {
          id: handover.id,
          figmaUrl: handover.figmaUrl,
          status: handover.status,
          scope: handover.scope,
        },
      },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}
