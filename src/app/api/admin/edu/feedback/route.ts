import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("edu", "read");
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    // If filtering by course, first resolve enrollment IDs
    let enrollmentIds: string[] | undefined;
    if (courseId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { id: true },
      });
      enrollmentIds = enrollments.map((e) => e.id);
      if (enrollmentIds.length === 0) {
        return NextResponse.json({ data: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
    }

    const where = enrollmentIds ? { enrollmentId: { in: enrollmentIds } } : {};
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          enrollment: {
            include: {
              course: { select: { id: true, title: true } },
              user: { select: { name: true, email: true } },
              member: { select: { name: true } },
            },
          },
          lesson: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      data: feedbacks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("edu", "update");
    const body = await req.json();
    const { enrollmentId, lessonId, rating, comment } = body;

    if (!enrollmentId || rating === undefined) {
      return NextResponse.json({ error: "enrollmentId and rating are required" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        enrollmentId,
        lessonId: lessonId ?? null,
        rating,
        comment: comment ?? null,
      },
      include: {
        enrollment: {
          select: {
            course: { select: { title: true } },
          },
        },
        lesson: { select: { title: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "edu-feedback",
      resourceId: feedback.id,
      newValues: { enrollmentId, lessonId, rating },
    });

    return NextResponse.json({ data: feedback }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
