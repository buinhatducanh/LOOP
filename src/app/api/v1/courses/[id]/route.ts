/**
 * GET /api/v1/courses/[id]
 *
 * Returns a single published course with full curriculum for the course detail page.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { handleError, notFound } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { id },
          // Support numeric slug from FE (e.g. "1", "2")
          // Only when id looks like a number
          ...(/\d+/.test(id) ? [{ id }] : []),
        ],
        status: "published",
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            bio: true,
            specialties: true,
            rating: true,
            totalStudents: true,
            memberId: true,
          },
        },
        lessons: {
          where: { isPublished: true },
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            title: true,
            titleVi: true,
            orderIndex: true,
            durationMinutes: true,
            content: true,
          },
        },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
    });

    if (!course) return notFound("Course not found");

    // Group lessons into chapters by (orderIndex div 10)
    const chapterMap = new Map<number, {
      title: string;
      lessons: {
        id: string; title: string; durationMinutes: number;
        isFree: boolean; orderIndex: number;
      }[];
    }>();

    for (const lesson of course.lessons) {
      const chapterIndex = Math.floor(lesson.orderIndex / 10);
      if (!chapterMap.has(chapterIndex)) {
        chapterMap.set(chapterIndex, {
          title: `Chương ${chapterIndex + 1}`,
          lessons: [],
        });
      }
      // First 2 lessons per course are free for preview
      const lessonIndex = course.lessons.findIndex((l) => l.id === lesson.id);
      chapterMap.get(chapterIndex)!.lessons.push({
        id: lesson.id,
        title: locale === "vi" ? (lesson.titleVi || lesson.title) : lesson.title,
        durationMinutes: lesson.durationMinutes,
        isFree: lessonIndex < 2,
        orderIndex: lesson.orderIndex,
      });
    }

    const chapters = Array.from(chapterMap.values());

    return NextResponse.json(
      {
        version: "v1",
        data: {
          id: course.id,
          slug: course.id,
          title: getLocalizedField(course, "title", locale) ?? course.titleVi ?? course.title,
          titleVi: course.titleVi,
          shortDescription: getLocalizedField(course, "description", locale) ?? "",
          description: getLocalizedField(course, "description", locale),
          type: course.type,
          price: course.price,
          lpPrice: Math.ceil(course.price / 20_000),
          lpReward: course.lpReward,
          maxStudents: course.maxStudents,
          durationWeeks: course.durationWeeks,
          status: course.status,
          coverImage: null,
          level: deriveLevel(course.durationWeeks),
          instructor: course.instructor
            ? {
                id: course.instructor.id,
                name: course.instructor.name,
                avatar: null,
                bio: course.instructor.bio ?? null,
                specialties: course.instructor.specialties,
                rating: course.instructor.rating,
                totalStudents: course.instructor.totalStudents,
              }
            : null,
          instructorMemberId: course.instructorMemberId,
          _count: {
            lessons: course._count.lessons,
            enrollments: course._count.enrollments,
          },
          chapters,
          _localeUsed: locale,
        },
        meta: { locale },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

function deriveLevel(durationWeeks: number): string {
  if (durationWeeks <= 4) return "Beginner";
  if (durationWeeks <= 8) return "Intermediate";
  if (durationWeeks <= 12) return "Advanced";
  return "Expert";
}
