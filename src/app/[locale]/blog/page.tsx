import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedBlogPost } from "@/lib/i18n/localization";
import type { Metadata } from "next";
import { BlogClient } from "@/components/landing/BlogClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = t("blogTitle");
  const description = t("blogDescription");
  const brandMetaTitle = t("brandMetaTitle");
  const brandMetaDescription = t("brandMetaDescription");
  const _ogImage = t("ogImage");
  const canonical = `${baseUrl}/${locale}/blog`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      url: canonical,
      images: [{ url: `/api/og?type=blog&locale=${locale}`, width: 1200, height: 630, alt: "LOOP Solutions" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      images: [`/api/og?type=blog&locale=${locale}`],
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let posts: Record<string, unknown>[] = [];
  try {
    const raw = await prisma.blogPost.findMany({
      where: { status: "published" },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        titleJa: true,
        titleKo: true,
        titleZh: true,
        excerpt: true,
        excerptEn: true,
        excerptJa: true,
        excerptKo: true,
        excerptZh: true,
        coverImage: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    posts = raw.map((p) => mapLocalizedBlogPost(p, resolvedLocale));
  } catch {
    posts = [];
  }

  return <BlogClient locale={locale} posts={posts} />;
}
