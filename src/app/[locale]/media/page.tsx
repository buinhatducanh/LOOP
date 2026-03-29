/**
 * Media Booking Page — LOOP Solutions
 * Route: /vi/media, /en/media, /ja/media, /ko/media, /zh/media
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: `Media Booking — LOOP Solutions`,
    description: `Book professional media production services from LOOP Solutions.`,
    alternates: { canonical: `${baseUrl}/${locale}/media` },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MediaBookingPage({ params }: Props) {
  const { locale } = await params;
  notFound(); // TODO: wire real MediaBookingPage FE component
}
