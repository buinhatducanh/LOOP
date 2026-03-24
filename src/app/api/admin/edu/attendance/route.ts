import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/edu/attendance?lessonId=&enrollmentId=&limit=
export async function GET(req: NextRequest) {
  try {
    await requirePermission("edu", "read");
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");
    const enrollmentId = searchParams.get("enrollmentId");
    const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "200", 10));

    const where: Record<string, unknown> = {};
    if (lessonId) where.lessonId = lessonId;
    if (enrollmentId) where.enrollmentId = enrollmentId;

    const records = await prisma.attendance.findMany({
      where,
      include: {
        enrollment: {
          select: {
            id: true,
            paidAmount: true,
            user: {
              select: { id: true, name: true, email: true },
            },
            member: {
              select: { id: true, name: true },
            },
          },
        },
        lesson: {
          select: { id: true, title: true, titleVi: true, durationMinutes: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/admin/edu/attendance
// Body: { enrollmentId, lessonId, status, note? }
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("edu", "update");
    const body = await req.json();
    const { enrollmentId, lessonId, status, note } = body;

    if (!enrollmentId || !lessonId) {
      return NextResponse.json(
        { error: "enrollmentId and lessonId are required" },
        { status: 400 }
      );
    }
    if (!["present", "absent", "late"].includes(status)) {
      return NextResponse.json(
        { error: "status must be: present | absent | late" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        status,
        note: note ?? null,
        checkedInAt: new Date(),
      },
      update: {
        status,
        note: note ?? undefined,
        checkedInAt: new Date(),
      },
      include: {
        enrollment: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
            member: { select: { name: true } },
          },
        },
        lesson: { select: { title: true, titleVi: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: status === "present" ? "check_in" : "update_attendance",
      resource: "edu-attendance",
      resourceId: attendance.id,
      newValues: { enrollmentId, lessonId, status },
    });

    return NextResponse.json({ data: attendance }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
