/**
 * Media Portfolio Page — LOOP Solutions
 * Route: /[locale]/media
 *
 * 2-tab layout:
 *   - Showcase: approved media bookings with delivered assets
 *   - Stories: behind-the-scenes posts from the media team
 *
 * Also includes: media-specific testimonials, stats, and CTA.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { MediaPageClient } from "@/components/landing/media/MediaPageClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  return {
    title: t("mediaTitle"),
    description: t("mediaDescription"),
    alternates: { canonical: `${baseUrl}/${locale}/media` },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MediaPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  // ── Parallel data fetching ──────────────────────────────────────────────

  const [rawBookings, rawStories, rawTestimonials, rawPackages] = await Promise.all([
    // 1) Showcase: approved bookings with delivered assets
    prisma.mediaBooking
      .findMany({
        where: { 
          status: { in: ["approved", "delivered"] },
          // Only show items with assets
          deliveredAssets: { not: "[]" } 
        },
        select: {
          id: true,
          bookingNumber: true,
          title: true,
          customerName: true,
          bookingType: true,
          deliveredAssets: true,
          deliveredAt: true,
          isFeatured: true,
          packageId: true,
          teamMember: { select: { name: true } },
          package: { select: { title: true } },
        },
        orderBy: { deliveredAt: "desc" },
        take: 100,
      })
      .catch(() => []),

    // 2) Stories: published media stories
    prisma.mediaStory
      .findMany({
        where: { status: "published" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          author: { select: { name: true, image: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      })
      .catch(() => []),

    // 3) Testimonials: active media testimonials
    prisma.mediaTestimonial
      .findMany({
        where: { isActive: true },
        select: {
          id: true,
          customerName: true,
          customerCompany: true,
          customerAvatar: true,
          rating: true,
          text: true,
          projectType: true,
        },
        orderBy: { sortOrder: "asc" },
        take: 20,
      })
      .catch(() => []),

    // 4) Packages: active media packages
    prisma.servicePackage
      .findMany({
        where: { 
          isActive: true,
          OR: [
            { serviceKey: "media" },
            { type: "media" }
          ]
        },
        orderBy: { sortOrder: "asc" },
      })
      .catch(() => []),
  ]);

  // ── Serialize for client boundary ───────────────────────────────────────

  const projects = rawBookings
    .filter(
      (b) => Array.isArray(b.deliveredAssets) && b.deliveredAssets.length > 0
    )
    .map((b) => ({
      ...b,
      deliveredAssets: Array.isArray(b.deliveredAssets) ? b.deliveredAssets : [],
      deliveredAt: b.deliveredAt ? b.deliveredAt.toISOString() : null,
    }));

  const stories = rawStories.map((s) => ({
    ...s,
    publishedAt: s.publishedAt ? s.publishedAt.toISOString() : null,
  }));

  // ── Compute stats ─────────────────────────────────────────────────────

  const uniqueCustomers = new Set(projects.map((p) => p.customerName));
  const totalFiles = projects.reduce((sum, p) => {
    return sum + (Array.isArray(p.deliveredAssets) ? p.deliveredAssets.length : 0);
  }, 0);

  const stats = {
    totalProjects: projects.length,
    totalCustomers: uniqueCustomers.size,
    totalFiles,
  };

  return (
    <MediaPageClient
      locale={locale}
      projects={projects}
      stories={stories}
      packages={rawPackages}
      testimonials={rawTestimonials}
      stats={stats}
    />
  );
}
