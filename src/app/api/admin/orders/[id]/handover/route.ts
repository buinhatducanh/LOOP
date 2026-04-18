import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET — get handover package for an Order
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("handover", "read");
    const { id: projectId } = await params;

    const handover = await prisma.handoverPackage.findFirst({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            status: true,
          },
        },
      },
    });

    if (!handover) {
      // Return null instead of 404 — "not created yet" is not an error
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ data: handover });
  } catch (error) {
    return handleError(error);
  }
}

// POST — create or update handover package for an Order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("handover", "create");
    const { id: projectId } = await params;
    const body = await req.json();

    const {
      figmaUrl,
      githubUrl,
      deploymentUrl,
      scope,
      notes,
      adminNotes,
      customerNotes,
      items,
      status,
    } = body;

    const existing = await prisma.handoverPackage.findFirst({ where: { projectId } });

    let handover;
    if (existing) {
      // Update existing handover package
      const updateData: Record<string, unknown> = {};
      if (figmaUrl !== undefined) updateData.figmaUrl = figmaUrl;
      if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
      if (deploymentUrl !== undefined) updateData.deploymentUrl = deploymentUrl;
      if (scope !== undefined) updateData.scope = scope;
      if (notes !== undefined) updateData.notes = notes;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (customerNotes !== undefined) updateData.customerNotes = customerNotes;
      if (items !== undefined) updateData.items = items;
      if (status !== undefined) updateData.status = status;

      handover = await prisma.handoverPackage.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              status: true,
            },
          },
        },
      });

      await createAuditLog({
        userId: session.userId,
        action: "update",
        resource: "handover",
        resourceId: existing.id,
        oldValues: existing as unknown as Record<string, unknown>,
        newValues: updateData,
      });
    } else {
      // Create new handover package
      handover = await prisma.handoverPackage.create({
        data: {
          projectId,
          status: status ?? "draft",
          figmaUrl: figmaUrl ?? null,
          githubUrl: githubUrl ?? null,
          deploymentUrl: deploymentUrl ?? null,
          scope: scope ?? null,
          notes: notes ?? null,
          adminNotes: adminNotes ?? null,
          customerNotes: customerNotes ?? null,
          items: items ?? [],
          deliveredBy: session.userId,
        },
        include: {
          project: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              status: true,
            },
          },
        },
      });

      await createAuditLog({
        userId: session.userId,
        action: "create",
        resource: "handover",
        resourceId: handover.id,
        newValues: { projectId, status: handover.status },
      });
    }

    return ok(handover, existing ? 200 : 201);
  } catch (error) {
    return handleError(error);
  }
}
