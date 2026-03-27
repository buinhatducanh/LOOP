/**
 * Blog Post Detail Page — LOOP Solutions
 * Dark Figma design, server component → Prisma → Client
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { mapLocalizedBlogPost } from "@/lib/i18n/localization";
import { BlogDetailClient } from "@/components/landing/BlogDetailClient";

type Props = { params: Promise<{ locale: string }> };
type DetailProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: "Blog công nghệ | LOOP",
    alternates: { canonical: `${baseUrl}/${locale}/blog` },
  };
}

export default async function BlogPostPage({ params }: DetailProps) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const tNav = await getTranslations("Navigation");

  const raw = await prisma.blogPost.findFirst({
    where: { slug },
    select: {
      id: true, slug: true, title: true, excerpt: true,
      content: true, coverImage: true, publishedAt: true, authorId: true,
    },
  });

  if (!raw) notFound();

  const post = mapLocalizedBlogPost(raw, resolvedLocale);

  // Resolve author
  let authorName: string | null = null;
  if (raw.authorId) {
    const author = await prisma.teamMember.findUnique({
      where: { id: raw.authorId },
      select: { name: true },
    });
    authorName = author?.name ?? null;
  }

  // Related posts
  const relatedRaw = await prisma.blogPost.findMany({
    where: { status: "published", NOT: { slug } },
    select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true },
    take: 3,
  });
  const related = relatedRaw.map((r) => mapLocalizedBlogPost(r, resolvedLocale));

  return (
    <BlogDetailClient
      locale={locale}
      post={post}
      authorName={authorName}
      related={related}
      tNav={tNav as unknown as Record<string, string>}
    />
  );
}
