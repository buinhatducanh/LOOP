/**
 * GET /api/academy/progress/[courseId]
 *
 * Returns the student's progress for a specific course enrollment.
 * Used by CoursePlayer on mount to load saved progress.
 *
 * Auth: requires userId or memberId
 *
 * Response:
 * {
 *   data: {
 *     enrollment: Enrollment
 *     completedLessons: string[]   // array of completed lesson IDs
 *     progressPercent: number       // 0-100
 *     courseComplete: boolean
 *     lpEarned: number               // LP earned (awarded on completion)
 *     nextLesson: { id, title } | null
 *     lastActivity: Date | null
 *   }
 * }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, badRequest, notFound } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { courseId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? session.userId;
    const memberId = searchParams.get("memberId") ?? session.teamMemberId;

    if (!userId && !memberId) {
      return badRequest("userId or memberId is required");
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        ...(userId ? { userId } : {}),
        ...(memberId ? { memberId } : {}),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleVi: true,
            lpReward: true,
            _count: { select: { lessons: true } },
          },
        },
        progresses: {
          where: { completedAt: { not: null } },
          select: {
            lessonId: true,
            completedAt: true,
            quizScore: true,
          },
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!enrollment) return notFound("Enrollment not found");

    const completedLessonIds = enrollment.progresses.map((p: typeof enrollment.progresses[number]) => p.lessonId);
    const totalLessons = enrollment.course._count.lessons;
    const progressPercent = totalLessons > 0
      ? Math.round((completedLessonIds.length / totalLessons) * 100)
      : 0;

    // Find next lesson (first incomplete lesson)
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        courseId,
        isPublished: true,
        id: { notIn: completedLessonIds },
      },
      select: { id: true, title: true, titleVi: true, orderIndex: true },
      orderBy: { orderIndex: "asc" },
    });

    const lastActivity = enrollment.progresses[0]?.completedAt ?? null;

    // LP earned = lpReward if course is completed, else 0
    const lpEarned = enrollment.status === "completed"
      ? enrollment.course.lpReward
      : 0;

    return NextResponse.json({
      data: {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.titleVi || enrollment.course.title,
        status: enrollment.status,
        progressPercent,
        completedLessons: completedLessonIds,
        courseComplete: enrollment.status === "completed",
        lpEarned,
        nextLesson: nextLesson
          ? { id: nextLesson.id, title: nextLesson.titleVi || nextLesson.title }
          : null,
        lastActivity,
        enrolledAt: enrollment.enrolledAt,
        totalLessons,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
