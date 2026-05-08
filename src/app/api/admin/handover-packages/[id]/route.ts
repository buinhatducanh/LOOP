import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { sendHandoverDelivered } from "@/lib/email/sender";
import type { Prisma } from "@/generated/prisma";

const updateSchema = z.object({
  status: z.enum(["draft", "pending_review", "approved", "handed_over"]).optional(),
  handoverDate: z.string().transform(s => new Date(s)).optional().nullable(),
  figmaUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  deploymentUrl: z.string().optional().nullable(),
  scope: z.string().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
  items: z.array(z.object({
    key: z.string(),
    label: z.string(),
    checked: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("handover", "read");
    const { id } = await params;
    const data = await prisma.handoverPackage.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true, customerEmail: true } },
      },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("handover", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const isHandedOver = parsed.data.status === "handed_over";

    // scope: Prisma Json field — null → omit to avoid type error
    const { scope, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (scope !== undefined) updateData.scope = scope;

    // Transaction: update handover + auto-complete Order
    if (isHandedOver) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.handoverPackage.update({
          where: { id },
          data: { ...updateData, handoverDate: updateData.handoverDate ?? new Date() },
        });
        // Find projectId from existing record first
        const existing = await tx.handoverPackage.findUnique({ where: { id }, select: { projectId: true } });
        if (existing?.projectId) {
          await tx.order.updateMany({ where: { id: existing.projectId }, data: { status: "done" } });
        }
      });
    } else {
      await prisma.handoverPackage.update({ where: { id }, data: updateData });
    }

    // Re-fetch with project relation for email
    const updated = await prisma.handoverPackage.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true, customerEmail: true } },
      },
    });

    // Send email to customer when handed over (fire-and-forget)
    if (isHandedOver && updated?.project?.customerEmail) {
      const items = (Array.isArray(updated.items) ? updated.items : []) as { checked: boolean }[];
      const checkedCount = items.filter(i => i.checked).length;
      sendHandoverDelivered({
        customerName: updated.project.customerName ?? "",
        customerEmail: updated.project.customerEmail,
        orderNumber: updated.project.orderNumber ?? updated.projectId,
        handoverDate: updated.handoverDate ?? new Date(),
        projectName: updated.project.orderNumber ?? updated.projectId,
        figmaUrl: updated.figmaUrl,
        githubUrl: updated.githubUrl,
        deploymentUrl: updated.deploymentUrl,
        completedItems: checkedCount,
        totalItems: items.length,
      }).catch((err: unknown) => console.error("[Email] Handover delivered:", err));
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("handover", "delete");
    const { id } = await params;
    await prisma.handoverPackage.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
