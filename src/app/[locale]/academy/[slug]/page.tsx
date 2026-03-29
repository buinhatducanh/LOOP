import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { CourseDetailClient } from "@/components/landing/CourseDetailClient";

type Props = { params: Promise<{ locale: string; slug: string }> };

const MOCK_COURSE_DETAIL = {
  id: "1",
  slug: "react-nextjs-zero-hero",
  title: "React & Next.js từ Zero Đến Hero",
  shortDescription: "Học React từ cơ bản đến chuyên sâu với Next.js 14 App Router, TypeScript, Tailwind CSS",
  description: "Khóa học toàn diện giúp bạn làm chủ React, Next.js App Router, Server Components, API routes và triển khai production-ready app.\n\nTừ kiến thức nền tảng đến best practices thực chiến tại doanh nghiệp.",
  instructor: "Akira Sato",
  instructorRole: "Diamond · Lead Fullstack",
  instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7268e1d?w=80&h=80&fit=crop&crop=face",
  duration: "32h",
  students: 2400,
  rating: 4.9,
  reviews: 312,
  price: 2000000,
  image: "https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=900&q=80",
  lectureCount: 48,
  hasCertificate: true,
  level: "Intermediate",
  category: "Frontend",
  tags: ["React", "Next.js", "TypeScript", "Tailwind"],
  objectives: [
    "Làm chủ React hooks, state management, performance optimization",
    "Xây dựng ứng dụng Next.js 14 App Router chuẩn production",
    "Implement authentication, API routes, database integration",
    "Deploy và tối ưu Core Web Vitals",
  ],
  requirements: [
    "Biết HTML/CSS/JavaScript cơ bản",
    "Có kiến thức ES6 và async/await",
    "Máy tính cài Node.js 18+",
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  const pageTitle = `${MOCK_COURSE_DETAIL.title} | LOOP Academy`;
  const pageDescription = MOCK_COURSE_DETAIL.shortDescription;
  const canonical = `${baseUrl}/${locale}/academy/${slug}`;
  const ogImage = MOCK_COURSE_DETAIL.image;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: pageTitle,
      description: pageDescription,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: MOCK_COURSE_DETAIL.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  // TODO next step: wire real API /api/admin/edu/courses + slug mapping
  const course = slug === MOCK_COURSE_DETAIL.slug ? MOCK_COURSE_DETAIL : null;
  if (!course) notFound();

  return <CourseDetailClient locale={locale} course={course} />;
}
