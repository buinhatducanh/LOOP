/**
 * Media Portfolio Page — LOOP Solutions
 * Route: /[locale]/media
 * Shows approved media bookings with delivered assets as a public portfolio.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { MediaClient } from "@/components/landing/MediaClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: t("mediaTitle"),
    description: t("mediaDescription"),
    alternates: { canonical: `${baseUrl}/${locale}/media` },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MediaBookingPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  // Fetch approved bookings that have delivered assets (public portfolio)
  let mediaProjects: {
    id: string;
    bookingNumber: string;
    title: string;
    customerName: string;
    bookingType: string;
    deliveredAssets: unknown;
    deliveredAt: Date | null;
    teamMember: { name: string } | null;
    package: { title: string } | null;
  }[] = [];

  try {
    const raw = await prisma.mediaBooking.findMany({
      where: { status: "approved" },
      select: {
        id: true,
        bookingNumber: true,
        title: true,
        customerName: true,
        bookingType: true,
        deliveredAssets: true,
        deliveredAt: true,
        teamMember: { select: { name: true } },
        package: { select: { title: true } },
      },
      orderBy: { deliveredAt: "desc" },
      take: 100,
    });

    // Filter to only those with actual assets
    mediaProjects = raw.filter((b) =>
      Array.isArray(b.deliveredAssets) && b.deliveredAssets.length > 0
    );
  } catch {
    mediaProjects = [];
  }

  return <MediaClient locale={locale} projects={mediaProjects} />;
}
