/**
 * GET /api/academy/certificate/[courseId]
 *
 * Checks certificate eligibility for a student in a course.
 * Returns certificate data if course is 100% completed.
 *
 * Auth: requires userId or memberId
 *
 * Response (eligible):
 * {
 *   data: {
 *     eligible: true,
 *     certificate: {
 *       enrollmentId: string
 *       courseId: string
 *       courseTitle: string
 *       studentName: string
 *       completedAt: string (ISO date)
 *       issuedAt: string (ISO date)
 *       lpEarned: number
 *       certificateId: string  // deterministic ID for QR verification
 *     }
 *   }
 * }
 *
 * Response (not eligible):
 * {
 *   data: {
 *     eligible: false,
 *     progressPercent: number
 *     remainingLessons: number
 *     message: string
 *   }
 * }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, badRequest, notFound } from "@/lib/api/response";
import { createHash } from "crypto";
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
        status: "completed",
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
            instructor: { select: { name: true } },
          },
        },
        user: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
        progresses: {
          where: { completedAt: { not: null } },
          select: { lessonId: true, completedAt: true },
        },
      }
    });

    if (!enrollment) return notFound("Enrollment not found");

    // Check if actually completed (some enrollments might be manually marked completed)
    const totalLessons = await prisma.lesson.count({
      where: { courseId, isPublished: true },
    });
    const completedCount = enrollment.progresses.length;
    const isComplete = completedCount >= totalLessons && totalLessons > 0;

    if (!isComplete) {
      return NextResponse.json({
        data: {
          eligible: false,
          progressPercent: totalLessons > 0
            ? Math.round((completedCount / totalLessons) * 100)
            : 0,
          remainingLessons: Math.max(0, totalLessons - completedCount),
          message: "Bạn cần hoàn thành 100% khóa học để nhận chứng chỉ",
        },
      });
    }

    // Generate deterministic certificate ID for QR verification
    const certificateId = createHash("sha256")
      .update(`${enrollment.id}-${enrollment.courseId}-${enrollment.userId ?? enrollment.memberId}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    // Use most recent progress as completion date
    const completedAt = enrollment.progresses
      .map((p: typeof enrollment.progresses[number]) => p.completedAt)
      .filter(Boolean)
      .sort((a, b) => (b && a ? (b > a ? 1 : -1) : 0))[0] ?? enrollment.enrolledAt;

    const studentName = enrollment.user?.name ?? enrollment.member?.name ?? "Học viên";

    return NextResponse.json({
      data: {
        eligible: true,
        certificate: {
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          courseTitle: enrollment.course.titleVi || enrollment.course.title,
          instructorName: enrollment.course.instructor?.name ?? "LOOP Academy",
          studentName,
          completedAt: (completedAt ?? enrollment.enrolledAt).toISOString(),
          issuedAt: new Date().toISOString(),
          lpEarned: enrollment.course.lpReward,
          certificateId,
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
