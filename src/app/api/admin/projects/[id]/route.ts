import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("projects", "read");
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { service: { select: { title: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("projects", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const project = await prisma.project.update({ where: { id }, data });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "projects",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    return NextResponse.json({ data: project });
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
    const session = await requirePermission("projects", "delete");
    const { id } = await params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "projects",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
