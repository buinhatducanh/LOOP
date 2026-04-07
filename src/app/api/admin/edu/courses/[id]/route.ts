import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const LP_VND_RATE = 20_000;

// GET /api/admin/edu/courses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("edu", "read");
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, specialties: true } },
        instructorMember: { select: { id: true, name: true, role: true } },
        _count: { select: { lessons: true, enrollments: true } },
        lessons: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            title: true,
            titleVi: true,
            orderIndex: true,
            durationMinutes: true,
            isPublished: true,
          },
        },
      },
    });

    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: course });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/edu/courses/[id] — update course
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("edu", "update");
    const { id } = await params;
    const body = await req.json();
    const {
      title, titleVi, description, descriptionVi, type,
      instructorId, price, lpReward, maxStudents, durationWeeks, status,
      instructorMemberId, instructorUserId,
    } = body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (instructorId) {
      const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
      if (!instructor) return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(titleVi !== undefined ? { titleVi: titleVi.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(descriptionVi !== undefined ? { descriptionVi } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(instructorId !== undefined ? { instructorId } : {}),
        ...(price !== undefined ? { price } : {}),
        lpReward: lpReward ?? Math.floor((price ?? existing.price) / LP_VND_RATE * 0.10),
        ...(maxStudents !== undefined ? { maxStudents } : {}),
        ...(durationWeeks !== undefined ? { durationWeeks } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(instructorMemberId !== undefined ? { instructorMemberId } : {}),
        ...(instructorUserId !== undefined ? { instructorUserId } : {}),
      },
      include: {
        instructor: { select: { id: true, name: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "edu-courses",
      resourceId: id,
      newValues: { title, titleVi, status, price },
    });

    return NextResponse.json({ data: course });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/edu/courses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("edu", "delete");
    const { id } = await params;

    const existing = await prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true, lessons: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing._count.enrollments > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with active enrollments" },
        { status: 409 }
      );
    }

    await prisma.course.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "edu-courses",
      resourceId: id,
    });

    return NextResponse.json({ data: { deleted: true, id } });
  } catch (error) {
    return handleError(error);
  }
}
