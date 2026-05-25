/**
 * Academy Course Detail Page — LOOP Solutions
 * Route: /[locale]/academy/[slug]
 * Wired to real API via Prisma + getLocalizedField
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { prisma } from "@/lib/prisma";
import { CourseDetailClient } from "@/components/landing/CourseDetailClient";
import { isAcademyPageVisible } from "@/lib/config/page-visibility";

type Props = { params: Promise<{ locale: string; slug: string }> };

function deriveLevel(weeks: number): string {
  if (weeks <= 4) return "Beginner";
  if (weeks <= 8) return "Intermediate";
  if (weeks <= 12) return "Advanced";
  return "Expert";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

  const course = await prisma.course.findFirst({
    where: { id: slug, status: "published" },
  });

  if (!course) return { title: "Course Not Found | LOOP Academy" };

  const title = getLocalizedField(course, "title", resolvedLocale) ?? course.titleVi ?? course.title ?? "";
  const description = getLocalizedField(course, "description", resolvedLocale) ?? course.descriptionVi ?? "";

  return {
    title: `${title} | LOOP Academy`,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/academy/${slug}` },
    openGraph: {
      type: "website",
      title: `${title} | LOOP Academy`,
      description,
      url: `${baseUrl}/${locale}/academy/${slug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  if (!isAcademyPageVisible) {
    redirect(`/${locale}`);
  }
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  const course = await prisma.course.findFirst({
    where: { id: slug, status: "published" },
    include: {
      instructor: true,
      instructorMember: true,
      lessons: {
        where: { isPublished: true },
        select: { id: true },
      },
      enrollments: {
        where: { status: "active" },
        select: { id: true },
      },
    },
  });

  if (!course) notFound();

  // Resolve instructor info
  const instructorName =
    course.instructorMember?.name ??
    course.instructor?.name ??
    course.instructorId;
  const instructorRole =
    course.instructorMember?.role ??
    (course.instructor?.specialties?.[0] ??
    course.instructorType ??
    "");
  const instructorImage =
    course.instructorMember?.image ?? "";

  const clientCourse = {
    id: course.id,
    slug: course.id,
    title: getLocalizedField(course, "title", resolvedLocale) ?? course.titleVi ?? course.title ?? "",
    shortDescription: getLocalizedField(course, "description", resolvedLocale) ?? "",
    description: getLocalizedField(course, "description", resolvedLocale) ?? "",
    instructor: instructorName,
    instructorRole: instructorRole,
    instructorImage: instructorImage,
    duration: `${course.durationWeeks} tuần`,
    students: course.enrollments.length,
    rating: course.instructor?.rating ?? 0,
    reviews: course.instructor?.totalStudents ?? 0,
    price: course.price,
    image: "",
    lectureCount: course.lessons.length,
    hasCertificate: true,
    level: deriveLevel(course.durationWeeks),
    tags: [] as string[],
    objectives: [] as string[],
    requirements: [] as string[],
  };

  return <CourseDetailClient locale={locale} course={clientCourse} />;
}
