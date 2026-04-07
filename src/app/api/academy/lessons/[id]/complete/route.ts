/**
 * POST /api/academy/lessons/[id]/complete
 *
 * Marks a lesson as completed by a student.
 * Implements Video Gate logic: student must have watched >= 35% of the lesson
 * before the "next lesson" button is unlocked.
 *
 * Auth: requires userId or memberId
 *
 * Request body:
 * {
 *   userId?: string
 *   memberId?: string
 *   watchedSeconds: number      // seconds watched (for Video Gate check)
 *   lessonDurationSeconds: number // total lesson duration for % calc
 * }
 *
 * Video Gate: 35% threshold — if watchedSeconds/lessonDurationSeconds < 0.35
 * the lesson is NOT marked complete and returns gate_not_passed.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, badRequest, notFound } from "@/lib/api/response";
import { syncRankFields } from "@/lib/rank/xp";

const VIDEO_GATE_THRESHOLD = 0.35; // 35%

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const body = await req.json();
    const { userId, memberId, watchedSeconds = 0, lessonDurationSeconds = 0 } = body;

    if (!userId && !memberId) {
      return badRequest("userId or memberId is required");
    }

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { select: { id: true, title: true } } },
    });
    if (!lesson) return notFound("Lesson not found");

    // Find enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: lesson.courseId,
        status: { in: ["active", "completed"] },
        ...(userId ? { userId } : {}),
        ...(memberId ? { memberId } : {}),
      },
      include: {
        course: { select: { id: true, title: true, lpReward: true, status: true } },
      },
    });
    if (!enrollment) {
      return notFound("Not enrolled in this course");
    }

    // Check Video Gate: watched percentage must be >= 35%
    const watchedRatio = lessonDurationSeconds > 0
      ? watchedSeconds / lessonDurationSeconds
      : 1.0; // If duration unknown, pass gate (e.g. quiz/project)

    if (watchedRatio < VIDEO_GATE_THRESHOLD) {
      return NextResponse.json(
        {
          error: "Video gate not passed",
          code: "GATE_NOT_PASSED",
          data: {
            gatePassed: false,
            watchedPercent: Math.round(watchedRatio * 100),
            requiredPercent: VIDEO_GATE_THRESHOLD * 100,
            message: `Bạn cần xem ít nhất ${Math.round(VIDEO_GATE_THRESHOLD * 100)}% bài giảng trước khi đánh dấu hoàn thành`,
          },
        },
        { status: 422 }
      );
    }

    // Use upsert to handle re-completion idempotently
    const progress = await prisma.studentProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        completedAt: new Date(),
      },
      update: {
        completedAt: new Date(),
      },
      include: {
        lesson: { select: { id: true, title: true, orderIndex: true } },
      },
    });

    // Recalculate enrollment progress percentage
    const totalLessons = await prisma.lesson.count({
      where: { courseId: lesson.courseId, isPublished: true },
    });
    const completedCount = await prisma.studentProgress.count({
      where: { enrollmentId: enrollment.id },
    });
    const progressPercent = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

    // Update enrollment progress
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent,
        completedLessons: JSON.stringify(
          await prisma.studentProgress.findMany({
            where: { enrollmentId: enrollment.id },
            select: { lessonId: true, completedAt: true },
          }).then((p) => p.map((x) => ({ lessonId: x.lessonId, completedAt: x.completedAt })))
        ),
      },
    });

    // Check if course is now complete (100%)
    const isCourseComplete = progressPercent >= 100;

    // If completed, update enrollment status and award LP reward
    if (isCourseComplete) {
      await prisma.$transaction([
        prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "completed" },
        }),
        // Award LP reward to the student
        ...(enrollment.course.lpReward > 0
          ? [
              memberId
                ? prisma.teamMember.update({
                    data: { availableLp: { increment: enrollment.course.lpReward } },
                    where: { id: memberId },
                  })
                : prisma.customerPoint.updateMany({
                    data: {
                      balance: { increment: enrollment.course.lpReward },
                      totalEarned: { increment: enrollment.course.lpReward },
                    },
                    where: { userId: userId! },
                  }),
            ]
          : []),
      ]);

      // P2-7: After LP award, sync rank fields so level/XP are recalculated
      if (memberId && enrollment.course.lpReward > 0) {
        await syncRankFields(memberId);
      }
    }

    // Get next lesson
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        courseId: lesson.courseId,
        orderIndex: { gt: lesson.orderIndex },
        isPublished: true,
      },
      select: { id: true, title: true, orderIndex: true },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({
      data: {
        lessonId,
        lessonTitle: lesson.title,
        completedAt: progress.completedAt,
        progressPercent,
        courseComplete: isCourseComplete,
        lpRewardAwarded: isCourseComplete ? enrollment.course.lpReward : 0,
        nextLesson: nextLesson
          ? { id: nextLesson.id, title: nextLesson.title }
          : null,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
