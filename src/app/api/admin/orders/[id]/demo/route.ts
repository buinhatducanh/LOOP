/**
 * POST /api/admin/orders/[id]/demo
 *
 * Sends a demo link for an order.
 * Accepts orderId in URL, figmaUrl in body.
 * Creates a FigmaDemo record with masked URL and sends notification to customer.
 *
 * BE already has /api/admin/figma-demos POST — this endpoint wraps it
 * with order-specific fields (clientEmail from order, maskedUrl generation).
 */

import { ok, badRequest, notFound, handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { randomBytes } from "crypto";
import { inngest } from "@/lib/jobs/client";
import { EVENTS } from "@/lib/jobs/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("orders", "update");
    const { id: orderId } = await params;
    const body = await req.json();
    const { figmaUrl, note, maskedUrl } = body;

    if (!figmaUrl || typeof figmaUrl !== "string") {
      return badRequest("figmaUrl là bắt buộc");
    }

    // Load order to get customer info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerEmail: true, customerName: true, orderNumber: true, status: true },
    });

    if (!order) {
      return notFound("Đơn hàng không tồn tại");
    }

    // Generate masked URL if not provided
    const clientToken = randomBytes(16).toString("hex");
    const displayUrl = maskedUrl
      ?? `demo.loop-solutions.vn/${order.orderNumber.toLowerCase()}`;

    // Create FigmaDemo record
    const demo = await prisma.figmaDemo.create({
      data: {
        projectId: orderId,
        title: `Demo — ${order.orderNumber}`,
        figmaUrl,
        clientEmail: order.customerEmail,
        clientToken,
        status: "pending",
        sentAt: order.customerEmail ? new Date() : null,
      },
      include: {
        project: {
          select: { id: true, orderNumber: true, customerName: true },
        },
      },
    });

    // Create AdminNotification cho designer (type: design_request) — PM/admin nhận notification để làm demo
    await prisma.adminNotification.createMany({
      data: [
        {
          type: "design_request",
          title: "Yêu cầu gửi Demo",
          message: `Đơn hàng ${order.orderNumber} — ${order.customerName} cần gửi demo.`,
          link: `/admin/orders`,
          priority: "high",
          isRead: false,
        },
      ],
    });

    // Create in-app notification for the customer
      const customerUser = await prisma.user.findUnique({
        where: { email: order.customerEmail },
        select: { id: true },
      });
      if (customerUser) {
        await prisma.notification.create({
          data: {
            userId: customerUser.id,
            type: "demo_ready",
            title: "Demo sẵn sàng!",
            message:
              note ??
              `Demo mới cho đơn hàng ${order.orderNumber} đã sẵn sàng. Anh/chị xem và phản hồi nhé!`,
            link: `/khach-hang?tab=orders&orderId=${orderId}`,
          },
        });
      }

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "orders",
      resourceId: orderId,
      newValues: { action: "send_demo", demoId: demo.id, maskedUrl: displayUrl },
    });

    // Fire demo/ready event — Inngest sends email to customer + triggers downstream workflows
    await inngest.send({
      name: EVENTS.DEMO_READY,
      data: {
        demoId: demo.id,
        orderId,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        figmaUrl,
        maskedUrl: displayUrl,
        timestamp: new Date().toISOString(),
      },
    });

    return ok(
      {
        demoId: demo.id,
        maskedUrl: displayUrl,
        clientToken,
        figmaUrl,
        sent: !!order.customerEmail,
        message: order.customerEmail
          ? "Demo đã được gửi tới khách hàng"
          : "Demo đã được tạo (không có email khách hàng)",
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/admin/orders/[id]/demo
 *
 * Returns demo links associated with this order.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("orders", "read");
    const { id: orderId } = await params;

    const demos = await prisma.figmaDemo.findMany({
      where: { projectId: orderId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        figmaUrl: true,
        clientToken: true,
        status: true,
        versionHash: true,
        createdAt: true,
        sentAt: true,
        approvedAt: true,
      },
    });

    return ok(demos);
  } catch (error) {
    return handleError(error);
  }
}
