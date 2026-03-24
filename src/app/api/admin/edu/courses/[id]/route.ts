import { NextRequest, NextResponse } from "next/server";
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
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
