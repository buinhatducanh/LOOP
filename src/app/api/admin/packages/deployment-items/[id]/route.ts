import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("packages", "update");
    const { id } = await params;
    const data = await req.json();

    const old = await prisma.pricingDeploymentItem.findUnique({ where: { id } });
    const item = await prisma.pricingDeploymentItem.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        titleVi: data.titleVi,
        description: data.description,
        descriptionVi: data.descriptionVi,
        handedToClient: data.handedToClient,
        icon: data.icon,
        note: data.note,
        noteVi: data.noteVi,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "pricing_deployment_items",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("packages", "delete");
    const { id } = await params;

    const old = await prisma.pricingDeploymentItem.findUnique({ where: { id } });
    await prisma.pricingDeploymentItem.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "pricing_deployment_items",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
