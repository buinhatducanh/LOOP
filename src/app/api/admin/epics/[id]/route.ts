import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("backlogs", "read");
    const { id } = await params;
    const epic = await prisma.epic.findUnique({
      where: { id },
      include: {
        backlogs: {
          include: {
            tasks: { include: { tags: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!epic) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: epic });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("backlogs", "update");
    const { id } = await params;
    const data = await req.json();
    const existing = await prisma.epic.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const epic = await prisma.epic.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        color: data.color ?? undefined,
        isActive: data.isActive ?? undefined,
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

    return NextResponse.json({ data: epic });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("backlogs", "delete");
    const { id } = await params;
    await prisma.epic.delete({ where: { id } });
    await createAuditLog({ userId: session.userId, action: "delete", resource: "backlogs", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
