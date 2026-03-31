/**
 * GET /api/v1/courses
 *
 * Returns all published courses for the public Academy page.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { handleError } from "@/lib/api/response";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              specialties: true,
              rating: true,
              totalStudents: true,
              memberId: true,
            },
          },
          _count: {
            select: { lessons: true, enrollments: true },
          },
        },
      }),
      prisma.course.count({ where: { status: "published" } }),
    ]);

    // Derive coverImage from the first lesson's video thumbnail if available
    const localized = await Promise.all(
      courses.map(async (c) => {
        const firstLesson = await prisma.lesson.findFirst({
          where: { courseId: c.id, isPublished: true },
          select: { id: true },
          orderBy: { orderIndex: "asc" },
        });

        return {
          id: c.id,
          slug: c.id, // Course uses id as slug for public URLs
          title: getLocalizedField(c, "title", locale) ?? c.titleVi ?? c.title,
          titleVi: c.titleVi,
          titleEn: c.titleEn,
          titleJa: c.titleJa,
          titleKo: c.titleKo,
          titleZh: c.titleZh,
          shortDescription: getLocalizedField(c, "description", locale) ?? "",
          description: getLocalizedField(c, "description", locale),
          type: c.type,
          price: c.price,
          lpPrice: Math.ceil(c.price / 20_000), // rough LP estimate: 1 LP ≈ 20,000 VND
          lpReward: c.lpReward,
          maxStudents: c.maxStudents,
          durationWeeks: c.durationWeeks,
          status: c.status,
          coverImage: null, // TODO: add coverImage field to Course model; for now null triggers default fallback in FE
          level: deriveLevel(c.durationWeeks),
          instructor: c.instructor
            ? {
                id: c.instructor.id,
                name: c.instructor.name,
                avatar: null, // Instructor model has no avatar field; FE uses dicebear fallback
              }
            : null,
          instructorMemberId: c.instructorMemberId,
          _count: {
            lessons: c._count.lessons,
            enrollments: c._count.enrollments,
          },
          _localeUsed: locale,
        };
      })
    );

    return NextResponse.json(
      {
        version: "v1",
        data: localized,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
