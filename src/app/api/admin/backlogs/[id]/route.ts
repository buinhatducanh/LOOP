import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _session = await requirePermission("backlogs", "read");
    const { id } = await params;
    const backlog = await prisma.backlog.findUnique({
      where: { id },
      include: {
        epic: { select: { id: true, title: true, color: true } },
        tasks: {
          include: { tags: true },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { tasks: true } },
      },
    });
    if (!backlog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: backlog });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _session = await requirePermission("backlogs", "update");
    const { id } = await params;
    const data = await req.json();
    const existing = await prisma.backlog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const backlog = await prisma.backlog.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        epicId: data.epicId !== undefined ? (data.epicId || null) : undefined,
        totalLp: data.totalLp !== undefined ? parseInt(data.totalLp) : undefined,
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder) : undefined,
        isDefault: data.isDefault !== undefined ? Boolean(data.isDefault) : undefined,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "backlogs",
      resourceId: id,
      oldValues: existing,
      newValues: data,
    });

    return NextResponse.json({ data: backlog });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _session = await requirePermission("backlogs", "delete");
    const { id } = await params;
    await prisma.backlog.delete({ where: { id } });
    await createAuditLog({ userId: session.userId, action: "delete", resource: "backlogs", resourceId: id });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
