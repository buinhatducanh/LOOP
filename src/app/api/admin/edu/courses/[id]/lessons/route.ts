import { NextRequest } from "next/server";
import { handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/edu/courses/[id]/lessons
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("edu", "read");
    const { id } = await params;
    const lessons = await prisma.lesson.findMany({
      where: { courseId: id },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ data: lessons });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/edu/courses/[id]/lessons
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("edu", "create");
    const { id: courseId } = await params;
    const body = await req.json();
    const { title, titleVi, orderIndex, content, durationMinutes, isPublished } = body;

    if (!title?.trim() || !titleVi?.trim()) {
      return NextResponse.json(
        { error: "title and titleVi are required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title: title.trim(),
        titleVi: titleVi.trim(),
        orderIndex: orderIndex ?? 0,
        content: content ?? null,
        durationMinutes: durationMinutes ?? 60,
        isPublished: isPublished ?? false,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "edu-lessons",
      resourceId: lesson.id,
      newValues: { courseId, title: lesson.title },
    });

    return NextResponse.json({ data: lesson }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
