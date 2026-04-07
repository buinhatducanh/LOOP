import { NextRequest, NextResponse } from "next/server";
import { handleError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("messages", "update");
    const { id } = await params;
    const { status } = await req.json();

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "messages",
      resourceId: id,
      newValues: { status },
    });

    return NextResponse.json({ data: message });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("messages", "delete");
    const { id } = await params;

    await prisma.contactMessage.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "messages",
      resourceId: id,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
