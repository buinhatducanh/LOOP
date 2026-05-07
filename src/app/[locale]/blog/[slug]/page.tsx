/**
 * Blog Post Detail Page — LOOP Solutions
 * Dark Figma design, server component → Prisma → Client
 *
 * SEO: localized meta title/description, canonical URL, OG image, video embed,
 * JSON-LD Article schema, Twitter card.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { mapLocalizedBlogPost } from "@/lib/i18n/localization";
import { BlogDetailClient } from "@/components/landing/BlogDetailClient";

type DetailProps = { params: Promise<{ locale: string; slug: string }> };

type SeoMeta = {
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  seoTitleEn?: string | null;
  seoTitleJa?: string | null;
  seoTitleKo?: string | null;
  seoTitleZh?: string | null;
  seoDescEn?: string | null;
  seoDescJa?: string | null;
  seoDescKo?: string | null;
  seoDescZh?: string | null;
  videoUrl?: string | null;
  canonicalUrl?: string | null;
  publishedAt?: Date | null;
  titleEn?: string | null;
  titleJa?: string | null;
  titleKo?: string | null;
  titleZh?: string | null;
};

export async function generateMetadata({ params }: DetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const loc = locale as "vi" | "en" | "ja" | "ko" | "zh";

  const metaPost = await prisma.blogPost.findFirst({
    where: { slug },
    select: {
      title: true, excerpt: true, coverImage: true,
      seoTitle: true, seoDesc: true,
      seoTitleEn: true, seoTitleJa: true, seoTitleKo: true, seoTitleZh: true,
      seoDescEn: true, seoDescJa: true, seoDescKo: true, seoDescZh: true,
      publishedAt: true,
      titleEn: true, titleJa: true, titleKo: true, titleZh: true,
    },
  });

  if (!metaPost) {
    return {
      title: "Blog | LOOP Solutions",
      description: "Server-first + AI-driven + Edge-ready digital insights.",
      alternates: { canonical: `${baseUrl}/${locale}/blog/${slug}` },
      robots: { index: false, follow: true },
    };
  }

  const mp = metaPost as unknown as SeoMeta;

  // Localized title/excerpt (falls back to VI)
  const localizedTitle = (getLocalizedField(mp, "title", loc) as string) ?? mp.title;
  const localizedExcerpt = (getLocalizedField(mp, "excerpt", loc) as string) ?? (mp.excerpt ?? "");

  // Per-locale SEO overrides, else fall back to localized content
  const seoTitleField = loc === "vi" ? "seoTitle" : `seoTitle${loc.charAt(0).toUpperCase() + loc.slice(1)}`;
  const seoDescField = loc === "vi" ? "seoDesc" : `seoDesc${loc.charAt(0).toUpperCase() + loc.slice(1)}`;
  const seoTitle = ((mp as Record<string, unknown>)[seoTitleField] as string | null) ?? localizedTitle;
  const seoDesc = ((mp as Record<string, unknown>)[seoDescField] as string | null) ?? localizedExcerpt;

  const canonical = mp.canonicalUrl ?? `${baseUrl}/${locale}/blog/${slug}`;
  const ogImage = mp.coverImage
    ? `/api/og?type=blog-post&slug=${encodeURIComponent(slug)}&locale=${locale}`
    : "/og-cover.svg";
  const videoUrl = mp.videoUrl;
  const pageTitle = `${seoTitle} | LOOP Solutions`;

  // Build hreflang alternates for all 5 locales
  const hreflangLocales = ["vi", "en", "ja", "ko", "zh"] as const;
  const languages: Record<string, string> = {};
  for (const l of hreflangLocales) {
    languages[l] = `${baseUrl}/${l}/blog/${slug}`;
  }

  return {
    title: pageTitle,
    description: seoDesc,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "article",
      title: pageTitle,
      description: seoDesc,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: localizedTitle }],
      ...(videoUrl ? { video: { url: videoUrl } } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: seoDesc,
      images: [ogImage],
    },
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
      videoUrl: true, backlinks: true, canonicalUrl: true,
      seoTitle: true, seoDesc: true,

      // all i18n
      titleEn: true, titleJa: true, titleKo: true, titleZh: true,
      excerptEn: true, excerptJa: true, excerptKo: true, excerptZh: true,
      contentEn: true, contentJa: true, contentKo: true, contentZh: true,
      seoTitleEn: true, seoTitleJa: true, seoTitleKo: true, seoTitleZh: true,
      seoDescEn: true, seoDescJa: true, seoDescKo: true, seoDescZh: true,
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
  const related = relatedRaw.map((r: typeof relatedRaw[number]) => mapLocalizedBlogPost(r, resolvedLocale));

  // JSON-LD Article schema — locale-aware URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: raw.title,
    description: raw.excerpt ?? undefined,
    image: raw.coverImage ?? undefined,
    author: { "@type": "Person", name: authorName ?? "LOOP Solutions" },
    datePublished: raw.publishedAt ? raw.publishedAt.toISOString() : undefined,
    dateModified: raw.publishedAt ? raw.publishedAt.toISOString() : undefined,
    publisher: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LOOP",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/${locale}/blog/${slug}`,
    },
  };

  return (
    <>
      {/* JSON-LD Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogDetailClient
        locale={locale}
        post={post as Record<string, unknown>}
        authorName={authorName}
        related={related as Record<string, unknown>[]}
        tNav={{
          home: tNav("home"),
          blog: tNav("blog"),
        }}
        videoUrl={post.videoUrl as string}
        backlinks={post.backlinks as string}
      />
    </>
  );
}