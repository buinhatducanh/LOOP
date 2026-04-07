import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { LP_VND_RATE } from "@/lib/constants";

// GET /api/admin/edu/courses
export async function GET(req: NextRequest) {
  try {
    await requirePermission("edu", "read");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const instructorId = searchParams.get("instructorId");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (instructorId) where.instructorId = instructorId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { titleVi: { contains: search, mode: "insensitive" } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: { select: { id: true, name: true, specialties: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      data: courses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/edu/courses
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("edu", "create");
    const body = await req.json();
    const {
      title, titleVi, description, descriptionVi, type, instructorId,
      price, lpReward, maxStudents, durationWeeks, status,
      instructorMemberId, instructorUserId,
    } = body;

    if (!title?.trim() || !titleVi?.trim() || !instructorId) {
      return NextResponse.json({ error: "title, titleVi, and instructorId are required" }, { status: 400 });
    }

    // Verify instructor exists
    const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
    if (!instructor) return NextResponse.json({ error: "Instructor not found" }, { status: 404 });

    // lpReward defaults to 10% LP of price (floor of VND / 20000 * 0.10)
    const lpDefault = Math.floor(((price ?? 0) / LP_VND_RATE) * 0.10);

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        titleVi: titleVi.trim(),
        description: description ?? null,
        descriptionVi: descriptionVi ?? null,
        type: type ?? "group",
        instructorId,
        price: price ?? 0,
        lpReward: lpReward ?? lpDefault,
        maxStudents: maxStudents ?? 1,
        durationWeeks: durationWeeks ?? 4,
        status: status ?? "draft",
        instructorMemberId: instructorMemberId ?? null,
        instructorUserId: instructorUserId ?? null,
      },
      include: { instructor: { select: { id: true, name: true } } },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "edu-courses",
      resourceId: course.id,
      newValues: { title, instructorId },
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
