import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("edu", "read");
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const where: Record<string, unknown> = {};
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          course: { select: { id: true, title: true, titleVi: true, price: true, lpReward: true } },
          user: { select: { id: true, name: true, email: true } },
          member: { select: { id: true, name: true, role: true } },
          _count: { select: { attendances: true, progresses: true, feedbacks: true, payments: true } },
        },
        orderBy: { enrolledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return NextResponse.json({
      data: enrollments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("edu", "create");
    const body = await req.json();
    const { courseId, userId, memberId, assigneeLpPercent, status } = body;

    if (!courseId || (!userId && !memberId)) {
      return NextResponse.json({ error: "courseId and one of userId/memberId are required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        userId: userId ?? null,
        memberId: memberId ?? null,
        assigneeLpPercent: assigneeLpPercent ?? 100,
        status: status ?? "active",
      },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        member: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "edu-enrollments",
      resourceId: enrollment.id,
      newValues: { courseId, userId, memberId },
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
