import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { addInstructorAvatar } from "@/lib/api/mappings";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("edu", "read");
    const { id } = await params;
    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true, role: true, image: true } },
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { courses: true } },
        courses: {
          where: { status: "published" },
          select: { id: true, title: true, _count: { select: { enrollments: true } } },
        },
      },
    });
    if (!instructor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      data: addInstructorAvatar(instructor as unknown as Record<string, unknown>),
    });
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
    const { name, bio, email, phone, specialties, isActive, memberId, userId } = body;

    const existing = await prisma.instructor.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (memberId && userId) {
      return NextResponse.json({ error: "Cannot link to both TeamMember and User" }, { status: 400 });
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(bio !== undefined && { bio }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(specialties !== undefined && { specialties: Array.isArray(specialties) ? specialties : [] }),
        ...(isActive !== undefined && { isActive }),
        ...(memberId !== undefined && { memberId: memberId || null }),
        ...(userId !== undefined && { userId: userId || null }),
      },
      include: { member: { select: { id: true, name: true, image: true } } },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "edu-instructors",
      resourceId: id,
      oldValues: existing,
      newValues: body,
    });

    return NextResponse.json({
      data: addInstructorAvatar(instructor as unknown as Record<string, unknown>),
    });
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
    const existing = await prisma.instructor.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.instructor.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "edu-instructors",
      resourceId: id,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
