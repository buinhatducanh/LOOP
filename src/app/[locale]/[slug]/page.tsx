import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAllSections } from "@/lib/landing/resolver";
import { LandingPageRenderer } from "@/components/landing/LandingPageRenderer";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;

  const page = await prisma.landingPage.findFirst({
    where: { slug, isPublished: true, locale },
    select: { name: true, seoTitle: true, seoDesc: true, seoKeywords: true },
  });

  if (!page) return { title: "Not Found" };

  return {
    title: page.seoTitle || page.name,
    description: page.seoDesc || undefined,
    keywords: page.seoKeywords?.split(",").map((k) => k.trim()).filter(Boolean) || undefined,
    alternates: { canonical: `https://loop.vn/${locale}/${slug}` },
    openGraph: {
      title: page.seoTitle || page.name,
      description: page.seoDesc || undefined,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug, locale } = await params;

  const page = await prisma.landingPage.findFirst({
    where: { slug, isPublished: true, locale },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page) notFound();

  // Resolve service/project/testimonial IDs → full objects (server-side for SEO)
  const resolvedSections = await resolveAllSections(page.sections);

  return <LandingPageRenderer page={{ ...page, sections: resolvedSections }} locale={locale} />;
}
