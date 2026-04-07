import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("edu", "read");
    const { id } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true, memberId: true, userId: true } },
            lessons: { orderBy: { orderIndex: "asc" }, select: { id: true, title: true, titleVi: true, orderIndex: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        member: { select: { id: true, name: true, role: true } },
        attendances: { include: { lesson: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } },
        progresses: { include: { lesson: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } },
        feedbacks: { include: { lesson: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: enrollment });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("edu", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.progressPercent !== undefined && { progressPercent: body.progressPercent }),
        ...(body.completedLessons !== undefined && { completedLessons: body.completedLessons }),
        ...(body.assigneeLpPercent !== undefined && { assigneeLpPercent: body.assigneeLpPercent }),
      },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        member: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "edu-enrollments",
      resourceId: id,
      oldValues: existing,
      newValues: body,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("edu", "delete");
    const { id } = await params;
    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.enrollment.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "edu-enrollments",
      resourceId: id,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
