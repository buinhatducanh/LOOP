/**
 * GET /api/portal/enrollments — Customer's academy enrollments
 * Requires customer auth (JWT cookie).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { list, handleError } from "@/lib/api";
import { buildPagination } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10", 10));

    const user = await prisma.user.findUnique({ where: { email: session.email } });
    if (!user) {
      return list([], buildPagination(page, limit, 0));
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        orderBy: { enrolledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              price: true,
              lpReward: true,
              instructor: { select: { name: true } },
            },
          },
        },
      }),
      prisma.enrollment.count({ where: { userId: user.id } }),
    ]);

    const data = enrollments.map((e) => {
      const completed = Array.isArray(e.completedLessons)
        ? e.completedLessons
        : [];
      return {
        id: e.id,
        enrolledAt: e.enrolledAt,
        completedCount: completed.length,
        progress: e.progressPercent,
        lpAwarded: e.course.lpReward,
        course: e.course,
      };
    });

    return list(data, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}
